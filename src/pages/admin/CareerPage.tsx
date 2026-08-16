import { useAdminBundle } from '@/layouts/AdminLayout';
import { BiodataSectionForm, type FieldDefinition } from '@/components/admin/BiodataSectionForm';
import { careerSchema } from '@/utils/validation';

const FIELDS: FieldDefinition[] = [
  { name: 'job_title', label: 'Job Title', placeholder: 'e.g. Software Engineer' },
  { name: 'company', label: 'Company', placeholder: 'e.g. Technomark Solutions' },
  { name: 'work_location', label: 'Work Location', placeholder: 'e.g. Ahemedabad' },
];

export function CareerPage() {
  const { biodata, hobbies, maternalRelatives } = useAdminBundle();

  return (
    <BiodataSectionForm
      biodata={biodata}
      hobbies={hobbies}
      maternalRelatives={maternalRelatives}
      title="Career"
      description="Current role, employer and work location."
      fields={FIELDS}
      schema={careerSchema}
      previewSection="career"
    />
  );
}

export default CareerPage;
