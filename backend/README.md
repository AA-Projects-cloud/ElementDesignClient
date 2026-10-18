# Atelier Studio OS — Backend Architecture & Database Guide

## 1. Overview
The backend powers **Atelier Studio OS** with a high-integrity PostgreSQL database hosted via Supabase, complete with Row Level Security (RLS), realtime subscriptions, private storage buckets, and Edge Functions.

## 2. Directory Structure
```
backend/
├── supabase/
│   ├── migrations/
│   │   └── 20261011000000_init_schema.sql  # Complete schema, RLS, triggers & seed data
│   └── functions/
│       ├── convert-drawing/                # Ingestion & CAD conversion lifecycle
│       ├── send-message/                   # WhatsApp, SMS, and Email outbox dispatcher
│       ├── reset-pin/                      # Cryptographic salted hash generation
│       └── log-access/                     # Tamper-evident audit trail recorder
├── .env.example                            # Supabase and provider environment template
└── README.md
```

## 3. Database Setup Instructions

### Step 1: Create Supabase Project
1. Log into your [Supabase Dashboard](https://app.supabase.com) and create a new project (e.g., `atelier-studio-os`).
2. Copy your Project URL, `anon` public key, and `service_role` key from **Settings → API**.

### Step 2: Run Database Migration & Seed
Run the initial schema in the Supabase SQL Editor:
- Navigate to **SQL Editor → New Query**.
- Paste the entire contents of [`supabase/migrations/20261011000000_init_schema.sql`](./supabase/migrations/20261011000000_init_schema.sql).
- Click **Run**.
This provisions all 14 tables, enables realtime replication on active tables, enforces strict Row Level Security (RLS), and seeds the system with the 4 default client commissions (Rahul Sharma, Priya Mehta, Arjun Kapoor, Neha Patel).

### Step 3: Create Private Storage Buckets
In the Supabase Dashboard under **Storage**, create the following 4 private buckets:
1. `drawings` — for original DWG, DXF, and master vector PDFs.
2. `previews` — for SVG / PNG raster vector sheets.
3. `site-photos` — for site supervisor milestone inspection photos.
4. `documents` — for client estimates, schedules, and warranties.

### Step 4: Configure Phone / OTP Authentication
In **Authentication → Providers**:
- Enable **Phone** auth (Twilio or Test Mode).
- Alternatively, clients can authenticate with Email Magic Link.

---

## 4. Demo Accounts & Credentials

The seed data provisions the following roles:

| Role | Name | Identifier / Phone | Security Credentials | Default Folio Scope |
|---|---|---|---|---|
| **Admin** | Julian Vane (Principal Director) | `julian.vane@atelier-contracting.com` | Standard Staff Auth | Full Studio Administration (All 14 Sites) |
| **Staff** | Sameer Verma (Lead Tech Director) | `sameer.verma@atelier-contracting.com` | Standard Staff Auth | Full Studio Administration |
| **Client** | Rahul Sharma | `+91 98201 44521` (Portal: `rahul.sharma`) | PIN: `9038` | Sharma Residence (4BHK Juhu) Single-Project Lock |
| **Client** | Priya Mehta | `+91 99302 11954` (Portal: `priya.mehta`) | PIN: `4412` | Mehta Apartment (3BHK Bandra) Single-Project Lock |
| **Client** | Arjun Kapoor | `+91 97119 58230` (Portal: `arjun.kapoor`) | PIN: `7721` | Kapoor Villa (Coastal Estate, Alibaug) |
| **Client** | Neha Patel | `+91 98409 32119` (Portal: `neha.patel`) | PIN: `8302` | Patel Residence (Duplex Penthouse, Worli) |

---

## 5. External Provider Integrations

### Connecting WhatsApp & SMS (Twilio)
Set the following environment variables in Supabase:
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```
When configured, notifications dispatched from the **Client Inspector** or the **Upload Studio** are sent live to client mobile devices. When keys are absent, all messages queue safely in the `outbox` table with status `queued` and display a clear *"Queued in Outbox (no provider connected)"* note.

### Connecting Email (Resend)
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@atelier-contracting.com
```

### Connecting CAD / DWG Converter (CloudConvert)
```bash
CLOUDCONVERT_API_KEY=...
```
Uploaded `.dwg` drawings will automatically trigger vector rasterization and produce 600 DPI PDF vector releases.
