import { SiteLog, SiteLogPhoto } from '../types';
import { localDb } from './mockDb';
import { auditService } from './auditService';
import { notificationsService } from './notificationsService';
import { fileStorageService } from './fileStorageService';
import { isSupabaseConfigured } from './supabaseClient';
import { sbSiteLogs } from './supabaseData';

export const siteLogsService = {
  async getSiteLogs(projectId?: string): Promise<SiteLog[]> {
    if (isSupabaseConfigured) return sbSiteLogs.getSiteLogs(projectId);
    const db = localDb.get();
    let logs = [...db.siteLogs];
    if (projectId) {
      logs = logs.filter((l) => l.projectId === projectId);
    }
    return logs;
  },

  async createSiteLog(data: {
    projectId: string;
    title: string;
    category: string;
    body: string;
    loggedBy: string;
    files: File[];
  }): Promise<SiteLog> {
    // Upload every attached photo / video before the log is recorded.
    const photos: { path: string; caption: string; tag?: string; mediaType: SiteLogPhoto['mediaType'] }[] = [];
    for (const file of data.files) {
      const stored = await fileStorageService.upload('site-photos', data.projectId, file);
      photos.push({ path: stored.path, caption: file.name, mediaType: stored.mediaType });
    }

    if (isSupabaseConfigured) {
      const created = await sbSiteLogs.createSiteLog({ ...data, photos });
      await auditService.logAction('CREATE_SITE_LOG', 'site_logs', created.id, { title: data.title, category: data.category });
      await notificationsService.createNotification({
        title: 'New Site Progress Log Awaiting Verification',
        body: `${data.title} posted by ${data.loggedBy}.`,
        link: '/work-and-site-updates?status=pending'
      });
      return created;
    }
    const db = localDb.get();
    const newId = `log-${Date.now()}`;
    const newLog: SiteLog = {
      id: newId,
      projectId: data.projectId,
      title: data.title,
      category: data.category,
      body: data.body,
      status: 'pending',
      loggedBy: data.loggedBy,
      photos: photos.map((p, idx) => ({ id: `p-${newId}-${idx}`, ...p })),
      createdAt: new Date().toISOString()
    };

    db.siteLogs.unshift(newLog);
    localDb.save();

    await auditService.logAction('CREATE_SITE_LOG', 'site_logs', newId, {
      title: data.title,
      category: data.category
    });

    await notificationsService.createNotification({
      title: 'New Site Progress Log Awaiting Verification',
      body: `${data.title} posted by ${data.loggedBy}.`,
      link: '/work-and-site-updates?status=pending'
    });

    return newLog;
  },

  async reviewSiteLog(id: string, status: 'approved' | 'rejected', reviewerName = 'Administrator'): Promise<SiteLog> {
    if (isSupabaseConfigured) {
      const updated = await sbSiteLogs.reviewSiteLog(id, status, reviewerName);
      await auditService.logAction('REVIEW_SITE_LOG', 'site_logs', id, { status, reviewerName });
      await notificationsService.createNotification({
        title: `Site Log ${status.toUpperCase()}`,
        body: `"${updated.title}" has been ${status} by ${reviewerName}.`,
        link: '/work-and-site-updates'
      });
      return updated;
    }
    const db = localDb.get();
    const log = db.siteLogs.find((l) => l.id === id);
    if (!log) throw new Error('Site log not found');

    log.status = status;
    log.verifiedBy = status === 'approved' ? `QUALITY CLEARANCE: PASSED (${reviewerName})` : `REJECTED BY ${reviewerName}`;
    localDb.save();

    await auditService.logAction('REVIEW_SITE_LOG', 'site_logs', id, {
      status,
      reviewerName
    });

    await notificationsService.createNotification({
      title: `Site Log ${status.toUpperCase()}`,
      body: `"${log.title}" has been ${status} by ${reviewerName}.`,
      link: '/work-and-site-updates'
    });

    return log;
  }
};
