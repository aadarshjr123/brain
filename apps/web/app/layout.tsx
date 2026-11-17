import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';

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
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#070a10' },
    { media: '(prefers-color-scheme: light)', color: '#eef1f6' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(display.variable, sans.variable, mono.variable)}>
      <body className="min-h-dvh">
        {children}
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
