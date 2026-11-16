// ============================================================
// CardBooks - Core Types
// ============================================================

export type Category = 'Card' | 'Wax' | 'Bulk Lot' | 'Other';
export type Platform = 'eBay' | 'Whatnot' | 'FB Marketplace' | 'Other';
export type ItemStatus = 'In Stock' | 'Listed' | 'Partial' | 'Sold Out';
export type Envelope = 'inventory' | 'ops' | 'pay' | 'debt';

export interface Item {
  id: string;
  category: Category;
  name: string;
  qty_bought: number;
  total_cost: number;
  date_in: string | null;
  date_listed: string | null;
  notes: string | null;
  lot_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ItemStats extends Item {
  avg_cost: number;
  qty_sold: number;
  qty_remaining: number;
  revenue: number;
  realized_profit: number;
  status: ItemStatus;
}

export interface Sale {
  id: string;
  item_id: string;
  qty: number;
  sale_total: number;
  platform: Platform;
  ship_charged: number | null;
  ship_cost: number | null;
  avg_cost_at_sale: number | null;
  payout: number | null;
  sold_at: string;
}

export interface SaleDetailed extends Sale {
  item_name: string;
  category: string;
  fee_pct: number;
  per_order: number;
  fees: number;
  net_proceeds: number;
  cogs: number;
}

export interface Lot {
  id: string;
  vendor: string | null;
  lot_type: string | null;
  actual_cost: number;
  notes: string | null;
  prefix: string | null;
  purchased_at: string | null;
}

export interface LotAllocation {
  id: string;
  lot_id: string;
  channel: string;
  est_resale: number;
  est_cards: number | null;
  notes: string | null;
}

export interface LotTransfer {
  id: string;
  lot_id: string;
  bin_id: string | null;
  cards: number | null;
  amount: number;
  notes: string | null;
  transferred_at: string | null;
}

export interface Expense {
  id: string;
  category: string;
  vendor: string | null;
  amount: number;
  charged_to_card: boolean;
  cards: number | null;
  notes: string | null;
  spent_at: string;
}

export interface PlatformFee {
  platform: string;
  fee_pct: number;
  per_order: number;
  notes: string | null;
}

// Dashboard types
export interface ProfitSummary {
  realizedProfit: number;
  ytdProfit: number;
  monthProfit: number;
  weekProfit: number;
  capitalTiedUp: number;
  netPosition: number;
  sellThrough: number;
}

export interface InventoryHealth {
  unitsRemaining: number;
  unitsSold: number;
  capitalTiedUp: number;
  medianDaysToSell: number;
  avgDaysToSell: number;
  sellThrough30: number;
  sellThrough60: number;
  sellThrough90: number;
  aging: {
    label: string;
    units: number;
    cost: number;
  }[];
  oldestUnsold: {
    id: string;
    name: string;
    days: number;
    cost: number;
  }[];
}
