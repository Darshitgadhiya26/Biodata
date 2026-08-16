import { assertSupabaseConfigured, supabase } from '@/lib/supabase';
import type { MaternalRelative } from '@/types';
import { toBiodataError } from './errors';

const TABLE = 'maternal_relatives';

export async function getMaternalRelatives(biodataId: string): Promise<MaternalRelative[]> {
  assertSupabaseConfigured();
  if (!biodataId) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('biodata_id', biodataId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw toBiodataError(error, 'Unable to load maternal details. Please try again.');
  return data ?? [];
}

export async function addMaternalRelative(
  biodataId: string,
  name: string,
  displayOrder: number,
): Promise<MaternalRelative> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ biodata_id: biodataId, name: name.trim(), display_order: displayOrder })
    .select('*')
    .single();

  if (error) throw toBiodataError(error, 'Unable to add that relative. Please try again.');
  return data;
}

export async function updateMaternalRelative(id: string, name: string): Promise<MaternalRelative> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from(TABLE)
    .update({ name: name.trim() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw toBiodataError(error, 'Unable to update that relative. Please try again.');
  return data;
}

export async function deleteMaternalRelative(id: string): Promise<void> {
  assertSupabaseConfigured();

  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw toBiodataError(error, 'Unable to delete that relative. Please try again.');
}

export async function reorderMaternalRelatives(
  items: Array<{ id: string; display_order: number }>,
): Promise<void> {
  assertSupabaseConfigured();
  if (items.length === 0) return;

  const results = await Promise.all(
    items.map((item) => supabase.from(TABLE).update({ display_order: item.display_order }).eq('id', item.id)),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw toBiodataError(failed.error, 'Unable to save the new order. Please try again.');
}

/** Replaces the whole list — used by "Reset to default". */
export async function replaceMaternalRelatives(biodataId: string, names: string[]): Promise<void> {
  assertSupabaseConfigured();

  const { error: deleteError } = await supabase.from(TABLE).delete().eq('biodata_id', biodataId);
  if (deleteError) throw toBiodataError(deleteError, 'Unable to reset maternal details. Please try again.');

  if (names.length === 0) return;

  const { error: insertError } = await supabase
    .from(TABLE)
    .insert(names.map((name, index) => ({ biodata_id: biodataId, name: name.trim(), display_order: index })));

  if (insertError) throw toBiodataError(insertError, 'Unable to reset maternal details. Please try again.');
}
