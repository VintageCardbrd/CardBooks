import { supabase } from '@/lib/supabase';

export async function getStreams(limit = 50) {
  const { data, error } = await supabase
    .from('streams')
    .select('*')
    .order('stream_date', { ascending: false })
    .limit(limit);
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function addStream(stream: {
  platform: string;
  gross_sales?: number;
  auctions_ran?: number;
  num_sales?: number;
  notes?: string;
  stream_date?: string;
}) {
  const { data, error } = await supabase
    .from('streams')
    .insert([{
      ...stream,
      stream_date: stream.stream_date || new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getWeeklyProfit() {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('sales')
    .select('sale_total, avg_cost_at_sale, qty, payout, sold_at')
    .gte('sold_at', start.toISOString());

  if (error) return 0;

  return (data || []).reduce((sum, s) => {
    const revenue = Number(s.payout ?? s.sale_total ?? 0);
    const cogs = Number(s.avg_cost_at_sale || 0) * Number(s.qty || 0);
    return sum + (revenue - cogs);
  }, 0);
}
