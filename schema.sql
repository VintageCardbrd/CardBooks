-- ============================================================
-- CardBooks - Clean Database Schema
-- ============================================================
-- Run this in the Supabase SQL Editor (or via migration)
-- ============================================================

-- Enable useful extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- for fast search

-- ------------------------------------------------------------
-- PLATFORM FEES (settings)
-- ------------------------------------------------------------
create table platform_fees (
  platform        text primary key,
  fee_pct         numeric(6,4) not null default 0,
  per_order       numeric(10,2) not null default 0,
  notes           text,
  updated_at      timestamptz default now()
);

insert into platform_fees (platform, fee_pct, per_order, notes) values
  ('eBay',          0.1335, 0.40, 'Update to your real rates'),
  ('Whatnot',       0.0800, 0.30, 'Update to your real rates'),
  ('FB Marketplace',0.0000, 0.00, 'Local cash usually 0'),
  ('Other',         0.0000, 0.00, '');

-- ------------------------------------------------------------
-- LOTS
-- ------------------------------------------------------------
create table lots (
  id              text primary key,               -- L001, L002...
  vendor          text,
  lot_type        text,                           -- eBay Lot, Collection, Card Show, etc.
  actual_cost     numeric(12,2) not null default 0,
  notes           text,
  prefix          text,                           -- optional ID prefix for auto-linking
  purchased_at    date default current_date,
  created_at      timestamptz default now()
);

create table lot_allocations (
  id              uuid primary key default uuid_generate_v4(),
  lot_id          text not null references lots(id) on delete cascade,
  channel         text not null,                  -- eBay, Whatnot, Set, Bulk, PC
  est_resale      numeric(12,2) not null default 0,
  est_cards       int,
  notes           text,
  created_at      timestamptz default now()
);

create table lot_transfers (
  id              uuid primary key default uuid_generate_v4(),
  lot_id          text not null references lots(id) on delete cascade,
  bin_id          text,                           -- WNBX1, etc.
  cards           int,
  amount          numeric(12,2) not null default 0,
  notes           text,
  transferred_at  date default current_date,
  created_at      timestamptz default now()
);

