import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Users, MousePointerClick, ShoppingBag, Link2, FileText, Crown, ArrowRight, Eye, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../services/api';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface Stats {
  users: number;
  shortLinks: number;
  linkClicks: number;
  entities: number;
  records: number;
  bioViews: number;
  purchasesPending: number;
  purchasesApproved: number;
  clicksChart: { day: string; clicks: number }[];
}

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color?: string; href?: string;
}) {
  const inner = (
    <div className="card" style={{ padding: '1.5rem', cursor: href ? 'pointer' : 'default', transition: 'border-color .15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '.78rem', color: 'var(--color-text-muted)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            {label}
          </p>
          <p style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: '.75rem', color: 'var(--color-text-muted)', marginTop: '.375rem' }}>{sub}</p>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color || 'var(--color-accent)'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color || 'var(--color-accent)'} />
        </div>
      </div>
    </div>
  );
  return href ? <Link to={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link> : inner;
}

const APP_META: Record<string, { icon: string; color: string }> = {
  app2: { icon: '🔗', color: '#6c63ff' },
  app3: { icon: '🗃️', color: '#00d4aa' },
  app4: { icon: '⬇️', color: '#ffb347' },
  app5: { icon: '🔄', color: '#ff7eb3' },
  app6: { icon: '📄', color: '#4ecdc4' },
};

export function DashboardPage() {
  const { user, tenant } = useAuthStore();
  const isFreePlan = tenant?.plan === 'free';

  const { data: appsData } = useQuery({
    queryKey: ['apps'],
    queryFn: () => usersApi.getApps().then(r => r.data.data),
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/users/stats').then(r => r.data.data),
    refetchInterval: 60000,
  });

  const pending = stats?.purchasesPending || 0;

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1200 }} className="animate-fade-in-up">

      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '.25rem' }}>
            Olá, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '.875rem' }}>
            {tenant?.name} · Plano <strong style={{ color: tenant?.plan === 'pro' ? 'var(--color-accent)' : 'inherit' }}>{tenant?.plan === 'pro' ? 'Pro ⭐' : 'Gratuito'}</strong>
          </p>
        </div>
        {pending > 0 && (
          <Link to="/purchase-requests" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', background: 'rgba(108,99,255,.12)', border: '1px solid rgba(108,99,255,.3)', borderRadius: 10, padding: '.625rem 1rem', fontSize: '.875rem', color: '#a89ff0', cursor: 'pointer' }}>
              <AlertCircle size={15} />
              <span><strong>{pending}</strong> pagamento{pending > 1 ? 's' : ''} aguardando aprovação</span>
              <ArrowRight size={13} />
            </div>
          </Link>
        )}
      </div>

      {/* Upgrade banner */}
      {isFreePlan && (
        <div style={{ padding: '1rem 1.5rem', borderRadius: 12, background: 'linear-gradient(135deg,rgba(108,99,255,.1),rgba(0,212,170,.07))', border: '1px solid rgba(108,99,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <Crown size={18} color="var(--color-accent)" />
            <div>
              <p style={{ fontWeight: 600, fontSize: '.9rem' }}>Você está no plano Gratuito</p>
              <p style={{ fontSize: '.8rem', color: 'var(--color-text-muted)' }}>Faça upgrade para Pro e desbloqueie encurtador de links e gerenciador de dados</p>
            </div>
          </div>
          <a href="/checkout.html" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Assinar Pro — R$29,90 <ArrowRight size={14} />
            </button>
          </a>
        </div>
      )}

      {/* Stats grid */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={Users}           label="Usuários"       value={statsLoading ? '—' : (stats?.users ?? 0)}       sub="neste workspace"     color="var(--color-accent)"   href="/users" />
        <StatCard icon={Link2}           label="Links Curtos"   value={statsLoading ? '—' : (stats?.shortLinks ?? 0)}   sub="criados"             color="#6c63ff"               href="/apps" />
        <StatCard icon={MousePointerClick} label="Cliques"      value={statsLoading ? '—' : (stats?.linkClicks ?? 0)}  sub="nos links"           color="#00d4aa" />
        <StatCard icon={FileText}        label="Registros"      value={statsLoading ? '—' : (stats?.records ?? 0)}      sub="no gerenciador"      color="#ffb347" />
        <StatCard icon={Eye}             label="Visitas Bio"    value={statsLoading ? '—' : (stats?.bioViews ?? 0)}     sub="na página bio"       color="#ff7eb3" />
        <StatCard icon={ShoppingBag}     label="Compras"        value={statsLoading ? '—' : (stats?.purchasesApproved ?? 0)} sub="aprovadas"      color="#4ecdc4"               href="/purchase-requests" />
      </div>

      {/* Chart + Apps grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Clicks chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Cliques nos links — últimos 7 dias</h2>
          {stats?.clicksChart && stats.clicksChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.clicksChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: '#8888a8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888a8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }}
                  cursor={{ fill: 'rgba(108,99,255,.08)' }}
                />
                <Bar dataKey="clicks" radius={[4, 4, 0, 0]}>
                  {(stats.clicksChart || []).map((_, i) => (
                    <Cell key={i} fill="#6c63ff" fillOpacity={0.7 + (i / (stats.clicksChart.length || 1)) * 0.3} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '.875rem', flexDirection: 'column', gap: '.5rem' }}>
              <MousePointerClick size={24} opacity={0.3} />
              <span>Sem dados ainda — crie links para ver analytics</span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Ações rápidas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
            {[
              { label: 'Baixar um vídeo', sub: 'YouTube, TikTok, Instagram...', path: '/app4', icon: '⬇️' },
              { label: 'Converter JSON para Excel', sub: 'Transformar dados em planilha', path: '/app5', icon: '🔄' },
              { label: 'Criar página bio', sub: 'Link na bio para o Instagram', path: '/app6', icon: '📄' },
              { label: 'Encurtar um link', sub: 'Com QR code e analytics', path: '/app2', icon: '🔗' },
            ].map(item => (
              <a key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem', borderRadius: 9, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'border-color .15s' }}>
                  <span style={{ fontSize: '1.25rem', width: 32, textAlign: 'center' }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '.875rem', fontWeight: 500 }}>{item.label}</p>
                    <p style={{ fontSize: '.75rem', color: 'var(--color-text-muted)' }}>{item.sub}</p>
                  </div>
                  <ArrowRight size={14} color="var(--color-text-muted)" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Apps list */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Seus Apps</h2>
          <Link to="/apps" style={{ textDecoration: 'none', fontSize: '.8rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
            Gerenciar <ArrowRight size={12} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '.75rem' }}>
          {Array.isArray(appsData) && appsData.filter((a: { key: string }) => a.key !== 'app1').map((app: { key: string; description: string; path: string; hasAccess: boolean }) => {
            const meta = APP_META[app.key] || { icon: '📦', color: '#8888a8' };
            return (
              <a key={app.key} href={app.hasAccess ? app.path : '/checkout.html'} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1rem', borderRadius: 10, background: 'var(--color-surface-2)', border: `1px solid ${app.hasAccess ? 'var(--color-border)' : 'transparent'}`, opacity: app.hasAccess ? 1 : 0.55, cursor: 'pointer', textAlign: 'center', transition: 'border-color .15s' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '.375rem' }}>{meta.icon}</div>
                  <p style={{ fontSize: '.78rem', fontWeight: 500, lineHeight: 1.3 }}>{app.description}</p>
                  <p style={{ fontSize: '.68rem', color: 'var(--color-text-muted)', marginTop: '.25rem' }}>
                    {app.hasAccess ? app.path : '🔒 Pro'}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
