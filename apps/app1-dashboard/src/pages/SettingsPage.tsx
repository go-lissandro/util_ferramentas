import { useAuthStore } from '../store/authStore';
import { Building2, User, Shield } from 'lucide-react';

export function SettingsPage() {
  const { user, tenant } = useAuthStore();

  const profileFields = [
    { label: 'Nome completo',   value: user?.name  || '' },
    { label: 'Email',           value: user?.email || '' },
    { label: 'Função',          value: user?.role === 'admin' ? 'Administrador' : 'Membro' },
  ];

  const workspaceFields = [
    { label: 'Slug do workspace', value: tenant?.slug || '' },
    { label: 'Plano',             value: tenant?.plan === 'pro' ? '⭐ Pro' : 'Gratuito' },
    { label: 'ID do tenant',      value: tenant?.id  || '', mono: true },
  ];

  return (
    <div style={{ padding: '2.5rem', maxWidth: 700 }} className="animate-fade-in-up">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '.25rem' }}>Configurações</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '.875rem' }}>Informações da sua conta e workspace</p>
      </div>

      {/* Perfil */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <User size={15} color="var(--color-accent)" /> Perfil
        </h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {profileFields.map(({ label, value }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 500, marginBottom: '.375rem', color: 'var(--color-text-muted)' }}>
                {label}
              </label>
              <input className="input-field" value={value} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Workspace */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <Building2 size={15} color="var(--color-accent-2)" /> Workspace
        </h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {workspaceFields.map(({ label, value, mono }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 500, marginBottom: '.375rem', color: 'var(--color-text-muted)' }}>
                {label}
              </label>
              <input
                className={`input-field${mono ? ' font-mono' : ''}`}
                value={value} readOnly
                style={{ opacity: 0.7, cursor: 'not-allowed', fontSize: mono ? '.8rem' : undefined }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Segurança */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '.9rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <Shield size={15} color="var(--color-accent)" /> Segurança
        </h2>
        <p style={{ fontSize: '.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Para alterar sua senha ou dados de conta, entre em contato com o administrador ou envie um e-mail de suporte.
        </p>
        <a href="/checkout.html" style={{ textDecoration: 'none' }}>
          <button className="btn-ghost" style={{ fontSize: '.85rem' }}>Falar com suporte</button>
        </a>
      </div>
    </div>
  );
}
