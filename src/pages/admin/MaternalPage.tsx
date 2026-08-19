import { useMemo } from 'react';
import { useDraft, useDraftData, useFieldErrors } from '@/hooks/useDraft';
import { EditorPanel } from '@/components/admin/EditorPanel';
import { ListEditor } from '@/components/admin/ListEditor';
import { TextAreaField } from '@/components/ui/Field';

/** Edits `maternal` — an ordered list of relatives plus the mosal address. */
export function MaternalPage() {
  const { update, issues } = useDraft();
  const { maternal } = useDraftData();
  const errorFor = useFieldErrors();

  // Schema issues arrive as `maternal.relatives.0` — map them back to indexes.
  const relativeErrors = useMemo(() => {
    const map: Record<number, string> = {};
    for (const issue of issues) {
      const match = /^maternal\.relatives\.(\d+)$/.exec(issue.path);
      if (match) map[Number(match[1])] = issue.message;
    }
    return map;
  }, [issues]);

  return (
    <EditorPanel
      title="Maternal Details"
      description="Add, edit, delete and reorder maternal relatives. The order here is the order shown on the biodata."
      footnote="Stored under “maternal” in data/biodata.json."
    >
      <div className="space-y-7">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-charcoal">Maternal relatives</h2>
          <ListEditor
            items={maternal.relatives}
            itemLabel="relative"
            addLabel="Add relative"
            placeholder="Jaysukhbhai Nanubhai Borad"
            emptyMessage="No maternal relatives yet"
            errors={relativeErrors}
            onChange={(relatives) =>
              update((current) => ({ ...current, maternal: { ...current.maternal, relatives } }))
            }
          />
          {errorFor('maternal.relatives') && (
            <p role="alert" className="mt-2 text-xs font-medium text-danger">
              {errorFor('maternal.relatives')}
            </p>
          )}
        </div>

        <TextAreaField
          label="Maternal address"
          name="maternalAddress"
          rows={3}
          value={maternal.address}
          onChange={(event) =>
            update((current) => ({
              ...current,
              maternal: { ...current.maternal, address: event.target.value },
            }))
          }
          placeholder="At. Bandharda, Ta. Gir Gadhada, Dist. Gir Somnath"
          hint="Optional. Commas and line breaks each start a new line."
          error={errorFor('maternal.address')}
        />
      </div>
    </EditorPanel>
  );
}

export default MaternalPage;
