import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '../services/projectsService';
import { clientsService } from '../services/clientsService';
import { pdfBundleService } from '../services/pdfBundleService';
import { drawingsService } from '../services/drawingsService';
import { documentsService } from '../services/documentsService';
import { siteLogsService } from '../services/siteLogsService';
import {
  Download,
  Plus,
  Send,
  FileText,
  KeyRound,
  ExternalLink,
  MessageSquare,
  Phone,
  Mail,
  Shield,
  Layers,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const {
    selectedClientId,
    setSelectedClientId,
    openAddClientModal,
    openManageAccessModal,
    openSendNotificationModal,
    startImpersonation,
    openUploadModal,
    openResetPinModal,
    addToast,
  } = useUiStore();

  const [dirFilter, setDirFilter] = useState<'all' | 'execution' | 'design' | 'handover'>('all');
  const [phoneLookup, setPhoneLookup] = useState('');
  const [bundleLoading, setBundleLoading] = useState(false);

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsService.getProjects });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getClients,
  });

  const { data: sheets = [] } = useQuery({ queryKey: ['sheets'], queryFn: () => drawingsService.getSheets() });
  const { data: documents = [] } = useQuery({ queryKey: ['documents'], queryFn: () => documentsService.getDocuments() });
  const { data: siteLogs = [] } = useQuery({ queryKey: ['siteLogs'], queryFn: () => siteLogsService.getSiteLogs() });

  const inPhase = (tag: string, phase: 'execution' | 'design' | 'handover') =>
    phase === 'execution'
      ? tag.includes('CONSTRUCTION') || tag.includes('SITE')
      : phase === 'design'
      ? tag.includes('DESIGN')
      : tag.includes('HANDOVER');

  // Live figures for the KPI tiles
  const activeCount = clients.filter((c) => c.status === 'active').length;
  const activePct = clients.length ? ((activeCount / clients.length) * 100).toFixed(1) : '0';
  const pendingLogs = siteLogs.filter((l) => l.status === 'pending');
  const urgentLogs = pendingLogs.filter((l) => Date.now() - new Date(l.createdAt).getTime() > 24 * 60 * 60 * 1000);
  const streamCount = siteLogs.filter((l) => l.photos.length > 0).length;
  const storageBytes =
    sheets.reduce((sum, sh) => sum + (sh.revisions || []).reduce((a, r) => a + (r.sizeBytes || 0), 0), 0) +
    documents.reduce((sum, d) => sum + (d.sizeBytes || 0), 0);
  const [storageVal, storageUnit] =
    storageBytes >= 1024 ** 3
      ? [(storageBytes / 1024 ** 3).toFixed(2), 'GB']
      : storageBytes >= 1024 ** 2
      ? [(storageBytes / 1024 ** 2).toFixed(1), 'MB']
      : [String(Math.round(storageBytes / 1024)), 'KB'];

  const filteredClients = clients.filter((c) => {
    const matchesFilter = dirFilter === 'all' ? true : inPhase(c.tag, dirFilter);

    const matchesSearch =
      phoneLookup === '' ||
      c.phone.includes(phoneLookup) ||
      c.name.toLowerCase().includes(phoneLookup.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const handleExportLedger = () => {
    clientsService.exportClientsCsv(filteredClients);
    addToast('Client accounts ledger exported as CSV.', 'info');
  };

  const handleGenerateBundlePdf = async () => {
    if (!selectedClient) return;
    setBundleLoading(true);
    addToast(`Compiling project bundle PDF for ${selectedClient.projectTitle}...`, 'info');
    try {
      await pdfBundleService.generateProjectBundlePdf(
        projects.find((p) => p.clientId === selectedClient.id)?.id || '',
        selectedClient.name,
        selectedClient.projectTitle || 'Project'
      );
      addToast('Project bundle PDF generated & downloaded.', 'success');
    } catch (e: any) {
      addToast(e.message || 'Bundle generation failed', 'error');
    } finally {
      setBundleLoading(false);
    }
  };

  const handleResetPinDirect = async () => {
    if (!selectedClient) return;
    const confirmReset = window.confirm(
      `Are you sure you want to reset the security PIN for ${selectedClient.name}? This will invalidate active portal sessions.`
    );
    if (!confirmReset) return;

    const newPin = await clientsService.resetClientPin(selectedClient.id);
    openResetPinModal(newPin, selectedClient.name);
  };

  return (
    <section className="view-panel active">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-titles">
          <div className="view-header-folio">
            <span className="badge badge-approved" style={{ height: 20 }}>
              {activeCount} ACTIVE ACCOUNTS
            </span>
            <span>AUTHORISED COMMISSIONING LEDGER</span>
          </div>
          <h1 className="view-header-title">Customer Directory &amp; Access Control</h1>
          <p className="view-header-sub">
            Authorised architectural commissioning ledger, real-time client credentials, spatial permission keys, and synchronised digital drawing distribution schedules.
          </p>
        </div>

        <div className="view-header-actions">
          <button className="btn btn-secondary" onClick={handleExportLedger}>
            <Download size={14} />
            EXPORT LEDGER
          </button>
          <button className="btn btn-primary" onClick={openAddClientModal}>
            <Plus size={14} />
            + ADD NEW CLIENT
          </button>
        </div>
      </div>

      {/* KPI Quad Metric Bar */}
      <div className="metrics-quad-grid">
        <div className="metric-tile">
          <span className="label-xs">LIVE PORTALS ACTIVE</span>
          <div className="metric-tile-val-wrap" style={{ marginTop: 8 }}>
            <span className="metric-tile-val">{activeCount} / {clients.length}</span>
            <span className="badge badge-green" style={{ fontSize: 9, height: 20 }}>{activePct}%</span>
          </div>
          <div className="metric-tile-sub" style={{ marginTop: 6 }}>Single-project isolation active</div>
        </div>

        <div className="metric-tile">
          <span className="label-xs">PENDING APPROVALS</span>
          <div className="metric-tile-val-wrap" style={{ marginTop: 8 }}>
            <span className="metric-tile-val">{String(pendingLogs.length).padStart(2, '0')}</span>
            {urgentLogs.length > 0 && (
              <span className="badge badge-execution" style={{ fontSize: 9, height: 20 }}>{urgentLogs.length} URGENT</span>
            )}
          </div>
          <div className="metric-tile-sub" style={{ marginTop: 6 }}>Site logs awaiting approval</div>
        </div>

        <div className="metric-tile">
          <span className="label-xs">ACTIVE SITE STREAMS</span>
          <div className="metric-tile-val-wrap" style={{ marginTop: 8 }}>
            <span className="metric-tile-val">{streamCount}</span>
            <span className="metric-tile-unit">Nodes</span>
          </div>
          <div className="metric-tile-sub" style={{ marginTop: 6 }}>Site logs with photo/video links</div>
        </div>

        <div className="metric-tile">
          <span className="label-xs">STORAGE COMMITTED</span>
          <div className="metric-tile-val-wrap" style={{ marginTop: 8 }}>
            <span className="metric-tile-val">{storageVal}</span>
            <span className="metric-tile-unit">{storageUnit}</span>
          </div>
          <div className="metric-tile-sub" style={{ marginTop: 6 }}>Uploaded drawings &amp; documents</div>
        </div>
      </div>

      {/* Filter Chips & Quick Phone Lookup */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div className="tab-filter-group">
          <button
            className={`tab-filter-btn ${dirFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDirFilter('all')}
          >
            ALL ({clients.length})
          </button>
          <button
            className={`tab-filter-btn ${dirFilter === 'execution' ? 'active' : ''}`}
            onClick={() => setDirFilter('execution')}
          >
            ACTIVE CONSTRUCTION ({clients.filter((c) => inPhase(c.tag, 'execution')).length})
          </button>
          <button
            className={`tab-filter-btn ${dirFilter === 'design' ? 'active' : ''}`}
            onClick={() => setDirFilter('design')}
          >
            DESIGN PHASE ({clients.filter((c) => inPhase(c.tag, 'design')).length})
          </button>
          <button
            className={`tab-filter-btn ${dirFilter === 'handover' ? 'active' : ''}`}
            onClick={() => setDirFilter('handover')}
          >
            READY FOR HANDOVER ({clients.filter((c) => inPhase(c.tag, 'handover')).length})
          </button>
        </div>

        <div className="search-input-wrap" style={{ minWidth: 320 }}>
          <input
            type="text"
            className="form-input"
            value={phoneLookup}
            onChange={(e) => setPhoneLookup(e.target.value)}
            placeholder="Search by customer name or phone number..."
          />
        </div>
      </div>

      {/* Customer Directory Layout (Cards List + Inspector) */}
      <div className="customer-directory-layout">
        {/* Left Column: Customer Cards */}
        <div>
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className={`client-folio-card ${selectedClient?.id === client.id ? 'selected' : ''}`}
              onClick={() => setSelectedClientId(client.id)}
            >
              <div className="client-folio-card-top">
                <div className="client-identity-lockup">
                  <div className="client-monogram">
                    {client.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)' }}>
                      <a href={`tel:${client.phone}`} style={{ textDecoration: 'underline', marginRight: 6 }}>
                        {client.phone}
                      </a>
                      • {client.refId}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a
                    href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hello ${client.name}, Element Design has updated your project folio.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-icon"
                    title="Open WhatsApp chat"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageSquare size={13} />
                  </a>
                  <span
                    className={`badge ${
                      client.tag.includes('CONSTRUCTION') || client.tag.includes('SITE')
                        ? 'badge-execution'
                        : client.tag.includes('DESIGN')
                        ? 'badge-design'
                        : 'badge-approved'
                    }`}
                  >
                    {client.tag}
                  </span>
                </div>
              </div>

              <div className="client-folio-card-body">
                <div className="client-thumbnail-box">
                  <svg width="100%" height="100%" viewBox="0 0 140 100" style={{ background: '#EFEAE1' }}>
                    <rect x="15" y="15" width="110" height="70" fill="none" stroke="#D8C9B8" strokeWidth="1.5" />
                    <line x1="15" y1="50" x2="125" y2="50" stroke="#D8C9B8" strokeDasharray="4 2" />
                    <circle cx="70" cy="50" r="14" fill="#E8DED0" stroke="#555555" strokeWidth="1" />
                    <text x="70" y="54" fontSize="8" fontFamily="'Space Grotesk'" fontWeight="700" textAnchor="middle" fill="#555555">
                      INTERIOR
                    </text>
                  </svg>
                  <span className="client-thumb-tag">{client.areaSqFt} SQ FT</span>
                </div>

                <div className="client-card-info">
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>
                      {client.typology}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
                      {client.phase} • Lead: {client.leadArchitect}
                    </div>
                  </div>

                  <div className="client-card-kpis">
                    <div className="client-card-kpi-item">
                      <span className="client-card-kpi-val">{client.counts.blueprints}</span>
                      <span className="client-card-kpi-lbl">Blueprints</span>
                    </div>
                    <div className="client-card-kpi-item">
                      <span className="client-card-kpi-val">{client.counts.specs}</span>
                      <span className="client-card-kpi-lbl">Docs &amp; Specs</span>
                    </div>
                    <div className="client-card-kpi-item">
                      <span className="client-card-kpi-val">{client.counts.siteLogs}</span>
                      <span className="client-card-kpi-lbl">Site Logs</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="client-card-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startImpersonation(client.id);
                  }}
                >
                  VIEW PORTAL AS {client.name.split(' ')[0].toUpperCase()}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openUploadModal();
                  }}
                >
                  UPLOAD FILE
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openManageAccessModal(client.id);
                  }}
                >
                  MANAGE ACCESS
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Client Inspector Panel */}
        {selectedClient && (
          <div className="client-inspector-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-xs">CLIENT INSPECTOR &amp; ACCESS</span>
              <span className="badge badge-active">{selectedClient.status.toUpperCase()}</span>
            </div>

            <div style={{ marginTop: 14 }}>
              <h2 style={{ fontSize: 18, marginBottom: 2 }}>{selectedClient.name}</h2>
              <div style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
                {selectedClient.projectTitle} • {selectedClient.typology}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => openSendNotificationModal(selectedClient.id)}
              >
                <Send size={14} />
                Send Drawing Notification (SMS/WhatsApp)
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={handleGenerateBundlePdf}
                disabled={bundleLoading}
              >
                <FileText size={14} />
                {bundleLoading ? 'Compiling Bundle PDF...' : 'Generate Project Bundle PDF'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start' }}
                onClick={handleResetPinDirect}
              >
                <KeyRound size={14} />
                Reset Customer PIN / OTP Access
              </button>
            </div>

            {/* Authentication Metrics */}
            <div className="inspector-section">
              <span className="label-xs">AUTHENTICATION METRICS</span>
              <div className="inspector-tile">
                <div className="inspector-credential-row">
                  <span className="credential-key">Portal Username</span>
                  <span className="credential-val">{selectedClient.security.username}</span>
                </div>
                <div className="inspector-credential-row">
                  <span className="credential-key">Access Security PIN</span>
                  <span className="credential-val">••••••</span>
                </div>
                <div className="inspector-credential-row">
                  <span className="credential-key">Last Client Login</span>
                  <span className="credential-val">{selectedClient.security.lastLogin}</span>
                </div>
                <div className="inspector-credential-row">
                  <span className="credential-key">Drawing Authorization</span>
                  <span className="credential-val">{selectedClient.security.authStatus}</span>
                </div>
              </div>
            </div>

            {/* Watermark Protection Note */}
            <div
              className="inspector-section"
              style={{
                backgroundColor: 'var(--bg-primary)',
                padding: 12,
                borderRadius: 4,
                marginTop: 14,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={13} />
                <span>SAFE-BUILD CLIENT ENFORCEMENT</span>
              </div>
              <p style={{ fontSize: 10.5, color: 'var(--ink-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                All blueprints displayed in client portal automatically bear dynamic identity watermark and project privacy lock.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
