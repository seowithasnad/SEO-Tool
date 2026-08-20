# SEO Platform — Modules 1–7

**Module 1 — Foundation:** project setup, auth, database schema, DataForSEO
integration layer.
**Module 2 — Dashboard shell + Keyword Research:** auth-gated dashboard layout,
sidebar nav for every module in the spec, login page, and a working Keyword
Research page wired end-to-end to DataForSEO.

## What's included

- Next.js 15 + TypeScript + Tailwind project scaffold
- Prisma schema covering every module in the spec (users/roles, projects, keyword
  research, rank tracking, SERP analysis, competitors, site audits, content items,
  reports, per-user API key storage)
- NextAuth credentials-based auth with role-based sessions (Admin / Manager / Client),
  a login page, and middleware protecting every dashboard route
- A production-shaped DataForSEO client: Basic-auth header, request queueing
  (`p-queue`) to respect rate limits, retry-with-backoff on 429/5xx, and per-endpoint
  in-memory caching (swap for Redis when you scale past one instance)
- Dashboard shell: sidebar with every module from the spec (Research / Optimize /
  Account groups), topbar with session + sign-out, full-width dark layout with a
  purple (`brand-500`, `#7c3aed`) accent
- **Keyword Research page**, fully wired: form (keyword, country, device) →
  `/api/keyword-research` → DataForSEO (search volume, related keywords, keyword
  suggestions) → persisted to Postgres → rendered as metric cards, a trend chart
  (Recharts), a related-keywords table, and a suggestions cloud, with CSV export
- **SERP Analysis page**, fully wired: form → `/api/serp-analysis` → DataForSEO
  `serp/google/organic/live/advanced` → top-20 results, AI Overview / featured
  snippet detection, People Also Ask extraction → passed to Claude
  (`src/lib/ai/analyze-serp.ts`) for search intent, content structure, common
  headings, entities, semantic keywords, content gaps, missing FAQs/sections, EEAT
  opportunities, internal linking ideas, suggested tables/diagrams, schema types,
  and five scores (Content, SEO, AI Search, Google AI Mode, LLM) — persisted to
  Postgres and rendered as score cards + gap-analysis panels. If the AI step fails
  (e.g. no Claude key set), the SERP data still saves and displays, with a warning
  instead of a hard failure.
- AI provider client resolver (`src/lib/ai/client.ts`) — Claude, OpenAI, and Gemini
  clients that prefer the signed-in user's own key from Settings and fall back to
  the server's env vars, ready for the Content Optimizer module to reuse for
  multi-provider LLM-visibility scoring.
- **Rank Tracker**: add/remove tracked keywords per project
  (`/api/rank-tracker/keywords`), a daily snapshot job
  (`/api/rank-tracker/snapshot`) wired up via `vercel.json` Cron, and a UI showing
  current position, visibility, and a per-keyword position trend line. The snapshot
  job runs across every active tracked keyword for every user, resolves each
  project owner's own DataForSEO credentials, fetches up to rank 100, and matches
  the project's domain against the organic results to record position + a simple
  visibility score.

### Cron job notes

- `/api/rank-tracker/snapshot` is protected by `CRON_SECRET` — Vercel Cron sends it
  automatically as `Authorization: Bearer <CRON_SECRET>` when triggered from
  `vercel.json`; for local testing, call it manually with that header.
- Position matching is a simple domain-substring match against `project.domain`.
  For sites with multiple ranking subdomains/paths you care about distinguishing,
  tighten the match in `src/app/api/rank-tracker/snapshot/route.ts`.
- **Competitor Analysis + Content Gap**: enter a competitor domain and get domain
  rank overview (est. organic traffic), top pages by traffic, top ranking
  keywords, backlinks summary (referring domains), and a content-gap table from
  DataForSEO's domain intersection endpoint (your project's domain vs. the
  competitor's, so you can see where they outrank you or rank for keywords you
  don't). Results persist per project so you can revisit past competitor runs.
- **Site Audit**: `/api/site-audit/start` queues a DataForSEO on-page crawl
  (`on_page/task_post`) since crawls are async on DataForSEO's side; the UI polls
  `/api/site-audit/status` every 8 seconds until `crawl_progress` reports
  `finished`, then fetches the per-page results (`on_page/pages`) and buckets them
  into broken links (4xx/5xx), missing/duplicate meta, heading structure issues,
  and images missing alt text, plus a summary card row. Past audits are listed and
  clickable to revisit.

