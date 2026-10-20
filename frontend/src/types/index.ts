export type UserRole = 'admin' | 'staff' | 'client';

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
}

export interface Client {
  id: string;
  profileId?: string;
  name: string;
  phone: string;
  email: string;
  portalId: string;
  tag: string;
  status: 'active' | 'suspended';
  watermarkStrict: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;
  projectTitle?: string;
  typology?: string;
  location?: string;
  areaSqFt?: number;
  refId?: string;
  vaultKey?: string;
  phase?: string;
  completionPct?: number;
  leadArchitect?: string;
  liveDraft?: string;
  liveDraftTimestamp?: string;
  counts: {
    blueprints: number;
    specs: number;
    siteLogs: number;
  };
  security: {
    username: string;
    pin: string; // only used in one-time creation/reset modals
    lastLogin: string;
    device?: string;
    authStatus: string;
  };
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  typology: string;
  location: string;
  areaSqFt: number;
  stage: 'execution' | 'design' | 'handover' | 'archived';
  progressPct: number;
  leadArchitectId?: string;
  leadArchitectName?: string;
  refCode: string;
  vaultKey: string;
  createdAt?: string;
}

export interface DrawingSheet {
  id: string;
  projectId: string;
  code: string;
  title: string;
  category: 'floor-plan' | 'furniture' | 'electrical' | 'ceiling' | 'kitchen' | 'wardrobe' | 'hvac' | 'structural';
  categoryLabel?: string;
  description: string;
  location?: string; // work location folder (e.g. Mumbai, Bihar)
  currentRev?: string;
  scale?: string;
  updatedDate?: string;
  revisions?: Revision[];
}

export interface Revision {
  id: string;
  sheetId: string;
  revNo: string;
  status: 'current' | 'superseded';
  note: string;
  filePath: string;
  pdfPath?: string;
  previewPath?: string;
  sizeBytes: number;
  mediaType?: 'pdf' | 'image' | 'video' | 'other';
  mimeType?: string;
  fileName?: string;
  scale?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface ProcessingJob {
  id: string;
  revisionId: string;
  status: 'queued' | 'parsing' | 'flattening' | 'pdf_ready' | 'published' | 'failed' | 'awaiting_converter';
  error?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface SiteLog {
  id: string;
  projectId: string;
  title: string;
  category: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  loggedBy: string;
  verifiedBy?: string;
  testReport?: {
    title: string;
    val: string;
    status?: string;
  };
  photos: SiteLogPhoto[];
  createdAt: string;
}

export interface SiteLogPhoto {
  id: string;
  logId?: string;
  path: string;
  caption: string;
  tag?: string;
  mediaType?: 'pdf' | 'image' | 'video' | 'other';
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  category: 'contract' | 'materials' | 'warranty' | 'technical' | 'handover';
  badge?: string;
  path: string;
  sizeBytes: number;
  mediaType?: 'pdf' | 'image' | 'video' | 'other';
  fileName?: string;
  status: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  body: string;
  link?: string;
  readAt?: string | null;
  createdAt: string;
}

export interface OutboxMessage {
  id: string;
  channel: 'whatsapp' | 'email' | 'sms';
  to: string;
  payload: Record<string, any>;
  status: 'queued' | 'sent' | 'failed';
  providerMessageId?: string;
  createdAt: string;
}

export interface CallbackRequest {
  id: string;
  projectId: string;
  clientId: string;
  preferredTime?: string;
  topic: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, any>;
  createdAt: string;
}
