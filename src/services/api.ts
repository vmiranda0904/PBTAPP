import type { AthleteRecord } from '@/types';
import {
  getActiveSubscriptions as getActiveSubscriptionsFromLib,
  getAthlete as getAthleteFromLib,
  getAthletes as getAthletesFromLib,
  getStats as getStatsFromLib,
  getStatsForAthletes as getStatsForAthletesFromLib,
} from '../lib/api';
import { subscribeToCheckout as subscribeToCheckoutFromLib } from '../lib/checkout';
import { hasSupabaseConfig, supabase } from './supabase';

export function isSupabaseConfigured() {
  return hasSupabaseConfig();
}

export async function getAthletes(searchQuery = '') {
  if (!supabase) return [];
  return getAthletesFromLib(searchQuery);
}

export async function getAthlete(id: string) {
  if (!supabase) return null;
  return getAthleteFromLib(id);
}

export async function getStats(athleteId: string) {
  if (!supabase) return null;
  return getStatsFromLib(athleteId);
}

export async function getStatsForAthletes(athletes: AthleteRecord[]) {
  if (!supabase) return [];
  return getStatsForAthletesFromLib(athletes.map((athlete) => athlete.id));
}

export async function getActiveSubscriptions(args: Parameters<typeof getActiveSubscriptionsFromLib>[0]) {
  if (!supabase) return [];
  return getActiveSubscriptionsFromLib(args);
}

export async function subscribeToCheckout(args: Parameters<typeof subscribeToCheckoutFromLib>[0]) {
  return subscribeToCheckoutFromLib(args);
}
