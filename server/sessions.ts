import type { Db } from './db';
import { randomToken, sha256Base64Url } from './crypto';

const SESSION_COOKIE = 'isuqatalog_session';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export function createSession(db: Db, userId: number): { token: string; expiresAt: string } {
  const token = randomToken(32);
  const tokenHash = sha256Base64Url(token);
  const now = new Date();
  const expires = new Date(now.getTime() + DEFAULT_TTL_MS);

  db.prepare(
    `INSERT INTO sessions (user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)`
  ).run(userId, tokenHash, now.toISOString(), expires.toISOString());

  return { token, expiresAt: expires.toISOString() };
}

export function deleteSession(db: Db, token: string) {
  const tokenHash = sha256Base64Url(token);
  db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
}

export function deleteUserSessions(db: Db, userId: number) {
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

export function getUserIdFromSession(db: Db, token: string): number | null {
  const tokenHash = sha256Base64Url(token);
  const row = db
    .prepare(`SELECT user_id, expires_at FROM sessions WHERE token_hash = ?`)
    .get(tokenHash) as { user_id: number; expires_at: string } | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
    return null;
  }
  return row.user_id;
}

export function purgeExpiredSessions(db: Db) {
  const result = db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).run(new Date().toISOString());
  if (result.changes > 0) {
    console.log(`[Sessions] Purged ${result.changes} expired sessions.`);
  }
}
