import { supabase } from '@/lib/supabase';
import type { Sale } from '@/types';

export async function logSale(sale: {
  item_id: string;
  qty: number;
  sale_total: number;
  platform: string;
  ship_charged?: number;
  ship_cost?: number;
  payout?: number;
}) {
  // Snapshot average cost at time of sale
  const { data: item } = await supabase
    .from('item_stats')
    .select('avg_cost')
    .eq('id', sale.item_id)
    .single();

  const avgCost = item?.avg_cost || 0;

  const { data, error } = await supabase
    .from('sales')
    .insert([{
      ...sale,
      avg_cost_at_sale: avgCost,
      sold_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSales(itemId?: string): Promise<Sale[]> {
  let query = supabase
    .from('sales')
    .select('*')
    .order('sold_at', { ascending: false });

  if (itemId) {
    query = query.eq('item_id', itemId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
  return data || [];
}

export async function deleteSale(id: string) {
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
}

export async function getRecentSales(limit = 50) {
  const { data, error } = await supabase
    .from('sales')
    .select('*, items(name)')
    .order('sold_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}
