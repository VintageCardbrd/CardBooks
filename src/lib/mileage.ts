import { supabase } from '@/lib/supabase';

export async function getMileageTrips(limit = 100) {
  const { data, error } = await supabase
    .from('mileage_trips')
    .select('*')
    .order('trip_date', { ascending: false })
    .limit(limit);
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function addMileageTrip(trip: {
  category?: string;
  destination?: string;
  miles: number;
  purpose?: string;
  note?: string;
  trip_date?: string;
}) {
  const { data, error } = await supabase
    .from('mileage_trips')
    .insert([{
      ...trip,
      trip_date: trip.trip_date || new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}
