import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';
import { messagingService } from '../services/messaging/messagingService';
import { X, Send } from 'lucide-react';

export const SendNotificationModal: React.FC = () => {
  const { sendNotificationModalState, closeSendNotificationModal, addToast } = useUiStore();
  const clientId = sendNotificationModalState.clientId;

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => (clientId ? clientsService.getClientById(clientId) : undefined),
    enabled: Boolean(clientId),
  });

  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [message, setMessage] = useState(
    'New architectural drawing revisions for your residence have been published to your client folio.'
  );
  const [isSending, setIsSending] = useState(false);

  if (!sendNotificationModalState.isOpen || !client) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const res = await messagingService.send({
      channel,
      to: channel === 'email' ? client.email : client.phone,
      payload: { clientName: client.name, message },
    });

    setIsSending(false);
    closeSendNotificationModal();
    addToast(`Dispatched via ${channel.toUpperCase()}: ${res.note}`, 'success');
  };

  return (
    <div className="modal-overlay active" onClick={closeSendNotificationModal}>
      <div className="modal-sheet" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="label-xs">MESSAGING OUTBOX</span>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Dispatch Client Notification</h3>
          </div>
          <button className="btn btn-icon" onClick={closeSendNotificationModal}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSend}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>
              Recipient: <strong>{client.name}</strong> ({client.phone})
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Channel</label>
              <select
                className="form-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
              >
                <option value="whatsapp">WhatsApp (Direct Deep Link &amp; Twilio)</option>
                <option value="sms">SMS Text Alert (Twilio Carrier)</option>
                <option value="email">Email Notification (Resend SMTP)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notification Message</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeSendNotificationModal}>
              CANCEL
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSending}>
              <Send size={14} />
              {isSending ? 'DISPATCHING...' : 'DISPATCH MESSAGE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
