# Runbook: deploy and hosting

Brain is a static Next.js app hosted on **Vercel** (ADR-0002, PLAN.md §4c). There is no server, database or secret
needed to build it.

## Environments

| Environment | Trigger                   | URL                                                  |
| ----------- | ------------------------- | ---------------------------------------------------- |
| Production  | push / merge to `main`    | `https://<project>.vercel.app` (custom domain later) |
| Preview     | every push to a PR branch | unique URL, posted on the PR by the Vercel bot       |
| Local       | `pnpm dev`                | http://localhost:3000                                |

## How a deploy works

1. Vercel clones the repo; the project's **Root Directory** is `apps/web`, so it reads `apps/web/vercel.json`.
2. `ignoreCommand` runs `turbo-ignore @brain/web`. If neither the app nor any workspace package it depends on
   changed since the last deployed commit, the build is skipped (docs-only PRs do not deploy).
3. `pnpm install --frozen-lockfile` at the repo root, then `turbo run build --filter=@brain/web`.
4. `lib/site.ts` picks the canonical URL from `VERCEL_ENV`, `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL`.
   These are declared in `turbo.json` so Turborepo includes them in the build hash and passes them through.

## One-time setup (owner, ~5 minutes)

1. `vercel login` (or sign in at vercel.com with GitHub).
2. vercel.com → **Add New… → Project** → import `aadarshjr123/brain`. Grant the Vercel GitHub app access to the repo.
3. **Root Directory:** `apps/web`. Framework: Next.js (detected). Leave build and install commands empty; `vercel.json` sets them.
4. Node.js version: 24.x (Project → Settings → Build and Deployment).
5. Deploy. Then Project → Settings → Git: production branch `main`; leave "Pull Request Comments" on.
6. Locally: `cd apps/web && vercel link` so `vercel env pull` and `vercel logs` work.

## Verify

- Open a PR: the Vercel bot comments a preview URL within a few minutes.
- Merge to `main`: production updates; Deployments tab shows it as Production.
- Docs-only PR: deployment shows **Ignored Build Step** (expected).

## Roll back

Vercel → Deployments → pick the last good production deployment → **Promote to Production**. Instant, no rebuild.
Then revert the bad commit on `main` through a PR.

## Troubleshooting

| Symptom                       | Cause                                                    | Fix                                                                    |
| ----------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ERR_PNPM_OUTDATED_LOCKFILE`  | lockfile not committed after a dependency change         | run `pnpm install`, commit `pnpm-lock.yaml`                            |
| Build skipped unexpectedly    | `turbo-ignore` saw no change in `@brain/web` or its deps | push a change in the app, or redeploy without cache from the dashboard |
| Wrong URLs in Open Graph tags | `NEXT_PUBLIC_SITE_URL` set to a stale value              | clear it in Project → Settings → Environment Variables                 |
