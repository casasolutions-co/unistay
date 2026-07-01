Two database need to work smoothly together

1. firebase - only for login functions, since the storage option is harder and not in free tier
2. cloudflare - which has both database storage, better writes , reads than firebase but doesnt have login functions.

I have both accounts and access keys, however need to consult how to setup without data redundancy.

need here specifically what should be the database architechture.

1. whether we store any info in firebase if so, how , strucuture needed.
2. how do cloudflare and firebase communicate, what if there is any error, backup options, how to prevent data transfer failing and handling.
3. what data we store in cloudflare and the strucutre.

at the end of this i also need todo which would need to answer all the question.

---

## Architecture Opinion

**Core principle: Firebase = identity only. Cloudflare = everything else.**

No data is duplicated. Firebase UID is just a foreign key string in Cloudflare. The two services never talk to each other — the API layer is the bridge.

---

### 1. What lives in Firebase

Only the auth credential. Optionally a tiny Firestore doc at `users/{uid}` with `{ role: 'landlord'|'student', onboarded: bool }` — only needed if you want role-based redirects before the first Cloudflare call returns. Otherwise skip Firestore entirely and store everything in D1.

---

### 2. How Firebase ↔ Cloudflare communicate

They don't talk to each other. Your API layer bridges them:

1. User logs in → Firebase issues a signed JWT (ID token)
2. JWT goes in `Authorization` header to your Next.js API route
3. API verifies JWT with Firebase Admin SDK
4. After verification, all reads/writes go to Cloudflare D1 / R2
5. Firebase is never touched again after step 3

**On first login:** upsert the user into D1 using Firebase UID as primary key (`INSERT OR IGNORE`). Idempotent — safe to retry.

**If Cloudflare write fails on login:** retry up to 3 times with exponential backoff. The user retries login — Firebase auth persists, D1 upsert is safe to repeat.

**No sync needed, no backup between the two** — Firebase only holds auth credentials (managed by Google), Cloudflare holds all app data (backed up via D1 export or R2 replication).

---

### 3. Cloudflare D1 schema

```sql
-- Users (Firebase UID as PK — zero redundancy)
users (
  id TEXT PRIMARY KEY,                      -- Firebase UID
  email TEXT NOT NULL,
  role TEXT NOT NULL,                       -- 'landlord' | 'student' | 'admin'

  -- Identity verification
  verification_status TEXT DEFAULT 'unverified',
  -- 'unverified' → can browse but cannot post
  -- 'pending'    → submitted docs, waiting for admin review
  -- 'verified'   → approved, can post listings
  -- 'rejected'   → application denied, cannot post
  -- 'banned'     → removed from platform entirely
  verification_note TEXT,                   -- admin note shown to user on rejection
  verified_at INTEGER,
  verified_by TEXT REFERENCES users(id),    -- which admin approved

  -- Ban fields (separate from rejection — ban is post-approval action)
  banned_at INTEGER,
  banned_by TEXT REFERENCES users(id),
  ban_reason TEXT,
  ban_expires_at INTEGER,                   -- NULL = permanent ban

  created_at INTEGER
)

-- Verification documents (uploaded by landlords to prove identity/ownership)
verification_docs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  doc_type TEXT,
  -- 'national_id' | 'passport' | 'proof_of_address' | 'ownership_deed' | 'student_card'
  r2_key TEXT,                              -- actual file stored in R2
  status TEXT DEFAULT 'pending',            -- 'pending' | 'approved' | 'rejected'
  rejection_reason TEXT,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at INTEGER,
  created_at INTEGER
)

-- Listings — this table only holds PRIVATE listings (landlord-submitted via "List Your Place").
-- CASA (admin-curated) and PARTNER (HousingAnywhere) listings are NOT rows here — CASA lives in
-- src/app/data/properties.ts as static data, PARTNER lives in public/partner-cities/*.json.
-- Only PRIVATE listings go through the status/moderation lifecycle below; CASA and PARTNER have
-- no `status` column at all and never enter the admin approval queue.
listings (
  id TEXT PRIMARY KEY,
  landlord_id TEXT REFERENCES users(id),
  ptype TEXT,                               -- studio|apartment|room|house
  title TEXT,
  street TEXT, city TEXT, postcode TEXT,
  bedrooms INTEGER, bathrooms INTEGER,
  size_sqm INTEGER, room_size_sqm INTEGER DEFAULT 0,
  cold_rent INTEGER, utilities INTEGER, deposit INTEGER,
  avail_from TEXT, avail_to TEXT, open_ended INTEGER,
  min_period INTEGER, max_period INTEGER,
  description TEXT,
  mate_count INTEGER, mate_gender TEXT, pref_gender TEXT, mate_notes TEXT,
  status TEXT DEFAULT 'draft',
  -- 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  -- New listings are created as 'pending_review' (src/app/api/listings/route.ts POST) —
  -- they only become 'published' (and publicly searchable) after admin approval.
  rejection_reason TEXT,                    -- set by admin if status = 'rejected'
  lat REAL DEFAULT 0, lng REAL DEFAULT 0,
  created_at INTEGER, updated_at INTEGER
)

-- Amenities (join table — not a JSON blob)
listing_amenities (
  listing_id TEXT REFERENCES listings(id),
  amenity TEXT,
  PRIMARY KEY (listing_id, amenity)
)

-- Photos (metadata only — actual files in Cloudflare R2)
listing_photos (
  id TEXT PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  r2_key TEXT,                              -- R2 object key
  position INTEGER,                         -- display order
  is_cover INTEGER DEFAULT 0
)

-- Inquiries
inquiries (
  id TEXT PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  student_id TEXT REFERENCES users(id),
  message TEXT,
  status TEXT DEFAULT 'pending',            -- 'pending' | 'accepted' | 'rejected'
  created_at INTEGER
)

-- Chat messages within an inquiry thread
messages (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL REFERENCES inquiries(id),
  sender_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  msg_type TEXT NOT NULL DEFAULT 'text',
  metadata TEXT,
  created_at INTEGER NOT NULL,
  read_at INTEGER,
  deleted_at INTEGER,                       -- soft-delete: set when an admin redacts a reported message
  deleted_by TEXT REFERENCES users(id)
)

-- Per-user unread counter, kept in sync on every message insert/read
user_inbox_counts (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  unread INTEGER DEFAULT 0
)
```

