import type { ThemeSetting } from '@/features/progress/model';

/** Mirrors the theme choice for the pre-paint script; IndexedDB is async and would flash. */
export const THEME_KEY = 'brain-theme';

/**
 * Same-origin script paths the page may load: our hashed chunks, the service worker, and Vercel Speed Insights /
 * Web Analytics. Vercel serves those from a random 16-hex-character first-party path in production, with
 * `/_vercel/...` as the documented fallback.
 */
export const SCRIPT_URL_ALLOW =
  /^\/(?:_next\/static\/|sw\.js$|_vercel\/(?:insights|speed-insights)\/script\.js$|[0-9a-f]{16}\/script\.js$)/;

/**
 * Runs in <head> before anything else:
 * 1. applies the saved theme before first paint (no flash);
 * 2. installs the Trusted Types default policy (ADR-0011): the only script URLs the page may load are same-origin
 *    paths matching SCRIPT_URL_ALLOW. Any other string reaching a script sink throws.
 */
export const themeScript = [
  `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`,
  `if(window.trustedTypes&&trustedTypes.createPolicy){trustedTypes.createPolicy('default',{createScriptURL:function(u){var x=new URL(u,location.href);if(x.origin===location.origin&&${SCRIPT_URL_ALLOW.toString()}.test(x.pathname))return u;throw new TypeError('Blocked script URL: '+u)}})}`,
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
