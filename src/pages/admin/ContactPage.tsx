import { useDraft, useDraftData, useFieldErrors } from '@/hooks/useDraft';
import { EditorPanel } from '@/components/admin/EditorPanel';
import { TextAreaField, TextField } from '@/components/ui/Field';

/** Edits `contact` in `data/biodata.json`. */
export function ContactPage() {
  const { update } = useDraft();
  const { contact } = useDraftData();
  const errorFor = useFieldErrors();

  const set = (field: keyof typeof contact, value: string) =>
    update((current) => ({ ...current, contact: { ...current.contact, [field]: value } }));

  return (
    <EditorPanel
      title="Contact"
      description="The phone number behind the “Call Now” button, and the home address."
      footnote="Stored under “contact” in data/biodata.json."
    >
      <div className="grid grid-cols-1 gap-5">
        <TextField
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          required
          value={contact.phone}
          onChange={(event) => set('phone', event.target.value)}
          placeholder="7069306559"
          hint="Used for the tel: link, so it must be dialable."
          error={errorFor('contact.phone')}
        />

        <TextAreaField
          label="Address"
          name="address"
          required
          rows={3}
          value={contact.address}
          onChange={(event) => set('address', event.target.value)}
          placeholder="Kanakiya, Ta. Gir Gadhada, Dist. Gir Somnath"
          hint="Commas and line breaks each start a new line on the biodata."
          error={errorFor('contact.address')}
        />
      </div>
    </EditorPanel>
  );
}

export default ContactPage;
