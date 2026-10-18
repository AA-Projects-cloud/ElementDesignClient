import React, { useState, useEffect } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';
import { notificationsService } from '../services/notificationsService';
import { useAuthStore } from '../store/useAuthStore';
import { Search, Bell, Clock, User, LogOut, Settings as SettingsIcon } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeWorkspace,
    setActiveWorkspace,
    selectedClientId,
    setCommandPaletteOpen,
    setCurrentView,
    addToast,
  } = useUiStore();

  const { user, logout } = useAuthStore();
  const isClientUser = user?.role === 'client';
  const initials = (user?.name || 'U').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('11:42 BST • STUDIO 01');

  // Clock updating every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${mins} BST • STUDIO 01`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getClients,
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const { data: notifications = [], refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getNotifications,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAllRead = async () => {
    await notificationsService.markAllAsRead();
    refetchNotifs();
    addToast('All notifications marked as read', 'info');
  };

  return (
    <header className="global-header">
      <div className="header-left">
        <div className="brand-badge" onClick={() => { setActiveWorkspace('admin'); setCurrentView('overview'); }} style={{ cursor: 'pointer' }}>
          <div className="brand-symbol">E</div>
          <div>
            <span className="brand-title">ELEMENT DESIGN</span>
          </div>
        </div>

        {/* Workspace Mode Switcher (admins only) */}
        {!isClientUser && <div className="workspace-switcher">
          <button
            className={`workspace-btn ${activeWorkspace === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveWorkspace('admin')}
          >
            ADMIN WORKSPACE
          </button>
          <button
            className={`workspace-btn ${activeWorkspace === 'client' ? 'active' : ''}`}
            onClick={() => setActiveWorkspace('client')}
          >
            CUSTOMER PORTAL ({selectedClient ? selectedClient.name.toUpperCase() : 'CLIENT'})
          </button>
        </div>}
      </div>

      <div className="header-center">
        {!isClientUser && <div className="search-input-wrap" onClick={() => setCommandPaletteOpen(true)} style={{ cursor: 'pointer' }}>
          <Search size={15} />
          <input
            type="text"
            readOnly
            className="form-input"
            style={{ cursor: 'pointer' }}
            placeholder="Search architectural schedules, client portfolios, blueprints..."
          />
          <span className="kbd-shortcut">⌘K</span>
        </div>}
      </div>

      <div className="header-right">
        <div className="studio-status-indicator">
          <span className="status-live-dot" />
          <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
          <span>{timeStr}</span>
        </div>

        {/* Notification Bell Dropdown (admins only: notifications are studio-wide) */}
        {!isClientUser && <div style={{ position: 'relative' }}>
          <button
            className="btn btn-icon"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#A63820',
                }}
              />
            )}
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: 'absolute',
                top: 42,
                right: 0,
                width: 320,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--ink-primary)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-overlay)',
                zIndex: 500,
                padding: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="label-xs">NOTIFICATIONS ({unreadCount} NEW)</span>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-tertiary"
                    style={{ fontSize: 10, padding: 0 }}
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'var(--ink-secondary)' }}>
                    No pending notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: n.readAt ? 'transparent' : 'var(--bg-surface-1)',
                        border: '1px solid var(--border-hairline)',
                        borderRadius: 3,
                        cursor: 'pointer',
                      }}
                      onClick={async () => {
                        await notificationsService.markAsRead(n.id);
                        refetchNotifs();
                        if (n.link) {
                          if (n.link.includes('drawings')) setCurrentView('drawings');
                          else if (n.link.includes('site')) setCurrentView('work-site');
                          else if (n.link.includes('customers')) setCurrentView('customers');
                        }
                        setNotificationsOpen(false);
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 2 }}>{n.body}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>}

        {/* User Profile Menu */}
        <div style={{ position: 'relative' }}>
          <div
            className="user-profile-widget"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="user-avatar-badge">{initials}</div>
            <div className="user-meta">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{isClientUser ? 'CLIENT' : 'ADMINISTRATOR'}</span>
            </div>
          </div>

          {userMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 42,
                right: 0,
                width: 190,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--ink-primary)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-overlay)',
                zIndex: 500,
                padding: 6,
              }}
            >
              {!isClientUser && (
                <div
                  style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={() => { setCurrentView('settings'); setUserMenuOpen(false); }}
                >
                  <SettingsIcon size={14} />
                  <span>Studio Settings</span>
                </div>
              )}
              <div
                style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#A63820' }}
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
