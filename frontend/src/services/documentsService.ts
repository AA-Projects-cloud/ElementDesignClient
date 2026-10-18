import { ProjectDocument } from '../types';
import { localDb } from './mockDb';
import { auditService } from './auditService';
import JSZip from 'jszip';
import { fileStorageService } from './fileStorageService';
import { isSupabaseConfigured } from './supabaseClient';
import { sbDocuments } from './supabaseData';
import { saveAs } from 'file-saver';

export const documentsService = {
  async getDocuments(projectId?: string): Promise<ProjectDocument[]> {
    if (isSupabaseConfigured) return sbDocuments.getDocuments(projectId);
    const db = localDb.get();
    let docs = [...db.documents];
    if (projectId) {
      docs = docs.filter((d) => d.projectId === projectId);
    }
    return docs;
  },

  async createDocument(data: {
    projectId: string;
    name: string;
    category: ProjectDocument['category'];
    badge?: string;
    file: File;
  }): Promise<ProjectDocument> {
    const stored = await fileStorageService.upload('documents', data.projectId, data.file);
    if (isSupabaseConfigured) {
      const created = await sbDocuments.createDocument({
        projectId: data.projectId,
        name: data.name,
        category: data.category,
        badge: data.badge,
        path: stored.path,
        sizeBytes: stored.sizeBytes,
        mediaType: stored.mediaType,
        fileName: stored.fileName,
      });
      await auditService.logAction('UPLOAD_DOCUMENT', 'documents', created.id, { name: data.name, category: data.category });
      return created;
    }
    const db = localDb.get();
    const newDoc: ProjectDocument = {
      id: `doc-${Date.now()}`,
      projectId: data.projectId,
      name: data.name,
      category: data.category,
      badge: data.badge || 'VERIFIED SPECIFICATION',
      path: stored.path,
      sizeBytes: stored.sizeBytes,
      mediaType: stored.mediaType,
      fileName: stored.fileName,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    db.documents.unshift(newDoc);
    localDb.save();

    await auditService.logAction('UPLOAD_DOCUMENT', 'documents', newDoc.id, {
      name: data.name,
      category: data.category
    });

    return newDoc;
  },

  async downloadDocument(doc: ProjectDocument): Promise<void> {
    await fileStorageService.download(doc.path, doc.fileName || doc.name);
    await auditService.logAction('DOWNLOAD_DOCUMENT', 'documents', doc.id, { name: doc.name });
  },

  async downloadDocumentsZip(projectId: string, projectTitle: string): Promise<void> {
    const docs = await this.getDocuments(projectId);
    const zip = new JSZip();

    let count = 0;
    for (const doc of docs) {
      const file = await fileStorageService.getBlob(doc.path);
      if (!file) continue;
      zip.file(doc.fileName || doc.name, file);
      count++;
    }
    if (count === 0) throw new Error('There are no uploaded documents to download yet.');

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${projectTitle.replace(/\s+/g, '_')}_Specifications_Archive.zip`);

    await auditService.logAction('DOWNLOAD_DOCUMENTS_ZIP', 'documents', projectId, {
      count: docs.length
    });
  }
};
