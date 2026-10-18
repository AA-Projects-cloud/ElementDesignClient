import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';
import { projectsService } from '../services/projectsService';
import { X } from 'lucide-react';

export const NewProjectModal: React.FC = () => {
  const { newProjectModalOpen, closeNewProjectModal, addToast } = useUiStore();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getClients,
  });

  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [typology, setTypology] = useState('4BHK Luxury Apartment');
  const [location, setLocation] = useState('Bandra West, Mumbai');
  const [areaSqFt, setAreaSqFt] = useState(3800);
  const [stage, setStage] = useState<'execution' | 'design' | 'handover'>('design');

  const createMutation = useMutation({
    mutationFn: async () => {
      const targetClientId = clientId || clients[0]?.id;
      if (!targetClientId) throw new Error('No client selected');

      return await projectsService.createProject({
        clientId: targetClientId,
        name,
        typology,
        location,
        areaSqFt,
        stage,
        leadArchitectName: 'Sameer Verma',
      });
    },
    onSuccess: (newProj) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      closeNewProjectModal();
      addToast(`Commission for ${newProj.name} created successfully!`, 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Creation failed', 'error');
    },
  });

  if (!newProjectModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="modal-overlay active" onClick={closeNewProjectModal}>
      <div className="modal-sheet" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="label-xs">SPATIAL COMMISSIONING</span>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Create New Architectural Project</h3>
          </div>
          <button className="btn btn-icon" onClick={closeNewProjectModal}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Client Account</label>
              <select
                className="form-select"
                value={clientId || (clients[0]?.id ?? '')}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Project Title</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Singhania Villa"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Typology</label>
                <input
                  type="text"
                  className="form-input"
                  value={typology}
                  onChange={(e) => setTypology(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Area (Sq Ft)</label>
                <input
                  type="number"
                  className="form-input"
                  value={areaSqFt}
                  onChange={(e) => setAreaSqFt(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Stage</label>
                <select
                  className="form-select"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                >
                  <option value="design">Design &amp; Approval</option>
                  <option value="execution">Active Execution</option>
                  <option value="handover">Final Handover</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeNewProjectModal}>
              CANCEL
            </button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'CREATING...' : 'COMMISSION PROJECT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
