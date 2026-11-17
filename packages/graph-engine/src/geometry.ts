/** Node radius grows with degree, so hubs read as hubs. Shared by layout (collision) and renderer. */
export function nodeRadius(degree: number): number {
  return 6 + Math.min(12, Math.sqrt(degree) * 1.6);
}

/** Small, fast, seedable PRNG (mulberry32). Layout takes one so tests are deterministic. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
