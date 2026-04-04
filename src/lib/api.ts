import { hasSupabaseConfig, supabase } from './supabase';

export type AthleteRecord = {
  id: string;
  name: string;
  position: string | null;
  score: number | null;
  highlight_url: string | null;
};

export type StatsRecord = {
  id: string;
  athlete_id: string;
  spikes: number;
  sets: number;
  serves: number;
  errors: number;
};

export type SubscriptionRecord = {
  id: string;
  user_id: string | null;
  customer_email: string;
  plan_key: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  price_id: string | null;
  current_period_end: string | null;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

export function isSupabaseConfigured() {
  return hasSupabaseConfig();
}

export async function getAthlete(id: string) {
  if (!id) return null;

  const client = requireSupabase();
  const { data, error } = await client.from('athletes').select('*').eq('id', id).single();

  if (error) throw error;
  return data as AthleteRecord | null;
}

export async function getStats(id: string) {
  if (!id) return null;

  const client = requireSupabase();
  const { data, error } = await client.from('stats').select('*').eq('athlete_id', id).single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as StatsRecord | null) ?? null;
}

export async function getAthletes(searchQuery = '') {
  const client = requireSupabase();
  let query = client.from('athletes').select('*').order('score', { ascending: false }).limit(8);

  if (searchQuery.trim()) {
    const term = `%${searchQuery.trim()}%`;
    query = query.or(`name.ilike.${term},position.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as AthleteRecord[] | null) ?? [];
}

export async function getStatsForAthletes(athleteIds: string[]) {
  if (!athleteIds.length) return [];

  const client = requireSupabase();
  const { data, error } = await client.from('stats').select('*').in('athlete_id', athleteIds);

  if (error) throw error;
  return (data as StatsRecord[] | null) ?? [];
}

export async function getActiveSubscriptions({
  userId,
  customerEmail,
}: {
  userId?: string | null;
  customerEmail?: string | null;
}) {
  const normalizedEmail = customerEmail?.trim().toLowerCase() ?? '';
  if (!userId && !normalizedEmail) return [];

  const client = requireSupabase();
  let query = client
    .from('subscriptions')
    .select('*')
    .in('status', ['active', 'trialing']);

  query = userId ? query.eq('user_id', userId) : query.eq('customer_email', normalizedEmail);

  const { data, error } = await query;

  if (error && error.code !== 'PGRST116') throw error;
  return (data as SubscriptionRecord[] | null) ?? [];
}
