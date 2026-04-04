import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { User, Tenant } from '../store/authStore';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantName: z.string().min(2, 'Workspace name required'),
});
type RegisterForm = z.infer<typeof RegisterSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    try {
      const res = await authApi.register(data);
      const { user, tenant, accessToken, refreshToken } = res.data.data as {
        user: User; tenant: Tenant; accessToken: string; refreshToken: string;
      };
      setAuth({ user, tenant, accessToken, refreshToken });
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setServerError(msg || 'Registration failed. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '1.5rem',
    }}>
      <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: 'var(--shadow-glow)' }}>
            <Zap size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.375rem' }}>Create your workspace</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Free forever, upgrade when you're ready</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {serverError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)', marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--color-danger)' }}>
              <AlertCircle size={15} />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {[
              { name: 'tenantName' as const, label: 'Workspace name', placeholder: 'Acme Corp', type: 'text' },
              { name: 'name' as const, label: 'Your full name', placeholder: 'Jane Smith', type: 'text' },
              { name: 'email' as const, label: 'Work email', placeholder: 'jane@company.com', type: 'email' },
              { name: 'password' as const, label: 'Password', placeholder: '••••••••', type: 'password' },
            ].map((field) => (
              <div key={field.name} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>
                  {field.label}
                </label>
                <input {...register(field.name)} type={field.type} className="input-field" placeholder={field.placeholder} />
                {errors[field.name] && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors[field.name]?.message}
                  </p>
                )}
              </div>
            ))}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }} disabled={isSubmitting}>
              {isSubmitting ? <span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> : 'Create workspace — it\'s free'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Already have a workspace?{' '}
            <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
