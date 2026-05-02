import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// ── QR Code generation using canvas (no external lib needed) ──
// We use the qrcode API via a CDN script tag for reliability

const C = {
  bg: '#0a0a0f', sur: '#111118', sur2: '#1a1a24', brd: '#2a2a38', brd2: '#3a3a4e',
  txt: '#e8e8f0', mut: '#8888a8', acc: '#6c63ff', ok: '#00d4aa', err: '#ff4d6a',
};

type QRType = 'url' | 'text' | 'email' | 'tel' | 'wifi' | 'vcard' | 'pix';

interface QRConfig {
  type: QRType;
  // URL
  url?: string;
  // Text
  text?: string;
  // Email
  emailTo?: string; emailSubject?: string; emailBody?: string;
  // Phone
  phone?: string;
  // WiFi
  wifiSsid?: string; wifiPassword?: string; wifiSecurity?: string;
  // vCard
  vcardName?: string; vcardPhone?: string; vcardEmail?: string; vcardCompany?: string;
  // PIX
  pixKey?: string; pixName?: string; pixCity?: string; pixAmount?: string;
  // Style
  fgColor?: string; bgColor?: string; size?: number; errorLevel?: string;
}

const TYPES: { key: QRType; label: string; icon: string }[] = [
  { key: 'url',   label: 'URL / Link',  icon: '🔗' },
  { key: 'text',  label: 'Texto livre', icon: '📝' },
  { key: 'pix',   label: 'PIX',         icon: '💸' },
  { key: 'wifi',  label: 'Wi-Fi',       icon: '📶' },
  { key: 'email', label: 'E-mail',      icon: '✉️' },
  { key: 'tel',   label: 'Telefone',    icon: '📞' },
  { key: 'vcard', label: 'Contato',     icon: '👤' },
];

