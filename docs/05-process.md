# How we work

Two engineers, same team, same standards as a product team at a large company. Everything is logged twice:
**locally** in this repo (docs, ADRs, journal, commits) and **remotely** on GitHub (issues, project board, PRs, discussions, releases).
If it is not written down in both, it did not happen.

## Roles

- Aadarsh: product owner and engineer. Final call on scope and priorities.
- Claude: engineer. Proposes, builds, reviews, documents. Flags risks early, in writing.

## Cadence

- **Planning** at each milestone start: pick tickets, write acceptance criteria, estimate, move to Ready.
- **Daily note** (async, in `journal/YYYY-MM-DD.md`): what moved, what blocked, what we learned. Two lines is fine.
- **Review** on every PR. Nobody merges their own PR without a review comment from the other.
- **Retro** at milestone close using `templates/retro.md`; outcomes become tickets or ADRs.
- **Postmortem** for any production incident or any bug that cost more than a day, using `templates/postmortem.md`. Blameless.

## Ticket lifecycle

Backlog → Ready (AC written, estimated) → In progress (branch open) → In review (PR open) → Done (merged, deployed to preview, AC verified).
A ticket without acceptance criteria cannot leave Backlog. A ticket over 2 days gets split.

## Branches, commits, PRs

- Branch: `type/BRAIN-n-short-slug` (e.g. `feat/BRAIN-14-renderer`).
- Commits: Conventional Commits, scope is the package (`feat(engine): ring placement on unfold`). Reference the ticket in the body.
- PR title: `BRAIN-n: what it does`. Body uses `.github/PULL_REQUEST_TEMPLATE.md`. Link the issue; it auto-closes on merge.
- Small PRs. If a PR touches more than ~400 lines of non-generated code, explain why or split.

## Code review checklist

1. Does it do what the ticket's AC says, and nothing more?
2. Is the state in the right store (ADR-0006)?
3. Does React stay out of the frame loop?
4. Tests for logic; a Playwright step for new user-visible behaviour.
5. Performance budget respected (bundle check in CI output).
6. Accessibility: keyboard, labels, contrast in both themes.
7. Docs updated: ADR if a decision changed, journal if we learned something.

## Definition of Done

CI green · reviewed · deployed to preview · AC verified on the preview · docs updated · ticket closed with a comment linking the PR.

## Decisions

Anything that constrains future work gets an ADR (`templates/adr.md`). Anything we are unsure about and want to discuss gets an RFC first (`templates/rfc.md`) as a GitHub Discussion, then an ADR.

## Logging: local and remote mirror

| Thing                  | Local                         | Remote                                                                                                                     |
| ---------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Plan                   | `docs/04-backlog.md`          | [Issues](https://github.com/aadarshjr123/brain/issues) + [Project board](https://github.com/users/aadarshjr123/projects/3) |
| Decisions              | `docs/adr/`                   | Linked from the issue and PR; summary in Discussions                                                                       |
| Daily progress         | `docs/journal/`               | PR descriptions and issue comments                                                                                         |
| Problems and learnings | `docs/journal/`, postmortems  | Issue labelled `learning` or `incident`                                                                                    |
| Releases               | `CHANGELOG.md` via Changesets | GitHub Releases                                                                                                            |
| Retros                 | `docs/journal/retro-Mn.md`    | Discussion thread per milestone                                                                                            |

## Labels

`type:feat` `type:chore` `type:docs` `type:bug` `type:spike` · `P0` `P1` `P2` · `M0`…`M6` · `area:engine` `area:content` `area:web` `area:infra` · `learning` `incident` `good first issue`
