import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '../services/projectsService';
import { drawingsService, getSheetMedia } from '../services/drawingsService';
import { MediaView } from '../components/MediaView';
import { formatBytes } from '../services/fileStorageService';
import {
  UploadCloud,
  FileText,
  Download,
  Eye,
  SlidersHorizontal,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export const DrawingsView: React.FC = () => {
  const {
    openUploadModal,
    openLightbox,
    openProcessingLogsModal,
    addToast,
  } = useUiStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tuneFilter, setTuneFilter] = useState<'all' | 'current' | 'superseded'>('all');
  const [tuneMenuOpen, setTuneMenuOpen] = useState(false);

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsService.getProjects });
  const activeProjectId = selectedProjectId || projects[0]?.id;

  const { data: sheets = [] } = useQuery({
    queryKey: ['sheets', activeProjectId],
    queryFn: () => drawingsService.getSheets(activeProjectId),
    enabled: Boolean(activeProjectId),
  });

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  const filteredSheets = sheets.filter((s) => {
    if (selectedCategory === 'all') return true;
    return s.category === selectedCategory;
  });

  const featuredSheet = sheets[0];
  const countFor = (cat: string) => sheets.filter((s) => s.category === cat).length;

  const downloadSheet = async (sheet: (typeof sheets)[number], revId?: string) => {
    const rev = (revId ? sheet.revisions?.find((r) => r.id === revId) : undefined) || sheet.revisions?.find((r) => r.status === 'current') || sheet.revisions?.[0];
    if (!rev) {
      addToast('No file has been uploaded for this sheet yet.', 'error');
      return;
    }
    try {
      await drawingsService.downloadRevisionPdf(rev, sheet);
      addToast(`Downloaded ${rev.fileName || sheet.code}`, 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Download failed', 'error');
    }
  };

  const handleDownloadZip = async () => {
    if (!activeProjectId) return;
    addToast(`Compiling all current files for ${activeProject?.name} (ZIP)...`, 'info');
    try {
      await drawingsService.downloadAllRevisionsZip(activeProjectId, activeProject?.name);
      addToast('ZIP archive downloaded successfully.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Download failed', 'error');
    }
  };

  return (
    <section className="view-panel active">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-titles">
          <div className="view-header-folio">
            <span>FOLIO REGISTRY • SECTION SH-A</span>
            <span>• SYNCHRONIZED WITH MUMBAI SITE OFFICE</span>
          </div>
          <h1 className="view-header-title">Drawings &amp; Blueprint Central</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <select
              className="form-select"
              style={{ fontWeight: 700, fontFamily: 'var(--font-display)', height: 32, padding: '0 10px' }}
              value={activeProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.typology}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={openUploadModal}>
            <UploadCloud size={14} />
            + UPLOAD NEW REVISION
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (featuredSheet) openLightbox(featuredSheet.code, featuredSheet.title, featuredSheet.currentRev || 'REV 01', false, getSheetMedia(featuredSheet));
            }}
          >
            <Eye size={14} />
            QUICK LIGHTBOX
          </button>
        </div>
      </div>

      {/* Category Tabs Ribbon */}
      <div className="tab-filter-group" style={{ width: '100%', overflowX: 'auto' }}>
        <button
          className={`tab-filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          ALL TYPES ({sheets.length})
        </button>
        <button
          className={`tab-filter-btn ${selectedCategory === 'floor-plan' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('floor-plan')}
        >
          FLOOR PLAN ({countFor('floor-plan')})
        </button>
        <button
          className={`tab-filter-btn ${selectedCategory === 'furniture' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('furniture')}
        >
          FURNITURE LAYOUT ({countFor('furniture')})
        </button>
        <button
          className={`tab-filter-btn ${selectedCategory === 'electrical' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('electrical')}
        >
          ELECTRICAL LAYOUT ({countFor('electrical')})
        </button>
        <button
          className={`tab-filter-btn ${selectedCategory === 'ceiling' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('ceiling')}
        >
          FALSE CEILING ({countFor('ceiling')})
        </button>
        <button
          className={`tab-filter-btn ${selectedCategory === 'kitchen' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('kitchen')}
        >
          KITCHEN &amp; JOINERY ({countFor('kitchen')})
        </button>
        <button
          className={`tab-filter-btn ${selectedCategory === 'wardrobe' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('wardrobe')}
        >
          WARDROBE ({countFor('wardrobe')})
        </button>
      </div>

      {/* Safe-Build Protocol Banner */}
      <div className="safe-build-banner">
        <div className="safe-build-content">
          <span className="safe-build-badge">
            <CheckCircle2 size={11} />
            SAFE-BUILD PROTOCOL ACTIVE
          </span>
          <div className="safe-build-text">
            Contractors and client portals always show the <strong>latest uploaded revision</strong> of each sheet. Earlier revisions are kept in the change registry for reference.
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          CLIENT SYNC: <span style={{ color: 'var(--green-indicator)' }}>100% Up to date</span>
        </div>
      </div>

      {/* Ingestion Pipeline Strip */}
      <div className="blueprint-pipeline-strip">
        <div className="cad-dropzone" onClick={openUploadModal}>
          <UploadCloud size={24} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
            Upload Drawings, Images &amp; Videos
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
            Supports PDF, images (JPG, PNG, WebP) and video (MP4, MOV, WebM) up to 50 MB
          </p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 4 }}>
            BROWSE LOCAL FILES
          </button>
        </div>

        <div className="pipeline-status-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label-xs">AUTO-SYNC INGESTION PIPELINE</span>
            <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>Live sync active</span>
          </div>

          <div className="pipeline-steps-bar">
            <div className="pipeline-step-item completed">
              <span className="pipeline-step-status">STAGE 01</span>
              <span className="pipeline-step-title">Upload DWG</span>
              <span className="pipeline-step-desc">Vector parsing</span>
            </div>
            <div className="pipeline-step-item completed">
              <span className="pipeline-step-status">STAGE 02</span>
              <span className="pipeline-step-title">Auto-Process</span>
              <span className="pipeline-step-desc">Layer flattening</span>
            </div>
            <div className="pipeline-step-item completed">
              <span className="pipeline-step-status">STAGE 03</span>
              <span className="pipeline-step-title">PDF Generated</span>
              <span className="pipeline-step-desc">Vector 600DPI</span>
            </div>
            <div className="pipeline-step-item completed">
              <span className="pipeline-step-status">STAGE 04</span>
              <span className="pipeline-step-title">Published Live</span>
              <span className="pipeline-step-desc">Client push alert</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--ink-secondary)' }}>
            <span>{sheets.length} sheet(s) published for this project</span>
            <button className="btn btn-tertiary btn-sm" style={{ fontSize: 11 }} onClick={openProcessingLogsModal}>
              VIEW PROCESSING LOGS &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Featured Sheet A-101 */}
      {featuredSheet && (
        <div className="folio-card">
          <div className="folio-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="label-xs" style={{ background: '#737373', color: '#FFF', padding: '2px 6px', borderRadius: 2 }}>
                {featuredSheet.code}
              </span>
              <h2 style={{ fontSize: 16 }}>{featuredSheet.title}</h2>
              <span className="badge badge-approved">{featuredSheet.currentRev} [ACTIVE ON SITE]</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)' }}>
              Updated {featuredSheet.revisions?.[0] ? new Date(featuredSheet.revisions[0].createdAt).toLocaleString() : ''}
            </div>
          </div>

          <div className="folio-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
              <div
                style={{ border: '1px solid var(--border-hairline)', borderRadius: 4, overflow: 'hidden', background: '#FAF8F5', cursor: 'pointer' }}
                onClick={() => openLightbox(featuredSheet.code, featuredSheet.title, featuredSheet.currentRev || 'REV 01', false, getSheetMedia(featuredSheet))}
              >
                <div style={{ width: '100%', height: 180 }}>
                  <MediaView path={getSheetMedia(featuredSheet)?.path} mediaType={getSheetMedia(featuredSheet)?.mediaType} alt={featuredSheet.title} />
                </div>
                <div style={{ padding: 10, background: 'var(--bg-surface-1)', borderTop: '1px solid var(--border-hairline)', fontSize: 11 }}>
                  <div style={{ fontWeight: 700 }}>{formatBytes(featuredSheet.revisions?.find((r) => r.status === 'current')?.sizeBytes || 0)}</div>
                  <div style={{ color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)' }}>{featuredSheet.revisions?.find((r) => r.status === 'current')?.fileName || ''}</div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 14 }}>
                  {featuredSheet.description}
                </p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => openLightbox(featuredSheet.code, featuredSheet.title, featuredSheet.currentRev || 'REV 01', false, getSheetMedia(featuredSheet))}
                  >
                    <Eye size={14} />
                    VIEW FILE
                  </button>
                  {getSheetMedia(featuredSheet)?.prevPath && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => openLightbox(featuredSheet.code, featuredSheet.title, featuredSheet.currentRev || 'REV 01', true, getSheetMedia(featuredSheet))}
                    >
                      <Layers size={14} />
                      VIEW REDLINE DIFF ({featuredSheet.currentRev} VS {getSheetMedia(featuredSheet)?.prevRevNo})
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={() => downloadSheet(featuredSheet)}>
                    <Download size={14} />
                    DOWNLOAD FILE
                  </button>
                </div>

                {/* Revision Audit History */}
                <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 14 }}>
                  <span className="label-xs" style={{ marginBottom: 10, display: 'block' }}>
                    DOCUMENT CHANGE REGISTRY &amp; AUDIT TRAIL
                  </span>

                  {featuredSheet.revisions?.map((rev) => (
                    <div
                      key={rev.id}
                      style={{
                        padding: '10px 14px',
                        background: rev.status === 'current' ? 'var(--bg-surface-1)' : 'var(--bg-primary)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 4,
                        marginBottom: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span
                            className={`badge ${rev.status === 'current' ? 'badge-approved' : 'badge-superseded'}`}
                            style={{ height: 18, fontSize: 9 }}
                          >
                            {rev.revNo} ({rev.status.toUpperCase()})
                          </span>
                          <strong style={{ fontSize: 12.5 }}>{rev.note}</strong>
                        </div>
                        <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)' }}>
                          Uploaded {new Date(rev.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => downloadSheet(featuredSheet, rev.id)}
                      >
                        <Download size={12} />
                        {rev.status === 'superseded' ? 'ARCHIVED FILE' : 'DOWNLOAD'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registered Technical Sheets Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 16 }}>Registered Technical Sheets ({activeProject?.name})</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
              Showing {filteredSheets.length} active site-ready technical sets
            </span>
            <button className="btn btn-icon" onClick={handleDownloadZip} title="Download All Revisions (ZIP)">
              <Archive size={14} />
            </button>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-icon" onClick={() => setTuneMenuOpen(!tuneMenuOpen)} title="Filter Revisions">
                <SlidersHorizontal size={14} />
              </button>
              {tuneMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 36,
                    right: 0,
                    width: 180,
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--ink-primary)',
                    borderRadius: 4,
                    padding: 8,
                    zIndex: 200,
                  }}
                >
                  <div
                    style={{ padding: '6px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setTuneFilter('all'); setTuneMenuOpen(false); }}
                  >
                    All Revisions
                  </div>
                  <div
                    style={{ padding: '6px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => { setTuneFilter('current'); setTuneMenuOpen(false); }}
                  >
                    Current Releases Only
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="blueprints-grid">
          {filteredSheets.map((sheet) => (
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
                      {sheet.currentRev} [LATEST]
                    </span>
                  </div>
                  <h4 style={{ fontSize: 14, marginBottom: 4 }}>{sheet.title}</h4>
                  <p style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{sheet.description}</p>
                </div>

                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)' }}>
                  UPDATED {sheet.updatedDate || 'RECENTLY'}
                </div>
              </div>

              <div className="blueprint-card-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => openLightbox(sheet.code, sheet.title, sheet.currentRev || 'REV 01', false, getSheetMedia(sheet))}
                >
                  <Eye size={12} />
                  PREVIEW DRAWING
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => downloadSheet(sheet)}
                >
                  <Download size={12} />
                  DOWNLOAD FILE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
