import { useAdminBundle } from '@/layouts/AdminLayout';
import { BiodataSectionForm, type FieldDefinition } from '@/components/admin/BiodataSectionForm';
import { OrderedListEditor } from '@/components/admin/OrderedListEditor';
import {
  useAddMaternalRelative,
  useDeleteMaternalRelative,
  useReorderMaternalRelatives,
  useUpdateMaternalRelative,
} from '@/hooks/useMaternal';
import { maternalSchema } from '@/utils/validation';

const FIELDS: FieldDefinition[] = [
  {
    name: 'maternal_address',
    label: 'Maternal Address',
    type: 'textarea',
    rows: 4,
    placeholder: 'One line per row',
    hint: 'Each line appears on its own row in the maternal card.',
  },
];

export function MaternalPage() {
  const { biodata, hobbies, maternalRelatives } = useAdminBundle();

  const addRelative = useAddMaternalRelative(biodata.id);
  const updateRelative = useUpdateMaternalRelative(biodata.id);
  const deleteRelative = useDeleteMaternalRelative(biodata.id);
  const reorderRelatives = useReorderMaternalRelatives(biodata.id);

  return (
    <BiodataSectionForm
      biodata={biodata}
      hobbies={hobbies}
      maternalRelatives={maternalRelatives}
      title="Maternal Details"
      description="Maternal relatives and the maternal address."
      fields={FIELDS}
      schema={maternalSchema}
      previewSection="maternal"
    >
      <OrderedListEditor
        items={maternalRelatives}
        itemLabel="Relative"
        addLabel="Add a maternal relative"
        placeholder="e.g. Jaysukhbhai Nanubhai Borad"
        emptyMessage="Add the maternal relatives you would like shown on the biodata."
        onAdd={(name, displayOrder) => addRelative.mutateAsync({ name, displayOrder })}
        onUpdate={(id, name) => updateRelative.mutateAsync({ id, name })}
        onDelete={(id) => deleteRelative.mutateAsync(id)}
        onReorder={(items) => reorderRelatives.mutateAsync(items)}
      />
    </BiodataSectionForm>
  );
}

export default MaternalPage;
