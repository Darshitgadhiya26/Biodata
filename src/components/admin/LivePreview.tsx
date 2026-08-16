import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Monitor, Smartphone } from 'lucide-react';
import type { Biodata, Hobby, MaternalRelative } from '@/types';
import { BiodataView } from '@/components/public/BiodataView';
import { cn } from '@/utils/cn';

interface LivePreviewProps {
  biodata: Biodata;
  hobbies: Hobby[];
  maternalRelatives: MaternalRelative[];
  /** Section id to keep in view as the admin edits. */
  focusSection?: string;
  className?: string;
}

type Device = 'desktop' | 'mobile';

/** Logical viewport widths the preview emulates. */
const FRAME_WIDTH: Record<Device, number> = { desktop: 1280, mobile: 420 };

/**
 * Live preview of the public page, rendered from the *draft* values.
 *
 * It mounts the very same <BiodataView> visitors see, so there is no second
 * implementation to drift. The document is laid out at a real viewport width
 * and then scaled down to fit the pane — otherwise the public page's
 * responsive grids would collapse to their mobile layout inside a narrow
 * column and the preview would misrepresent the result.
 *
 * Updates are immediate: saving is only needed to persist to Supabase.
 */
export function LivePreview({
  biodata,
  hobbies,
  maternalRelatives,
  focusSection,
  className,
}: LivePreviewProps) {
  const [device, setDevice] = useState<Device>('desktop');
  const [visible, setVisible] = useState(true);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const frameWidth = FRAME_WIDTH[device];

  const measure = useCallback(() => {
    const pane = scrollRef.current;
    const frame = frameRef.current;
    if (!pane || !frame) return;

    // 2px keeps the scaled page clear of the pane's own scrollbar.
    const available = pane.clientWidth - 2;
    setScale(Math.min(1, available / frameWidth));
    setContentHeight(frame.scrollHeight);
  }, [frameWidth]);

  useLayoutEffect(() => {
    measure();
  }, [measure, biodata, hobbies, maternalRelatives, visible]);

  useEffect(() => {
    if (!visible) return;

    const pane = scrollRef.current;
    const frame = frameRef.current;
    if (!pane || !frame) return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(pane);
    observer.observe(frame);

    return () => observer.disconnect();
  }, [measure, visible]);

  // Keep the section being edited in view inside the preview frame.
  useEffect(() => {
    if (!focusSection || !visible) return;

    const timer = window.setTimeout(() => {
      const pane = scrollRef.current;
      const target = frameRef.current?.querySelector<HTMLElement>(`#${CSS.escape(focusSection)}`);
      if (!pane || !target) return;

      // offsetTop is in unscaled frame coordinates.
      pane.scrollTo({ top: Math.max(0, target.offsetTop * scale - 12), behavior: 'smooth' });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [focusSection, visible, device, scale]);

  return (
    <aside
      aria-label="Live preview of the public biodata"
      className={cn('flex flex-col overflow-hidden rounded-3xl border border-line bg-surface', className)}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-success" />
          <p className="truncate text-[0.78rem] font-semibold uppercase tracking-wideish text-muted">
            Live Preview
          </p>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 rounded-full border border-line bg-surface-raised p-0.5">
            {(
              [
                { value: 'desktop' as const, Icon: Monitor, label: 'Desktop width' },
                { value: 'mobile' as const, Icon: Smartphone, label: 'Mobile width' },
              ]
            ).map(({ value, Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDevice(value)}
                aria-label={label}
                aria-pressed={device === value}
                title={label}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                  device === value ? 'bg-charcoal text-ivory' : 'text-subtle hover:text-charcoal',
                )}
              >
                <Icon aria-hidden className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setVisible((open) => !open)}
            aria-label={visible ? 'Hide preview' : 'Show preview'}
            aria-expanded={visible}
            title={visible ? 'Hide preview' : 'Show preview'}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface-raised text-subtle transition-colors hover:text-charcoal"
          >
            {visible ? <EyeOff aria-hidden className="h-3.5 w-3.5" /> : <Eye aria-hidden className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {visible ? (
        <div
          ref={scrollRef}
          className="relative flex-1 overflow-y-auto overscroll-contain bg-ivory"
          // The preview duplicates the page being edited; hiding it from
          // assistive tech avoids announcing every field twice.
          aria-hidden
        >
          {/* Sized box: transforms do not affect layout, so the wrapper carries
              the scaled dimensions to keep the scroll height honest. */}
          <div
            className="mx-auto"
            style={{ width: frameWidth * scale, height: contentHeight * scale }}
          >
            <div
              ref={frameRef}
              style={{ width: frameWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}
            >
              <BiodataView
                biodata={biodata}
                hobbies={hobbies}
                maternalRelatives={maternalRelatives}
                still
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-subtle">
          Preview hidden
        </div>
      )}
    </aside>
  );
}
