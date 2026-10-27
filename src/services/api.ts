import { 
  USSFMember, 
  FieldReport, 
  FinancialClaim, 
  RewardItem, 
  SocialPost, 
  DirectMessage, 
  AccountLinkRequest, 
  RecruitmentApplication, 
  ForgotPasswordRequest, 
  AdminEvent, 
  DailyLoginReward, 
  PendingLoginRewardClaim, 
  PromotionRequest, 
  BirthdayGift, 
  SquadGroupChat, 
  USSFAchievement, 
  USSFAssetItem,
  DiscordPresenceStatus,
  USSF_GROUP_INFO
} from '../data/ussfData';

export interface AuthoritativeSystemState {
  version: number;
  lastUpdated: string;
  members: USSFMember[];
  fieldReports: FieldReport[];
  claims: FinancialClaim[];
  rewardCatalog: RewardItem[];
  socialPosts: SocialPost[];
  dms: DirectMessage[];
  linkRequests: AccountLinkRequest[];
  applications: RecruitmentApplication[];
  forgotPwRequests: ForgotPasswordRequest[];
  adminEvents: AdminEvent[];
  loginRewards: DailyLoginReward[];
  pendingLoginClaims: PendingLoginRewardClaim[];
  promotionRequests: PromotionRequest[];
  groupInfo: typeof USSF_GROUP_INFO;
  birthdayGifts: BirthdayGift[];
  squadGroups: SquadGroupChat[];
  achievements: USSFAchievement[];
  customAssets: USSFAssetItem[];
}

interface ApiResponse {
  success?: boolean;
  error?: string;
}

let unauthorizedHandler: (() => void) | null = null;