-- ------------------------------------------------------------
-- INVENTORY ITEMS
-- ------------------------------------------------------------
create table items (
  id              text primary key,               -- A0001, A0002...
  category        text not null default 'Card',   -- Card, Wax, Bulk Lot, Other
  name            text not null,
  qty_bought      int not null default 0,
  total_cost      numeric(12,2) not null default 0,
  date_in         date default current_date,
  date_listed     date,
  notes           text,
  lot_id          text references lots(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index items_lot_id_idx on items(lot_id);
create index items_category_idx on items(category);
create index items_name_trgm_idx on items using gin (name gin_trgm_ops);

-- ------------------------------------------------------------
-- SALES
-- ------------------------------------------------------------
create table sales (
  id              uuid primary key default uuid_generate_v4(),
  item_id         text not null references items(id),
  qty             int not null default 1,
  sale_total      numeric(12,2) not null,         -- qty * price each
  platform        text not null default 'Other',
  ship_charged    numeric(10,2) default 0,
  ship_cost       numeric(10,2) default 0,
  avg_cost_at_sale numeric(12,4),                 -- snapshot of avg cost at time of sale
  payout          numeric(12,2),                  -- optional actual payout override
  sold_at         timestamptz default now(),
  created_at      timestamptz default now()
);

create index sales_item_id_idx on sales(item_id);
create index sales_sold_at_idx on sales(sold_at);
create index sales_platform_idx on sales(platform);

-- ------------------------------------------------------------
-- EXPENSES
-- ------------------------------------------------------------
create table expenses (
  id              uuid primary key default uuid_generate_v4(),
  category        text not null,                  -- Card Purchase, Supplies, Grading, Postage...
  vendor          text,
  amount          numeric(12,2) not null,
  charged_to_card boolean not null default false,
  cards           int,                            -- optional # of cards (for sourcing)
  notes           text,
  spent_at        date default current_date,
  created_at      timestamptz default now()
);

create index expenses_spent_at_idx on expenses(spent_at);
create index expenses_category_idx on expenses(category);

-- ------------------------------------------------------------
-- BUDGET / ENVELOPES
-- ------------------------------------------------------------
create table budget_books (
  key             text primary key,               -- checking, card_owed, inventory_opening, etc.
  value           numeric(12,2) not null default 0,
  updated_at      timestamptz default now()
);

-- Seed sensible defaults (you will update these)
insert into budget_books (key, value) values
  ('opening_date', 0),          -- store as epoch days or handle in app
  ('checking', 0),
  ('card_owed', 0),
  ('inventory_opening', 0),
  ('operations_opening', 0),
  ('paycheck_opening', 0),
  ('debt_opening', 0);

create table budget_moves (
  id              uuid primary key default uuid_generate_v4(),
  move_type       text not null,                  -- Move, Card Payment, Adjustment
  from_envelope   text,
  to_envelope     text,
  amount          numeric(12,2) not null,
  note            text,
  moved_at        date default current_date,
  created_at      timestamptz default now()
);

create table draws (
  id              uuid primary key default uuid_generate_v4(),
  amount          numeric(12,2) not null,
  notes           text,
  drawn_at        date default current_date,
  created_at      timestamptz default now()
);

-- ------------------------------------------------------------
-- MILEAGE
-- ------------------------------------------------------------
create table mileage_presets (
  id              uuid primary key default uuid_generate_v4(),
  category        text not null,                  -- Stores, Card Shows, Card Shops
  destination     text not null,
  miles           numeric(6,1) not null,
  purpose         text,
  created_at      timestamptz default now()
);

create table mileage_trips (
  id              uuid primary key default uuid_generate_v4(),
  category        text,
  destination     text,
  miles           numeric(6,1) not null,
  purpose         text,
  note            text,
  trip_date       date default current_date,
  created_at      timestamptz default now()
);

-- ------------------------------------------------------------
-- STREAMS (for scoreboard)
-- ------------------------------------------------------------
create table streams (
  id              uuid primary key default uuid_generate_v4(),
  platform        text not null,                  -- Whatnot, eBay Live, Other
  gross_sales     numeric(12,2) default 0,
  auctions_ran    int default 0,
  num_sales       int default 0,
  notes           text,
  stream_date     date default current_date,
  created_at      timestamptz default now()
);

-- ------------------------------------------------------------
-- SETS (simplified)
-- ------------------------------------------------------------
create table sets (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,                  -- 1974 Topps
  year            int,
  total_cards     int,
  created_at      timestamptz default now()
);

create table set_cards (
  id              uuid primary key default uuid_generate_v4(),
  set_id          uuid not null references sets(id) on delete cascade,
  card_number     int not null,
  player_name     text,
  is_key          boolean default false,
  status          text not null default 'Need',   -- Need, Have, Upgrade
  condition       text,
  target_price    numeric(10,2),
  acquired_at     date,
  notes           text,
  unique(set_id, card_number)
);

create table set_purchases (
  id              uuid primary key default uuid_generate_v4(),
  set_id          uuid not null references sets(id) on delete cascade,
  source          text,
  amount          numeric(12,2) not null,
  cards_added     int,
  notes           text,
  purchased_at    date default current_date,
  created_at      timestamptz default now()
);

-- ============================================================
-- HELPER VIEWS (the real power for dashboards)
-- ============================================================

-- Current quantity remaining and average cost per item
create or replace view item_stats as
select
  i.id,
  i.category,
  i.name,
  i.qty_bought,
  i.total_cost,
  case when i.qty_bought > 0 then round(i.total_cost / i.qty_bought, 4) else 0 end as avg_cost,
  coalesce(s.qty_sold, 0) as qty_sold,
  i.qty_bought - coalesce(s.qty_sold, 0) as qty_remaining,
  coalesce(s.revenue, 0) as revenue,
  coalesce(s.profit, 0) as realized_profit,
  i.date_in,
  i.date_listed,
  i.lot_id,
  i.notes,
  case
    when (i.qty_bought - coalesce(s.qty_sold, 0)) <= 0 then 'Sold Out'
    when coalesce(s.qty_sold, 0) > 0 then 'Partial'
    when i.date_listed is not null then 'Listed'
    else 'In Stock'
  end as status
from items i
left join (
  select
    item_id,
    sum(qty) as qty_sold,
    sum(coalesce(payout, sale_total)) as revenue,
    sum(coalesce(payout, sale_total) - (qty * avg_cost_at_sale)) as profit
  from sales
  group by item_id
) s on s.item_id = i.id;

-- Sales with fees calculated
create or replace view sales_detailed as
select
  s.*,
  i.name as item_name,
  i.category,
  pf.fee_pct,
  pf.per_order,
  round( (s.sale_total + coalesce(s.ship_charged,0)) * coalesce(pf.fee_pct,0) + coalesce(pf.per_order,0) , 2) as fees,
  case
    when s.payout is not null then s.payout
    else (s.sale_total + coalesce(s.ship_charged,0))
         - round( (s.sale_total + coalesce(s.ship_charged,0)) * coalesce(pf.fee_pct,0) + coalesce(pf.per_order,0) , 2)
         - coalesce(s.ship_cost,0)
  end as net_proceeds,
  (s.qty * s.avg_cost_at_sale) as cogs
from sales s
join items i on i.id = s.item_id
left join platform_fees pf on pf.platform = s.platform;

-- ============================================================
-- INDEXES & PERFORMANCE
-- ============================================================
create index lot_allocations_lot_id_idx on lot_allocations(lot_id);
create index lot_transfers_lot_id_idx on lot_transfers(lot_id);
create index mileage_trips_trip_date_idx on mileage_trips(trip_date);
create index streams_stream_date_idx on streams(stream_date);

-- ============================================================
-- DONE
-- ============================================================
-- Next: Create the Next.js application that talks to these tables.
