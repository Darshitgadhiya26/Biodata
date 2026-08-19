import { useDraft, useDraftData, useFieldErrors } from '@/hooks/useDraft';
import { useTheme } from '@/hooks/useTheme';
import { ACCENTS, THEME_MODES } from '@/utils/biodata-schema';
import { EditorPanel } from '@/components/admin/EditorPanel';
import { SelectField, ToggleField } from '@/components/ui/Field';
import { cn } from '@/utils/cn';

const MODE_LABELS: Record<(typeof THEME_MODES)[number], string> = {
  light: 'Light — ivory paper',
  dark: 'Dark — deep espresso',
  system: "System — follow the visitor's device",
};

const ACCENT_SWATCHES: Record<(typeof ACCENTS)[number], { label: string; swatch: string }> = {
  champagne: { label: 'Champagne', swatch: 'linear-gradient(135deg,#d8be86,#b08d4c,#8a6a30)' },
  rose: { label: 'Rose', swatch: 'linear-gradient(135deg,#d6a0a8,#b76e79,#8f4e5a)' },
  emerald: { label: 'Emerald', swatch: 'linear-gradient(135deg,#7ab09c,#2a7a60,#185844)' },
  sapphire: { label: 'Sapphire', swatch: 'linear-gradient(135deg,#84a0d0,#3e609e,#28447a)' },
};

/**
 * Edits `theme` — the site-wide defaults every visitor sees. A visitor can
 * still switch light/dark for themselves; that override stays in their browser.
 */
export function AppearancePage() {
  const { update } = useDraft();
  const { theme } = useDraftData();
  const errorFor = useFieldErrors();
  const { isOverridden, resetToPublished } = useTheme();

  const setTheme = <K extends keyof typeof theme>(field: K, value: (typeof theme)[K]) =>
    update((current) => ({ ...current, theme: { ...current.theme, [field]: value } }));

  return (
    <EditorPanel
      title="Appearance"
      description="Defaults shared by everyone who opens the biodata link."
      footnote="Stored under “theme” in data/biodata.json. A visitor who picks a different theme keeps that choice in their own browser only."
    >
      <div className="space-y-7">
        <SelectField
          label="Default theme"
          name="mode"
          value={theme.mode}
          onChange={(event) => setTheme('mode', event.target.value as typeof theme.mode)}
          options={THEME_MODES.map((mode) => ({ value: mode, label: MODE_LABELS[mode] }))}
          error={errorFor('theme.mode')}
        />

        <fieldset>
          <legend className="mb-3 block text-[0.8rem] font-medium text-muted">Accent colour</legend>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ACCENTS.map((accent) => {
              const active = theme.accent === accent;

              return (
                <button
                  key={accent}
                  type="button"
                  onClick={() => setTheme('accent', accent)}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition-colors',
                    active ? 'border-gold bg-gold/5' : 'border-line bg-surface hover:border-gold/50',
                  )}
                >
                  <span
                    aria-hidden
                    className="h-9 w-9 rounded-full shadow-inner"
                    style={{ backgroundImage: ACCENT_SWATCHES[accent].swatch }}
                  />
                  <span className="text-xs font-medium text-charcoal">{ACCENT_SWATCHES[accent].label}</span>
                </button>
              );
            })}
          </div>

          {errorFor('theme.accent') && (
            <p role="alert" className="mt-2 text-xs font-medium text-danger">
              {errorFor('theme.accent')}
            </p>
          )}
        </fieldset>

        <ToggleField
          label="Decorative animations"
          description="Fade-ins, the drifting glow behind the portrait and hover lifts. Visitors who ask their device to reduce motion never see them regardless of this switch."
          checked={theme.animations}
          onChange={(checked) => setTheme('animations', checked)}
        />

        {isOverridden && (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs leading-relaxed text-muted">
              This browser is currently overriding the published theme, so the preview beside you may not match what a
              first-time visitor sees.
            </p>
            <button
              type="button"
              onClick={resetToPublished}
              className="mt-2 text-xs font-medium text-gold underline-offset-4 hover:underline"
            >
              Use the published theme here too
            </button>
          </div>
        )}
      </div>
    </EditorPanel>
  );
}

export default AppearancePage;
