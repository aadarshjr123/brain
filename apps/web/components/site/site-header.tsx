import Link from 'next/link';

import { ThemeToggle } from '@/features/theme/theme-toggle';

/** Header for the text pages (concepts, cheatsheet, home). The map has its own floating bar. */
export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="size-[22px] rounded-full bg-[radial-gradient(circle_at_35%_35%,var(--brand-accent),transparent_70%),var(--brand-surface-2)] shadow-[inset_0_0_0_1px_var(--brand-line-strong)]"
          />
          <span className="font-display text-[17px] font-bold tracking-tight">Brain</span>
        </Link>
        <nav aria-label="Main" className="ml-auto flex items-center gap-1 text-sm">
          <Link
            href="/explore"
            className="rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Map
          </Link>
        </nav>
        <ThemeToggle className="hidden sm:flex" />
      </div>
    </header>
  );
}
