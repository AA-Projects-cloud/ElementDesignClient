import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';
import { drawingsService, getSheetMedia } from '../services/drawingsService';
import { MediaView } from '../components/MediaView';
import { formatBytes } from '../services/fileStorageService';
import { siteLogsService } from '../services/siteLogsService';
import { documentsService } from '../services/documentsService';
import { projectsService } from '../services/projectsService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import {
  Download,
  Eye,
  CheckCircle2,
  Phone,
  FileText,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
  FolderOpen,
} from 'lucide-react';

export const ClientPortalView: React.FC = () => {
  const {
    selectedClientId: uiSelectedClientId,
    setActiveWorkspace,
    openLightbox,
    openSiteLogDrawer,
    addToast,
    isImpersonating,
    stopImpersonation,
  } = useUiStore();

  // A signed-in customer is locked to their own record, regardless of UI state.
  const authUser = useAuthStore((s) => s.user);
  const isClientUser = authUser?.role === 'client';
  const selectedClientId = isClientUser && authUser?.clientId ? authUser.clientId : uiSelectedClientId;

  const [ackedRevs, setAckedRevs] = useState<Record<string, boolean>>({});
  const [requestCallModalOpen, setRequestCallModalOpen] = useState(false);
  const [callTopic, setCallTopic] = useState('Joinery alignment review');
  const [callTime, setCallTime] = useState('Tomorrow 11:00 AM');
  const [callRequested, setCallRequested] = useState(false);

  const { data: client } = useQuery({
    queryKey: ['client', selectedClientId],
    queryFn: () => clientsService.getClientById(selectedClientId),
    enabled: Boolean(selectedClientId),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getProjects,
  });
  const clientProjectId = projects.find((p) => p.clientId === selectedClientId)?.id ?? '__none__';

  const activeClientName = client?.name || authUser?.name || '';
  const projectTitle = client?.projectTitle || 'Your Project';

  const { data: allSheets = [] } = useQuery({
    queryKey: ['sheets', clientProjectId],
    queryFn: () => drawingsService.getSheets(clientProjectId),
  });

  const { data: allSiteLogs = [] } = useQuery({
    queryKey: ['siteLogs', clientProjectId],
    queryFn: () => siteLogsService.getSiteLogs(clientProjectId),
  });

  // Customers only see site updates that the studio has verified and approved.
  const siteLogs = allSiteLogs.filter((l) => l.status === 'approved');

  // Only show sheets that actually have an uploaded file.
  const sheets = allSheets.filter((sh) => (sh.revisions?.length ?? 0) > 0);

  // Work-location folders (e.g. Mumbai, Bihar)
  const locOf = (sh: (typeof sheets)[number]) => sh.location?.trim() || 'General';
  const locations = Array.from(new Set(sheets.map(locOf))).sort((a, b) =>
    a === 'General' ? 1 : b === 'General' ? -1 : a.localeCompare(b)
  );
  const [locFilter, setLocFilter] = useState('all');
  const activeLoc = locFilter !== 'all' && locations.includes(locFilter) ? locFilter : 'all';
  const showFolders = locations.length > 1 || (locations.length === 1 && locations[0] !== 'General');
  const groups = locations
    .filter((l) => activeLoc === 'all' || l === activeLoc)
    .map((l) => ({ loc: l, sheets: sheets.filter((sh) => locOf(sh) === l) }));

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', clientProjectId],
    queryFn: () => documentsService.getDocuments(clientProjectId),
  });

  const handleAcknowledge = async (sheetId: string, revId: string | undefined, sheetCode: string) => {
    if (!revId || !client?.id) return;
    try {
      await drawingsService.acknowledgeRevision(revId, client.id);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not record acknowledgement', 'error');
      return;
    }
    setAckedRevs((prev) => ({ ...prev, [sheetId]: true }));
    addToast(`Acknowledged receipt of ${sheetCode} site release. Safe-Build status updated.`, 'success');
  };

  const handleDownloadAllZip = async () => {
    addToast('Building client drawing package (ZIP)...', 'info');
    try {
      await drawingsService.downloadAllRevisionsZip(clientProjectId, activeClientName);
      addToast('Client technical drawings archive downloaded.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Download failed', 'error');
    }
  };

  const handleDownloadSpecsZip = async () => {
    addToast('Compiling official executed specifications archive (ZIP)...', 'info');
    try {
      await documentsService.downloadDocumentsZip(clientProjectId, projectTitle);
      addToast('Specifications archive downloaded.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Download failed', 'error');
    }
  };

  const handleRequestCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Save the request so the studio has a record of it (Supabase only)
    if (isSupabaseConfigured && client?.id) {
      const { error } = await supabase.from('callback_requests').insert({
        project_id: clientProjectId === '__none__' ? null : clientProjectId,
        client_id: client.id,
        preferred_time: callTime,
        topic: callTopic,
      });
      if (error) {
        addToast('Could not send the call request. Please use DIRECT CALL instead.', 'error');
        return;
      }
    }
    setCallRequested(true);
    setRequestCallModalOpen(false);
    addToast(`Callback requested from Admin 1 (${callTime}). Topic: ${callTopic}`, 'success');
  };

  return (
    <section className="view-panel active">
      {/* Client Portal Header Bar */}
      <div className="client-portal-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2B7A4B' }} />
          <span>AUTHENTICATED CLIENT PORTAL — WELCOME, {activeClientName.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#C8BEB2', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={12} />
            <span>SINGLE-PROJECT PRIVACY LOCK ACTIVE</span>
          </span>
          {!isClientUser && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: '#FFF', color: '#555555' }}
              onClick={() => {
                if (isImpersonating) {
                  stopImpersonation();
                } else {
                  setActiveWorkspace('admin');
                }
              }}
            >
              RETURN TO STUDIO &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Project Hero Folio */}
      <div className="client-hero-folio">
        <div>
          <div className="client-hero-badges">
            <span className="badge badge-approved">REF: {client?.refId || '—'}</span>
            <span className="badge badge-execution">RESIDENTIAL LUXURY FITOUT</span>
            <span className="badge badge-review">VAULT KEY: {client?.vaultKey || '—'}</span>
          </div>
          <h1 className="client-hero-title">{projectTitle.toUpperCase()}</h1>
          <div className="client-hero-location">
            <span>{client?.location || ''}</span>
          </div>
        </div>

        <div className="client-hero-stats">
          <div className="client-hero-stat-box">
            <span className="label-xs">EXECUTION STATUS</span>
            <div style={{ fontWeight: 700, fontSize: 14, margin: '4px 0' }}>
              ● {client?.phase || '—'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-secondary)' }}>
              Overall Sprint: {client?.completionPct ?? 0}% Complete
            </div>
          </div>

          <div className="client-hero-stat-box">
            <span className="label-xs">LEAD ARCHITECT</span>
            <div style={{ fontWeight: 700, fontSize: 14, margin: '4px 0' }}>{client?.leadArchitect || 'To be assigned'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-secondary)' }}>Direct Desk Ext: #104</div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="client-subnav-bar">
        <div className="client-nav-tabs">
          <button className="client-tab-link active">OVERVIEW</button>
          <button className="client-tab-link">MY DRAWINGS &amp; BLUEPRINTS ({sheets.length})</button>
          <button className="client-tab-link">PROJECT DOCUMENTS ({documents.length})</button>
          <button className="client-tab-link">SITE PROGRESS UPDATES ({siteLogs.length})</button>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setRequestCallModalOpen(true)}
        >
          CONTACT ELEMENT DESIGN TEAM
        </button>
      </div>

      {/* Section: Latest Approved Drawings */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <span className="label-xs">ARCHITECTURAL DOCUMENTATION • READY FOR SITE EXECUTION</span>
            <h2 style={{ fontSize: 18, marginTop: 2 }}>LATEST APPROVED DRAWINGS</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadAllZip}>
            <Download size={14} />
            DOWNLOAD ALL REVISIONS (ZIP)
          </button>
        </div>

        {showFolders && (
          <div className="tab-filter-group" style={{ marginBottom: 14, overflowX: 'auto' }}>
            <button
              className={`tab-filter-btn ${activeLoc === 'all' ? 'active' : ''}`}
              onClick={() => setLocFilter('all')}
            >
              ALL LOCATIONS ({sheets.length})
            </button>
            {locations.map((l) => (
              <button
                key={l}
                className={`tab-filter-btn ${activeLoc === l ? 'active' : ''}`}
                onClick={() => setLocFilter(l)}
              >
                {l.toUpperCase()} ({sheets.filter((sh) => locOf(sh) === l).length})
              </button>
            ))}
          </div>
        )}

        <div className="blueprints-grid">
          {sheets.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '28px 0', textAlign: 'center', color: 'var(--ink-secondary)', fontSize: 13 }}>
              No drawings, images or videos have been shared with you yet. They will appear here the moment the studio uploads them.
            </div>
          )}
          {groups.map((g) => (
          <React.Fragment key={g.loc}>
          {showFolders && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
              <FolderOpen size={15} />
              <span className="label-xs" style={{ color: 'var(--ink-primary)' }}>{g.loc.toUpperCase()}</span>
              <span className="label-xs">({g.sheets.length})</span>
            </div>
          )}
          {g.sheets.map((sheet) => {
            const isAcked = ackedRevs[sheet.id];
            return (
              <div key={sheet.id} className="blueprint-card">
                <div
                  className="blueprint-card-preview"
                  onClick={() => openLightbox(sheet.code, sheet.title, sheet.currentRev || 'REV 01', false, getSheetMedia(sheet))}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="blueprint-sheet-tag">{sheet.currentRev || 'REV 01'}</span>
                  <MediaView path={getSheetMedia(sheet)?.path} mediaType={getSheetMedia(sheet)?.mediaType} alt={sheet.title} />
                </div>

                <div className="blueprint-card-meta">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="label-xs">{sheet.code}</span>
                      <span className="badge badge-approved" style={{ fontSize: 9, height: 18 }}>
                        LATEST REVISION
                      </span>
                    </div>
                    <h4 style={{ fontSize: 14, marginBottom: 4 }}>{sheet.title}</h4>
                    <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{sheet.description}</p>
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)' }}>
                      UPDATED {(sheet.revisions?.[0] ? new Date(sheet.revisions[0].createdAt) : new Date()).toLocaleDateString()}
                    </span>
                    <button
                      className={`btn btn-sm ${isAcked ? 'btn-secondary' : 'btn-tertiary'}`}
                      style={{ fontSize: 10 }}
                      onClick={() => handleAcknowledge(sheet.id, (sheet.revisions?.find((r) => r.status === 'current') || sheet.revisions?.[0])?.id, sheet.code)}
                    >
                      {isAcked ? (
                        <>
                          <Check size={11} color="green" /> Acknowledged
                        </>
                      ) : (
                        'Acknowledge Receipt'
                      )}
                    </button>
                  </div>
                </div>

                <div className="blueprint-card-footer">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openLightbox(sheet.code, sheet.title, sheet.currentRev || 'REV 01', false, getSheetMedia(sheet))}
                  >
                    <Eye size={12} />
                    VIEW
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      const rev = sheet.revisions?.find((r) => r.status === 'current') || sheet.revisions?.[0];
                      if (!rev) return;
                      try {
                        await drawingsService.downloadRevisionPdf(rev, sheet, true, activeClientName);
                        addToast(`Downloaded ${rev.fileName || sheet.code}.`, 'info');
                      } catch (err) {
                        addToast(err instanceof Error ? err.message : 'Download failed', 'error');
                      }
                    }}
                  >
                    <Download size={12} />
                    DOWNLOAD
                  </button>
                </div>
              </div>
            );
          })}
          </React.Fragment>
          ))}
        </div>
      </div>

      {/* Daily Field Verifications & Project Specs Split */}
      <div className="split-columns-2" style={{ marginTop: 14 }}>
        {/* Left: Live Site Work Updates */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <span className="label-xs">DAILY FIELD VERIFICATIONS</span>
              <h2 style={{ fontSize: 18, marginTop: 2 }}>LIVE SITE WORK UPDATES</h2>
            </div>
            <span className="badge badge-green">● LIVE FIELD FEED</span>
          </div>

          {siteLogs.map((log) => (
            <div key={log.id} className="site-feed-post">
              <div className="site-feed-post-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#555555' }} />
                  <strong style={{ fontSize: 13.5 }}>{log.title}</strong>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)' }}>
                  {new Date(log.createdAt).toLocaleDateString()} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                </span>
              </div>

              <div className="site-feed-post-body">
                <p style={{ fontSize: 13, color: 'var(--ink-primary)', lineHeight: 1.45, marginBottom: 12 }}>
                  {log.body}
                </p>

                {log.photos.length > 0 && (
                  <div className="site-feed-photos-row">
                    {log.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="site-feed-photo-item"
                        onClick={() => openSiteLogDrawer(log.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <MediaView path={photo.path} mediaType={photo.mediaType} mode={photo.mediaType === 'video' ? 'full' : 'thumb'} alt={photo.caption} />
                        <div className="site-photo-caption-bar">
                          <span>{photo.caption}</span>
                          <span>[⛶]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {log.testReport && (
                  <div style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-hairline)', borderRadius: 4, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12 }}>
                      {log.testReport.title}: <strong>{log.testReport.val}</strong>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: 9, height: 18 }}>VERIFIED</span>
                  </div>
                )}
              </div>

              <div className="site-feed-post-footer">
                <span>LOGGED BY: {log.loggedBy.toUpperCase()}</span>
                <button
                  className="btn btn-tertiary btn-sm"
                  style={{ fontSize: 11 }}
                  onClick={() => openSiteLogDrawer(log.id)}
                >
                  View Full Inspection Log &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Project Specifications & Custodian Card */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <span className="label-xs">CLIENT REPOSITORY</span>
              <h2 style={{ fontSize: 18, marginTop: 2 }}>PROJECT SPECIFICATIONS &amp; CONTRACTS</h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: 'var(--bg-surface-1)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 4,
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      background: '#555555',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                    }}
                  >
                    <FileText size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
                      {formatBytes(doc.sizeBytes)} • {doc.badge}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-icon"
                  title="Download Document"
                  onClick={async () => {
                    try {
                      await documentsService.downloadDocument(doc);
                    } catch (err) {
                      addToast(err instanceof Error ? err.message : 'Download failed', 'error');
                    }
                  }}
                >
                  <Download size={14} />
                </button>
              </div>
            ))}

            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleDownloadSpecsZip}>
              OPEN COMPLETE DOCUMENT ARCHIVE ({documents.length} FILES)
            </button>
          </div>

          {/* Assigned Element Design Custodian Card */}
          <div className="custodian-card">
            <span className="label-xs" style={{ marginBottom: 12, display: 'block' }}>
              ASSIGNED ELEMENT DESIGN CUSTODIAN
            </span>
            <div className="custodian-profile-row">
              <div className="user-avatar-badge" style={{ width: 42, height: 42, fontSize: 14 }}>
                A1
              </div>
              <div>
                <h4 style={{ fontSize: 15, marginBottom: 2 }}>Admin 1</h4>
                <div style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>Partner &amp; Lead Technical Director</div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-primary)', marginTop: 2 }}>
                  DIRECT: +91 80876 68480
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <a href="tel:+918087668480" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                <Phone size={12} />
                DIRECT CALL
              </a>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setRequestCallModalOpen(true)}
              >
                {callRequested ? 'REQUESTED ✓' : 'REQUEST CALL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Call Modal */}
      {requestCallModalOpen && (
        <div className="modal-overlay active" onClick={() => setRequestCallModalOpen(false)}>
          <div className="modal-sheet" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="label-xs">DIRECT LIAISON</span>
                <h3 style={{ fontSize: 16, marginTop: 2 }}>Request Architect Callback</h3>
              </div>
            </div>
            <form onSubmit={handleRequestCallSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Preferred Time Window</label>
                  <input
                    type="text"
                    className="form-input"
                    value={callTime}
                    onChange={(e) => setCallTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Discussion Topic / Query</label>
                  <textarea
                    className="form-textarea"
                    value={callTopic}
                    onChange={(e) => setCallTopic(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRequestCallModalOpen(false)}>
                  CANCEL
                </button>
                <button type="submit" className="btn btn-primary">
                  CONFIRM REQUEST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
