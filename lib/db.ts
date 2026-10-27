import { randomUUID } from 'node:crypto';
import seedSnapshot from '../data/ussf-database.json';

export interface PersistentState {
  version: number;
  lastUpdated: string;
  members: Array<{
    [key: string]: unknown;
    id?: string;
    cid?: string;
    accountName?: string;
    name?: string;
    callsign?: string;
    rank?: string;
    rankLevel?: number;
    rankCategory?: string;
    division?: string;
    joinedDate?: string;
    status?: string;
    presenceStatus?: string;
    serviceRibbons?: string[];
    avatarUrl?: string;
    avatarFrame?: string;
    namecard?: string;
    nameStyle?: string;
    bio?: string;
    signature?: string;
    customCursor?: string;
    isMember?: boolean;
    isApplicant?: boolean;
  }>;
  linkRequests: Array<{
    id: string;
    username: string;
    inGameName: string;
    inGameCid: string;
    ingameRank: string;
    f5ScreenshotUrl: string;
    submissionDate: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    reviewedBy?: string;
    adminNote?: string;
  }>;
  applications: unknown[];
  groupInfo: Record<string, unknown>;
  customAssets: Array<Record<string, unknown> & { id: string }>;
  [key: string]: unknown;
}

type SqlClient = Awaited<ReturnType<typeof getSql>>;

function isAlreadyExistsError(error: unknown): boolean {
  const code = error && typeof error === 'object' && 'code' in error
    ? String((error as { code: unknown }).code)
    : '';
  const message = error instanceof Error ? error.message : '';
  return code === '42P07' || code === '42P10' || message.includes('already exists');
}

let schemaReadyPromise: Promise<void> | null = null;

/**
 * Creates the state table and seeds it from the bundled snapshot when the
 * database has not been migrated yet (Neon error 42P01, "relation does not
 * exist", or an empty table). Idempotent and guarded so concurrent serverless
 * cold starts cannot race the CREATE/INSERT.
 */
async function ensureStateTable(sql: SqlClient): Promise<void> {
  if (!schemaReadyPromise) {
    const attempt = (async () => {
      if (!seedSnapshot || !Array.isArray(seedSnapshot.members) || !Array.isArray(seedSnapshot.customAssets)) {
        throw new Error('The bundled database snapshot does not match the expected USSF state shape.');
      }
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS ussf_app_state (
            id SMALLINT PRIMARY KEY CHECK (id = 1),
            state JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          )
        `;
      } catch (error) {
        // Another cold start may have created the table a moment earlier.
        if (!isAlreadyExistsError(error)) throw error;
      }
      await sql`
        INSERT INTO ussf_app_state (id, state)
        VALUES (1, ${JSON.stringify(seedSnapshot)}::jsonb)
        ON CONFLICT (id) DO NOTHING
      `;
    })();
    schemaReadyPromise = attempt;
    attempt.catch(() => {
      if (schemaReadyPromise === attempt) schemaReadyPromise = null;
    });
  }
  await schemaReadyPromise;
}

export async function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured for this Vercel environment.');
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(connectionString);
  await ensureStateTable(sql);
  return sql;
}

export async function readState() {
  const sql = await getSql();
  const rows = await sql`SELECT state FROM ussf_app_state WHERE id = 1`;
  if (!rows[0]?.state) {
    throw new Error('Shared database is not initialized. Run npm run migrate:neon with DATABASE_URL.');
  }
  return rows[0].state as PersistentState;
}

export function sendApiError(
  res: { status: (code: number) => { json: (body: unknown) => unknown }; json: (body: unknown) => unknown },
  error: unknown,
  operation: string,
  requestId: string = randomUUID()
) {
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  const status = message.includes('DATABASE_URL is not configured') || message.includes('database is not initialized') ? 503 : 500;
  if (status === 500) {
    const errorName = error instanceof Error ? error.name : typeof error;
    const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined;
    console.error('[USSF API]', { operation, requestId, errorName, errorCode });
  }
  return res.status(status).json({
    success: false,
    error: status === 500 ? 'Persistent storage request failed.' : message,
    requestId
  });
}
