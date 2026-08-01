import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link2, Copy, Trash2, BarChart2, QrCode, ExternalLink, Plus, X, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DS, burstConfetti, glassCard } from '../../../../shared/design-system';
import '../../../../shared/design-system/tokens.css';
import '../../../../shared/design-system/glass.css';
import { AppIcon, setAppTheme, getAppMeta, type IconName } from '../../../../shared/design-system/icons';

setAppTheme('app2');
const APP = getAppMeta('app2');

setAppTheme('app2');

const api = axios.create({ baseURL: '/api/app2' });

// Attach JWT from App1's auth store (same pattern as App3)
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('saas-auth');
    if (raw) {
      const store = JSON.parse(raw);
      const token = store?.state?.accessToken || store?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* no token */ }
  return config;
});

interface ShortLink {
  id: string;
  slug: string;
  original_url: string;
  title?: string;
  shortUrl: string;
  click_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

// ── Create Link Form ───────────────────────────────────
function CreateLinkForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: { url: string; title?: string; customSlug?: string }) =>
      api.post('/links', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links'] });
      onClose();
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create link');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate({ url, title: title || undefined, customSlug: customSlug || undefined });
  };

  const s: Record<string, React.CSSProperties> = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' },
    modal: { ...glassCard(), padding: '2rem', width: '100%', maxWidth: 480, animation: 'ds-spring-in 0.45s var(--ds-ease-spring) both', background: 'var(--ds-glass-bg-strong)' },
  };

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e8e8f0' }}>Shorten a URL</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8888a8', padding: '0.25rem' }}><X size={18} /></button>
        </div>
        {error && (
          <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)', color: '#ff4d6a', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#8888a8', marginBottom: '0.375rem', fontWeight: 500 }}>Long URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)} type="url" required placeholder="https://very-long-url.com/with/many/params" style={{ width: '100%', background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 8, color: '#e8e8f0', padding: '0.625rem 0.875rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#8888a8', marginBottom: '0.375rem', fontWeight: 500 }}>Title (optional)</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="My awesome link" style={{ width: '100%', background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 8, color: '#e8e8f0', padding: '0.625rem 0.875rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#8888a8', marginBottom: '0.375rem', fontWeight: 500 }}>Custom slug (optional)</label>
            <input value={customSlug} onChange={e => setCustomSlug(e.target.value)} placeholder="my-link" pattern="[a-zA-Z0-9_-]{3,20}" style={{ width: '100%', background: '#1a1a24', border: '1px solid #2a2a38', borderRadius: 8, color: '#e8e8f0', padding: '0.625rem 0.875rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid #2a2a38', borderRadius: 8, color: '#8888a8', padding: '0.625rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} style={{ flex: 2, background: '#6c63ff', border: 'none', borderRadius: 8, color: '#fff', padding: '0.625rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: createMutation.isPending ? 0.7 : 1 }}>
              {createMutation.isPending ? 'Creating...' : 'Shorten URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Link Card ──────────────────────────────────────────
function LinkCard({ link }: { link: ShortLink }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrData, setQrData] = useState('');

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/links/${link.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['links'] }),
  });

  const cardRef = useRef<HTMLDivElement>(null);

  const copyUrl = async (e: React.MouseEvent) => {
    await navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    if (cardRef.current) burstConfetti(cardRef.current, { count: 12, x: e.clientX - cardRef.current.getBoundingClientRect().left, y: 24 });
    setTimeout(() => setCopied(false), 2000);
  };

  const loadQr = async () => {
    if (!qrData) {
      const res = await api.get(`/links/${link.id}/qr`);
      setQrData(res.data.data.qr);
    }
    setShowQr(!showQr);
  };

  const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n) + '…' : s;

  return (
    <div ref={cardRef} className="glass-card glass-card-hover" style={{ padding: '1.25rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {link.title && (
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e8e8f0', marginBottom: '0.25rem' }}>
              {link.title}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <code style={{ fontSize: '0.875rem', color: '#6c63ff', fontWeight: 600 }}>
              {link.shortUrl}
            </code>
            <button onClick={(e) => copyUrl(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#00d4aa' : '#8888a8', padding: '0.125rem', transition: 'color 0.15s', transform: copied ? 'scale(1.2)' : 'scale(1)' }}>
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#8888a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {truncate(link.original_url, 70)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#e8e8f0', lineHeight: 1 }}>
              {link.click_count.toLocaleString()}
            </p>
            <p style={{ fontSize: '0.65rem', color: '#8888a8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>clicks</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid #1a1a24' }}>
        <span style={{ fontSize: '0.75rem', color: '#8888a8' }}>
          {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={loadQr} title="QR Code" style={{ background: 'none', border: '1px solid #2a2a38', borderRadius: 6, cursor: 'pointer', color: '#8888a8', padding: '0.3rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <QrCode size={12} /> QR
          </button>
          <a href={link.original_url} target="_blank" rel="noopener noreferrer" style={{ background: 'none', border: '1px solid #2a2a38', borderRadius: 6, cursor: 'pointer', color: '#8888a8', padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <ExternalLink size={12} />
          </a>
          <button onClick={() => deleteMutation.mutate()} title="Delete" style={{ background: 'none', border: '1px solid rgba(255,77,106,0.3)', borderRadius: 6, cursor: 'pointer', color: '#ff4d6a', padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {showQr && qrData && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }} className="ds-pop-in">
          <img src={qrData} alt="QR Code" style={{ borderRadius: 8, maxWidth: 160, boxShadow: '0 0 20px rgba(108,99,255,0.2)', border: '1px solid var(--ds-border)' }} />
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────
function URLShortener() {
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['links'],
    queryFn: () => api.get('/links').then(r => r.data),
  });

  const links: ShortLink[] = data?.data || [];
  const total: number = data?.pagination?.total || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', fontFamily: 'Inter, system-ui, sans-serif', padding: '0' }}>
      {/* Header */}
      <header className="ds-app-header" style={{ padding: '1rem 2rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="ds-app-icon" style={{ width: 34, height: 34 }}>
            <AppIcon name="link" size={16} color="#fff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span className="ds-app-title">URL Shortener</span>
            <span className="ds-app-tag">/app2</span>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ background: 'var(--ds-accent)', border: 'none', borderRadius: 8, color: '#fff', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(108,99,255,0.35)', transition: 'all .2s' }}>
          <Plus size={14} /> New link
        </button>
      </header>

      <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
        {/* Stats bar */}
        <div className="ds-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Links', value: total, icon: 'link' as IconName, color: DS.accent },
            { label: 'Total Clicks', value: links.reduce((s, l) => s + l.click_count, 0).toLocaleString(), icon: 'mouse' as IconName, color: DS.ok },
            { label: 'Active Links', value: links.filter(l => l.is_active).length, icon: 'check' as IconName, color: '#ffb347' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="glass-card glass-card-hover" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-12px', right: '-8px', opacity: 0.08, transform: 'rotate(-10deg)' }}>
                <AppIcon name={icon} size={44} color={color} />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#8888a8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>{label}</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color, textShadow: color === DS.ok ? `0 0 24px ${color}44` : 'none' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Links list */}
        {isLoading ? (
          <div className="ds-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[1,2,3].map(i => (
              <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
                <div className="skeleton" style={{ height: 14, width: '35%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: '80%' }} />
              </div>
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="glass-card ds-fade-up" style={{ textAlign: 'center', padding: '4rem', color: '#8888a8', border: '1px dashed var(--ds-border-2)' }}>
            <Link2 size={32} style={{ marginBottom: '1rem', opacity: 0.4, display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 500, marginBottom: '0.5rem', color: 'var(--ds-text)' }}>No links yet</p>
            <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first short link to get started</p>
            <button onClick={() => setShowCreate(true)} style={{ background: 'var(--ds-accent)', border: 'none', borderRadius: 8, color: '#fff', padding: '0.625rem 1.25rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 16px rgba(108,99,255,0.4)' }}>
              Create first link
            </button>
          </div>
        ) : (
          <div className="ds-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {links.map((link) => <LinkCard key={link.id} link={link} />)}
          </div>
        )}
      </main>

      {showCreate && <CreateLinkForm onClose={() => setShowCreate(false)} />}
    </div>
  );
}

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

// ── Estilo global (inputs com glow ring, fonts, reset) ──────
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',system-ui,sans-serif;background:${DS.bg};color:${DS.text};-webkit-font-smoothing:antialiased}
  input:focus,button:focus{outline:none}
  input:focus{border-color:${DS.accent}!important;box-shadow:0 0 0 3px rgba(108,99,255,.2)}
  button{cursor:pointer}
  .ds-pop-in{animation:ds-pop-in .3s var(--ds-ease-spring) both}
  .ds-stagger>*{animation:ds-fade-in-up .4s var(--ds-ease-smooth) both}
  .ds-stagger>*:nth-child(1){animation-delay:0ms}
  .ds-stagger>*:nth-child(2){animation-delay:60ms}
  .ds-stagger>*:nth-child(3){animation-delay:120ms}
`;
document.head.appendChild(globalStyle);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <URLShortener />
    </QueryClientProvider>
  </React.StrictMode>
);
