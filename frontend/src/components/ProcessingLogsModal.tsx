import React from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { drawingsService } from '../services/drawingsService';
import { X, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ProcessingLogsModal: React.FC = () => {
  const { processingLogsModalOpen, closeProcessingLogsModal, addToast } = useUiStore();
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery({
    queryKey: ['processingJobs'],
    queryFn: drawingsService.getProcessingJobs,
  });

  const retryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await drawingsService.retryJob(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processingJobs'] });
      addToast('Job re-queued into automated release pipeline.', 'info');
    },
  });

  if (!processingLogsModalOpen) return null;

  return (
    <div className="modal-overlay active" onClick={closeProcessingLogsModal}>
      <div className="modal-sheet" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="label-xs">CAD INGESTION WORKERS</span>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Automated Release Processing Logs</h3>
          </div>
          <button className="btn btn-icon" onClick={closeProcessingLogsModal}>
            <X size={14} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>JOB ID</th>
                <th>PIPELINE STAGE</th>
                <th>STARTED AT</th>
                <th>DURATION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{job.id}</td>
                  <td>
                    <span
                      className={`badge ${job.status === 'published' ? 'badge-approved' : 'badge-active'}`}
                    >
                      {job.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{new Date(job.startedAt).toLocaleTimeString()}</td>
                  <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>1.8s (Vector 600DPI)</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => retryMutation.mutate(job.id)}
                      disabled={retryMutation.isPending}
                    >
                      <RefreshCw size={12} />
                      RE-RUN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={closeProcessingLogsModal}>
            CLOSE LOGS
          </button>
        </div>
      </div>
    </div>
  );
};
