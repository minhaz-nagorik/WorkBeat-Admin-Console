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

// A change an IT Admin asked for, waiting for a Company Admin (backend round 6).
export type Change = {
  id: string; status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'failed';
  resource: string; action: string; target_id: string | null; summary: string;
  requested_by: { id: string; name: string }; requested_at: string;
  decided_by: { id: string; name: string } | null; decided_at: string | null;
  reason: string | null; error: { code: string; message: string } | null;
};

export type ApiError = { error?: string; code: string; fields?: string[] };
