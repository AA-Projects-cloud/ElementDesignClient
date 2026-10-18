import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';
import { projectsService } from '../services/projectsService';
import { drawingsService, getSheetMedia } from '../services/drawingsService';
import { MediaView } from '../components/MediaView';
import { siteLogsService } from '../services/siteLogsService';
import {
  Users,
  Briefcase,
  FileText,
  Activity,
  Plus,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    setCurrentView,
    setSelectedClientId,
    openUploadModal,
    openNewProjectModal,
    openLightbox,
    openSiteLogDrawer,
    addToast,
  } = useUiStore();

  const [activeStageFilter, setActiveStageFilter] = useState<'all' | 'execution' | 'design' | 'handover'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientFilterId, setClientFilterId] = useState<string | null>(null);

  // Queries
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsService.getClients });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsService.getProjects });
  const { data: sheets = [] } = useQuery({ queryKey: ['sheets'], queryFn: () => drawingsService.getSheets() });
  const { data: siteLogs = [] } = useQuery({ queryKey: ['siteLogs'], queryFn: () => siteLogsService.getSiteLogs() });

  // Filtered commissions
  const filteredClients = clients.filter((c) => {
    const matchesFilter =
      activeStageFilter === 'all'
        ? true
        : activeStageFilter === 'execution'
        ? c.tag.includes('CONSTRUCTION') || c.tag.includes('SITE')
        : activeStageFilter === 'design'
        ? c.tag.includes('DESIGN')
        : c.tag.includes('HANDOVER');

    const matchesSearch =
      searchQuery === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.projectTitle && c.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClientPicker = clientFilterId ? c.id === clientFilterId : true;

    return matchesFilter && matchesSearch && matchesClientPicker;
  });

  // Live figures for the stat cards
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const onboardedThisMonth = clients.filter((c) => c.createdAt && new Date(c.createdAt) >= monthStart).length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const revisedThisWeek = sheets.reduce(
    (n, sh) => n + (sh.revisions || []).filter((r) => new Date(r.createdAt).getTime() >= weekAgo).length,
    0
  );
  const pendingSiteLogs = siteLogs.filter((l) => l.status === 'pending').length;

  // Most recently uploaded file for each customer's project
  const liveDraftFor = (clientId: string) => {
    const pid = projects.find((p) => p.clientId === clientId)?.id;
    let best: { title: string; rev: string; at: string } | undefined;
    sheets
      .filter((sh) => sh.projectId === pid)
      .forEach((sh) =>
        (sh.revisions || []).forEach((r) => {
          if (!best || r.createdAt > best.at) best = { title: sh.title, rev: r.revNo, at: r.createdAt };
        })
      );
    return best;
  };

  // Newest uploads first
  const latestAt = (sh: (typeof sheets)[number]) =>
    (sh.revisions || []).reduce((m, r) => (r.createdAt > m ? r.createdAt : m), '');
  const recentSheets = sheets
    .filter((sh) => (sh.revisions?.length ?? 0) > 0)
    .sort((a, b) => latestAt(b).localeCompare(latestAt(a)))
    .slice(0, 3);

  const handleExportCsv = () => {
    projectsService.exportProjectsCsv(projects);
    addToast('Exported active projects specification CSV.', 'info');
  };

  return (
    <section className="view-panel active">
      {/* View Header */}
      <div className="view-header">
        <div className="view-header-titles">
          <div className="view-header-folio">
            <span className="status-live-dot" />
            <span>OPERATIONAL FOLIO • {clients.length} ACTIVE CYCLE</span>
          </div>
          <h1 className="view-header-title">Element Design Administration — Overview</h1>
          <p className="view-header-sub">
            Structural management schedule, live project matrices, revision approvals, and site logs across all active residential commissions.
          </p>
        </div>

        <div className="view-header-actions">
          <button className="btn btn-secondary" onClick={openUploadModal}>
            <Plus size={14} />
            UPLOAD DRAWING
          </button>
          <button className="btn btn-secondary" onClick={openNewProjectModal}>
            <Plus size={14} />
            NEW PROJECT
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-primary"
              onClick={() => setClientPickerOpen(!clientPickerOpen)}
            >
              <Filter size={14} />
              FILTER BY CLIENT {clientFilterId && '(1 ACTIVE)'}
            </button>

            {clientPickerOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 40,
                  right: 0,
                  width: 240,
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--ink-primary)',
                  borderRadius: 4,
                  boxShadow: 'var(--shadow-overlay)',
                  zIndex: 200,
                  padding: 8,
                }}
              >
                <div
                  style={{
                    padding: '6px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: 700,
                    borderBottom: '1px solid var(--border-hairline)',
                  }}
                  onClick={() => {
                    setClientFilterId(null);
                    setClientPickerOpen(false);
                  }}
                >
                  Clear Filter (Show All)
                </div>
                {clients.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '6px 8px',
                      fontSize: 12,
                      cursor: 'pointer',
                      borderRadius: 2,
                    }}
                    onClick={() => {
                      setClientFilterId(c.id);
                      setClientPickerOpen(false);
                      addToast(`Filtered commissions by ${c.name}`, 'info');
                    }}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="metrics-quad-grid">
        <div className="metric-tile" onClick={() => setCurrentView('customers')} style={{ cursor: 'pointer' }}>
          <div className="metric-tile-header">
            <span className="label-xs">REGISTRY CAPACITY</span>
            <div className="metric-tile-icon">
              <Users size={14} />
            </div>
          </div>
          <div>
            <div className="metric-tile-val-wrap">
              <span className="metric-tile-val">{clients.filter((c) => c.status === 'active').length}</span>
              <span className="metric-tile-unit">PORTFOLIOS</span>
            </div>
            <div className="metric-tile-title">Total Active Clients</div>
            <div className="metric-tile-sub">▲ {onboardedThisMonth} onboarded this month</div>
          </div>
        </div>

        <div className="metric-tile" onClick={() => setCurrentView('projects')} style={{ cursor: 'pointer' }}>
          <div className="metric-tile-header">
            <span className="label-xs">SPATIAL PROGRAM</span>
            <div className="metric-tile-icon">
              <Briefcase size={14} />
            </div>
          </div>
          <div>
            <div className="metric-tile-val-wrap">
              <span className="metric-tile-val">{projects.filter((p) => p.stage !== 'archived').length}</span>
              <span className="metric-tile-unit">SITES</span>
            </div>
            <div className="metric-tile-title">Active Projects</div>
            <div className="metric-tile-sub">
              {projects.filter((p) => p.stage === 'execution').length} in Execution,{' '}
              {projects.filter((p) => p.stage === 'design').length} in Design
            </div>
          </div>
        </div>

        <div className="metric-tile" onClick={() => setCurrentView('drawings')} style={{ cursor: 'pointer' }}>
          <div className="metric-tile-header">
            <span className="label-xs">DRAFTING REPOSITORIES</span>
            <div className="metric-tile-icon">
              <FileText size={14} />
            </div>
          </div>
          <div>
            <div className="metric-tile-val-wrap">
              <span className="metric-tile-val">{sheets.length}</span>
              <span className="metric-tile-unit">SHEETS</span>
            </div>
            <div className="metric-tile-title">Drawings &amp; Blueprints</div>
            <div className="metric-tile-sub">▲ {revisedThisWeek} revised this week</div>
          </div>
        </div>

        <div className="metric-tile" onClick={() => setCurrentView('work-site')} style={{ cursor: 'pointer' }}>
          <div className="metric-tile-header">
            <span className="label-xs">CONTRACTOR VERIFICATION</span>
            <div className="metric-tile-icon">
              <Activity size={14} />
            </div>
          </div>
          <div>
            <div className="metric-tile-val-wrap">
              <span className="metric-tile-val">{String(pendingSiteLogs).padStart(2, '0')}</span>
              <span className="metric-tile-unit">AUDITS</span>
            </div>
            <div className="metric-tile-title">Pending Site Updates</div>
            <div className="metric-tile-sub" style={{ color: 'var(--status-alert-ink)' }}>
              ! Daily site logs awaiting review
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div className="search-input-wrap" style={{ flex: 1, maxWidth: 440 }}>
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, project, phone..."
          />
        </div>

        <div className="tab-filter-group">
          <button
            className={`tab-filter-btn ${activeStageFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveStageFilter('all')}
          >
            ALL PROJECTS ({projects.length})
          </button>
          <button
            className={`tab-filter-btn ${activeStageFilter === 'execution' ? 'active' : ''}`}
            onClick={() => setActiveStageFilter('execution')}
          >
            EXECUTION PHASE
          </button>
          <button
            className={`tab-filter-btn ${activeStageFilter === 'design' ? 'active' : ''}`}
            onClick={() => setActiveStageFilter('design')}
          >
            DESIGN &amp; APPROVAL
          </button>
          <button
            className={`tab-filter-btn ${activeStageFilter === 'handover' ? 'active' : ''}`}
            onClick={() => setActiveStageFilter('handover')}
          >
            HANDOVER
          </button>
        </div>
      </div>

      {/* Active Commissions Specification Table */}
      <div className="folio-card">
        <div className="folio-card-header">
          <div>
            <span className="label-xs">REGISTRY MATRIX</span>
            <h3 style={{ fontSize: 15, marginTop: 2 }}>Active Commissions Specification</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
              Showing {filteredClients.length} of {clients.length} primary sites
            </span>
            <button className="btn btn-icon" onClick={handleExportCsv} title="Export CSV Schedule">
              <Download size={14} />
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>CLIENT IDENTITY</th>
              <th>PROJECT &amp; TYPOLOGY</th>
              <th>EXECUTION STATUS</th>
              <th>LIVE ARCHITECTURAL DRAFT</th>
              <th className="align-right">BLUEPRINTS</th>
              <th className="align-right">SPECS</th>
              <th>ADMINISTRATIVE ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="client-monogram" style={{ width: 26, height: 26, fontSize: 10 }}>
                      {client.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{client.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {client.phone}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{client.projectTitle}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-secondary)' }}>{client.typology}</div>
                </td>
                <td>
                  <span
                    className={`badge ${
                      client.tag.includes('CONSTRUCTION') || client.tag.includes('SITE')
                        ? 'badge-execution'
                        : client.tag.includes('DESIGN')
                        ? 'badge-design'
                        : 'badge-approved'
                    }`}
                  >
                    {client.tag.split('(')[0].trim()}
                  </span>
                </td>
                <td>
                  {(() => {
                    const draft = liveDraftFor(client.id);
                    return (
                      <>
                        <div style={{ fontWeight: 600, fontSize: 12.5 }}>{draft ? `${draft.title} — ${draft.rev}` : '—'}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--ink-secondary)' }}>
                          {draft ? new Date(draft.at).toLocaleString() : 'Nothing uploaded yet'}
                        </div>
                      </>
                    );
                  })()}
                </td>
                <td className="align-right" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {client.counts.blueprints}
                </td>
                <td className="align-right" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {client.counts.specs}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setCurrentView('drawings');
                      }}
                    >
                      VIEW BLUEPRINTS
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setCurrentView('work-site');
                      }}
                    >
                      SITE LOG
                    </button>
                    <button
                      className="btn btn-icon"
                      title="Download Folio Dossier"
                      onClick={() => {
                        clientsService.exportClientsCsv([client]);
                        addToast(`Exported dossier ledger for ${client.name}.`, 'info');
                      }}
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-footer">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: 'var(--ink-secondary)', letterSpacing: '0.08em' }}>
            ELEMENT DESIGN DRAFTING VERSION VERIFICATION ENGINE 2026
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" disabled>PREVIOUS</button>
            <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)', padding: '0 8px' }}>Page 1 of 1</span>
            <button className="btn btn-secondary btn-sm" disabled>NEXT</button>
          </div>
        </div>
      </div>

      {/* Split Columns: Recent Submissions & Live Field Site Log */}
      <div className="split-columns-2">
        {/* Recent Submissions */}
        <div className="folio-card">
          <div className="folio-card-header">
            <h3 style={{ fontSize: 14 }}>Recent Drawing Submissions</h3>
            <button className="btn btn-tertiary" style={{ fontSize: 11 }} onClick={() => setCurrentView('drawings')}>
              ALL BLUEPRINTS &gt;
            </button>
          </div>

          <div className="folio-card-body" style={{ padding: '12px 16px' }}>
            {recentSheets.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: 12,
                  borderBottom: '1px solid var(--border-hairline)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5, fontFamily: 'var(--font-display)' }}>{s.title}</span>
                    <span className="badge badge-approved" style={{ fontSize: 9, height: 20 }}>{s.currentRev} [LATEST]</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 4 }}>
                    {s.code} • {s.description.slice(0, 50)}...
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-tertiary)' }}>
                    UPDATED {new Date(latestAt(s)).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openLightbox(s.code, s.title, s.currentRev || 'REV 01', false, getSheetMedia(s))}
                  >
                    PREVIEW
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      const rev = s.revisions?.find((r) => r.status === 'current') || s.revisions?.[0];
                      if (!rev) return;
                      try {
                        await drawingsService.downloadRevisionPdf(rev, s);
                        addToast(`Downloaded ${rev.fileName || s.code}`, 'info');
                      } catch (err) {
                        addToast(err instanceof Error ? err.message : 'Download failed', 'error');
                      }
                    }}
                  >
                    DOWNLOAD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Site Progress Log */}
        <div className="folio-card">
          <div className="folio-card-header">
            <h3 style={{ fontSize: 14 }}>Live Site Progress Log</h3>
            <span className="badge badge-green" style={{ fontSize: 9.5 }}>{siteLogs.length} POSTS RECORDED</span>
          </div>

          <div className="folio-card-body" style={{ padding: '12px 16px' }}>
            {siteLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: 12,
                  borderBottom: '1px solid var(--border-hairline)',
                  display: 'flex',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 60,
                    backgroundColor: 'var(--bg-surface-2)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                  onClick={() => openSiteLogDrawer(log.id)}
                >
                  <MediaView path={log.photos[0]?.path} mediaType={log.photos[0]?.mediaType} alt={log.title} style={{ cursor: 'pointer' }} />
                  <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#FFF', fontSize: 8, padding: '1px 3px', fontFamily: 'var(--font-mono)' }}>
                    {log.photos.length} Files
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span className="label-xs" style={{ color: 'var(--ink-secondary)' }}>{log.category}</span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)' }}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{log.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-secondary)', lineHeight: 1.35 }}>
                    {log.body.slice(0, 80)}...
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--ink-tertiary)' }}>Logged by {log.loggedBy}</span>
                    <button
                      className="btn btn-tertiary btn-sm"
                      style={{ fontSize: 10, padding: '2px 4px' }}
                      onClick={() => openSiteLogDrawer(log.id)}
                    >
                      INSPECT LOG &gt;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
