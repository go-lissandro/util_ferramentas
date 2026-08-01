// ═══════════════════════════════════════════════════════════
// DESIGN SYSTEM — Util Ferramentas
// Tokens JS para uso em inline styles + pequenos helpers
// ═══════════════════════════════════════════════════════════

export const DS = {
  bg:       '#0a0a0f',
  surface:  '#111118',
  surface2: '#1a1a24',
  border:   '#2a2a38',
  border2:  '#3a3a4e',
  text:     '#e8e8f0',
  muted:    '#8888a8',
  accent:   '#6c63ff',
  ok:       '#00d4aa',
  err:      '#ff4d6a',
  wrn:      '#ffb347',

  glassBg:      'rgba(17,17,24,0.65)',
  glassBorder:  'rgba(255,255,255,0.06)',
  glassBlur:    16,

  gradientPrimary: 'linear-gradient(135deg,#6c63ff,#00d4aa)',
  gradientAccent:  'linear-gradient(135deg,#6c63ff,#a78bfa)',
  gradientSuccess: 'linear-gradient(135deg,#00d4aa,#38ef7d)',
  gradientWarning: 'linear-gradient(135deg,#ffb347,#ff7043)',

  radius: { sm: 6, md: 10, lg: 16, xl: 20 },

  ease: { spring: 'cubic-bezier(0.34,1.56,0.64,1)', smooth: 'cubic-bezier(0.4,0,0.2,1)' },
} as const;

// Re-export the shared icon system so apps can `import { AppIcon } from '@shared/design-system'`
export * from './icons';

// Tipo CSSProperties agnóstico (sem depender do React)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CSSProps = Record<string, any>;

// ── Glass card style (para inline styles) ────────────────────
export function glassCard(extra: CSSProps = {}): CSSProps {
  return {
    background: DS.glassBg,
    backdropFilter: `blur(${DS.glassBlur}px)`,
    WebkitBackdropFilter: `blur(${DS.glassBlur}px)`,
    border: `1px solid ${DS.glassBorder}`,
    borderRadius: DS.radius.lg,
    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
    transition: 'border-color .25s, box-shadow .25s, transform .25s',
    ...extra,
  };
}

// ── Formatação de moeda BR ───────────────────────────────────
export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatInt(v: number): string {
  return v.toLocaleString('pt-BR');
}

// ── Confetti (partículas de celebração) ──────────────────────
// Cria N partículas animadas num container. Usado ao completar
// um hábito (App7), copiar link (App2), etc.
export function burstConfetti(
  container: HTMLElement,
  opts: { count?: number; colors?: string[]; x?: number; y?: number } = {}
) {
  const { count = 18, x = container.clientWidth / 2, y = container.clientHeight / 2 } = opts;
  const colors = opts.colors ?? [DS.accent, DS.ok, DS.wrn, '#fff'];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 40 + Math.random() * 60;
    const size = 4 + Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];

    p.style.cssText = `
      position: absolute;
      left: ${x}px; top: ${y}px;
      width: ${size}px; height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      pointer-events: none;
      z-index: 999;
    `;

    container.appendChild(p);

    // Animar com WAAPI (performático, respeita prefers-reduced-motion)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      p.style.opacity = '0';
      requestAnimationFrame(() => p.remove());
      continue;
    }

    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const rot = Math.random() > 0.5 ? 360 : -360;

    const anim = p.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty + 30}px) scale(0.2) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 600 + Math.random() * 400, easing: 'cubic-bezier(0.2,0.8,0.4,1)' }
    );

    anim.onfinish = () => p.remove();
  }
}

// ── Animar contagem de número (counting up) ──────────────────
export function countUp(
  el: HTMLElement,
  target: number,
  { duration = 800, decimals = 0, suffix = '' } = {}
) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { el.textContent = target.toFixed(decimals) + suffix; return; }

  const start = performance.now();
  function frame(now: number) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
