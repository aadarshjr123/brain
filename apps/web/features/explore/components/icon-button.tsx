import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** Square icon button with a required accessible name; the title doubles as a hover hint. */
export function IconButton({ label, className, ...props }: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'grid h-[30px] w-8 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  );
}
