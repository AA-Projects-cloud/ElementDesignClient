import { AuditLogEntry } from '../types';
import { localDb } from './mockDb';
import { isSupabaseConfigured } from './supabaseClient';
import { sbAudit } from './supabaseData';

export const auditService = {
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    if (isSupabaseConfigured) return sbAudit.getAuditLogs();
    return [...localDb.get().auditLogs];
  },

  async logAction(
    action: string,
    entity: string,
    entityId?: string,
    meta?: Record<string, any>
  ): Promise<AuditLogEntry> {
    if (isSupabaseConfigured) {
      await sbAudit.logAction(action, entity, entityId, meta);
      return { id: '', action, entity, entityId, meta, createdAt: new Date().toISOString() };
    }
    const db = localDb.get();
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      action,
      entity,
      entityId,
      ip: '127.0.0.1',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Element Design Client',
      meta,
      createdAt: new Date().toISOString()
    };
    db.auditLogs.unshift(entry);
    localDb.save();
    return entry;
  }
};
