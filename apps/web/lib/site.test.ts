import { describe, expect, it } from 'vitest';

import { resolveSiteUrl } from './site';

describe('resolveSiteUrl', () => {
  it('prefers an explicit NEXT_PUBLIC_SITE_URL over everything else', () => {
    const url = resolveSiteUrl({
      NEXT_PUBLIC_SITE_URL: 'https://brain.dev',
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'brain.vercel.app',
    });
    expect(url.href).toBe('https://brain.dev/');
  });

  it('uses the production domain on production deployments', () => {
    const url = resolveSiteUrl({
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'brain.vercel.app',
      VERCEL_URL: 'brain-abc123.vercel.app',
    });
    expect(url.href).toBe('https://brain.vercel.app/');
  });

  it('uses the deployment URL on preview deployments', () => {
    const url = resolveSiteUrl({
      VERCEL_ENV: 'preview',
      VERCEL_PROJECT_PRODUCTION_URL: 'brain.vercel.app',
      VERCEL_URL: 'brain-git-feat-x.vercel.app',
    });
    expect(url.href).toBe('https://brain-git-feat-x.vercel.app/');
  });

  it('falls back to localhost when nothing is set', () => {
    expect(resolveSiteUrl({}).href).toBe('http://localhost:3000/');
  });
});
