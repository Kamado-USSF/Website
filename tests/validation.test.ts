import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { AccountLinkRequest } from '../src/data/ussfData';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  SESSION_COOKIE_NAME,
  createAdminSessionToken,
  requireAdminSession,
  verifyAdminCredentials,
  verifySessionToken
} from '../lib/auth';
import { getSql, type PersistentState } from '../lib/db';
import { toPublicState } from '../lib/public-state';
import { parseApiResponse } from '../src/services/api';
import { findLinkRequestConflict, validateApplication, validateAsset, validateGroupInfo, validateLinkRequest } from '../lib/validation';

const validLinkRequest = {
  username: 'website-user',
  inGameName: 'Operator_One',
  inGameCid: 'SF-222',
  ingameRank: 'Private',
  f5ScreenshotUrl: 'https://proof.example/image.png'
};

test('link request validates required data and HTTP proof URLs', () => {
  assert.equal(validateLinkRequest(validLinkRequest).ok, true);
  assert.equal(validateLinkRequest({ ...validLinkRequest, f5ScreenshotUrl: 'javascript:alert(1)' }).ok, false);
  assert.equal(validateLinkRequest({ ...validLinkRequest, username: '' }).ok, false);
});

test('pending link request is idempotent only for the same account and CID', () => {
  const existing = { ...validLinkRequest, id: 'link-1', submissionDate: '2026-01-01', status: 'Pending' } as AccountLinkRequest;
  const state = { linkRequests: [existing], members: [] };
  assert.equal(findLinkRequestConflict(state, 'WEBSITE-USER', 'sf-222')?.existing?.id, 'link-1');
  assert.match(findLinkRequestConflict(state, 'other-user', 'SF-222')?.error || '', /pending request/i);
  assert.match(findLinkRequestConflict(state, 'website-user', 'SF-333')?.error || '', /already has a pending/i);
});

test('roster CID and account collisions require administrative recovery', () => {
  const state = { linkRequests: [], members: [{ cid: 'SF-222' }, { cid: 'SF-333', accountName: 'other-user' }] };
  assert.match(findLinkRequestConflict(state, 'website-user', 'sf-222')?.error || '', /administrative recovery/i);
  assert.match(findLinkRequestConflict(state, 'other-user', 'SF-444')?.error || '', /already associated/i);
});

test('application and asset validation reject invalid payloads', () => {
  assert.equal(validateApplication({ applicantName: 'Applicant', age: 18, playtimeHours: 300, rulesAccepted: true }).ok, true);
  assert.equal(validateApplication({ applicantName: 'Applicant', age: 12, playtimeHours: 300, rulesAccepted: true }).ok, false);
  assert.equal(validateAsset({
    id: 'asset-1', type: 'SKIN', title: 'Field Uniform', codeOrId: '39', variantCount: 2,
    imageUrl: 'https://images.example/field.png', description: 'Field uniform', category: 'Infantry'
  }).ok, true);
  assert.equal(validateAsset({
    id: 'asset-1', type: 'SKIN', title: 'Field Uniform', codeOrId: '39', variantCount: 2,
    imageUrl: 'http://images.example/field.png', description: 'Field uniform', category: 'Infantry'
  }).ok, false);
});

test('group specification validation only accepts known fields and correctly typed arrays', () => {
  assert.deepEqual(validateGroupInfo({ founder: 'Verified Founder', skinsAvailable: [' 39 ', ''] }), {
    ok: true,
    value: { founder: 'Verified Founder', skinsAvailable: ['39'] }
  });
  assert.equal(validateGroupInfo({ unknownField: 'ignored' }).ok, false);
  assert.equal(validateGroupInfo({ skinsAvailable: '39, 164' }).ok, false);
});

test('admin session guard fails closed for missing, foreign, and tampered sessions', () => {
  const previousSecret = process.env.USSF_SESSION_SECRET;
  process.env.USSF_SESSION_SECRET = 'test-session-secret-0123456789abcdef';
  const responseState: { status?: number; body?: unknown } = {};
  const response = {
    status(status: number) {
      responseState.status = status;
      return this;
    },
    json(body: unknown) {
      responseState.body = body;
      return this;
    }
  } as unknown as VercelResponse;
  const request = (cookie?: string) => ({ headers: cookie ? { cookie } : {} }) as unknown as VercelRequest;
  try {
    // No session cookie at all
    assert.equal(requireAdminSession(request(), response), false);
    assert.equal(responseState.status, 401);
    assert.match((responseState.body as { error: string }).error, /session required/i);

    const token = createAdminSessionToken({ id: 'admin-kamado', name: 'Kamado' });

    // The same value in a different cookie carries no session
    assert.equal(requireAdminSession(request(`other_cookie=${token}`), response), false);
    assert.equal(responseState.status, 401);

    // Tampered signature is rejected deterministically (MAC length mismatch)
    const bodyOnly = token.slice(0, token.lastIndexOf('.'));
    assert.equal(requireAdminSession(request(`${SESSION_COOKIE_NAME}=${bodyOnly}.not-a-valid-mac`), response), false);
    assert.equal(responseState.status, 401);

    // A valid signed session is accepted
    assert.equal(requireAdminSession(request(`${SESSION_COOKIE_NAME}=${token}`), response), true);
  } finally {
    if (previousSecret === undefined) delete process.env.USSF_SESSION_SECRET;
    else process.env.USSF_SESSION_SECRET = previousSecret;
  }
});

