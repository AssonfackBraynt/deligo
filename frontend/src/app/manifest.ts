import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DeliGo',
    short_name: 'DeliGo',
    description: 'Move anything, anywhere, faster with verified delivery providers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#15705f',
    orientation: 'portrait',
    categories: ['logistics', 'delivery', 'transportation'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
