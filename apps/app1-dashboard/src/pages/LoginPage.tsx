import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { User, Tenant } from '../store/authStore';

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type LoginForm = z.infer<typeof LoginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      const res = await authApi.login(data.email, data.password);
      const { user, tenant, accessToken, refreshToken } = res.data.data as {
        user: User; tenant: Tenant; accessToken: string; refreshToken: string;
      };
      setAuth({ user, tenant, accessToken, refreshToken });
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setServerError(msg || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '1.5rem',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%', width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem', boxShadow: 'var(--shadow-glow)',
          }}>
            <Zap size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.375rem' }}>
            Bem-vindo de volta
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Entre no seu workspace
          </p>
        </div>

        {/* Form */}
        <div className="card" style={{ padding: '2rem' }}>
          {serverError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)',
              marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--color-danger)',
            }}>
              <AlertCircle size={15} />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="input-field"
                placeholder="you@company.com"
                autoComplete="email"
              />
              {errors.email && (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text-muted)' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)', padding: '0.25rem',
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Não tem conta?{' '}
            <a href="/checkout.html" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
              Assinar agora
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
