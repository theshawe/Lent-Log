# Pre-Live QA Matrix

Use this checklist before each production deploy.

## Environment

- [ ] Supabase project uses `supabase/schema.sql` from this repo
- [ ] Email auth redirect URLs match production domain
- [ ] `assets/config.js` points to production Supabase URL + anon key

## Core User Flows

- [ ] **New user onboarding**
  - lands on home
  - sets profile + commitments
  - saves first check-in
- [ ] **Signed out flow**
  - can read public feed
  - cannot support/comment/report without sign-in
  - sees clear sign-in guidance
- [ ] **Offline -> online sync**
  - save check-in offline
  - reconnect and verify queue flush
  - verify feed/post state converges
- [ ] **Two-account social flow**
  - account A posts, account B supports + comments
  - account A replies
  - both accounts see updates in near-real time after refresh
  - each account can delete only its own comments/replies
- [ ] **Edit historical day -> feed update**
  - edit previous day
  - confirm remote feed post updates for that day
- [ ] **Profile updates reflected**
  - change display name/avatar
  - confirm feed cards show updated identity

## Safety + Moderation

- [ ] **RLS enforcement spot checks**
  - cannot write another user's profile/checkin/post/comment
  - cannot delete another user's comment
- [ ] **Rate limit**
  - rapid-fire comment submissions hit limit
  - UI shows graceful warning
- [ ] **Report flow**
  - report on a post succeeds
  - row appears in `content_reports`

## Launch Gate

- [ ] Terms/Privacy/FAQ links visible on all primary pages
- [ ] Contact email is final and monitored
- [ ] No console errors in critical flows
- [ ] Manual smoke pass complete on mobile + desktop
