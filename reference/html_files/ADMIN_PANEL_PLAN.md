# UI Assessment

I reviewed the mockup end-to-end against ADMIN_PANEL_PLAN.md. It's a good visual skeleton and covers the four main queues (Users, Listings, Messages, Documents), but there are real structural gaps versus the schema/plan — mostly places where the UI collapses distinct DB states into one, or has no field to capture data the schema requires.

## Solid matches

- Nav sections map cleanly to plan §2/3/5/6: Users, Listings, Documents, Messages.
- Doc statuses (pending/approved/rejected) match verification_docs.status exactly.
- Dashboard counts (unverified users, pending listings, pending docs, flagged conversations) match the plan's queue-based model.
- User detail page's "Listings / Messages / Activity" panels are a good implementation of plan §2's "view a user's full activity" control — no schema changes needed for that.

## Gaps / mismatches

- User verification collapses 3 states into 2 (line 688 STATUS.user, only unverified/verified/kicked). Schema has unverified → pending → verified and a separate rejected. There's no "Reject" action for a user's verification (only "Verify" or "Kick"), and no way to capture verification_note — the reason a rejection is shown to the user (schema column exists, UI has no input for it).

- "Kick" conflates rejection with ban, and captures no reason. kick() (line 785) just flips status → 'kicked' with no text input. But the schema separates these on purpose: ban_reason, banned_by, ban_expires_at (temporary vs permanent) all need values. The UI never prompts for a reason or a ban duration, so every "kick" would write a ban row with no reason and no expiry — always permanent, silently.

- Listing states also collapse two different lifecycle stages into one "Removed". After the fix we just made (§3 of the plan: new listings start as pending_review), the real lifecycle is pending_review → published|rejected, then separately published → archived. The mockup's STATUS.listing (line 689) only has pending/approved/removed — pre-publish rejection and post-publish takedown are the same bucket. That loses the distinction the plan relies on (a rejected-at-review landlord can fix and resubmit; an archived-after-publish listing was live and got pulled for a violation — different signal, different rejection_reason semantics).

- Reject actions never capture rejection_reason. Both the listing reject button (line 384) and the (missing) user-rejection action just flip status directly — no text field, even though listings.rejection_reason and verification_docs.rejection_reason exist specifically to show the user why. Same issue on doc reject (line 576).

- Restore logic is inconsistent with archive semantics. restore() for a listing (line 800) always sets status back to 'pending', even for a listing that was previously published and got archived. Per the plan, restoring an archived (was-live) listing should return it to published, not force it back into a review queue it already passed.

- Messages/reports model doesn't match the reports table. The mockup treats "flagged" as a boolean baked onto the message record itself (messages: [{flagged: true, ...}], line 728) with a hardcoded flag reason in the modal (line 616). Plan §4/§6 route all message moderation through the generic reports table (target_type, target_id, reason, status, resolved_by, and the new resolved_at/resolution_note columns). There's no reports queue for anything other than messages — a reported listing or reported user has no equivalent surface in this UI at all, even though reports.target_type is meant to be generic across all three.

- No message redaction control. Plan §6 explicitly wants a way to delete/redact the offending message content (soft-delete via messages.deleted_at/deleted_by) once a report is resolved. The message modal only has "Mark resolved" (line 622) — it never lets the admin touch the actual message content.

- No site-wide settings screen at all. Plan §9 is the one category with zero existing DB support and is arguably the most "control the entire application" part of the ask (kill switches: signups_enabled, listing_submission_enabled, maintenance_mode, etc., via the new app_settings table). There's no nav item, no screen for it in this mockup.

- No audit trail view. Not strictly required (plan says audit logging is a backend write-only concern), but there's currently no way for an admin to see "who did what" — worth considering since admin_audit_log already exists and is cheap to expose as a read-only feed.

- Everything is client-side mock state with no persistence model — expected for a UI mockup, just flagging that the eventual wiring needs: every action here (setUserStatus, setListingStatus, setDocStatus, setMessageFlag) needs to become an API call that also writes an admin_audit_log row, not a local setState.

- Bottom line: the layout/UX shell is usable as-is, but the state models for Users, Listings, and Messages need to be widened to match what the DB actually tracks (separate reject-vs-ban, reject-vs-archive, reason/note text inputs on every reject/ban action, and reports as the generic model instead of a message-only flag). Plus a Settings screen is entirely missing. Let me know which of these you want fixed first and I'll modify the mockup.

