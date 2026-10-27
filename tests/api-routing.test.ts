import assert from 'node:assert/strict';
import test from 'node:test';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import healthHandler from '../api/health';
import linkRequestsHandler from '../api/link-requests';
import fallbackHandler from '../api/[...path]';
import { SESSION_COOKIE_NAME, createAdminSessionToken } from '../lib/auth';

// Session and credential handling must work without any shared administrator token.
process.env.USSF_SESSION_SECRET = 'api-routing-session-secret-0123456789';
process.env.USSF_ADMIN_PASSWORD = 'Test-Admin-Password-123';
delete process.env.DATABASE_URL;

function createResponse() {
  const state: { status?: number; headers: Record<string, string>; body?: unknown } = { headers: {} };
  const response = {
    status(status: number) {
      state.status = status;
      return this;
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    }
  } as unknown as VercelResponse;
  return { state, response };
}

test('health route returns a structured success response', () => {
  const responseState: { status?: number; headers: Record<string, string>; body?: unknown } = { headers: {} };
  const response = {
    status(status: number) {
      responseState.status = status;
      return this;
    },
    setHeader(name: string, value: string) {
      responseState.headers[name] = value;
      return this;
    },
    json(body: unknown) {
      responseState.body = body;
      return this;
    }
  } as unknown as VercelResponse;
  healthHandler({ method: 'GET' } as VercelRequest, response);
  assert.equal(responseState.status, 200);
  assert.deepEqual(responseState.body, { success: true, service: 'ussf-api' });
});

test('unimplemented API routes fail explicitly with JSON 501', () => {
  const responseState: { status?: number; headers: Record<string, string>; body?: unknown } = { headers: {} };
  const response = {
    status(status: number) {
      responseState.status = status;
      return this;
    },
    setHeader(name: string, value: string) {
      responseState.headers[name] = value;
      return this;
    },
    json(body: unknown) {
      responseState.body = body;
      return this;
    }
  } as unknown as VercelResponse;
  fallbackHandler({ method: 'POST', query: { path: ['claims'] } } as unknown as VercelRequest, response);
  assert.equal(responseState.status, 501);
  assert.match((responseState.body as { error: string }).error, /POST \/api\/claims/);
});

test('account-link endpoint enforces POST and validates the actual payload', async () => {
  const methodResult = createResponse();
  await linkRequestsHandler({ method: 'GET', headers: {} } as VercelRequest, methodResult.response);
  assert.equal(methodResult.state.status, 405);
  assert.deepEqual(methodResult.state.body, { success: false, error: 'Method not allowed.' });

  const invalidResult = createResponse();
  await linkRequestsHandler({ method: 'POST', headers: {}, body: {} } as VercelRequest, invalidResult.response);
  assert.equal(invalidResult.state.status, 400);
  assert.match((invalidResult.state.body as { error: string }).error, /required/);
});

test('valid account-link submission reports missing shared database configuration honestly', async () => {
  const previousUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const result = createResponse();
    await linkRequestsHandler({
      method: 'POST',
      headers: { 'x-vercel-id': 'test-request-id' },
      body: {
        username: 'website-user',
        inGameName: 'Operator_One',
        inGameCid: 'SF-222',
        ingameRank: 'Private',
        f5ScreenshotUrl: 'https://proof.example/image.png'
      }
    } as unknown as VercelRequest, result.response);
    assert.equal(result.state.status, 503);
    assert.deepEqual(result.state.body, {
      success: false,
      error: 'DATABASE_URL is not configured for this Vercel environment.',
      requestId: 'test-request-id'
    });
  } finally {
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
  }
});

test('auth login rejects invalid administrator credentials with 401', async () => {
  const result = createResponse();
  await fallbackHandler({
    method: 'POST',
    query: { path: ['auth', 'login'] },
    headers: {},
    body: { accountName: 'kamado', password: 'wrong-password' }
  } as unknown as VercelRequest, result.response);
  assert.equal(result.state.status, 401);
  assert.deepEqual(result.state.body, { success: false, error: 'Invalid administrator credentials.' });

  const aliasResult = createResponse();
  await fallbackHandler({
    method: 'POST',
    query: { path: ['auth', 'login'] },
    headers: {},
    body: { accountName: 'someone-else', password: 'Test-Admin-Password-123' }
  } as unknown as VercelRequest, aliasResult.response);
  assert.equal(aliasResult.state.status, 401);
});

