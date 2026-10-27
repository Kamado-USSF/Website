import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Server-side administrator session support.
 *
 * This module is imported only by server code (server.ts and the api/ handlers),
 * never by the browser bundle. The administrator credential and the session
 * signing secret never reach client-side code.
 *
 * A session is an HMAC-signed cookie issued by POST /api/auth/login after the
 * server validates the administrator credentials. Protected endpoints verify the
 * signature and expiry on every request, so authorization is decided server-side.
 */

export const SESSION_COOKIE_NAME = 'ussf_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// The only accounts that may establish an administrator session.
const ADMIN_ACCOUNT_ALIASES = ['kamado', 'sf-001'];

// Default administrator password, kept server-side only. Override with the
// USSF_ADMIN_PASSWORD environment variable (recommended for deployments).
const DEFAULT_ADMIN_PASSWORD = 'FeelPainAcceptPainAndKnowPain';

/**
 * Profile fields a signed-in member may save on their own roster record without
 * an administrator session (avatar, namecard, frame, cursor, bio, presence).
 * Identity and privilege fields (name, rank, division, roles, stats, CID, …)
 * remain administrator-only, so a visitor can never rewrite roster identity or
 * promote themselves by editing their own request body.
 */
export const SELF_SERVICE_MEMBER_FIELDS = [
  'avatarUrl',
  'avatarFrame',
  'namecard',
  'namecardBgUrl',
  'nameStyle',
  'customCursor',
  'bio',
  'signature',
  'presenceStatus',
  'isOnlineCit'
] as const;

export interface AdminSession {
  sub: string;
  name: string;
  admin: true;
  iat: number;
  exp: number;
}

export type ReviewableMember = {
  id?: string;
  cid?: string;
  name?: string;
  isAdmin?: boolean;
  isOwner?: boolean;
};

interface RequestLike {
  headers: { cookie?: string | string[] };
}

interface ResponseLike {
  status: (code: number) => { json: (body: unknown) => unknown };
}

function sha256(value: string): Buffer {
  return createHmac('sha256', 'ussf-compare').update(value).digest();
}

let devSecretFallback: string | null = null;

/**
 * Session signing secret. Resolution order:
 *   1. USSF_SESSION_SECRET environment variable (optional hardening)
 *   2. a value derived from DATABASE_URL (stable across serverless instances)
 *   3. a random secret persisted to data/.session-secret (local development)
 * Throws when no secret can be produced so callers fail closed with a 503.
 */
function getSessionSecret(): string {
  const explicit = process.env.USSF_SESSION_SECRET;
  if (explicit && explicit.length >= 16) return explicit;

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return createHmac('sha256', 'ussf-session-secret-v1').update(databaseUrl).digest('hex');
  }

  if (devSecretFallback) return devSecretFallback;
  try {
    const dir = path.join(process.cwd(), 'data');
    const file = path.join(dir, '.session-secret');
    if (fs.existsSync(file)) {
      devSecretFallback = fs.readFileSync(file, 'utf-8').trim();
    } else {
      devSecretFallback = randomBytes(32).toString('hex');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, `${devSecretFallback}\n`, { mode: 0o600 });
    }
    if (devSecretFallback) return devSecretFallback;
  } catch {
    // Fall through to the failure below.
  }
  throw new Error('Server session secret is not configured for this environment.');
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function verifyAdminCredentials(accountName: unknown, password: unknown): boolean {
  const alias = String(accountName ?? '').trim().toLowerCase();
  const provided = String(password ?? '');
  if (!ADMIN_ACCOUNT_ALIASES.includes(alias)) return false;
  const expected = process.env.USSF_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const providedDigest = sha256(provided);
  const expectedDigest = sha256(expected);
  return providedDigest.length === expectedDigest.length && timingSafeEqual(providedDigest, expectedDigest);
}

export function createAdminSessionToken(member: { id: string; name: string }): string {
  const secret = getSessionSecret();
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: AdminSession = {
    sub: member.id,
    name: member.name,
    admin: true,
    iat: issuedAt,
    exp: issuedAt + SESSION_MAX_AGE_SECONDS
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

export function verifySessionToken(token: string | null | undefined): AdminSession | null {
  if (!token) return null;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const providedMac = token.slice(separator + 1);

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return null;
  }
  const expectedMac = sign(body, secret);
  const providedBuffer = Buffer.from(providedMac, 'utf-8');
  const expectedBuffer = Buffer.from(expectedMac, 'utf-8');
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as AdminSession;
    if (!payload || payload.admin !== true || typeof payload.sub !== 'string') return null;
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readSessionCookie(cookieHeader: string | string[] | undefined): string | null {
  const raw = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
  if (!raw) return null;
  for (const pair of raw.split(';')) {
    const separator = pair.indexOf('=');
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() !== SESSION_COOKIE_NAME) continue;
    const value = pair.slice(separator + 1).trim();
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

export function getSessionFromRequest(req: RequestLike): AdminSession | null {
  return verifySessionToken(readSessionCookie(req.headers.cookie));
}

function isSecureRequest(): boolean {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

export function buildSessionSetCookie(token: string): string {
  const flags = [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`
  ];
  if (isSecureRequest()) flags.push('Secure');
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; ${flags.join('; ')}`;
}

export function buildClearSessionCookie(): string {
  const flags = ['Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isSecureRequest()) flags.push('Secure');
  return `${SESSION_COOKIE_NAME}=; ${flags.join('; ')}`;
}

/** Validates the signed session cookie; returns 401 when absent or invalid. */
export function requireAdminSession(req: RequestLike, res: ResponseLike): boolean {
  if (!getSessionFromRequest(req)) {
    res.status(401).json({
      success: false,
      error: 'Administrator session required. Please sign in with your administrator account.'
    });
    return false;
  }
  return true;
}

/** Resolves the administrator member record for a session, if it is still on the roster. */
export function findAdminMember<T extends ReviewableMember>(members: T[] | undefined, session: AdminSession | null): T | undefined {
  if (!session || !members) return undefined;
  return members.find(member => member.id && member.id === session.sub)
    || members.find(member => member.isAdmin || member.isOwner);
}
