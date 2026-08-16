import { useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodTypeAny } from 'zod';
import { RotateCcw, Save, Undo2 } from 'lucide-react';
import type { Biodata, BiodataEditableFields, Hobby, MaternalRelative } from '@/types';
import { DEFAULT_BIODATA } from '@/data/defaults';
import { useUpdateBiodata } from '@/hooks/useBiodata';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useToast } from '@/hooks/useToast';
import { errorMessage } from '@/services/errors';
import { toDateInputValue } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LivePreview } from './LivePreview';
import { cn } from '@/utils/cn';

export type EditableFieldName = keyof BiodataEditableFields;

export interface FieldDefinition {
  name: EditableFieldName;
  label: string;
  type?: 'text' | 'date' | 'tel' | 'textarea';
  placeholder?: string;
  hint?: string;
  required?: boolean;
  /** Span the full width of the two-column form grid. */
  full?: boolean;
  rows?: number;
}

interface BiodataSectionFormProps {
  biodata: Biodata;
  hobbies: Hobby[];
  maternalRelatives: MaternalRelative[];
  title: string;
  description?: string;
  fields: FieldDefinition[];
  schema: ZodTypeAny;
  /** Section id the live preview scrolls to. */
  previewSection: string;
  /** Extra editor UI rendered under the fields (e.g. the relatives list). */
  children?: React.ReactNode;
}

type FormValues = Record<string, string>;

/** Row → form values (never `null`, so inputs stay controlled). */
function toFormValues(biodata: Biodata, fields: FieldDefinition[]): FormValues {
  const values: FormValues = {};

  for (const field of fields) {
    const raw = biodata[field.name];
    values[field.name] = field.type === 'date' ? toDateInputValue(raw) : (raw ?? '');
  }

  return values;
}

/** Form values → patch (empty string becomes `null`, not `''`). */
function toPatch(values: FormValues, fields: FieldDefinition[]): Partial<BiodataEditableFields> {
  const patch: Record<string, string | null> = {};

  for (const field of fields) {
    const value = (values[field.name] ?? '').trim();
    patch[field.name] = value === '' ? null : value;
  }

  return patch as Partial<BiodataEditableFields>;
}

/**
 * The editor used by every biodata section.
 *
 * Left: validated fields. Right: a live preview that reflects each keystroke
 * immediately — saving only decides what gets persisted to Supabase.
 */
export function BiodataSectionForm({
  biodata,
  hobbies,
  maternalRelatives,
  title,
  description,
  fields,
  schema,
  previewSection,
  children,
}: BiodataSectionFormProps) {
  const toast = useToast();
  const updateBiodata = useUpdateBiodata();
  const [confirmReset, setConfirmReset] = useState(false);

  const savedValues = useMemo(() => toFormValues(biodata, fields), [biodata, fields]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    // One cast: the schema is built per-section from a record of string fields.
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: savedValues,
    mode: 'onBlur',
  });

  // When a save lands (or Realtime brings in a change from another device),
  // re-baseline the form so "dirty" stays meaningful.
  useEffect(() => {
    reset(savedValues, { keepDirtyValues: true });
  }, [savedValues, reset]);

  const draftValues = watch();
  useUnsavedChanges(isDirty);

  // Merge the draft over the saved row — this is what the preview renders.
  const previewBiodata = useMemo<Biodata>(
    () => ({ ...biodata, ...toPatch(draftValues, fields) }),
    [biodata, draftValues, fields],
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await updateBiodata.mutateAsync({ id: biodata.id, patch: toPatch(values, fields) });
      reset(toFormValues(saved, fields));
      toast.success('Changes saved successfully', 'The public biodata is now up to date.');
    } catch (error) {
      toast.error('Unable to save changes. Please try again.', errorMessage(error));
    }
  });

  const handleCancel = () => {
    reset(savedValues);
    toast.notify('Changes discarded', { description: 'The form was restored to the last saved values.' });
  };

  const applyDefaults = () => {
    for (const field of fields) {
      const fallback = DEFAULT_BIODATA[field.name];
      const value = field.type === 'date' ? toDateInputValue(fallback) : (fallback ?? '');
      setValue(field.name, value, { shouldDirty: true, shouldValidate: true });
    }

    setConfirmReset(false);
    toast.notify('Original values restored', { description: 'Choose Save Changes to keep them.' });
  };

  const isBusy = isSubmitting || updateBiodata.isPending;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ---------------- Editor ---------------- */}
      <section aria-labelledby="editor-title" className="min-w-0">
        <header className="mb-6">
          <h1 id="editor-title" className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
            {title}
          </h1>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        </header>

        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <div className="rounded-3xl border border-line bg-surface-raised p-5 shadow-card sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const error = errors[field.name]?.message as string | undefined;
                const shared = {
                  label: field.label,
                  placeholder: field.placeholder,
                  hint: field.hint,
                  error,
                  required: field.required,
                  containerClassName: cn((field.full || field.type === 'textarea') && 'sm:col-span-2'),
                };

                if (field.type === 'textarea') {
                  return (
                    <TextAreaField
                      key={field.name}
                      rows={field.rows ?? 3}
                      {...shared}
                      {...register(field.name)}
                    />
                  );
                }

                return (
                  <TextField
                    key={field.name}
                    type={field.type ?? 'text'}
                    inputMode={field.type === 'tel' ? 'tel' : undefined}
                    autoComplete="off"
                    {...shared}
                    {...register(field.name)}
                  />
                );
              })}
            </div>
          </div>

          {children}

          {/* Sticky action bar so Save is always reachable on long forms */}
          <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-3 rounded-2xl border border-line bg-surface-raised/95 p-3 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p
              className={cn('px-1 text-xs', isDirty ? 'font-medium text-gold' : 'text-subtle')}
              aria-live="polite"
            >
              {isDirty ? 'You have unsaved changes' : 'All changes saved'}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leadingIcon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={() => setConfirmReset(true)}
                disabled={isBusy}
              >
                Reset
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                leadingIcon={<Undo2 className="h-3.5 w-3.5" />}
                onClick={handleCancel}
                disabled={isBusy || !isDirty}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="gold"
                size="sm"
                leadingIcon={<Save className="h-3.5 w-3.5" />}
                isLoading={isBusy}
                loadingText="Saving…"
                disabled={!isDirty}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </section>

      {/* ---------------- Preview ---------------- */}
      <LivePreview
        biodata={previewBiodata}
        hobbies={hobbies}
        maternalRelatives={maternalRelatives}
        focusSection={previewSection}
        className="hidden max-h-[calc(100dvh-8rem)] xl:sticky xl:top-24 xl:flex"
      />

      <ConfirmDialog
        open={confirmReset}
        destructive
        title="Restore the original values?"
        description={`This puts the ${title.toLowerCase()} fields back to the values from the original biodata. Nothing is saved until you choose Save Changes.`}
        confirmLabel="Restore"
        onConfirm={applyDefaults}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
