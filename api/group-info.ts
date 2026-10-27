import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminSession } from '../lib/auth.js';
import { getSql, readState, sendApiError } from '../lib/db.js';
import { validateGroupInfo } from '../lib/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const state = await readState();
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ success: true, groupInfo: state.groupInfo });
    } catch (error) {
      return sendApiError(res, error, 'GET /api/group-info');
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed.' });
  if (!requireAdminSession(req, res)) return;

  try {
    const validation = validateGroupInfo(req.body);
    if (!validation.ok) return res.status(400).json({ success: false, error: validation.error });

    const sql = await getSql();
    const rows = await sql`
      UPDATE ussf_app_state
      SET state = jsonb_set(
        state,
        '{groupInfo}',
        COALESCE(state->'groupInfo', '{}'::jsonb) || ${JSON.stringify(validation.value)}::jsonb,
        true
      ), updated_at = now()
      WHERE id = 1
      RETURNING state->'groupInfo' AS group_info
    `;
    if (!rows[0]) return res.status(503).json({ success: false, error: 'Shared database is not initialized. Run npm run migrate:neon.' });
    return res.status(200).json({ success: true, groupInfo: rows[0].group_info });
  } catch (error) {
    return sendApiError(res, error, 'POST /api/group-info');
  }
}
