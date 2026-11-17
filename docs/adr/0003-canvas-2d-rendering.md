# ADR-0003: Render the map with Canvas 2D, not SVG or Three.js

|          |                 |
| -------- | --------------- |
| Status   | Accepted        |
| Date     | 2026-11-16      |
| Deciders | Aadarsh, Claude |

## Context

The v1 mockup proved the interaction model with ~150 nodes on a single canvas. We expect ~500 nodes. SVG with labels degrades past a few hundred elements. Three.js was the original idea but labelled edges, which carry the meaning, are hard to read in 3D.

## Decision

The renderer is an imperative Canvas 2D class in `packages/graph-engine`, driven by d3-force for layout and d3-zoom for the camera. React never touches the frame loop. A 3D view may be added later as a second renderer behind the same engine interface.

## Consequences

Predictable performance, full control over animation. No DOM for the map, so accessibility is provided by the cheatsheet and concept pages, which must ship in v1.

## Alternatives considered

SVG: easiest, dies at scale. Three.js / React Three Fiber: impressive, but readability of relation labels drops and the bundle grows by ~150 KB. WebGL 2D (PixiJS): faster than Canvas 2D but unnecessary below ~5000 nodes.
