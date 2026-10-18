-- ============================================================================
-- NOTE: replace YOUR_ADMIN_SECURITY_KEY (2 places) with your own admin code before running.
-- ELEMENT DESIGN — PRODUCTION SCHEMA & REALTIME SETUP
-- Migration: 20261011000000_init_schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES & ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'client')),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2. CLIENTS (Authenticated folios & security hashes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    portal_id TEXT UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL, -- Salted crypt() hash
    tag TEXT DEFAULT 'ACTIVE',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    watermark_strict BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    last_login_ip TEXT,
    last_login_device TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. PROJECTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    typology TEXT NOT NULL,
    location TEXT NOT NULL,
    area_sqft NUMERIC NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('execution', 'design', 'handover', 'archived')),
    progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
    lead_architect_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    lead_architect_name TEXT,
    ref_code TEXT UNIQUE NOT NULL,
    vault_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 4. DRAWING SHEETS & REVISIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drawing_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('floor-plan', 'furniture', 'electrical', 'ceiling', 'kitchen', 'wardrobe', 'hvac', 'structural')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_id UUID REFERENCES public.drawing_sheets(id) ON DELETE CASCADE,
    rev_no TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('current', 'superseded')),
    note TEXT,
    file_path TEXT NOT NULL,
    pdf_path TEXT,
    preview_path TEXT,
    size_bytes BIGINT DEFAULT 0,
    scale TEXT DEFAULT '1:50 @ A1',
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 5. PROCESSING JOBS (CAD -> Flattened PDF pipeline)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revision_id UUID REFERENCES public.revisions(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('queued', 'parsing', 'flattening', 'pdf_ready', 'published', 'failed', 'awaiting_converter')),
    error TEXT,
    started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    finished_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 6. SITE LOGS & FIELD VERIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    logged_by TEXT NOT NULL,
    verified_by TEXT,
    test_report JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_log_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID REFERENCES public.site_logs(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    caption TEXT NOT NULL,
    tag TEXT
);

-- ----------------------------------------------------------------------------
-- 7. DOCUMENTS & SPECIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('contract', 'materials', 'warranty', 'technical', 'handover')),
    badge TEXT,
    path TEXT NOT NULL,
    size_bytes BIGINT DEFAULT 0,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 8. REALTIME NOTIFICATIONS & OUTBOX
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
    "to" TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
    provider_message_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 9. CLIENT INTERACTIONS & AUDIT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.callback_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    preferred_time TEXT,
    topic TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.revision_acks (
    revision_id UUID REFERENCES public.revisions(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    acked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (revision_id, client_id)
);

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    ip TEXT,
    user_agent TEXT,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 10. REALTIME REPLICATION PUBLICATION
-- ----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.drawing_sheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.revisions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.processing_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.outbox;
ALTER PUBLICATION supabase_realtime ADD TABLE public.callback_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;

-- ----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawing_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_log_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_acks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER so policies can look at profiles safely)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'));
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.get_client_id_for_user()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
    SELECT id FROM public.clients WHERE profile_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.client_project_ids()
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
    SELECT id FROM public.projects WHERE client_id = public.get_client_id_for_user();
$$;

-- ----------------------------------------------------------------------------
-- 11b. SECURITY RULES
--   * Admin/staff manage everything.
--   * A customer can only READ rows that belong to their own project, and only
--     APPROVED site logs. Customers can never change roles, projects or files.
--   * Only admins can edit profiles, so nobody can promote themselves.
-- ----------------------------------------------------------------------------
CREATE POLICY "profiles read" ON public.profiles FOR SELECT USING (public.is_admin_or_staff() OR id = auth.uid());
CREATE POLICY "profiles admin write" ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "clients read" ON public.clients FOR SELECT USING (public.is_admin_or_staff() OR id = public.get_client_id_for_user());
CREATE POLICY "clients staff write" ON public.clients FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "projects read" ON public.projects FOR SELECT USING (public.is_admin_or_staff() OR client_id = public.get_client_id_for_user());
CREATE POLICY "projects staff write" ON public.projects FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "sheets read" ON public.drawing_sheets FOR SELECT USING (public.is_admin_or_staff() OR project_id IN (SELECT public.client_project_ids()));
CREATE POLICY "sheets staff write" ON public.drawing_sheets FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "revisions read" ON public.revisions FOR SELECT USING (
    public.is_admin_or_staff() OR sheet_id IN (SELECT id FROM public.drawing_sheets WHERE project_id IN (SELECT public.client_project_ids()))
);
CREATE POLICY "revisions staff write" ON public.revisions FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "jobs staff only" ON public.processing_jobs FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "site logs read" ON public.site_logs FOR SELECT USING (
    public.is_admin_or_staff() OR (project_id IN (SELECT public.client_project_ids()) AND status = 'approved')
);
CREATE POLICY "site logs staff write" ON public.site_logs FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "site log photos read" ON public.site_log_photos FOR SELECT USING (
    public.is_admin_or_staff() OR log_id IN (
        SELECT id FROM public.site_logs WHERE project_id IN (SELECT public.client_project_ids()) AND status = 'approved'
    )
);
CREATE POLICY "site log photos staff write" ON public.site_log_photos FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "documents read" ON public.documents FOR SELECT USING (public.is_admin_or_staff() OR project_id IN (SELECT public.client_project_ids()));
CREATE POLICY "documents staff write" ON public.documents FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "notifications own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications mark read" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications staff write" ON public.notifications FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "outbox staff only" ON public.outbox FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());

