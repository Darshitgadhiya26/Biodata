import { Eye } from 'lucide-react';
import type { Biodata } from '@/types';
import { BiodataView } from '@/components/public/BiodataView';
import { cn } from '@/utils/cn';

interface LivePreviewProps {
  biodata: Biodata;
  /** Highlights that the preview is showing unpublished edits. */
  isDirty: boolean;
  className?: string;
}

/**
 * The draft rendered with the real public components, so what the admin sees
 * while typing is exactly what a visitor will get after publishing.
 *
 * Animations are switched off (`still`) — a preview that fades in on every
 * keystroke is unusable.
 */
export function LivePreview({ biodata, isDirty, className }: LivePreviewProps) {
  return (
    <div className={cn('flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-ivory', className)}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
        <p className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-wideish text-subtle">
          <Eye aria-hidden className="h-3.5 w-3.5 text-gold" />
          Live Preview
        </p>

        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[0.65rem] font-medium',
            isDirty ? 'bg-gold/15 text-gold-deep' : 'bg-charcoal/5 text-subtle',
          )}
        >
          {isDirty ? 'Unpublished draft' : 'Matches published'}
        </span>
      </div>

      {/* The preview scrolls inside its own pane so the editor stays put. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <BiodataView biodata={biodata} still />
      </div>
    </div>
  );
}
