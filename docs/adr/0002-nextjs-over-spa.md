# ADR-0002: Use Next.js App Router rather than a Vite SPA

|          |                 |
| -------- | --------------- |
| Status   | Accepted        |
| Date     | 2026-11-16      |
| Deciders | Aadarsh, Claude |

## Context

The graph is a client-only canvas, but the product also needs a static page per concept for deep links and SEO, MDX notes, Open Graph images and a cheatsheet view. Contributors are more likely to know the App Router than a custom SPA setup.

## Decision

Build on Next.js 16 App Router with React 19. The Explore map is a client island loaded with `next/dynamic` and `ssr: false`. All other routes are static server components. There is no application server in v1.

## Consequences

Static concept pages, OG images and MDX come for free. Slightly heavier toolchain than Vite. The canvas code must stay framework-free so it is not coupled to Next.

## Alternatives considered

Vite + React Router SPA: simpler, but concept pages would need a prerender step and OG images a separate pipeline. Astro with React islands: strong fit for content, weaker ecosystem for the interactive app half.