# Admin Panel Plan

Status: no admin UI/API exists yet. `scripts/schema.sql` already has `admin_audit_log` and `reports`, and `users`/`listings` already carry moderation columns — so the DB was designed for this, it just isn't wired up. This doc lists every control the admin needs, and the exact DB support (existing or new) each control requires.

Core principle carried over from `backend.md`: **Firebase = identity only, D1 = everything else.** Admin-ness is a Firebase custom claim (`{ admin: true }`), not a D1 column — but every admin action reads/writes D1.

---

## 1. Access control (who is "admin")

| Control                                                            | DB support                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grant/revoke admin role                                            | Firebase custom claim, set via a one-off server script or a "super admin" panel action. **Not stored in D1** — D1 only needs to know `verified_by`/`banned_by`/`admin_id` as foreign keys pointing at a user id, it doesn't need to know that user is an admin. |
| Support multiple admin tiers (e.g. moderator vs super-admin) later | Add `users.admin_role TEXT` (`'moderator'`, `'super_admin'`) only if/when needed — skip for v1, single `admin: true` claim is enough.                                                                                                                           |

No new table required for v1.

---

**Confirmed correct (no change needed):** `src/app/api/auth/sync/route.ts` already inserts new users with `verification_status = 'unverified'` by default, matching the schema default. Users only move to `'verified'` via an explicit admin action (§5).

## 2. User management

| Control                                                                 | Action                   | DB support (exists / new)                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| View all users, filter by role/status                                   | list users               | Exists: `users` table. Add index: `CREATE INDEX idx_users_status ON users(verification_status);`                                                                                                                                                     |
| Verify a landlord/student                                               | approve identity docs    | Exists: `users.verification_status`, `verified_at`, `verified_by`; `verification_docs.status/reviewed_by/reviewed_at/rejection_reason`                                                                                                               |
| Reject verification                                                     | set status + reason      | Exists: same columns, `verification_note`                                                                                                                                                                                                            |
| Ban a user (temp or permanent)                                          | block login/posting      | Exists: `banned_at`, `banned_by`, `ban_reason`, `ban_expires_at` (NULL = permanent)                                                                                                                                                                  |
| Unban a user                                                            | clear ban                | Exists — set `banned_at`/`banned_by`/`ban_reason`/`ban_expires_at` back to NULL                                                                                                                                                                      |
| Force logout a banned user                                              | invalidate session       | Not a D1 concern — call `admin.auth().revokeRefreshTokens(uid)` in Firebase when banning                                                                                                                                                             |
| Change a user's role (student ↔ landlord)                               | correct mis-registration | Exists: `users.role` — just needs an admin-only UPDATE endpoint                                                                                                                                                                                      |
| Delete a user (GDPR / self-request)                                     | hard or soft delete      | **New**: prefer soft delete. Add `users.deleted_at INTEGER`. Hard delete of a user with listings/messages breaks FK history — don't do it; anonymize instead (`email = 'deleted-<id>@unistay'`, `name = NULL`, `phone = NULL`) and set `deleted_at`. |
| View a user's full activity (listings, inquiries, reports against them) | investigation view       | Exists — just joins across `listings`, `inquiries`, `reports` by user id, no schema change                                                                                                                                                           |

Every row above that mutates state must also write an `admin_audit_log` row (see §7).

---

## 3. Listing moderation

**Scope note:** the `listings` table — and everything in this section — only covers **PRIVATE** listings (landlord-submitted via "List Your Place", `badge = 'PRIVATE'`, formerly labeled `HOST` before the 2026-07-01 rename). **CASA** (admin-curated, `src/app/data/properties.ts`, static — no DB row, no `status`) and **PARTNER** (HousingAnywhere, `public/partner-cities/*.json`, external — no DB row, no `status`) never enter the moderation queue and have no admin approve/reject action, because there's no row for them to moderate. If CASA or PARTNER content needs takedown, that's a content/data-file edit or an upstream-partner issue, not an admin-panel action.

