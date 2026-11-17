// Written from WorkBeat-Backend docs/core/api/portal-api.md until packages/shared exists (A10).
export type Role = 'company_admin' | 'manager' | 'it_admin' | 'super_admin';
export type CompanyStatus = 'trial' | 'active' | 'suspended' | 'expired';

export type Me = {
  id: string; email: string; name: string; role: Role;
  must_change_password?: boolean; // signed in with a temporary password (backend round 5)
  company: { id: string; name: string; slug: string; status: CompanyStatus; timezone: string } | null;
};

export type StatusInfo = {
  status: CompanyStatus;
  suspended_reason: 'payment_failed' | 'staff' | null;
  trial_ends_at: string | null; expired_at: string | null; blocking_ends_at: string | null;
};

export type ApiError = { error?: string; code: string; fields?: string[] };
