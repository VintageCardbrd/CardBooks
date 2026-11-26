import { supabase } from '@/lib/supabase';

export async function getExpenses(limit = 100) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('spent_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function addExpense(expense: {
  category: string;
  vendor?: string;
  amount: number;
  charged_to_card?: boolean;
  notes?: string;
  spent_at?: string;
}) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      ...expense,
      spent_at: expense.spent_at || new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();
  if (error) throw error;

  if (expense.charged_to_card) {
    // Add to card balance
    const { data: book } = await supabase.from('budget_books').select('value').eq('key', 'card_owed').single();
    const current = Number(book?.value || 0);
    await supabase.from('budget_books').upsert({ key: 'card_owed', value: current + expense.amount, updated_at: new Date().toISOString() });
  } else {
    // Deduct from checking
    const { data: book } = await supabase.from('budget_books').select('value').eq('key', 'checking').single();
    const current = Number(book?.value || 0);
    await supabase.from('budget_books').upsert({ key: 'checking', value: current - expense.amount, updated_at: new Date().toISOString() });
  }

  return data;
}

export async function logCardPayment(amount: number, notes?: string) {
  // Reduce card owed and deduct from checking
  const { data: card } = await supabase.from('budget_books').select('value').eq('key', 'card_owed').single();
  const { data: checking } = await supabase.from('budget_books').select('value').eq('key', 'checking').single();
  const cardCurrent = Number(card?.value || 0);
  const checkingCurrent = Number(checking?.value || 0);

  await supabase.from('budget_books').upsert({ key: 'card_owed', value: Math.max(0, cardCurrent - amount), updated_at: new Date().toISOString() });
  await supabase.from('budget_books').upsert({ key: 'checking', value: checkingCurrent - amount, updated_at: new Date().toISOString() });

  // Log as a budget move for history
  await supabase.from('budget_moves').insert([{
    move_type: 'Card Payment',
    from_envelope: 'checking',
    to_envelope: 'card_owed',
    amount,
    note: notes || 'Card payment',
  }]);
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function getBudgetBooks() {
  const { data, error } = await supabase
    .from('budget_books')
    .select('*')
    .order('key');
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function updateBudgetBook(key: string, value: number) {
  const { data, error } = await supabase
    .from('budget_books')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFixedCosts() {
  const { data, error } = await supabase
    .from('fixed_costs')
    .select('*')
    .order('name');
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function addFixedCost(cost: { name: string; amount: number; frequency: string }) {
  const { data, error } = await supabase
    .from('fixed_costs')
    .insert([cost])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFixedCost(id: string, cost: { name: string; amount: number; frequency: string }) {
  const { data, error } = await supabase
    .from('fixed_costs')
    .update(cost)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFixedCost(id: string) {
  const { error } = await supabase.from('fixed_costs').delete().eq('id', id);
  if (error) throw error;
}
  const { data, error } = await supabase
    .from('budget_books')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}
