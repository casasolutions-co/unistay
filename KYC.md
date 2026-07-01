# KYC Verification via Didit — Architecture Doc

Mother doc for identity verification. Covers the external API contract (Didit), how it
plugs into our two-database setup (see [backend.md](backend.md): Firebase = auth only,
Cloudflare D1 = all app state), and the failure-mode handling needed to keep the three
systems (Didit, Firebase, D1) consistent.

## Who gets verified, and why

KYC applies uniformly to **every** user — landlord, student, whoever. Role is irrelevant
to the verification requirement. The purpose is not gating features by role; it's
accountability: if fraud happens (e.g. money changes hands and one party disappears, or a
listing turns out to be fake), we have a real, ID-verified identity on file to support a
chargeback/refund path or a police report. KYC completion is the same gate for everyone —
until it's done, the user cannot post a listing.

## End-to-end flow

```
Signup (Firebase auth)
  -> Verification triggered
  -> User completes Didit session (doc + selfie + liveness)
  -> Redirect back to app
  -> Check: does the ID name match the name on the account?
       match      -> verification_status = 'verified' -> can post listings
       mismatch   -> verification_status = 'pending'/'flagged'
                     -> manual review process (future flow, not built yet)
                     -> once manually cleared -> 'verified' -> can post listings
```

Posting a listing is the thing gated on `verification_status = 'verified'` — not signup,
not login, not browsing.

## Why Didit

Cheaper than incumbent KYC vendors ($0.33 full KYC bundle, 500 free verifications/month),
REST API + signed webhooks + OpenAPI spec. Replaces (or supplements) the manual
`verification_docs` admin-review flow currently sketched in backend.md for identity
documents (national_id / passport / liveness). Manual review can stay for things Didit
doesn't check, e.g. `ownership_deed`, `student_card`.

## Didit API contract

- **Auth**: `X-Api-Key` header, key from the Didit Business Console.
- **Create session**: `POST https://verification.didit.me/v2/session/`
  - Request: `workflow_id`, `callback` (redirect URL back to our app), `vendor_data`
    (our internal user id — use the Firebase UID), `contact_details`, `metadata`.
  - Response: `session_id`, `session_token`, `url` (hosted verification page to redirect
    the user to), `status` (initial = "Not Started").
- **User flow**: redirect user to `url`; Didit hosts document capture, selfie, liveness.
  We are out of the loop until the webhook fires.
- **Webhook**: POST to our configured endpoint on status change.
  - Headers: `X-Signature` (HMAC using our `WEBHOOK_SECRET_KEY`), `X-Timestamp` (replay
    protection — reject if too old).
  - Payload: `session_id`, `webhook_type`, and — for terminal states (Approved, Declined,
    In Review, Abandoned) — a `decision` object with the full verification report.
  - `decision.id_verification` includes OCR+MRZ-cross-checked fields: `full_name`,
    `first_name`, `last_name`, `date_of_birth`, document fields, plus a `warnings` array.
  - Retries: Didit retries delivery on 5xx or 404 from our endpoint; each retry is a
    separate logged event on their dashboard.
- **Poll fallback**: `GET /v2/session/{sessionId}/decision/` to fetch the decision
  on-demand instead of waiting on the webhook.

## Name-match check (our responsibility, not Didit's)

Didit verifies the ID is genuine and the selfie matches the ID — it does **not** know or
check our stored account name. We must compare `decision.id_verification.full_name` (or
first/last) against the name stored in `users` for the UID in `vendor_data`.

- Normalize both strings before comparing: lowercase, strip accents/diacritics, collapse
  whitespace, ignore name ordering/middle names.
- Use fuzzy matching (e.g. token-set comparison or edit-distance threshold) — exact string
  equality produces too many false rejections (legal name variants, hyphenation, etc).
- Decision logic:
  - Didit `Approved` + name matches → `verification_status = 'verified'`.
  - Didit `Approved` + name mismatch → do **not** auto-reject; flag for manual review
    (`verification_status = 'pending'` or a dedicated `'flagged'` state,
    `verification_note = 'ID name does not match account name'`). Auto-reject risks too
    many false positives given fuzzy matching.
  - Didit `Declined` / `Abandoned` / `In Review` → mirror that status directly, no name
    check needed.

