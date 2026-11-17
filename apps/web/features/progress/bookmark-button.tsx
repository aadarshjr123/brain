'use client';

import { Star } from 'lucide-react';

import { useAppDispatch, useAppSelector } from './provider';
import { bookmarkToggled } from './slices';
import { selectIsBookmarked } from './store';

export function BookmarkButton({ id, label }: { id: string; label: string }) {
  const dispatch = useAppDispatch();
  const on = useAppSelector(selectIsBookmarked(id));
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove ${label} from bookmarks` : `Bookmark ${label}`}
      title={on ? 'Bookmarked' : 'Bookmark'}
      onClick={() => {
        dispatch(bookmarkToggled(id));
      }}
      className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-secondary px-3 py-[7px] text-[12.5px] hover:border-input aria-pressed:border-primary aria-pressed:text-primary"
    >
      <Star aria-hidden className={`size-3.5 ${on ? 'fill-current' : ''}`} />
      {on ? 'Bookmarked' : 'Bookmark'}
    </button>
  );
}
