import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { getSql, readState, sendApiError } from '../lib/db.js';
import {
  buildClearSessionCookie,
  buildSessionSetCookie,
  createAdminSessionToken,
  findAdminMember,
  getSessionFromRequest,
  requireAdminSession,
  SELF_SERVICE_MEMBER_FIELDS,
  verifyAdminCredentials
} from '../lib/auth.js';
import {
  reviewApplication,
  reviewClaim,
  reviewLinkRequest,
  reviewLoginClaim,
  reviewPromotion,
  reviewReport
} from '../lib/review.js';
import { USSF_SEED } from '../lib/seed.js';
import {
  KAMADO_ADMIN_ACCOUNT,
  type AccountLinkRequest,
  type FieldReport,
  type FinancialClaim,
  type PendingLoginRewardClaim,
  type PromotionRequest,
  type RecruitmentApplication,
  type USSFMember
} from '../src/data/ussfData.js';

type JsonObject = Record<string, unknown>;

const ROUTES: Record<string, { collection: string; itemKey: string; publicCreate: boolean }> = {
  members: { collection: 'members', itemKey: 'member', publicCreate: false },
  claims: { collection: 'claims', itemKey: 'claim', publicCreate: true },
  reports: { collection: 'fieldReports', itemKey: 'report', publicCreate: true },
  promotions: { collection: 'promotionRequests', itemKey: 'promo', publicCreate: true },
  applications: { collection: 'applications', itemKey: 'application', publicCreate: true },
  'admin-events': { collection: 'adminEvents', itemKey: 'event', publicCreate: false },
  'social-posts': { collection: 'socialPosts', itemKey: 'post', publicCreate: true },
  'link-requests': { collection: 'linkRequests', itemKey: 'linkRequest', publicCreate: false },
  'login-claims': { collection: 'pendingLoginClaims', itemKey: 'claim', publicCreate: true },
  'forgot-pw': { collection: 'forgotPwRequests', itemKey: 'request', publicCreate: true },
};

// Review (approve/reject) routes are handled by the shared review logic so the
// roster side effects (payouts, rank changes, recruit creation, account linking)
// behave exactly like the local Express server.
const REVIEW_ROUTES = new Set(['claims', 'reports', 'promotions', 'applications', 'link-requests', 'login-claims']);

function objectBody(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null;
}

function cleanId(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 120) : '';
}

/**
 * Resolves the /api/* route segments for this request.
 *
 * Vercel's router normally supplies them in `req.query.path`, but production
 * deployments have been observed matching this catch-all WITHOUT the route
 * parameter (single-segment matches arrive with an empty `path`), and
 * vercel.json rewrites deliver segments through the `rp` query parameter.
 * Falling back to the request URL guarantees every path dispatches correctly.
 */
function resolveRoutePath(req: VercelRequest): string[] {
  // Depending on Vercel's rewrite engine, `:id` is either substituted inside
  // `rp` itself or auto-forwarded as a separate `?id=` query parameter. Resolve
  // every unresolved `:id` segment — not just a trailing one — so multi-segment
  // routes such as members/:id/presence dispatch correctly.
  const rawForwardedId = req.query.id;
  const forwardedId = typeof rawForwardedId === 'string' ? rawForwardedId : '';
  const resolveIds = (segments: string[]): string[] =>
    segments.map(segment => (segment === ':id' && forwardedId ? forwardedId : segment));

  const fromRewrite = req.query.rp;
  if (fromRewrite !== undefined) {
    const raw = Array.isArray(fromRewrite) ? fromRewrite.join('/') : String(fromRewrite);
    const segments = resolveIds(raw.split('/').filter(Boolean));
    if (forwardedId && segments.length === 1) segments.push(forwardedId);
    return segments;
  }

  const fromRouter = req.query.path;
  if (Array.isArray(fromRouter)) {
    const segments = resolveIds(fromRouter.map(String).filter(Boolean));
    if (segments.length > 0) return segments;
  } else if (typeof fromRouter === 'string' && fromRouter) {
    return resolveIds([fromRouter]);
  }

  const urlPath = String(req.url || '').split('?')[0];
  return resolveIds(
    urlPath
      .replace(/^\/api\/?/, '')
      .split('/')
      .filter(Boolean)
      .map(segment => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      })
  );
}

