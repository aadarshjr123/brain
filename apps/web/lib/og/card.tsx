import { ImageResponse } from 'next/og';

/** Brand colours for images: images cannot read CSS variables, so the dark tokens are repeated here. */
export const OG = {
  bg: '#070a10',
  fg: '#e8eef6',
  muted: '#8c9bb3',
  accent: '#ffb454',
  line: 'rgba(140,155,180,0.35)',
  domains: {
    browser: '#ff7a59',
    js: '#ffd166',
    net: '#4fb3ff',
    fw: '#5eead4',
    perf: '#f472b6',
    sec: '#a78bfa',
    store: '#4ade80',
    api: '#fb923c',
  } as Record<string, string>,
} as const;

export const ogSize = { width: 1200, height: 630 };

/** One layout for every share card: eyebrow, title, text, and a row of related concepts. */
export function ogCard({
  eyebrow,
  colour,
  title,
  text,
  chips,
}: {
  eyebrow: string;
  colour: string;
  title: string;
  text: string;
  chips: { label: string; colour: string }[];
}): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '64px 72px',
        background: OG.bg,
        color: OG.fg,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: `radial-gradient(circle at 35% 35%, ${OG.accent}, rgba(0,0,0,0) 70%)`,
            border: `2px solid ${OG.line}`,
          }}
        />
        <div style={{ fontSize: 30, fontWeight: 700 }}>Brain</div>
        <div style={{ fontSize: 20, color: OG.muted, letterSpacing: 2 }}>FRONTEND ↔ BROWSER</div>
      </div>
      <div style={{ display: 'flex', marginTop: 56, fontSize: 22, color: colour, letterSpacing: 3 }}>
        {eyebrow.toUpperCase()}
      </div>
      <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, marginTop: 12, lineHeight: 1.05 }}>
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 30,
          color: OG.muted,
          marginTop: 24,
          lineHeight: 1.35,
          maxWidth: 1000,
        }}
      >
        {text.length > 160 ? `${text.slice(0, 157)}…` : text}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 'auto' }}>
        {chips.slice(0, 5).map((c) => (
          <div
            key={c.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 22,
              padding: '8px 16px',
              borderRadius: 999,
              border: `1px solid ${OG.line}`,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 6, background: c.colour }} />
            {c.label}
          </div>
        ))}
      </div>
    </div>,
    ogSize,
  );
}
