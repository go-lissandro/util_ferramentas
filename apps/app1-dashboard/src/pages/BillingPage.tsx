import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, Crown, Zap, ArrowRight } from 'lucide-react';
import { billingApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function BillingPage() {
  const { tenant } = useAuthStore();

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => billingApi.getPlans().then((r) => r.data.data),
  });

  const { data: subData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((r) => r.data.data),
  });

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => billingApi.checkout(planId),
    onSuccess: (res) => {
      const url = res.data.data?.checkoutUrl;
      if (url) window.location.href = url;
      else alert(res.data.data?.message || 'Stripe not configured yet');
    },
  });

  const currentPlan = (subData as { plan?: string })?.plan || 'free';

  return (
    <div style={{ padding: '2.5rem', maxWidth: 900 }} className="animate-fade-in-up">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Billing & Plans</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Current plan: <strong style={{ color: 'var(--color-text)' }}>{currentPlan === 'pro' ? '✦ Pro' : 'Free'}</strong>
        </p>
      </div>

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {Array.isArray(plansData) && plansData.map((plan: {
          id: string; name: string; price: number; currency: string;
          interval: string | null; features: string[];
        }) => {
          const isCurrent = plan.id === currentPlan;
          const isPro = plan.id === 'pro';

          return (
            <div key={plan.id} className="card" style={{
              padding: '2rem',
              borderColor: isPro ? 'var(--color-accent)' : 'var(--color-border)',
              position: 'relative',
              background: isPro
                ? 'linear-gradient(135deg, rgba(108,99,255,0.06), rgba(0,212,170,0.03))'
                : 'var(--color-surface)',
            }}>
              {isPro && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                  padding: '0.3rem 0.875rem', borderRadius: 20,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Most Popular
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                {isPro ? <Crown size={18} color="var(--color-accent)" /> : <Zap size={18} color="var(--color-text-muted)" />}
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{plan.name}</span>
                {isCurrent && (
                  <span style={{ fontSize: '0.7rem', background: 'var(--color-accent-dim)', color: 'var(--color-accent)', padding: '0.15rem 0.5rem', borderRadius: 20, marginLeft: 'auto' }}>
                    Active
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800 }}>
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                {plan.interval && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>/{plan.interval}</span>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem' }}>
                {plan.features.map((f: string) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={14} color={isPro ? 'var(--color-accent-2)' : 'var(--color-text-muted)'} />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} disabled>
                  Current plan
                </button>
              ) : isPro ? (
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => checkoutMutation.mutate('pro')}
                  disabled={checkoutMutation.isPending}
                >
                  {checkoutMutation.isPending ? 'Redirecting...' : <>Upgrade to Pro <ArrowRight size={14} /></>}
                </button>
              ) : (
                <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} disabled>
                  Downgrade
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Stripe notice */}
      <div style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--color-text)' }}>Payments powered by Stripe.</strong>{' '}
          To enable real payments, set <code style={{ fontFamily: 'monospace', background: 'var(--color-surface)', padding: '0.1rem 0.3rem', borderRadius: 4 }}>STRIPE_SECRET_KEY</code>{' '}
          and <code style={{ fontFamily: 'monospace', background: 'var(--color-surface)', padding: '0.1rem 0.3rem', borderRadius: 4 }}>STRIPE_PRO_PRICE_ID</code>{' '}
          in your gateway environment variables.
        </p>
      </div>
    </div>
  );
}