function methodNotAllowed(res: VercelResponse): void {
  res.status(405).json({ success: false, error: 'Method not allowed.' });
}

/**
 * POST /api/auth/login, GET /api/auth/session, POST /api/auth/logout.
 * Credentials and session cookies are validated entirely on the server.
 */
async function handleAuthAction(action: string, req: VercelRequest, res: VercelResponse): Promise<void> {
  if (action === 'login') {
    if (req.method !== 'POST') return methodNotAllowed(res);
    const body = objectBody(req.body) || {};
    if (!verifyAdminCredentials(body.accountName, body.password)) {
      res.status(401).json({ success: false, error: 'Invalid administrator credentials.' });
      return;
    }
    let member: USSFMember | null = null;
    try {
      const state = await readState();
      const members = (state.members || []) as unknown as USSFMember[];
      member = members.find(candidate => candidate.isAdmin || candidate.isOwner)
        || members.find(candidate => candidate.id === KAMADO_ADMIN_ACCOUNT.id || candidate.cid === KAMADO_ADMIN_ACCOUNT.cid)
        || null;
    } catch {
      // Issuing a session does not depend on the shared database.
      member = null;
    }
    try {
      const token = createAdminSessionToken({
        id: member?.id || KAMADO_ADMIN_ACCOUNT.id,
        name: member?.name || KAMADO_ADMIN_ACCOUNT.name
      });
      res.setHeader('Set-Cookie', buildSessionSetCookie(token));
    } catch (error: any) {
      res.status(503).json({ success: false, error: error?.message || 'Administrator session could not be created.' });
      return;
    }
    res.status(200).json({ success: true, member: member || KAMADO_ADMIN_ACCOUNT });
    return;
  }

  if (action === 'session') {
    if (req.method !== 'GET') return methodNotAllowed(res);
    const session = getSessionFromRequest(req);
    if (!session) {
      res.status(200).json({ success: true, authenticated: false, member: null });
      return;
    }
    let member: USSFMember | null = null;
    try {
      const state = await readState();
      member = (findAdminMember((state.members || []) as unknown as USSFMember[], session) as USSFMember | undefined) || null;
    } catch {
      member = null;
    }
    res.status(200).json({ success: true, authenticated: true, member });
    return;
  }

  if (action === 'logout') {
    if (req.method !== 'POST') return methodNotAllowed(res);
    res.setHeader('Set-Cookie', buildClearSessionCookie());
    res.status(200).json({ success: true });
    return;
  }

  res.status(404).json({ success: false, error: `API route not found: /api/auth/${action}` });
}

async function writeCollections(updates: Array<{ collection: string; records: unknown[] }>): Promise<void> {
  if (updates.length < 1 || updates.length > 2) {
    throw new Error('Unexpected review persistence request.');
  }
  const sql = await getSql();
  if (updates.length === 1) {
    const only = updates[0];
    const rows = await sql`
      UPDATE ussf_app_state
      SET state = jsonb_set(state, ARRAY[${only.collection}], ${JSON.stringify(only.records)}::jsonb),
          updated_at = now()
      WHERE id = 1
      RETURNING id
    `;
    if (!rows[0]) throw new Error('Shared database is not initialized. Run npm run migrate:neon.');
    return;
  }
  const [first, second] = updates;
  const rows = await sql`
    UPDATE ussf_app_state
    SET state = jsonb_set(
          jsonb_set(state, ARRAY[${first.collection}], ${JSON.stringify(first.records)}::jsonb),
          ARRAY[${second.collection}], ${JSON.stringify(second.records)}::jsonb),
        updated_at = now()
    WHERE id = 1
    RETURNING id
  `;
  if (!rows[0]) throw new Error('Shared database is not initialized. Run npm run migrate:neon.');
}

