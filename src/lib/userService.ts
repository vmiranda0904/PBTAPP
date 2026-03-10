import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  avatar: string;
  position: string;
  status: UserStatus;
  approvalToken: string;
  createdAt: string;
}

const COLLECTION = 'registrations';

// ─── Password hashing (PBKDF2 via Web Crypto API) ────────────────────────────

export async function hashPassword(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt(): Uint8Array<ArrayBuffer> {
  const salt = new Uint8Array(new ArrayBuffer(16));
  crypto.getRandomValues(salt);
  return salt;
}

export function saltToHex(salt: Uint8Array): string {
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToSalt(hex: string): Uint8Array<ArrayBuffer> {
  const arr = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

export async function verifyPassword(password: string, hash: string, saltHex: string): Promise<boolean> {
  const salt = hexToSalt(saltHex);
  const computed = await hashPassword(password, salt);
  return computed === hash;
}

// ─── Token generation ─────────────────────────────────────────────────────────

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<RegisteredUser | null> {
  const q = query(
    collection(db, COLLECTION),
    where('email', '==', email.toLowerCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as RegisteredUser;
}

export async function getUserById(id: string): Promise<RegisteredUser | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? (snap.data() as RegisteredUser) : null;
}

export async function createRegistration(fields: {
  name: string;
  email: string;
  password: string;
  position: string;
}): Promise<RegisteredUser> {
  const id = generateId();
  const approvalToken = generateToken();
  const salt = generateSalt();
  const saltHex = saltToHex(salt);
  const initials = fields.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const user: RegisteredUser = {
    id,
    name: fields.name.trim(),
    email: fields.email.toLowerCase().trim(),
    passwordHash: await hashPassword(fields.password, salt),
    passwordSalt: saltHex,
    avatar: initials,
    position: fields.position,
    status: 'pending',
    approvalToken,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, COLLECTION, id), user);
  return user;
}

export async function updateUserStatus(
  uid: string,
  token: string,
  status: 'approved' | 'rejected'
): Promise<{ success: boolean; user?: RegisteredUser }> {
  const user = await getUserById(uid);
  if (!user) return { success: false };
  if (user.approvalToken !== token) return { success: false };
  if (user.status !== 'pending') return { success: false };
  await updateDoc(doc(db, COLLECTION, uid), { status });
  return { success: true, user: { ...user, status } };
}