## Screen flow (our side)

1. Profile page shows "Verify identity" with the account's current stored name displayed
   ("make sure this matches your government ID") and a single confirm button — no form
   fields, Didit's hosted page collects everything.
2. Our `create-session` API route (authenticated via Firebase JWT) calls Didit's
   `POST /v2/session/`, passes `vendor_data = firebase_uid`, sets
   `users.verification_status = 'pending'` and stores `didit_session_id` in D1, then
   returns the `url` for the client to redirect to.
3. User completes the flow on Didit's hosted page.
4. Webhook lands on our `/api/kyc/webhook` route; D1 is updated per the decision logic
   above.
5. User is redirected back via `callback` — this redirect is **not authoritative** (see
   below), it just brings the user back to a page that reads status from D1.

## Keeping Didit / Firebase / D1 in harmony

Three systems, one source of truth: **D1 is authoritative for `verification_status`.**
Firebase only ever identifies *who* the user is (UID); Didit and the browser redirect are
both just *proposals* that D1 accepts or rejects.

- **The `callback` redirect is not authoritative.** It's an unsigned URL the user's
  browser hits — do not read status from query params on it. The landing page should
  fetch current status from our own API (which reads D1), showing "processing…" and
  polling briefly if needed, since webhook delivery and browser redirect are not
  ordered relative to each other.
- **Webhook handler is the only writer of `verification_status`.**
- **Idempotency**: webhook retries (on 5xx/404) must not double-apply side effects
  (e.g. don't send a "you're verified" email twice). Store something like
  `decision_processed_at` or a hash of the decision payload per session and skip
  reapplying identical decisions; ack with 200 either way.
- **Stale/superseded sessions**: if a user retries after rejection, they get a new
  `didit_session_id`. A late webhook for an old session_id must be ignored — compare the
  webhook's `session_id` against the latest `users.didit_session_id` before writing;
  200-ack and drop if it doesn't match, don't error (Didit would otherwise retry
  forever).
- **Unknown/deleted user**: webhook looks up `vendor_data` (Firebase UID) in D1; if no
  row exists, log and 200-ack without erroring — nothing to reconcile, and erroring
  would just cause endless retries for an unrecoverable case.
- **Return 5xx only for genuine transient failures** (e.g. D1 write timeout on an
  otherwise valid, current, matching-session webhook) so Didit retries exactly the cases
  that should be retried — never for duplicate, stale, or unknown-user webhooks.
- **Firebase session expiry** is orthogonal — it only gates whether the user can call our
  own `create-session`/status endpoints; Firebase never talks to Didit or D1 directly.

## D1 schema additions (proposed, not yet migrated)

On top of the `users` table already sketched in [backend.md](backend.md):

```sql
users (
  ...
  didit_session_id TEXT,          -- latest session id issued for this user
  didit_decision_json TEXT,       -- raw last decision payload, for audit
  decision_processed_at INTEGER,  -- idempotency guard for webhook retries
  ...
)
```

## Open decisions (not yet made)

1. Keep manual admin doc review as a parallel/fallback path for non-identity docs (e.g.
   ownership deed), or retire `verification_docs` entirely once Didit is live?
2. Name-mismatch manual review: what does the (future) manual process actually look like
   — who reviews it, what evidence do they see, how do they clear it? Not designed yet,
   just gated as a future flow for now.
3. Name-mismatch: route to `pending` for human review vs. a dedicated `flagged` status
   distinct from `rejected`?

## Not yet implemented

Everything above is design only — no API routes, D1 migration, or UI have been built yet.
Next step when ready: `src/app/api/kyc/create-session/route.ts`,
`src/app/api/kyc/webhook/route.ts`, D1 migration for the columns above, and a status
badge + "Verify identity" button in
[ProfileDesktop.tsx](src/app/profile/ProfileDesktop.tsx) /
[ProfileMobile.tsx](src/app/profile/ProfileMobile.tsx).
