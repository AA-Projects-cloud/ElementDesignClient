import { OutboxMessage } from '../../types';
import { localDb } from '../mockDb';
import { auditService } from '../auditService';

export interface SendMessageParams {
  channel: 'whatsapp' | 'email' | 'sms';
  to: string;
  template?: string;
  payload: Record<string, any>;
}

export const messagingService = {
  async send(params: SendMessageParams): Promise<{ success: boolean; outboxMessage: OutboxMessage; note: string }> {
    const db = localDb.get();
    const newId = `msg-${Date.now()}`;

    const outboxMessage: OutboxMessage = {
      id: newId,
      channel: params.channel,
      to: params.to,
      payload: params.payload,
      status: 'queued',
      createdAt: new Date().toISOString()
    };

    db.outbox.unshift(outboxMessage);
    localDb.save();

    await auditService.logAction('DISPATCH_NOTIFICATION', 'outbox', newId, {
      channel: params.channel,
      to: params.to
    });

    const note = 'Queued in Outbox (no provider connected)';

    return {
      success: true,
      outboxMessage,
      note
    };
  },

  async getOutbox(): Promise<OutboxMessage[]> {
    return [...localDb.get().outbox];
  }
};
