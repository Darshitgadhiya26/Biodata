import { useMemo } from 'react';
import { useDraft, useDraftData, useFieldErrors } from '@/hooks/useDraft';
import { EditorPanel } from '@/components/admin/EditorPanel';
import { ListEditor } from '@/components/admin/ListEditor';

/** Edits `hobbies` — add, edit, delete and reorder. */
export function HobbiesPage() {
  const { update, issues } = useDraft();
  const { hobbies } = useDraftData();
  const errorFor = useFieldErrors();

  const hobbyErrors = useMemo(() => {
    const map: Record<number, string> = {};
    for (const issue of issues) {
      const match = /^hobbies\.(\d+)$/.exec(issue.path);
      if (match) map[Number(match[1])] = issue.message;
    }
    return map;
  }, [issues]);

  return (
    <EditorPanel
      title="Hobbies & Interests"
      description="The chips shown in the Interests section, in this order."
      footnote="Stored under “hobbies” in data/biodata.json."
    >
      <ListEditor
        items={hobbies}
        itemLabel="hobby"
        addLabel="Add hobby"
        placeholder="Cricket"
        emptyMessage="No hobbies yet"
        errors={hobbyErrors}
        onChange={(next) => update((current) => ({ ...current, hobbies: next }))}
      />

      {errorFor('hobbies') && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {errorFor('hobbies')}
        </p>
      )}
    </EditorPanel>
  );
}

export default HobbiesPage;
