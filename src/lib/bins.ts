import { supabase } from '@/lib/supabase';

export async function getBins() {
  const { data, error } = await supabase
    .from('lot_transfers')
    .select('bin_id')
    .not('bin_id', 'is', null)
    .order('bin_id');

  if (error) return [];
  const unique = [...new Set((data || []).map((r: any) => r.bin_id).filter(Boolean))];
  return unique as string[];
}

export async function moveToBin(params: {
  item_id: string;
  lot_id: string | null;
  bin_id: string;
  qty: number;
  amount?: number;
  notes?: string;
}) {
  // For now we record the transfer. In a fuller version this could also
  // reduce inventory or create a new bulk item. This matches the current
  // "move to bin" logging behavior.
  const { data, error } = await supabase
    .from('lot_transfers')
    .insert([{
      lot_id: params.lot_id || 'UNASSIGNED',
      bin_id: params.bin_id,
      cards: params.qty,
      amount: params.amount || 0,
      notes: params.notes || `Moved from item ${params.item_id}`,
      transferred_at: new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
