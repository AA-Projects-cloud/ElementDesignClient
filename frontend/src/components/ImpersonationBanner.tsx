import React from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';
import { Eye, LogOut } from 'lucide-react';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, selectedClientId, stopImpersonation } = useUiStore();

  const { data: client } = useQuery({
    queryKey: ['client', selectedClientId],
    queryFn: () => clientsService.getClientById(selectedClientId),
    enabled: Boolean(selectedClientId),
  });

  if (!isImpersonating) return null;

  return (
    <div
      style={{
        backgroundColor: '#C4622D',
        color: '#FFFFFF',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.06em',
        position: 'sticky',
        top: 0,
        zIndex: 999,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Eye size={16} />
        <span>
          VIEWING AS CLIENT: <strong>{client?.name.toUpperCase()}</strong> ({client?.projectTitle}) • READ-ONLY SIMULATION
        </span>
      </div>

      <button
        className="btn btn-secondary btn-sm"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#555555',
          border: 'none',
          padding: '4px 10px',
        }}
        onClick={stopImpersonation}
      >
        <LogOut size={12} />
        EXIT CLIENT VIEW
      </button>
    </div>
  );
};
