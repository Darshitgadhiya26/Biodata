import { useDraft, useDraftData, useFieldErrors } from '@/hooks/useDraft';
import { EditorPanel } from '@/components/admin/EditorPanel';
import { TextField } from '@/components/ui/Field';

/** Edits `career` in `data/biodata.json`. */
export function CareerPage() {
  const { update } = useDraft();
  const { career } = useDraftData();
  const errorFor = useFieldErrors();

  const set = (field: keyof typeof career, value: string) =>
    update((current) => ({ ...current, career: { ...current.career, [field]: value } }));

  return (
    <EditorPanel
      title="Career"
      description="Current role, employer and where the work is based."
      footnote="Stored under “career” in data/biodata.json."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Job title"
          name="job"
          required
          value={career.job}
          onChange={(event) => set('job', event.target.value)}
          placeholder="Software Engineer"
          error={errorFor('career.job')}
          containerClassName="sm:col-span-2"
        />

        <TextField
          label="Company"
          name="company"
          required
          value={career.company}
          onChange={(event) => set('company', event.target.value)}
          placeholder="Technomark Solutions"
          error={errorFor('career.company')}
        />

        <TextField
          label="Work location"
          name="workLocation"
          required
          value={career.workLocation}
          onChange={(event) => set('workLocation', event.target.value)}
          placeholder="Ahemedabad"
          error={errorFor('career.workLocation')}
        />
      </div>
    </EditorPanel>
  );
}

export default CareerPage;
