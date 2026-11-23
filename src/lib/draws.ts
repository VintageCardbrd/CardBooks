import { supabase } from '@/lib/supabase';

export async function getDraws(limit = 100) {
  const { data, error } = await supabase
    .from('draws')
    .select('*')
    .order('drawn_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function addDraw(draw: { amount: number; notes?: string; drawn_at?: string }) {
  const { data, error } = await supabase
    .from('draws')
    .insert([{
      ...draw,
      drawn_at: draw.drawn_at || new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDraw(id: string) {
  const { error } = await supabase.from('draws').delete().eq('id', id);
  if (error) throw error;
}
