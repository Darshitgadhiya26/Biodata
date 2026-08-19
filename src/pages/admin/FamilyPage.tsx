import { useDraft, useDraftData, useFieldErrors } from '@/hooks/useDraft';
import { EditorPanel } from '@/components/admin/EditorPanel';
import { TextField } from '@/components/ui/Field';

/** Edits `family` in `data/biodata.json`. */
export function FamilyPage() {
  const { update } = useDraft();
  const { family } = useDraftData();
  const errorFor = useFieldErrors();

  const set = (field: keyof typeof family, value: string) =>
    update((current) => ({ ...current, family: { ...current.family, [field]: value } }));

  return (
    <EditorPanel
      title="Family Details"
      description="Parents' names and your father's occupation."
      footnote="Stored under “family” in data/biodata.json."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Father's name"
          name="fatherName"
          required
          value={family.fatherName}
          onChange={(event) => set('fatherName', event.target.value)}
          error={errorFor('family.fatherName')}
          containerClassName="sm:col-span-2"
        />

        <TextField
          label="Father's occupation"
          name="fatherOccupation"
          required
          value={family.fatherOccupation}
          onChange={(event) => set('fatherOccupation', event.target.value)}
          placeholder="Agriculture (27 Vigha)"
          error={errorFor('family.fatherOccupation')}
        />

        <TextField
          label="Mother's name"
          name="motherName"
          required
          value={family.motherName}
          onChange={(event) => set('motherName', event.target.value)}
          error={errorFor('family.motherName')}
        />
      </div>
    </EditorPanel>
  );
}

export default FamilyPage;
