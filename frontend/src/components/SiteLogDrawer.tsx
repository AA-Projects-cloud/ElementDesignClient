import React from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteLogsService } from '../services/siteLogsService';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { MediaView } from './MediaView';
import { useAuthStore } from '../store/useAuthStore';

export const SiteLogDrawer: React.FC = () => {
  const { siteLogDrawerState, closeSiteLogDrawer, addToast } = useUiStore();
  const queryClient = useQueryClient();

  const isClientUser = useAuthStore((s) => s.user?.role) === 'client';
  const logId = siteLogDrawerState.logId;

  const { data: logs = [] } = useQuery({
    queryKey: ['siteLogs'],
    queryFn: () => siteLogsService.getSiteLogs(),
  });

  const activeLog = logs.find((l) => l.id === logId);

  const reviewMutation = useMutation({
    mutationFn: async (status: 'approved' | 'rejected') => {
      if (!logId) return;
      return await siteLogsService.reviewSiteLog(logId, status);
    },
    onSuccess: (updatedLog) => {
      queryClient.invalidateQueries({ queryKey: ['siteLogs'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      closeSiteLogDrawer();
      addToast(`Site verification marked as ${updatedLog?.status.toUpperCase()}!`, 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Review failed', 'error');
    },
  });

  if (!siteLogDrawerState.isOpen || !activeLog) return null;

  return (
    <div className="modal-overlay active" onClick={closeSiteLogDrawer}>
      <div
        className="modal-sheet"
        style={{
          maxWidth: 600,
          marginRight: 0,
          borderRadius: '4px 0 0 4px',
          height: '100vh',
          maxHeight: '100vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="label-xs">{activeLog.category}</span>
            <h3 style={{ fontSize: 17, marginTop: 2 }}>{activeLog.title}</h3>
          </div>
          <button className="btn btn-icon" onClick={closeSiteLogDrawer}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)' }}>
            Logged by {activeLog.loggedBy} • {new Date(activeLog.createdAt).toLocaleString()}
          </div>

          <p style={{ fontSize: 13.5, lineHeight: 1.5 }}>{activeLog.body}</p>

          {activeLog.testReport && (
            <div style={{ backgroundColor: 'var(--bg-surface-1)', padding: 12, borderRadius: 4, border: '1px solid var(--border-hairline)' }}>
              <span className="label-xs">TECHNICAL FIELD REPORT</span>
              <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>
                {activeLog.testReport.title}: {activeLog.testReport.val}
              </div>
            </div>
          )}

          <div>
            <span className="label-xs" style={{ display: 'block', marginBottom: 8 }}>
              SITE INSPECTION PHOTOS & VIDEOS ({activeLog.photos.length})
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {activeLog.photos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    height: 160,
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid var(--border-hairline)',
                    position: 'relative',
                    backgroundColor: 'var(--bg-surface-2)',
                  }}
                >
                  <MediaView path={photo.path} mediaType={photo.mediaType} mode={photo.mediaType === 'video' ? 'full' : 'thumb'} alt={photo.caption} style={{ objectFit: 'cover' }} />
                  <div className="site-photo-caption-bar">
                    <span>{photo.caption}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11.5, color: 'var(--ink-secondary)' }}>
            Current Status: <strong>{activeLog.status.toUpperCase()}</strong>
          </span>

          {!isClientUser && <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ color: '#A63820' }}
              onClick={() => reviewMutation.mutate('rejected')}
              disabled={reviewMutation.isPending}
            >
              <XCircle size={14} />
              REJECT
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => reviewMutation.mutate('approved')}
              disabled={reviewMutation.isPending}
            >
              <CheckCircle2 size={14} />
              APPROVE &amp; CLEAR
            </button>
          </div>}
        </div>
      </div>
    </div>
  );
};
