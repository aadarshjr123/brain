import type { ThemeSetting } from '@/features/progress/model';

/** Mirrors the theme choice for the pre-paint script; IndexedDB is async and would flash. */
export const THEME_KEY = 'brain-theme';

/**
 * Runs in <head> before anything else:
 * 1. applies the saved theme before first paint (no flash);
 * 2. installs the Trusted Types default policy (ADR-0011): the only script URLs the page may load are our own
 *    hashed chunks and the service worker. Any other string reaching a script sink throws.
 */
export const themeScript = [
  `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`,
  `if(window.trustedTypes&&trustedTypes.createPolicy){trustedTypes.createPolicy('default',{createScriptURL:function(u){var x=new URL(u,location.href);if(x.origin===location.origin&&(x.pathname.indexOf('/_next/static/')===0||x.pathname==='/sw.js'))return u;throw new TypeError('Blocked script URL: '+u)}})}`,
].join(';');

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
