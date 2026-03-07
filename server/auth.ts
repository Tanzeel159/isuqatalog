import type { Db } from './db';
import { hashPassword, verifyPassword } from './crypto';

export type User = {
  id: number;
  email: string;
  qatalogId: string;
  createdAt: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeQatalogId(qatalogId: string): string {
  const trimmed = qatalogId.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

export function createUser(db: Db, input: { email: string; qatalogId: string; password: string }): User {
  const email = normalizeEmail(input.email);
  const qatalogId = normalizeQatalogId(input.qatalogId);
  const password = input.password;

  if (!email.includes('@')) {
    throw new Error('Please enter a valid email.');
  }
  if (qatalogId.length < 2) {
    throw new Error('Please choose a valid QatalogID.');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);

  try {
    const info = db
      .prepare(
        `INSERT INTO users (email, qatalog_id, password_hash, created_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(email, qatalogId, passwordHash, now);

    return { id: Number(info.lastInsertRowid), email, qatalogId, createdAt: now };
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes('UNIQUE') && msg.includes('users.email')) {
      throw new Error('An account with this email already exists.');
    }
    if (msg.includes('UNIQUE') && msg.includes('users.qatalog_id')) {
      throw new Error('This QatalogID is already taken.');
    }
    if (msg.includes('UNIQUE')) {
      throw new Error('This account already exists.');
    }
    throw e;
  }
}

export function authenticateUser(db: Db, input: { emailOrQatalogId: string; password: string }): User {
  const raw = input.emailOrQatalogId.trim();
  const password = input.password;

  if (!raw) {
    throw new Error('Please enter your email or QatalogID.');
  }

  let row: any | undefined;

  if (raw.includes('@')) {
    const email = normalizeEmail(raw);
    row = db
      .prepare(`SELECT id, email, qatalog_id, password_hash, created_at FROM users WHERE email = ?`)
      .get(email) as any | undefined;
  } else {
    const qatalogId = normalizeQatalogId(raw);
    row = db
      .prepare(`SELECT id, email, qatalog_id, password_hash, created_at FROM users WHERE qatalog_id = ?`)
      .get(qatalogId) as any | undefined;
  }

  if (!row) {
    throw new Error('Invalid email, QatalogID, or password.');
  }

  if (!verifyPassword(password, row.password_hash)) {
    throw new Error('Invalid email, QatalogID, or password.');
  }

  return {
    id: row.id,
    email: row.email,
    qatalogId: row.qatalog_id,
    createdAt: row.created_at,
  };
}

export function getUserById(db: Db, userId: number): User | null {
  const row = db
    .prepare(`SELECT id, email, qatalog_id, created_at FROM users WHERE id = ?`)
    .get(userId) as any | undefined;

  if (!row) return null;
  return { id: row.id, email: row.email, qatalogId: row.qatalog_id, createdAt: row.created_at };
}

