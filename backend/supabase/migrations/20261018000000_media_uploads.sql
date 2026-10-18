-- ============================================================================
-- ELEMENT DESIGN — MEDIA UPLOADS (PDF / IMAGE / VIDEO) & STORAGE POLICIES
-- Run AFTER 20261011000000_init_schema.sql
-- ============================================================================

-- 1. Record what kind of file each row points to
ALTER TABLE public.revisions       ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('pdf', 'image', 'video', 'other'));
ALTER TABLE public.revisions       ADD COLUMN IF NOT EXISTS mime_type  TEXT;
ALTER TABLE public.revisions       ADD COLUMN IF NOT EXISTS file_name  TEXT;
ALTER TABLE public.documents       ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('pdf', 'image', 'video', 'other'));
ALTER TABLE public.documents       ADD COLUMN IF NOT EXISTS file_name  TEXT;
ALTER TABLE public.site_log_photos ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('pdf', 'image', 'video', 'other'));

-- 2. Private storage buckets (50 MB per file = Supabase free plan limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('drawings',    'drawings',    false, 52428800, ARRAY['application/pdf', 'image/*', 'video/*']),
  ('site-photos', 'site-photos', false, 52428800, ARRAY['image/*', 'video/*']),
  ('documents',   'documents',   false, 52428800, ARRAY['application/pdf', 'image/*', 'video/*'])
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Storage access: files live at <bucket>/<project_id>/<file>
--    Admin/staff can read and write everything; a customer can only READ files of their own project.
CREATE POLICY "Staff manage media files" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id IN ('drawings', 'site-photos', 'documents') AND public.is_admin_or_staff())
  WITH CHECK (bucket_id IN ('drawings', 'site-photos', 'documents') AND public.is_admin_or_staff());

CREATE POLICY "Clients read own project media" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('drawings', 'site-photos', 'documents')
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM public.projects WHERE client_id = public.get_client_id_for_user()
    )
  );

-- 4. Realtime for documents too, so new uploads appear instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_log_photos;
