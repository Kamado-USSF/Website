# Vercel API and shared database

The Vercel deployment uses `api/` serverless functions. Persistent shared data is stored in the Neon Postgres table `ussf_app_state`; Vercel's filesystem is not used for application writes.

## Required environment variables

Configure these in Vercel Project Settings for Preview and Production, and in `.env.local` for local use:

- `DATABASE_URL`: Neon Postgres connection string. Use a pooled connection string for serverless requests.
- `USSF_ADMIN_PASSWORD` (optional): overrides the server-side administrator password used by `POST /api/auth/login`. When unset, the built-in server-side default applies. Never expose this value with a `VITE_` variable or in source control.
- `USSF_SESSION_SECRET` (optional): explicit signing secret for administrator session cookies (at least 16 characters). When unset, a stable secret is derived from `DATABASE_URL`.

There is no manual administrator API token. An administrator signs in through the website's login form; the server validates the credentials and issues an HttpOnly `ussf_admin_session` cookie. Every protected admin request carries that cookie automatically, and the server verifies its signature and expiry on each call.

## One-time seed migration

Back up `data/ussf-database.json` before using it as the initial seed. Set `DATABASE_URL` in `.env.local`, review the seed file, then run:

```powershell
npm run migrate:neon
```

The migration creates the state table and inserts the checked-in snapshot only when row `id = 1` does not already exist. Re-running it does not replace existing Neon data. It does not clear or reset an existing database.

After setting the Vercel environment variables and confirming the migration succeeded, deploy a Preview build first. Verify `GET /api/state`, administrator sign-in via `POST /api/auth/login`, group-spec reads/writes, asset create/update/delete from two browser sessions, account-link approval/rejection, and that unauthenticated requests to protected routes return `401`. Promote to Production only after that verification and explicit approval.

## API routes

- `GET /api/state`, `GET /api/group-info`, `GET /api/assets`: shared persisted reads.
- `POST /api/applications`, `POST /api/link-requests`: pending submissions.
- `PUT /api/claims/:id`, `PUT /api/reports/:id`, `PUT /api/promotions/:id`, `PUT /api/applications/:id`, `PUT /api/link-requests/:id`, `POST /api/members`, `PUT /api/members/:id`, `DELETE /api/members/:id`, `POST /api/group-info`, `POST /api/assets`, `PUT /api/assets/:id`, `DELETE /api/assets/:id`: require a valid administrator session cookie; requests without one receive `401`.
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`: administrator session lifecycle.

The local Express server (`server.ts`) mirrors the same routes and the same session check for group-spec, asset, roster, and review writes.