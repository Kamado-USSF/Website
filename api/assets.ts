import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminSession } from '../lib/auth.js';
import { getSql, readState, sendApiError } from '../lib/db.js';
import { validateAsset } from '../lib/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const state = await readState();
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ success: true, assets: state.customAssets || [] });
    } catch (error) {
      return sendApiError(res, error, 'GET /api/assets');
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed.' });
  if (!requireAdminSession(req, res)) return;

  try {
    const validation = validateAsset(req.body);
    if (!validation.ok) return res.status(400).json({ success: false, error: validation.error });
    const sql = await getSql();
    const rows = await sql`
      UPDATE ussf_app_state
      SET state = jsonb_set(
        state,
        '{customAssets}',
        COALESCE(state->'customAssets', '[]'::jsonb) || ${JSON.stringify(validation.value)}::jsonb,
        true
      ), updated_at = now()
      WHERE id = 1
        AND NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(COALESCE(state->'customAssets', '[]'::jsonb)) AS current_asset(item)
          WHERE item->>'id' = ${validation.value.id}
        )
      RETURNING state->'customAssets' AS assets
    `;
    if (!rows[0]) return res.status(409).json({ success: false, error: 'Asset ID already exists or the shared database is not initialized.' });
    return res.status(201).json({ success: true, assets: rows[0].assets });
  } catch (error) {
    return sendApiError(res, error, 'POST /api/assets');
  }
}
