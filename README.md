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

Open `.env` and replace the placeholders. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` have to be real before migrate. `SEED_USER_PASSWORD` is only needed for the sample users. Nothing in the repo is a working login.

```bash
npm install
npm run db:migrate   # schema, then one admin user from ADMIN_EMAIL
npm run db:seed      # sample cooks, recipes, pantry items, and posts
npm run dev          # http://localhost:3000
```

`GET /health` returns a short status JSON. `GET /` lists the route groups.

Other scripts: `npm run dev:watch`, `npm run build`, `npm start`, `npm run typecheck`, `npm test`, `npm run db:reset` (clears data, migrates, and seeds again).

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

`GET /users/:id` is registered before `GET /users/dashboard`, so a request to `/api/v1/users/dashboard` is handled as a user id today.

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

`GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `POST /api/v1/notifications`, `PATCH /api/v1/notifications/:id`, `PATCH /api/v1/notifications/mark-all-read`, `PATCH /api/v1/notifications/bulk-archive`, `DELETE /api/v1/notifications/:id`.

`PATCH /notifications/:id` is registered first, so `/mark-all-read` and `/bulk-archive` are currently handled as an id update.

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

SQL files under `src/scripts/` (`01-seed-*.sql` through `10-seed-*.sql`) are sample rows for recipes and posts. They do not create logins. `npm run db:seed` uses `src/scripts/seed.ts` instead.
