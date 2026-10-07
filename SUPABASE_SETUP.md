# Ridge Run username accounts and cloud saves

The game remains playable as a Guest with no configuration. This repository implements
real username/password accounts using Supabase Postgres + an Edge Function. It does
**not** create hidden email addresses or use Supabase Auth's email login. Credentials
are hashed by Postgres pgcrypto bcrypt (cost 12, random salt). The backend issues random
256-bit opaque sessions; only SHA-256 token hashes are stored in the database. No
passwords are stored in the browser or save data.

## Deploy
1. Create a Supabase project. Install and authenticate the Supabase CLI on your computer.
2. From this repository: `supabase link --project-ref YOUR_PROJECT_REF`.
3. Run `supabase db push` to apply `supabase/migrations/202610070001_accounts.sql`.
   Alternatively run that complete file in the project's SQL editor once.
4. Copy `supabase/.env.example` to an ignored local `.env`. Set `ALLOWED_ORIGINS` to
   exact origins, comma-separated, with no trailing slash. Include the actual game
   origin (for example `https://ridge-run-phase-one.bowdavis938753.chatgpt.site`).
   Include `http://localhost:8000` only if needed for local testing.
   Generate `RATE_LIMIT_PEPPER` with `openssl rand -hex 32`.
5. Run `supabase secrets set --env-file .env`. Hosted functions supply
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` automatically. Never put the service
   key in `dist/`, GitHub, frontend configuration, or screenshots.
6. Run `supabase functions deploy ridge-account --no-verify-jwt`.
   This flag is intentional: the endpoint uses its own opaque sessions, not Supabase
   JWTs. Every load/write/logout validates the token against an unexpired backend
   session. Registration/login validate credentials and use persistent rate limits.
7. Set only `endpoint` in `dist/accountConfig.js` to
   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/ridge-account`.
   No public API key or other credential is required by this frontend.
8. Commit the public URL change and publish the game files using your hosting workflow.
   This repository change does not automatically deploy either the game or Supabase.

## Ownership and database protection
- `ridge_private.accounts`: UUID, preserved display username, unique generated lowercase
  username key, bcrypt hash, creation time. Usernames are 3–20 ASCII letters, digits or
  underscores. Passwords are 12+ characters, at most 72 UTF-8 bytes (bcrypt limit).
- `ridge_private.sessions`: hashed token, account UUID, seven-day expiry.
- `ridge_private.saves`: one row per account UUID, version, monotonically increasing
  revision, database timestamp, complete progression JSON (maximum 1 MiB).
- `ridge_private.rate_limits`: persistent authentication throttles. Defaults: 10 attempts
  per username per 15 minutes, 120 total auth attempts/minute, 30 registrations/hour.
  Adjust these server limits for expected traffic; consider a CAPTCHA for public scale.
- All four tables have RLS enabled with no permissive browser policies. The private
  schema and tables deny PUBLIC, anon and authenticated. Keep `ridge_private` OUT of
  Supabase's exposed schemas. Browser roles also cannot execute any `ridge_*` RPC.
- Only the Edge Function's service role may invoke the three RPC functions. A fixed
  search_path and schema-qualified SQL prevent function search-path hijacking.
- `ridge_save` derives the account ID from the session hash. Client-supplied user IDs
  and usernames cannot change ownership. A row lock plus expected revision prevents
  concurrent devices silently overwriting each other's data, including first writes.
- CORS is an additional browser boundary, not the ownership check. Allowed origin
  headers alone never authorize access. Rate limits use HMAC-obscured bucket names.
- Deploy behind HTTPS. Do not enable request-body/SQL-parameter logging for credential
  requests. Never add third-party scripts that can read browser session storage.

## Browser behavior and migration
Existing guest keys (`ridge-run-progress-v3`, `ridge-run-garage-v1`) are unchanged.
Account caches use separate `ridge-run-user-v1:<UUID>` keys. All permanent progression
is uploaded as one snapshot, including stats, map records, upgrades, settings and
future fields. Switching accounts never replaces the guest save. A failed request
never replaces local progress. Sign-out returns to the original Guest save and keeps
an offline account cache for later sign-in.

Tokens are stored only in sessionStorage (not in saves); reload stays signed in within
that tab. Closing the tab/browser requires signing in again. Sign-out revokes the token
online; offline sign-out clears the browser token immediately, while the server token
expires after seven days. There is no password-recovery mechanism in this version.
Use a password manager. There are no email fields or invented email aliases.

On sign-in, choose Guest/Local, Cloud, or Merge. Existing dirty account caches take
precedence over a guest snapshot as the Local option. Merge unions unlocks/checkpoints,
uses highest upgrades and best records, retains the vehicle associated with each map
record, and uses **maximum** balance and lifetime counters rather than summing them.
This is idempotent and avoids duplication of shared history, but may undercount distinct
offline sessions. Local settings/selection win. Choosing Cloud can intentionally discard
pending local progress; the choice screen shows both balances/unlock counts first.

Saves upload after a five-second debounce. Offline failures retain the pending local
snapshot and retry; coming online retries immediately. A revision conflict pauses cloud
writes and offers explicit resolution on the Account page. Gameplay continues. Other
clients' data is not applied while driving. Cloud saving is backup/sync, not an anti-cheat
server: a player can still edit their own local progression, just as in guest mode.

## Verification
Run `npm ci` then `npm test` for merge, transport/security, guest compatibility, offline
and conflict tests. Database tests run the actual migration and bcrypt/RLS/ownership
checks in isolated PGlite PostgreSQL and exercise the Edge handler against it. Transport
tests also simulate network failures. These tests do not prove a hosted deployment is configured.
After deploying, run the SQL security checks in `supabase/tests/security.sql` through
the SQL editor (they roll back), then manually check two accounts in separate browser
profiles:
1. Guest: earn coins, refresh; confirm old saves, upgrades and records remain.
2. Register `Driver_One`; attempt `driver_one` and verify it is unavailable.
3. Sign out; sign in with mixed capitalization; confirm original display name.
4. Choose Guest, Cloud, Merge in separate trials. Confirm no double-added currency.
5. Earn/save, sign in on another device, choose Cloud; compare all progression.
6. Turn network off, play/end a run, reload the same tab; verify local progress. Restore
   network and confirm Pending Sync clears or offers an explicit conflict choice.
7. Make concurrent progress on both devices; verify revision conflict prevents overwrite.
8. Use account A's session with a forged account B ID in a save request: only A can change.
   Without a session, requests return 401. An expired/revoked token also returns 401.
9. Attempt REST reads/writes/RPC with the public anon key: all private data stays denied.
10. Confirm frontend/network responses contain no password hashes or service-role key.

Schedule periodic maintenance (Supabase cron or dashboard): delete expired sessions and
rate-limit rows older than one day. Database backups should include `ridge_private`.
Public username availability is intentionally discoverable during registration.

References: https://supabase.com/docs/guides/database/functions,
https://supabase.com/docs/guides/database/postgres/row-level-security,
https://supabase.com/docs/guides/functions/secrets,
https://www.postgresql.org/docs/current/pgcrypto.html.
