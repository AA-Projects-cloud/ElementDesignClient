import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Film } from 'lucide-react';
import { fileStorageService, MediaType } from '../services/fileStorageService';

export const useFileUrl = (path?: string) =>
  useQuery({
    queryKey: ['fileUrl', path],
    queryFn: () => fileStorageService.getUrl(path as string),
    enabled: Boolean(path),
    staleTime: 45 * 60 * 1000,
  });

interface MediaViewProps {
  path?: string;
  mediaType?: MediaType;
  alt?: string;
  autoPlay?: boolean;
  /** thumb: small preview tile (no controls). full: interactive viewer. */
  mode?: 'thumb' | 'full';
  style?: React.CSSProperties;
}

/** Renders a stored PDF, image or video. Thumbnails stay lightweight; full mode is interactive. */
export const MediaView: React.FC<MediaViewProps> = ({ path, mediaType = 'image', alt = '', mode = 'thumb', autoPlay = false, style }) => {
  const { data: url, isLoading } = useFileUrl(path);

  const box: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    color: 'var(--ink-secondary)',
    fontSize: 11,
    ...style,
  };

  if (!path) return <div style={box}>No file</div>;
  if (isLoading) return <div style={box}>Loading…</div>;
  if (!url) return <div style={box}>File unavailable</div>;

  if (mediaType === 'video') {
    if (mode === 'thumb') {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <video src={url} muted preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />
          <div style={{ position: 'absolute', right: 6, bottom: 6, background: '#737373', color: '#FFF', borderRadius: 2, padding: '2px 5px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700 }}>
            <Film size={10} /> VIDEO
          </div>
        </div>
      );
    }
    return <video src={url} controls autoPlay={autoPlay} style={{ width: '100%', height: '100%', objectFit: 'contain', ...style }} />;
  }

  if (mediaType === 'pdf') {
    if (mode === 'thumb') {
      // Show the real first page of the PDF as the preview
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#FFFFFF' }}>
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            title={alt || 'PDF preview'}
            tabIndex={-1}
            style={{ width: '100%', height: '100%', border: 0, pointerEvents: 'none', background: '#FFFFFF' }}
          />
          <div
            style={{
              position: 'absolute',
              right: 8,
              bottom: 8,
              background: '#737373',
              color: '#FFF',
              borderRadius: 2,
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            <FileText size={10} /> PDF
          </div>
        </div>
      );
    }
    return <iframe src={url} title={alt || 'PDF'} style={{ width: '100%', height: '100%', border: 0, ...style }} />;
  }

  return <img src={url} alt={alt} style={{ width: '100%', height: '100%', objectFit: mode === 'full' ? 'contain' : 'cover', ...style }} />;
};
