# ADR-0006: Split state: Zustand for the engine, Redux Toolkit for domain state

|          |                 |
| -------- | --------------- |
| Status   | Accepted        |
| Date     | 2026-11-16      |
| Deciders | Aadarsh, Claude |

## Context

The canvas needs state that changes many times per second (hover, drag, camera, animation clocks) and must be read outside React. The learning layer needs state that is serialisable, inspectable and replayable (progress, settings, bookmarks).

## Decision

Two stores with disjoint responsibilities. Zustand vanilla store for engine and transient UI state; the Renderer subscribes directly. Redux Toolkit for domain state, persisted to Dexie through listener middleware, visible in Redux DevTools. A short rule in CONTRIBUTING says which to use.

## Consequences

Each store does what it is good at. Two libraries to learn, mitigated by the rule and by clear folder boundaries. If the Redux half stays tiny by M3, we revisit and may fold it into Zustand.

## Alternatives considered

Only Zustand: fine for the engine, weaker devtools and replay for progress. Only Redux: too slow and ceremonial for per-frame state.
