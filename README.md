# Lent Log (Jekyll + Vanilla JS + Supabase Feed)

Static-first Lent tracker with local-first storage, optional auth, and a real public feed backed by Supabase.

## Files

- `index.html` - landing
- `app.html` - daily check-in flow
- `progress.html` - log history + modal edits
- `setup.html` - profile + settings + Supabase config
- `community.html` - public feed
- `assets/app.js` - app logic + sync integration
- `assets/config.js` - static Supabase public config (set once)
- `assets/supabase-client.js` - Supabase auth/data client
- `assets/auth.js` - auth panel UI
- `supabase/schema.sql` - DB schema + RLS policies
- `docs/prelive-qa.md` - production QA matrix and sign-off checklist

## Storage Model

- Local app cache: `localStorage["lent_tracker_v1"]`
- Supabase auth session: `localStorage["lent_supabase_session_v1"]`
- Supabase config: `localStorage["lent_supabase_config_v1"]`
- Offline remote queue: `localStorage["lent_remote_queue_v1"]`

## Supabase Setup

1. Create a Supabase project.
2. In Supabase SQL editor, run `supabase/schema.sql`.
3. In Supabase Auth settings:
   - Enable Email (magic link)
   - Optionally enable Google and Apple providers
   - Add your site URL and redirect URL(s)
4. In your codebase:
   - Open `assets/config.js`
   - Set `url` and `anonKey`
5. In the app:
   - Open `setup.html`
   - Sign in from auth panel

## Run Locally

### Option A: Jekyll serve

1. `bundle install`
2. `bundle exec jekyll serve`
3. Open printed URL (`http://127.0.0.1:4000`)

### Option B: Static open

Open `index.html` directly.  
For auth redirect testing, use a real local server URL (Option A).

## Deploy (FTP/shared hosting)

1. Build: `bundle exec jekyll build`
2. Upload `_site/` contents to web root
3. Add production domain to Supabase Auth redirect URLs

## Sync Behavior

- Writes save locally first, then sync remote when authenticated.
- Failed remote writes are queued and retried when online.
- On load, remote profile/check-ins merge into local store (latest update wins).
- If not signed in or Supabase not configured, app runs local-only.

## Public Content Rules

- Daily logs are public only when `Share my daily log with community board` is enabled.
- Posts created in `Add a post of support` are public when posted while signed in.
- Comments and replies on public posts are public.
- Supports are public counts associated with public posts.

## Moderation + Abuse Controls

- RLS across all tables with owner-scoped writes.
- `is_hidden` moderation flags on feed posts and comments.
- `content_reports` table for report intake.
- Comment/reply rate limiter trigger (max 8 writes per user per 60 seconds).

## Manual QA Checklist

1. **Auth bootstrap**
   - Configure Supabase in Profile.
   - Send magic link; return to app.
   - Confirm auth panel shows signed-in state.

2. **Profile sync**
   - Change display name/avatar/tone/share toggle.
   - Save and refresh.
   - Confirm values persist and remain consistent after sign-in.

3. **Check-in publish**
   - Save a day in `app.html` with sharing enabled.
   - Confirm post appears in `community.html`.
   - Edit the same day in `progress.html`; confirm feed updates.

4. **Feed + supports**
   - Open app in second browser/account.
   - Confirm both users see same latest public posts.
   - Toggle Support and confirm count updates cross-session.
   - Add comments/replies from both users and confirm cross-device visibility.
   - Delete own comment and confirm it disappears for both users.

5. **Offline fallback**
   - Save check-in while offline.
   - Go online and refresh.
   - Confirm queued updates sync and feed catches up.

See `docs/prelive-qa.md` for the full pre-live matrix and release gate.
