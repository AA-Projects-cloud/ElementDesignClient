import React, { useRef, useState } from 'react';
import { useUiStore } from '../store/useUiStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../services/projectsService';
import { clientsService } from '../services/clientsService';
import { drawingsService } from '../services/drawingsService';
import { UploadCloud, X } from 'lucide-react';
import { ACCEPTED_MEDIA, formatBytes, validateFile } from '../services/fileStorageService';
import type { DrawingSheet } from '../types';

export const UploadDrawingModal: React.FC = () => {
  const { uploadModalOpen, closeUploadModal, addToast } = useUiStore();
  const queryClient = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [locChoice, setLocChoice] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetCode, setSheetCode] = useState('');
  const [category, setCategory] = useState<DrawingSheet['category']>('floor-plan');
  const [revNo, setRevNo] = useState('REV 01');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.getProjects,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getClients,
  });

  // Match the typed customer name + phone number to a customer record (phone compared by its last 10 digits).
  const digits = (v: string) => v.replace(/\D/g, '').slice(-10);
  const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
  const lookingUp = customerName.trim() !== '' || customerPhone.trim() !== '';
  const matchedClient = lookingUp
    ? clients.find(
        (c) =>
          norm(c.name) === norm(customerName) &&
          digits(c.phone).length >= 6 &&
          digits(c.phone) === digits(customerPhone)
      )
    : undefined;
  const matchedProjects = matchedClient ? projects.filter((p) => p.clientId === matchedClient.id) : [];
  // The project the file will be filed under
  const resolvedProjectId = lookingUp
    ? matchedProjects.find((p) => p.id === selectedProjectId)?.id || matchedProjects[0]?.id
    : selectedProjectId || projects[0]?.id;

  // Existing work-location folders for the project this file will be filed under
  const { data: projectSheets = [] } = useQuery({
    queryKey: ['sheets', resolvedProjectId],
    queryFn: () => drawingsService.getSheets(resolvedProjectId),
    enabled: Boolean(resolvedProjectId),
  });
  const existingLocations = Array.from(
    new Set(projectSheets.map((s) => s.location?.trim()).filter((l): l is string => Boolean(l)))
  );
  const usingNewLocation = existingLocations.length === 0 || locChoice === '__new__';
  const effectiveLocation = usingNewLocation ? newLocation.trim() : locChoice || existingLocations[0];

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Please select a PDF, image or video file');
      if (lookingUp && !matchedClient) {
        throw new Error('No customer found with that name and phone number. Check the details, or clear both fields to pick a project manually.');
      }
      const targetProjectId = resolvedProjectId;
      if (!targetProjectId) throw new Error('No project found');

      if (!effectiveLocation) throw new Error('Please choose or enter the work location for this file.');
      // Reuse the folder's spelling if it already exists (Mumbai vs mumbai)
      const location =
        existingLocations.find((l) => l.toLowerCase() === effectiveLocation.toLowerCase()) || effectiveLocation;

      // Check if this sheet already exists in this location, or create it
      const existingSheets = await drawingsService.getSheets(targetProjectId);
      let targetSheet = existingSheets.find(
        (s) => s.code === sheetCode && (s.location?.trim() || '').toLowerCase() === location.toLowerCase()
      );

      if (!targetSheet) {
        targetSheet = await drawingsService.createSheet({
          projectId: targetProjectId,
          code: sheetCode,
          title: sheetTitle,
          category,
          description: note,
          location,
        });
      }

      // Upload revision
      return await drawingsService.uploadRevision({
        sheetId: targetSheet.id,
        revNo,
        note,
        file,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
      queryClient.invalidateQueries({ queryKey: ['processingJobs'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      closeUploadModal();
      setFile(null);
      setSheetTitle('');
      setSheetCode('');
      setNote('');
      setCustomerName('');
      setCustomerPhone('');
      setLocChoice('');
      setNewLocation('');
      setUploadProgress(0);
      addToast(`${sheetCode} (${revNo}) uploaded and published to the client portal.`, 'success');
    },
    onError: (err: any) => {
      setUploadProgress(0);
      addToast(err.message || 'Upload failed', 'error');
    },
  });

  if (!uploadModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      addToast('Please choose a PDF, image or video file first.', 'error');
      return;
    }
    setUploadProgress(60);
    uploadMutation.mutate();
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    const problem = validateFile(picked);
    if (problem) {
      addToast(problem, 'error');
      return;
    }
    setFile(picked);
  };

  return (
    <div className="modal-overlay active" onClick={closeUploadModal}>
      <div className="modal-sheet" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="label-xs">INGESTION ENGINE</span>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Upload New Drawing Revision</h3>
          </div>
          <button className="btn btn-icon" onClick={closeUploadModal}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Dropzone */}
            <div
              className="cad-dropzone"
              style={{ padding: 24 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MEDIA}
                style={{ display: 'none' }}
                onChange={handleFilePicked}
              />
              <UploadCloud size={28} />
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 13 }}>
                {file ? file.name : 'Click to choose a PDF, image or video'}
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
                {file ? `${formatBytes(file.size)} • Click to replace` : 'PDF, JPG/PNG/WebP images and MP4/MOV/WebM video up to 50 MB'}
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploadMutation.isPending || !file}
              style={{ width: '100%' }}
            >
              <UploadCloud size={14} />
              {uploadMutation.isPending ? 'UPLOADING...' : 'UPLOAD TO CUSTOMER'}
            </button>

            {uploadProgress > 0 && (
              <div style={{ width: '100%', height: 6, backgroundColor: 'var(--bg-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: 'var(--ink-primary)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>
            {lookingUp && (
              <div
                style={{
                  fontSize: 12,
                  marginTop: -8,
                  color: matchedClient ? 'var(--green-indicator)' : 'var(--status-alert-ink)',
                }}
              >
                {matchedClient
                  ? `Customer found: ${matchedClient.name} — this file will appear in their dashboard.`
                  : customerName.trim() && customerPhone.trim()
                  ? 'No customer found with that name and phone number.'
                  : 'Enter both the customer name and phone number.'}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Target Project Folio</label>
              <select
                className="form-select"
                value={resolvedProjectId ?? ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {(lookingUp && matchedClient ? matchedProjects : projects).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.typology}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Work Location (Customer Folder)</label>
              {existingLocations.length > 0 && (
                <select
                  className="form-select"
                  value={usingNewLocation ? '__new__' : locChoice || existingLocations[0]}
                  onChange={(e) => setLocChoice(e.target.value)}
                >
                  {existingLocations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                  <option value="__new__">+ Add a new location...</option>
                </select>
              )}
              {usingNewLocation && (
                <input
                  type="text"
                  className="form-input"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Mumbai, Bihar, Pune"
                  style={existingLocations.length > 0 ? { marginTop: 8 } : undefined}
                  required
                />
              )}
              <span style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
                The customer sees this file inside this location's folder in their dashboard.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Drawing Sheet Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  placeholder="e.g. Floor Plan — Master Layout"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Revision</label>
                <input
                  type="text"
                  className="form-input"
                  value={revNo}
                  onChange={(e) => setRevNo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Sheet Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={sheetCode}
                  onChange={(e) => setSheetCode(e.target.value)}
                  placeholder="e.g. ARCH-PLAN-01"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DrawingSheet['category'])}
                >
                  <option value="floor-plan">Floor Plan</option>
                  <option value="furniture">Furniture Layout</option>
                  <option value="electrical">Electrical Layout</option>
                  <option value="ceiling">False Ceiling</option>
                  <option value="kitchen">Kitchen &amp; Joinery</option>
                  <option value="wardrobe">Wardrobe</option>
                  <option value="hvac">HVAC</option>
                  <option value="structural">Structural</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Revision Justification &amp; Redline Summary</label>
              <textarea
                className="form-textarea"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Detail any offset adjustments, client concessions, or contractor site changes..."
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="check-watermark-real" defaultChecked style={{ width: 16, height: 16, accentColor: '#737373' }} />
              <label htmlFor="check-watermark-real" style={{ fontSize: 12, color: 'var(--ink-primary)' }}>
                Publish to the client portal immediately
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeUploadModal}>
              CANCEL
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'UPLOADING...' : 'REGISTER REVISION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
