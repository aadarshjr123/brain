import type { Fonts, Palette } from '@brain/graph-engine';

/** Reads the canvas colours from the same CSS tokens the DOM uses, so the map follows the theme. */
export function readPalette(root: Element, domains: readonly string[]): Palette {
  const css = getComputedStyle(root);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    bg: v('--brand-bg'),
    fg: v('--brand-fg'),
    muted: v('--brand-muted'),
    lineStrong: v('--brand-line-strong'),
    accent: v('--brand-accent'),
    accentInk: v('--brand-accent-ink'),
    surfaceSolid: v('--brand-surface-solid'),
    domains: Object.fromEntries(domains.map((d) => [d, v(`--domain-${d}`)])),
  };
}

/** next/font hashes family names; the CSS variables hold the real stacks. */
export function readFonts(root: Element): Fonts {
  const css = getComputedStyle(root);
  return {
    sans: css.getPropertyValue('--font-plex-sans').trim() || 'system-ui, sans-serif',
    mono: css.getPropertyValue('--font-plex-mono').trim() || 'ui-monospace, monospace',
  };
}
