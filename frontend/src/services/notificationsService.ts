import { NotificationItem } from '../types';
import { localDb } from './mockDb';
import { isSupabaseConfigured } from './supabaseClient';
import { sbNotifications } from './supabaseData';

export const notificationsService = {
  async getNotifications(): Promise<NotificationItem[]> {
    if (isSupabaseConfigured) return sbNotifications.getNotifications();
    return [...localDb.get().notifications];
  },

  async markAsRead(id: string): Promise<void> {
    if (isSupabaseConfigured) return sbNotifications.markAsRead(id);
    const db = localDb.get();
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) {
      notif.readAt = new Date().toISOString();
      localDb.save();
    }
  },

  async markAllAsRead(): Promise<void> {
    if (isSupabaseConfigured) return sbNotifications.markAllAsRead();
    const db = localDb.get();
    db.notifications.forEach((n) => {
      n.readAt = new Date().toISOString();
    });
    localDb.save();
  },

  async createNotification(data: { title: string; body: string; link?: string }): Promise<NotificationItem> {
    if (isSupabaseConfigured) {
      await sbNotifications.notifyStaff(data.title, data.body, data.link);
      return { id: '', title: data.title, body: data.body, link: data.link, readAt: null, createdAt: new Date().toISOString() };
    }
    const db = localDb.get();
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: data.title,
      body: data.body,
      link: data.link,
      readAt: null,
      createdAt: new Date().toISOString()
    };
    db.notifications.unshift(newNotif);
    localDb.save();
    return newNotif;
  }
};
