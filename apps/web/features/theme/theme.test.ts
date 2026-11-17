import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { SCRIPT_URL_ALLOW, themeScript } from './theme';

/** Runs the real head script against a fake `trustedTypes` and returns the policy it installs. */
function installPolicy(origin = 'https://brain.example'): (url: string) => string {
  let policy: { createScriptURL: (u: string) => string } | undefined;
  const fakeWindow = {
    trustedTypes: { createPolicy: (_name: string, p: typeof policy) => (policy = p) },
  };
  const trustedTypes = fakeWindow.trustedTypes;
  runInNewContext(themeScript, {
    window: fakeWindow,
    trustedTypes,
    localStorage: { getItem: () => null },
    document: { documentElement: { dataset: {} } },
    location: { href: `${origin}/explore`, origin },
    URL,
    TypeError,
  });
  if (!policy) throw new Error('policy not installed');
  return policy.createScriptURL;
}

describe('Trusted Types default policy', () => {
  const create = installPolicy();

  it.each([
    '/_next/static/immutable/chunks/abc123.js',
    '/sw.js',
    '/0b8a2d27ae2adc49/script.js',
    '/_vercel/insights/script.js',
    '/_vercel/speed-insights/script.js',
    'https://brain.example/0b8a2d27ae2adc49/script.js',
  ])('allows %s', (url) => {
    expect(create(url)).toBe(url);
  });

  it.each([
    'https://evil.example/_next/static/x.js',
    'https://evil.example/0b8a2d27ae2adc49/script.js',
    '/0b8a2d27ae2adc4/script.js',
    '/0B8A2D27AE2ADC49/script.js',
    '/0b8a2d27ae2adc49/other.js',
    '/0b8a2d27ae2adc49/script.js/x.js',
    '/sw.js.evil',
    '/_vercel/insights/other.js',
    '/uploads/script.js',
    'data:text/javascript,alert(1)',
  ])('blocks %s', (url) => {
    expect(() => create(url)).toThrow(/Blocked script URL/);
  });

  it('exposes the same allow-list the script uses', () => {
    expect(themeScript).toContain(SCRIPT_URL_ALLOW.toString());
  });
});
