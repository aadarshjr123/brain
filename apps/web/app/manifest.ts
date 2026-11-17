import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Brain: frontend ↔ browser map',
    short_name: 'Brain',
    description: 'A free map of how frontend development touches the browser.',
    start_url: '/explore',
    display: 'standalone',
    background_color: '#070a10',
    theme_color: '#070a10',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/icon/192', type: 'image/png', sizes: '192x192' },
      { src: '/icon/512', type: 'image/png', sizes: '512x512' },
      { src: '/icon/512', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
    ],
  };
}
