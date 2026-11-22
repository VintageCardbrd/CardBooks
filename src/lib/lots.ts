import { supabase } from '@/lib/supabase';

export async function getLots() {
  const { data, error } = await supabase
    .from('lots')
    .select('*')
    .order('purchased_at', { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function addLot(lot: {
  id: string;
  vendor?: string;
  lot_type?: string;
  actual_cost: number;
  notes?: string;
  purchased_at?: string;
}) {
  const { data, error } = await supabase
    .from('lots')
    .insert([{
      ...lot,
      purchased_at: lot.purchased_at || new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getNextLotId() {
  const { data } = await supabase
    .from('lots')
    .select('id')
    .order('id', { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return 'L001';
  const last = data[0].id;
  const num = parseInt(last.replace(/\D/g, '')) || 0;
  return `L${String(num + 1).padStart(3, '0')}`;
}