**Decision (implemented):** every new listing is created with `status = 'pending_review'`, not `'published'`. The public `/api/listings` search only surfaces `'published'` (and `'draft'`, for the landlord's own unfinished drafts) — a `pending_review` listing is invisible to everyone except the admin queue until approved. Fixed in `src/app/api/listings/route.ts` POST handler (was hardcoded to `'published'`).

**Follow-up gap (not yet built):** there is no "my listings" endpoint for a landlord to see their own pending/rejected listings. Without it, a landlord who submits a listing gets zero visibility into its review status. Needed before this flow is usable end-to-end: `GET /api/listings/mine` filtered by `landlord_id = uid`, all statuses.

| Control                                                   | Action                                | DB support                                                                          |
| --------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| Approve a listing                                         | `status → 'published'`                | Exists                                                                              |
| Reject a listing                                          | `status → 'rejected'` + reason        | Exists: `rejection_reason`                                                          |
| Take down a published listing (policy violation)          | `status → 'archived'` or `'rejected'` | Exists                                                                              |
| Edit a listing's content directly (fix scam/abusive text) | admin overwrite                       | Exists — same UPDATE as landlord edit, just admin-authorized                        |
| Feature/pin a listing                                     | boost visibility                      | **New**: `listings.featured INTEGER DEFAULT 0`, optionally `featured_until INTEGER` |
| Bulk actions (reject all from a banned landlord)          | mass update                           | Exists — `UPDATE listings SET status='archived' WHERE landlord_id = ?`              |
| See flagged/reported listings                             | cross-reference reports               | Exists: `reports` table with `target_type='listing'`                                |

---

## 4. Reports / trust & safety queue

| Control                                                   | Action                                      | DB support                                                                                                                      |
| --------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| View open reports                                         | `SELECT * FROM reports WHERE status='open'` | Exists                                                                                                                          |
| Resolve a report                                          | `status → 'resolved'`, set `resolved_by`    | Exists                                                                                                                          |
| Dismiss a report                                          | `status → 'dismissed'`                      | Exists                                                                                                                          |
| **Gap**: no `resolved_at` timestamp, no `resolution_note` | can't tell when/why a report closed         | **New**: add `reports.resolved_at INTEGER`, `reports.resolution_note TEXT`                                                      |
| Report on a user or a message, not just a listing         | `target_type` already generic               | Exists — `target_type` already free-text (`'listing'`, `'user'`, `'inquiry'`); just needs the "report" UI on those surfaces too |

---

## 5. Verification document review

| Control                                                           | Action                                                   | DB support                                                                                                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Queue of pending docs                                             | `SELECT * FROM verification_docs WHERE status='pending'` | Exists                                                                                                                               |
| View the actual file                                              | fetch from R2 via `r2_key`                               | Exists: `src/lib/r2.ts` — admin needs a signed-GET endpoint, doc itself unaffected                                                   |
| Approve/reject a doc                                              | update status/reason                                     | Exists                                                                                                                               |
| Auto-flip user to `verified` once required doc types are approved | business logic, not schema                               | App logic: on doc approval, check if all required `doc_type`s for that user's role are approved → update `users.verification_status` |

---

## 6. Inquiries / messages oversight

**Policy (decided):** messages are _not_ proactively moderated — no scanning, no pre-approval, no admin message queue. Admin only ever sees a conversation when a `reports` row exists with `target_type='message'` (or `'inquiry'`) pointing at it. This keeps §4 (reports queue) as the single entry point into message moderation instead of a second standing queue.

| Control                                    | Action                                              | DB support                                                                                                                                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| View a reported conversation               | admin opens the thread named in `reports.target_id` | Exists: join `reports` → `messages`/`inquiries` by id, no schema change                                                                                                                                                                       |
| Read full thread once a report exists      | join messages by `inquiry_id`                       | Exists                                                                                                                                                                                                                                        |
| Delete/redact the reported message         | remove content, keep audit trail                    | **New**: soft-delete pattern — `messages.deleted_at INTEGER`, `deleted_by TEXT REFERENCES users(id)`; UI shows "[message removed by moderator]" instead of hard DELETE. Only reachable from the reports queue, not a general message browser. |
| Report a message (student/landlord-facing) | user-facing "report" action on a message            | Needs `reports` insert with `target_type='message', target_id=messages.id` — currently reports UI likely only exists (if at all) for listings; extend to messages/inquiries too                                                               |

---

## 7. Audit logging (mandatory for every control above)

Already exists and is correctly designed:

```sql
admin_audit_log (
  id, admin_id, action, target_type, target_id, note, created_at
)
```

Rule: **no admin mutation ships without a corresponding audit row.** Recommended `action` naming convention (dot-namespaced, matches `backend.md`):
`user.verify`, `user.reject`, `user.ban`, `user.unban`, `user.role_change`, `user.delete`, `listing.approve`, `listing.reject`, `listing.archive`, `listing.feature`, `listing.edit`, `report.resolve`, `report.dismiss`, `doc.approve`, `doc.reject`, `message.redact`.

**Gap**: no index for querying a target's history. Add:

```sql
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_log(target_type, target_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id, created_at);
```

---

## 8. Analytics / dashboard

Read-only, no new tables needed for v1 — all derivable via aggregate queries on existing tables:

- Users: total, by role, by verification_status, signups over time (`created_at`)
- Listings: total, by status, by city, avg rent
- Inquiries: volume, response rate (time between `inquiries.created_at` and first `messages` row)
- Reports: open count, resolution time (`resolved_at - created_at`, once §4 gap is filled)

If dashboards get slow at scale, consider a materialized daily-stats table later (`admin_stats_daily`) — explicitly **not needed for v1**, avoid building it prematurely.

---

## 9. Site-wide configuration (the actual "control the entire application" part)

This is the one category with **no existing DB support at all** — everything else above reuses tables that already exist. Site config is genuinely new.

**New table:**

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,       -- store as JSON string, parse in app layer
  updated_by  TEXT REFERENCES users(id),
  updated_at  INTEGER
);
```

Example keys an admin panel would actually need to flip:

- `signups_enabled` (kill switch for new registrations)
- `listing_submission_enabled` (pause new listings during incident)
- `maintenance_mode`
- `featured_cities` (which cities show on homepage)
- `required_verification_docs` (per role, which doc_types are mandatory — currently hardcoded in app logic per `backend.md`)
- `max_photos_per_listing`

Every write to `app_settings` also logs to `admin_audit_log` with `target_type='setting'`, `target_id=key`.

---

## 10. Consolidated schema diff (everything net-new)

**Status as of 2026-07-01: items 3, 4, 5 below are LIVE** (ran via `scripts/migrate-admin-panel.sql`, verified against the live D1 instance in §12). Items 1, 2, 6 are still pending — deliberately deferred until the corresponding feature (user soft-delete, listing featuring, or query-volume actually requiring the indexes) is being built, per §11's build order.

```sql
-- 1. GDPR-safe user deletion — NOT YET APPLIED (deferred, §1/§2)
ALTER TABLE users ADD COLUMN deleted_at INTEGER;

