import React from 'react';

/**
 * Shared inline SVG icon system — Util Ferramentas.
 *
 * Renders stroke-based icons (lucide-style, 24×24 viewBox) with no external
 * sprite file and no third-party dependency, so every app can use it reliably.
 * Color is inherited from `currentColor`; use the `color` prop or wrap in a
 * styled container to tint it.
 */

export const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM21 14v7M14 21h7" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  link2: (
    <>
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  converter: (
    <>
      <path d="M21 12a9 9 0 0 1-15.2 6.7L3 16" />
      <path d="M3 12a9 9 0 0 1 15.2-6.7L21 8" />
      <polyline points="3 20 3 16 7 16" />
      <polyline points="21 4 21 8 17 8" />
    </>
  ),
  flame: (
    <path d="M12 22c4.42 0 8-3.58 8-8 0-4.5-3.13-7.75-6.15-9.1C14.37 4.5 13 6.5 13 6.5s.9 2.5-.5 4.5c-1.2 1.7-2.5 2-2.5 2S10 10 8.5 8.5c-1.5 1.5-2.5 3-2.5 5.5a6 6 0 0 0 6 8z" />
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM21 14v7M14 21h3" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  finance: (
    <>
      <path d="M21 12H3" />
      <path d="M12 3v18" />
      <path d="M16 6h-3.5a2.5 2.5 0 0 0 0 5H11a3 3 0 0 1 0 6h3.5M16 21v-3" />
    </>
  ),
  video: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M10 9l5 3-5 3z" />
    </>
  ),
  folder: (
    <>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </>
  ),
  pencil: (
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  check: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  mouse: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="7" />
      <path d="M12 6v4" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>
  ),
  crown: (
    <path d="M2 19h20M2 19l-1-13 6 5 5-9 5 9 6-5-1 13z" />
  ),
  alert: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  chart: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  wifi: (
    <>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </>
  ),
  text: (
    <>
      <path d="M4 7V4h16v3" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="9" y1="20" x2="15" y2="20" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  users_config: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  inbox: (
    <>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  cube: (
    <>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  layers: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  ruler: (
    <>
      <rect x="2" y="9" width="20" height="6" rx="2" />
      <path d="M6 11v-1M10 11v-1M14 11v-1M18 11v-1" />
    </>
  ),
  crop: (
    <>
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </>
  ),
  shield: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  trendDown: (
    <>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </>
  ),
  trendUp: (
    <>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </>
  ),
  bank: (
    <>
      <line x1="3" y1="21" x2="21" y2="21" />
      <polyline points="5 21 5 10" />
      <polyline points="9 21 9 10" />
      <polyline points="13 21 13 10" />
      <polyline points="17 21 17 10" />
      <path d="M21 10l-9-7-9 7z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </>
  ),
  compress: (
    <>
      <path d="M8 2v4a2 2 0 0 1-2 2H2" />
      <path d="M16 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 22v-4a2 2 0 0 0-2-2H2" />
      <path d="M16 22v-4a2 2 0 0 1 2-2h4" />
    </>
  ),
} as const;

export type IconName = keyof typeof ICONS;

interface AppIconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  strokeWidth?: number;
}

export function AppIcon({
  name,
  size = 20,
  className,
  style,
  color,
  strokeWidth = 2,
}: AppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style,
      }}
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name] || ICONS.link}
    </svg>
  );
}

/**
 * App metadata — used to render per-app icon tiles, gradients and names
 * consistently across the dashboard and each app's own header.
 */
export interface AppMeta {
  key: string;
  name: string;
  icon: IconName;
  accent: string;
  accentSoft: string;
  gradient: string;
  path: string;
}

export const APPS: Record<string, AppMeta> = {
  app1: {
    key: 'app1', name: 'Painel Admin', icon: 'dashboard',
    accent: '#6c63ff', accentSoft: 'rgba(108,99,255,0.12)',
    gradient: 'linear-gradient(135deg,#6c63ff,#a78bfa)', path: '/app1',
  },
  app2: {
    key: 'app2', name: 'Encurtador de Links', icon: 'link',
    accent: '#6c63ff', accentSoft: 'rgba(108,99,255,0.12)',
    gradient: 'linear-gradient(135deg,#6c63ff,#a78bfa)', path: '/app2',
  },
  app3: {
    key: 'app3', name: 'Gerenciador de Dados', icon: 'database',
    accent: '#00d4aa', accentSoft: 'rgba(0,212,170,0.12)',
    gradient: 'linear-gradient(135deg,#00d4aa,#38ef7d)', path: '/app3',
  },
  app4: {
    key: 'app4', name: 'Video Downloader', icon: 'download',
    accent: '#ffb347', accentSoft: 'rgba(255,179,71,0.12)',
    gradient: 'linear-gradient(135deg,#ffb347,#ff7043)', path: '/app4',
  },
  app5: {
    key: 'app5', name: 'Conversor JSON ↔ Excel', icon: 'converter',
    accent: '#ff7eb3', accentSoft: 'rgba(255,126,179,0.12)',
    gradient: 'linear-gradient(135deg,#ff7eb3,#ff6b9d)', path: '/app5',
  },
  app6: {
    key: 'app6', name: 'Bio Link', icon: 'link2',
    accent: '#4ecdc4', accentSoft: 'rgba(78,205,196,0.12)',
    gradient: 'linear-gradient(135deg,#4ecdc4,#38ef7d)', path: '/app6',
  },
  app7: {
    key: 'app7', name: 'Rastreador de Hábitos', icon: 'flame',
    accent: '#ff7043', accentSoft: 'rgba(255,112,67,0.12)',
    gradient: 'linear-gradient(135deg,#ff7043,#ffb347)', path: '/app7',
  },
  app8: {
    key: 'app8', name: 'Gerador de QR Code', icon: 'qr',
    accent: '#4ecdc4', accentSoft: 'rgba(78,205,196,0.12)',
    gradient: 'linear-gradient(135deg,#4ecdc4,#38ef7d)', path: '/app8',
  },
  app9: {
    key: 'app9', name: 'Editor de Imagens', icon: 'image',
    accent: '#a855f7', accentSoft: 'rgba(168,85,247,0.12)',
    gradient: 'linear-gradient(135deg,#a855f7,#c084fc)', path: '/app9',
  },
  app10: {
    key: 'app10', name: 'Calculadora Financeira', icon: 'finance',
    accent: '#00d4aa', accentSoft: 'rgba(0,212,170,0.12)',
    gradient: 'linear-gradient(135deg,#00d4aa,#38ef7d)', path: '/app10',
  },
};

export function getAppMeta(key: string): AppMeta {
  return APPS[key] || {
    key, name: key, icon: 'link',
    accent: '#6c63ff', accentSoft: 'rgba(108,99,255,0.12)',
    gradient: 'linear-gradient(135deg,#6c63ff,#a78bfa)', path: '/' + key,
  };
}

/** Sets the per-app data attribute on <html> so tokens.css themes apply. */
export function setAppTheme(appKey: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-app', appKey);
  }
}
