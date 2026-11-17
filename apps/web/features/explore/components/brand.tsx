import Link from 'next/link';

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 glass px-3.5 py-2">
      <span
        aria-hidden
        className="size-[22px] rounded-full bg-[radial-gradient(circle_at_35%_35%,var(--brand-accent),transparent_70%),var(--brand-surface-2)] shadow-[inset_0_0_0_1px_var(--brand-line-strong)]"
      />
      <span className="font-display text-[17px] font-bold tracking-tight">Brain</span>
      <small className="hidden font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground md:inline">
        FRONTEND ↔ BROWSER
      </small>
    </Link>
  );
}
