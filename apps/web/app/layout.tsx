import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

import { RegisterServiceWorker } from '@/features/offline/register';
import { ProgressProvider } from '@/features/progress/provider';
import { themeScript } from '@/features/theme/theme';
import { siteUrl } from '@/lib/site';
import { cn } from '@/lib/utils';

import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-bricolage',
  display: 'swap',
});
const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: 'Brain',
    template: '%s · Brain',
  },
  description:
    'A free study map of how frontend development touches the browser. Explore concepts, see what they connect to, and trace cause and effect.',
  applicationName: 'Brain',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }] },
  openGraph: { type: 'website', siteName: 'Brain', locale: 'en' },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#070a10' },
    { media: '(prefers-color-scheme: light)', color: '#eef1f6' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the head script may set data-theme before React hydrates.
    <html lang="en" suppressHydrationWarning className={cn(display.variable, sans.variable, mono.variable)}>
      <head>
        {/* Applies the saved theme before first paint, so there is no flash. Allowed by hash in the CSP. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="fixed top-2 left-2 z-50 -translate-y-20 rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground focus:translate-y-0"
        >
          Skip to content
        </a>
        <ProgressProvider>{children}</ProgressProvider>
        <RegisterServiceWorker />
        {/* Vercel serves these scripts from its edge, so they only exist in Vercel builds. No cookies, no personal identifiers. */}
        {process.env.VERCEL === '1' && (
          <>
            <SpeedInsights />
            <Analytics />
          </>
        )}
      </body>
    </html>
  );
}
