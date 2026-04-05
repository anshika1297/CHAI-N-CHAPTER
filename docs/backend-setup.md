# Backend setup

The API (`apps/api`) is an Express + MongoDB app. It powers **admin login** and **page settings** (Contact, Work With Me, About, Terms, Privacy). Blog, Recommendations, and Musings are not wired to the API yet.

## 1. API env

Copy `apps/api/.env.example` to `apps/api/.env` and set:

- **MONGODB_URI** – MongoDB connection string (required). **Must include the database name**, e.g. `...mongodb.net/chai-n-chapter`. If you omit it, the driver uses the default DB (`test`) and your users live in `chai-n-chapter`, so login will fail.
- **JWT_SECRET** – Secret for admin JWT (change in production).
- **FRONTEND_URL** – Allowed CORS origin (e.g. `http://localhost:3000`).
- **PORT** – API port (default `5000`).

For creating the first admin user (see below):

- **ADMIN_EMAIL** – Admin email (e.g. `admin@example.com`).
- **ADMIN_PASSWORD** – Admin password.

## 2. Run the API

From the repo root:

```bash
npm run dev:api
```

Or from `apps/api`:

```bash
npm run dev
```

The API listens on `http://localhost:5000` (or your `PORT`). Health check: `GET http://localhost:5000/health` — the response includes `database` so you can confirm the API is using the `chai-n-chapter` DB.

## 3. Create the first admin user

With the API **stopped**, run the seed script with `ADMIN_EMAIL` and `ADMIN_PASSWORD` set in `apps/api/.env` (or in the shell):

```bash
cd apps/api
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=your-secure-password npm run seed:admin
```

Or set those in `.env` and run:

```bash
cd apps/api
npm run seed:admin
```

This creates a single admin user. If that email already exists, the script exits without changes.

## 4. Web app → API

In `apps/web`, set the API base URL so admin login and settings work:

- **Local:** `NEXT_PUBLIC_API_URL=http://localhost:5000` in `apps/web/.env.local` (or in `.env`).
- If unset, the web app uses `http://localhost:5000`.

Then run the web app:

```bash
npm run dev:web
```

Log in at `/admin/login` with the admin email and password you used in the seed script. After login, Admin → Contact / Work With Me / About / Terms / Privacy load and save via the API.

## 5. API routes (current)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | no | Health check |
| GET | `/api` | no | API info |
| GET | `/api/settings/pages/:slug` | no | Get page content (`contact`, `work-with-me`, `about`, `terms`, `privacy`) |
| PUT | `/api/settings/pages/:slug` | Bearer token | Save page content |
| POST | `/api/auth/login` | no | Login; body `{ email, password }`, returns `{ token }` |
| GET | `/api/users` | Bearer token | List admin users |
| POST | `/api/users` | Bearer token | Create user; body `{ email, password, name?, role? }` |
| PUT | `/api/users/:id` | Bearer token | Update user; body `{ name?, role?, password? }` |
| DELETE | `/api/users/:id` | Bearer token | Delete user |
| GET | `/api/dashboard/stats` | Bearer token | Dashboard stats (placeholder + admin user count) |

Protected routes expect: `Authorization: Bearer <token>`.

## 6. “Not fetching data from the database”

If the admin panel or the public Contact page doesn’t show data from the backend:

1. **API running** – Start the API with `npm run dev:api` (or `npm run dev` from `apps/api`). It must reach “MongoDB connected to database: chai-n-chapter” and “Server running on …”.
2. **Database name** – If login fails with “Invalid email or password” but your users live in the **chai-n-chapter** DB, set `MONGODB_URI` so it ends with `/chai-n-chapter` (e.g. `...mongodb.net/chai-n-chapter`). Hit `GET http://localhost:5000/health` and confirm the response has `"database": "chai-n-chapter"`. Then run the seed again from `apps/api` so the admin user is in that DB.
3. **Web → API URL** – In `apps/web`, set `NEXT_PUBLIC_API_URL=http://localhost:5000` in `.env.local` (or `.env`) so the app calls the right API. Restart the Next dev server after changing env.
4. **CORS** – In `apps/api/.env`, set `FRONTEND_URL=http://localhost:3000` (or the URL where the web app runs) so the API allows requests from the frontend.
5. **Save first** – Admin → Contact / Work With Me / About etc. load from the DB only after you’ve saved at least once. Until then, GET returns `{ content: null }` and the UI uses default content.
6. **Public Contact** – The public `/contact` page now loads header, social links, and sidebar from the API when available; if the API is down or returns null, it falls back to default text.

## 7. Blog / Recommendations / Musings

Content and CRUD for Book Reviews, Book Recommendations, and Her Musings Verse are **not** implemented in the API yet. Those admin pages still use local state. When you add them, create models and routes (e.g. `GET/POST/PUT/DELETE /api/blog`, `/api/recommendations`, `/api/musings`) and point the admin (and optional public listing/detail) to the API.
