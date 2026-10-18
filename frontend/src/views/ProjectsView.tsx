import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../services/projectsService';
import { Plus, Download, Briefcase, CheckCircle2, Clock } from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { openNewProjectModal, addToast, setCurrentView, setSelectedClientId } = useUiStore();
  const queryClient = useQueryClient();

  const [stageFilter, setStageFilter] = useState<'all' | 'execution' | 'design' | 'handover'>('all');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getProjects,
  });

  const filteredProjects = projects.filter((p) => {
    if (stageFilter === 'all') return true;
    return p.stage === stageFilter;
  });

  const stageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: 'execution' | 'design' | 'handover' | 'archived' }) => {
      return await projectsService.updateProjectStage(id, stage);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast(`Updated ${updated.name} stage to ${updated.stage.toUpperCase()}`, 'success');
    },
  });

  return (
    <section className="view-panel active">
      <div className="view-header">
        <div className="view-header-titles">
          <div className="view-header-folio">
            <span>SPATIAL COMMISSIONS • {projects.length} ACTIVE SITES</span>
          </div>
          <h1 className="view-header-title">Projects Management</h1>
          <p className="view-header-sub">
            Master lifecycle tracking across architectural design, construction execution, and client handover.
          </p>
        </div>

        <div className="view-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => {
              projectsService.exportProjectsCsv(filteredProjects);
              addToast('Exported projects ledger CSV.', 'info');
            }}
          >
            <Download size={14} />
            EXPORT PROJECTS CSV
          </button>
          <button className="btn btn-primary" onClick={openNewProjectModal}>
            <Plus size={14} />
            + NEW PROJECT
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-filter-group">
        <button
          className={`tab-filter-btn ${stageFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStageFilter('all')}
        >
          ALL PROJECTS ({projects.length})
        </button>
        <button
          className={`tab-filter-btn ${stageFilter === 'execution' ? 'active' : ''}`}
          onClick={() => setStageFilter('execution')}
        >
          EXECUTION ({projects.filter((p) => p.stage === 'execution').length})
        </button>
        <button
          className={`tab-filter-btn ${stageFilter === 'design' ? 'active' : ''}`}
          onClick={() => setStageFilter('design')}
        >
          DESIGN ({projects.filter((p) => p.stage === 'design').length})
        </button>
        <button
          className={`tab-filter-btn ${stageFilter === 'handover' ? 'active' : ''}`}
          onClick={() => setStageFilter('handover')}
        >
          HANDOVER ({projects.filter((p) => p.stage === 'handover').length})
        </button>
      </div>

      {/* Projects Table */}
      <div className="folio-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>REF CODE</th>
              <th>PROJECT NAME</th>
              <th>TYPOLOGY &amp; LOCATION</th>
              <th>AREA (SQ FT)</th>
              <th>STAGE</th>
              <th>PROGRESS</th>
              <th>STAGE ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{project.refCode}</td>
                <td>
                  <div style={{ fontWeight: 700 }}>{project.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
                    Lead: {project.leadArchitectName || 'Sameer Verma'}
                  </div>
                </td>
                <td>
                  <div>{project.typology}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>{project.location}</div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {project.areaSqFt.toLocaleString()}
                </td>
                <td>
                  <span
                    className={`badge ${
                      project.stage === 'execution'
                        ? 'badge-execution'
                        : project.stage === 'design'
                        ? 'badge-design'
                        : 'badge-approved'
                    }`}
                  >
                    {project.stage.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{project.progressPct}%</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select
                      className="form-select"
                      style={{ height: 28, fontSize: 11, padding: '0 6px' }}
                      value={project.stage}
                      onChange={(e) =>
                        stageMutation.mutate({
                          id: project.id,
                          stage: e.target.value as any,
                        })
                      }
                    >
                      <option value="design">Design Stage</option>
                      <option value="execution">Active Execution</option>
                      <option value="handover">Final Handover</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedClientId(project.clientId);
                        setCurrentView('drawings');
                      }}
                    >
                      BLUEPRINTS
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
