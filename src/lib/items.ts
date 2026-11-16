import { supabase } from '@/lib/supabase';
import type { ItemStats } from '@/types';

export async function getItems(): Promise<ItemStats[]> {
  const { data, error } = await supabase
    .from('item_stats')
    .select('*')
    .order('date_in', { ascending: false });

  if (error) {
    console.error('Error fetching items:', error);
    return [];
  }
  return data || [];
}

export async function addItem(item: {
  id: string;
  name: string;
  category: string;
  qty_bought: number;
  total_cost: number;
  notes?: string;
  lot_id?: string;
}) {
  const { data, error } = await supabase
    .from('items')
    .insert([{
      ...item,
      date_in: new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getNextItemId(): Promise<string> {
  const { data } = await supabase
    .from('items')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return 'A0001';

  const last = data[0].id;
  const match = last.match(/^([A-Z]+)(\d+)$/);
  if (!match) return 'A0001';

  const prefix = match[1];
  const num = parseInt(match[2], 10) + 1;
  return prefix + String(num).padStart(4, '0');
}
