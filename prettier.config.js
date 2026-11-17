// @ts-check
import base from '@brain/config/prettier';

/** @type {import('prettier').Config} */
export default {
  ...base,
  plugins: ['prettier-plugin-tailwindcss'],
  // Tailwind v4 has no JS config; the plugin reads the theme from the stylesheet.
  tailwindStylesheet: './apps/web/app/globals.css',
  tailwindFunctions: ['cn', 'cva'],
};