test('session tokens are bound to the server signing secret and expiry', () => {
  const previousSecret = process.env.USSF_SESSION_SECRET;
  try {
    process.env.USSF_SESSION_SECRET = 'signing-secret-alpha-0123456789';
    const token = createAdminSessionToken({ id: 'admin-kamado', name: 'Kamado' });
    const session = verifySessionToken(token);
    assert.equal(session?.sub, 'admin-kamado');
    assert.equal(session?.admin, true);
    assert.ok((session?.exp || 0) * 1000 > Date.now());

    // A token signed with a different secret must not verify
    process.env.USSF_SESSION_SECRET = 'signing-secret-bravo-9876543210';
    assert.equal(verifySessionToken(token), null);
    assert.equal(verifySessionToken('garbage-token'), null);
    assert.equal(verifySessionToken(''), null);
    assert.equal(verifySessionToken(undefined), null);
  } finally {
    if (previousSecret === undefined) delete process.env.USSF_SESSION_SECRET;
    else process.env.USSF_SESSION_SECRET = previousSecret;
  }
});

test('administrator credentials are validated server-side only', () => {
  const previousPassword = process.env.USSF_ADMIN_PASSWORD;
  process.env.USSF_ADMIN_PASSWORD = 'Server-Side-Only-Password';
  try {
    assert.equal(verifyAdminCredentials('Kamado', 'Server-Side-Only-Password'), true);
    assert.equal(verifyAdminCredentials('sf-001', 'Server-Side-Only-Password'), true);
    assert.equal(verifyAdminCredentials('kamado', 'wrong-password'), false);
    assert.equal(verifyAdminCredentials('someone-else', 'Server-Side-Only-Password'), false);
    assert.equal(verifyAdminCredentials('', ''), false);
    assert.equal(verifyAdminCredentials(undefined, undefined), false);
  } finally {
    if (previousPassword === undefined) delete process.env.USSF_ADMIN_PASSWORD;
    else process.env.USSF_ADMIN_PASSWORD = previousPassword;
  }
});

test('client-side source carries no admin token logic or embedded administrator password', () => {
  const srcDir = path.resolve(process.cwd(), 'src');
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
      const text = fs.readFileSync(full, 'utf-8');
      if (/FeelPainAcceptPainAndKnowPain/.test(text)) offenders.push(`${full}: embedded administrator password`);
      if (/USSF_ADMIN_API_TOKEN|ussf_admin_api_token|requireAdminToken/.test(text)) offenders.push(`${full}: administrator API token logic`);
      if (/adminHeaders\s*\(/.test(text)) offenders.push(`${full}: token header helper`);
      if (/window\.prompt\([^)]*token/i.test(text)) offenders.push(`${full}: token entry prompt`);
    }
  };
  walk(srcDir);
  assert.deepEqual(offenders, []);
});

test('missing database configuration fails before loading the Neon driver', async () => {
  const previousUrl = process.env.DATABASE_URL;
  try {
    delete process.env.DATABASE_URL;
    await assert.rejects(getSql(), /DATABASE_URL is not configured/);
  } finally {
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
  }
});

test('API parser reports plain-text and HTML failures without JSON syntax errors', async () => {
  const textFailure = new Response('A server error has occurred\nFUNCTION_INVOCATION_FAILED\nrequest-id', {
    status: 500,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
  await assert.rejects(
    parseApiResponse(textFailure, 'Submit application'),
    /HTTP 500 \(text\/plain; charset=utf-8\).*FUNCTION_INVOCATION_FAILED/
  );

  const htmlFailure = new Response('<html>Not found</html>', {
    status: 404,
    headers: { 'Content-Type': 'text/html' }
  });
  await assert.rejects(parseApiResponse(htmlFailure, 'Update group info'), /HTTP 404 \(text\/html\)/);
});

test('API parser preserves structured authorization errors', async () => {    const unauthorized = new Response(JSON.stringify({ success: false, error: 'Administrator session required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
    await assert.rejects(parseApiResponse(unauthorized, 'Save asset'), /Administrator session required/);
});

test('public state excludes private queues and member financial/account data', () => {
  const state = {
    version: 1,
    lastUpdated: '2026-10-25T00:00:00.000Z',
    members: [{
      id: 'member-1', cid: 'SF-100', name: 'Operator', rank: 'Recruit', rankLevel: 1,
      totalPayout: 9000000, promotionPoints: 700, accountName: 'private-account'
    }],
    claims: [{ id: 'claim-1', amount: 1000 }],
    linkRequests: [{ id: 'link-1', username: 'private-user' }],
    applications: [{ id: 'app-1', applicantName: 'Private Applicant' }],
    groupInfo: { name: 'USSF' },
    customAssets: []
  } as unknown as PersistentState;
  const result = toPublicState(state) as Record<string, unknown>;
  assert.equal('claims' in result, false);
  assert.equal('linkRequests' in result, false);
  assert.equal('applications' in result, false);
  const [member] = result.members as Array<Record<string, unknown>>;
  assert.equal(member.name, 'Operator');
  assert.equal('totalPayout' in member, false);
  assert.equal('promotionPoints' in member, false);
  assert.equal('accountName' in member, false);
});
