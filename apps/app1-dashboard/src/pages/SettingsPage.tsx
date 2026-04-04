import { useAuthStore } from '../store/authStore';
import { Building2, Mail, User } from 'lucide-react';

export function SettingsPage() {
  const { user, tenant } = useAuthStore();

  return (
    <div style={{ padding: '2.5rem', maxWidth: 700 }} className="animate-fade-in-up">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Settings</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Manage your account and workspace</p>
      </div>

      {/* Profile section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={15} color="var(--color-accent)" /> Profile
        </h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            { label: 'Full name', value: user?.name || '' },
            { label: 'Email address', value: user?.email || '' },
            { label: 'Role', value: user?.role || '' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>
                {label}
              </label>
              <input className="input-field" value={value} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Workspace section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={15} color="var(--color-accent-2)" /> Workspace
        </h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            { label: 'Workspace slug', value: tenant?.slug || '' },
            { label: 'Plan', value: tenant?.plan === 'pro' ? '✦ Pro' : 'Free' },
            { label: 'Tenant ID', value: tenant?.id || '' },
          ].map(({ label, value }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>
                {label}
              </label>
              <input className="input-field font-mono" value={value} readOnly style={{ opacity: 0.7, cursor: 'not-allowed', fontSize: '0.8rem' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
