/**
 * Canonical site URL, used for metadata (Open Graph, canonical links, sitemap).
 *
 * Order: explicit NEXT_PUBLIC_SITE_URL → Vercel production domain → Vercel deployment URL (previews) → localhost.
 * VERCEL_* variables are set by Vercel at build time; see docs/runbooks/deploy.md.
 */
export interface SiteEnv {
  NEXT_PUBLIC_SITE_URL?: string | undefined;
  VERCEL_ENV?: string | undefined;
  VERCEL_URL?: string | undefined;
  VERCEL_PROJECT_PRODUCTION_URL?: string | undefined;
}

export function resolveSiteUrl(env: SiteEnv): URL {
  if (env.NEXT_PUBLIC_SITE_URL) return new URL(env.NEXT_PUBLIC_SITE_URL);

  const host = env.VERCEL_ENV === 'production' ? env.VERCEL_PROJECT_PRODUCTION_URL : env.VERCEL_URL;
  if (host) return new URL(`https://${host}`);

  return new URL('http://localhost:3000');
}

export const siteUrl = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
});
