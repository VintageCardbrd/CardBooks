import { supabase } from '@/lib/supabase';

export async function getPnL(startDate: string, endDate: string) {
  const { data: sales } = await supabase
    .from('sales')
    .select('sale_total, payout, avg_cost_at_sale, qty, sold_at, platform')
    .gte('sold_at', startDate)
    .lte('sold_at', endDate + 'T23:59:59');

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category, spent_at')
    .gte('spent_at', startDate)
    .lte('spent_at', endDate);

  const { data: draws } = await supabase
    .from('draws')
    .select('amount, drawn_at')
    .gte('drawn_at', startDate)
    .lte('drawn_at', endDate);

  const revenue = (sales || []).reduce((s, r) => s + Number(r.payout ?? r.sale_total ?? 0), 0);
  const cogs = (sales || []).reduce((s, r) => s + Number(r.avg_cost_at_sale || 0) * Number(r.qty || 0), 0);
  const grossProfit = revenue - cogs;
  const expenseTotal = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
  const drawsTotal = (draws || []).reduce((s, d) => s + Number(d.amount || 0), 0);
  const netProfit = grossProfit - expenseTotal;

  // Weekly buckets
  const weeks: Record<string, { revenue: number; profit: number; overhead: number; cardPurchases: number }> = {};
  for (const r of sales || []) {
    const d = new Date(r.sold_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = { revenue: 0, profit: 0, overhead: 0, cardPurchases: 0 };
    const rev = Number(r.payout ?? r.sale_total ?? 0);
    const cost = Number(r.avg_cost_at_sale || 0) * Number(r.qty || 0);
    weeks[key].revenue += rev;
    weeks[key].profit += rev - cost;
  }
  for (const e of expenses || []) {
    const d = new Date(e.spent_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = { revenue: 0, profit: 0, overhead: 0, cardPurchases: 0 };
    const amt = Number(e.amount || 0);
    if (e.category === 'Card Purchase') {
      weeks[key].cardPurchases += amt;
    } else {
      weeks[key].overhead += amt;
    }
  }

  const weekly = Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, v]) => ({ week, ...v }));

  // By category
  const byCategory: Record<string, number> = {};
  for (const e of expenses || []) {
    const cat = e.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount || 0);
  }

  // By platform
  const byPlatform: Record<string, { revenue: number; profit: number }> = {};
  for (const r of sales || []) {
    const p = r.platform || 'Other';
    if (!byPlatform[p]) byPlatform[p] = { revenue: 0, profit: 0 };
    const rev = Number(r.payout ?? r.sale_total ?? 0);
    const cost = Number(r.avg_cost_at_sale || 0) * Number(r.qty || 0);
    byPlatform[p].revenue += rev;
    byPlatform[p].profit += rev - cost;
  }

  return {
    revenue,
    cogs,
    grossProfit,
    expenseTotal,
    netProfit,
    drawsTotal,
    weekly,
    byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
    byPlatform: Object.entries(byPlatform).map(([platform, v]) => ({ platform, ...v })),
  };
}
