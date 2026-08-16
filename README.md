# Darshit Gadhiya — Marriage Biodata

A dynamic, cloud-powered digital marriage biodata.

Everything you see on the public page is stored in **Supabase** — Postgres for the
details, Supabase Storage for the photograph. Edit anything from the admin
dashboard on any device and the change is live on the public website
immediately. **No rebuild. No redeploy.**

- **Public page** — `/` · elegant, animated, printable, no login required
- **Admin login** — `/login`
- **Admin dashboard** — `/admin` · protected, with a live preview of the public page

---

## Table of contents

1. [Tech stack](#1-tech-stack)
2. [Project structure](#2-project-structure)
3. [Quick start](#3-quick-start)
4. [Supabase setup (step by step)](#4-supabase-setup-step-by-step)
5. [Creating the admin account](#5-creating-the-admin-account)
6. [Environment variables](#6-environment-variables)
7. [Running locally](#7-running-locally)
8. [Deploying to Vercel](#8-deploying-to-vercel)
9. [Everyday use](#9-everyday-use)
10. [Security model](#10-security-model)
11. [Testing checklist](#11-testing-checklist)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 18 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 3 (custom champagne/ivory design tokens) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Routing | React Router 7 (data router) |
| Data fetching / cache | TanStack Query 5 |
| Forms + validation | React Hook Form + Zod |
| Database / Auth / Storage / Realtime | Supabase |
| Hosting | Vercel |

---

## 2. Project structure

```
.
├── index.html                     # SEO + Open Graph tags, no-flash theme script
├── vercel.json                    # SPA rewrites, cache + security headers
├── .env.example                   # Copy to .env
├── public/
│   ├── profile-photo.jpg          # Bundled fallback portrait
│   ├── og-image.jpg               # Social share preview
│   └── apple-touch-icon.png
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_biodata.sql
│   │   ├── 002_create_hobbies.sql
│   │   ├── 003_create_maternal_relatives.sql
│   │   ├── 004_create_storage_policies.sql
│   │   └── 005_create_rls_policies.sql
│   └── seed.sql                   # Initial biodata (from the source PDF)
└── src/
    ├── components/
    │   ├── ui/                    # Button, Field, Toaster, ConfirmDialog, QrCode, States…
    │   ├── public/                # Hero, sections, Navbar, BiodataView, ShareSection…
    │   └── admin/                 # BiodataSectionForm, LivePreview, OrderedListEditor…
    ├── pages/
    │   ├── PublicBiodataPage.tsx
    │   ├── LoginPage.tsx
    │   ├── NotFoundPage.tsx
    │   └── admin/                 # Dashboard, Personal, Family, Maternal, Education,
    │                              # Career, Hobbies, Contact, Photo, Settings
    ├── layouts/AdminLayout.tsx
    ├── services/                  # biodata / hobbies / maternal / storage / auth
    ├── hooks/                     # useBiodata, useHobbies, useAuth, useTheme, useToast…
    ├── lib/                       # supabase client, env, query client, query keys
    ├── types/                     # database.ts (schema types) + domain types
    ├── utils/                     # format, image, validation, share, cn
    ├── data/defaults.ts           # Original PDF values (backs "Reset to default")
    └── styles/index.css           # Design tokens, dark palette, print stylesheet
```

**Architectural rule:** no biodata value is hardcoded in a component. Every field
is read from Supabase through the service layer and rendered from props.

---

## 3. Quick start

```bash
git clone <your-repo-url>
cd Biodata
npm install
cp .env.example .env      # then fill in your Supabase URL + anon key
npm run dev               # http://localhost:5173
```

You still need a Supabase project — see the next section.

---

## 4. Supabase setup (step by step)

### 4.1 Create the project

1. Go to <https://supabase.com/dashboard> and select **New project**.
2. Name it (e.g. `darshit-biodata`), choose a strong database password, and pick
   a region close to your visitors (`Mumbai (ap-south-1)` for India).
3. Wait for provisioning to finish (~2 minutes).

### 4.2 Run the migrations

**Option A — SQL Editor (no tooling required).**

Open **SQL Editor → New query** and run each file's contents **in order**:

1. `supabase/migrations/001_create_biodata.sql`
2. `supabase/migrations/002_create_hobbies.sql`
3. `supabase/migrations/003_create_maternal_relatives.sql`
4. `supabase/migrations/004_create_storage_policies.sql`
5. `supabase/migrations/005_create_rls_policies.sql`

Then run `supabase/seed.sql` to insert the initial biodata.

**Option B — Supabase CLI.**

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push                 # applies supabase/migrations/*
psql "$DATABASE_URL" -f supabase/seed.sql
```

> Every migration is idempotent — re-running them is safe.

### 4.3 What the migrations create

**Tables**

| Table | Purpose |
| --- | --- |
| `biodata` | The profile: personal, family, education, career, contact, photo URL |
| `hobbies` | Hobbies & interests (`biodata_id` FK, `display_order`) |
| `maternal_relatives` | Maternal relatives (`biodata_id` FK, `display_order`) |

UUID primary keys, foreign keys with `ON DELETE CASCADE`, indexes on the
`(biodata_id, display_order)` read path, and an `updated_at` trigger.

**Storage** — bucket `biodata-assets` (public read, 5 MB limit, only
`image/jpeg`, `image/png`, `image/webp` accepted). Photos live in Storage;
only the URL is stored in Postgres.

**Row Level Security** — enabled on all three tables:

| Role | Read | Write |
| --- | --- | --- |
| `anon` (visitors) | Published rows only | ❌ Denied by the database |
| `authenticated` (admin) | Everything | ✅ Insert / update / delete |

**Realtime** — the three tables are added to the `supabase_realtime`
publication, so an open public page refreshes itself when you save.

### 4.4 Verify the storage bucket

**Storage → Buckets** should list `biodata-assets` as **Public**. If migration
004 did not create it (some projects restrict `storage.buckets` inserts), create
it by hand:

- Name: `biodata-assets`
- Public bucket: **on**
- File size limit: `5 MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp`

Then re-run only the policy statements from `004_create_storage_policies.sql`.

---

## 5. Creating the admin account

There is **no public sign-up page** — that is deliberate. Create the single
admin account by hand:

1. Supabase Dashboard → **Authentication → Users → Add user → Create new user**.
2. Enter the admin email and a strong password.
3. Tick **Auto Confirm User** (so no confirmation email is needed).
4. Select **Create user**.

Recommended hardening, under **Authentication → Providers → Email**:

- Turn **Enable email signups** **off** — nobody can self-register.
- Leave **Email OTP / magic link** off unless you want it.

That account is the only login that works at `/login`.

---

## 6. Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | ✅ | Project Settings → API → **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Project Settings → API → **anon public** key |
| `VITE_SITE_URL` | Recommended | Canonical public URL — used by the QR code, share sheet and canonical tag |

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_SITE_URL=https://darshit-biodata.vercel.app
```

> ⚠️ **Never** put the `service_role` key in a `VITE_*` variable, a `.env`
> committed to git, or anywhere in this frontend. The anon key is safe to ship:
> Row Level Security — not secrecy — is what protects the data.
> `.env` is already in `.gitignore`.

---

## 7. Running locally

```bash
npm install        # install dependencies
npm run dev        # dev server at http://localhost:5173
npm run build      # typecheck (tsc -b) + production build to dist/
npm run preview    # serve the production build locally
npm run typecheck  # TypeScript only
```

---

## 8. Deploying to Vercel

### 8.1 Import the project

1. Push this repository to GitHub.
2. Go to <https://vercel.com/new> and import the repository.
3. Vercel detects Vite automatically. `vercel.json` already pins:
   - Build command: `npm run build`
   - Output directory: `dist`
   - SPA rewrites, so `/admin` and `/login` work on a hard refresh
   - Long-lived cache headers for hashed assets, plus basic security headers

### 8.2 Add the environment variables

**Project → Settings → Environment Variables**, and add each for
**Production**, **Preview** *and* **Development**:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon public key |
| `VITE_SITE_URL` | `https://<your-project>.vercel.app` |

Or from the CLI:

```bash
npm i -g vercel
vercel link
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SITE_URL production
vercel --prod
```

### 8.3 Getting your production URL

The first deploy gives you `https://<project>.vercel.app`. Set that as
`VITE_SITE_URL` and redeploy once so the QR code and share links point at it.

For a custom domain: **Settings → Domains → Add**, follow the DNS instructions,
then update `VITE_SITE_URL` to the custom domain and redeploy.

> Environment variables are read at **build** time, so changing one needs a
> redeploy. Changing **biodata** never does — that lives in Supabase.

---

## 9. Everyday use

### Changing biodata information

1. Open `https://your-site.vercel.app/login` and sign in.
2. Pick a section in the sidebar (Personal, Family, Maternal, Education, Career,
   Hobbies, Contact).
3. Edit the fields. The **live preview** on the right updates as you type.
4. Select **Save Changes** → “Changes saved successfully”.
5. The public website shows the new value immediately, on every device.

Extras: **Cancel** restores the last saved values, **Reset** puts the original
biodata values back into the form (not saved until you press Save), and leaving
a page with unsaved edits asks for confirmation.

### Changing the profile photo

1. **Admin → Photo**.
2. Choose or drag in a JPEG / PNG / WEBP (up to 5 MB). It is validated, resized
   to max 1200px and compressed **in your browser** before uploading.
3. Check the preview, then **Save Photo**. A progress bar shows the upload.
4. The new image is stored in the `biodata-assets` bucket, its public URL is
   saved to Postgres, and the previous file is deleted automatically.

**Delete uploaded photo** reverts to the portrait bundled with the site.

### Hobbies and maternal relatives

**Admin → Hobbies** / **Admin → Maternal**: add, rename, reorder (↑ / ↓) or
delete. Each action writes to Supabase straight away — no separate save step.

### Sharing

- **Share Biodata** — native share sheet on mobile, copies the link elsewhere
- **Copy Link** — clipboard, with a “Link copied!” toast
- **QR code** — on the public page, and downloadable as a PNG from
  **Admin → Settings**
- **Download PDF / Print** — opens the print dialog against a dedicated print
  stylesheet (choose *Save as PDF* as the destination). Navigation, buttons,
  toasts and animations are stripped; the photo and all sections are kept.

### Hiding the biodata temporarily

**Admin → Settings → Visibility → Hide from visitors** flips `is_published`.
Anonymous visitors then see an empty state — enforced by RLS, not by the UI.

### Reset to default

**Admin → Settings → Reset to Default** (with confirmation) restores every
field, all hobbies and all maternal relatives to the original biodata values in
`src/data/defaults.ts`. Your uploaded photo is kept.

---

## 10. Security model

- **RLS is the boundary, not the UI.** Anonymous users hold the anon key (it is
  in the bundle — that is expected) and could call PostgREST directly. The
  policies in `005_create_rls_policies.sql` allow `anon` to `SELECT` published
  rows and nothing else; every insert/update/delete requires an authenticated
  session.
- **Storage is locked the same way.** Public read, writes restricted to
  `authenticated`, with the MIME allow-list and size cap enforced by the bucket.
- **No service-role key in the browser.** Only `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY` and `VITE_SITE_URL` reach the client, and all three
  are meant to be public.
- **No public registration.** One account, created by hand.
- **`/admin` redirect is a convenience.** `ProtectedRoute` improves the
  experience; the database is what actually refuses unauthorised writes.
- **Vague auth errors.** Failed logins say “Incorrect email or password”, never
  whether the address exists.
- **Server-side validation too.** `CHECK` constraints and unique indexes back up
  the Zod schemas in the browser.

Quick proof — this must fail with a row-level-security error:

```bash
curl -X PATCH "$VITE_SUPABASE_URL/rest/v1/biodata?id=eq.<row-id>" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"hacked"}'
```

---

## 11. Testing checklist

| | Check |
| --- | --- |
| ☐ | Public website loads at `/` without logging in |
| ☐ | All biodata values match the source information |
| ☐ | Profile photo loads |
| ☐ | `/admin` redirects to `/login` while signed out |
| ☐ | Wrong password is rejected; correct password signs in |
| ☐ | Personal / Family / Maternal / Education / Career / Contact can be edited and saved |
| ☐ | Live preview updates as you type, before saving |
| ☐ | Hobbies can be added, edited, reordered and deleted |
| ☐ | Maternal relatives can be added, edited, reordered and deleted |
| ☐ | Profile photo can be replaced and deleted |
| ☐ | Changes persist after a refresh |
| ☐ | Changes appear in a second browser and on a phone |
| ☐ | The anon `curl` above is rejected |
| ☐ | Logout returns you to `/login` |
| ☐ | Light / Dark / System all look right and the choice persists |
| ☐ | Mobile navigation opens and scrolls to sections |
| ☐ | Print / Download PDF produce a clean sheet |
| ☐ | Share and QR code work |
| ☐ | `npm run build` succeeds with no TypeScript errors |
| ☐ | No console errors in the browser |

---

## 12. Troubleshooting

**“This biodata is not connected yet.”**
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing. Add them to `.env`
(local) or Vercel (deployed) and restart / redeploy.

**“No biodata published yet.”**
The `biodata` table is empty. Run `supabase/seed.sql`, or sign in to `/admin`
and use **Create biodata**.

**Saving fails with “You are not allowed to make this change.”**
Your session expired, or migration 005 was not applied. Sign in again; if it
persists, re-run `005_create_rls_policies.sql`.

**Photo upload fails.**
Check the `biodata-assets` bucket exists and is public (§4.4), that the file is
under 5 MB, and that it is JPEG/PNG/WEBP.

**Public page does not live-update.**
Realtime needs WebSockets, which some networks block. The page still refetches
on load, on tab focus and on reconnect — a refresh always shows current data.
Confirm the tables are in the `supabase_realtime` publication (migration 005).

**`/admin` 404s after deploying.**
The SPA rewrite in `vercel.json` is missing or was overridden. Ensure
`vercel.json` is committed at the repository root.

**QR code points at localhost.**
`VITE_SITE_URL` was not set at build time. Set it in Vercel and redeploy.

---

## Credits

Initial biodata content is taken verbatim from the source biodata document.
Nothing was invented — fields absent from the source are left empty.
