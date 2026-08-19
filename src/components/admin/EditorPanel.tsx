import type { ReactNode } from 'react';

interface EditorPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional note rendered under the fields, e.g. where the data lands. */
  footnote?: ReactNode;
}

/**
 * The frame every editor page shares. Quiet and functional on purpose — the
 * premium styling belongs to the biodata itself, which sits in the preview
 * pane right next to it.
 */
export function EditorPanel({ title, description, children, footnote }: EditorPanelProps) {
  return (
    <section aria-labelledby="editor-title" className="rounded-3xl border border-line bg-surface-raised p-5 sm:p-7">
      <header className="mb-6">
        <h1 id="editor-title" className="font-display text-2xl font-semibold text-charcoal">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>}
      </header>

      {children}

      {footnote && <div className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-subtle">{footnote}</div>}
    </section>
  );
}
