import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { messagingService } from '../services/messaging/messagingService';
import { Copy, Check, MessageSquare, Mail, X } from 'lucide-react';

export const ResetPinModal: React.FC = () => {
  const { resetPinModalState, closeResetPinModal, addToast } = useUiStore();
  const [copied, setCopied] = useState(false);

  if (!resetPinModalState.isOpen || !resetPinModalState.pin) return null;

  const { pin, clientName } = resetPinModalState;

  const handleCopy = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    addToast(`PIN [${pin}] copied to clipboard.`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = async () => {
    await messagingService.send({
      channel: 'whatsapp',
      to: clientName || 'Client',
      payload: { pin, message: `Your temporary Element Design Portal security PIN is: ${pin}` },
    });
    addToast(`PIN notification dispatched to ${clientName} (WhatsApp).`, 'success');
  };

  const handleSendEmail = async () => {
    await messagingService.send({
      channel: 'email',
      to: clientName || 'Client',
      payload: { pin, subject: 'Your Element Design Portal Security Access PIN' },
    });
    addToast(`PIN security email queued for ${clientName}.`, 'success');
  };

  return (
    <div className="modal-overlay active" onClick={closeResetPinModal}>
      <div className="modal-sheet" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="label-xs">SECURITY ACCESS CREDENTIALS</span>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Temporary Client PIN</h3>
          </div>
          <button className="btn btn-icon" onClick={closeResetPinModal}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginBottom: 16 }}>
            A temporary 4-digit security PIN has been generated for <strong>{clientName}</strong>. This PIN is hashed in the database and will only be displayed once.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              backgroundColor: 'var(--bg-surface-1)',
              border: '2px dashed var(--ink-primary)',
              borderRadius: 6,
              padding: '16px 28px',
              margin: '0 auto 16px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: 8,
                color: 'var(--ink-primary)',
              }}
            >
              {pin}
            </span>
            <button className="btn btn-icon" onClick={handleCopy} title="Copy PIN">
              {copied ? <Check size={16} color="green" /> : <Copy size={16} />}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleSendWhatsApp}>
              <MessageSquare size={13} />
              DISPATCH WHATSAPP
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleSendEmail}>
              <Mail size={13} />
              DISPATCH EMAIL
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={closeResetPinModal}>
            CONFIRM &amp; CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
