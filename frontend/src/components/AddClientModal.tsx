import React, { useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';
import { X } from 'lucide-react';

export const AddClientModal: React.FC = () => {
  const { addClientModalOpen, closeAddClientModal, openResetPinModal, addToast } = useUiStore();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [phone, setPhone] = useState('+91 98');
  const [areaSqFt, setAreaSqFt] = useState(4200);
  const [leadArchitect, setLeadArchitect] = useState('Sameer Verma');

  const createMutation = useMutation({
    mutationFn: async () => {
      return await clientsService.createClient({
        name,
        phone,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@atelier-client.com`,
        projectTitle,
        typology: 'Bespoke Residential Commission',
        areaSqFt,
        leadArchitect,
      });
    },
    onSuccess: ({ client, temporaryPin }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      closeAddClientModal();
      openResetPinModal(temporaryPin, client.name);
      addToast(`Client folio commissioned for ${client.name}!`, 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to create client', 'error');
    },
  });

  if (!addClientModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="modal-overlay active" onClick={closeAddClientModal}>
      <div className="modal-sheet" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="label-xs">PORTFOLIO REGISTRATION</span>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Commission New Client Account</h3>
          </div>
          <button className="btn btn-icon" onClick={closeAddClientModal}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Client Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikram Singhania"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Project / Residence Title</label>
              <input
                type="text"
                className="form-input"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Singhania Villa, Malabar Hill"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Primary Mobile (OTP Portal Key)</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 00000"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Built-up Area (Sq Ft)</label>
                <input
                  type="number"
                  className="form-input"
                  value={areaSqFt}
                  onChange={(e) => setAreaSqFt(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lead Architect</label>
                <select
                  className="form-select"
                  value={leadArchitect}
                  onChange={(e) => setLeadArchitect(e.target.value)}
                >
                  <option>Sameer Verma</option>
                  <option>Julian Vane</option>
                  <option>Tanvi K.</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeAddClientModal}>
              CANCEL
            </button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'COMMISSIONING...' : 'COMMISSION FOLIO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
