import { supabase, isSupabaseConfigured } from './supabaseClient';

export type MediaType = 'pdf' | 'image' | 'video' | 'other';
export type StorageBucket = 'drawings' | 'site-photos' | 'documents';

// Supabase free plan allows up to 50 MB per file.
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_MEDIA = 'application/pdf,.pdf,image/*,video/*';

export interface StoredFile {
  path: string;
  mediaType: MediaType;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
}

export const detectMediaType = (mimeType: string, fileName = ''): MediaType => {
  const mime = (mimeType || '').toLowerCase();
  const name = fileName.toLowerCase();
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|heic|avif)$/.test(name)) return 'image';
  if (mime.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/.test(name)) return 'video';
  return 'other';
};

export const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/** Returns an error message when the file can't be uploaded, otherwise null. */
export const validateFile = (file: File): string | null => {
  if (detectMediaType(file.type, file.name) === 'other') {
    return `${file.name}: unsupported format. Upload a PDF, an image or a video.`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name} is ${formatBytes(file.size)}. The maximum file size is 50 MB.`;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Local driver (IndexedDB) — used until Supabase keys are configured.
// ---------------------------------------------------------------------------
const DB_NAME = 'element_design_files';
const STORE = 'files';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idbRun = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const urlCache = new Map<string, { url: string; expires: number }>();

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, '_');

export const fileStorageService = {
  async upload(bucket: StorageBucket, folder: string, file: File): Promise<StoredFile> {
    const invalid = validateFile(file);
    if (invalid) throw new Error(invalid);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const path = `${bucket}/${folder}/${id}-${safeName(file.name)}`;
    const mimeType = file.type || 'application/octet-stream';

    if (isSupabaseConfigured) {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path.slice(bucket.length + 1), file, { contentType: mimeType, upsert: false });
      if (error) throw new Error(`Upload failed: ${error.message}`);
    } else {
      await idbRun('readwrite', (s) => s.put(file, path));
    }

    return {
      path,
      mediaType: detectMediaType(mimeType, file.name),
      mimeType,
      fileName: file.name,
      sizeBytes: file.size,
    };
  },

  /** Resolves a stored path into a URL the browser can display or download. */
  async getUrl(path: string): Promise<string> {
    if (!path) return '';
    // Static assets and absolute URLs need no lookup.
    if (path.startsWith('/') || path.startsWith('http') || path.startsWith('blob:')) return path;

    const cached = urlCache.get(path);
    if (cached && cached.expires > Date.now()) return cached.url;

    if (isSupabaseConfigured) {
      const bucket = path.split('/')[0];
      const key = path.slice(bucket.length + 1);
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, 60 * 60);
      if (error || !data) throw new Error(error?.message || 'Could not load file');
      urlCache.set(path, { url: data.signedUrl, expires: Date.now() + 50 * 60 * 1000 });
      return data.signedUrl;
    }

    const blob = await idbRun<Blob | undefined>('readonly', (s) => s.get(path));
    if (!blob) return '';
    const url = URL.createObjectURL(blob);
    urlCache.set(path, { url, expires: Number.MAX_SAFE_INTEGER });
    return url;
  },

  async download(path: string, fileName: string): Promise<void> {
    const url = await this.getUrl(path);
    if (!url) throw new Error('File not found');
    const res = await fetch(url);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  },

  async getBlob(path: string): Promise<Blob | null> {
    const url = await this.getUrl(path);
    if (!url) return null;
    return (await fetch(url)).blob();
  },
};
