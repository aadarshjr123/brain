import { describe, expect, it } from 'vitest';

import { createExploreStore, pushTrail } from './store';

describe('pushTrail', () => {
  it('appends, moves repeats to the end, and keeps the last N', () => {
    expect(pushTrail(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    expect(pushTrail(['a', 'b', 'c'], 'a')).toEqual(['b', 'c', 'a']);
    expect(pushTrail(['a', 'b', 'c'], 'd', 3)).toEqual(['b', 'c', 'd']);
  });
});

describe('explore store', () => {
  const make = () => createExploreStore(['js', 'net']);

  it('selecting records the trail; clearing does not', () => {
    const s = make();
    s.getState().select('a');
    s.getState().select('b');
    s.getState().select(null);
    expect(s.getState().selectedId).toBeNull();
    expect(s.getState().trail).toEqual(['a', 'b']);
  });

  it('does not notify subscribers for a no-op', () => {
    const s = make();
    let calls = 0;
    s.subscribe(() => calls++);
    s.getState().hover(null);
    s.getState().select(null);
    s.getState().setMode('explore');
    s.getState().setHop(-1);
    expect(calls).toBe(0);
  });

  it('toggles layers with a new Set each time', () => {
    const s = make();
    const before = s.getState().activeDomains;
    s.getState().toggleDomain('js');
    expect([...s.getState().activeDomains]).toEqual(['net']);
    expect(s.getState().activeDomains).not.toBe(before);
    s.getState().toggleDomain('js');
    expect(s.getState().activeDomains.has('js')).toBe(true);
  });

  it('leaving route mode clears the route', () => {
    const s = make();
    s.getState().setMode('route');
    s.getState().setRoute({ from: 'a', to: 'b', path: ['a', 'b'], startedAt: 5 });
    s.getState().setHop(1);
    s.getState().setMode('explore');
    expect(s.getState().route).toEqual({ from: null, to: null, path: null, startedAt: 0 });
    expect(s.getState().hop).toBe(-1);
  });

  it('gives each toast a new id so the same message can show twice', () => {
    const s = make();
    s.getState().notify('hi');
    const first = s.getState().toast?.id;
    s.getState().notify('hi');
    expect(s.getState().toast?.id).not.toBe(first);
  });
});
