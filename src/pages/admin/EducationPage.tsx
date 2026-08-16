import { useAdminBundle } from '@/layouts/AdminLayout';
import { BiodataSectionForm, type FieldDefinition } from '@/components/admin/BiodataSectionForm';
import { educationSchema } from '@/utils/validation';

const FIELDS: FieldDefinition[] = [
  { name: 'degree', label: 'Highest Degree', placeholder: 'e.g. B.Tech in Computer' },
  { name: 'college', label: 'College', placeholder: 'e.g. Darshan University Rajkot' },
];

export function EducationPage() {
  const { biodata, hobbies, maternalRelatives } = useAdminBundle();

  return (
    <BiodataSectionForm
      biodata={biodata}
      hobbies={hobbies}
      maternalRelatives={maternalRelatives}
      title="Education"
      description="Qualification and institution."
      fields={FIELDS}
      schema={educationSchema}
      previewSection="education"
    />
  );
}

export default EducationPage;
