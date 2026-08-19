# Darshit Gadhiya — Marriage Biodata

A premium, animated, mobile-first digital marriage biodata with a private admin
dashboard that edits the site's content and publishes it straight to GitHub.

**GitHub is the database. Vercel is the host. There is nothing else.**

No Supabase, no Firebase, no SQL, no CMS, no separate backend server.

---

## Contents

- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [The data file](#the-data-file)
- [Install and run locally](#install-and-run-locally)
- [GitHub setup](#github-setup)
- [Vercel setup](#vercel-setup)
- [Using the admin dashboard](#using-the-admin-dashboard)
- [The serverless API](#the-serverless-api)
- [Security](#security)
- [What this is not](#what-this-is-not)

---

## How it works

```
                        GITHUB
                          │
                 ┌────────┴────────┐
                 │                 │
         data/biodata.json   public/images/profile.jpg
                 │                 │
                 └────────┬────────┘
                          ↓
                        VERCEL
                          │
                 ┌────────┴────────┐
                 │                 │
              PUBLIC             ADMIN
             WEBSITE           DASHBOARD
                                   │
                                   ↓
                            Vercel serverless API
                                   │
                                   ↓
                              GitHub API
                                   │
                                   ↓
                          commit to the repo
                                   │
                                   ↓
                          Vercel redeploys
```

The public website reads `data/biodata.json`, which is bundled into the site at
build time — so a visitor gets the content with no database query, no API call
and no loading spinner.

The admin dashboard edits a **draft** of that same file. Pressing
**Publish Changes** sends the draft to a Vercel serverless function, which
validates it and commits it to GitHub. Vercel sees the commit and rebuilds the
site.

### This is not a real-time database

The update path is:

```
Edit → Publish → GitHub commit → Vercel build → website updated
```

The public page changes when the deployment finishes, typically within a minute
— **not instantly**. The dashboard says so at every step rather than pretending
otherwise.

---

## Project structure

```
.
├── data/
│   └── biodata.json          ← the single source of truth
│
├── public/
│   ├── images/
│   │   └── profile.jpg       ← the portrait, committed to this repo
│   ├── og-image.jpg
│   └── apple-touch-icon.png
│
├── api/                      ← Vercel serverless functions (server-side only)
│   ├── _lib/                 ← shared helpers (not routed: the `_` prefix)
│   │   ├── auth.ts           ← password check + signed session cookie
│   │   ├── github.ts         ← minimal GitHub Contents API client
│   │   └── http.ts           ← request/response helpers
│   ├── admin/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   └── session.ts
│   └── github/
│       ├── read.ts
│       ├── update.ts
│       └── upload-image.ts
│
├── src/
│   ├── components/
│   │   ├── public/           ← the biodata document itself
│   │   ├── admin/            ← dashboard shell, editors, live preview
│   │   └── ui/               ← buttons, fields, toasts, dialogs
│   ├── pages/
│   │   ├── PublicBiodataPage.tsx
│   │   └── admin/            ← one page per section of the JSON
│   ├── hooks/
│   ├── utils/
│   │   └── biodata-schema.ts ← the Zod schema, shared with the API
│   ├── types/
│   └── styles/
│
├── .env.example
├── vercel.json
└── vite.config.ts
```

---

## The data file

Everything the public website shows lives in `data/biodata.json`:

```json
{
  "personal": {
    "name": "Darshit Gadhiya",
    "dateOfBirth": "26-11-2001",
    "caste": "Leuva Patel",
    "height": "5 feet 6 inches",
    "weight": "75 Kg",
    "bloodGroup": "B+"
  },
  "family": { "fatherName": "…", "fatherOccupation": "…", "motherName": "…" },
  "maternal": { "relatives": ["…"], "address": "…" },
  "education": { "degree": "…", "college": "…" },
  "career": { "job": "…", "company": "…", "workLocation": "…" },
  "hobbies": ["Movies", "Cricket"],
  "contact": { "phone": "7069306559", "address": "…" },
  "profilePhoto": "/images/profile.jpg",
  "theme": { "mode": "light", "accent": "champagne", "animations": true }
}
```

Rules the code enforces:

- No component hardcodes a biodata value — every field is read from this file.
- `dateOfBirth` is `DD-MM-YYYY`, the format used on the printed biodata.
- `profilePhoto` is a repository path such as `/images/profile.jpg`. Images are
  **never** stored as base64 inside the JSON.
- The whole structure is validated with [Zod](https://zod.dev) — in the browser
  before publishing, and again on the server before committing. A malformed
  file cannot reach the repository.
- `theme` sets the site-wide defaults. A visitor who picks a different theme
  gets a browser-local override; the published default is unchanged.

You can edit the file by hand and commit it. The dashboard is a convenience,
not a requirement.

---

## Install and run locally

Requires Node 20 or newer.

```bash
npm install
```

**Development server** (public website; the `/api` routes are not available):

```bash
npm run dev
```

**With the API**, using the Vercel CLI — this is what you need to try the admin
dashboard locally. Put your values in a `.env` file first (copy `.env.example`):

```bash
npm i -g vercel
vercel dev
```

**Production build:**

```bash
npm run build     # type-checks the app and the API, then builds
npm run preview   # serves the built site
```

**Type-check only:**

```bash
npm run typecheck
```

---

## GitHub setup

1. **Create the repository** (or use this one) and push the project to it.
   The branch you deploy from is the branch the dashboard commits to.

2. **Create a token.** GitHub → *Settings* → *Developer settings* →
   *Personal access tokens*.

   **Fine-grained token (recommended)**
   - *Repository access*: **Only select repositories** → this repository
   - *Permissions* → *Repository permissions* → **Contents: Read and write**
   - Nothing else is needed. Do not grant more.

   **Classic token**
   - Scope: `repo`

   Copy the token — GitHub shows it once.

3. **Note the three values** you will need:

   | Value           | Where it comes from                                  |
   | --------------- | ---------------------------------------------------- |
   | `GITHUB_OWNER`  | the account or organisation — the part before the `/` in the repo URL |
   | `GITHUB_REPO`   | the repository name — the part after the `/`         |
   | `GITHUB_BRANCH` | the deployed branch, usually `main`                  |

---

## Vercel setup

1. **Import the repository** at [vercel.com/new](https://vercel.com/new).
   Vercel detects Vite; the settings in `vercel.json` do the rest. The
   functions in `api/` are deployed automatically.

2. **Add the environment variables** in *Settings → Environment Variables*, for
   **Production, Preview and Development**:

   | Name              | Example / notes                                    |
   | ----------------- | -------------------------------------------------- |
   | `GITHUB_TOKEN`    | the token from the previous step                    |
   | `GITHUB_OWNER`    | `darshitgadhiya26`                                  |
   | `GITHUB_REPO`     | `biodata`                                           |
   | `GITHUB_BRANCH`   | `main`                                              |
   | `ADMIN_PASSWORD`  | a long, random passphrase                           |

   None of these has a `VITE_` prefix, and none of them ever should: Vite only
   exposes `VITE_*` variables to the browser, so the missing prefix is exactly
   what keeps these secret.

3. **Deploy.** After changing an environment variable, redeploy so the
   functions pick it up.

The sign-in page tells you if any of these is missing, by name.

---

## Using the admin dashboard

Open `/admin` on your deployed site and enter `ADMIN_PASSWORD`.

The dashboard has one page per part of the JSON:

**Dashboard · Personal · Family · Maternal · Education · Career · Hobbies ·
Contact · Profile Photo · Appearance**

On a wide screen the editor sits on the left and a **live preview** on the
right, rendered with the same components as the public page — what you see is
what visitors get. On a phone, use **Preview** for a full-screen look.

### Draft, then publish

| Action                 | What it does                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| *(typing)*             | Updates the draft and the preview. Nothing is committed.             |
| **Save Draft Locally** | Keeps the unpublished draft in this browser so a refresh is safe.    |
| **Preview**            | Full-page view of the draft.                                         |
| **Cancel**             | Throws the draft away and returns to what GitHub holds.              |
| **Publish Changes**    | Validates, commits `data/biodata.json`, and Vercel redeploys.        |

`localStorage` is only ever a scratchpad for unpublished typing. **GitHub is
the source of truth** — the dashboard re-reads the file from the repository
every time it loads.

### Version safety

The editor remembers the file's git SHA from when it loaded. Publishing sends
that SHA, and the server refuses the commit if the file has moved on since —
for instance because you edited it directly on github.com, or from another
device. You get:

> The biodata was changed elsewhere. Please reload the latest version before
> publishing.

…and a **Reload latest** button. Nobody's edit is silently overwritten.

### Profile photo

*Profile Photo* → **Choose File** → **Publish Photo**.

JPG, JPEG, PNG and WEBP are accepted. The image is resized and re-encoded in
your browser first, then committed to `public/images/`. The server checks the
actual bytes, not just the file name, and rejects anything over 3 MB. If the
format changes the path changes too (`profile.png` instead of `profile.jpg`),
and the dashboard updates `profilePhoto` in the draft for you — publish once
more to save it.

---

## The serverless API

Six routes, all under `/api`. Everything except login, logout and the session
check requires a valid session cookie.

| Route                      | Method | Purpose                                                 |
| -------------------------- | ------ | ------------------------------------------------------- |
| `/api/admin/login`         | POST   | Checks the password, sets the session cookie             |
| `/api/admin/logout`        | POST   | Clears the cookie                                        |
| `/api/admin/session`       | GET    | Is the cookie still valid? Is the server configured?     |
| `/api/github/read`         | GET    | The live `biodata.json` from GitHub, plus its SHA        |
| `/api/github/update`       | POST   | Validates and commits `data/biodata.json`                |
| `/api/github/upload-image` | POST   | Commits an image to `public/images/`                     |

`/api/github/update` in order: verify the session → validate against the Zod
schema → compare the caller's SHA against GitHub's → commit. Any step failing
means no commit.

---

## Security

- `GITHUB_TOKEN` and `ADMIN_PASSWORD` exist **only** as Vercel environment
  variables, read only inside `api/`. They are never sent to the browser, never
  prefixed with `VITE_`, never written to `biodata.json`, and never committed.
  The built bundle contains neither of them — nor even GitHub's API URL.
- The session is an HMAC-signed, **HttpOnly**, `SameSite=Strict`, `Secure`
  cookie that expires after 8 hours. Page JavaScript cannot read it. The
  signing key is derived from `ADMIN_PASSWORD`, so changing the password
  invalidates every existing session.
- The password comparison is constant-time, with a random delay and a
  per-IP attempt limit on top.
- Hiding the admin UI is convenience, not the boundary: every `/api/github/*`
  route verifies the session itself before touching the repository.
- `.env` is git-ignored. Only `.env.example`, which holds no values, is
  committed.

If a token is ever exposed, revoke it on GitHub and issue a new one — that is
the whole recovery procedure.

---

## What this is not

- Not a real-time database. Published changes appear after the Vercel build.
- Not multi-user. One password, one editor at a time — with SHA conflict
  detection for when that assumption breaks.
- Not a general CMS. It edits exactly one JSON file, on purpose.

## Licence

Personal project. All biodata content belongs to Darshit Gadhiya.
