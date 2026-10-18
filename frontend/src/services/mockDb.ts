import { Client, Project, DrawingSheet, Revision, ProcessingJob, SiteLog, ProjectDocument, NotificationItem, OutboxMessage, CallbackRequest, AuditLogEntry } from '../types';

const STORAGE_KEY = 'element_design_db_v3';

interface LocalDatabase {
  clients: Client[];
  projects: Project[];
  drawingSheets: DrawingSheet[];
  revisions: Revision[];
  processingJobs: ProcessingJob[];
  siteLogs: SiteLog[];
  documents: ProjectDocument[];
  notifications: NotificationItem[];
  outbox: OutboxMessage[];
  callbackRequests: CallbackRequest[];
  revisionAcks: { revisionId: string; clientId: string; ackedAt: string }[];
  auditLogs: AuditLogEntry[];
}

const INITIAL_DB: LocalDatabase = {
  clients: [],
  projects: [],
  drawingSheets: [],
  revisions: [],
  processingJobs: [],
  siteLogs: [],
  documents: [],
  notifications: [],
  outbox: [],
  callbackRequests: [],
  revisionAcks: [],
  auditLogs: []
};

class LocalDatabaseManager {
  private db: LocalDatabase;
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.db = this.load();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('element_design_realtime');
    }
  }

  private load(): LocalDatabase {
    if (typeof window === 'undefined') return JSON.parse(JSON.stringify(INITIAL_DB));
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored DB, resetting to initial seed.', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_DB));
  }

  public save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
      this.channel?.postMessage({ type: 'DB_UPDATED', timestamp: Date.now() });
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public get(): LocalDatabase {
    return this.db;
  }

  public onUpdate(callback: () => void): () => void {
    if (!this.channel) return () => {};
    const handler = () => {
      this.db = this.load();
      callback();
    };
    this.channel.addEventListener('message', handler);
    return () => this.channel?.removeEventListener('message', handler);
  }
}

export const localDb = new LocalDatabaseManager();
