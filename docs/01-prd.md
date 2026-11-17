# PRD — Brain

|           |                                       |
| --------- | ------------------------------------- |
| Status    | Draft v1, 2026-11-16                  |
| Owners    | Aadarsh (product + eng), Claude (eng) |
| Reviewers | —                                     |

## 1. Problem

Frontend developers learn frameworks first and the browser second, if at all. The knowledge that explains _why_
something is slow, flickers, or breaks (event loop ordering, the render pipeline, CORS, hydration) is scattered
across blog posts and specs, and none of it shows how the pieces connect. When you forget it, relearning means
re-reading everything.

Interviews, performance work and debugging all reward the mental model, not the facts. There is no tool that
lets you _see_ the model and walk it.

## 2. Users

- **Primary: the returning learner.** A working frontend developer who knew this once and needs to rebuild the map before an interview, a performance task, or out of curiosity. Visits for 10 to 30 minutes, several times a year.
- **Secondary: the referencer.** Needs one answer fast ("does `transform` trigger layout?"). Visits for 1 minute.
- **Tertiary: the teacher.** Wants a link to send that explains a chain of cause and effect.

No accounts. Anyone with the link can use everything.

## 3. Goals

1. Make the connections visible: any concept shows what it touches and what touches it, with the relation named.
2. Explain cause and effect as a path: any two concepts produce the shortest chain between them, narrated hop by hop.
3. Be a fast reference: any concept reachable by search or URL in under two seconds, with a one-paragraph answer.
4. Be correct and reviewable: every fact lives in the repo, reviewed by PR, with sources.
5. Be fast enough to feel like a map, not a website: smooth on a mid-range laptop and a phone.

## 4. Non-goals (v1)

- Accounts, sync across devices, social features.
- Being a full course. Deep dives link out to specs and articles.
- Covering backend, mobile native, or design tooling.
- 3D rendering. Considered, parked (ADR-0003).

## 5. Success metrics

| Metric                           | Target                                                                       | How measured                                         |
| -------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| Time to first useful interaction | < 2 s on 4G, mid-range phone                                                 | Lighthouse on Vercel preview, Speed Insights in prod |
| INP on `/explore`                | < 200 ms p75                                                                 | Speed Insights                                       |
| Route success                    | ≥ 95% of random concept pairs produce a path ≤ 7 hops                        | Unit test over the content graph                     |
| Content coverage                 | ≥ 150 concepts, ≥ 300 relations, every node has a description and ≥ 1 source | Build-time validator                                 |
| Reference speed                  | Search to concept card in ≤ 2 keystrokes + Enter for top 50 concepts         | Playwright                                           |
| Return value                     | Owner relearns the browser model from the tool alone before a mock interview | Journal entry                                        |

## 6. Scope of v1

Explore map (unfold, focus, hover), Route mode, concept cards, search, layer filters, trail, light and dark theme,
static page per concept, cheatsheet list view, offline shell, local progress with export/import.

## 7. Risks

| Risk                                  | Impact                         | Mitigation                                                                                |
| ------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| Content accuracy                      | Wrong facts teach wrong models | Sources per node, PR review checklist, "last verified" date                               |
| Graph becomes cluttered as it grows   | Unusable map                   | Unfold in pages, layer filters, hub-only labels at low zoom, worker layout past 500 nodes |
| Canvas is invisible to screen readers | Excludes users                 | Every view has a DOM equivalent: cheatsheet and concept pages                             |
| Scope creep into a course platform    | Never ships                    | Non-goals above, milestone gates in the roadmap                                           |

## 8. Open questions

- Should relations carry weights in v1 so routes prefer mechanical links? (Leaning yes, cheap.)
- Should the cheatsheet be generated from the graph or hand-curated? (Generated, with optional hand-written summaries.)
