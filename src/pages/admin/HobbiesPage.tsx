import { useAdminBundle } from '@/layouts/AdminLayout';
import { OrderedListEditor } from '@/components/admin/OrderedListEditor';
import { LivePreview } from '@/components/admin/LivePreview';
import { useAddHobby, useDeleteHobby, useReorderHobbies, useUpdateHobby } from '@/hooks/useHobbies';

export function HobbiesPage() {
  const { biodata, hobbies, maternalRelatives } = useAdminBundle();

  const addHobby = useAddHobby(biodata.id);
  const updateHobby = useUpdateHobby(biodata.id);
  const deleteHobby = useDeleteHobby(biodata.id);
  const reorderHobbies = useReorderHobbies(biodata.id);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section aria-labelledby="hobbies-title" className="min-w-0">
        <header className="mb-6">
          <h1 id="hobbies-title" className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
            Hobbies &amp; Interests
          </h1>
          <p className="mt-1.5 text-sm text-muted">Add, edit, reorder or remove interests.</p>
        </header>

        <OrderedListEditor
          items={hobbies}
          itemLabel="Hobby"
          addLabel="Add a hobby"
          placeholder="e.g. Cricket"
          emptyMessage="Add the hobbies you would like shown on the biodata."
          onAdd={(name, displayOrder) => addHobby.mutateAsync({ name, displayOrder })}
          onUpdate={(id, name) => updateHobby.mutateAsync({ id, name })}
          onDelete={(id) => deleteHobby.mutateAsync(id)}
          onReorder={(items) => reorderHobbies.mutateAsync(items)}
        />
      </section>

      <LivePreview
        biodata={biodata}
        hobbies={hobbies}
        maternalRelatives={maternalRelatives}
        focusSection="interests"
        className="hidden max-h-[calc(100dvh-8rem)] xl:sticky xl:top-24 xl:flex"
      />
    </div>
  );
}

export default HobbiesPage;
