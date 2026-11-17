# Runbook: cut a release

Releases are tags on `main`. Nothing is released from a branch.

1. **Everything for the release is merged.** For v1.0.0 that is the M0 to M4 stack (#17 upwards), merged bottom-up.
2. **CI is green on `main`**, including `e2e`. The production deploy on Vercel has finished.
3. **Smoke test production** (two minutes): home loads; the map opens and a click unfolds; a route link draws;
   a concept page and the cheatsheet load; DevTools console is clean; Lighthouse on `/explore` meets the PRD budgets.
4. **Move the changelog entry** from "unreleased" to the date, in a `chore(repo): release vX.Y.Z` PR.
5. **Tag and publish** after that PR merges:

   ```sh
   git switch main && git pull
   git tag -a v1.0.0 -m "Brain 1.0.0"
   git push origin v1.0.0
   gh release create v1.0.0 --title "Brain 1.0" --notes-file docs/release-notes/v1.0.0.md
   ```

6. **Close the milestone** on GitHub and move its remaining issues, if any, with a comment saying where they went.

Rolling back a release is a Vercel rollback (see `deploy.md`), then a fix and a patch release. Never delete a tag.
