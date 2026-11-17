/**
 * BRAIN-16 spike: is a Web Worker needed for layout? Measures, on the same engine (V8) the browser uses:
 *  1. simulation tick cost at 144 (today), 500 and 1500 nodes, while the layout is hot (alpha 1);
 *  2. the cost of moving positions across a thread boundary as a transferable Float32Array.
 * Run: node packages/graph-engine/bench/layout.bench.ts
 */
import { MessageChannel } from 'node:worker_threads';

import { graph as content } from '@brain/content';

import { seededRandom } from '../src/geometry.ts';
import { buildGraph, type GraphEdgeInput } from '../src/graph.ts';
import { Layout } from '../src/layout.ts';

/** Grow a synthetic graph with the real content's average degree (~3.8) by preferential attachment. */
function synthetic(n: number, random: () => number) {
  const nodes = Array.from({ length: n }, (_, i) => ({ id: `n${String(i)}` }));
  const edges: GraphEdgeInput[] = [];
  const ends: string[] = ['n0'];
  for (let i = 1; i < n; i++) {
    const links = 1 + (random() < 0.9 ? 1 : 0);
    for (let j = 0; j < links; j++) {
      const target = ends[Math.floor(random() * ends.length)] ?? 'n0';
      if (target === `n${String(i)}`) continue;
      edges.push({ from: `n${String(i)}`, to: target, relation: 'r' });
      ends.push(target, `n${String(i)}`);
    }
  }
  return buildGraph(nodes, edges);
}

function measure(label: string, g: ReturnType<typeof buildGraph>) {
  const layout = new Layout(g, { random: seededRandom(42), now: () => 0 });
  layout.addLoose([...g.nodes.keys()]);
  for (let i = 0; i < 10; i++) layout.step(); // warm up the JIT
  layout.reheat(1);
  const samples: number[] = [];
  for (let i = 0; i < 120; i++) {
    const t = performance.now();
    layout.step();
    samples.push(performance.now() - t);
  }
  samples.sort((a, b) => a - b);
  const p = (q: number) => (samples[Math.floor(q * (samples.length - 1))] ?? 0).toFixed(2);
  console.log(
    `${label.padEnd(22)} nodes=${String(g.nodes.size).padStart(5)} edges=${String(g.edges.length).padStart(5)}  tick p50=${p(0.5)}ms p95=${p(0.95)}ms`,
  );
}

async function transfer(n: number) {
  const { port1, port2 } = new MessageChannel();
  const samples: number[] = [];
  for (let i = 0; i < 200; i++) {
    const buf = new Float32Array(n * 2);
    const t = performance.now();
    const got = new Promise<void>((resolve) =>
      port2.once('message', () => {
        resolve();
      }),
    );
    port1.postMessage(buf, [buf.buffer]);
    await got;
    samples.push(performance.now() - t);
  }
  port1.close();
  samples.sort((a, b) => a - b);
  console.log(`transfer ${String(n).padStart(5)} positions   p50=${(samples[100] ?? 0).toFixed(3)}ms`);
}

measure('real content', buildGraph(content.nodes, content.edges));
const random = seededRandom(7);
measure('synthetic', synthetic(500, random));
measure('synthetic', synthetic(1500, random));
await transfer(500);
await transfer(1500);
