import type { CSSProperties } from 'react';

/** Sets --c to a domain's colour token, for chips, dots and accents. */
export function domainStyle(domain: string): CSSProperties {
  return { '--c': `var(--domain-${domain})` } as CSSProperties;
}
