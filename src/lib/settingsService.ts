import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppSettings {
  requireApproval: boolean;
  pushNotificationsEnabled: boolean;
  adminFcmToken: string | null;
}

const SETTINGS_DOC = 'config/appSettings';

const DEFAULT_SETTINGS: AppSettings = {
  requireApproval: true,
  pushNotificationsEnabled: false,
  adminFcmToken: null,
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getAppSettings(): Promise<AppSettings> {
  const snap = await getDoc(doc(db, SETTINGS_DOC));
  if (!snap.exists()) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<AppSettings>) };
}

export async function updateAppSettings(
  partial: Partial<AppSettings>
): Promise<void> {
  await setDoc(doc(db, SETTINGS_DOC), partial, { merge: true });
}