-- 2. Listing boosting — NOT YET APPLIED (deferred, §3)
ALTER TABLE listings ADD COLUMN featured INTEGER DEFAULT 0;
ALTER TABLE listings ADD COLUMN featured_until INTEGER;

-- 3. Report resolution detail — ✅ APPLIED
ALTER TABLE reports ADD COLUMN resolved_at INTEGER;
ALTER TABLE reports ADD COLUMN resolution_note TEXT;

-- 4. Message moderation — ✅ APPLIED
ALTER TABLE messages ADD COLUMN deleted_at INTEGER;
ALTER TABLE messages ADD COLUMN deleted_by TEXT REFERENCES users(id);

-- 5. Site-wide config — ✅ APPLIED
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_by  TEXT REFERENCES users(id),
  updated_at  INTEGER
);

-- 6. Indexes for admin queries — NOT YET APPLIED (deferred; live DB has 4 users/4 listings, no
--    query-performance need yet — add when the users/audit-log tables have enough rows to matter)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_log(target_type, target_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id, created_at);
```

`scripts/migrate-admin-panel.sql` currently only contains items 3–5 (what's been run). If you pick up items 1/2/6, add them to that same file rather than creating a new migration script, and re-run §12's `PRAGMA table_info` check afterward to confirm before updating this section. `scripts/schema.sql` (the fresh-DB bootstrap) has already been updated to include items 3–5 from the start.

---

## 11. Build order (smallest safe increments)

1. Firebase custom-claim admin check + `/admin` route middleware (no DB change).
2. User list + verify/ban/unban (all columns already exist) — proves out the audit-log pattern end to end.
3. Listing moderation queue + approve/reject/archive.
4. Verification doc review queue.
5. Reports queue (add `resolved_at`/`resolution_note` first).
6. Run the schema diff in §10, then build: user soft-delete, listing featuring, message redaction.
7. `app_settings` table + settings screen (kill switches).
8. Analytics dashboard (pure read queries, build last since nothing depends on it).

Each step above is independently shippable and each writes to `admin_audit_log` before moving to the next.

---

## 12. Database readiness assessment (checked against the live D1 instance)

Queried the live Cloudflare D1 database directly (`PRAGMA table_info`, `sqlite_master`, row counts — read-only, no writes made) to confirm what's actually deployed, not just what's in `scripts/schema.sql`.

**Result: live DB is byte-for-byte in sync with `scripts/schema.sql`.** All 9 app tables exist (`users`, `listings`, `listing_amenities`, `listing_photos`, `inquiries`, `messages`, `verification_docs`, `admin_audit_log`, `reports`), every column matches what's documented in §1–§9 above, and the only index beyond primary keys is `idx_messages_inquiry`. Current data volume is tiny (4 users, 4 listings, 0 reports, 0 verification_docs, 0 audit_log rows) — this is a pre-launch database, so any migration now carries zero backfill risk.

### Verdict: partially ready — good foundation, three real blockers

**✅ Ready as-is (no migration needed):**
- User verification lifecycle (§2, §5) — `verification_status`, `verification_note`, `verified_at/by` all present and correctly typed.
- Ban system (§2) — `banned_at`, `banned_by`, `ban_reason`, `ban_expires_at` all present.
- Listing moderation (§3) — `status`, `rejection_reason` present; the `pending_review` fix shipped this session writes into a column that already exists, no schema change was needed for it to work.
- Audit logging (§7) — `admin_audit_log` table exists and is correctly shaped; it's just never been written to yet (0 rows), confirming no admin action has ever run against this DB.
- Reports (§4) — base table exists and is generic enough (`target_type`/`target_id`) to cover users, listings, and messages as designed.

**✅ Fixed (2026-07-01) — ran `scripts/migrate-admin-panel.sql` against the live D1 instance:**
1. **`app_settings` table created.** Kill-switch controls (maintenance mode, pause signups, pause listing submissions) now have somewhere to write. Table is empty — no default rows seeded yet, the app layer should treat a missing key as "feature enabled" until a settings UI writes an explicit value.
2. **`reports.resolved_at` and `reports.resolution_note` added.** "Resolve" actions can now record when and why, not just flip status.
3. **`messages.deleted_at` and `messages.deleted_by` added.** Message redaction (§6) can now be implemented as a soft-delete.

All three were verified live via `PRAGMA table_info` after running. `scripts/schema.sql` was updated to match, so a fresh DB bootstrap now includes these from the start — `migrate-admin-panel.sql` only matters for the already-existing production database.

**⚠️ Ready but will store wrong data if the mockup ships unmodified:**
- `listings.rejection_reason` and `verification_docs.rejection_reason` exist and are ready to receive text — but the current mockup's reject buttons don't collect any input, so these columns would sit permanently `NULL` even after the DB is otherwise correct. This isn't a schema gap, it's a UI gap sitting on top of ready DB columns (see prior UI assessment, gap #4).
- `users.ban_expires_at` exists and is ready for temporary bans — same story, the mockup's "Kick" action has no duration picker, so every ban written would be permanent (`NULL` expiry) by construction, not by DB limitation.

**Not present, confirmed intentionally deferred (§1, §3):** no `users.deleted_at` (soft-delete), no `listings.featured`/`featured_until`. Neither blocks the mockup's current feature set — skip until those specific controls are actually being built.

### Net assessment
The database was clearly designed ahead of the UI — most of the mockup's core moderation actions (verify, ban, approve, reject, review docs) have full column-level support today with zero migration required. The gap is narrow and specific: **site-wide settings (net-new table), report resolution detail (2 columns), and message redaction (2 columns)**. That's the entire `ALTER`/`CREATE` surface required — everything else in §10's diff is either already covered by what's live or deferred by design. Given the near-empty tables, this migration is low-risk to run whenever the corresponding features are built (per §11's build order), not something that needs to happen all at once.
