// ─────────────────────────────────────────────────────────
// shared/types/index.ts
// Shared TypeScript types used across gateway + apps
// ─────────────────────────────────────────────────────────

// ── Auth & Identity ─────────────────────────────────────

export type UserRole = 'admin' | 'member';
export type Plan     = 'free' | 'pro';

export interface JwtPayload {
  sub:      string;   // user ID
  tenantId: string;
  email:    string;
  role:     UserRole;
  plan:     Plan;
  iat:      number;
  exp:      number;
}

export interface AuthUser {
  id:       string;
  name:     string;
  email:    string;
  role:     UserRole;
}

export interface Tenant {
  id:      string;
  name:    string;
  slug:    string;
  plan:    Plan;
}

// ── API Response shapes ─────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?:   T;
  error?:  string;
  code?:   string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

// ── Gateway context headers ─────────────────────────────
// These are forwarded from gateway to upstream services

export interface GatewayHeaders {
  'x-user-id':    string;
  'x-tenant-id':  string;
  'x-user-role':  UserRole;
  'x-user-plan':  Plan;
  'x-user-email': string;
  'x-request-id': string;
  'x-forwarded-app': string;
}

// ── Plans & Limits ──────────────────────────────────────

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    urlShortenings: 50,
    apiRequestsPerDay: 100,
    teamMembers: 1,
    apps: 2,
  },
  pro: {
    urlShortenings: -1,          // -1 = unlimited
    apiRequestsPerDay: 10000,
    teamMembers: 10,
    apps: -1,
  },
};

export interface PlanLimits {
  urlShortenings:    number;
  apiRequestsPerDay: number;
  teamMembers:       number;
  apps:              number;
}

// ── App Registry ────────────────────────────────────────

export interface AppDefinition {
  key:         string;
  pathPrefix:  string;
  description: string;
  protected:   boolean;
  minPlan:     Plan;
}
