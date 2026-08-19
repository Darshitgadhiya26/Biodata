import { useDraft, useDraftData, useFieldErrors } from '@/hooks/useDraft';
import { fromDateInputValue, toDateInputValue } from '@/utils/format';
import { EditorPanel } from '@/components/admin/EditorPanel';
import { TextField } from '@/components/ui/Field';

/** Edits `personal` in `data/biodata.json`. */
export function PersonalPage() {
  const { update } = useDraft();
  const biodata = useDraftData();
  const errorFor = useFieldErrors();
  const { personal } = biodata;

  const set = (field: keyof typeof personal, value: string) =>
    update((current) => ({ ...current, personal: { ...current.personal, [field]: value } }));

  return (
    <EditorPanel
      title="Personal Information"
      description="Name, date of birth and the physical details shown in the Personal section."
      footnote="Stored under “personal” in data/biodata.json."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Full name"
          name="name"
          required
          value={personal.name}
          onChange={(event) => set('name', event.target.value)}
          error={errorFor('personal.name')}
          containerClassName="sm:col-span-2"
        />

        <TextField
          label="Date of birth"
          name="dateOfBirth"
          type="date"
          required
          value={toDateInputValue(personal.dateOfBirth)}
          onChange={(event) => set('dateOfBirth', fromDateInputValue(event.target.value))}
          hint="Stored as DD-MM-YYYY, the format used on the printed biodata."
          error={errorFor('personal.dateOfBirth')}
        />

        <TextField
          label="Caste"
          name="caste"
          required
          value={personal.caste}
          onChange={(event) => set('caste', event.target.value)}
          error={errorFor('personal.caste')}
        />

        <TextField
          label="Height"
          name="height"
          required
          value={personal.height}
          onChange={(event) => set('height', event.target.value)}
          placeholder="5 feet 6 inches"
          error={errorFor('personal.height')}
        />

        <TextField
          label="Weight"
          name="weight"
          required
          value={personal.weight}
          onChange={(event) => set('weight', event.target.value)}
          placeholder="75 Kg"
          error={errorFor('personal.weight')}
        />

        <TextField
          label="Blood group"
          name="bloodGroup"
          required
          value={personal.bloodGroup}
          onChange={(event) => set('bloodGroup', event.target.value)}
          placeholder="B+"
          error={errorFor('personal.bloodGroup')}
        />
      </div>
    </EditorPanel>
  );
}

export default PersonalPage;
