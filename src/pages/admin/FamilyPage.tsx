import { useAdminBundle } from '@/layouts/AdminLayout';
import { BiodataSectionForm, type FieldDefinition } from '@/components/admin/BiodataSectionForm';
import { familySchema } from '@/utils/validation';

const FIELDS: FieldDefinition[] = [
  { name: 'father_name', label: "Father's Name", placeholder: 'Full name' },
  { name: 'father_occupation', label: "Father's Occupation", placeholder: 'e.g. Agriculture (27 Vigha)' },
  { name: 'mother_name', label: "Mother's Name", placeholder: 'Full name' },
];

export function FamilyPage() {
  const { biodata, hobbies, maternalRelatives } = useAdminBundle();

  return (
    <BiodataSectionForm
      biodata={biodata}
      hobbies={hobbies}
      maternalRelatives={maternalRelatives}
      title="Family Details"
      description="Parents' names and occupation."
      fields={FIELDS}
      schema={familySchema}
      previewSection="family"
    />
  );
}

export default FamilyPage;
