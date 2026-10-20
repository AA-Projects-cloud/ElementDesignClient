import { supabase } from './supabaseClient';
import {
  AuditLogEntry,
  Client,
  DrawingSheet,
  NotificationItem,
  ProcessingJob,
  Project,
  ProjectDocument,
  Revision,
  SiteLog,
} from '../types';
import { fileStorageService } from './fileStorageService';

/**
 * Supabase-backed data access. Every function here is used by the matching service
 * when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are configured.
 * Row-level security in the database decides what each signed-in user may see.
 */

const num = (v: unknown) => Number(v ?? 0);

const unwrap = <T>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

const currentUserId = async (): Promise<string | undefined> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id;
};

// ---------------------------------------------------------------------------
// Mappers (database rows -> app types)
// ---------------------------------------------------------------------------
const mapProject = (r: any): Project => ({
  id: r.id,
  clientId: r.client_id,
  name: r.name,
  typology: r.typology,
  location: r.location,
  areaSqFt: num(r.area_sqft),
  stage: r.stage,
  progressPct: r.progress_pct ?? 0,
  leadArchitectId: r.lead_architect_id ?? undefined,
  leadArchitectName: r.lead_architect_name ?? undefined,
  refCode: r.ref_code,
  vaultKey: r.vault_key,
  createdAt: r.created_at,
});

const mapRevision = (r: any): Revision => ({
  id: r.id,
  sheetId: r.sheet_id,
  revNo: r.rev_no,
  status: r.status,
  note: r.note ?? '',
  filePath: r.file_path,
  pdfPath: r.pdf_path ?? undefined,
  previewPath: r.preview_path ?? undefined,
  sizeBytes: num(r.size_bytes),
  mediaType: r.media_type ?? undefined,
  mimeType: r.mime_type ?? undefined,
  fileName: r.file_name ?? undefined,
  scale: r.scale ?? undefined,
  uploadedBy: r.uploaded_by ?? undefined,
  createdAt: r.created_at,
});

const mapSheet = (r: any): DrawingSheet => {
  const revisions: Revision[] = (r.revisions || [])
    .map(mapRevision)
    .sort((a: Revision, b: Revision) => b.createdAt.localeCompare(a.createdAt));
  const current = revisions.find((x) => x.status === 'current') || revisions[0];
  return {
    id: r.id,
    projectId: r.project_id,
    code: r.code,
    title: r.title,
    category: r.category,
    categoryLabel: String(r.category).toUpperCase().replace('-', ' '),
    description: r.description ?? '',
    location: r.location ?? undefined,
    currentRev: current?.revNo,
    scale: current?.scale,
    updatedDate: current ? new Date(current.createdAt).toLocaleDateString() : undefined,
    revisions,
  };
};

const mapJob = (r: any): ProcessingJob => ({
  id: r.id,
  revisionId: r.revision_id,
  status: r.status,
  error: r.error ?? undefined,
  startedAt: r.started_at,
  finishedAt: r.finished_at ?? undefined,
});

const mapLog = (r: any): SiteLog => ({
  id: r.id,
  projectId: r.project_id,
  title: r.title,
  category: r.category,
  body: r.body,
  status: r.status,
  loggedBy: r.logged_by,
  verifiedBy: r.verified_by ?? undefined,
  testReport: r.test_report ?? undefined,
  photos: (r.site_log_photos || []).map((p: any) => ({
    id: p.id,
    logId: p.log_id,
    path: p.path,
    caption: p.caption,
    tag: p.tag ?? undefined,
    mediaType: p.media_type ?? undefined,
  })),
  createdAt: r.created_at,
});

const mapDocument = (r: any): ProjectDocument => ({
  id: r.id,
  projectId: r.project_id,
  name: r.name,
  category: r.category,
  badge: r.badge ?? undefined,
  path: r.path,
  sizeBytes: num(r.size_bytes),
  mediaType: r.media_type ?? undefined,
  fileName: r.file_name ?? undefined,
  status: r.status ?? 'approved',
  createdAt: r.created_at,
});

