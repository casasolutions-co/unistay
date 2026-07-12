# FAQs — what's done, what's left for admin

## Where things are saved (public side — already built)

- **`scripts/schema.sql`** — the `faqs` table definition:
  ```sql
  CREATE TABLE IF NOT EXISTS faqs (
    id         TEXT PRIMARY KEY,
    category   TEXT NOT NULL,   -- 'booking' | 'payments' | 'account' | 'safety'
    question   TEXT NOT NULL,
    answer     TEXT NOT NULL,
    position   INTEGER NOT NULL DEFAULT 0,  -- display order within its category
    published  INTEGER NOT NULL DEFAULT 1,  -- 0/1, draft vs live
    created_at INTEGER,
    updated_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category, position);
  ```
  `category` is a **fixed app-level enum**, not a foreign key or a separate table —
  it matches the 4 category chips already hardcoded in the /help UI. Decided 2026-07-11:
  admin can't add/rename categories without a code change (kept simple on purpose).

- **`scripts/migrate-faqs.sql`** — creates the table on the *live* D1 database and
  seeds it with the 8 FAQs that used to be hardcoded in the frontend. `CREATE TABLE IF
  NOT EXISTS` is safe to re-run; the seed `INSERT OR IGNORE` keys off fixed ids
  (`booking-1`, `payments-2`, etc.) so re-running it is also safe.
  **Check whether this has actually been run against production D1 yet** —
  `wrangler d1 execute <db-name> --remote --file=scripts/migrate-faqs.sql` — the
  dynamic /help page will show nothing until it has.

- **`src/app/api/faqs/route.ts`** — `GET /api/faqs`, public, no auth. Returns only
  `published = 1` rows, ordered by `category, position`. Response shape:
  `{ faqs: [{ id, category, question, answer }] }` (no `position`/`published` in the
  public response — admin will need those, see below).

- **`src/app/help/HelpCenterMobile.tsx`** — the only FAQ-reading UI today (mobile-only;
  `src/app/help/page.tsx` just wraps it in `.mobileOnly`, no desktop version exists).
  Fetches `/api/faqs` on mount instead of a hardcoded array, filters client-side by the
  same 4 category chips + a search box. Local `Faq` type: `{ id, category, question,
  answer }` — matches the API response exactly, no mapping layer.

## What's still needed before admin can edit FAQs (not built)

1. **Admin identity.** Same blocker as `admin_support.md` — nothing in either codebase
   knows what an "admin" is yet (no role check, no Firebase custom claim). Whatever
   mechanism lands, every new admin FAQ route needs a `requireAdmin(req)` guard in
   front of it. (A throwaway allowlist-based version of this was built and then
   reverted on 2026-07-11 — see point 2 below for why. The shape is worth reusing:
   verify the bearer token via `adminAuth.verifyIdToken`, check the decoded email
   against an allowlist, e.g. an `ADMIN_EMAILS` env var.)

2. **Where the admin UI lives.** The real admin panel is a **separate** standalone
   Next.js app at `admin/` on the git branch `admin` (not merged into `ND`, not in the
   normal working tree) — its own `package.json`, own port (3001), a sidebar shell
   (`admin/src/app/components/Sidebar.tsx` + `AdminShell.tsx`) with tabs for
   Overview/Listings/Users/Messages/Analytics/Settings. Every tab besides the dashboard
   is a "coming soon" placeholder — zero backend wiring (no `firebase-admin`, no D1
   client, no auth) as of 2026-07-11. **A FAQs tab needs to be added there**, following
   the same `Sidebar` NAV-array + page-per-tab pattern already established by the other
   placeholder tabs. (A parallel `/admin` section was mistakenly built inside
   `new_unistay` itself first — that was reverted; don't repeat it.)

3. **How that separate app reaches this app's data.** Since `admin/` has no D1 or
   Firebase-admin client of its own, there are two options, undecided:
   - It calls `new_unistay`'s API routes over HTTP (needs CORS handling in dev, since
     it's a different origin/port, and a real shared domain once deployed).
   - It grows its own `d1.ts` / `firebase-admin.ts` (duplicate env vars, duplicate
     admin-auth logic) and talks to the same D1 database directly.

4. **Admin CRUD routes** (design already worked out once, not currently in the
   codebase — rebuild these in whichever app ends up owning them per point 3):
   - `GET /api/admin/faqs` — all FAQs including unpublished, same ordering as the
     public route.
   - `POST /api/admin/faqs` — create; body `{ category, question, answer, published? }`;
     appends to the end of its category (`position = current max + 1`).
   - `PATCH /api/admin/faqs/[id]` — partial update, any of
     `{ category, question, answer, position, published }`.
   - `DELETE /api/admin/faqs/[id]`.
   - No separate reorder endpoint — reordering is "swap `position` between two
     neighboring rows via two `PATCH` calls," driven by up/down buttons in the UI
     rather than drag-and-drop (avoids pulling in a DnD dependency for a v1 admin tool).

5. **Admin UI content.** Group by the 4 fixed categories, list rows with inline
   edit (question/answer), a publish/unpublish toggle (so drafts can be staged before
   going live), delete, up/down reorder, and an "+ Add FAQ" form per category. This was
   fully built once (`src/app/admin/faqs/page.tsx`, since reverted) and can be used as
   a reference/starting point even though the file no longer exists in this repo — ask
   if you want it rebuilt once points 2–3 are decided.

## Known conflict with `ADMIN_PANEL_PLAN.md`

That doc has no FAQ section at all — it predates this feature. When admin auth
(§1 of that doc) eventually gets built for real, the FAQ admin routes above should be
gated by whatever `requireAdmin()` mechanism comes out of that work, not the
throwaway email-allowlist stub described in point 1.
