import type { ThemeSetting } from '@/features/progress/model';

/** Mirrors the theme choice for the pre-paint script; IndexedDB is async and would flash. */
export const THEME_KEY = 'brain-theme';

/**
 * Runs in <head> before first paint. Kept tiny and static: its SHA-256 is allowed by the CSP (BRAIN-31).
 * Any change to this string changes the hash; the CSP test will fail until the header is updated.
 */
export const themeScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;

export function applyTheme(theme: ThemeSetting): void {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
}
