const DOMAINS = [
  { name: 'Browser internals', className: 'bg-domain-browser' },
  { name: 'JavaScript', className: 'bg-domain-js' },
  { name: 'Network', className: 'bg-domain-net' },
  { name: 'Frameworks', className: 'bg-domain-fw' },
  { name: 'Performance', className: 'bg-domain-perf' },
  { name: 'Security', className: 'bg-domain-sec' },
  { name: 'Storage', className: 'bg-domain-store' },
  { name: 'Web APIs', className: 'bg-domain-api' },
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-4 py-16 sm:px-6">
      <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Frontend ↔ Browser</p>
      <h1 className="font-display text-5xl font-bold tracking-tight text-balance">Brain</h1>
      <p className="max-w-prose text-lg text-muted-foreground">
        A free study map of how frontend development touches the browser. Click a concept to see what it
        connects to, or pick two and follow the chain of cause and effect between them.
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Knowledge domains">
        {DOMAINS.map((domain) => (
          <li key={domain.name} className="flex items-center gap-2">
            <span aria-hidden className={`size-2 rounded-full ${domain.className}`} />
            {domain.name}
          </li>
        ))}
      </ul>
      <p className="font-mono text-xs text-muted-foreground">Status: M0 Foundation · the map arrives in M2</p>
    </main>
  );
}
