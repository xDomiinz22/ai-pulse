# AI Pulse

> An AI news aggregator that scrapes RSS feeds, filters and summarizes articles with Google Gemini, and serves them through a fast, animated React frontend.

**Live demo → [ai-pulse-newsletter.vercel.app](https://ai-pulse-newsletter.vercel.app)**

AI Pulse pulls the latest articles from AI-focused sources, uses Gemini to keep only genuinely AI-related news (categorizing each one and generating a short summary + read time), and presents them with search, category filters, voting, and a live trending ranking. Authentication supports both email/password and "Sign in with Google".

---

## Features

- 📰 **Automated news scraping** — RSS feeds parsed hourly, filtered & categorized by Gemini 2.5 Flash (model / research / industry / ethics) with AI-generated summaries and read times.
- 🔐 **Authentication** — email/password **and** Google Sign-In, with sessions delivered as httpOnly cookies (JWT never exposed to JS) + CSRF double-submit protection and a password-strength meter.
- 👍 **Voting & Trending** — upvote/downvote with per-IP anti-spam; a live trending ranking backed by a Redis sorted set that updates instantly on vote.
- 🔎 **Search & filters** — fuzzy client-side search (Fuse.js) and per-category filtering with real article counts.
- 🎨 **Polished UI** — Tailwind CSS v4, GSAP animations, dark/light theme.
- 🛡️ **Hardened backend** — Helmet security headers, sliding-window rate limiting (Upstash), input caps, and graceful degradation when Redis is unavailable.

---

## Tech Stack

| Layer        | Technologies                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS v4, GSAP, Fuse.js, date-fns         |
| **Backend**  | Node.js, Express 5, TypeScript, Prisma 7                                      |
| **Data**     | Neon (PostgreSQL), Upstash Redis (cache, rate limiting, trending, JWT denylist) |
| **AI**       | Google Gemini 2.5 Flash (article filtering, categorization, summaries)       |
| **Auth**     | JWT (httpOnly cookies) + CSRF, bcrypt, Google Identity Services, zxcvbn-ts   |
| **Hosting**  | Vercel (single project, two services on the same origin)                     |

---

## Project Structure

```
.
├── index.html              # Vite entry
├── src/                    # Frontend (React)
│   ├── components/         # Header, Hero, NewsGrid, Card, Trending, AuthModal, …
│   ├── context/            # AuthContext
│   ├── hooks/              # useTheme
│   ├── lib/                # api.ts, passwordStrength.ts
│   └── App.tsx
├── backend/                # Backend (Express)
│   ├── src/
│   │   ├── routes/         # articles, auth, newsletter
│   │   ├── services/       # scraper (RSS + Gemini)
│   │   ├── middleware/     # auth, csrf, rateLimit, errorHandler
│   │   ├── lib/            # prisma, redis, cache, cookies
│   │   ├── app.ts          # Express app (exported)
│   │   └── index.ts        # Local dev entry (listen + cron)
│   └── prisma/schema.prisma
└── vercel.json             # Multi-service deployment config
```

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- A **PostgreSQL** database — e.g. a free [Neon](https://neon.tech) project
- An **Upstash Redis** database (optional but recommended) — [console.upstash.com](https://console.upstash.com)
- A **Google Gemini API key** — [aistudio.google.com](https://aistudio.google.com)
- A **Google OAuth Client ID** (for Google login) — [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### 1. Clone & install

```bash
git clone https://github.com/xDomiinz22/ai-pulse.git
cd ai-pulse

# Frontend deps (repo root)
npm install

# Backend deps
cd backend && npm install && cd ..
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# then fill in the values (see the table below)
```

### 3. Set up the database

```bash
cd backend
npx prisma db push      # sync the schema to your database
```

### 4. Run

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend && npm run dev

# Terminal 2 — frontend (http://localhost:5177)
npm run dev
```

The scraper runs on backend startup and then hourly, populating the database with fresh articles.

---

## Environment Variables

All backend secrets live in `backend/.env` (git-ignored). See [`backend/.env.example`](backend/.env.example).

| Variable                   | Required | Description                                                        |
| -------------------------- | :------: | ------------------------------------------------------------------ |
| `DATABASE_URL`             |    ✅    | PostgreSQL connection string (Neon).                               |
| `JWT_SECRET`               |    ✅    | ≥ 32 random chars for signing JWTs. Never use a placeholder.       |
| `GEMINI_API_KEY`           |    ✅    | Google Gemini key used by the scraper.                             |
| `GOOGLE_CLIENT_ID`         |    ✅*   | Google OAuth Client ID; verifies Google ID tokens. *Required for Google login. |
| `UPSTASH_REDIS_REST_URL`   |    ➖    | Upstash Redis REST URL. If unset, cache/rate-limit/trending are disabled. |
| `UPSTASH_REDIS_REST_TOKEN` |    ➖    | Upstash Redis REST token.                                          |
| `JWT_EXPIRES_IN`           |    ➖    | Token lifetime (default `1d`).                                     |
| `PORT`                     |    ➖    | Backend port (default `3001`). Do not set on Vercel.               |
| `FRONTEND_URL`             |    ➖    | Allowed CORS origin (default `http://localhost:5177`). Injected automatically on Vercel. |
| `NODE_ENV`                 |    ➖    | Set to `production` in prod to enable HSTS + secure cookies.       |

> The **frontend** reads the public Google Client ID from `VITE_GOOGLE_CLIENT_ID` (it falls back to a built-in default, since a Client ID is not secret).

---

## Scripts

**Frontend** (repo root)

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start Vite dev server (port 5177) |
| `npm run build`   | Type-check and build for prod     |
| `npm run preview` | Preview the production build      |

**Backend** (`/backend`)

| Command               | Description                               |
| --------------------- | ----------------------------------------- |
| `npm run dev`         | Start the API with hot reload (port 3001) |
| `npm run build`       | Compile TypeScript to `dist/`             |
| `npm start`           | Run the compiled server                   |
| `npm run db:generate` | Generate the Prisma client                |
| `npm run db:studio`   | Open Prisma Studio                        |
| `npx prisma db push`  | Sync the Prisma schema to the database    |

---

## Deployment

Deployed on **Vercel** as a **single project with two services** (Vercel "Services"), so the frontend (`/`) and the backend (`/api`) share one origin — which lets the httpOnly auth cookies work without cross-site issues. The configuration lives in [`vercel.json`](vercel.json) via `experimentalServices`.

Key points:

- The backend runs as an always-on web service (`backend/src/index.ts` → `app.listen` + hourly `node-cron` scraper).
- Vercel **strips** the `/api` route prefix, so backend routes are mounted at root in production (handled automatically via the `VERCEL` env var).
- Set the same environment variables from the table above in the Vercel dashboard — except `PORT` and `FRONTEND_URL`, which Vercel manages for you.
- For Google login, add your deployment URL to the OAuth client's **Authorized JavaScript origins**.

---

## Security Notes

- `backend/.env` is git-ignored — **secrets are never committed**.
- JWTs are sent only as httpOnly cookies, never in the response body or `localStorage`.
- All mutating authenticated routes require CSRF (double-submit token).
- Rate limiting, Helmet headers (CSP, `X-Frame-Options: DENY`, nosniff, HSTS), and request-body size caps are enabled.

---

## License

MIT