**Photo upload flow (prevents partial state):**
1. Client requests a signed R2 URL from your API
2. Client uploads directly to R2
3. On R2 success → API writes metadata row to D1
4. Only after both succeed does the listing show the photo

A failed R2 upload never leaves a dangling D1 row.

---

---

### Sync Risk & Mitigations

The sync surface between Firebase and Cloudflare is intentionally tiny — only the user record can drift. Three real risks:

**Risk 1 — Email change (Firebase updates, D1 doesn't)**
- Mitigation: on every login, re-upsert `email` from the JWT claims into D1. Cost is negligible, drift is impossible.

**Risk 2 — First login partial failure (Firebase auth succeeds, D1 upsert fails)**
- Mitigation: lazy user creation — every API call checks if D1 user exists and creates if not. Never assume the JWT being valid means the D1 record exists.

**Risk 3 — Account deletion (Firebase deletes user, D1 still has their data)**
- Mitigation: Firebase Auth emits a `user.delete` event. A Cloudflare Worker webhook listens and marks the user + their listings as `archived` in D1. No hard delete — preserves inquiry history.

**Why this is low risk overall:** Firebase only holds the auth credential. Listings, photos, amenities, inquiries — none of those touch Firebase. "Both need to update together" never happens in normal operation.

---

---

### Admin Panel Architecture

**Full spec moved to [`ADMIN_PANEL_PLAN.md`](./ADMIN_PANEL_PLAN.md)** — that file is now the canonical source for admin controls, DB support per control, the schema diff, build order, and a live-DB readiness assessment. Keeping the admin table definitions in two places caused this section to drift out of sync (it was still showing `reports`/`admin_audit_log` without the columns added since, and still described listing moderation as a future "if you add it" feature that has since shipped). Don't duplicate admin schema details back into this file — update `ADMIN_PANEL_PLAN.md` instead.

What stays true here, since it's identity architecture rather than admin-control detail:

**Auth approach:** Firebase custom claims. When you promote a user to admin, you set `{ admin: true }` on their Firebase token server-side. Every API route checks this claim — no extra table needed, no separate login system.

```
// promote a user to admin (run once, server-side only)
admin.auth().setCustomUserClaims(uid, { admin: true })
```

Every protected admin API route then checks:
```
const token = await admin.auth().verifyIdToken(jwt)
if (!token.admin) return 403
```

**Admin panel route protection in Next.js:**
- All `/admin/*` routes behind middleware that checks Firebase custom claim
- Never expose admin routes to the client bundle — keep checks server-side only

**Why not a separate admin database?**
Everything is already in D1 — admin just gets unscoped queries. Adding a second database for admin creates the same sync problem you're trying to avoid everywhere else.

---

### TODO

- [x] Set up Firebase project → enable Email/Password + Google auth
- [x] Add Firebase Admin SDK to Next.js (server-side JWT verification) — `src/lib/firebase-admin.ts`
- [x] Create Cloudflare D1 database, run schema migrations — live and verified in sync with `scripts/schema.sql`
- [x] Create Cloudflare R2 bucket for listing photos — `src/lib/r2.ts`
- [x] Build `/api/auth/sync` route: verify Firebase JWT → upsert user in D1 — `src/app/api/auth/sync/route.ts`
- [x] Build signed upload URL endpoint for R2
- [x] Wire up the List Your Place form to POST to D1 via API route — `src/app/api/listings/route.ts`
- [ ] Add retry logic (3x with backoff) on D1 writes at login — `auth/sync/route.ts` currently does a single upsert attempt, no retry
- [ ] Set up D1 scheduled export for backups
- [ ] Build the actual admin panel (routes/UI/API) — DB is ready per `ADMIN_PANEL_PLAN.md` §12, nothing under `/admin` exists yet; see that file's §11 build order
