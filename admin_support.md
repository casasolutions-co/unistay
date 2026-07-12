# Support tickets & bookings — what's done, what's left for admin

## What exists now (student side only)

Support tickets reuse the existing messaging system instead of a separate table.
A support ticket **is** an `inquiries` row with `listing_id = NULL` and `type = 'support'`
(`inquiries.type` and `inquiries.subject` added — see `scripts/migrate-support-tickets.sql`,
folded into `scripts/schema.sql`).

- `src/app/contact/ContactSupportDesktop.tsx` / `ContactSupportMobile.tsx` — the contact
  form now calls `POST /api/support` with `{ topic, subject, message }` and requires the
  user to be signed in (uses their Firebase ID token, same as everywhere else in the app).
- `src/app/api/support/route.ts` — creates the `inquiries` row (`type='support'`) + first
  `messages` row. No recipient/unread bump happens here — there's no admin to notify yet.
- `src/app/api/chat/route.ts` (inbox `GET`) — now returns support threads alongside normal
  listing inquiries, with `other_name = 'UniStay Support'`, `other_role = 'support'` and no
  listing fields, so the student sees their ticket in `/messages` like any other thread.
- `src/app/messages/page.tsx` — renders `type='support'` threads without a listing card
  (shows "Support ticket" in the header instead), and labels the other party "Support"
  (`roleLabel`, `ROLE_STYLE.support`).
- `src/app/api/chat/[inquiryId]/route.ts` — **untouched**, and doesn't need to be for the
  student side: `listing_id` was already nullable, so `verifyParticipant()`'s
  `i.student_id = ? OR l.landlord_id = ?` and the unread-bump's
  `JOIN listings l ON l.id = i.listing_id` both silently no-op correctly when
  `listing_id IS NULL` (no listing row matches, no landlord to notify). A student can
  already open their ticket thread and see/send messages in it — there's just nobody
  on the other end to reply yet.

## What's still needed before admin can reply (not built)

1. **Admin identity.** Nothing in the codebase currently knows what an "admin" is — no
   role check, no Firebase custom claim, no `/admin` guard (see `ADMIN_PANEL_PLAN.md` for
   the original plan: Firebase custom claim `{ admin: true }`). This has to exist before
   anything below can be gated safely. Whatever mechanism you land on, you'll want a small
   `requireAdmin(req)` helper used by every new admin route.

2. **`verifyParticipant()` needs a third branch.** In
   `src/app/api/chat/[inquiryId]/route.ts`, add something like
   `OR (i.type = 'support' AND <uid is admin>)` so an admin can open/reply to a ticket
   they didn't create. Right now only the ticket's own student can access it.

3. **Admin inbox query.** `GET /api/chat` filters to `i.student_id = ? OR l.landlord_id = ?`
   — an admin isn't either of those, so they'd see nothing. Either add an admin-only
   branch to that route (`if (isAdmin) additionally include WHERE i.type = 'support'`), or
   build a separate `GET /api/admin/support` that lists all `type='support'` inquiries
   (probably filtered by `status` — open vs resolved) regardless of participant. The
   latter is cleaner since admin's "inbox" is conceptually a queue, not a personal inbox.

4. **Unread/notify-recipient logic in `POST /api/chat/[inquiryId]`.** Currently computes
   the recipient as `student_id === uid ? landlord_id : student_id` via an inner `JOIN
   listings`, which returns nothing for support tickets (by design, for now — see above).
   Once admin exists, decide: does every admin get notified, or does a ticket get
   "claimed" by one admin? The latter needs a new column (e.g. `inquiries.claimed_by`)
   before you can target a specific recipient for the unread bump.

5. **Admin UI.** `src/app/admin/` is empty (just an empty `messages/` folder). Build
   `/admin/messages` (or `/admin/support`) reusing the `InboxThread`/`ChatMessage` shape
   and the message-rendering components already in `src/app/messages/page.tsx` — the data
   shape is identical, so this can likely be a thin variant of that page pointed at the
   admin-scoped API from #3, rather than new UI from scratch.

