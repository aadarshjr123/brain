#!/usr/bin/env bash
# Mirrors the local engineering docs to GitHub: repo, labels, milestones, M0+M1 issues.
# Idempotent where gh allows it. Run from the repo root:  bash scripts/github-bootstrap.sh [public|private]
set -euo pipefail
VIS="${1:-public}"
OWNER="$(gh api user -q .login)"
REPO="brain"

if ! gh repo view "$OWNER/$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" "--$VIS" --source=. --remote=origin --push \
    --description "A public study map of how frontend development touches the browser. No login. Also a cheatsheet."
else
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$OWNER/$REPO.git"
  git push -u origin main
fi

# labels
while IFS='|' read -r name color desc; do
  gh label create "$name" --color "$color" --description "$desc" --force >/dev/null
done <<'L'
type:feat|1d76db|New capability
type:chore|c5def5|Tooling, infra, housekeeping
type:docs|0075ca|Documentation
type:bug|d73a4a|Something is wrong
type:spike|fbca04|Time-boxed investigation
P0|b60205|Blocks the milestone
P1|e99695|Should ship in the milestone
P2|f9d0c4|Nice to have
area:engine|5319e7|packages/graph-engine
area:content|0e8a16|packages/content
area:web|006b75|apps/web
area:infra|bfd4f2|CI, hosting, tooling
learning|7057ff|A problem we hit and what we learned
incident|000000|Production incident / postmortem
good first issue|7057ff|Small, well-scoped, documented
L

# milestones
for m in "M0 Foundation|Repo, CI, deploy pipeline, docs, empty app live" \
         "M1 Engine + content|Graph engine with tests; content ported and validated" \
         "M2 Explore|The v3 mockup rebuilt as the real app" \
         "M3 Route + reference|Route mode, concept pages, cheatsheet, offline" \
         "M4 Launch|A11y audit, perf budgets, content drive, public launch" \
         "M5 Learn|Quiz, spaced repetition, mastery on map" \
         "M6 Scale|Weighted routes, paged unfold, worker layout, optional 3D"; do
  title="${m%%|*}"; desc="${m#*|}"
  gh api "repos/$OWNER/$REPO/milestones" -f title="$title" -f description="$desc" >/dev/null 2>&1 || true
done

# issues: BRAIN-n|type|prio|area|milestone|title|acceptance
issue(){ # id type prio area milestone title body
  local t="BRAIN-$1: $6"
  if gh issue list --search "\"$t\" in:title" --json title -q '.[].title' | grep -qxF "$t"; then echo "exists: $t"; return; fi
  gh issue create --title "$t" --label "type:$2" --label "$3" --label "area:$4" --milestone "$5" --body "$7" >/dev/null && echo "created: $t"
}
B='Mirrored from docs/04-backlog.md. Local source of truth for the plan; this issue is the live status.'
issue 1 chore P0 infra "M0 Foundation" "Initialise monorepo" "$B

## Acceptance criteria
- [ ] pnpm workspace with apps/web, packages/{content,graph-engine,config}
- [ ] Turborepo pipelines: build, dev, lint, test, typecheck
- [ ] \`pnpm -r typecheck\` passes on empty packages"
issue 2 chore P0 web "M0 Foundation" "Scaffold Next.js app" "$B

## Acceptance criteria
- [ ] Next 16 App Router, React 19, TS strict + noUncheckedIndexedAccess
- [ ] Tailwind v4 + shadcn init; React Compiler enabled
- [ ] / renders a placeholder"
issue 3 chore P0 infra "M0 Foundation" "Lint, format, hooks" "$B

## Acceptance criteria
- [ ] ESLint 9 flat config (next, typescript-eslint, jsx-a11y) + Prettier
- [ ] Husky pre-commit with lint-staged
- [ ] commitlint rejects a non-conventional message"
issue 4 chore P0 infra "M0 Foundation" "CI workflow" "$B

## Acceptance criteria
- [ ] GitHub Actions on PR and main: install (cached), typecheck, lint, unit, build
- [ ] Required check for merge
- [ ] Runs under 5 minutes"
issue 5 chore P0 infra "M0 Foundation" "Vercel project + previews" "$B

## Acceptance criteria
- [ ] Production on main, preview per PR with URL on the PR
- [ ] .env.example committed"
issue 6 chore P1 infra "M0 Foundation" "Sentry + Speed Insights" "$B

## Acceptance criteria
- [ ] Intentional error on a preview appears in Sentry with release tag
- [ ] Speed Insights shows data"
issue 7 docs P0 infra "M0 Foundation" "Engineering docs v1" "$B

## Acceptance criteria
- [x] PRD, system design, roadmap, backlog, process, ADR-0001..0007, templates committed
- [ ] GitHub issues for M0 and M1; project board with Backlog / Ready / In progress / In review / Done"
issue 8 docs P1 infra "M0 Foundation" "README + CONTRIBUTING + templates" "$B

## Acceptance criteria
- [ ] README explains the product in one screen and links docs
- [ ] CONTRIBUTING covers content PRs and the state rule (ADR-0006)
- [x] Issue and PR templates in .github/"
issue 9 feat P0 content "M1 Engine + content" "Content schemas" "$B

## Acceptance criteria
- [ ] Zod schemas for Domain, Node, Edge; Velite emits typed JSON
- [ ] A schema violation fails pnpm build with a readable message"
issue 10 feat P0 content "M1 Engine + content" "Port mockup content" "$B

## Acceptance criteria
- [ ] All 144 nodes and 278 edges from mockup/brain-graph.html as YAML
- [ ] Every node has summary; verified: 2026-11-16"
issue 11 feat P0 content "M1 Engine + content" "Graph validator" "$B

## Acceptance criteria
- [ ] Fails on duplicate ids, unknown endpoints, self-loops, disconnected nodes
- [ ] Nodes without sources: warning in M1, error in M4
- [ ] Runs in CI; unit-tested with fixtures"
issue 12 feat P0 engine "M1 Engine + content" "buildGraph + shortestPath" "$B

## Acceptance criteria
- [ ] Adjacency with direction and relation; BFS path
- [ ] Tests: known pairs, unreachable pair, ≤7 hops for 95% of random pairs over real content"
issue 13 feat P0 engine "M1 Engine + content" "Simulation wrapper" "$B

## Acceptance criteria
- [ ] add(ids, aroundId) ring placement, remove, reheat, pin/unpin
- [ ] Forces match the mockup; deterministic with seeded RNG in tests"
issue 14 feat P0 engine "M1 Engine + content" "Renderer" "$B

## Acceptance criteria
- [ ] Canvas class: DPR, transform, dirty flag, demand-driven rAF, pauses when hidden
- [ ] draw() ported from mockup v3 (nodes, edges, labels, badges, focus dimming, halo)
- [ ] Reduced motion collapses tweens; tests count draw calls via canvas mock"
issue 15 feat P1 engine "M1 Engine + content" "Animation clocks" "$B

## Acceptance criteria
- [ ] Node pop-in with stagger, edge grow, route progressive draw and pulse as in mockup v3
- [ ] All timings in one constants file"
issue 16 spike P2 engine "M1 Engine + content" "Worker layout feasibility" "$B

## Acceptance criteria
- [ ] Prototype d3-force in a Web Worker posting Float32Array positions
- [ ] Journal note with frame timings at 500 and 1500 nodes; ADR if adopted"

echo "done. repo: https://github.com/$OWNER/$REPO"
