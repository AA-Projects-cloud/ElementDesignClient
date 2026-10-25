import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';
import { X, ShieldAlert, KeyRound } from 'lucide-react';

export const ManageAccessModal: React.FC = () => {
  const { manageAccessModalState, closeManageAccessModal, openResetPinModal, addToast } = useUiStore();
  const queryClient = useQueryClient();

  const clientId = manageAccessModalState.clientId;

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => (clientId ? clientsService.getClientById(clientId) : undefined),
    enabled: Boolean(clientId),
  });

  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [watermarkStrict, setWatermarkStrict] = useState(true);

  React.useEffect(() => {
    if (client) {
      setStatus(client.status);
      setWatermarkStrict(client.watermarkStrict);
    }
  }, [client]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!clientId) return;
      return await clientsService.updateClientPermissions(clientId, {
        status,
        watermarkStrict,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      closeManageAccessModal();
      addToast('Client access permissions updated successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Update failed', 'error');
    },
  });

  const handleResetPin = async () => {
    if (!clientId || !client) return;
    const newPin = await clientsService.resetClientPin(clientId);
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    closeManageAccessModal();
    openResetPinModal(newPin, client.name);
  };

  if (!manageAccessModalState.isOpen || !client) return null;

  return (
    <div className="modal-overlay active" onClick={closeManageAccessModal}>
      <div className="modal-sheet" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="label-xs">PERMISSIONS &amp; CREDENTIALS</span>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Manage Access: {client.name}</h3>
          </div>
          <button className="btn btn-icon" onClick={closeManageAccessModal}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Client Portal Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
            >
              <option value="active">Active (Access Allowed)</option>
              <option value="suspended">Suspended (Access Temporarily Blocked)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, backgroundColor: 'var(--bg-surface-1)', borderRadius: 4 }}>
            <input
              type="checkbox"
              id="watermark-toggle"
              checked={watermarkStrict}
              onChange={(e) => setWatermarkStrict(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#737373' }}
            />
            <label htmlFor="watermark-toggle" style={{ fontSize: 12.5, fontWeight: 600 }}>
              Enforce Dynamic Watermarking on all PDF downloads
            </label>
          </div>

          <div style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 14 }}>
            <span className="label-xs" style={{ display: 'block', marginBottom: 8 }}>CREDENTIAL OPERATIONS</span>
            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={handleResetPin}>
              <KeyRound size={15} />
              Generate New Salted OTP PIN
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeManageAccessModal}>
            CANCEL
          </button>
          <button className="btn btn-primary" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
};
