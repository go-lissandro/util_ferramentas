import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Boxes, Users, TrendingUp, Zap, ArrowRight, Crown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usersApi, billingApi } from '../services/api';
import { Link } from 'react-router-dom';

const MOCK_USAGE = [
  { day: 'Mon', requests: 40 }, { day: 'Tue', requests: 80 },
  { day: 'Wed', requests: 55 }, { day: 'Thu', requests: 120 },
  { day: 'Fri', requests: 95 }, { day: 'Sat', requests: 30 },
  { day: 'Sun', requests: 20 },
];

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </p>
          <p style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>{sub}</p>}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color || 'var(--color-accent)'}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color || 'var(--color-accent)'} />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user, tenant } = useAuthStore();

  const { data: appsData } = useQuery({
    queryKey: ['apps'],
    queryFn: () => usersApi.getApps().then((r) => r.data.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data),
  });

  const { data: planData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((r) => r.data.data),
  });

  const isFreePlan = tenant?.plan === 'free';

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1200 }} className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Good day, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          {tenant?.name} · {tenant?.slug}
        </p>
      </div>

      {/* Upgrade banner */}
      {isFreePlan && (
        <div style={{
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(0,212,170,0.08))',
          border: '1px solid rgba(108,99,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Crown size={18} color="var(--color-accent)" />
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>You're on the Free plan</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Upgrade to Pro for unlimited apps, API requests and team members
              </p>
            </div>
          </div>
          <Link to="/billing" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Upgrade to Pro <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={Boxes} label="Active Apps" value={Array.isArray(appsData) ? appsData.filter((a: { hasAccess: boolean }) => a.hasAccess).length : 0} sub="Apps accessible" color="var(--color-accent)" />
        <StatCard icon={Users} label="Team Members" value={Array.isArray(usersData) ? usersData.length : 1} sub="Across workspace" color="var(--color-accent-2)" />
        <StatCard icon={TrendingUp} label="API Requests" value="440" sub="Last 7 days" color="#ffb347" />
        <StatCard icon={Zap} label="Current Plan" value={planData?.plan === 'pro' ? 'Pro' : 'Free'} sub={planData?.plan === 'pro' ? 'All features unlocked' : '50 req/day limit'} color={planData?.plan === 'pro' ? 'var(--color-accent-2)' : 'var(--color-text-muted)'} />
      </div>

      {/* Usage chart */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>API Usage (Last 7 days)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={MOCK_USAGE} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: '#8888a8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8888a8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }}
              cursor={{ stroke: 'var(--color-border-2)' }}
            />
            <Area type="monotone" dataKey="requests" stroke="#6c63ff" strokeWidth={2} fill="url(#usageGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Apps list */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Your Apps</h2>
          <Link to="/apps" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Manage <ArrowRight size={12} />
            </span>
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.isArray(appsData) && appsData.map((app: { key: string; description: string; path: string; hasAccess: boolean }) => (
            <a key={app.key} href={app.path} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                cursor: app.hasAccess ? 'pointer' : 'not-allowed',
                opacity: app.hasAccess ? 1 : 0.5,
                transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: app.hasAccess ? 'var(--color-success)' : 'var(--color-text-muted)' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{app.description}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{app.path}</p>
                  </div>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
