import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Memoisation by the compiler instead of hand-written useMemo/useCallback (PLAN.md §2).
  reactCompiler: true,
  // Link hrefs are checked against real routes at build time.
  typedRoutes: true,
  poweredByHeader: false,
};

export default nextConfig;
