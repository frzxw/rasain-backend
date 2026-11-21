# Rasain API

Backend for [Rasain](https://github.com/frzxw/rasain-app), a Flutter app for Indonesian home cooking. This service stores accounts, recipes, a personal pantry, community posts, notifications, and image uploads. It also keeps a small cooking chat: you send a message, and the server replies with a canned assistant response (there is no external model wired up yet).

Data lives in Supabase (Postgres). The app repo talks to Supabase directly; this API is the Express service you can run beside it.

## Stack

Node.js 18+, TypeScript, Express, Supabase, Helmet, CORS, Joi, Multer, Winston, and Jest. Passwords hashed for seeded users use bcrypt. Request auth on the API is a Supabase session token, sent as `Authorization: Bearer <token>`.

## Run it locally

You need Node.js 18 or newer, and a Supabase project.

```bash
cp .env.example .env
```

Open `.env` and replace the placeholders. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` have to be real before migrate. `DATABASE_URL` is the direct Postgres string from the Supabase dashboard (Project Settings → Database). `SEED_USER_PASSWORD` is the shared password for the three sample cooks. Nothing in the repo is a working login.

```bash
npm install
npm run db:migrate   # applies schema.sql, then one admin user from ADMIN_EMAIL
npm run db:seed      # sample cooks, recipes, pantry items, and posts
npm run dev          # http://localhost:3000
```

`GET /health` returns a short status JSON. `GET /` lists the route groups.

Other scripts: `npm run dev:watch`, `npm run build`, `npm start`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run db:reset` (clears data, migrates, and seeds again).

`.env.local` is loaded after `.env` if you want machine-specific overrides. Both files are gitignored.

## Endpoints

Base path is `/api/v1` unless you set `API_VERSION`. Routes marked private need a bearer token.

**Auth** — `src/routes/auth.ts`

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | public |
| POST | `/api/v1/auth/login` | public |
| GET | `/api/v1/auth/me` | private |
| PUT | `/api/v1/auth/profile` | private |
| POST | `/api/v1/auth/logout` | private |
| POST | `/api/v1/auth/forgot-password` | public |
| POST | `/api/v1/auth/reset-password` | public |
| DELETE | `/api/v1/auth/account` | private |

**Users** — `src/routes/users.ts`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/v1/users/:id` | public |
| GET | `/api/v1/users/:id/recipes` | public |
| GET | `/api/v1/users/:id/posts` | public |
| GET | `/api/v1/users/:id/saved-recipes` | public |
| GET | `/api/v1/users/dashboard` | private |
| POST | `/api/v1/users/:id/follow` | private |
| DELETE | `/api/v1/users/:id/follow` | private |

**Recipes** — `src/routes/recipes.ts`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/v1/recipes/popular` | public |
| GET | `/api/v1/recipes/latest` | public |
| GET | `/api/v1/recipes/search` | public |
| GET | `/api/v1/recipes/pantry` | private |
| GET | `/api/v1/recipes/:id` | public |
| POST | `/api/v1/recipes` | private |
| PUT | `/api/v1/recipes/:id` | private, owner |
| DELETE | `/api/v1/recipes/:id` | private, owner |
| POST | `/api/v1/recipes/:id/save` | private |
| DELETE | `/api/v1/recipes/:id/save` | private |
| POST | `/api/v1/recipes/:id/rate` | private |

**Pantry** — `src/routes/pantry.ts` (all private)

`GET /api/v1/pantry`, `GET /api/v1/pantry/categories`, `GET /api/v1/pantry/expiring`, `GET /api/v1/pantry/:id`, `POST /api/v1/pantry`, `PUT /api/v1/pantry/:id`, `DELETE /api/v1/pantry/:id`, `PATCH /api/v1/pantry/bulk`, `POST /api/v1/pantry/:id/use`.

**Community** — `src/routes/community.ts`

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/v1/community/posts` | public |
| GET | `/api/v1/community/posts/:id` | public |
| POST | `/api/v1/community/posts` | private |
| PUT | `/api/v1/community/posts/:id` | private, owner |
| DELETE | `/api/v1/community/posts/:id` | private, owner |
| POST | `/api/v1/community/posts/:id/like` | private |
| DELETE | `/api/v1/community/posts/:id/like` | private |
| POST | `/api/v1/community/posts/:id/comments` | private |
| DELETE | `/api/v1/community/comments/:id` | private, owner |

**Chat** — `src/routes/chat.ts` (all private)

`GET /api/v1/chat/conversations`, `POST /api/v1/chat/conversations`, `GET /api/v1/chat/conversations/:id`, `DELETE /api/v1/chat/conversations/:id`, `POST /api/v1/chat/messages`, `POST /api/v1/chat/messages/:id/rate`.

**Notifications** — `src/routes/notifications.ts` (all private)

`GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `POST /api/v1/notifications`, `PATCH /api/v1/notifications/mark-all-read`, `PATCH /api/v1/notifications/bulk-archive`, `PATCH /api/v1/notifications/:id`, `DELETE /api/v1/notifications/:id`.

**Uploads** — `src/routes/upload.ts` (all private)

`POST /api/v1/upload/image`, `POST /api/v1/upload/images`, `GET /api/v1/upload/my-uploads`, `GET /api/v1/upload/:id`, `PATCH /api/v1/upload/:id`, `DELETE /api/v1/upload/:id`.

## Layout

```
src/
├── config/       Supabase client and env loading
├── middleware/   auth, errors, rate limit, Joi validation
├── models/       users, recipes, pantry, community, notifications
├── routes/       the handlers listed above
├── scripts/      schema.sql, migrate, seed, reset
├── types/
├── utils/        logger
└── server.ts
```

`npm run db:migrate` reads `src/scripts/schema.sql` through `DATABASE_URL` and creates the admin in both Supabase Auth and `public.users`, so `POST /api/v1/auth/login` works. `npm run db:seed` adds three sample cooks the same way (`user1@example.com`, `user2@example.com`, `chef.maya@example.com`) plus recipes, pantry items dated from today, and a few posts. The numbered `01-seed-*.sql` files are extra sample rows. The seed script does not run them, and they do not create logins.

`POST /api/v1/auth/reset-password` expects the Supabase recovery `token_hash`, not a session on this server.
