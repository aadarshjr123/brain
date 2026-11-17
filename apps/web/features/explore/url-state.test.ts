import { describe, expect, it } from 'vitest';

import { parseUrlState, serialiseUrlState } from './url-state';

const concepts = new Set(['event_loop', 'dom', 'gpu_process']);
const domains = ['browser', 'js', 'net'];
const known = { concept: (id: string) => concepts.has(id), domain: (id: string) => domains.includes(id) };

describe('parseUrlState', () => {
  it('reads selection and layers', () => {
    expect(parseUrlState('?n=event_loop&layers=js,net', known)).toEqual({
      n: 'event_loop',
      layers: ['js', 'net'],
    });
  });

  it('reads a route', () => {
    expect(parseUrlState('?from=dom&to=gpu_process', known)).toEqual({ from: 'dom', to: 'gpu_process' });
  });

  it('drops unknown concepts and layers without throwing', () => {
    expect(parseUrlState('?n=removed_concept&layers=js,nope', known)).toEqual({ layers: ['js'] });
  });

  it('drops malformed values', () => {
    expect(parseUrlState('?n=<script>&layers=,,,&from=Bad-Id', known)).toEqual({});
  });

  it('ignores unrelated params', () => {
    expect(parseUrlState('?utm_source=x&n=dom', known)).toEqual({ n: 'dom' });
  });
});

describe('serialiseUrlState', () => {
  it('omits defaults', () => {
    expect(serialiseUrlState({ layers: domains }, domains)).toBe('');
    expect(serialiseUrlState({}, domains)).toBe('');
  });

  it('writes readable, canonical query strings', () => {
    expect(serialiseUrlState({ n: 'dom', layers: ['net', 'browser'] }, domains)).toBe(
      '?n=dom&layers=browser,net',
    );
  });

  it('round-trips', () => {
    const state = { n: 'event_loop', layers: ['js'] };
    expect(parseUrlState(serialiseUrlState(state, domains), known)).toEqual(state);
  });
});
