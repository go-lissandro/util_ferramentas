import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Key, Plus, Search, CheckCircle2, XCircle, Clock,
  RefreshCw, Eye, Ban, Copy, ChevronDown,
  TrendingUp, DollarSign, ShieldCheck, AlertCircle,
  QrCode as QrCodeIcon
} from 'lucide-react';
import { api } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Types ──────────────────────────────────────────────────────
type LicenseStatus = 'pending_payment' | 'active' | 'expired' | 'revoked' | 'suspended';

interface License {
  id: string;
  license_key: string;
  product_name: string;
  price_cents: number;
  customer_name: string;
  customer_email: string;
  status: LicenseStatus;
  max_activations: number;
  activations_count: number;
  activated_at?: string;
  expires_at?: string;
  payment_status?: string;
  paid_at?: string;
  gateway?: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price_cents: number;
  license_type: string;
  duration_days?: number;
  max_activations: number;
  is_active: boolean;
}

// ── Status config ──────────────────────────────────────────────
const STATUS_CONFIG: Record<LicenseStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  active:          { label: 'Ativa',             color: '#00d4aa', bg: 'rgba(0,212,170,0.1)',   Icon: CheckCircle2 },
  pending_payment: { label: 'Aguard. Pagamento', color: '#ffb347', bg: 'rgba(255,179,71,0.1)',  Icon: Clock        },
  expired:         { label: 'Expirada',          color: '#8888a8', bg: 'rgba(136,136,168,0.1)', Icon: XCircle      },
  revoked:         { label: 'Revogada',          color: '#ff4d6a', bg: 'rgba(255,77,106,0.1)',  Icon: Ban          },
  suspended:       { label: 'Suspensa',          color: '#ff4d6a', bg: 'rgba(255,77,106,0.1)',  Icon: AlertCircle  },
};

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function StatusBadge({ status }: { status: LicenseStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.expired;
  const { Icon } = cfg;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.25rem 0.625rem', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}44`,
      whiteSpace: 'nowrap',
    }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ── License Detail Modal ────────────────────────────────────────
function LicenseDetailModal({ licenseId, onClose }: { licenseId: string; onClose: () => void }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['license-detail', licenseId],
    queryFn: () => api.get(`/admin/licenses/${licenseId}`).then(r => r.data.data),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/admin/licenses/${licenseId}/confirm-payment`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['licenses'] }); qc.invalidateQueries({ queryKey: ['license-detail', licenseId] }); },
  });

  const revokeMutation = useMutation({
    mutationFn: (reason: string) => api.post(`/admin/licenses/${licenseId}/revoke`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['licenses'] }); onClose(); },
  });

  if (isLoading) return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando...</div>
    </ModalOverlay>
  );

  const { license, payments, events, activations } = data || {};

  const copyKey = () => navigator.clipboard.writeText(license?.license_key || '');

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <code style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
                {license?.license_key}
              </code>
              <button onClick={copyKey} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <Copy size={14} />
              </button>
            </div>
            <StatusBadge status={license?.status} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.25rem' }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Cliente', value: license?.customer_name },
              { label: 'Email', value: license?.customer_email },
              { label: 'Produto', value: license?.product_name },
              { label: 'Valor', value: license?.price_cents ? formatBRL(license.price_cents) : '-' },
              { label: 'Ativações', value: `${license?.activations_count || 0} / ${license?.max_activations}` },
              { label: 'Criada em', value: license?.created_at ? format(new Date(license.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-' },
              { label: 'Ativada em', value: license?.activated_at ? format(new Date(license.activated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '—' },
              { label: 'Expira em', value: license?.expires_at ? format(new Date(license.expires_at), 'dd/MM/yyyy', { locale: ptBR }) : 'Vitalício' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--color-surface-2)', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, wordBreak: 'break-all' }}>{value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {license?.status === 'pending_payment' && (
              <button
                className="btn-primary"
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
                style={{ flex: 1 }}
              >
                <CheckCircle2 size={14} />
                {confirmMutation.isPending ? 'Confirmando...' : 'Confirmar Pagamento Manualmente'}
              </button>
            )}
            {(license?.status === 'active' || license?.status === 'pending_payment') && (
              <button
                className="btn-ghost"
                onClick={() => {
                  const reason = prompt('Motivo da revogação:');
                  if (reason) revokeMutation.mutate(reason);
                }}
                style={{ color: 'var(--color-danger)', borderColor: 'rgba(255,77,106,0.3)', flex: 1 }}
              >
                <Ban size={14} /> Revogar Licença
              </button>
            )}
          </div>

          {/* PIX QRCode (if pending) */}
          {payments?.[0]?.status === 'pending' && payments[0].qrcode_text && (
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <QrCodeIcon size={15} color="var(--color-accent)" /> QRCode PIX
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                {payments[0].qrcode_base64 ? (
                  <img src={payments[0].qrcode_base64} alt="PIX QRCode" style={{ width: 180, height: 180, borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 180, height: 180, background: 'var(--color-surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    QR não disponível
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Copia e Cola:</p>
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.625rem', fontSize: '0.65rem', fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--color-text-muted)', textAlign: 'left', maxHeight: 80, overflow: 'auto' }}>
                {payments[0].qrcode_text}
              </div>
            </div>
          )}

          {/* Machines */}
          {activations && activations.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Máquinas Ativas</h3>
              {activations.map((a: { id: string; machine_id: string; machine_name?: string; ip_address?: string; last_seen_at: string; is_active: boolean }) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: 'var(--color-surface-2)', borderRadius: 8, marginBottom: '0.5rem', border: '1px solid var(--color-border)' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 500 }}>{a.machine_name || a.machine_id}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{a.ip_address} · último uso: {format(new Date(a.last_seen_at), 'dd/MM/yy HH:mm')}</p>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: a.is_active ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {a.is_active ? '● Ativa' : '● Inativa'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Events timeline */}
          {events && events.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Histórico</h3>
              <div style={{ borderLeft: '2px solid var(--color-border)', paddingLeft: '1rem' }}>
                {events.map((e: { id: string; event_type: string; actor: string; description: string; created_at: string }) => (
                  <div key={e.id} style={{ marginBottom: '0.875rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -22, top: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', border: '2px solid var(--color-bg)' }} />
                    <p style={{ fontSize: '0.8rem', fontWeight: 500 }}>{e.description || e.event_type}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {e.actor} · {format(new Date(e.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Create License Modal ────────────────────────────────────────
function CreateLicenseModal({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ product_id: '', customer_name: '', customer_email: '', customer_doc: '', activate_now: false, notes: '' });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/admin/licenses', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['licenses'] }); onClose(); },
    onError: (err: unknown) => setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao criar'),
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Criar Licença</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
        </div>
        <div style={{ padding: '1.5rem 2rem' }}>
          {error && <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(255,77,106,0.1)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem', fontWeight: 500 }}>Produto *</label>
              <select
                value={form.product_id}
                onChange={e => setForm({ ...form, product_id: e.target.value })}
                className="input-field"
              >
                <option value="">Selecione um produto</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {formatBRL(p.price_cents)}</option>
                ))}
              </select>
            </div>

            {[
              { key: 'customer_name', label: 'Nome do cliente *', placeholder: 'João Silva', type: 'text' },
              { key: 'customer_email', label: 'Email *', placeholder: 'joao@email.com', type: 'email' },
              { key: 'customer_doc', label: 'CPF/CNPJ', placeholder: '000.000.000-00', type: 'text' },
              { key: 'notes', label: 'Observações', placeholder: 'Compra manual, cupom...', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem', fontWeight: 500 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="input-field"
                  placeholder={f.placeholder}
                />
              </div>
            ))}

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={form.activate_now}
                onChange={e => setForm({ ...form, activate_now: e.target.checked })}
                style={{ accentColor: 'var(--color-accent)', width: 16, height: 16 }}
              />
              Ativar imediatamente (pagamento já recebido)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
            <button
              onClick={() => mutation.mutate(form)}
              className="btn-primary"
              style={{ flex: 2, justifyContent: 'center' }}
              disabled={mutation.isPending || !form.product_id || !form.customer_name || !form.customer_email}
            >
              {mutation.isPending ? 'Criando...' : 'Criar Licença'}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
    >
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

// ── Main Licenses Page ──────────────────────────────────────────
export function LicensesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ['license-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: licensesData, isLoading } = useQuery({
    queryKey: ['licenses', search, statusFilter],
    queryFn: () => api.get('/admin/licenses', { params: { search: search || undefined, status: statusFilter || undefined, limit: 50 } }).then(r => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/admin/products').then(r => r.data.data),
  });

  const licenses: License[] = licensesData?.data || [];
  const products: Product[] = productsData || [];

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ padding: '2.5rem', maxWidth: 1200 }} className="animate-fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Key size={20} color="var(--color-accent)" /> Licenças
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Gerencie licenças, pagamentos PIX e ativações
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={14} /> Nova Licença
        </button>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Licenças Ativas', value: statsData.totals?.active || 0, icon: ShieldCheck, color: 'var(--color-success)' },
            { label: 'Aguard. Pagamento', value: statsData.totals?.pending || 0, icon: Clock, color: '#ffb347' },
            { label: 'Revogadas', value: statsData.totals?.revoked || 0, icon: Ban, color: 'var(--color-danger)' },
            { label: 'Receita Total', value: statsData.revenue?.total ? formatBRL(parseInt(statsData.revenue.total)) : 'R$ 0,00', icon: DollarSign, color: 'var(--color-accent)' },
            { label: 'Receita Este Mês', value: statsData.revenue?.month ? formatBRL(parseInt(statsData.revenue.month)) : 'R$ 0,00', icon: TrendingUp, color: 'var(--color-accent-2)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <Icon size={15} color={color} />
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por chave, email ou nome..."
            className="input-field"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-field"
          style={{ width: 'auto', minWidth: 180 }}
        >
          <option value="">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="pending_payment">Aguard. Pagamento</option>
          <option value="expired">Expiradas</option>
          <option value="revoked">Revogadas</option>
        </select>
      </div>

      {/* Licenses table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1fr 0.8fr 0.8fr 100px', gap: '1rem' }}>
          {['Licença', 'Cliente', 'Produto', 'Valor', 'Status', 'Ações'].map(h => (
            <span key={h} style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} /><br />
            Carregando...
          </div>
        ) : licenses.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Key size={32} style={{ opacity: 0.3, marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
            <p>Nenhuma licença encontrada</p>
          </div>
        ) : (
          licenses.map((lic) => (
            <div
              key={lic.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.2fr 1fr 0.8fr 0.8fr 100px',
                gap: '1rem',
                padding: '0.875rem 1.25rem',
                borderBottom: '1px solid var(--color-border)',
                alignItems: 'center',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              {/* Key */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <code style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-accent)', letterSpacing: '0.04em' }}>
                  {lic.license_key}
                </code>
                <button onClick={() => copyKey(lic.license_key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === lic.license_key ? 'var(--color-success)' : 'var(--color-text-muted)', padding: '0.125rem', flexShrink: 0 }}>
                  {copied === lic.license_key ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                </button>
              </div>

              {/* Customer */}
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lic.customer_name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lic.customer_email}</p>
              </div>

              {/* Product */}
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lic.product_name}</p>

              {/* Amount */}
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatBRL(lic.price_cents)}</p>

              {/* Status */}
              <StatusBadge status={lic.status} />

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button onClick={() => setSelectedId(lic.id)} title="Ver detalhes" style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center' }}>
                  <Eye size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {selectedId && <LicenseDetailModal licenseId={selectedId} onClose={() => setSelectedId(null)} />}
      {showCreate && <CreateLicenseModal products={products} onClose={() => setShowCreate(false)} />}
    </div>
  );
}