## Bookings — how they work today (pre-existing, not part of this change)

Not built by this change, but documented here since it's the other thing that flows
through the same `inquiries`/`messages` tables and admin will eventually need to see it
too. There is **no separate `bookings` table and no payment processing anywhere in the
codebase** — "booking" is a structured chat message, nothing more.

1. Student clicks "Request to book" on a listing (`src/app/search/[id]/page.tsx` /
   `ApartmentDetailsMobile.tsx`) → `POST /api/bookings` (`src/app/api/bookings/route.ts`).
2. That route upserts the **same** `inquiries` row used for regular messaging (one per
   student+listing pair — booking and messaging a host are the same thread, not separate
   flows), then inserts a `messages` row with `msg_type='booking'` and JSON `metadata =
   { price, move_in, move_out, deposit, status: 'pending' }`.
3. It renders as a `BookingCard` in `/messages` (`src/app/messages/page.tsx`) with
   Accept/Decline buttons for the landlord.
4. Landlord responds via `PATCH /api/chat/[inquiryId]/messages/[messageId]`
   (`src/app/api/chat/[inquiryId]/messages/[messageId]/route.ts`), which only rewrites
   that message's `metadata.status` and posts an auto-confirmation text message.
   **Nothing else happens** — the listing's `status` column is untouched (still bookable
   by someone else after an "accepted" booking), and there is no charge, hold, or
   contract created anywhere.
5. `msg_type='viewing'` (scheduling a viewing) works identically, same route, same
   accept/decline mechanism, just a different card.

### Open questions for admin — not decided, needs a call from you

Since there's no dedicated booking record, "admin functions for bookings" really means
admin functions over `messages WHERE msg_type IN ('booking','viewing')`. Things nobody
has decided yet:

- **Visibility**: should admin be able to see all booking requests platform-wide (a
  "bookings" queue like the support-ticket queue), or only reach one via the `reports`
  flow like other messages (per `ADMIN_PANEL_PLAN.md` §6)?
- **Listing state**: right now accepting a booking doesn't mark the listing as taken/
  unavailable — is that a gap to fix (e.g. auto-set `listings.status`), or intentional
  because there's no payment to make "accepted" binding?
- **Disputes/cancellations**: `HelpCenterMobile.tsx` mentions cancelling a confirmed
  booking via "Settings → Applications" — unconfirmed whether that page exists. If a
  booking dispute needs admin intervention, there's currently no way for admin to
  force-decline, un-accept, or intervene in a booking message at all.
- **Payments**: none exist. If/when added, that's a much bigger integration (Stripe or
  similar) and would need its own record separate from `messages.metadata` — the JSON
  blob approach won't hold up once money is involved (no audit trail, no idempotency).

## Known conflict with `ADMIN_PANEL_PLAN.md`

That doc's §6 ("Inquiries / messages oversight") deliberately designed admin to have
**no standing inbox** — admin only enters a thread reactively, via the `reports` table,
when something is flagged. This support-ticket queue is the opposite: a proactive inbox
of tickets admin is expected to work through. Both can coexist (they're different
entry points into the same `messages` table), but when building the admin UI, treat
"reports queue" and "support ticket queue" as two separate lists into two different
subsets of `inquiries`/`messages` — don't try to unify them into one view, since a
flagged student↔landlord thread and an open support ticket mean different things and
probably want different actions available.

## Ticket status

`inquiries.status` (`'pending'` by default) is unused by anything support-specific right
now. When admin exists, reuse it for ticket lifecycle (e.g. `'pending' → 'resolved'`)
rather than adding a new column — same pattern as booking/viewing message
accept/decline already used elsewhere in `src/app/api/chat/[inquiryId]/messages/[messageId]/route.ts`.
