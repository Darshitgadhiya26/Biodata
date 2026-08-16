import { useAdminBundle } from '@/layouts/AdminLayout';
import { BiodataSectionForm, type FieldDefinition } from '@/components/admin/BiodataSectionForm';
import { personalSchema } from '@/utils/validation';

const FIELDS: FieldDefinition[] = [
  { name: 'name', label: 'Name', required: true, placeholder: 'Full name' },
  { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
  { name: 'caste', label: 'Caste', placeholder: 'e.g. Leuva Patel' },
  { name: 'height', label: 'Height', placeholder: 'e.g. 5 feet 6 inches' },
  { name: 'weight', label: 'Weight', placeholder: 'e.g. 75 Kg' },
  { name: 'blood_group', label: 'Blood Group', placeholder: 'e.g. B+' },
];

export function PersonalPage() {
  const { biodata, hobbies, maternalRelatives } = useAdminBundle();

  return (
    <BiodataSectionForm
      biodata={biodata}
      hobbies={hobbies}
      maternalRelatives={maternalRelatives}
      title="Personal Information"
      description="Basic details shown at the top of the public biodata."
      fields={FIELDS}
      schema={personalSchema}
      previewSection="personal"
    />
  );
}

export default PersonalPage;
