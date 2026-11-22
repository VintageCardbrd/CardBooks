import { supabase } from '@/lib/supabase';

export async function getDashboardData() {
  const { data: items, error: itemsErr } = await supabase
    .from('item_stats')
    .select('*');

  if (itemsErr) {
    console.error(itemsErr);
    return null;
  }

  const { data: sales, error: salesErr } = await supabase
    .from('sales')
    .select('item_id, sale_total, avg_cost_at_sale, qty, platform, sold_at, payout')
    .order('sold_at', { ascending: false });

  if (salesErr) {
    console.error(salesErr);
    return null;
  }

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  let realizedProfit = 0;
  let ytdProfit = 0;
  let monthProfit = 0;
  let weekProfit = 0;
  let capitalTiedUp = 0;
  let unitsRemaining = 0;
  let unitsSold = 0;

  const aging = {
    '0-30': { units: 0, cost: 0 },
    '31-60': { units: 0, cost: 0 },
    '61-90': { units: 0, cost: 0 },
    '91-180': { units: 0, cost: 0 },
    '180+': { units: 0, cost: 0 },
  };

  const oldest: { id: string; name: string; days: number; cost: number }[] = [];

  for (const item of items || []) {
    const remaining = Number(item.qty_remaining || 0);
    const avg = Number(item.avg_cost || 0);
    const cost = remaining * avg;
    capitalTiedUp += cost;
    unitsRemaining += remaining;
    unitsSold += Number(item.qty_sold || 0);
    realizedProfit += Number(item.realized_profit || 0);

    if (remaining > 0 && item.date_in) {
      const days = Math.floor((now.getTime() - new Date(item.date_in).getTime()) / 86400000);
      let bucket: keyof typeof aging = '180+';
      if (days <= 30) bucket = '0-30';
      else if (days <= 60) bucket = '31-60';
      else if (days <= 90) bucket = '61-90';
      else if (days <= 180) bucket = '91-180';
      aging[bucket].units += remaining;
      aging[bucket].cost += cost;

      oldest.push({
        id: item.id,
        name: item.name,
        days,
        cost,
      });
    }
  }

  oldest.sort((a, b) => b.days - a.days);

  for (const sale of sales || []) {
    const soldAt = new Date(sale.sold_at);
    const revenue = Number(sale.payout ?? sale.sale_total ?? 0);
    const cogs = Number(sale.avg_cost_at_sale || 0) * Number(sale.qty || 0);
    const profit = revenue - cogs;

    if (soldAt >= startOfYear) ytdProfit += profit;
    if (soldAt >= startOfMonth) monthProfit += profit;
    if (soldAt >= startOfWeek) weekProfit += profit;
  }

  // Median days to sell (for items that have sold)
  const daysToSell: number[] = [];
  for (const item of items || []) {
    if (Number(item.qty_sold) > 0 && item.date_in) {
      // Use the most recent sale date for this item if available, otherwise approximate
      const itemSales = (sales || []).filter((s) => s.item_id === item.id);
      if (itemSales.length > 0) {
        const firstSale = new Date(Math.min(...itemSales.map((s) => new Date(s.sold_at).getTime())));
        const days = Math.floor((firstSale.getTime() - new Date(item.date_in).getTime()) / 86400000);
        if (days >= 0) daysToSell.push(days);
      }
    }
  }
  daysToSell.sort((a, b) => a - b);
  const medianDays = daysToSell.length
    ? daysToSell[Math.floor(daysToSell.length / 2)]
    : 0;

  const sellThrough = unitsRemaining + unitsSold > 0
    ? (unitsSold / (unitsRemaining + unitsSold)) * 100
    : 0;

  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  const soldIn = (n: number) =>
    (sales || []).filter((s) => new Date(s.sold_at) >= daysAgo(n)).reduce((sum, s) => sum + Number(s.qty || 0), 0);

  // Approximate window sell-through: units sold in window / (units remaining + units sold in window)
  const windowST = (n: number) => {
    const sold = soldIn(n);
    const denom = unitsRemaining + sold;
    return denom > 0 ? (sold / denom) * 100 : 0;
  };

  return {
    realizedProfit,
    ytdProfit,
    monthProfit,
    weekProfit,
    capitalTiedUp,
    netPosition: realizedProfit - capitalTiedUp,
    sellThrough,
    medianDays,
    unitsRemaining,
    unitsSold,
    aging,
    oldest: oldest.slice(0, 8),
    sellThrough30: soldIn(30),
    sellThrough60: soldIn(60),
    sellThrough90: soldIn(90),
    st30pct: windowST(30),
    st60pct: windowST(60),
    st90pct: windowST(90),
  };
}
