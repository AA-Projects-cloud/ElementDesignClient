import React, { useRef, useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteLogsService } from '../services/siteLogsService';
import { projectsService } from '../services/projectsService';
import { Plus } from 'lucide-react';
import { MediaView } from '../components/MediaView';
import { useAuthStore } from '../store/useAuthStore';
import { ACCEPTED_MEDIA, formatBytes, validateFile } from '../services/fileStorageService';

export const WorkSiteUpdatesView: React.FC = () => {
  const { openSiteLogDrawer, addToast } = useUiStore();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [newLogModalOpen, setNewLogModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('CARPENTRY • MILESTONES');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [projectId, setProjectId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authUser = useAuthStore((s) => s.user);

  const { data: logs = [] } = useQuery({
    queryKey: ['siteLogs'],
    queryFn: () => siteLogsService.getSiteLogs(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getProjects,
  });

  const filteredLogs = logs.filter((l) => {
    if (statusFilter === 'all') return true;
    return l.status === statusFilter;
  });

  const createLogMutation = useMutation({
    mutationFn: async () => {
      const targetProjectId = projectId || projects[0]?.id;
      if (!targetProjectId) throw new Error('Create a customer project first.');
      return await siteLogsService.createSiteLog({
        projectId: targetProjectId,
        title,
        category,
        body,
        loggedBy: authUser?.name || 'Administrator',
        files,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteLogs'] });
      setNewLogModalOpen(false);
      setTitle('');
      setBody('');
      setFiles([]);
      addToast('New site inspection log queued for review!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Could not save the site log', 'error');
    },
  });

  return (
    <section className="view-panel active">
      <div className="view-header">
        <div className="view-header-titles">
          <div className="view-header-folio">
            <span>FIELD SUPERVISION &amp; VERIFICATION AUDITS</span>
          </div>
          <h1 className="view-header-title">Work &amp; Site Updates</h1>
          <p className="view-header-sub">
            Real-time inspection logs, laser level tolerances, material installation sign-offs, and quality clearance approvals.
          </p>
        </div>

        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={() => setNewLogModalOpen(true)}>
            <Plus size={14} />
            + LOG FIELD INSPECTION
          </button>
        </div>
      </div>

      <div className="tab-filter-group">
        <button
          className={`tab-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          ALL SITE LOGS ({logs.length})
        </button>
        <button
          className={`tab-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          PENDING AUDIT ({logs.filter((l) => l.status === 'pending').length})
        </button>
        <button
          className={`tab-filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('approved')}
        >
          APPROVED CLEARANCE ({logs.filter((l) => l.status === 'approved').length})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredLogs.map((log) => (
          <div key={log.id} className="folio-card">
            <div className="folio-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  className={`badge ${
                    log.status === 'approved'
                      ? 'badge-green'
                      : log.status === 'rejected'
                      ? 'badge-superseded'
                      : 'badge-active'
                  }`}
                >
                  {log.status.toUpperCase()}
                </span>
                <h3 style={{ fontSize: 15 }}>{log.title}</h3>
                <span className="label-xs" style={{ color: 'var(--ink-secondary)' }}>
                  ({log.category})
                </span>
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)' }}>
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="folio-card-body">
              <p style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 14 }}>{log.body}</p>

              {log.photos.length > 0 && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  {log.photos.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        width: 140,
                        height: 90,
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid var(--border-hairline)',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                      onClick={() => openSiteLogDrawer(log.id)}
                    >
                      <MediaView path={p.path} mediaType={p.mediaType} alt={p.caption} />
                      <div className="site-photo-caption-bar">
                        <span>{p.caption}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
                  Logged by: <strong>{log.loggedBy}</strong> {log.verifiedBy && `• ${log.verifiedBy}`}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => openSiteLogDrawer(log.id)}>
                  INSPECT &amp; APPROVE &gt;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Site Log Modal */}
      {newLogModalOpen && (
        <div className="modal-overlay active" onClick={() => setNewLogModalOpen(false)}>
          <div className="modal-sheet" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="label-xs">SITE REPORTING</span>
                <h3 style={{ fontSize: 16, marginTop: 2 }}>Log Daily Site Milestone</h3>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createLogMutation.mutate();
              }}
            >
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Inspection Milestone Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Marble Slab Dry-Lay Alignment"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project</label>
                  <select
                    className="form-select"
                    value={projectId || (projects[0]?.id ?? '')}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discipline / Category</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="CARPENTRY • MILESTONES">CARPENTRY • MILESTONES</option>
                    <option value="DRYWALL & MEP">DRYWALL &amp; MEP</option>
                    <option value="FINISHING • HANDOVER PREP">FINISHING • HANDOVER PREP</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Observations &amp; Tolerance Checks</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Describe laser level results, plumb readings, and contractor clearances..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Photos &amp; Videos</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const picked = Array.from(e.target.files || []);
                      e.target.value = '';
                      const ok: File[] = [];
                      for (const f of picked) {
                        const problem = validateFile(f);
                        if (problem) addToast(problem, 'error');
                        else ok.push(f);
                      }
                      setFiles((prev) => [...prev, ...ok]);
                    }}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                    ATTACH PHOTOS / VIDEOS
                  </button>
                  {files.map((f, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{f.name} ({formatBytes(f.size)})</span>
                      <button type="button" className="btn btn-tertiary" style={{ fontSize: 10, padding: 0 }} onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setNewLogModalOpen(false)}>
                  CANCEL
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLogMutation.isPending}>
                  {createLogMutation.isPending ? 'UPLOADING...' : 'SUBMIT AUDIT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
