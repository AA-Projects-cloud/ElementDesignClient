import React, { useState, useEffect } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';
import { projectsService } from '../services/projectsService';
import { drawingsService, getSheetMedia } from '../services/drawingsService';
import { siteLogsService } from '../services/siteLogsService';
import { Search, User, Briefcase, FileText, Activity } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen, setCurrentView, setSelectedClientId, openLightbox } = useUiStore();
  const [query, setQuery] = useState('');

  // Handle keyboard shortcut ⌘K / Ctrl+K & Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: clientsService.getClients });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsService.getProjects });
  const { data: sheets = [] } = useQuery({ queryKey: ['sheets'], queryFn: () => drawingsService.getSheets() });
  const { data: logs = [] } = useQuery({ queryKey: ['siteLogs'], queryFn: () => siteLogsService.getSiteLogs() });

  if (!commandPaletteOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredClients = q ? clients.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)) : clients.slice(0, 3);
  const filteredProjects = q ? projects.filter((p) => p.name.toLowerCase().includes(q) || p.typology.toLowerCase().includes(q)) : projects.slice(0, 3);
  const filteredSheets = q ? sheets.filter((s) => s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) : sheets.slice(0, 3);
  const filteredLogs = q ? logs.filter((l) => l.title.toLowerCase().includes(q) || l.body.toLowerCase().includes(q)) : logs.slice(0, 2);

  return (
    <div
      className="modal-overlay active"
      onClick={() => setCommandPaletteOpen(false)}
      style={{ alignItems: 'flex-start', paddingTop: 80 }}
    >
      <div
        className="modal-sheet"
        style={{ maxWidth: 620 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border-hairline)', gap: 10 }}>
          <Search size={18} color="var(--ink-secondary)" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, projects, drawings, site inspection logs..."
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              background: 'transparent',
            }}
          />
          <span className="kbd-shortcut">ESC</span>
        </div>

        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 14 }}>
          {/* Clients Section */}
          <div style={{ marginBottom: 14 }}>
            <div className="label-xs" style={{ marginBottom: 6 }}>CLIENTS</div>
            {filteredClients.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                className="table-row-hover"
                onClick={() => {
                  setSelectedClientId(c.id);
                  setCurrentView('customers');
                  setCommandPaletteOpen(false);
                }}
              >
                <User size={14} color="var(--ink-secondary)" />
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>({c.phone}) • {c.projectTitle}</span>
              </div>
            ))}
          </div>

          {/* Projects Section */}
          <div style={{ marginBottom: 14 }}>
            <div className="label-xs" style={{ marginBottom: 6 }}>PROJECTS</div>
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                onClick={() => {
                  setCurrentView('projects');
                  setCommandPaletteOpen(false);
                }}
              >
                <Briefcase size={14} color="var(--ink-secondary)" />
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>{p.typology} • {p.refCode}</span>
              </div>
            ))}
          </div>

          {/* Drawings Section */}
          <div style={{ marginBottom: 14 }}>
            <div className="label-xs" style={{ marginBottom: 6 }}>DRAWINGS &amp; BLUEPRINTS</div>
            {filteredSheets.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                onClick={() => {
                  openLightbox(s.code, s.title, s.currentRev || 'REV 01', false, getSheetMedia(s));
                  setCommandPaletteOpen(false);
                }}
              >
                <FileText size={14} color="var(--ink-secondary)" />
                <span style={{ fontWeight: 600 }}>{s.code}: {s.title}</span>
                <span className="badge badge-approved" style={{ height: 16, fontSize: 8 }}>{s.currentRev}</span>
              </div>
            ))}
          </div>

          {/* Site Logs Section */}
          <div>
            <div className="label-xs" style={{ marginBottom: 6 }}>SITE PROGRESS LOGS</div>
            {filteredLogs.map((l) => (
              <div
                key={l.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                onClick={() => {
                  setCurrentView('work-site');
                  setCommandPaletteOpen(false);
                }}
              >
                <Activity size={14} color="var(--ink-secondary)" />
                <span style={{ fontWeight: 600 }}>{l.title}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>({l.category})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
