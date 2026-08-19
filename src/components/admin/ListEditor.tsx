import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { cn } from '@/utils/cn';

interface ListEditorProps {
  items: string[];
  itemLabel: string;
  addLabel: string;
  placeholder: string;
  emptyMessage: string;
  /** Per-item schema errors, keyed by index. */
  errors?: Record<number, string>;
  onChange: (items: string[]) => void;
}

/**
 * Add / edit / delete / reorder for a list of plain strings — the hobbies and
 * maternal-relative editors are the same widget.
 *
 * Every change goes straight into the draft; nothing is written to GitHub until
 * "Publish Changes" is used.
 */
export function ListEditor({
  items,
  itemLabel,
  addLabel,
  placeholder,
  emptyMessage,
  errors = {},
  onChange,
}: ListEditorProps) {
  const [newValue, setNewValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const add = () => {
    const value = newValue.trim();
    if (!value) return;
    onChange([...items, value]);
    setNewValue('');
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(items[index]);
  };

  const commitEdit = () => {
    if (editingIndex === null) return;
    const value = editingValue.trim();
    if (value) {
      const next = [...items];
      next[editingIndex] = value;
      onChange(next);
    }
    setEditingIndex(null);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, position) => position !== index));
    setEditingIndex(null);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setEditingIndex(null);
  };

  const inputClasses =
    'w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-charcoal ' +
    'placeholder:text-subtle focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30';

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <EmptyState title={emptyMessage} message={`Use the field below to add your first ${itemLabel}.`} />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {items.map((item, index) => {
              const isEditing = editingIndex === index;
              const error = errors[index];

              return (
                <motion.li
                  key={`${index}-${item}`}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border bg-surface p-2.5',
                    error ? 'border-danger/60' : 'border-line',
                  )}
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-[0.7rem] font-semibold text-gold"
                  >
                    {index + 1}
                  </span>

                  {isEditing ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          commitEdit();
                        }
                        if (event.key === 'Escape') setEditingIndex(null);
                      }}
                      aria-label={`Edit ${itemLabel} ${index + 1}`}
                      className={cn(inputClasses, 'py-1.5')}
                    />
                  ) : (
                    <span className="min-w-0 flex-1 break-words text-sm text-charcoal">{item}</span>
                  )}

                  <div className="flex shrink-0 items-center gap-0.5">
                    {isEditing ? (
                      <>
                        <IconButton label="Save" onClick={commitEdit}>
                          <Check className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Cancel" onClick={() => setEditingIndex(null)}>
                          <X className="h-4 w-4" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          label={`Move ${itemLabel} ${index + 1} up`}
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={`Move ${itemLabel} ${index + 1} down`}
                          onClick={() => move(index, 1)}
                          disabled={index === items.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </IconButton>
                        <IconButton label={`Edit ${itemLabel} ${index + 1}`} onClick={() => startEditing(index)}>
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={`Delete ${itemLabel} ${index + 1}`}
                          onClick={() => remove(index)}
                          destructive
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

      {Object.entries(errors).map(([index, message]) => (
        <p key={index} role="alert" className="text-xs font-medium text-danger">
          {itemLabel} {Number(index) + 1}: {message}
        </p>
      ))}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={addLabel}
          className={inputClasses}
        />
        <Button
          variant="secondary"
          onClick={add}
          disabled={newValue.trim().length === 0}
          leadingIcon={<Plus className="h-4 w-4" />}
          className="shrink-0"
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
  disabled,
  destructive,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-subtle transition-colors',
        'hover:bg-charcoal/5 hover:text-charcoal disabled:pointer-events-none disabled:opacity-30',
        destructive && 'hover:bg-danger/10 hover:text-danger',
      )}
    >
      {children}
    </button>
  );
}
