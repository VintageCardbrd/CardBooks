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
  return data;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}
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
