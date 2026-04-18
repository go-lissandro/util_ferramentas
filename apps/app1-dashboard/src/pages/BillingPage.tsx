import { Crown, Zap, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

const PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$0',
    interval: null,
    icon: Zap,
    color: 'var(--color-text-muted)',
    features: [
      'Download de vídeos (App4)',
      'Conversor JSON↔Excel (App5)',
      'Página Bio Link (App6)',
      'Sem limite de uso',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$29,90',
    interval: 'mês',
    icon: Crown,
    color: 'var(--color-accent)',
    features: [
      'Tudo do plano Gratuito',
      'Encurtador de Links com analytics (App2)',
      'Gerenciador de Dados Dinâmicos (App3)',
      'Suporte prioritário',
    ],
  },
];

export function BillingPage() {
  const { tenant } = useAuthStore();
  const currentPlan = tenant?.plan || 'free';

  return (
    <div style={{ padding: '2.5rem', maxWidth: 900 }} className="animate-fade-in-up">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Planos e Pagamento</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Plano atual:{' '}
          <strong style={{ color: currentPlan === 'pro' ? 'var(--color-accent)' : 'var(--color-text)' }}>
            {currentPlan === 'pro' ? '⭐ Pro' : 'Gratuito'}
          </strong>
        </p>
      </div>

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.id === currentPlan;
          const isPro = plan.id === 'pro';
          return (
            <div key={plan.id} className="card" style={{
              padding: '2rem', position: 'relative',
              borderColor: isPro ? 'rgba(108,99,255,.4)' : 'var(--color-border)',
              background: isPro ? 'linear-gradient(135deg,rgba(108,99,255,.06),rgba(0,212,170,.03))' : 'var(--color-surface)',
            }}>
              {isPro && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg,var(--color-accent),var(--color-accent-2))',
                  color: '#fff', fontSize: '.7rem', fontWeight: 700, padding: '.3rem .875rem',
                  borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
                }}>Mais popular</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
                <Icon size={18} color={plan.color} />
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{plan.name}</span>
                {isCurrent && (
                  <span style={{ fontSize: '.7rem', background: 'rgba(0,212,170,.1)', color: 'var(--color-accent-2)', padding: '.15rem .5rem', borderRadius: 20, marginLeft: 'auto' }}>
                    Ativo
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800 }}>{plan.price}</span>
                {plan.interval && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '.875rem' }}>/{plan.interval}</span>
                )}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', fontSize: '.85rem', color: 'var(--color-text-muted)', marginBottom: '.5rem' }}>
                    <CheckCircle2 size={14} color={isPro ? 'var(--color-accent-2)' : 'var(--color-text-muted)'} style={{ flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} disabled>
                  Plano atual
                </button>
              ) : isPro ? (
                <a href="/checkout.html" style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Fazer upgrade <ArrowRight size={14} />
                  </button>
                </a>
              ) : (
                <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} disabled>
                  Plano gratuito
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment info */}
      <div style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, marginBottom: '.375rem' }}>Pagamento via PIX</p>
          <p style={{ fontSize: '.82rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            Após o pagamento via PIX, seu acesso é liberado manualmente em até 24h.
            Acesse <a href="/checkout.html" style={{ color: 'var(--color-accent)' }}>a página de checkout</a> para ver o QR Code e a chave PIX.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <a href="/checkout.html" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '.375rem', fontSize: '.8rem' }}>
              <ExternalLink size={13} /> Ver checkout
            </button>
          </a>
          <Link to="/purchase-requests" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '.375rem', fontSize: '.8rem' }}>
              <CheckCircle2 size={13} /> Gerenciar compras
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
