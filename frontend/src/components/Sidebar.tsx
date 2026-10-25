import React from 'react';
import { useUiStore } from '../store/useUiStore';
import {
  LayoutGrid,
  Users,
  Briefcase,
  FileText,
  Files,
  Activity,
  UploadCloud,
  Settings,
  ExternalLink,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    openUploadModal,
    startImpersonation,
    selectedClientId,
  } = useUiStore();

  return (
    <aside className="app-sidebar">
      <div>
        <div className="sidebar-brand-header">
          <div>
            <div className="label-xs">ELEMENT DESIGN STUDIO 05</div>
            <div className="sidebar-edition">Architectural Core</div>
          </div>
          <span className="sidebar-version">v2.1</span>
        </div>

        <nav className="sidebar-nav-section">
          <div className="sidebar-nav-title label-xs">NAVIGATION SCHEDULE</div>
          <ul className="sidebar-nav-list">
            <li
              className={`sidebar-nav-item ${currentView === 'overview' ? 'active' : ''}`}
              onClick={() => setCurrentView('overview')}
            >
              <LayoutGrid size={16} />
              <span>Dashboard</span>
            </li>
            <li
              className={`sidebar-nav-item ${currentView === 'customers' ? 'active' : ''}`}
              onClick={() => setCurrentView('customers')}
            >
              <Users size={16} />
              <span>Customers</span>
            </li>
            <li
              className={`sidebar-nav-item ${currentView === 'projects' ? 'active' : ''}`}
              onClick={() => setCurrentView('projects')}
            >
              <Briefcase size={16} />
              <span>Projects</span>
            </li>
            <li
              className={`sidebar-nav-item ${currentView === 'drawings' ? 'active' : ''}`}
              onClick={() => setCurrentView('drawings')}
            >
              <FileText size={16} />
              <span>Drawings &amp; Blueprints</span>
            </li>
            <li
              className={`sidebar-nav-item ${currentView === 'documents' ? 'active' : ''}`}
              onClick={() => setCurrentView('documents')}
            >
              <Files size={16} />
              <span>Documents &amp; Specs</span>
            </li>
            <li
              className={`sidebar-nav-item ${currentView === 'work-site' ? 'active' : ''}`}
              onClick={() => setCurrentView('work-site')}
            >
              <Activity size={16} />
              <span>Work &amp; Site Updates</span>
            </li>
            <li
              className={`sidebar-nav-item ${currentView === 'upload-studio' ? 'active' : ''}`}
              onClick={() => setCurrentView('upload-studio')}
            >
              <UploadCloud size={16} />
              <span>Upload Studio</span>
            </li>
          </ul>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div
          className={`sidebar-nav-item ${currentView === 'settings' ? 'active' : ''}`}
          style={{ padding: '7px 12px' }}
          onClick={() => setCurrentView('settings')}
        >
          <Settings size={15} />
          <span>Settings</span>
        </div>

        <div
          className="sidebar-nav-item"
          style={{ padding: '7px 12px' }}
          onClick={() => startImpersonation(selectedClientId)}
        >
          <ExternalLink size={15} />
          <span>Client View (Portal)</span>
        </div>

        <div
          style={{
            padding: '10px 12px',
            fontSize: 11,
            color: 'var(--ink-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#737373' }} />
          <span>STUDIO LONDON</span>
        </div>
      </div>
    </aside>
  );
};