async function handleReview(route: string, id: string, body: JsonObject, operation: string, res: VercelResponse): Promise<void> {
  try {
    const state = await readState();
    const members = (state.members || []) as unknown as USSFMember[];

    if (route === 'claims') {
      const claims = (state.claims || []) as FinancialClaim[];
      const outcome = reviewClaim(claims, members, id, body);
      if (!outcome.ok) return void res.status(outcome.status).json({ success: false, error: outcome.error });
      const updates: Array<{ collection: string; records: unknown[] }> = [{ collection: 'claims', records: claims }];
      if (outcome.membersChanged) updates.push({ collection: 'members', records: members });
      await writeCollections(updates);
      return void res.status(200).json({ success: true, claim: outcome.record });
    }

    if (route === 'reports') {
      const reports = (state.fieldReports || []) as FieldReport[];
      const outcome = reviewReport(reports, members, id, body);
      if (!outcome.ok) return void res.status(outcome.status).json({ success: false, error: outcome.error });
      const updates: Array<{ collection: string; records: unknown[] }> = [{ collection: 'fieldReports', records: reports }];
      if (outcome.membersChanged) updates.push({ collection: 'members', records: members });
      await writeCollections(updates);
      return void res.status(200).json({ success: true, report: outcome.record });
    }

    if (route === 'promotions') {
      const promotions = (state.promotionRequests || []) as PromotionRequest[];
      const outcome = reviewPromotion(promotions, members, id, body);
      if (!outcome.ok) return void res.status(outcome.status).json({ success: false, error: outcome.error });
      const updates: Array<{ collection: string; records: unknown[] }> = [{ collection: 'promotionRequests', records: promotions }];
      if (outcome.membersChanged) updates.push({ collection: 'members', records: members });
      await writeCollections(updates);
      return void res.status(200).json({ success: true, promo: outcome.record });
    }

    if (route === 'applications') {
      const applications = (state.applications || []) as RecruitmentApplication[];
      const outcome = reviewApplication(applications, members, id, body);
      if (!outcome.ok) return void res.status(outcome.status).json({ success: false, error: outcome.error });
      const updates: Array<{ collection: string; records: unknown[] }> = [{ collection: 'applications', records: applications }];
      if (outcome.membersChanged) updates.push({ collection: 'members', records: members });
      await writeCollections(updates);
      return void res.status(200).json({ success: true, application: outcome.record });
    }

    if (route === 'login-claims') {
      const loginClaims = (state.pendingLoginClaims || []) as PendingLoginRewardClaim[];
      const outcome = reviewLoginClaim(loginClaims, members, id, body);
      if (!outcome.ok) return void res.status(outcome.status).json({ success: false, error: outcome.error });
      const updates: Array<{ collection: string; records: unknown[] }> = [{ collection: 'pendingLoginClaims', records: loginClaims }];
      if (outcome.membersChanged) updates.push({ collection: 'members', records: members });
      await writeCollections(updates);
      return void res.status(200).json({ success: true, claim: outcome.record });
    }

    const linkRequests = (state.linkRequests || []) as AccountLinkRequest[];
    const outcome = reviewLinkRequest(linkRequests, members, id, body);
    if (!outcome.ok) return void res.status(outcome.status).json({ success: false, error: outcome.error });
    const updates: Array<{ collection: string; records: unknown[] }> = [{ collection: 'linkRequests', records: linkRequests }];
    if (outcome.membersChanged) updates.push({ collection: 'members', records: members });
    await writeCollections(updates);
    return void res.status(200).json({ success: true, linkRequest: outcome.record, request: outcome.record });
  } catch (error) {
    return void sendApiError(res, error, operation);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const path = resolveRoutePath(req);
  const route = path[0];
  const id = cleanId(path[1]);
  const config = ROUTES[route];
  const operation = `${req.method} /api/${path.join('/')}`;

  if (route === 'auth') {
    await handleAuthAction(id, req, res);
    return;
  }

  const isCreate = path.length === 1 && req.method === 'POST';
  const isUpdate = path.length === 2 && req.method === 'PUT';
  const isDelete = path.length === 2 && req.method === 'DELETE';

  // POST /api/members/:id/presence — presence heartbeat for a signed-in member or
  // an administrator; only the two presence fields are ever written.
  if (route === 'members' && id && path[2] === 'presence' && req.method === 'POST') {
    const presence = String(objectBody(req.body)?.presenceStatus || '').trim();
    if (!['Online', 'Idle', 'DND', 'Offline'].includes(presence)) {
      return res.status(400).json({ success: false, error: 'Invalid presence status.' });
    }
    if (!getSessionFromRequest(req)) {
      return res.status(401).json({ success: false, error: 'Sign-in required to update presence.' });
    }
    try {
      const patch = { presenceStatus: presence, isOnlineCit: presence !== 'Offline' };
      const sql = await getSql();
      const rows = await sql`
        UPDATE ussf_app_state
        SET state = jsonb_set(state, ARRAY['members'],
          (SELECT jsonb_agg(CASE WHEN entry.item->>'id' = ${id}
            THEN entry.item || ${JSON.stringify(patch)}::jsonb ELSE entry.item END ORDER BY entry.ordinality)
            FROM jsonb_array_elements(COALESCE(state->'members', '[]'::jsonb))
            WITH ORDINALITY AS entry(item, ordinality)), true),
          updated_at = now()
        WHERE id = 1 AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(state->'members', '[]'::jsonb)) AS entry(item) WHERE entry.item->>'id' = ${id})
        RETURNING state->'members' AS records
      `;
      if (!rows[0]) return res.status(404).json({ success: false, error: 'Resource not found.' });
      const record = (rows[0].records as JsonObject[]).find(item => item.id === id);
      return res.status(200).json({ success: true, member: record, presenceStatus: presence });
    } catch (error) {
      return sendApiError(res, error, operation);
    }
  }

  // POST /api/birthdays/gift — administrators send a birthday gift. Cash gifts
  // credit the recipient's payout total in the same write.
  if (route === 'birthdays' && id === 'gift' && req.method === 'POST') {
    if (!requireAdminSession(req, res)) return;
    const gift = objectBody(req.body);
    if (!gift || !gift.receiverName || !gift.giftType) {
      return res.status(400).json({ success: false, error: 'A birthday gift requires a recipient and a gift type.' });
    }
    try {
      const state = await readState();
      const gifts = (state.birthdayGifts || []) as unknown as JsonObject[];
      const members = (state.members || []) as unknown as USSFMember[];
      const saved: JsonObject = {
        ...gift,
        id: cleanId(gift.id) || `gift-${randomUUID()}`,
        amount: Number(gift.amount) || 0,
        date: String(gift.date || new Date().toISOString())
      };
      gifts.unshift(saved);
      const updates: Array<{ collection: string; records: unknown[] }> = [{ collection: 'birthdayGifts', records: gifts }];
      if (saved.giftType === 'CASH') {
        const recipient = members.find(member =>
          member.cid === saved.receiverCid || member.name === saved.receiverName
        );
        if (recipient) {
          recipient.totalPayout = (recipient.totalPayout || 0) + (Number(saved.amount) || 0);
          updates.push({ collection: 'members', records: members });
        }
      }
      await writeCollections(updates);
      return res.status(201).json({ success: true, gift: saved });
    } catch (error) {
      return sendApiError(res, error, operation);
    }
  }

  // POST /api/achievements/update — replaces the shared commendations catalogue.
  if (route === 'achievements' && id === 'update' && req.method === 'POST') {
    if (!requireAdminSession(req, res)) return;
    const achievements = objectBody(req.body)?.achievements;
    if (!Array.isArray(achievements)) {
      return res.status(400).json({ success: false, error: 'An achievements array is required.' });
    }
    try {
      const sql = await getSql();
      const rows = await sql`
        UPDATE ussf_app_state
        SET state = jsonb_set(state, ARRAY['achievements'], ${JSON.stringify(achievements)}::jsonb),
            updated_at = now()
        WHERE id = 1
        RETURNING id
      `;
      if (!rows[0]) return res.status(503).json({ success: false, error: 'Shared database is not initialized.' });
      return res.status(200).json({ success: true, achievements });
    } catch (error) {
      return sendApiError(res, error, operation);
    }
  }

  // POST /api/reset-clean — administrators restore the audited production baseline.
  if (route === 'reset-clean' && path.length === 1 && req.method === 'POST') {
    if (!requireAdminSession(req, res)) return;
    try {
      const sql = await getSql();
      const rows = await sql`
        UPDATE ussf_app_state
        SET state = ${JSON.stringify(USSF_SEED)}::jsonb, updated_at = now()
        WHERE id = 1
        RETURNING id
      `;
      if (!rows[0]) return res.status(503).json({ success: false, error: 'Shared database is not initialized.' });
      return res.status(200).json({ success: true });
    } catch (error) {
      return sendApiError(res, error, operation);
    }
  }

  // POST /api/forgot-pw — a member asks for account recovery. The request is
  // stored in the administrator queue; a client can never mark it resolved.
  if (route === 'forgot-pw' && path.length === 1 && req.method === 'POST') {
    const request = objectBody(req.body);
    if (!request || !String(request.accountName || '').trim()) {
      return res.status(400).json({ success: false, error: 'A recovery request requires the website account name.' });
    }
    try {
      const state = await readState();
      const requests = (state.forgotPwRequests || []) as unknown as JsonObject[];
      const saved: JsonObject = {
        ...request,
        id: cleanId(request.id) || `pw-${randomUUID()}`,
        status: 'Pending',
        requestDate: String(request.requestDate || new Date().toISOString())
      };
      requests.unshift(saved);
      await writeCollections([{ collection: 'forgotPwRequests', records: requests }]);
      return res.status(201).json({ success: true, request: saved });
    } catch (error) {
      return sendApiError(res, error, operation);
    }
  }

  // POST /api/login-claims — one claim per operator per calendar day, with bounded
  // values, so the reward queue cannot be farmed with repeated submissions.
  if (route === 'login-claims' && path.length === 1 && req.method === 'POST') {
    const body = objectBody(req.body);
    if (!body) return res.status(400).json({ success: false, error: 'Request body must be a JSON object.' });
    const operatorCid = String(body.operatorCid || '').trim();
    const operatorName = String(body.operatorName || '').trim();
    const day = Number(body.day);
    const cashAmount = Number(body.cashAmount);
    const promotionPoints = Number(body.promotionPoints);
    if (!operatorCid || !operatorName || !Number.isInteger(day) || day < 1 || day > 30 ||
        !Number.isFinite(cashAmount) || cashAmount < 0 || cashAmount > 100000000 ||
        !Number.isFinite(promotionPoints) || promotionPoints < 0 || promotionPoints > 1000) {
      return res.status(400).json({ success: false, error: 'Invalid login reward claim values.' });
    }
    try {
      const state = await readState();
      const claims = (state.pendingLoginClaims || []) as unknown as JsonObject[];
      const today = new Date().toISOString().slice(0, 10);
      const alreadyClaimed = claims.some(claim =>
        String(claim.operatorCid || '') === operatorCid && String(claim.claimedAt || '').slice(0, 10) === today
      );
      if (alreadyClaimed) {
        return res.status(409).json({ success: false, error: 'A login reward was already claimed today for this CID.' });
      }
      const saved: JsonObject = {
        ...body,
        id: cleanId(body.id) || `plc-${randomUUID()}`,
        operatorCid,
        operatorName,
        day,
        cashAmount,
        promotionPoints,
        // The claim date is issued by the server so a client cannot forge a new day.
        claimedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'Pending Payout'
      };
      claims.unshift(saved);
      await writeCollections([{ collection: 'pendingLoginClaims', records: claims }]);
      return res.status(201).json({ success: true, claim: saved });
    } catch (error) {
      return sendApiError(res, error, operation);
    }
  }

  // GET/POST /api/milestone-choices — the 7/30-day milestone reward table.
  if (route === 'milestone-choices' && path.length === 1) {
    if (req.method === 'GET') {
      try {
        const state = await readState();
        const choices = (state as unknown as JsonObject).milestoneChoices || [];
        return res.status(200).json({ success: true, choices });
      } catch (error) {
        return sendApiError(res, error, operation);
      }
    }
    if (req.method === 'POST') {
      if (!requireAdminSession(req, res)) return;
      const choices = objectBody(req.body)?.choices;
      if (!Array.isArray(choices) || choices.length > 40) {
        return res.status(400).json({ success: false, error: 'A milestone choices array is required.' });
      }
      try {
        const sql = await getSql();
        const rows = await sql`
          UPDATE ussf_app_state
          SET state = jsonb_set(state, ARRAY['milestoneChoices'], ${JSON.stringify(choices)}::jsonb),
              updated_at = now()
          WHERE id = 1
          RETURNING id
        `;
        if (!rows[0]) return res.status(503).json({ success: false, error: 'Shared database is not initialized.' });
        return res.status(200).json({ success: true, choices });
      } catch (error) {
        return sendApiError(res, error, operation);
      }
    }
  }

  // POST /api/login-rewards — replaces the daily login reward table.
  if (route === 'login-rewards' && path.length === 1 && req.method === 'POST') {
    if (!requireAdminSession(req, res)) return;
    const rewards = objectBody(req.body)?.rewards;
    if (!Array.isArray(rewards) || rewards.length < 1 || rewards.length > 60) {
      return res.status(400).json({ success: false, error: 'A login rewards array is required.' });
    }
    try {
      const sql = await getSql();
      const rows = await sql`
        UPDATE ussf_app_state
        SET state = jsonb_set(state, ARRAY['loginRewards'], ${JSON.stringify(rewards)}::jsonb),
            updated_at = now()
        WHERE id = 1
        RETURNING id
      `;
      if (!rows[0]) return res.status(503).json({ success: false, error: 'Shared database is not initialized.' });
      return res.status(200).json({ success: true, loginRewards: rewards });
    } catch (error) {
      return sendApiError(res, error, operation);
    }
  }

  // Public submissions with dedicated handlers stay there; duplicate creates are refused explicitly.
  const delegatedCreate = req.method === 'POST' && (route === 'claims' || route === 'link-requests');
  if (!config || delegatedCreate) {
    if (delegatedCreate) {
      return res.status(501).json({ success: false, error: `${req.method} /api/${path.join('/')} is not implemented on this endpoint.` });
    }
    return res.status(404).json({ success: false, error: `API route not found: /api/${path.join('/')}` });
  }

  if (!isCreate && !isUpdate && !isDelete) {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  // Members may save their own cosmetic profile fields (avatar, namecard, frame,
  // cursor, bio, presence) without an administrator session. Every other
  // operation — creates, deletes, review actions, privileged member edits —
  // still requires the signed session cookie issued at administrator login.
  const isSelfServiceMemberUpdate = route === 'members' && isUpdate && !getSessionFromRequest(req);
  const isReview = isUpdate && REVIEW_ROUTES.has(route);
  if (!isSelfServiceMemberUpdate && (isReview || !(isCreate && config.publicCreate))) {
    if (!requireAdminSession(req, res)) return;
  }

  const body = objectBody(req.body);
  if (!isDelete && !body) return res.status(400).json({ success: false, error: 'Request body must be a JSON object.' });
  if (isUpdate && !id) return res.status(400).json({ success: false, error: 'Resource ID is required.' });

  // Authorization is decided before any database access: an anonymous member
  // update that carries no self-service field is rejected outright.
  if (isSelfServiceMemberUpdate && body) {
    const allowed = SELF_SERVICE_MEMBER_FIELDS.filter(field => field in body);
    if (allowed.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Administrator session required for this update.'
      });
    }
  }

  if (isReview) {
    await handleReview(route, id, body!, operation, res);
    return;
  }

  try {
    const sql = await getSql();
    if (isCreate) {
      const record: Record<string, any> = { ...body, id: cleanId(body?.id) || `${route}-${randomUUID()}` };
      if (route === 'claims') record.status = 'Pending';
      if (route === 'reports') record.status = 'Pending Verification';
      if (route === 'promotions') record.status = 'Pending';
      if (route === 'applications') record.status = 'Pending Review';
      if (route === 'login-claims') record.status = 'Pending Payout';
      const rows = await sql`
        UPDATE ussf_app_state
        SET state = jsonb_set(state, ARRAY[${config.collection}],
          COALESCE(state->${config.collection}, '[]'::jsonb) || ${JSON.stringify(record)}::jsonb, true),
          updated_at = now()
        WHERE id = 1
        RETURNING state->${config.collection} AS records
      `;
      if (!rows[0]) return res.status(503).json({ success: false, error: 'Shared database is not initialized.' });
      return res.status(201).json({ success: true, [config.itemKey]: record });
    }

    const updates = isDelete ? null : body!;
    if (isUpdate && updates && cleanId(updates?.id) && cleanId(updates.id) !== id) {
      return res.status(400).json({ success: false, error: 'Resource ID does not match the URL.' });
    }

    // Anonymous member updates are restricted to the cosmetic allowlist; a body
    // containing only privileged fields is rejected with the standard 401.
    let appliedUpdates = updates;
    if (isSelfServiceMemberUpdate && updates) {
      const filtered: JsonObject = {};
      for (const field of SELF_SERVICE_MEMBER_FIELDS) {
        if (field in updates) filtered[field] = updates[field];
      }
      if (Object.keys(filtered).length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Administrator session required for this update.'
        });
      }
      appliedUpdates = filtered;
    }
    const rows = isDelete
      ? await sql`
          UPDATE ussf_app_state
          SET state = jsonb_set(state, ARRAY[${config.collection}],
            COALESCE((SELECT jsonb_agg(entry.item ORDER BY entry.ordinality)
              FROM jsonb_array_elements(COALESCE(state->${config.collection}, '[]'::jsonb))
              WITH ORDINALITY AS entry(item, ordinality)
              WHERE entry.item->>'id' <> ${id}), '[]'::jsonb), true),
            updated_at = now()
          WHERE id = 1 AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(state->${config.collection}, '[]'::jsonb)) AS entry(item) WHERE entry.item->>'id' = ${id})
          RETURNING state->${config.collection} AS records
        `
      : await sql`
          UPDATE ussf_app_state
          SET state = jsonb_set(state, ARRAY[${config.collection}],
            (SELECT jsonb_agg(CASE WHEN entry.item->>'id' = ${id}
              THEN entry.item || ${JSON.stringify(appliedUpdates)}::jsonb ELSE entry.item END ORDER BY entry.ordinality)
              FROM jsonb_array_elements(COALESCE(state->${config.collection}, '[]'::jsonb))
              WITH ORDINALITY AS entry(item, ordinality)), true),
            updated_at = now()
          WHERE id = 1 AND EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(state->${config.collection}, '[]'::jsonb)) AS entry(item) WHERE entry.item->>'id' = ${id})
          RETURNING state->${config.collection} AS records
        `;
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Resource not found.' });
    if (isDelete) return res.status(200).json({ success: true });
    const record = (rows[0].records as JsonObject[]).find(item => item.id === id);
    return res.status(200).json({ success: true, [config.itemKey]: record });
  } catch (error) {
    return sendApiError(res, error, operation);
  }
}
