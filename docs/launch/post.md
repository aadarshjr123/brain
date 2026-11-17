# Draft launch post

_Status: draft for Aadarsh to edit and post. Written for frontend developers on a blog, dev.to or LinkedIn._

---

## I built a map of what my frontend code touches inside the browser

Every time I prepare for an interview or chase a slow page, I relearn the same things: how the event loop orders
tasks and microtasks, why reading `offsetWidth` after a write is expensive, what hydration actually blocks. The facts
are spread over specs, MDN and a dozen blog posts, and none of them show how the pieces connect.

So I built **Brain**: a map of 152 concepts and the 301 relations between them, from `setState` to the GPU process.

**Click a concept** and it unfolds what it drives and what drives it, each relation named: the microtask queue
_can starve_ the frame; the compositor thread _handles_ scrolling even when JavaScript is blocked.

**Pick two concepts** and it draws the shortest chain of cause and effect between them, hop by hop. How does a CORS
check end up delaying a React render? CORS → fetch → task queue → React scheduler → React Fiber.

It is free, has no login, works offline after the first visit, and every concept has a source. There is a
printable cheatsheet if you prefer a list.

I also ran it like a product team would, partly to practise: a PRD, eleven architecture decision records, tickets
with acceptance criteria, reviews, and a journal of what went wrong. The repository is open if you want to see how a
canvas renderer, a force layout and a Next.js app fit together, or to fix a fact.

👉 [Open the map](https://brain.example/explore) · [Code and docs](https://github.com/aadarshjr123/brain)

_Replace the link with the production domain once Vercel is linked._
