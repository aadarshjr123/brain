import type { Metadata } from 'next';

import { ExploreView } from './explore-view';

export const metadata: Metadata = {
  title: 'Map',
  description:
    'Explore how frontend concepts connect to browser internals. Click a concept to unfold what it touches.',
};

export default function ExplorePage() {
  return <ExploreView />;
}
