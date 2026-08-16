import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/useToast';
import { errorMessage } from '@/services/errors';
import { orderedItemSchema } from '@/utils/validation';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/States';

/** Minimum shape the editor needs — both hobbies and relatives satisfy it. */
export interface OrderedItem {
  id: string;
  name: string;
  display_order: number;
}

interface OrderedListEditorProps<T extends OrderedItem> {
  items: T[];
  itemLabel: string;
  addLabel: string;
  placeholder: string;
  emptyMessage: string;
  isBusy?: boolean;
  onAdd: (name: string, displayOrder: number) => Promise<unknown>;
  onUpdate: (id: string, name: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onReorder: (items: T[]) => Promise<unknown> | void;
}

/**
 * Add / edit / delete / reorder list, shared by Hobbies and Maternal relatives.
 *
 * Reordering uses explicit up/down buttons rather than drag-and-drop: it works
 * with a keyboard and on touch without any extra dependency.
 */
export function OrderedListEditor<T extends OrderedItem>({
  items,
  itemLabel,
  addLabel,
  placeholder,
  emptyMessage,
  isBusy = false,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: OrderedListEditorProps<T>) {
  const toast = useToast();

  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const validate = (value: string): string | null => {
    const result = orderedItemSchema.safeParse({ name: value });
    return result.success ? null : (result.error.issues[0]?.message ?? 'Please enter a valid name.');
  };

  const handleAdd = async () => {
    const problem = validate(newName);
    if (problem) {
      setAddError(problem);
      return;
    }

    const duplicate = items.some((item) => item.name.trim().toLowerCase() === newName.trim().toLowerCase());
    if (duplicate) {
      setAddError(`That ${itemLabel.toLowerCase()} is already in the list.`);
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      await onAdd(newName.trim(), items.length);
      setNewName('');
      toast.success(`${itemLabel} added`);
    } catch (error) {
      toast.error(`Unable to add that ${itemLabel.toLowerCase()}.`, errorMessage(error));
    } finally {
      setIsAdding(false);
    }
  };

  const startEditing = (item: T) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const problem = validate(editingName);
    if (problem) {
      setEditError(problem);
      return;
    }

    setIsSavingEdit(true);

    try {
      await onUpdate(editingId, editingName.trim());
      setEditingId(null);
      toast.success('Changes saved successfully');
    } catch (error) {
      toast.error('Unable to save changes. Please try again.', errorMessage(error));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);

    try {
      await onDelete(pendingDelete.id);
      toast.success(`${itemLabel} deleted`);
      setPendingDelete(null);
    } catch (error) {
      toast.error(`Unable to delete that ${itemLabel.toLowerCase()}.`, errorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);

    try {
      await onReorder(next);
    } catch (error) {
      toast.error('Unable to save the new order.', errorMessage(error));
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-surface-raised p-5 shadow-card sm:p-6">
      <h2 className="font-display text-lg font-semibold text-charcoal">{itemLabel} list</h2>
      <p className="mt-1 text-xs text-muted">
        Changes here are saved to Supabase immediately and appear on the public website right away.
      </p>

      {/* ---- Add ---- */}
      <div className="mt-5">
        <label htmlFor="ordered-add" className="block text-[0.8rem] font-medium text-muted">
          {addLabel}
        </label>

        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
          <input
            id="ordered-add"
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              setAddError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleAdd();
              }
            }}
            placeholder={placeholder}
            maxLength={80}
            aria-invalid={addError ? true : undefined}
            aria-describedby={addError ? 'ordered-add-error' : undefined}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-charcoal placeholder:text-subtle focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />

          <Button
            onClick={() => void handleAdd()}
            isLoading={isAdding}
            loadingText="Adding…"
            leadingIcon={<Plus className="h-4 w-4" />}
            disabled={isBusy}
            className="shrink-0"
          >
            Add
          </Button>
        </div>

        {addError && (
          <p id="ordered-add-error" role="alert" className="mt-1.5 text-xs font-medium text-danger">
            {addError}
          </p>
        )}
      </div>

      {/* ---- List ---- */}
      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState title={`No ${itemLabel.toLowerCase()} yet`} message={emptyMessage} />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((item, index) => {
                const isEditing = editingId === item.id;

                return (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2.5"
                  >
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-[0.75rem] font-semibold text-gold"
                    >
                      {index + 1}
                    </span>

                    {isEditing ? (
                      <div className="min-w-0 flex-1">
                        <input
                          value={editingName}
                          autoFocus
                          onChange={(event) => {
                            setEditingName(event.target.value);
                            setEditError(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void handleSaveEdit();
                            }
                            if (event.key === 'Escape') setEditingId(null);
                          }}
                          maxLength={80}
                          aria-label={`Edit ${itemLabel.toLowerCase()}`}
                          className="w-full rounded-lg border border-gold bg-surface-raised px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/30"
                        />
                        {editError && (
                          <p role="alert" className="mt-1 text-xs font-medium text-danger">
                            {editError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-charcoal">{item.name}</p>
                    )}

                    <div className="flex shrink-0 items-center gap-0.5">
                      {isEditing ? (
                        <>
                          <IconButton
                            label="Save"
                            onClick={() => void handleSaveEdit()}
                            disabled={isSavingEdit}
                            tone="success"
                          >
                            <Check className="h-4 w-4" />
                          </IconButton>
                          <IconButton label="Cancel" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton
                            label={`Move ${item.name} up`}
                            onClick={() => void move(index, -1)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            label={`Move ${item.name} down`}
                            onClick={() => void move(index, 1)}
                            disabled={index === items.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </IconButton>
                          <IconButton label={`Edit ${item.name}`} onClick={() => startEditing(item)}>
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            label={`Delete ${item.name}`}
                            onClick={() => setPendingDelete(item)}
                            tone="danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        destructive
        title={`Delete "${pendingDelete?.name ?? ''}"?`}
        description="This removes it from the public biodata straight away. This cannot be undone."
        confirmLabel="Delete"
        isBusy={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  tone = 'default',
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger' | 'success';
  children: React.ReactNode;
}) {
  const tones = {
    default: 'text-subtle hover:text-charcoal hover:bg-charcoal/5',
    danger: 'text-danger/80 hover:text-danger hover:bg-danger/10',
    success: 'text-success hover:bg-success/10',
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-35 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
