import { Project } from '../types';
import { isSupabaseConfigured } from './supabaseClient';
import { sbProjects } from './supabaseData';
import { localDb } from './mockDb';
import { auditService } from './auditService';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export const projectsService = {
  async getProjects(): Promise<Project[]> {
    if (isSupabaseConfigured) return sbProjects.getProjects();
    return [...localDb.get().projects];
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
    if (isSupabaseConfigured) {
      const p = await sbProjects.createProject(data);
      await auditService.logAction('CREATE_PROJECT', 'projects', p.id, { name: data.name });
      return p;
    }
    const db = localDb.get();
    const newId = `p-${Date.now()}`;
    const newProject: Project = {
      id: newId,
      clientId: data.clientId,
      name: data.name,
      typology: data.typology,
      location: data.location,
      areaSqFt: data.areaSqFt,
      stage: data.stage,
      progressPct: data.stage === 'handover' ? 95 : data.stage === 'execution' ? 50 : 20,
      refCode: `AT-PRJ-${Math.floor(100 + Math.random() * 900)}`,
      vaultKey: `PR0${Math.floor(100 + Math.random() * 900)}`,
      leadArchitectName: data.leadArchitectName,
      createdAt: new Date().toISOString()
    };

    db.projects.unshift(newProject);
    localDb.save();

    await auditService.logAction('CREATE_PROJECT', 'projects', newId, {
      name: data.name,
      refCode: newProject.refCode
    });

    return newProject;
  },

  async updateProjectStage(id: string, stage: 'execution' | 'design' | 'handover' | 'archived'): Promise<Project> {
    if (isSupabaseConfigured) {
      const p = await sbProjects.updateProjectStage(id, stage);
      await auditService.logAction('UPDATE_PROJECT_STAGE', 'projects', id, { stage });
      return p;
    }
    const db = localDb.get();
    const project = db.projects.find((p) => p.id === id);
    if (!project) throw new Error('Project not found');

    project.stage = stage;
    localDb.save();

    await auditService.logAction('UPDATE_PROJECT_STAGE', 'projects', id, { stage });
    return project;
  },

  exportProjectsCsv(projects: Project[]): void {
    const rows = projects.map((p) => ({
      ID: p.id,
      Name: p.name,
      Typology: p.typology,
      Location: p.location,
      AreaSqFt: p.areaSqFt,
      Stage: p.stage,
      ProgressPct: `${p.progressPct}%`,
      RefCode: p.refCode,
      VaultKey: p.vaultKey,
      LeadArchitect: p.leadArchitectName || ''
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const dateStr = new Date().toISOString().split('T')[0];
    saveAs(blob, `element-design-projects-${dateStr}.csv`);
  }
};
