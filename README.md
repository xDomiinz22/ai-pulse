# AI Pulse

> An AI news aggregator that scrapes RSS feeds, filters and summarizes articles with Google Gemini, and serves them through a fast, animated React frontend.

**Live demo → [ai-pulse-newsletter.vercel.app](https://ai-pulse-newsletter.vercel.app)**

AI Pulse pulls the latest articles from AI-focused sources, uses Gemini to keep only genuinely AI-related news (categorizing each one and generating a short summary + read time), and presents them with search, category filters, voting, and a live trending ranking. It also embeds every article into a pgvector index, powering a built-in **AI chat assistant** that answers questions over the news with citations — and exposes that same semantic search as an **MCP server** any Claude client can connect to. Authentication supports both email/password and "Sign in with Google".

---

## Features

- 📰 **Automated news scraping** — RSS feeds parsed hourly, filtered & categorized by Gemini 2.5 Flash (model / research / industry / ethics) with AI-generated summaries and read times. Oldest articles are pruned past a 500-article cap to stay within free-tier storage.
- 🧠 **Semantic search (pgvector)** — every article is embedded (768-dim, `gemini-embedding-001`) and stored in a Postgres `vector` column, enabling cosine-similarity retrieval over the news.
- 💬 **AI chat assistant** — a from-scratch agent loop (Gemini 3.5 Flash + tool use) that calls semantic search and answers questions over the database with citations. Streaming-style typing indicator and graceful "model busy" handling.
- 🔌 **MCP server** — the same `search_articles` retrieval is exposed over the Model Context Protocol (Streamable HTTP), so any MCP client (Claude Desktop, Claude.ai connectors, Claude Code) can query the news with its own model.
- 🔐 **Authentication** — email/password **and** Google Sign-In, with sessions delivered as httpOnly cookies (JWT never exposed to JS) + CSRF double-submit protection and a password-strength meter.
- 👍 **Voting & Trending** — upvote/downvote (**logged-in users only**) with per-IP anti-spam; a live trending ranking backed by a Redis sorted set that updates instantly on vote.
- 🔎 **Search & filters** — fuzzy client-side search (Fuse.js) and per-category filtering with real article counts.
- 🎨 **Polished UI** — Tailwind CSS v4, GSAP animations, dark/light theme.
- 🛡️ **Hardened backend** — Helmet security headers, sliding-window rate limiting (Upstash), input caps, and graceful degradation when Redis is unavailable.

---

## Tech Stack

| Layer        | Technologies                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS v4, GSAP, Fuse.js, date-fns         |
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
├── index.html              # Vite entry
├── src/                    # Frontend (React)
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

The scraper runs **hourly** via `node-cron` (it no longer runs on startup, to avoid burning the Gemini quota on every restart). To populate the database immediately, trigger it manually with the admin-only `POST /api/scraper/run` endpoint, or backfill embeddings for existing rows with `npx ts-node --files src/scripts/backfillEmbeddings.ts`.

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

- The backend runs as an always-on web service (`backend/src/index.ts` → `app.listen` + hourly `node-cron` scraper, loaded via dynamic `import()` since node-cron v4 is ESM-only).
- Vercel **strips** the `/api` route prefix, so backend routes are mounted at root in production (handled automatically via the `VERCEL` env var).
- Set the same environment variables from the table above in the Vercel dashboard — except `PORT` and `FRONTEND_URL`, which Vercel manages for you.
- For Google login, add your deployment URL to the OAuth client's **Authorized JavaScript origins**.

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

The same `search_articles` retrieval is exposed over the **Model Context
Protocol** (Streamable HTTP, stateless) at **`POST /api/mcp`**, built with
`@modelcontextprotocol/sdk`. MCP is an **open, model-agnostic protocol** — any
MCP-capable agent can connect with **its own model** (Claude, OpenAI/GPT,
Cursor, etc.). Your server only runs the search and returns data (no
text-generation cost on your side beyond the query embedding).

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
