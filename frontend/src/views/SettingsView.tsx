import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery } from '@tanstack/react-query';
import { messagingService } from '../services/messaging/messagingService';
import { auditService } from '../services/auditService';
import { clientsService } from '../services/clientsService';
import { projectsService } from '../services/projectsService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Settings, Save, Download, RotateCcw, Shield, Mail, MessageSquare } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { addToast } = useUiStore();

  const [studioName, setStudioName] = useState('ELEMENT DESIGN');
  const [timezone, setTimezone] = useState('BST (London) / IST (Mumbai)');
  const [watermarkTemplate, setWatermarkTemplate] = useState('VERIFIED CLIENT COPY • {CLIENT_NAME} • {TIMESTAMP}');

  const { data: outbox = [], refetch: refetchOutbox } = useQuery({
    queryKey: ['outbox'],
    queryFn: messagingService.getOutbox,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: auditService.getAuditLogs,
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Studio configuration and watermark template saved.', 'success');
  };

  const handleExportAllZip = async () => {
    addToast('Generating complete studio database & audit export (ZIP)...', 'info');
    const zip = new JSZip();

    const clients = await clientsService.getClients();
    const projects = await projectsService.getProjects();

    zip.file('clients_ledger.json', JSON.stringify(clients, null, 2));
    zip.file('projects_register.json', JSON.stringify(projects, null, 2));
    zip.file('audit_log.json', JSON.stringify(auditLogs, null, 2));
    zip.file('outbox_messages.json', JSON.stringify(outbox, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `element-design-complete-export-${new Date().toISOString().split('T')[0]}.zip`);
    addToast('Complete database archive exported.', 'success');
  };

  return (
    <section className="view-panel active">
      <div className="view-header">
        <div className="view-header-titles">
          <div className="view-header-folio">
            <span>SYSTEM PREFERENCES &amp; OUTBOX TELEMETRY</span>
          </div>
          <h1 className="view-header-title">Studio Settings</h1>
          <p className="view-header-sub">
            Studio branding, global watermarking rules, messaging outbox monitor, and full system backup export.
          </p>
        </div>

        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={handleExportAllZip}>
            <Download size={14} />
            EXPORT ALL DATA (ZIP)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Settings Form */}
        <div className="folio-card">
          <div className="folio-card-header">
            <h3 style={{ fontSize: 14 }}>General Studio Configuration</h3>
          </div>
          <form onSubmit={handleSaveSettings} className="folio-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Studio Brand Identity</label>
              <input
                type="text"
                className="form-input"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Operating Timezone Synchronization</label>
              <input
                type="text"
                className="form-input"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Client Watermark Format Template</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={watermarkTemplate}
                onChange={(e) => setWatermarkTemplate(e.target.value)}
                required
              />
              <span style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 4 }}>
                Variables: &#123;CLIENT_NAME&#125;, &#123;TIMESTAMP&#125;, &#123;REF_CODE&#125;
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              <Save size={14} />
              SAVE SETTINGS
            </button>
          </form>
        </div>

        {/* Messaging Outbox Queue Monitor */}
        <div className="folio-card">
          <div className="folio-card-header">
            <h3 style={{ fontSize: 14 }}>Messaging Outbox Queue ({outbox.length})</h3>
            <button className="btn btn-tertiary" style={{ fontSize: 11 }} onClick={() => refetchOutbox()}>
              REFRESH
            </button>
          </div>

          <div className="folio-card-body" style={{ padding: 0 }}>
            {outbox.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-secondary)', fontSize: 12 }}>
                No active notifications in outbox queue.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>CHANNEL</th>
                    <th>RECIPIENT</th>
                    <th>STATUS</th>
                    <th>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {outbox.map((msg) => (
                    <tr key={msg.id}>
                      <td style={{ fontWeight: 700 }}>{msg.channel.toUpperCase()}</td>
                      <td style={{ fontSize: 12 }}>{msg.to}</td>
                      <td>
                        <span className="badge badge-active">{msg.status.toUpperCase()}</span>
                      </td>
                      <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