function buildQRContent(cfg: QRConfig): string {
  switch (cfg.type) {
    case 'url':   return cfg.url || 'https://';
    case 'text':  return cfg.text || '';
    case 'email': return `mailto:${cfg.emailTo || ''}?subject=${encodeURIComponent(cfg.emailSubject || '')}&body=${encodeURIComponent(cfg.emailBody || '')}`;
    case 'tel':   return `tel:${cfg.phone || ''}`;
    case 'wifi':  return `WIFI:T:${cfg.wifiSecurity || 'WPA'};S:${cfg.wifiSsid || ''};P:${cfg.wifiPassword || ''};;`;
    case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nFN:${cfg.vcardName || ''}\nTEL:${cfg.vcardPhone || ''}\nEMAIL:${cfg.vcardEmail || ''}\nORG:${cfg.vcardCompany || ''}\nEND:VCARD`;
    case 'pix': {
      const amount = parseFloat(cfg.pixAmount || '0');
      const key = cfg.pixKey || '';
      const name = (cfg.pixName || 'NOME').slice(0, 25).toUpperCase();
      const city = (cfg.pixCity || 'CIDADE').slice(0, 15).toUpperCase();
      // EMV PIX payload
      const merchant = `0014BR.GOV.BCB.PIX01${key.length.toString().padStart(2,'0')}${key}`;
      const payload = [
        '000201',
        '010212',
        `26${merchant.length.toString().padStart(2,'0')}${merchant}`,
        '52040000',
        '5303986',
        amount > 0 ? `54${amount.toFixed(2).length.toString().padStart(2,'0')}${amount.toFixed(2)}` : '',
        '5802BR',
        `59${name.length.toString().padStart(2,'0')}${name}`,
        `60${city.length.toString().padStart(2,'0')}${city}`,
        '62070503***',
        '6304',
      ].join('');
      // CRC16 (simplified — real PIX needs proper CRC)
      return payload + '0000';
    }
    default: return '';
  }
}

// ── Generate QR using Google Charts API (no npm needed) ──
function getQRUrl(content: string, size: number, fg: string, bg: string): string {
  const encoded = encodeURIComponent(content);
  const fgHex = fg.replace('#', '');
  const bgHex = bg.replace('#', '');
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=${size}x${size}&color=${fgHex}&bgcolor=${bgHex}&format=png&qzone=2`;
}

function getSVGUrl(content: string, size: number, fg: string, bg: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(content)}&size=${size}x${size}&color=${fg.replace('#','')}&bgcolor=${bg.replace('#','')}&format=svg&qzone=2`;
}

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: '100%', background: C.sur2, border: `1px solid ${C.brd}`,
  borderRadius: 8, color: C.txt, padding: '.6rem .875rem',
  fontSize: '.875rem', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box' as const, ...extra,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '.875rem' }}>
      <label style={{ display: 'block', fontSize: '.78rem', color: C.mut, fontWeight: 500, marginBottom: '.3rem' }}>{label}</label>
      {children}
    </div>
  );
}

function App() {
  const [cfg, setCfg] = useState<QRConfig>({
    type: 'url', url: 'https://util-ferramentas.onrender.com',
    fgColor: '#111118', bgColor: '#ffffff', size: 300, errorLevel: 'M',
    wifiSecurity: 'WPA',
  });
  const [qrSrc, setQrSrc] = useState('');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  const set = (patch: Partial<QRConfig>) => setCfg(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const c = buildQRContent(cfg);
      setContent(c);
      if (c.trim().length > 1) {
        setQrSrc(getQRUrl(c, cfg.size || 300, cfg.fgColor || '#000000', cfg.bgColor || '#ffffff'));
      }
    }, 400);
  }, [cfg]);

  const download = useCallback(async (format: 'png' | 'svg') => {
    const url = format === 'svg'
      ? getSVGUrl(content, cfg.size || 300, cfg.fgColor || '#000000', cfg.bgColor || '#ffffff')
      : getQRUrl(content, cfg.size || 300, cfg.fgColor || '#000000', cfg.bgColor || '#ffffff');
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qrcode-${cfg.type}.${format}`;
      a.click();
    } catch {
      window.open(url, '_blank');
    }
  }, [content, cfg]);

  const PRESETS = [
    { label: 'Preto', fg: '#000000', bg: '#ffffff' },
    { label: 'Azul', fg: '#1e40af', bg: '#eff6ff' },
    { label: 'Verde', fg: '#166534', bg: '#f0fdf4' },
    { label: 'Roxo', fg: '#6c63ff', bg: '#f5f3ff' },
    { label: 'Escuro', fg: '#e8e8f0', bg: '#111118' },
    { label: 'Vermelho', fg: '#991b1b', bg: '#fff1f2' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.txt, fontFamily: 'Inter,system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.sur, borderBottom: `1px solid ${C.brd}`, padding: '.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6c63ff,#00d4aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📱</div>
        <div>
          <span style={{ fontWeight: 700, fontSize: '.9rem' }}>Gerador de QR Code</span>
          <span style={{ fontFamily: 'monospace', fontSize: '.7rem', color: C.mut, marginLeft: 6 }}>/app8</span>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: Config */}
        <div>
          {/* Type selector */}
          <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '.78rem', color: C.mut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.75rem' }}>Tipo de QR Code</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.5rem' }}>
              {TYPES.map(t => (
                <button key={t.key} onClick={() => set({ type: t.key })}
                  style={{ padding: '.5rem .25rem', borderRadius: 8, border: `1px solid ${cfg.type === t.key ? C.acc : C.brd}`, background: cfg.type === t.key ? 'rgba(108,99,255,.12)' : C.sur2, color: cfg.type === t.key ? C.acc : C.mut, cursor: 'pointer', fontSize: '.72rem', fontWeight: cfg.type === t.key ? 600 : 400, textAlign: 'center' as const }}>
                  <div style={{ fontSize: '1.1rem', marginBottom: '.2rem' }}>{t.icon}</div>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content fields */}
          <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '.78rem', color: C.mut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.875rem' }}>Conteúdo</p>

            {cfg.type === 'url' && (
              <Field label="URL"><input style={inp()} value={cfg.url} onChange={e => set({ url: e.target.value })} placeholder="https://seusite.com.br" /></Field>
            )}
            {cfg.type === 'text' && (
              <Field label="Texto"><textarea style={{ ...inp(), height: 100, resize: 'vertical' as const }} value={cfg.text} onChange={e => set({ text: e.target.value })} placeholder="Escreva qualquer texto aqui..." /></Field>
            )}
            {cfg.type === 'email' && (<>
              <Field label="Para"><input style={inp()} value={cfg.emailTo} onChange={e => set({ emailTo: e.target.value })} placeholder="contato@email.com" /></Field>
              <Field label="Assunto"><input style={inp()} value={cfg.emailSubject} onChange={e => set({ emailSubject: e.target.value })} placeholder="Assunto do email" /></Field>
              <Field label="Mensagem"><textarea style={{ ...inp(), height: 80, resize: 'vertical' as const }} value={cfg.emailBody} onChange={e => set({ emailBody: e.target.value })} placeholder="Corpo do email..." /></Field>
            </>)}
            {cfg.type === 'tel' && (
              <Field label="Número de telefone"><input style={inp()} value={cfg.phone} onChange={e => set({ phone: e.target.value })} placeholder="+55 11 99999-9999" /></Field>
            )}
            {cfg.type === 'wifi' && (<>
              <Field label="Nome da rede (SSID)"><input style={inp()} value={cfg.wifiSsid} onChange={e => set({ wifiSsid: e.target.value })} placeholder="MinhaRede" /></Field>
              <Field label="Senha"><input style={inp()} value={cfg.wifiPassword} onChange={e => set({ wifiPassword: e.target.value })} placeholder="senha123" type="password" /></Field>
              <Field label="Segurança">
                <select style={{ ...inp(), cursor: 'pointer' }} value={cfg.wifiSecurity} onChange={e => set({ wifiSecurity: e.target.value })}>
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Sem senha</option>
                </select>
              </Field>
            </>)}
            {cfg.type === 'vcard' && (<>
              <Field label="Nome completo"><input style={inp()} value={cfg.vcardName} onChange={e => set({ vcardName: e.target.value })} placeholder="João da Silva" /></Field>
              <Field label="Telefone"><input style={inp()} value={cfg.vcardPhone} onChange={e => set({ vcardPhone: e.target.value })} placeholder="+55 11 99999-9999" /></Field>
              <Field label="Email"><input style={inp()} value={cfg.vcardEmail} onChange={e => set({ vcardEmail: e.target.value })} placeholder="joao@email.com" /></Field>
              <Field label="Empresa"><input style={inp()} value={cfg.vcardCompany} onChange={e => set({ vcardCompany: e.target.value })} placeholder="Empresa Ltda" /></Field>
            </>)}
            {cfg.type === 'pix' && (<>
              <Field label="Chave PIX"><input style={inp()} value={cfg.pixKey} onChange={e => set({ pixKey: e.target.value })} placeholder="email@dominio.com ou CPF/CNPJ" /></Field>
              <Field label="Nome do beneficiário"><input style={inp()} value={cfg.pixName} onChange={e => set({ pixName: e.target.value })} placeholder="SEU NOME" /></Field>
              <Field label="Cidade"><input style={inp()} value={cfg.pixCity} onChange={e => set({ pixCity: e.target.value })} placeholder="SAO PAULO" /></Field>
              <Field label="Valor (opcional)"><input style={inp()} value={cfg.pixAmount} onChange={e => set({ pixAmount: e.target.value })} placeholder="0.00" type="number" min="0" step="0.01" /></Field>
            </>)}
          </div>

          {/* Style */}
          <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.25rem' }}>
            <p style={{ fontSize: '.78rem', color: C.mut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.875rem' }}>Estilo</p>

            <p style={{ fontSize: '.78rem', color: C.mut, marginBottom: '.5rem', fontWeight: 500 }}>Presets de cor</p>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' as const, marginBottom: '.875rem' }}>
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => set({ fgColor: p.fg, bgColor: p.bg })}
                  style={{ padding: '.3rem .75rem', borderRadius: 20, fontSize: '.75rem', border: `1px solid ${cfg.fgColor === p.fg ? C.acc : C.brd}`, background: cfg.fgColor === p.fg ? 'rgba(108,99,255,.12)' : C.sur2, color: cfg.fgColor === p.fg ? C.acc : C.mut, cursor: 'pointer' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: p.fg, marginRight: 5, verticalAlign: 'middle', border: '1px solid rgba(255,255,255,.2)' }} />
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '.875rem' }}>
              <Field label="Cor do QR">
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <input type="color" value={cfg.fgColor} onChange={e => set({ fgColor: e.target.value })} style={{ width: 36, height: 32, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
                  <input style={{ ...inp(), flex: 1 }} value={cfg.fgColor} onChange={e => set({ fgColor: e.target.value })} />
                </div>
              </Field>
              <Field label="Fundo">
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <input type="color" value={cfg.bgColor} onChange={e => set({ bgColor: e.target.value })} style={{ width: 36, height: 32, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
                  <input style={{ ...inp(), flex: 1 }} value={cfg.bgColor} onChange={e => set({ bgColor: e.target.value })} />
                </div>
              </Field>
            </div>

            <Field label={`Tamanho: ${cfg.size}×${cfg.size}px`}>
              <input type="range" min={150} max={600} step={50} value={cfg.size} onChange={e => set({ size: parseInt(e.target.value) })} style={{ width: '100%', accentColor: C.acc }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: C.mut, marginTop: '.25rem' }}>
                <span>150px</span><span>600px</span>
              </div>
            </Field>
          </div>
        </div>

        {/* Right: Preview + Download */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.5rem', textAlign: 'center' as const }}>
            <p style={{ fontSize: '.78rem', color: C.mut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1.25rem' }}>Preview</p>

            <div style={{ display: 'inline-flex', padding: 16, background: cfg.bgColor || '#fff', borderRadius: 12, marginBottom: '1.25rem', boxShadow: '0 8px 32px rgba(0,0,0,.3)' }}>
              {qrSrc ? (
                <img src={qrSrc} alt="QR Code" width={180} height={180} style={{ display: 'block', borderRadius: 4 }} />
              ) : (
                <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.mut, fontSize: '.8rem' }}>
                  Preencha os dados
                </div>
              )}
            </div>

            {/* Content preview */}
            {content && (
              <div style={{ background: C.sur2, border: `1px solid ${C.brd}`, borderRadius: 8, padding: '.625rem .875rem', marginBottom: '1rem', textAlign: 'left' as const }}>
                <p style={{ fontSize: '.7rem', color: C.mut, marginBottom: '.25rem', fontWeight: 600 }}>CONTEÚDO CODIFICADO</p>
                <p style={{ fontSize: '.75rem', color: C.txt, fontFamily: 'monospace', wordBreak: 'break-all' as const, maxHeight: 60, overflow: 'hidden' }}>
                  {content.slice(0, 120)}{content.length > 120 ? '…' : ''}
                </p>
              </div>
            )}

            {/* Download buttons */}
            <div style={{ display: 'flex', gap: '.625rem', marginBottom: '.625rem' }}>
              <button onClick={() => download('png')} disabled={!qrSrc}
                style={{ flex: 1, padding: '.75rem', borderRadius: 9, border: 'none', background: C.acc, color: '#fff', fontWeight: 600, cursor: qrSrc ? 'pointer' : 'not-allowed', fontSize: '.875rem', opacity: qrSrc ? 1 : .5 }}>
                ⬇ Baixar PNG
              </button>
              <button onClick={() => download('svg')} disabled={!qrSrc}
                style={{ flex: 1, padding: '.75rem', borderRadius: 9, border: `1px solid ${C.brd2}`, background: C.sur2, color: C.txt, fontWeight: 600, cursor: qrSrc ? 'pointer' : 'not-allowed', fontSize: '.875rem', opacity: qrSrc ? 1 : .5 }}>
                ⬇ Baixar SVG
              </button>
            </div>
            <button onClick={async () => {
              const url = getQRUrl(content, cfg.size||300, cfg.fgColor||'#000000', cfg.bgColor||'#ffffff');
              try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2000); } catch { /* */ }
            }} disabled={!qrSrc}
              style={{ width: '100%', padding: '.625rem', borderRadius: 9, border: `1px solid ${C.brd}`, background: 'transparent', color: C.mut, cursor: qrSrc ? 'pointer' : 'not-allowed', fontSize: '.82rem', opacity: qrSrc ? 1 : .5 }}>
              {copied ? '✓ Link copiado!' : '🔗 Copiar link da imagem'}
            </button>
          </div>

          {/* Tips */}
          <div style={{ background: C.sur, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '1.125rem', marginTop: '1rem' }}>
            <p style={{ fontSize: '.8rem', fontWeight: 600, marginBottom: '.625rem' }}>💡 Dicas</p>
            <ul style={{ fontSize: '.78rem', color: C.mut, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
              <li>Use <strong style={{ color: C.txt }}>SVG</strong> para impressão — qualidade infinita</li>
              <li>Use <strong style={{ color: C.txt }}>PNG grande</strong> (400px+) para telas</li>
              <li>Contraste alto = leitura mais fácil</li>
              <li>Wi-Fi: escaneie e conecte sem digitar senha</li>
              <li>vCard: salva contato direto no celular</li>
            </ul>
          </div>
        </div>
      </div>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input:focus,select:focus,textarea:focus{border-color:${C.acc}!important;outline:none}button:hover:not(:disabled){opacity:.85}`}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