test('auth login issues an HttpOnly session cookie and no token material', async () => {
  const result = createResponse();
  await fallbackHandler({
    method: 'POST',
    query: { path: ['auth', 'login'] },
    headers: {},
    body: { accountName: 'Kamado', password: 'Test-Admin-Password-123' }
  } as unknown as VercelRequest, result.response);
  assert.equal(result.state.status, 200);
  const setCookie = String(result.state.headers['Set-Cookie'] || '');
  assert.match(setCookie, new RegExp(`${SESSION_COOKIE_NAME}=`));
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  const body = result.state.body as { success: boolean; member: { id: string; isAdmin?: boolean } };
  assert.equal(body.success, true);
  assert.equal(typeof body.member.id, 'string');
  // The response must not echo any bearer/admin token
  assert.equal('token' in body, false);
});

test('auth session reports authentication state from the signed cookie', async () => {
  const anonymous = createResponse();
  await fallbackHandler({
    method: 'GET',
    query: { path: ['auth', 'session'] },
    headers: {}
  } as unknown as VercelRequest, anonymous.response);
  assert.equal(anonymous.state.status, 200);
  assert.deepEqual(anonymous.state.body, { success: true, authenticated: false, member: null });

  const token = createAdminSessionToken({ id: 'admin-kamado', name: 'Kamado' });
  const authenticated = createResponse();
  await fallbackHandler({
    method: 'GET',
    query: { path: ['auth', 'session'] },
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` }
  } as unknown as VercelRequest, authenticated.response);
  assert.equal(authenticated.state.status, 200);
  const body = authenticated.state.body as { authenticated: boolean; member: unknown };
  assert.equal(body.authenticated, true);

  const logout = createResponse();
  await fallbackHandler({
    method: 'POST',
    query: { path: ['auth', 'logout'] },
    headers: {}
  } as unknown as VercelRequest, logout.response);
  assert.equal(logout.state.status, 200);
  assert.match(String(logout.state.headers['Set-Cookie'] || ''), new RegExp(`${SESSION_COOKIE_NAME}=;`));
});

test('protected admin updates are rejected without a session, including account linking', async () => {
  // Account-link review route exists and is guarded (previously a 404)
  const linkWithoutSession = createResponse();
  await fallbackHandler({
    method: 'PUT',
    query: { path: ['link-requests', 'link-1'] },
    headers: {},
    body: { status: 'Approved' }
  } as unknown as VercelRequest, linkWithoutSession.response);
  assert.equal(linkWithoutSession.state.status, 401);
  assert.match((linkWithoutSession.state.body as { error: string }).error, /session required/i);

  // Member updates are guarded too
  const memberWithoutSession = createResponse();
  await fallbackHandler({
    method: 'PUT',
    query: { path: ['members', 'member-1'] },
    headers: {},
    body: { id: 'member-1', rank: 'Sergeant' }
  } as unknown as VercelRequest, memberWithoutSession.response);
  assert.equal(memberWithoutSession.state.status, 401);

  // Claims review is guarded as well
  const claimWithoutSession = createResponse();
  await fallbackHandler({
    method: 'PUT',
    query: { path: ['claims', 'claim-1'] },
    headers: {},
    body: { status: 'Approved' }
  } as unknown as VercelRequest, claimWithoutSession.response);
  assert.equal(claimWithoutSession.state.status, 401);
});

test('signed sessions pass authorization and reach the shared database layer', async () => {
  const token = createAdminSessionToken({ id: 'admin-kamado', name: 'Kamado' });
  const cookie = `${SESSION_COOKIE_NAME}=${token}`;

  const linkReview = createResponse();
  await fallbackHandler({
    method: 'PUT',
    query: { path: ['link-requests', 'link-1'] },
    headers: { cookie },
    body: { status: 'Approved', reviewedBy: 'Kamado' }
  } as unknown as VercelRequest, linkReview.response);
  assert.equal(linkReview.state.status, 503);
  assert.match((linkReview.state.body as { error: string }).error, /DATABASE_URL is not configured/);

  const memberUpdate = createResponse();
  await fallbackHandler({
    method: 'PUT',
    query: { path: ['members', 'member-1'] },
    headers: { cookie },
    body: { id: 'member-1', rank: 'Sergeant' }
  } as unknown as VercelRequest, memberUpdate.response);
  assert.equal(memberUpdate.state.status, 503);
  assert.match((memberUpdate.state.body as { error: string }).error, /DATABASE_URL is not configured/);
});

test('public submissions remain reachable without a session', async () => {
  const socialPost = createResponse();
  await fallbackHandler({
    method: 'POST',
    query: { path: ['social-posts'] },
    headers: {},
    body: { id: 'post-1', content: 'Mission update' }
  } as unknown as VercelRequest, socialPost.response);
  assert.notEqual(socialPost.state.status, 401);
  assert.equal(socialPost.state.status, 503);
});