/** Registered by the app so an expired or missing session can drop admin UI state. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export async function parseApiResponse<T extends ApiResponse>(res: Response, action: string): Promise<T> {
  const contentType = res.headers.get('content-type') || 'unknown content type';
  const rawBody = await res.text();
  let json: T;

  try {
    json = JSON.parse(rawBody) as T;
  } catch {
    const excerpt = rawBody.trim().replace(/\s+/g, ' ').slice(0, 240);
    throw new Error(`${action} failed: HTTP ${res.status} (${contentType})${excerpt ? `: ${excerpt}` : ''}`);
  }

  if (!res.ok || json.success === false) {
    if (res.status === 401 && unauthorizedHandler) unauthorizedHandler();
    throw new Error(json.error || `${action} failed: HTTP ${res.status}`);
  }
  return json;
}

export interface AdminSessionState {
  authenticated: boolean;
  member: USSFMember | null;
}

const jsonHeaders: HeadersInit = { 'Content-Type': 'application/json' };

export const api = {
  // Administrator sign-in, sign-out and session restore.
  // The server validates credentials and replies with an HttpOnly session cookie;
  // every later admin request carries that cookie automatically (same-origin).
  async loginAdmin(accountName: string, password: string): Promise<USSFMember> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: jsonHeaders,
      credentials: 'same-origin',
      body: JSON.stringify({ accountName, password })
    });
    const json = await parseApiResponse<{ success: boolean; member?: USSFMember; error?: string }>(res, 'Administrator sign-in');
    if (!json.member) throw new Error('Administrator sign-in failed: response did not include the administrator profile.');
    return json.member;
  },

  async logoutAdmin(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Best effort: the cookie is HttpOnly, so only the server can clear it.
    }
  },

  async getSession(): Promise<AdminSessionState> {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'same-origin', headers: jsonHeaders });
      const json = await res.json() as { success?: boolean; authenticated?: boolean; member?: USSFMember | null };
      if (!json.success) return { authenticated: false, member: null };
      return { authenticated: Boolean(json.authenticated), member: json.member || null };
    } catch {
      return { authenticated: false, member: null };
    }
  },

  // 1. Fetch entire authoritative database state
  async getState(): Promise<AuthoritativeSystemState> {
    const res = await fetch('/api/state');
    const json = await parseApiResponse<{ success: boolean; data?: AuthoritativeSystemState; error?: string }>(res, 'Fetch state');
    if (!json.data) throw new Error('Fetch state failed: response did not include authoritative data.');
    return json.data;
  },

  async getAdminState(): Promise<AuthoritativeSystemState> {
    const res = await fetch('/api/admin-state', { headers: jsonHeaders, credentials: 'same-origin' });
    const json = await parseApiResponse<{ success: boolean; data?: AuthoritativeSystemState; error?: string }>(res, 'Fetch administrative state');
    if (!json.data) throw new Error('Fetch administrative state failed: response did not include authoritative data.');
    return json.data;
  },

  // 2. Members Management
  async saveMember(member: USSFMember): Promise<USSFMember> {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
    const json = await parseApiResponse<{ success: boolean; member?: USSFMember; error?: string }>(res, 'Save member');
    if (!json.member) throw new Error('Save member failed: response did not include the saved member.');
    return json.member;
  },

  async updateMember(id: string, updates: Partial<USSFMember>): Promise<USSFMember> {
    const res = await fetch(`/api/members/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await parseApiResponse<{ success: boolean; member?: USSFMember; error?: string }>(res, 'Update member');
    if (!json.member) throw new Error('Update member failed: response did not include the saved member.');
    return json.member;
  },

  async deleteMember(id: string): Promise<boolean> {
    const res = await fetch(`/api/members/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    await parseApiResponse<{ success: boolean; error?: string }>(res, 'Delete member');
    return true;
  },

  async updatePresence(id: string, presenceStatus: DiscordPresenceStatus): Promise<boolean> {
    const res = await fetch(`/api/members/${encodeURIComponent(id)}/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presenceStatus })
    });
    const json = await parseApiResponse<{ success: boolean; error?: string }>(res, 'Update presence');
    return json.success;
  },

  // 3. Financial Claims
  async submitClaim(claim: FinancialClaim): Promise<FinancialClaim> {
    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim)
    });
    const json = await parseApiResponse<{ success: boolean; claim?: FinancialClaim; error?: string }>(res, 'Submit financial claim');
    if (!json.claim) throw new Error('Submit financial claim failed: response did not include the saved claim.');
    return json.claim;
  },

  async reviewClaim(id: string, status: string, note?: string, reviewedBy?: string, rejectionReason?: string): Promise<FinancialClaim> {
    const res = await fetch(`/api/claims/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note, reviewedBy, rejectionReason })
    });
    const json = await parseApiResponse<{ success: boolean; claim?: FinancialClaim; error?: string }>(res, 'Review financial claim');
    if (!json.claim) throw new Error('Review financial claim failed: response did not include the saved claim.');
    return json.claim;
  },

  // 4. Field Reports
  async submitReport(report: FieldReport): Promise<FieldReport> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
    const json = await parseApiResponse<{ success: boolean; report?: FieldReport; error?: string }>(res, 'Submit report');
    if (!json.report) throw new Error('Submit report failed: response did not include the saved report.');
    return json.report;
  },

  async reviewReport(id: string, status: string): Promise<FieldReport> {
    const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await parseApiResponse<{ success: boolean; report?: FieldReport; error?: string }>(res, 'Review report');
    if (!json.report) throw new Error('Review report failed: response did not include the saved report.');
    return json.report;
  },

  // 5. Promotions
  async submitPromotion(promo: PromotionRequest): Promise<PromotionRequest> {
    const res = await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promo)
    });
    const json = await parseApiResponse<{ success: boolean; promo?: PromotionRequest; error?: string }>(res, 'Submit promotion request');
    if (!json.promo) throw new Error('Submit promotion request failed: response did not include the saved request.');
    return json.promo;
  },

  async reviewPromotion(id: string, status: string, approvingOfficer?: string, feedback?: string, rejectionReason?: string): Promise<PromotionRequest> {
    const res = await fetch(`/api/promotions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, approvingOfficer, feedback, rejectionReason })
    });
    const json = await parseApiResponse<{ success: boolean; promo?: PromotionRequest; error?: string }>(res, 'Review promotion request');
    if (!json.promo) throw new Error('Review promotion request failed: response did not include the saved request.');
    return json.promo;
  },

  // 6. Recruitment Applications
  async submitApplication(application: RecruitmentApplication): Promise<RecruitmentApplication> {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(application)
    });
    const json = await parseApiResponse<{ success: boolean; application?: RecruitmentApplication; error?: string }>(res, 'Submit enlistment application');
    if (!json.application) throw new Error('Submit enlistment application failed: response did not include the saved application.');
    return json.application;
  },

  async reviewApplication(id: string, status: string, reviewedBy?: string, rejectionReason?: string): Promise<RecruitmentApplication> {
    const res = await fetch(`/api/applications/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewedBy, rejectionReason })
    });
    const json = await parseApiResponse<{ success: boolean; application?: RecruitmentApplication; error?: string }>(res, 'Review application');
    if (!json.application) throw new Error('Review application failed: response did not include the saved application.');
    return json.application;
  },

  async submitLinkRequest(request: AccountLinkRequest): Promise<AccountLinkRequest> {
    const res = await fetch('/api/link-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    const json = await parseApiResponse<{ success: boolean; request?: AccountLinkRequest; error?: string }>(res, 'Submit account-link request');
    if (!json.request) throw new Error('Submit account-link request failed: response did not include the saved request.');
    return json.request;
  },

  async createAsset(asset: USSFAssetItem): Promise<USSFAssetItem[]> {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(asset)
    });
    const json = await parseApiResponse<{ success: boolean; assets?: USSFAssetItem[]; error?: string }>(res, 'Create asset');
    if (!json.assets) throw new Error('Create asset failed: response did not include the saved asset list.');
    return json.assets;
  },

  async updateAsset(asset: USSFAssetItem): Promise<USSFAssetItem[]> {
    const res = await fetch(`/api/assets/${encodeURIComponent(asset.id)}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(asset)
    });
    const json = await parseApiResponse<{ success: boolean; assets?: USSFAssetItem[]; error?: string }>(res, 'Update asset');
    if (!json.assets) throw new Error('Update asset failed: response did not include the saved asset list.');
    return json.assets;
  },

  async deleteAsset(id: string): Promise<USSFAssetItem[]> {
    const res = await fetch(`/api/assets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: jsonHeaders
    });
    const json = await parseApiResponse<{ success: boolean; assets?: USSFAssetItem[]; error?: string }>(res, 'Delete asset');
    if (!json.assets) throw new Error('Delete asset failed: response did not include the saved asset list.');
    return json.assets;
  },

  // 7. Group Info
  async updateGroupInfo(info: Partial<typeof USSF_GROUP_INFO>): Promise<typeof USSF_GROUP_INFO> {
    const res = await fetch('/api/group-info', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(info)
    });
    const json = await parseApiResponse<{ success: boolean; groupInfo?: typeof USSF_GROUP_INFO; error?: string }>(res, 'Update group specifications');
    if (!json.groupInfo) throw new Error('Update group specifications failed: response did not include the saved values.');
    return json.groupInfo;
  },

  // 8. Admin Events
  async saveAdminEvent(event: AdminEvent): Promise<AdminEvent> {
    const res = await fetch('/api/admin-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    const json = await parseApiResponse<{ success: boolean; event?: AdminEvent; error?: string }>(res, 'Save admin event');
    if (!json.event) throw new Error('Save admin event failed: response did not include the saved event.');
    return json.event;
  },

  // 9. Birthday Gifts
  async sendBirthdayGift(gift: BirthdayGift): Promise<BirthdayGift> {
    const res = await fetch('/api/birthdays/gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gift)
    });
    const json = await parseApiResponse<{ success: boolean; gift?: BirthdayGift; error?: string }>(res, 'Send birthday gift');
    if (!json.gift) throw new Error('Send birthday gift failed: response did not include the saved gift.');
    return json.gift;
  },

  // 10. Social Posts
  async submitSocialPost(post: SocialPost): Promise<SocialPost> {
    const res = await fetch('/api/social-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });
    const json = await parseApiResponse<{ success: boolean; post?: SocialPost; error?: string }>(res, 'Publish social post');
    if (!json.post) throw new Error('Publish social post failed: response did not include the saved post.');
    return json.post;
  },

  // 11. Account Link Requests
  async reviewLinkRequest(id: string, status: string, reviewedBy?: string, rejectionReason?: string): Promise<AccountLinkRequest> {
    const res = await fetch(`/api/link-requests/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewedBy, rejectionReason })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to review link request');
    }
    return json.linkRequest || json.request;
  },

  // 12. Login Reward Claims
  async submitLoginClaim(claim: PendingLoginRewardClaim): Promise<PendingLoginRewardClaim> {
    const res = await fetch('/api/login-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to submit login reward claim');
    }
    return json.claim;
  },

  async reviewLoginClaim(id: string, status: string, reviewedBy?: string, rejectionReason?: string): Promise<PendingLoginRewardClaim> {
    const res = await fetch(`/api/login-claims/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewedBy, rejectionReason })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to review login reward claim');
    }
    return json.claim;
  },

  // 13. Milestone Choices Config
  async getMilestoneChoices(): Promise<any[]> {
    const res = await fetch('/api/milestone-choices');
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch milestone choices');
    }
    return json.choices;
  },

  async saveMilestoneChoices(choices: any[]): Promise<any[]> {
    const res = await fetch('/api/milestone-choices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choices })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update milestone choices');
    }
    return json.choices;
  },

  // 14. Custom Assets (Skins & Shaders)
  async saveCustomAsset(asset: USSFAssetItem): Promise<USSFAssetItem> {
    const res = await fetch('/api/custom-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to save custom asset');
    }
    return json.asset;
  },

  async deleteCustomAsset(id: string): Promise<boolean> {
    const res = await fetch(`/api/custom-assets/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete custom asset');
    }
    return true;
  },

  // 15. Reset Clean DB
  async resetCleanDatabase(): Promise<void> {
    const res = await fetch('/api/reset-clean', { method: 'POST' });
    await parseApiResponse<{ success: boolean; error?: string }>(res, 'Reset database');
  }
};
