# AI Pulse

> An AI news aggregator that scrapes RSS feeds, filters and summarizes articles with Google Gemini, and serves them through a fast, animated React frontend.

**Live demo → [ai-pulse-newsletter.vercel.app](https://ai-pulse-newsletter.vercel.app)**

AI Pulse pulls the latest articles from AI-focused sources, uses Gemini to keep only genuinely AI-related news (categorizing each one and generating a short summary + read time), and presents them with search, category filters, voting, and a live trending ranking. It also embeds every article into a pgvector index, powering a built-in **AI chat assistant** that answers questions over the news with citations — and exposes that same semantic search as an **MCP server** any Claude client can connect to. Authentication supports both email/password and "Sign in with Google".

---

## Features

- 📰 **Automated news scraping** — RSS feeds parsed daily, filtered & categorized by Gemini 2.5 Flash (model / research / industry / ethics) with AI-generated summaries and read times. Oldest articles are pruned past a 500-article cap to stay within free-tier storage.
- 🧠 **Semantic search (pgvector)** — every article is embedded (768-dim, `gemini-embedding-001`) and stored in a Postgres `vector` column, enabling cosine-similarity retrieval over the news.
- 💬 **AI chat assistant** — a from-scratch agent loop (Gemini 3.5 Flash + tool use) that calls semantic search and answers questions over the database with citations. Streaming-style typing indicator and graceful "model busy" handling.
- 🔌 **MCP server** — the same `search_articles` retrieval is exposed over the Model Context Protocol (Streamable HTTP), so any MCP client (Claude Desktop, Claude.ai connectors, Claude Code) can query the news with its own model.
- 🔐 **Authentication** — email/password **and** Google Sign-In, with sessions delivered as httpOnly cookies (JWT never exposed to JS) + CSRF double-submit protection and a password-strength meter.
- 👍 **Voting & Trending** — upvote/downvote (**logged-in users only**) with per-IP anti-spam; a live trending ranking backed by a Redis sorted set that updates instantly on vote.
- 🔎 **Search & filters** — fuzzy client-side search (Fuse.js) and per-category filtering with real article counts, plus a "Load more" button that paginates within the active filter/search instead of silently capping the feed at 50.
- ⚡ **Server-side rendering + ISR** — the homepage is server-rendered (Vite + Nitro) with the initial article batch, ticker, and counts embedded straight into the HTML — no client-side loading flash. The `/` route is additionally cached with Incremental Static Regeneration (30 min) so most visits are served instantly from Vercel's CDN with zero function invocation. See [Rendering: SSR + ISR](#rendering-ssr--isr) below.
- 🎨 **Editorial design system** — "The Wire Room" aesthetic: Fraunces (display) + Newsreader (body) + IBM Plex Mono (wire labels), a single printing-red spot color (`#a23b2b`), 0px card radius, flat-by-default surfaces, and a "terminal accent" register (scanline texture + blinking cursor) confined to the ticker, chat widget, and trending header. Designed and iterated end-to-end with the [**impeccable**](https://github.com/anthropics/claude-code) Claude Code skill (critique → layout → adapt → polish → UX fixes). GSAP scroll reveals, GSAP-powered ticker, self-hosted fonts (fontsource — no Google Fonts CDN round trip).
- 🛡️ **Hardened backend** — Helmet security headers, sliding-window rate limiting (Upstash), input caps, and graceful degradation when Redis is unavailable.

---

## Tech Stack

| Layer        | Technologies                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| **Frontend** | React 19, Vite + [Nitro](https://nitro.build) (SSR + ISR), TypeScript, Tailwind CSS v4, GSAP, Fuse.js, date-fns, fontsource |
| **Design**   | [impeccable](https://github.com/anthropics/claude-code) (Claude Code skill) — critique, layout, adapt, polish, UX audit; PRODUCT.md + DESIGN.md design system |
| **Backend**  | Node.js, Express 5, TypeScript, Prisma 7                                      |
| **Data**     | Neon (PostgreSQL + **pgvector**), Upstash Redis (cache, rate limiting, trending, JWT denylist) |
| **AI**       | Google Gemini — 2.5 Flash (scraper), 3.5 Flash (chat agent), `gemini-embedding-001` (embeddings) |
| **Agent / MCP** | Hand-built tool-use loop; `@modelcontextprotocol/sdk` (Streamable HTTP server) with Zod-typed tools |
| **Auth**     | JWT (httpOnly cookies) + CSRF, bcrypt, Google Identity Services, zxcvbn-ts   |
| **Hosting**  | Vercel (single project, two services on the same origin)                     |

---

## Project Structure

```
.
├── vite.config.ts          # Vite + Nitro + React + Tailwind plugins
├── nitro.config.ts         # ISR routeRules for "/"
├── src/                    # Frontend (React)
│   ├── entry-client.tsx    # hydrateRoot — reads window.__INITIAL_DATA__
│   ├── entry-server.tsx    # Nitro SSR entry — fetches + renders + embeds data
│   ├── components/         # Header, Hero, NewsGrid, Card, Trending, AuthModal, ChatWidget, …
│   ├── context/            # AuthContext
│   ├── hooks/              # useTheme
│   ├── lib/                # api.ts, passwordStrength.ts
│   └── App.tsx
├── backend/                # Backend (Express)
│   ├── src/
│   │   ├── routes/         # articles, auth, chat, mcp, newsletter
│   │   ├── services/       # scraper (RSS + Gemini)
│   │   ├── middleware/     # auth, csrf, rateLimit, errorHandler
│   │   ├── lib/            # prisma, redis, cache, cookies, embeddings,
│   │   │                   #   articleSearch, agent, mcpServer
│   │   ├── scripts/        # backfillEmbeddings, ai_agent, mcpTestClient, …
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

The scraper runs **daily** in production (see [Keeping the Scraper Running](#keeping-the-scraper-running)); locally, `backend/src/index.ts` still schedules it hourly via `node-cron` for convenience while developing (it no longer runs on startup, to avoid burning the Gemini quota on every restart). To populate the database immediately, trigger it manually with the admin-only `POST /api/scraper/run` endpoint, or backfill embeddings for existing rows with `npx ts-node --files src/scripts/backfillEmbeddings.ts`.

---

## Environment Variables

All backend secrets live in `backend/.env` (git-ignored). See [`backend/.env.example`](backend/.env.example).

| Variable                   | Required | Description                                                        |
| -------------------------- | :------: | ------------------------------------------------------------------ |
| `DATABASE_URL`             |    ✅    | PostgreSQL connection string (Neon).                               |
| `JWT_SECRET`               |    ✅    | ≥ 32 random chars for signing JWTs. Never use a placeholder.       |
| `GEMINI_API_KEY`           |    ✅    | Google Gemini key used by the scraper, embeddings, and chat agent. |
| `GEMINI_CHAT_MODEL`        |    ➖    | Chat-agent model override (default `gemini-3.5-flash`).            |
| `GOOGLE_CLIENT_ID`         |    ✅*   | Google OAuth Client ID; verifies Google ID tokens. *Required for Google login. |
| `UPSTASH_REDIS_REST_URL`   |    ➖    | Upstash Redis REST URL. If unset, cache/rate-limit/trending are disabled. |
| `UPSTASH_REDIS_REST_TOKEN` |    ➖    | Upstash Redis REST token.                                          |
| `JWT_EXPIRES_IN`           |    ➖    | Token lifetime (default `1d`).                                     |
| `PORT`                     |    ➖    | Backend port (default `3001`). Do not set on Vercel.               |
| `FRONTEND_URL`             |    ➖    | Allowed CORS origin (default `http://localhost:5177`). Injected automatically on Vercel. |
| `NODE_ENV`                 |    ➖    | Set to `production` in prod to enable HSTS + secure cookies.       |
| `CRON_SECRET`               |    ✅*   | Authorizes `GET /api/cron/scraper` (the daily scraper trigger). *Required in production — see [Keeping the scraper running](#keeping-the-scraper-running). |

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

## Rendering: SSR + ISR

The homepage is server-rendered via [Nitro](https://nitro.build)'s Vite plugin, not a plain client-side SPA.

**How it works:**

1. `src/entry-server.tsx` receives the request, reads `filter`/`q` from the URL, and fetches articles + category counts + ticker headlines from the backend **in parallel**.
2. It renders the full HTML document (`renderToReadableStream`) and embeds the fetched data as `window.__INITIAL_DATA__` inline in the response.
3. `src/entry-client.tsx` reads that same payload and passes it to `<App>` on `hydrateRoot`, so the client renders identically to the server — no refetch, no loading flash, no hydration mismatch.
4. `nitro.config.ts` additionally marks `/` as an **ISR** route (`expiration: 1800`, i.e. 30 min): Vercel caches the rendered HTML and serves it directly from its CDN, only re-invoking the function in the background once the cache expires. Most visits never touch the render function at all.

**`allowQuery: ['filter', 'q']`** — both listed deliberately. A query param **not** in `allowQuery` isn't "always fresh": Vercel ignores it for the cache key entirely, meaning `/?q=OpenAI` could silently serve the cached `/` HTML for a *different* search. Listing both gives every filter+search combination its own correct, independently-cached entry.

**Deployment Protection gotcha:** the server-side fetch inside `entry-server.tsx` calls the backend API using **the incoming request's own origin** (`new URL(req.url).origin`), not `process.env.VERCEL_URL`. `VERCEL_URL` points at the per-deployment hostname (e.g. `ai-pulse-<hash>-<team>.vercel.app`), and Vercel's Standard Deployment Protection returns a `302` redirect for anonymous requests to that hostname — including the app's own server-side fetch, which silently failed and rendered with an empty article list. Using the request's own origin sidesteps this entirely, since that's the domain that already successfully reached the function.

---

## Deployment

Deployed on **Vercel** as a **single project with two services** (Vercel "Services"), so the frontend (`/`) and the backend (`/api`) share one origin — which lets the httpOnly auth cookies work without cross-site issues, and lets the SSR fetch above resolve the backend at the same origin it was called from. The configuration lives in [`vercel.json`](vercel.json) via `experimentalServices`.

Key points:

- The backend's request-serving (`backend/src/index.ts` → `app.listen`) runs as a web service under `experimentalServices`. Its in-process `node-cron` scraper schedule (loaded via dynamic `import()` since node-cron v4 is ESM-only) is **not** a reliable production trigger — see below.
- Vercel **strips** the `/api` route prefix, so backend routes are mounted at root in production (handled automatically via the `VERCEL` env var).
- Set the same environment variables from the table above in the Vercel dashboard — except `PORT` and `FRONTEND_URL`, which Vercel manages for you.
- For Google login, add your deployment URL to the OAuth client's **Authorized JavaScript origins**.
- If the ISR cache ever needs to be force-refreshed sooner than its 30-minute expiration (e.g. right after fixing a bug), the reliable option today is purging via the Vercel dashboard (Storage / Data Cache) — on-demand revalidation via `x-prerender-revalidate` isn't wired up yet.

---

## Keeping the Scraper Running

`backend/src/index.ts` registers a `node-cron` schedule inside `app.listen()`'s callback — this **only fires while that process stays alive continuously**. It works fine in local dev (`npm run dev` never exits), but on Vercel the service instance gets recycled well before that, silently dropping the in-memory timer with nothing to reschedule it. (Confirmed: production went 5+ weeks with zero new articles before this was caught.)

Two things exist specifically to work around this:

- **`GET /api/cron/scraper`** (`backend/src/app.ts`) — a standalone HTTP endpoint that runs the scraper on demand, authorized by a `Bearer <CRON_SECRET>` header (skips the auth check entirely if `CRON_SECRET` is unset — set it in production). It `await`s the run to completion before responding — an earlier fire-and-forget version reported success while Vercel silently killed the actual work the instant the response was sent.
- **[`.github/workflows/scraper-cron.yml`](.github/workflows/scraper-cron.yml)** — a GitHub Actions workflow, currently on a **daily** `schedule` (plus a manual `workflow_dispatch` trigger) that calls the endpoint above. GitHub Actions was originally adopted to route around Vercel Hobby's once-daily Cron Jobs cap when the scraper ran hourly; now that it's daily, [Vercel's own Cron Jobs](https://vercel.com/docs/cron-jobs) would work too — GitHub Actions was kept anyway for continuity.

**Reliability, in case the RSS/Gemini backlog is ever large** (e.g. after another gap in coverage): `backend/src/services/scraper.ts` caps processing to `MAX_NEW_PER_RUN` (20) genuinely-new articles and an overall `RUN_BUDGET_MS` (240s) wall-clock budget per run, and every network call (RSS fetch, Gemini, Postgres) has an explicit timeout — a stalled call fails fast into the existing per-item error handling instead of silently burning the whole run. A backlog larger than one run's cap/budget drains over several subsequent runs instead of repeatedly timing out (confirmed in production: this is exactly what happened before these limits existed — every run failed with a `504 FUNCTION_INVOCATION_TIMEOUT` at Vercel's exact 300s ceiling, regardless of how little work was actually left to do).

**To enable this on a fork/new deployment:**

1. Generate a secret: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
2. Set it as `CRON_SECRET` in the Vercel project's environment variables.
3. Set the **same** value as a GitHub repo secret named `CRON_SECRET` (Settings → Secrets and variables → Actions → New repository secret).
4. The workflow starts running automatically once merged to the default branch — trigger it manually via the Actions tab (`Run workflow`) to verify without waiting for the next scheduled run.

---

## AI Chat & MCP Server

AI Pulse ships two ways to query the news with an LLM, both built on the same
pgvector semantic search (`backend/src/lib/articleSearch.ts`).

### 1. Built-in chat assistant

A hand-built **agent loop** (`backend/src/lib/agent.ts`) using Gemini 3.5 Flash
with tool use:

1. The model receives the question and may call the `search_articles` tool.
2. The backend embeds the query, runs a pgvector cosine search, and feeds the
   matching articles back to the model.
3. The model answers with citations. The loop repeats until it stops requesting
   tools.

Exposed at **`POST /api/chat`** (`{ "question": "..." }` → `{ "answer": "..." }`),
rate-limited to 5 req/min/IP. When the model is overloaded it returns `503` with
a friendly "model is busy" message. The frontend `ChatWidget` renders this as a
floating chat. Try it from the CLI:

```bash
cd backend
npx ts-node --files src/scripts/ai_agent.ts "What has OpenAI been doing recently?"
```

### 2. MCP server

The news database is exposed over the **Model Context Protocol** (Streamable
HTTP, stateless) at **`POST /api/mcp`**, built with `@modelcontextprotocol/sdk`.
MCP is an **open, model-agnostic protocol** — any MCP-capable agent can connect
with **its own model** (Claude, OpenAI/GPT, Cursor, etc.). Your server only runs
the queries and returns data (no text-generation cost on your side beyond the
`search_articles` query embedding).

Four tools are available:

| Tool | Input | Embedding cost | Description |
| ---- | ----- | :------------: | ----------- |
| `search_articles` | `query` | yes | Semantic search by topic or question (embeds the query → pgvector). |
| `get_trending`    | `limit?` | no | Most up-voted / currently trending articles. |
| `list_recent`     | `category?`, `limit?` | no | Latest articles, optionally filtered by category. |
| `get_related`     | `url`, `limit?` | no | More articles like a given one, using its **stored** embedding. |

All four are verified end-to-end against production by `mcpTestClient.ts` (a real
MCP client).

**Connecting from any environment** (Claude Code, Claude Desktop, Claude.ai,
Cursor, VS Code, Cline, OpenAI Responses API / Agents SDK): see the
self-contained guide in **[MCP-INSTALL.md](MCP-INSTALL.md)** — you can also hand
that file straight to an AI agent and it will configure the connection itself.
The universal endpoint is `https://ai-pulse-newsletter.vercel.app/api/mcp`.

Verify any deployment end-to-end with the included test client:

```bash
cd backend
MCP_URL=https://ai-pulse-newsletter.vercel.app/api/mcp \
  npx ts-node --files src/scripts/mcpTestClient.ts "EU AI regulation"
```

> **Note:** `backend/tsconfig.json` uses `module`/`moduleResolution: node16` so
> the MCP SDK's `exports` map resolves to its CommonJS build.
>
> ⚠️ The `/api/mcp` endpoint is currently **public** — anyone with the URL
> consumes your Gemini embedding quota. Add auth (API key or OAuth) and tighten
> the rate limit before promoting it widely.

---

## Security Notes

- `backend/.env` is git-ignored — **secrets are never committed**.
- JWTs are sent only as httpOnly cookies, never in the response body or `localStorage`.
- All mutating authenticated routes require CSRF (double-submit token).
- Rate limiting, Helmet headers (CSP, `X-Frame-Options: DENY`, nosniff, HSTS), and request-body size caps are enabled.

---

## License

MIT
