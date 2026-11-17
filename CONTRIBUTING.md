# Contributing

Thanks for helping. The facts on the map are the product, so most contributions are content: a missing concept,
a relation that is wrong, a clearer summary. Code contributions follow the same flow.

## The flow

1. **Open or pick an issue.** Use the _Ticket_ template. Small fixes to wording can skip this step.
2. **Branch** as `type/BRAIN-n-short-slug`, for example `feat/BRAIN-14-renderer` or `fix/BRAIN-40-cors-summary`.
3. **Commit** with [Conventional Commits](https://www.conventionalcommits.org/). The scope is the package:
   `feat(engine): ring placement on unfold`, `fix(content): correct microtask ordering`. A hook rejects anything else.
4. **Open a PR** titled `BRAIN-n: what it does`. Fill in the template and link the issue.
5. **CI must be green** and another person must review. Nobody merges their own PR.

By contributing you agree that code is licensed under [MIT](LICENSE) and content in `packages/content/data`
under [CC BY 4.0](packages/content/data/LICENSE), the same terms as the rest of the project.

## Adding or fixing a concept

Content lives in `packages/content/data`:

- `domains.yaml` lists the eight layers (browser, JavaScript, network and so on).
- `nodes/<domain>.yaml` holds the concepts of one layer.
- `edges.yaml` holds the relations, written as `[from, to, relation]`.

A concept looks like this:

```yaml
- id: microtask_queue # snake_case, never renamed once published
  label: Microtask queue
  summary: >-
    Promise reactions, queueMicrotask, MutationObserver. Drained completely after every task,
    before rendering. Can starve the frame.
  sources:
    - title: HTML Standard, event loop processing model
      url: https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model
  verified: 2026-11-16
```

Rules, enforced by `pnpm --filter @brain/content build`:

- Every concept has a summary of one short paragraph and at least one source. Prefer the spec, MDN, web.dev or the engine's own blog.
- A relation is a verb phrase read from `from` to `to`, at most 40 characters: `drains`, `is blocked by`.
- No duplicate ids, no self-loops, no edges to unknown ids, and no concept left unconnected.
- Set `verified` to the date you last checked the facts against the source.

## Code rules

- **State.** Per-frame and engine state goes in the Zustand store. Domain state such as progress, settings and bookmarks goes in Redux. See [ADR-0006](docs/adr/0006-state-split-redux-zustand.md).
- **React stays out of the frame loop.** The canvas renderer reads the store directly; components never re-render per frame.
- **Tests.** Logic gets a Vitest test next to it. New user-visible behaviour gets a Playwright step.
- **Accessibility.** Everything works with a keyboard and in both themes. The map always has a DOM twin: the concept pages and the cheatsheet.
- **Decisions.** If your change constrains future work, add an ADR from `docs/templates/adr.md`.

## Running the checks

```sh
pnpm check     # typecheck, lint, unit tests
pnpm build     # includes the content validator
```
