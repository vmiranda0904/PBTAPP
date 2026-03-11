import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  /** Unique 6-character uppercase alphanumeric code shared with team members. */
  teamCode: string;
  teamName: string;
  /** Email of the user who created the team (the initial admin). */
  adminEmail: string;
  createdAt: string;
}

const COLLECTION = 'teams';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Exclude visually ambiguous characters (O/0, I/1)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateTeamCode(): string {
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map(b => CODE_CHARS[b % CODE_CHARS.length])
    .join('');
}

function generateId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getTeamByCode(teamCode: string): Promise<Team | null> {
  const q = query(
    collection(db, COLLECTION),
    where('teamCode', '==', teamCode.toUpperCase().trim()),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Team;
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  const snap = await getDoc(doc(db, COLLECTION, teamId));
  return snap.exists() ? (snap.data() as Team) : null;
}

/**
 * Creates a new team with an auto-generated unique team code.
 * Retries up to 10 times if there is a code collision (extremely unlikely).
 */
export async function createTeam(
  teamName: string,
  adminEmail: string,
): Promise<Team> {
  const id = generateId();

  let teamCode = '';
  for (let attempts = 0; attempts < 10; attempts++) {
    const candidate = generateTeamCode();
    const existing = await getTeamByCode(candidate);
    if (!existing) {
      teamCode = candidate;
      break;
    }
  }  if (!teamCode) throw new Error('Failed to generate a unique team code. Please try again.');

  const team: Team = {
    id,
    teamCode,
    teamName: teamName.trim(),
    adminEmail: adminEmail.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, COLLECTION, id), team);
  return team;
}
