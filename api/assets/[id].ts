import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminSession } from '../../lib/auth.js';
import { getSql, sendApiError } from '../../lib/db.js';
import { validateAsset } from '../../lib/validation.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ success: false, error: 'Asset ID is required.' });
  if (req.method !== 'PUT' && req.method !== 'DELETE') return res.status(405).json({ success: false, error: 'Method not allowed.' });
  if (!requireAdminSession(req, res)) return;

  try {
    const sql = await getSql();
    if (req.method === 'DELETE') {
      const rows = await sql`
        UPDATE ussf_app_state
        SET state = jsonb_set(
          state,
          '{customAssets}',
          COALESCE((
            SELECT jsonb_agg(current_asset.item ORDER BY current_asset.ordinality)
            FROM jsonb_array_elements(COALESCE(state->'customAssets', '[]'::jsonb)) WITH ORDINALITY AS current_asset(item, ordinality)
            WHERE current_asset.item->>'id' <> ${id}
          ), '[]'::jsonb),
          true
        ), updated_at = now()
        WHERE id = 1 AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(COALESCE(state->'customAssets', '[]'::jsonb)) AS current_asset(item)
          WHERE item->>'id' = ${id}
        )
        RETURNING state->'customAssets' AS assets
      `;
      if (!rows[0]) return res.status(404).json({ success: false, error: 'Asset not found.' });
      return res.status(200).json({ success: true, assets: rows[0].assets });
    }

    const validation = validateAsset(req.body);
    if (!validation.ok) return res.status(400).json({ success: false, error: validation.error });
    if (validation.value.id !== id) return res.status(400).json({ success: false, error: 'Asset ID does not match the requested resource.' });

    const rows = await sql`
      UPDATE ussf_app_state
      SET state = jsonb_set(
        state,
        '{customAssets}',
        (
          SELECT jsonb_agg(
            CASE WHEN current_asset.item->>'id' = ${id} THEN ${JSON.stringify(validation.value)}::jsonb ELSE current_asset.item END
            ORDER BY current_asset.ordinality
          )
          FROM jsonb_array_elements(COALESCE(state->'customAssets', '[]'::jsonb)) WITH ORDINALITY AS current_asset(item, ordinality)
        ),
        true
      ), updated_at = now()
      WHERE id = 1 AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(COALESCE(state->'customAssets', '[]'::jsonb)) AS current_asset(item)
        WHERE item->>'id' = ${id}
      )
      RETURNING state->'customAssets' AS assets
    `;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Asset not found.' });
    return res.status(200).json({ success: true, assets: rows[0].assets });
  } catch (error) {
    return sendApiError(res, error, `${req.method} /api/assets/:id`);
  }
}
