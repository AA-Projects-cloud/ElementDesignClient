import React, { useRef, useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../services/projectsService';
import { UploadCloud } from 'lucide-react';
import { drawingsService } from '../services/drawingsService';
import { ACCEPTED_MEDIA, formatBytes, validateFile } from '../services/fileStorageService';

export const UploadStudioView: React.FC = () => {
  const { addToast } = useUiStore();
  const [targetProjectId, setTargetProjectId] = useState('');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queuedFiles, setQueuedFiles] = useState<
    { file: File; status: 'queued' | 'processing' | 'completed' | 'failed' }[]
  >([]);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getProjects,
  });

  const activeProjectId = targetProjectId || projects[0]?.id;
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    const ok: { file: File; status: 'queued' }[] = [];
    for (const f of picked) {
      const problem = validateFile(f);
      if (problem) addToast(problem, 'error');
      else ok.push({ file: f, status: 'queued' });
    }
    if (ok.length) {
      setQueuedFiles((prev) => [...prev, ...ok]);
      addToast(`${ok.length} file(s) added to the upload queue.`, 'info');
    }
  };

  const handleProcessAll = async () => {
    if (!activeProjectId) {
      addToast('Create a customer project first.', 'error');
      return;
    }
    let done = 0;
    for (let i = 0; i < queuedFiles.length; i++) {
      if (queuedFiles[i].status !== 'queued') continue;
      const { file } = queuedFiles[i];
      setQueuedFiles((prev) => prev.map((q, j) => (j === i ? { ...q, status: 'processing' } : q)));
      try {
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const code = baseName.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 40) || `SHEET-${Date.now()}`;
        const sheets = await drawingsService.getSheets(activeProjectId);
        let sheet = sheets.find((sh) => sh.code === code);
        if (!sheet) {
          sheet = await drawingsService.createSheet({
            projectId: activeProjectId,
            code,
            title: baseName,
            category: 'floor-plan',
            description: file.name,
          });
        }
        const revNo = `REV ${String((sheet.revisions?.length || 0) + 1).padStart(2, '0')}`;
        await drawingsService.uploadRevision({ sheetId: sheet.id, revNo, note: 'Uploaded via Upload Studio', file });
        setQueuedFiles((prev) => prev.map((q, j) => (j === i ? { ...q, status: 'completed' } : q)));
        done++;
      } catch (err) {
        setQueuedFiles((prev) => prev.map((q, j) => (j === i ? { ...q, status: 'failed' } : q)));
        addToast(err instanceof Error ? err.message : `Upload failed: ${file.name}`, 'error');
      }
    }
    queryClient.invalidateQueries({ queryKey: ['sheets'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    if (done) addToast(`${done} file(s) uploaded and published to the client portal.`, 'success');
  };

  return (
    <section className="view-panel active">
      <div className="view-header">
        <div className="view-header-titles">
          <div className="view-header-folio">
            <span>CENTRAL INGESTION STATION</span>
          </div>
          <h1 className="view-header-title">Upload Studio</h1>
          <p className="view-header-sub">
            Upload PDFs, images and videos in bulk and publish them straight to the customer's portal.
          </p>
        </div>

        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={handleProcessAll} disabled={!queuedFiles.some((f) => f.status === 'queued')}>
            UPLOAD QUEUED FILES ({queuedFiles.filter((f) => f.status === 'queued').length})
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div>
          <div className="cad-dropzone" style={{ padding: 40 }} onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_MEDIA}
              style={{ display: 'none' }}
              onChange={handleFilesPicked}
            />
            <UploadCloud size={36} />
            <h3 style={{ fontSize: 16 }}>Choose PDFs, images or videos</h3>
            <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
              Click to select files from your computer — up to 50 MB each
            </p>
          </div>

          <div className="folio-card" style={{ marginTop: 20 }}>
            <div className="folio-card-header">
              <h3 style={{ fontSize: 14 }}>Upload Queue</h3>
              <span className="label-xs">{queuedFiles.length} FILES</span>
            </div>

            <div className="folio-card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>FILE NAME</th>
                    <th>SIZE</th>
                    <th>STATUS</th>
                    <th>TARGET ROUTING</th>
                  </tr>
                </thead>
                <tbody>
                  {queuedFiles.map((file, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{file.file.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{formatBytes(file.file.size)}</td>
                      <td>
                        <span
                          className={`badge ${file.status === 'completed' ? 'badge-green' : 'badge-active'}`}
                        >
                          {file.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{activeProject?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Settings */}
        <div className="folio-card">
          <div className="folio-card-header">
            <span className="label-xs">INGESTION PRESETS</span>
          </div>
          <div className="folio-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Default Target Folio</label>
              <select
                className="form-select"
                value={activeProjectId ?? ''}
                onChange={(e) => setTargetProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ padding: 12, backgroundColor: 'var(--bg-surface-1)', borderRadius: 4, fontSize: 11, color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
              <strong>Live publishing:</strong> Uploaded files appear in the selected customer's portal immediately, and a new upload of the same sheet name becomes its latest revision.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
