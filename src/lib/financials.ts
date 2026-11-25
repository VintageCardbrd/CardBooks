import { supabase } from '@/lib/supabase';

export async function getFinancials(startDate: string, endDate: string) {
  const { data: sales } = await supabase
    .from('sales')
    .select('sale_total, payout, avg_cost_at_sale, qty, sold_at')
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

  const { data: items } = await supabase.from('item_stats').select('qty_remaining, avg_cost');
  const { data: books } = await supabase.from('budget_books').select('key, value');

  const revenue = (sales || []).reduce((s, r) => s + Number(r.payout ?? r.sale_total ?? 0), 0);
  const cogs = (sales || []).reduce((s, r) => s + Number(r.avg_cost_at_sale || 0) * Number(r.qty || 0), 0);
  const grossProfit = revenue - cogs;

  const cardPurchases = (expenses || []).filter((e) => e.category === 'Card Purchase').reduce((s, e) => s + Number(e.amount || 0), 0);
  const operatingExpenses = (expenses || []).filter((e) => e.category !== 'Card Purchase').reduce((s, e) => s + Number(e.amount || 0), 0);
  const netProfit = grossProfit - operatingExpenses;
  const drawsTotal = (draws || []).reduce((s, d) => s + Number(d.amount || 0), 0);

  // Balance sheet (point in time)
  const inventory = (items || []).reduce((s, i) => s + Number(i.qty_remaining || 0) * Number(i.avg_cost || 0), 0);
  const bookMap: Record<string, number> = {};
  for (const b of books || []) bookMap[b.key] = Number(b.value || 0);
  const checking = bookMap.checking || 0;
  const cardOwed = bookMap.card_owed || 0;
  const assets = checking + inventory;
  const liabilities = cardOwed;
  const equity = assets - liabilities;

  // Cash flow (period)
  const cashIn = revenue;
  const cashOutCards = cardPurchases;
  const cashOutOps = operatingExpenses;
  const cashOutDraws = drawsTotal;
  const operatingCash = cashIn - cashOutOps;
  const investingCash = -cashOutCards;
  const financingCash = -cashOutDraws;
  const netCash = operatingCash + investingCash + financingCash;

  // Expenses by category (excluding card purchases)
  const byCategory: Record<string, number> = {};
  for (const e of expenses || []) {
    if (e.category === 'Card Purchase') continue;
    const cat = e.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount || 0);
  }

  return {
    revenue,
    cogs,
    grossProfit,
    operatingExpenses,
    netProfit,
    cardPurchases,
    drawsTotal,
    inventory,
    checking,
    cardOwed,
    assets,
    liabilities,
    equity,
    cashIn,
    cashOutCards,
    cashOutOps,
    cashOutDraws,
    operatingCash,
    investingCash,
    financingCash,
    netCash,
    byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
  };
}

// Schedule C style mapping
const TAX_MAP: Record<string, string> = {
  Advertising: 'Advertising',
  Meals: 'Meals (50% limit)',
  Mileage: 'Vehicle',
  Supplies: 'Supplies',
  Postage: 'Office expenses',
  Shipping: 'Office expenses',
  Grading: 'Other miscellaneous expenses',
  Fees: 'Commissions',
  Software: 'Office expenses',
  'Startup costs': 'Startup costs',
  'Home office': 'Home office',
  'Legal and professional fees': 'Legal and professional fees',
  'Office expenses': 'Office expenses',
  Interest: 'Credit card, loan, and other interest',
  Commissions: 'Commissions',
  Other: 'Other miscellaneous expenses',
};

const SCHEDULE_C_LINES = [
  'Startup costs',
  'Vehicle',
  'Home office',
  'Assets',
  'Supplies',
  'Advertising',
  'Meals (50% limit)',
  'Legal and professional fees',
  'Office expenses',
  'Credit card, loan, and other interest',
  'Commissions',
  'Inventory',
  'Other miscellaneous expenses',
];

export async function getTaxReport(year: number) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const fin = await getFinancials(start, end);

  const lines: Record<string, number> = {};
  for (const line of SCHEDULE_C_LINES) lines[line] = 0;
  for (const c of fin.byCategory) {
    const line = TAX_MAP[c.category] || 'Other miscellaneous expenses';
    lines[line] = (lines[line] || 0) + c.amount;
  }
  // Inventory is COGS, not an expense
  lines['Inventory'] = fin.cogs;

  return {
    year,
    grossReceipts: fin.revenue,
    cogs: fin.cogs,
    grossProfit: fin.grossProfit,
    expenses: Object.entries(lines).map(([line, amount]) => ({ line, amount })),
    totalExpenses: fin.operatingExpenses,
    netProfit: fin.netProfit,
  };
}
