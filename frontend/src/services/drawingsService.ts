import { DrawingSheet, Revision, ProcessingJob } from '../types';
import { localDb } from './mockDb';
import { auditService } from './auditService';
import { notificationsService } from './notificationsService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { fileStorageService } from './fileStorageService';
import { isSupabaseConfigured } from './supabaseClient';
import { sbDrawings } from './supabaseData';
import type { LightboxMedia } from '../store/useUiStore';

/** The current revision of a sheet, plus the previous one (for redline comparison). */
export const getSheetMedia = (sheet: DrawingSheet): LightboxMedia | undefined => {
  const revs = sheet.revisions || [];
  const current = revs.find((r) => r.status === 'current') || revs[0];
  if (!current?.filePath) return undefined;
  const prev = revs.find((r) => r.id !== current.id && r.filePath);
  return {
    path: current.filePath,
    mediaType: current.mediaType || 'image',
    fileName: current.fileName,
    prevPath: prev?.filePath,
    prevMediaType: prev?.mediaType,
    prevRevNo: prev?.revNo,
  };
};

export const drawingsService = {
  async getSheets(projectId?: string): Promise<DrawingSheet[]> {
    if (isSupabaseConfigured) return sbDrawings.getSheets(projectId);
    const db = localDb.get();
    let sheets = [...db.drawingSheets];
    if (projectId) {
      sheets = sheets.filter((s) => s.projectId === projectId);
    }
    return sheets.map((s) => ({
      ...s,
      revisions: db.revisions.filter((r) => r.sheetId === s.id)
    }));
  },

  async createSheet(data: {
    projectId: string;
    code: string;
    title: string;
    category: DrawingSheet['category'];
    description: string;
    location?: string;
  }): Promise<DrawingSheet> {
    if (isSupabaseConfigured) {
      const created = await sbDrawings.createSheet(data);
      await auditService.logAction('CREATE_DRAWING_SHEET', 'drawing_sheets', created.id, { code: data.code, title: data.title });
      return created;
    }
    const db = localDb.get();
    const newSheet: DrawingSheet = {
      id: `s-${Date.now()}`,
      projectId: data.projectId,
      code: data.code,
      title: data.title,
      category: data.category,
      categoryLabel: data.category.toUpperCase().replace('-', ' '),
      description: data.description,
      location: data.location,
      currentRev: 'REV 01',
      scale: '1:50 @ A1',
      updatedDate: new Date().toLocaleDateString()
    };

    db.drawingSheets.push(newSheet);
    localDb.save();

    await auditService.logAction('CREATE_DRAWING_SHEET', 'drawing_sheets', newSheet.id, {
      code: data.code,
      title: data.title
    });

    return newSheet;
  },

  async uploadRevision(data: {
    sheetId: string;
    revNo: string;
    note: string;
    file: File;
  }): Promise<{ revision: Revision; job: ProcessingJob }> {
    if (isSupabaseConfigured) {
      const res = await sbDrawings.uploadRevision(data);
      await auditService.logAction('UPLOAD_REVISION', 'revisions', res.revision.id, { sheetCode: res.sheet.code, revNo: data.revNo, note: data.note });
      await notificationsService.createNotification({
        title: `Drawing Sheet ${res.sheet.code} Updated`,
        body: `${res.sheet.title} published with ${data.revNo}.`,
        link: '/drawings-and-blueprints'
      });
      return { revision: res.revision, job: res.job };
    }
    const db = localDb.get();
    const sheet = db.drawingSheets.find((s) => s.id === data.sheetId);
    if (!sheet) throw new Error('Sheet not found');

    // Store the real file first; nothing changes if the upload fails.
    const stored = await fileStorageService.upload('drawings', sheet.projectId, data.file);

    // Mark previous current revisions as superseded
    db.revisions
      .filter((r) => r.sheetId === data.sheetId && r.status === 'current')
      .forEach((r) => {
        r.status = 'superseded';
      });

    const revId = `r-${Date.now()}`;
    const newRevision: Revision = {
      id: revId,
      sheetId: data.sheetId,
      revNo: data.revNo,
      status: 'current',
      note: data.note,
      filePath: stored.path,
      previewPath: stored.path,
      sizeBytes: stored.sizeBytes,
      mediaType: stored.mediaType,
      mimeType: stored.mimeType,
      fileName: stored.fileName,
      scale: '1:50 @ A1',
      createdAt: new Date().toISOString()
    };

    sheet.currentRev = data.revNo;
    sheet.updatedDate = new Date().toLocaleDateString();

    db.revisions.unshift(newRevision);

    // Create background processing job
    const jobId = `job-${Date.now()}`;
    const newJob: ProcessingJob = {
      id: jobId,
      revisionId: revId,
      status: 'published',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString()
    };
    db.processingJobs.unshift(newJob);

    localDb.save();

    await auditService.logAction('UPLOAD_REVISION', 'revisions', revId, {
      sheetCode: sheet.code,
      revNo: data.revNo,
      note: data.note
    });

    await notificationsService.createNotification({
      title: `Drawing Sheet ${sheet.code} Updated`,
      body: `${sheet.title} published with ${data.revNo} to Safe-Build release.`,
      link: '/drawings-and-blueprints'
    });

    return { revision: newRevision, job: newJob };
  },

  async getProcessingJobs(): Promise<ProcessingJob[]> {
    if (isSupabaseConfigured) return sbDrawings.getProcessingJobs();
    return [...localDb.get().processingJobs];
  },

  async retryJob(jobId: string): Promise<ProcessingJob> {
    if (isSupabaseConfigured) return sbDrawings.retryJob(jobId);
    const db = localDb.get();
    const job = db.processingJobs.find((j) => j.id === jobId);
    if (!job) throw new Error('Job not found');

    job.status = 'published';
    job.error = undefined;
    job.finishedAt = new Date().toISOString();
    localDb.save();

    return job;
  },

  async acknowledgeRevision(revisionId: string, clientId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await sbDrawings.acknowledgeRevision(revisionId, clientId);
      await auditService.logAction('ACKNOWLEDGE_REVISION', 'revisions', revisionId, { clientId });
      return;
    }
    const db = localDb.get();
    db.revisionAcks.push({
      revisionId,
      clientId,
      ackedAt: new Date().toISOString()
    });
    localDb.save();

    await auditService.logAction('ACKNOWLEDGE_REVISION', 'revisions', revisionId, { clientId });
  },

  async downloadRevisionPdf(revision: Revision, sheet: DrawingSheet, _isClient = false, _clientName = 'Client'): Promise<void> {
    if (!revision.filePath) throw new Error('No file has been uploaded for this revision.');
    const fileName = revision.fileName || `${sheet.code}_${revision.revNo.replace(/\s+/g, '_')}`;
    await fileStorageService.download(revision.filePath, fileName);

    await auditService.logAction('DOWNLOAD_DRAWING', 'revisions', revision.id, {
      filename: fileName
    });
  },

  async downloadAllRevisionsZip(projectId: string, _clientName = 'Client'): Promise<void> {
    const sheets = await this.getSheets(projectId);
    const zip = new JSZip();
    let count = 0;

    for (const sheet of sheets) {
      const currentRev = sheet.revisions?.find((r) => r.status === 'current');
      if (!currentRev?.filePath) continue;
      const blob = await fileStorageService.getBlob(currentRev.filePath);
      if (!blob) continue;
      zip.file(`${sheet.code}_${currentRev.revNo.replace(/\s+/g, '_')}_${currentRev.fileName || 'file'}`, blob);
      count++;
    }

    if (count === 0) throw new Error('There are no uploaded files to download yet.');

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `element-design-files-${new Date().toISOString().split('T')[0]}.zip`);

    await auditService.logAction('DOWNLOAD_DRAWINGS_ZIP', 'projects', projectId, {
      sheetsCount: count
    });
  }
};