const phaseFor = (stage: string) =>
  stage === 'design'
    ? 'Design Phase'
    : stage === 'execution'
    ? 'Execution Phase'
    : stage === 'handover'
    ? 'Finishing & Handover'
    : 'Archived';

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
export const sbClients = {
  async getClients(): Promise<Client[]> {
    const [cl, pr, sh, dc, lg] = await Promise.all([
      supabase.from('clients').select('*, profiles(name, phone, email)').order('created_at', { ascending: false }),
      supabase.from('projects').select('*'),
      supabase.from('drawing_sheets').select('id, project_id'),
      supabase.from('documents').select('id, project_id'),
      supabase.from('site_logs').select('id, project_id'),
    ]);

    const clients = unwrap<any[]>(cl);
    const projects = unwrap<any[]>(pr);
    const sheets = unwrap<any[]>(sh);
    const docs = unwrap<any[]>(dc);
    const logs = unwrap<any[]>(lg);

    return clients.map((c) => {
      const project = projects.find((p) => p.client_id === c.id);
      const pid = project?.id;
      const profile = c.profiles || {};
      return {
        id: c.id,
        profileId: c.profile_id ?? undefined,
        name: profile.name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        portalId: c.portal_id,
        tag: c.tag || '',
        status: c.status,
        watermarkStrict: c.watermark_strict,
        createdAt: c.created_at,
        lastLoginAt: c.last_login_at ?? undefined,
        projectTitle: project?.name,
        typology: project?.typology,
        location: project?.location,
        areaSqFt: project ? num(project.area_sqft) : undefined,
        refId: project?.ref_code,
        vaultKey: project?.vault_key,
        phase: project ? phaseFor(project.stage) : undefined,
        completionPct: project?.progress_pct ?? 0,
        leadArchitect: project?.lead_architect_name || 'To be assigned',
        counts: {
          blueprints: sheets.filter((s) => s.project_id === pid).length,
          specs: docs.filter((d) => d.project_id === pid).length,
          siteLogs: logs.filter((l) => l.project_id === pid).length,
        },
        security: {
          username: c.portal_id,
          pin: '',
          lastLogin: c.last_login_at ? new Date(c.last_login_at).toLocaleString() : 'Not signed in yet',
          authStatus: c.status === 'active' ? 'Active' : 'Suspended',
        },
      } as Client;
    });
  },

  async getClientById(id: string): Promise<Client | undefined> {
    return (await sbClients.getClients()).find((c) => c.id === id);
  },

  /** Admin pre-creates a customer folio; the customer claims it by signing up with the same email. */
  async createClient(data: {
    name: string;
    phone: string;
    email: string;
    projectTitle: string;
    typology: string;
    areaSqFt: number;
    leadArchitect: string;
  }): Promise<{ client: Client; temporaryPin: string }> {
    const profileId = crypto.randomUUID();
    const email = data.email.trim().toLowerCase();
    const portalId = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}.${Math.floor(100 + Math.random() * 900)}`;

    unwrap(
      await supabase.from('profiles').insert({ id: profileId, role: 'client', name: data.name, phone: data.phone, email })
    );
    const client = unwrap<any>(
      await supabase
        .from('clients')
        .insert({ profile_id: profileId, portal_id: portalId, pin_hash: 'pending', tag: 'DESIGN PHASE (STAGE 1)' })
        .select()
        .single()
    );
    unwrap(
      await supabase.from('projects').insert({
        client_id: client.id,
        name: data.projectTitle,
        typology: data.typology,
        location: 'To be assigned',
        area_sqft: data.areaSqFt,
        stage: 'design',
        progress_pct: 10,
        ref_code: `ED-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        vault_key: `PR${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        lead_architect_name: data.leadArchitect,
      })
    );
    const pin = unwrap<string>(await supabase.rpc('reset_client_pin', { p_client_id: client.id }));
    const mapped = (await sbClients.getClientById(client.id)) as Client;
    return { client: mapped, temporaryPin: pin };
  },

  async updateClientPermissions(
    id: string,
    permissions: { status?: 'active' | 'suspended'; watermarkStrict?: boolean }
  ): Promise<Client> {
    const patch: Record<string, unknown> = {};
    if (permissions.status !== undefined) patch.status = permissions.status;
    if (permissions.watermarkStrict !== undefined) patch.watermark_strict = permissions.watermarkStrict;
    unwrap(await supabase.from('clients').update(patch).eq('id', id));
    return (await sbClients.getClientById(id)) as Client;
  },

  async resetClientPin(id: string): Promise<string> {
    return unwrap<string>(await supabase.rpc('reset_client_pin', { p_client_id: id }));
  },
};

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const sbProjects = {
  async getProjects(): Promise<Project[]> {
    const rows = unwrap<any[]>(await supabase.from('projects').select('*').order('created_at', { ascending: false }));
    return rows.map(mapProject);
  },

  async createProject(data: {
    clientId: string;
    name: string;
    typology: string;
    location: string;
    areaSqFt: number;
    stage: 'execution' | 'design' | 'handover';
    leadArchitectName: string;
  }): Promise<Project> {
    const row = unwrap<any>(
      await supabase
        .from('projects')
        .insert({
          client_id: data.clientId,
          name: data.name,
          typology: data.typology,
          location: data.location,
          area_sqft: data.areaSqFt,
          stage: data.stage,
          progress_pct: data.stage === 'handover' ? 95 : data.stage === 'execution' ? 50 : 20,
          ref_code: `ED-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          vault_key: `PR${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          lead_architect_name: data.leadArchitectName,
        })
        .select()
        .single()
    );
    return mapProject(row);
  },

  async updateProjectStage(id: string, stage: Project['stage']): Promise<Project> {
    const row = unwrap<any>(await supabase.from('projects').update({ stage }).eq('id', id).select().single());
    return mapProject(row);
  },
};

// ---------------------------------------------------------------------------
// Drawings
// ---------------------------------------------------------------------------
export const sbDrawings = {
  async getSheets(projectId?: string): Promise<DrawingSheet[]> {
    let q = supabase.from('drawing_sheets').select('*, revisions(*)').order('created_at', { ascending: true });
    if (projectId) q = q.eq('project_id', projectId);
    return unwrap<any[]>(await q).map(mapSheet);
  },

  async createSheet(data: {
    projectId: string;
    code: string;
    title: string;
    category: DrawingSheet['category'];
    description: string;
    location?: string;
  }): Promise<DrawingSheet> {
    const res = await supabase
      .from('drawing_sheets')
      .insert({
        project_id: data.projectId,
        code: data.code,
        title: data.title,
        category: data.category,
        description: data.description,
        location: data.location ?? null,
      })
      .select('*, revisions(*)')
      .single();
    if (res.error && /location/i.test(res.error.message)) {
      throw new Error('The database needs one small update for work locations. Run the location setup SQL in Supabase, then try again.');
    }
    return mapSheet(unwrap<any>(res));
  },

  async uploadRevision(data: {
    sheetId: string;
    revNo: string;
    note: string;
    file: File;
  }): Promise<{ revision: Revision; job: ProcessingJob; sheet: DrawingSheet }> {
    const sheetRow = unwrap<any>(await supabase.from('drawing_sheets').select('*').eq('id', data.sheetId).single());
    const stored = await fileStorageService.upload('drawings', sheetRow.project_id, data.file);
    const me = await currentUserId();

    unwrap(
      await supabase.from('revisions').update({ status: 'superseded' }).eq('sheet_id', data.sheetId).eq('status', 'current')
    );
    const rev = unwrap<any>(
      await supabase
        .from('revisions')
        .insert({
          sheet_id: data.sheetId,
          rev_no: data.revNo,
          status: 'current',
          note: data.note,
          file_path: stored.path,
          preview_path: stored.path,
          size_bytes: stored.sizeBytes,
          media_type: stored.mediaType,
          mime_type: stored.mimeType,
          file_name: stored.fileName,
          uploaded_by: me,
        })
        .select()
        .single()
    );
    const job = unwrap<any>(
      await supabase
        .from('processing_jobs')
        .insert({ revision_id: rev.id, status: 'published', finished_at: new Date().toISOString() })
        .select()
        .single()
    );

    return { revision: mapRevision(rev), job: mapJob(job), sheet: mapSheet({ ...sheetRow, revisions: [rev] }) };
  },

  async getProcessingJobs(): Promise<ProcessingJob[]> {
    const rows = unwrap<any[]>(await supabase.from('processing_jobs').select('*').order('started_at', { ascending: false }));
    return rows.map(mapJob);
  },

  async retryJob(jobId: string): Promise<ProcessingJob> {
    const row = unwrap<any>(
      await supabase
        .from('processing_jobs')
        .update({ status: 'published', error: null, finished_at: new Date().toISOString() })
        .eq('id', jobId)
        .select()
        .single()
    );
    return mapJob(row);
  },

  async acknowledgeRevision(revisionId: string, clientId: string): Promise<void> {
    unwrap(await supabase.from('revision_acks').upsert({ revision_id: revisionId, client_id: clientId }));
  },
};

// ---------------------------------------------------------------------------
// Site logs
// ---------------------------------------------------------------------------
export const sbSiteLogs = {
  async getSiteLogs(projectId?: string): Promise<SiteLog[]> {
    let q = supabase.from('site_logs').select('*, site_log_photos(*)').order('created_at', { ascending: false });
    if (projectId) q = q.eq('project_id', projectId);
    return unwrap<any[]>(await q).map(mapLog);
  },

  async createSiteLog(data: {
    projectId: string;
    title: string;
    category: string;
    body: string;
    loggedBy: string;
    photos: { path: string; caption: string; tag?: string; mediaType?: string }[];
  }): Promise<SiteLog> {
    const log = unwrap<any>(
      await supabase
        .from('site_logs')
        .insert({
          project_id: data.projectId,
          title: data.title,
          category: data.category,
          body: data.body,
          status: 'pending',
          logged_by: data.loggedBy,
        })
        .select()
        .single()
    );
    if (data.photos.length) {
      unwrap(
        await supabase.from('site_log_photos').insert(
          data.photos.map((p) => ({
            log_id: log.id,
            path: p.path,
            caption: p.caption,
            tag: p.tag,
            media_type: p.mediaType,
          }))
        )
      );
    }
    const full = unwrap<any>(await supabase.from('site_logs').select('*, site_log_photos(*)').eq('id', log.id).single());
    return mapLog(full);
  },

  async reviewSiteLog(id: string, status: 'approved' | 'rejected', reviewerName: string): Promise<SiteLog> {
    const verifiedBy =
      status === 'approved' ? `QUALITY CLEARANCE: PASSED (${reviewerName})` : `REJECTED BY ${reviewerName}`;
    const row = unwrap<any>(
      await supabase
        .from('site_logs')
        .update({ status, verified_by: verifiedBy })
        .eq('id', id)
        .select('*, site_log_photos(*)')
        .single()
    );
    return mapLog(row);
  },
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
export const sbDocuments = {
  async getDocuments(projectId?: string): Promise<ProjectDocument[]> {
    let q = supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (projectId) q = q.eq('project_id', projectId);
    return unwrap<any[]>(await q).map(mapDocument);
  },

  async createDocument(data: {
    projectId: string;
    name: string;
    category: ProjectDocument['category'];
    badge?: string;
    path: string;
    sizeBytes: number;
    mediaType: string;
    fileName: string;
  }): Promise<ProjectDocument> {
    const row = unwrap<any>(
      await supabase
        .from('documents')
        .insert({
          project_id: data.projectId,
          name: data.name,
          category: data.category,
          badge: data.badge || 'VERIFIED SPECIFICATION',
          path: data.path,
          size_bytes: data.sizeBytes,
          media_type: data.mediaType,
          file_name: data.fileName,
          status: 'approved',
        })
        .select()
        .single()
    );
    return mapDocument(row);
  },
};

// ---------------------------------------------------------------------------
// Notifications & audit
// ---------------------------------------------------------------------------
export const sbNotifications = {
  async getNotifications(): Promise<NotificationItem[]> {
    const me = await currentUserId();
    if (!me) return [];
    const rows = unwrap<any[]>(
      await supabase.from('notifications').select('*').eq('user_id', me).order('created_at', { ascending: false }).limit(50)
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      body: r.body,
      link: r.link ?? undefined,
      readAt: r.read_at,
      createdAt: r.created_at,
    }));
  },

  async markAsRead(id: string): Promise<void> {
    unwrap(await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id));
  },

  async markAllAsRead(): Promise<void> {
    const me = await currentUserId();
    if (!me) return;
    unwrap(
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', me).is('read_at', null)
    );
  },

  async notifyStaff(title: string, body: string, link?: string): Promise<void> {
    try {
      await supabase.rpc('notify_staff', { p_title: title, p_body: body, p_link: link ?? null });
    } catch {
      /* notifications are best-effort */
    }
  },
};

export const sbAudit = {
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const rows = unwrap<any[]>(await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200));
    return rows.map((r) => ({
      id: r.id,
      actorId: r.actor_id ?? undefined,
      action: r.action,
      entity: r.entity,
      entityId: r.entity_id ?? undefined,
      ip: r.ip ?? undefined,
      userAgent: r.user_agent ?? undefined,
      meta: r.meta ?? undefined,
      createdAt: r.created_at,
    }));
  },

  async logAction(action: string, entity: string, entityId?: string, meta?: Record<string, any>): Promise<void> {
    try {
      const me = await currentUserId();
      if (!me) return;
      await supabase.from('audit_log').insert({
        actor_id: me,
        action,
        entity,
        entity_id: entityId,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        meta,
      });
    } catch {
      /* the audit trail must never block the user's action */
    }
  },
};

// ---------------------------------------------------------------------------
// Realtime: any change in the database refreshes what's on screen
// ---------------------------------------------------------------------------
export const subscribeRealtime = (onChange: () => void): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const channel = supabase
    .channel('element-design-live')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => {
      // Batch bursts of changes (e.g. a revision + job + photos) into one refresh.
      clearTimeout(timer);
      timer = setTimeout(onChange, 250);
    })
    .subscribe();
  return () => {
    clearTimeout(timer);
    supabase.removeChannel(channel);
  };
};