### Site Audit notes

- `SiteAudit.dataForSeoTaskId` stores the DataForSEO crawl task id for polling —
  run `npm run db:migrate` after pulling this module since it's a schema change.
- The issue buckets read from DataForSEO's per-page `checks` object
  (`is_broken`, `no_title`, `no_description`, `duplicate_title_tag`,
  `no_h1_tag`, `no_image_alt`, etc.) — extend
  `src/app/api/site-audit/status/route.ts` to add more of DataForSEO's ~50
  available checks (canonical, robots, sitemap, schema, Open Graph, Twitter
  Cards, page speed) the same way as new UI sections are needed.
- **Content Optimizer + AI Content Generator ("AI SEO Copilot")**: two tabs on one
  page. "AI Content Generator" takes a keyword, pulls in the latest SERP Analysis
  for that exact keyword if one exists (so the brief builds on real content gaps
  instead of starting cold), and generates a full brief via Claude — meta
  title/description/slug, H1/H2/H3 outline, FAQs, featured snippet answer, schema
  types, internal/external link ideas, image alt/filename/caption suggestions,
  semantic keywords, entities, LSI keywords, EEAT recommendations, and per-engine
  optimization notes (Google AI Overview, ChatGPT, Claude, Gemini, Perplexity,
  Copilot), plus SEO/EEAT/AI-visibility scores and CSV export. "Content Optimizer"
  takes a pasted draft + target keyword and scores it: keyword density, semantic
  and entity coverage gaps, missing questions, intent match, readability, EEAT,
  and per-LLM visibility scores, with prioritized recommendations.

## Install

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL, NEXTAUTH_SECRET, and your DataForSEO/AI provider keys
npm run db:push      # or db:migrate for a tracked migration
npm run db:seed      # creates admin@example.com / ChangeMe123!
npm run dev
```

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import into Vercel.
3. Add a managed Postgres instance (Vercel Postgres, Neon, or Supabase all work) and
   set `DATABASE_URL`.
4. Add `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`) and `NEXTAUTH_URL`
   (your production URL).
5. Add your DataForSEO and AI provider keys as environment variables, or leave them
   blank and have each user store their own under Settings — `ApiSettings` is already
   modeled per-user in the schema.
6. Deploy. Run `npx prisma migrate deploy` as a post-install/build step (or via Vercel's
   build command) so the schema is applied on first deploy.

## DataForSEO notes

- Every call goes through `DataForSeoClient` in `src/lib/dataforseo/client.ts` — don't
  call the DataForSEO REST API directly from route handlers, so rate limiting/retry/
  caching stay centralized.
- `concurrency` and `intervalCap` on the queue are set conservatively; raise them to
  match your DataForSEO plan's actual rate limit.
- On-Page/Site Audit endpoints are async on DataForSEO's side (`task_post` → poll
  `summary`/`pages`) — the client exposes both halves; the audit queue/polling worker
  will be built in the Site Audit module.

## Next modules (in order)

1. ~~Dashboard shell + sidebar navigation + auth-gated layout~~ ✅
2. ~~Keyword Research page (DataForSEO Labs + Google Ads volume)~~ ✅
3. ~~SERP Analyzer + AI SERP Analysis (intent, gaps, scores via OpenAI/Claude/Gemini)~~ ✅
4. ~~Rank Tracker (daily cron snapshot job)~~ ✅
5. ~~Competitor Analysis + Content Gap~~ ✅
6. ~~Site Audit (crawl queue + polling)~~ ✅
7. ~~Content Optimizer + AI Content Generator ("AI SEO Copilot")~~ ✅
8. Reports (PDF/Excel/CSV/PPTX export, white-label)

## Trying it out

After `npm run dev`, sign in at `/login` with the seeded admin
(`admin@example.com` / `ChangeMe123!`), then go to Settings (not yet built —
add credentials directly via `prisma studio` for now) to set your DataForSEO
login/password on the seeded `ApiSettings` row, then run a query from
Keyword Research.
