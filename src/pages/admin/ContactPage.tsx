import { useAdminBundle } from '@/layouts/AdminLayout';
import { BiodataSectionForm, type FieldDefinition } from '@/components/admin/BiodataSectionForm';
import { contactSchema } from '@/utils/validation';

const FIELDS: FieldDefinition[] = [
  { name: 'phone', label: 'Phone', type: 'tel', placeholder: 'e.g. 7069306559', hint: 'Used by the "Call Now" button.' },
  {
    name: 'address',
    label: 'Address',
    type: 'textarea',
    rows: 4,
    placeholder: 'One line per row',
    hint: 'Each line is shown on its own row in the contact card.',
  },
];

export function ContactPage() {
  const { biodata, hobbies, maternalRelatives } = useAdminBundle();

  return (
    <BiodataSectionForm
      biodata={biodata}
      hobbies={hobbies}
      maternalRelatives={maternalRelatives}
      title="Contact"
      description="How families can reach you."
      fields={FIELDS}
      schema={contactSchema}
      previewSection="contact"
    />
  );
}

export default ContactPage;
