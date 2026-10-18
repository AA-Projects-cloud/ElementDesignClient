import React, { useState, useRef } from 'react';
import { useUiStore } from '../store/useUiStore';
import { X, ZoomIn, ZoomOut, RotateCcw, SplitSquareVertical, Printer, Download } from 'lucide-react';
import { fileStorageService } from '../services/fileStorageService';
import { MediaView } from './MediaView';

export const VectorLightbox: React.FC = () => {
  const { lightboxState, closeLightbox, toggleRedlineInLightbox, addToast } = useUiStore();
  const [zoom, setZoom] = useState(1);
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  if (!lightboxState.isOpen) return null;

  const handlePointerDown = () => {
    isDragging.current = true;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const handlePrint = () => {
    window.print();
    addToast('Vector sheet sent to architectural plotter queue.', 'info');
  };

  const media = lightboxState.media;
  const hasPrev = Boolean(media?.prevPath);

  const handleDownload = async () => {
    if (!media?.path) {
      addToast('No file is attached to this sheet.', 'error');
      return;
    }
    try {
      await fileStorageService.download(media.path, media.fileName || lightboxState.sheetCode);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Download failed', 'error');
    }
  };

  return (
    <div className="modal-overlay active" onClick={closeLightbox}>
      <div className="modal-sheet lightbox-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="label-xs" style={{ background: '#111', color: '#FFF', padding: '2px 6px', borderRadius: 2 }}>
              VECTOR INSPECTOR
            </span>
            <h3 style={{ fontSize: 16 }}>
              {lightboxState.sheetCode} — {lightboxState.title}
            </h3>
            <span className="badge badge-approved">{lightboxState.revNo} [ACTIVE]</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-icon" onClick={handlePrint} title="Print / Plot Vector">
              <Printer size={15} />
            </button>
            <button className="btn btn-icon" onClick={closeLightbox} title="Close Lightbox">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: 12 }}>
          <div
            className="lightbox-viewport"
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div
              className="lightbox-canvas"
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.15s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
              }}
            >
              {lightboxState.isRedlineDiff && hasPrev ? (
                /* Split Comparison Slider: Rev 03 Current vs Rev 02 Superseded */
                <div className="compare-container">
                  <div className="compare-layer-superseded">
                    <MediaView path={media?.prevPath} mediaType={media?.prevMediaType} mode="full" alt="Previous revision" />
                  </div>
                  <div className="compare-layer-current" style={{ width: `${sliderPos}%` }}>
                    <MediaView path={media?.path} mediaType={media?.mediaType} mode="full" alt="Current revision" />
                  </div>
                  <div
                    className="compare-slider-control"
                    style={{ left: `${sliderPos}%` }}
                    onPointerDown={handlePointerDown}
                  >
                    <span style={{ fontSize: 10, fontWeight: 800 }}>⇄</span>
                  </div>
                </div>
              ) : (
                /* Standard Vector View */
                <MediaView path={media?.path} mediaType={media?.mediaType} mode="full" autoPlay alt={lightboxState.title} />
              )}
            </div>

            {/* Bottom Floating Toolbar */}
            <div className="lightbox-toolbar">
              <button className="btn btn-icon" onClick={() => setZoom(Math.max(0.6, zoom - 0.25))} title="Zoom Out">
                <ZoomOut size={14} />
              </button>
              <button className="btn btn-icon" onClick={() => setZoom(1)} title="Reset Scale">
                <RotateCcw size={14} />
              </button>
              <button className="btn btn-icon" onClick={() => setZoom(Math.min(3, zoom + 0.25))} title="Zoom In">
                <ZoomIn size={14} />
              </button>
              {hasPrev && media?.mediaType !== 'video' && media?.mediaType !== 'pdf' && (
                <>
                  <div style={{ width: 1, height: 20, backgroundColor: 'var(--border-hairline)' }} />
                  <button
                    className={`btn btn-secondary btn-sm ${lightboxState.isRedlineDiff ? 'active' : ''}`}
                    onClick={toggleRedlineInLightbox}
                  >
                    <SplitSquareVertical size={13} />
                    TOGGLE REDLINE DIFF ({lightboxState.revNo} VS {media?.prevRevNo})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <span style={{ fontSize: 11.5, color: 'var(--ink-secondary)', marginRight: 'auto', fontFamily: 'var(--font-mono)' }}>
            {media?.fileName || 'Uploaded file'}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
            <Download size={13} />
            DOWNLOAD FILE
          </button>
        </div>
      </div>
    </div>
  );
};
