# CardBooks

Personal sports card dealer operating system.

Clean replacement for the Google Apps Script + Spreadsheet system.  
Designed so you can run both in parallel and migrate when ready (2027).

---

## What CardBooks Includes

### Core
- Inventory (quantity + average-cost model)
- Sales tracking (fees, shipping, payout override, profit)
- Lots + value-weighted channel allocations + bulk bin transfers
- Expenses

### Financial
- Budget envelopes (Inventory / Operations / Paycheck / Debt)
- Full Profit & Capital visibility

### Operations
- Mileage log + presets
- Streams log (for scoreboard)
- Simplified set tracking

### Executive Dashboards
1. **Profit & Capital Command Center**
2. **Inventory Health & Velocity**

---

## Tech Stack (you don’t need to understand this)

- **Database**: Supabase (Postgres) – free tier is fine
- **App**: Next.js + TypeScript + Tailwind
- **Hosting**: Vercel (free)

Access is via secret link (no login required), same style as your current Google web app.

---

## Setup Overview (I’ll guide you step-by-step later)

1. Create a free Supabase project
2. Run the `schema.sql` file in the SQL Editor
3. Create a free Vercel account and connect this project
4. Add two environment variables
5. Deploy

That’s the entire technical setup. I’ll give you exact clicks and copy-paste values when we reach that stage.

---

## Project Structure

```
CardBooks/
├── schema.sql                 ← Database structure (already created)
├── README.md                  ← This file
├── package.json
├── .env.local.example
├── src/
│   ├── app/                   ← Pages & dashboards
│   ├── components/            ← UI pieces
│   ├── lib/                   ← Database helpers & calculations
│   └── types/                 ← TypeScript types
└── scripts/
    └── migrate-from-sheets.ts ← Future one-time import from your current system
```

---

## Current Status

- [x] Database schema designed and written
- [ ] Next.js project scaffold
- [ ] Core inventory + sales + lots screens
- [ ] Executive dashboards
- [ ] Budget / mileage / scoreboard
- [ ] Migration scripts from Google Sheets
- [ ] Setup guide for non-technical users

---

## Next Step

I am now generating the actual application code.
