import React, { useRef, useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsService } from '../services/documentsService';
import { projectsService } from '../services/projectsService';
import { FileText, Download, Plus } from 'lucide-react';
import { ACCEPTED_MEDIA, formatBytes, validateFile } from '../services/fileStorageService';
import type { ProjectDocument } from '../types';

export const DocumentsSpecsView: React.FC = () => {
  const { addToast } = useUiStore();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<ProjectDocument['category']>('contract');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docProjectId, setDocProjectId] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsService.getDocuments(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getProjects,
  });

  const filteredDocs = documents.filter((d) => {
    if (categoryFilter === 'all') return true;
    return d.category === categoryFilter;
  });

  const handleDownloadAllZip = async () => {
    addToast('Compiling complete documents and specifications archive (ZIP)...', 'info');
    const project = projects.find((p) => p.id === (docProjectId || projects[0]?.id));
    if (!project) {
      addToast('There are no projects yet.', 'error');
      return;
    }
    try {
      await documentsService.downloadDocumentsZip(project.id, project.name);
      addToast('Specifications ZIP downloaded successfully.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Download failed', 'error');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectId = docProjectId || projects[0]?.id;
    if (!docFile || !projectId) {
      addToast('Choose a project and a file first.', 'error');
      return;
    }
    setUploading(true);
    try {
      await documentsService.createDocument({
        projectId,
        name: docName || docFile.name,
        category: docCategory,
        file: docFile,
      });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadOpen(false);
      setDocName('');
      setDocFile(null);
      addToast('Document uploaded.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="view-panel active">
      <div className="view-header">
        <div className="view-header-titles">
          <div className="view-header-folio">
            <span>OFFICIAL LEGAL &amp; TECHNICAL ARCHIVES</span>
          </div>
          <h1 className="view-header-title">Documents &amp; Specifications</h1>
          <p className="view-header-sub">
            Executed contracts, material schedules, warranty certificates, and mechanical clearance reports.
          </p>
        </div>

        <div className="view-header-actions">
          <button className="btn btn-secondary" onClick={handleDownloadAllZip}>
            <Download size={14} />
            DOWNLOAD ALL (ZIP)
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setUploadOpen(true)}
          >
            <Plus size={14} />
            + UPLOAD SPECIFICATION
          </button>
        </div>
      </div>

      <div className="tab-filter-group">
        <button
          className={`tab-filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          ALL DOCUMENTS ({documents.length})
        </button>
        <button
          className={`tab-filter-btn ${categoryFilter === 'contract' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('contract')}
        >
          CONTRACTS
        </button>
        <button
          className={`tab-filter-btn ${categoryFilter === 'materials' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('materials')}
        >
          MATERIALS
        </button>
        <button
          className={`tab-filter-btn ${categoryFilter === 'warranty' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('warranty')}
        >
          WARRANTIES
        </button>
      </div>

      <div className="folio-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>DOCUMENT TITLE</th>
              <th>CATEGORY</th>
              <th>STATUS BADGE</th>
              <th>FILE SIZE</th>
              <th>DATE OF ISSUE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        backgroundColor: 'var(--ink-primary)',
                        color: '#FFF',
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileText size={14} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>Official Executed Copy</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="label-xs">{doc.category.toUpperCase()}</span>
                </td>
                <td>
                  <span className="badge badge-approved">{doc.badge}</span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{formatBytes(doc.sizeBytes)}</td>
                <td style={{ fontSize: 12 }}>{new Date(doc.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={async () => {
                      try {
                        await documentsService.downloadDocument(doc);
                      } catch (err) {
                        addToast(err instanceof Error ? err.message : 'Download failed', 'error');
                      }
                    }}
                  >
                    <Download size={12} />
                    DOWNLOAD
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {uploadOpen && (
        <div className="modal-overlay active" onClick={() => setUploadOpen(false)}>
          <div className="modal-sheet" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="label-xs">ARCHIVE</span>
                <h3 style={{ fontSize: 16, marginTop: 2 }}>Upload Document</h3>
              </div>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Project</label>
                  <select className="form-select" value={docProjectId || (projects[0]?.id ?? '')} onChange={(e) => setDocProjectId(e.target.value)}>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Document Title</label>
                  <input className="form-input" value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Defaults to the file name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={docCategory} onChange={(e) => setDocCategory(e.target.value as ProjectDocument['category'])}>
                    <option value="contract">Contract</option>
                    <option value="materials">Materials</option>
                    <option value="warranty">Warranty</option>
                    <option value="technical">Technical</option>
                    <option value="handover">Handover</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">File (PDF, image or video, up to 50 MB)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_MEDIA}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (!f) return;
                      const problem = validateFile(f);
                      if (problem) addToast(problem, 'error');
                      else setDocFile(f);
                    }}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                    {docFile ? `${docFile.name} (${formatBytes(docFile.size)})` : 'CHOOSE FILE'}
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setUploadOpen(false)}>CANCEL</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'UPLOADING...' : 'UPLOAD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
