import { useDraft, useDraftData, useFieldErrors } from '@/hooks/useDraft';
import { EditorPanel } from '@/components/admin/EditorPanel';
import { TextField } from '@/components/ui/Field';

/** Edits `education` in `data/biodata.json`. */
export function EducationPage() {
  const { update } = useDraft();
  const { education } = useDraftData();
  const errorFor = useFieldErrors();

  const set = (field: keyof typeof education, value: string) =>
    update((current) => ({ ...current, education: { ...current.education, [field]: value } }));

  return (
    <EditorPanel
      title="Education"
      description="The highest qualification and where it was earned."
      footnote="Stored under “education” in data/biodata.json."
    >
      <div className="grid grid-cols-1 gap-5">
        <TextField
          label="Highest degree"
          name="degree"
          required
          value={education.degree}
          onChange={(event) => set('degree', event.target.value)}
          placeholder="B.Tech in Computer"
          error={errorFor('education.degree')}
        />

        <TextField
          label="College / University"
          name="college"
          required
          value={education.college}
          onChange={(event) => set('college', event.target.value)}
          placeholder="Darshan University Rajkot"
          error={errorFor('education.college')}
        />
      </div>
    </EditorPanel>
  );
}

export default EducationPage;
