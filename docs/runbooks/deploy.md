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

## Monitoring (BRAIN-6)

**Speed Insights and Web Analytics.** In the Vercel project, open _Speed Insights_ and _Analytics_ and press Enable on
each. The components are already in the root layout and do nothing until these are on. Neither sets cookies.

**Sentry**, optional but recommended:

1. Create a Sentry project of type _Next.js_ and copy its DSN.
2. In Vercel, under _Settings → Environment Variables_, add these for Production and Preview:

   | Variable                 | Value                                                          |
   | ------------------------ | -------------------------------------------------------------- |
   | `NEXT_PUBLIC_SENTRY_DSN` | the DSN                                                        |
   | `SENTRY_AUTH_TOKEN`      | an org auth token with `project:releases` and `org:read` scope |
   | `SENTRY_ORG`             | org slug                                                       |
   | `SENTRY_PROJECT`         | project slug                                                   |

3. Under _Settings → Environment Variables_, make sure _Automatically expose System Environment Variables_ is on.
   The release tag is `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`.
4. Redeploy a preview, open `/debug/sentry` and press the button. The error should appear in Sentry within a minute,
   tagged with the commit SHA and environment `preview`. The page returns 404 in production.

With no DSN set, the Sentry SDK is never downloaded: it sits in a lazily loaded chunk behind the DSN check.
