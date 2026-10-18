import { Client } from '../types';
import { isSupabaseConfigured } from './supabaseClient';
import { sbClients } from './supabaseData';
import { localDb } from './mockDb';
import { auditService } from './auditService';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export const clientsService = {
  async getClients(): Promise<Client[]> {
    if (isSupabaseConfigured) return sbClients.getClients();
    return [...localDb.get().clients];
  },

  async getClientById(id: string): Promise<Client | undefined> {
    if (isSupabaseConfigured) return sbClients.getClientById(id);
    return localDb.get().clients.find((c) => c.id === id);
  },

  async createClient(data: {
    name: string;
    phone: string;
    email: string;
    projectTitle: string;
    typology: string;
    areaSqFt: number;
    leadArchitect: string;
  }): Promise<{ client: Client; temporaryPin: string }> {
    if (isSupabaseConfigured) {
      const res = await sbClients.createClient(data);
      await auditService.logAction('CREATE_CLIENT', 'clients', res.client.id, { name: data.name });
      return res;
    }
    const db = localDb.get();
    const newId = `c-${Date.now()}`;
    const temporaryPin = Math.floor(1000 + Math.random() * 9000).toString();
    const portalId = data.name.toLowerCase().replace(/\s+/g, '.');

    const newClient: Client = {
      id: newId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      portalId,
      tag: 'DESIGN PHASE (STAGE 1)',
      status: 'active',
      watermarkStrict: true,
      createdAt: new Date().toISOString(),
      projectTitle: data.projectTitle,
      typology: data.typology,
      location: 'Mumbai',
      areaSqFt: data.areaSqFt,
      refId: `AT-MUM-${Math.floor(100 + Math.random() * 900)}`,
      vaultKey: `PR0${Math.floor(100 + Math.random() * 900)}`,
      phase: 'Design Phase (Concept Planning)',
      completionPct: 10,
      leadArchitect: data.leadArchitect,
      liveDraft: 'Concept Schematic Draft 01',
      liveDraftTimestamp: 'Just now • Lead Arch',
      counts: { blueprints: 0, specs: 0, siteLogs: 0 },
      security: {
        username: portalId,
        pin: temporaryPin,
        lastLogin: 'Pending First Login',
        authStatus: 'Authorized Concept Review'
      }
    };

    db.clients.unshift(newClient);

    // Create corresponding project
    db.projects.unshift({
      id: `p-${Date.now()}`,
      clientId: newId,
      name: data.projectTitle,
      typology: data.typology,
      location: 'Mumbai',
      areaSqFt: data.areaSqFt,
      stage: 'design',
      progressPct: 10,
      refCode: newClient.refId || 'AT-MUM-100',
      vaultKey: newClient.vaultKey || 'PR0100',
      leadArchitectName: data.leadArchitect
    });

    localDb.save();

    await auditService.logAction('CREATE_CLIENT', 'clients', newId, {
      name: data.name,
      portalId
    });

    return { client: newClient, temporaryPin };
  },

  async updateClientPermissions(
    id: string,
    permissions: {
      status?: 'active' | 'suspended';
      watermarkStrict?: boolean;
    }
  ): Promise<Client> {
    if (isSupabaseConfigured) {
      const res = await sbClients.updateClientPermissions(id, permissions);
      await auditService.logAction('UPDATE_CLIENT_PERMISSIONS', 'clients', id, permissions);
      return res;
    }
    const db = localDb.get();
    const client = db.clients.find((c) => c.id === id);
    if (!client) throw new Error('Client not found');

    if (permissions.status !== undefined) client.status = permissions.status;
    if (permissions.watermarkStrict !== undefined) client.watermarkStrict = permissions.watermarkStrict;

    localDb.save();

    await auditService.logAction('UPDATE_CLIENT_PERMISSIONS', 'clients', id, permissions);
    return client;
  },

  async resetClientPin(id: string): Promise<string> {
    if (isSupabaseConfigured) {
      const pin = await sbClients.resetClientPin(id);
      await auditService.logAction('RESET_CLIENT_PIN', 'clients', id);
      return pin;
    }
    const db = localDb.get();
    const client = db.clients.find((c) => c.id === id);
    if (!client) throw new Error('Client not found');

    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    client.security.pin = newPin;

    localDb.save();

    await auditService.logAction('RESET_CLIENT_PIN', 'clients', id, {
      portalId: client.portalId
    });

    return newPin;
  },

  exportClientsCsv(clients: Client[]): void {
    const rows = clients.map((c) => ({
      ID: c.id,
      Name: c.name,
      Phone: c.phone,
      Email: c.email,
      PortalID: c.portalId,
      Project: c.projectTitle || '',
      Typology: c.typology || '',
      Status: c.status,
      BlueprintsCount: c.counts.blueprints,
      SpecsCount: c.counts.specs,
      SiteLogsCount: c.counts.siteLogs,
      LastLogin: c.security.lastLogin
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const dateStr = new Date().toISOString().split('T')[0];
    saveAs(blob, `element-design-clients-ledger-${dateStr}.csv`);
  }
};
