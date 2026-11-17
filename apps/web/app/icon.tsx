import { ImageResponse } from 'next/og';

import { OG } from '@/lib/og/card';

/** PNG icons for the manifest and older browsers; the SVG in /public is the main favicon. */
export function generateImageMetadata() {
  return [192, 512].map((px) => ({
    id: String(px),
    size: { width: px, height: px },
    contentType: 'image/png',
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const px = Number(await id);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: OG.bg,
      }}
    >
      <div
        style={{
          width: px * 0.6,
          height: px * 0.6,
          borderRadius: px * 0.3,
          background: `radial-gradient(circle at 35% 35%, ${OG.accent}, rgba(0,0,0,0) 70%)`,
          border: `${String(Math.max(2, px / 64))}px solid ${OG.line}`,
        }}
      />
    </div>,
    { width: px, height: px },
  );
}
