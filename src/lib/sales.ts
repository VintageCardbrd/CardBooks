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

  // Allocate payout to budget envelopes
  const payout = sale.payout ?? sale.sale_total;
  if (payout > 0) {
    await allocateToBudget(payout);
  }

  return data;
}

export async function logRefund(refund: {
  item_id: string;
  amount: number;
  reason?: string;
  platform?: string;
}) {
  const { data, error } = await supabase
    .from('sales')
    .insert([{
      item_id: refund.item_id,
      qty: 0,
      sale_total: -Math.abs(refund.amount),
      platform: refund.platform || 'Refund',
      payout: -Math.abs(refund.amount),
      avg_cost_at_sale: 0,
      sold_at: new Date().toISOString(),
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function allocateToBudget(amount: number) {
  const { data: settings } = await supabase
    .from('budget_books')
    .select('key, value')
    .in('key', ['alloc_inventory', 'alloc_operations', 'alloc_paycheck']);

  const alloc = {
    inventory: 0.65,
    operations: 0.20,
    paycheck: 0.15,
  };
  for (const s of settings || []) {
    if (s.key === 'alloc_inventory') alloc.inventory = Number(s.value) / 100;
    if (s.key === 'alloc_operations') alloc.operations = Number(s.value) / 100;
    if (s.key === 'alloc_paycheck') alloc.paycheck = Number(s.value) / 100;
  }

  const updates = [
    { key: 'inventory', add: amount * alloc.inventory },
    { key: 'operations', add: amount * alloc.operations },
    { key: 'paycheck', add: amount * alloc.paycheck },
  ];

  for (const u of updates) {
    const { data: current } = await supabase
      .from('budget_books')
      .select('value')
      .eq('key', u.key)
      .single();
    const newVal = (current?.value || 0) + u.add;
    await supabase.from('budget_books').upsert({ key: u.key, value: newVal, updated_at: new Date().toISOString() });
  }
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
