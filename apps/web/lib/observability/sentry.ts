/**
 * Sentry is opt-in: with no DSN nothing is loaded, so local runs and forks stay silent and the
 * SDK never enters the main bundle (it is pulled in with a dynamic import only when a DSN exists).
 */
export const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

/** Release tag: the deployed commit on Vercel, so an error maps to the exact code that threw it. */
export const sentryRelease = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

export const sentryEnvironment = process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development';

export async function captureException(error: unknown): Promise<void> {
  if (!sentryDsn) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureException(error);
}