CREATE POLICY "audit staff read" ON public.audit_log FOR SELECT USING (public.is_admin_or_staff());
CREATE POLICY "audit insert own" ON public.audit_log FOR INSERT WITH CHECK (actor_id = auth.uid());

CREATE POLICY "callbacks staff" ON public.callback_requests FOR ALL USING (public.is_admin_or_staff()) WITH CHECK (public.is_admin_or_staff());
CREATE POLICY "callbacks own read" ON public.callback_requests FOR SELECT USING (client_id = public.get_client_id_for_user());
CREATE POLICY "callbacks own insert" ON public.callback_requests FOR INSERT WITH CHECK (client_id = public.get_client_id_for_user());

CREATE POLICY "acks staff read" ON public.revision_acks FOR SELECT USING (public.is_admin_or_staff() OR client_id = public.get_client_id_for_user());
CREATE POLICY "acks own insert" ON public.revision_acks FOR INSERT WITH CHECK (client_id = public.get_client_id_for_user());
CREATE POLICY "acks own update" ON public.revision_acks FOR UPDATE USING (client_id = public.get_client_id_for_user()) WITH CHECK (client_id = public.get_client_id_for_user());

-- ----------------------------------------------------------------------------
-- 12. ACCOUNT CREATION
--   Runs automatically when someone signs up (Supabase Auth).
--   * Admin accounts REQUIRE the security key - enforced here, on the server.
--   * Customer accounts get their own customer record + project.
--   * If an admin pre-created a customer with the same email, signing up claims it.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
    v_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    v_role TEXT := COALESCE(v_meta->>'role', 'client');
    v_email TEXT := lower(NEW.email);
    v_name TEXT := COALESCE(NULLIF(v_meta->>'name', ''), split_part(NEW.email, '@', 1));
    v_phone TEXT := NULLIF(v_meta->>'phone', '');
    v_old UUID;
    v_client_id UUID;
BEGIN
    IF v_role NOT IN ('admin', 'client') THEN
        RAISE EXCEPTION 'Invalid account type';
    END IF;
    IF v_role = 'admin' AND COALESCE(v_meta->>'security_key', '') <> 'YOUR_ADMIN_SECURITY_KEY' THEN
        RAISE EXCEPTION 'Invalid admin security key';
    END IF;

    SELECT id INTO v_old FROM public.profiles WHERE lower(email) = v_email AND id <> NEW.id LIMIT 1;
    IF v_old IS NOT NULL THEN
        IF v_role = 'admin' THEN
            RAISE EXCEPTION 'Email already registered';
        END IF;
        UPDATE public.profiles SET email = 'claimed-' || v_old::text || '@invalid.local' WHERE id = v_old;
    END IF;

    INSERT INTO public.profiles (id, role, name, phone, email) VALUES (NEW.id, v_role, v_name, v_phone, v_email);

    IF v_old IS NOT NULL THEN
        UPDATE public.clients SET profile_id = NEW.id WHERE profile_id = v_old;
        DELETE FROM public.profiles WHERE id = v_old;
    ELSIF v_role = 'client' THEN
        INSERT INTO public.clients (profile_id, portal_id, pin_hash, tag)
        VALUES (
            NEW.id,
            regexp_replace(split_part(v_email, '@', 1), '[^a-z0-9]+', '.', 'g') || '.' || substr(md5(random()::text), 1, 4),
            crypt(substr(md5(random()::text), 1, 8), gen_salt('bf')),
            'DESIGN PHASE (STAGE 1)'
        ) RETURNING id INTO v_client_id;

        INSERT INTO public.projects (client_id, name, typology, location, area_sqft, stage, progress_pct, ref_code, vault_key, lead_architect_name)
        VALUES (
            v_client_id, v_name || ' Project', 'To be assigned', 'To be assigned', 0, 'design', 10,
            'ED-' || upper(substr(md5(random()::text), 1, 6)),
            'PR' || upper(substr(md5(random()::text), 1, 6)),
            'To be assigned'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin login check: the caller must already be an admin AND know the security key.
CREATE OR REPLACE FUNCTION public.check_admin_key(p_key TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
    SELECT p_key = 'YOUR_ADMIN_SECURITY_KEY' AND public.is_admin();
$$;

-- Admin tools
CREATE OR REPLACE FUNCTION public.reset_client_pin(p_client_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_pin TEXT := lpad((floor(random() * 10000))::int::text, 4, '0');
BEGIN
    IF NOT public.is_admin_or_staff() THEN RAISE EXCEPTION 'Not allowed'; END IF;
    UPDATE public.clients SET pin_hash = crypt(v_pin, gen_salt('bf')) WHERE id = p_client_id;
    RETURN v_pin;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_staff(p_title TEXT, p_body TEXT, p_link TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin_or_staff() THEN RAISE EXCEPTION 'Not allowed'; END IF;
    INSERT INTO public.notifications (user_id, title, body, link)
    SELECT id, p_title, p_body, p_link FROM public.profiles WHERE role IN ('admin', 'staff');
END;
$$;

-- No demo data is seeded: customers, drawings, logs and documents are all created through the app.
