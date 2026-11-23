// Written from WorkBeat-Backend docs/core/api/portal-api.md until packages/shared exists (A10).
// Company Admin is the only fixed company role; everyone else is a 'member' of a custom role (backend 0013).
export type Role = 'company_admin' | 'member' | 'super_admin';
export const PERMS = ['reports', 'employees.view', 'employees.edit', 'devices.view', 'devices.edit', 'alerts.view', 'alerts.edit',
  'policy.view', 'policy.edit', 'deployment'] as const;
export type Perm = (typeof PERMS)[number];
export type CustomRole = { id: string; name: string; permissions: Perm[]; team_only: boolean; users: number; created_at: string };
export type CompanyStatus = 'trial' | 'active' | 'suspended' | 'expired';

export type Me = {
  id: string; email: string; name: string; role: Role;
  role_id?: string | null; role_name?: string | null; permissions?: Perm[]; team_only?: boolean;
  must_change_password?: boolean; // signed in with a temporary password (backend round 5)
  company: { id: string; name: string; slug: string; status: CompanyStatus; timezone: string } | null;
};

export type StatusInfo = {
  status: CompanyStatus;
  suspended_reason: 'payment_failed' | 'staff' | null;
  trial_ends_at: string | null; expired_at: string | null; blocking_ends_at: string | null;
};

// A change someone asked for, waiting for a Company Admin (maker-checker).
export type Change = {
  id: string; status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'failed';
  resource: string; action: string; target_id: string | null; summary: string;
  requested_by: { id: string; name: string }; requested_at: string;
  decided_by: { id: string; name: string } | null; decided_at: string | null;
  reason: string | null; error: { code: string; message: string } | null;
};

export type ApiError = { error?: string; code: string; fields?: string[] };
