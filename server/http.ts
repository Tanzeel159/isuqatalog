import type { Response } from 'express';

export function jsonError(res: Response, status: number, message: string) {
  return res.status(status).json({ ok: false, error: message });
}

