import { Router, Request, Response } from 'express';

export const seoRouter = Router();

const SITE_URL  = (process.env.SITE_URL  || 'https://util-ferramentas.onrender.com').replace(/\/$/, '');
const SITE_NAME = process.env.SITE_NAME  || 'Util Ferramentas';
const YEAR      = new Date().getFullYear();
const OG_IMAGE  = `${SITE_URL}/og-image.png`; // serve via static or CDN

// ── Cache headers helper ───────────────────────────────────
function setHtmlHeaders(res: Response, maxAge = 3600) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=86400`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

// ── Critical CSS (inlined for performance — zero render-block) ──
const CRITICAL_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0a0f;--sur:#111118;--sur2:#1a1a24;--brd:#2a2a38;--txt:#e8e8f0;--mut:#8888a8;--acc:#6c63ff;--ok:#00d4aa;--glass:rgba(17,17,24,.65);--glass-brd:rgba(255,255,255,.06);--glass-shadow:0 8px 32px rgba(0,0,0,.35);--grad:linear-gradient(135deg,#6c63ff,#00d4aa);--glow:radial-gradient(circle at 50% 0%,rgba(108,99,255,.15),transparent 70%)}
html{scroll-behavior:smooth}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--txt);line-height:1.7;font-size:1rem;-webkit-text-size-adjust:100%}
body.fonts-loaded{font-family:'Inter',system-ui,sans-serif}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
img{max-width:100%;height:auto;display:block}
.wrap{max-width:860px;margin:0 auto;padding:0 1.5rem}
header{background:rgba(17,17,24,.8);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--glass-brd);padding:.875rem 0;position:sticky;top:0;z-index:100;contain:layout}
.hdr{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.625rem}
.logo{font-weight:700;font-size:1.05rem;color:var(--txt)}
.logo em{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;font-style:normal}
nav{display:flex;gap:.375rem;font-size:.82rem;flex-wrap:wrap}
nav a{color:var(--mut);display:inline-flex;align-items:center;gap:.375rem;padding:.3rem .65rem;border-radius:8px;border:1px solid transparent;transition:all .2s var(--ease-smooth, cubic-bezier(.4,0,.2,1))}
nav a:hover{color:var(--txt);background:rgba(108,99,255,.07);border-color:rgba(108,99,255,.2);text-decoration:none;transform:translateY(-1px)}
.nav-ico{width:18px;height:18px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
.nav-ico svg{display:block}
.btn-sm{background:var(--acc);color:#fff;padding:.4rem 1rem;border-radius:7px;font-size:.85rem;font-weight:600;white-space:nowrap;box-shadow:0 4px 12px rgba(108,99,255,.3)}
.btn-sm:hover{opacity:.88;text-decoration:none}
main{padding:2.5rem 0 4rem}
h1{font-size:clamp(1.6rem,4vw,2.4rem);font-weight:700;line-height:1.2;margin-bottom:.875rem;color:var(--txt)}
h2{font-size:1.35rem;font-weight:700;margin:2.25rem 0 .875rem;color:var(--txt);padding-bottom:.375rem;border-bottom:1px solid var(--brd)}
h3{font-size:1.05rem;font-weight:600;margin:1.75rem 0 .625rem;color:var(--txt)}
p{color:var(--mut);margin-bottom:.875rem;line-height:1.85}
ul,ol{color:var(--mut);padding-left:1.5rem;margin-bottom:1rem;line-height:1.85}
li{margin-bottom:.375rem}
li strong,p strong{color:var(--txt)}
.lead{font-size:1.05rem;color:var(--mut);margin-bottom:1.75rem;line-height:1.9;max-width:680px}
.box{background:var(--glass);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--glass-brd);border-radius:12px;padding:1.375rem;margin:1.375rem 0;box-shadow:var(--glass-shadow)}
.box p:last-child{margin:0}
.tip{background:rgba(108,99,255,.07);border-left:3px solid var(--acc);border-radius:0 8px 8px 0;padding:.875rem 1.125rem;margin:1.25rem 0;color:var(--txt);font-size:.9rem;line-height:1.7}
.tip strong{color:var(--acc)}
.warning{background:rgba(255,179,71,.07);border-left:3px solid #ffb347;border-radius:0 8px 8px 0;padding:.875rem 1.125rem;margin:1.25rem 0;font-size:.9rem;line-height:1.7}
.step-list{list-style:none;padding:0;counter-reset:steps;margin:1.25rem 0}
.step-list li{counter-increment:steps;display:flex;gap:.75rem;margin-bottom:1.125rem}
.step-list li::before{content:counter(steps);min-width:26px;height:26px;background:var(--grad);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.75rem;flex-shrink:0;margin-top:.25rem;box-shadow:0 2px 8px rgba(108,99,255,.35)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin:1.25rem 0}
.card{background:var(--glass);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--glass-brd);border-radius:12px;padding:1.125rem;box-shadow:var(--glass-shadow);transition:border-color .25s,box-shadow .25s,transform .25s}
.card:hover{border-color:rgba(108,99,255,.2);box-shadow:0 12px 40px rgba(108,99,255,.12);transform:translateY(-2px)}
.card h3{font-size:.9rem;margin:.375rem 0 .5rem;border:none;padding:0}
.card p{font-size:.85rem;margin:0;line-height:1.6}
.card .icon{display:flex;align-items:center;justify-content:flex-start;color:var(--acc);margin-bottom:.375rem}
.card .icon svg{display:block}
.breadcrumb{font-size:.78rem;color:var(--mut);margin-bottom:1.375rem;display:flex;align-items:center;gap:.375rem;flex-wrap:wrap}
.breadcrumb a{color:var(--mut)}
.breadcrumb span{color:var(--mut);opacity:.5}
.tag{display:inline-block;background:rgba(0,212,170,.1);color:var(--ok);font-size:.7rem;font-weight:600;padding:2px 10px;border-radius:20px;margin:0 .25rem .5rem 0;border:1px solid rgba(0,212,170,.2)}
.tag.purple{background:rgba(108,99,255,.12);color:#a89ff0;border-color:rgba(108,99,255,.25)}
.ad-wrap{margin:1.75rem 0;padding-top:1rem;border-top:1px solid var(--brd)}
.ad-label{font-size:.65rem;color:var(--mut);text-transform:uppercase;letter-spacing:.07em;margin-bottom:.375rem;text-align:center;opacity:.7}
table{width:100%;border-collapse:collapse;margin:1.25rem 0;font-size:.9rem;overflow:auto;display:block}
th{background:var(--sur);border:1px solid var(--brd);padding:.5rem .75rem;text-align:left;font-size:.8rem;color:var(--mut);font-weight:600;white-space:nowrap}
td{border:1px solid var(--brd);padding:.5rem .75rem;color:var(--mut);vertical-align:top}
tr:nth-child(even) td{background:rgba(255,255,255,.02)}
code{font-family:'Fira Code',Consolas,monospace;font-size:.85em;background:var(--sur2);padding:1px 6px;border-radius:4px;color:var(--ok)}
.toc{background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--glass-brd);border-radius:10px;padding:1.125rem;margin:1.5rem 0;box-shadow:var(--glass-shadow)}
.toc strong{display:block;font-size:.85rem;color:var(--txt);margin-bottom:.625rem}
.toc ol{font-size:.875rem;margin:0;padding-left:1.375rem}
.toc a{color:var(--mut)}
.toc a:hover{color:var(--acc)}
.faq-item{border-bottom:1px solid var(--brd);padding:1.125rem 0}
.faq-item:last-child{border:none}
.faq-item h3{margin:.125rem 0 .5rem;font-size:1rem;border:none;padding:0;color:var(--txt)}
.faq-item p{margin:0;font-size:.9rem}
.hero-cta{display:flex;gap:.875rem;flex-wrap:wrap;margin-top:1.75rem}
.btn-primary{display:inline-flex;align-items:center;gap:.5rem;background:var(--grad);color:#fff;padding:.75rem 1.5rem;border-radius:9px;font-weight:600;font-size:.95rem;box-shadow:0 4px 20px rgba(108,99,255,.35);transition:box-shadow .2s,transform .2s}
.btn-primary:hover{box-shadow:0 6px 28px rgba(108,99,255,.5);transform:translateY(-1px);text-decoration:none;opacity:.95}
.btn-outline{display:inline-flex;align-items:center;gap:.5rem;border:1px solid var(--brd);color:var(--mut);padding:.75rem 1.5rem;border-radius:9px;font-size:.95rem;transition:all .2s}
.btn-outline:hover{border-color:var(--acc);color:var(--txt);text-decoration:none;background:rgba(108,99,255,.06)}
.stats{display:flex;gap:2rem;flex-wrap:wrap;margin:1.75rem 0;padding:1.375rem;background:var(--glass);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-radius:12px;border:1px solid var(--glass-brd);box-shadow:var(--glass-shadow)}
.stat{text-align:center;flex:1;min-width:80px}
.stat strong{display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.stat strong svg{color:var(--acc)}
.stat span{font-size:.8rem;color:var(--mut)}
.related{margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--brd)}
.related h2{font-size:1rem;border:none;padding:0;margin:0 0 1rem}
.related-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem}
.related-link{background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--glass-brd);border-radius:9px;padding:.875rem 1rem;font-size:.875rem;color:var(--mut);transition:border-color .2s,transform .2s;box-shadow:var(--glass-shadow)}
.related-link:hover{border-color:rgba(108,99,255,.2);color:var(--txt);text-decoration:none;transform:translateY(-1px)}
.related-link strong{display:block;color:var(--txt);margin-bottom:.25rem;font-size:.9rem}
footer{background:rgba(17,17,24,.8);backdrop-filter:blur(12px);border-top:1px solid var(--glass-brd);padding:2rem 0;margin-top:1rem}
.footer-inner{text-align:center}
.footer-links{display:flex;flex-wrap:wrap;gap:.375rem 1rem;justify-content:center;margin-bottom:.875rem}
footer a{color:var(--mut);font-size:.82rem}footer a:hover{color:var(--txt);text-decoration:none}
footer p{font-size:.78rem;color:var(--mut);opacity:.7}
.hero-glow{background:var(--glow)}
.gradient-text{background:var(--grad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.fade-up{animation:seoFadeUp .5s ease both}
@keyframes seoFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.stagger>*{animation:seoFadeUp .5s ease both}
.stagger>*:nth-child(1){animation-delay:0ms}.stagger>*:nth-child(2){animation-delay:60ms}.stagger>*:nth-child(3){animation-delay:120ms}.stagger>*:nth-child(4){animation-delay:180ms}.stagger>*:nth-child(5){animation-delay:240ms}
@media(max-width:640px){.hdr{gap:.5rem}nav{display:none}.hero-cta{flex-direction:column}.stats{gap:1rem}}
.nav-mobile-toggle{display:none}
.nav-mobile{display:none}
@media(max-width:900px){
  nav.desktop{display:none}
  .nav-mobile-toggle{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9px;background:rgba(108,99,255,.12);border:1px solid rgba(108,99,255,.25);color:var(--acc);cursor:pointer;font-size:1.05rem}
  .nav-mobile{position:fixed;top:56px;left:0;right:0;z-index:99;background:rgba(17,17,24,.95);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--glass-brd);padding:.75rem 1.5rem 1.25rem;flex-direction:column;gap:.375rem;box-shadow:var(--glass-shadow)}
  .nav-mobile.open{display:flex;animation:seoFadeUp .25s ease both}
  .nav-mobile a{color:var(--txt);padding:.55rem .75rem;border-radius:8px;font-size:.9rem}
  .nav-mobile a:hover{background:rgba(108,99,255,.1)}
}
@media(max-width:640px){.hdr{gap:.5rem}.hero-cta{flex-direction:column}.stats{gap:1rem}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation:none!important;transition:none!important}}
`.trim();

// ── Inline SVG icons (stroke, lucide-style) ────────────────
// Emojis have inconsistent metrics across platforms/zoom levels and render
// misaligned ("torto") inside flex containers. These SVGs render pixel-perfect
// and match the AppIcon set used across the apps.
const SVG_PATHS: Record<string, string> = {
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  converter: '<path d="M21 12a9 9 0 0 1-15.2 6.7L3 16"/><path d="M3 12a9 9 0 0 1 15.2-6.7L21 8"/><polyline points="3 20 3 16 7 16"/><polyline points="21 4 21 8 17 8"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v7M14 21h3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  link2: '<path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 0 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/>',
  flame: '<path d="M12 22c4.42 0 8-3.58 8-8 0-4.5-3.13-7.75-6.15-9.1C14.37 4.5 13 6.5 13 6.5s.9 2.5-.5 4.5c-1.2 1.7-2.5 2-2.5 2S10 10 8.5 8.5c-1.5 1.5-2.5 3-2.5 5.5a6 6 0 0 0 6 8z"/>',
  finance: '<path d="M21 12H3"/><path d="M12 3v18"/><path d="M16 6h-3.5a2.5 2.5 0 0 0 0 5H11a3 3 0 0 1 0 6h3.5M16 21v-3"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  video: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  crown: '<path d="M2 19h20M2 19l-1-13 6 5 5-9 5 9 6-5-1 13z"/>',
  text: '<path d="M4 7V4h16v3"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="9" y1="20" x2="15" y2="20"/>',
  wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  ruler: '<rect x="2" y="9" width="20" height="6" rx="2"/><path d="M6 11v-1M10 11v-1M14 11v-1M18 11v-1"/>',
  compress: '<path d="M8 2v4a2 2 0 0 1-2 2H2"/><path d="M16 2v4a2 2 0 0 0 2 2h4"/><path d="M8 22v-4a2 2 0 0 0-2-2H2"/><path d="M16 22v-4a2 2 0 0 1 2-2h4"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  pencil2: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trendUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  trendDown: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
  bank: '<line x1="3" y1="21" x2="21" y2="21"/><polyline points="5 21 5 10"/><polyline points="9 21 9 10"/><polyline points="13 21 13 10"/><polyline points="17 21 17 10"/><path d="M21 10l-9-7-9 7z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  drop: '<path d="M12 22c4.42 0 8-3.58 8-8 0-4.5-3.13-7.75-6.15-9.1C14.37 4.5 13 6.5 13 6.5s.9 2.5-.5 4.5c-1.2 1.7-2.5 2-2.5 2S10 10 8.5 8.5c-1.5 1.5-2.5 3-2.5 5.5a6 6 0 0 0 6 8z"/>',
  run: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="5.5" r="3.5"/><path d="M12.13 19.35l1-7.13a2 2 0 0 1 1.96-1.69l5.43-.03"/><path d="M9.5 8.5l4-3"/><path d="M6.5 6.5l-1.5 5.5 4 2 3 4"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  write: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  bag: '<path d="M6 2h12l1.5 18a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  layers2: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  scale: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M12 9a3 3 0 0 0 0 6M9 3l3 4 3-4"/>',
};

// returns inline SVG (stroke) sized to fit the container, tinted via currentColor
function ico(name: string, size: number = 18): string {
  const path = SVG_PATHS[name] || SVG_PATHS.link;
  const isFilled = name === 'flame';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${isFilled ? 'currentColor' : 'none'}" stroke="${isFilled ? 'none' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="display:inline-block;vertical-align:middle;flex-shrink:0">${path}</svg>`;
}

// ── Page shell — optimized for Core Web Vitals ─────────────
function page(opts: {
  title: string;
  description: string;
  canonical: string;
  schema?: object | object[];
  ogType?: string;
  body: string;
  noAds?: boolean;
}): string {
  const ADSENSE_ID = process.env.GOOGLE_ADSENSE_ID || '';
  const SC_TOKEN   = process.env.GOOGLE_SEARCH_CONSOLE || '';

  const schemas = Array.isArray(opts.schema) ? opts.schema : opts.schema ? [opts.schema] : [];
  const schemaHtml = schemas.map(s =>
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('\n');

  const adUnit = ADSENSE_ID && !opts.noAds
    ? `<div class="ad-wrap"><p class="ad-label">Publicidade</p><ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_ID}" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`
    : '';

  // Truncate for safety
  const safeTitle = opts.title.slice(0, 70);
  const safeDesc  = opts.description.slice(0, 160);

  return `<!DOCTYPE html>
<html lang="pt-BR" prefix="og: http://ogp.me/ns#">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>

<!-- Primary SEO -->
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}"/>
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"/>
<link rel="canonical" href="${opts.canonical}"/>
${SC_TOKEN ? `<meta name="google-site-verification" content="${SC_TOKEN}"/>` : ''}

<!-- Open Graph (Facebook, WhatsApp, Telegram) -->
<meta property="og:type" content="${opts.ogType || 'website'}"/>
<meta property="og:url" content="${opts.canonical}"/>
<meta property="og:title" content="${safeTitle}"/>
<meta property="og:description" content="${safeDesc}"/>
<meta property="og:locale" content="pt_BR"/>
<meta property="og:site_name" content="${SITE_NAME}"/>
<meta property="og:image" content="${OG_IMAGE}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="${SITE_NAME}"/>

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${safeTitle}"/>
<meta name="twitter:description" content="${safeDesc}"/>
<meta name="twitter:image" content="${OG_IMAGE}"/>

<!-- Performance: preconnect critical origins -->
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
${ADSENSE_ID ? `<link rel="preconnect" href="https://pagead2.googlesyndication.com"/>` : ''}

<!-- Non-blocking font load -->
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'"/>
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"/></noscript>

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%236c63ff'/><text x='6' y='24' font-size='20'>🔧</text></svg>"/>

<!-- Structured data -->
${schemaHtml}

<!-- Critical CSS inlined — zero render-blocking -->
<style>${CRITICAL_CSS}</style>

<!-- AdSense (async, non-blocking) -->
${ADSENSE_ID ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}" crossorigin="anonymous"></script>` : ''}
</head>
<body>

<header>
  <div class="wrap"><div class="hdr">
    <a href="/" class="logo" aria-label="${SITE_NAME} - Início"><em>Util</em> Ferramentas</a>
    <nav class="desktop" aria-label="Menu principal">
      <a href="/como-baixar-videos"><span class="nav-ico" style="background:linear-gradient(135deg,#ffb347,#ff7043)">${ico('download', 12)}</span>Vídeos</a>
      <a href="/converter-json-excel"><span class="nav-ico" style="background:linear-gradient(135deg,#ff7eb3,#ff6b6b)">${ico('converter', 12)}</span>JSON↔Excel</a>
      <a href="/gerador-qr-code"><span class="nav-ico" style="background:linear-gradient(135deg,#6c63ff,#a78bfa)">${ico('qr', 12)}</span>QR Code</a>
      <a href="/encurtar-links"><span class="nav-ico" style="background:linear-gradient(135deg,#6c63ff,#00d4aa)">${ico('link', 12)}</span>Links</a>
      <a href="/link-na-bio"><span class="nav-ico" style="background:linear-gradient(135deg,#4ecdc4,#38ef7d)">${ico('link2', 12)}</span>Bio Link</a>
      <a href="/rastreador-de-habitos"><span class="nav-ico" style="background:linear-gradient(135deg,#ff7043,#ffb347)">${ico('flame', 12)}</span>Hábitos</a>
      <a href="/calculadora-financeira"><span class="nav-ico" style="background:linear-gradient(135deg,#00d4aa,#38ef7d)">${ico('finance', 12)}</span>Finanças</a>
      <a href="/sobre"><span class="nav-ico" style="background:linear-gradient(135deg,#3a3a4e,#2a2a38)">${ico('info', 12)}</span>Sobre</a>
    </nav>
    <div style="display:flex;align-items:center;gap:.5rem">
      <button class="nav-mobile-toggle" id="navToggle" aria-label="Abrir menu" aria-expanded="false">☰</button>
      <a href="/app4" class="btn-sm">Usar grátis →</a>
    </div>
  </div></div>

  <nav class="nav-mobile" id="navMobile" aria-label="Menu móvel">
    <a href="/como-baixar-videos"><span class="nav-ico" style="background:linear-gradient(135deg,#ffb347,#ff7043)">${ico('download', 12)}</span>Vídeos</a>
    <a href="/converter-json-excel"><span class="nav-ico" style="background:linear-gradient(135deg,#ff7eb3,#ff6b6b)">${ico('converter', 12)}</span>JSON↔Excel</a>
    <a href="/gerador-qr-code"><span class="nav-ico" style="background:linear-gradient(135deg,#6c63ff,#a78bfa)">${ico('qr', 12)}</span>QR Code</a>
    <a href="/encurtar-links"><span class="nav-ico" style="background:linear-gradient(135deg,#6c63ff,#00d4aa)">${ico('link', 12)}</span>Links</a>
    <a href="/link-na-bio"><span class="nav-ico" style="background:linear-gradient(135deg,#4ecdc4,#38ef7d)">${ico('link2', 12)}</span>Bio Link</a>
    <a href="/rastreador-de-habitos"><span class="nav-ico" style="background:linear-gradient(135deg,#ff7043,#ffb347)">${ico('flame', 12)}</span>Hábitos</a>
    <a href="/calculadora-financeira"><span class="nav-ico" style="background:linear-gradient(135deg,#00d4aa,#38ef7d)">${ico('finance', 12)}</span>Finanças</a>
    <a href="/sobre"><span class="nav-ico" style="background:linear-gradient(135deg,#3a3a4e,#2a2a38)">${ico('info', 12)}</span>Sobre</a>
  </nav>
</header>

<main id="main-content">
  <div class="wrap">
    ${opts.body}
    ${adUnit}
  </div>
</main>

<footer role="contentinfo">
  <div class="wrap footer-inner">
    <nav class="footer-links" aria-label="Links do rodapé">
      <a href="/">Início</a>
      <a href="/como-baixar-videos">Baixar Vídeos</a>
      <a href="/converter-mp3">Converter MP3</a>
      <a href="/encurtar-links">Encurtar Links</a>
      <a href="/converter-json-excel">JSON↔Excel</a>
      <a href="/link-na-bio">Bio Link</a>
      <a href="/sobre">Sobre</a>
      <a href="/privacidade">Privacidade</a>
      <a href="/termos">Termos</a>
      <a href="/checkout.html">Planos</a>
      <a href="/app1">Entrar</a>
    </nav>
    <p>&copy; ${YEAR} ${SITE_NAME}. Ferramentas online gratuitas.</p>
  </div>
</footer>

<!-- Font class after load (prevents FOUT) -->
<script>
(function(){var f=document.fonts;if(f&&f.ready)f.ready.then(function(){document.body.className+=' fonts-loaded';});})();
// Mobile nav toggle
(function(){
  var t=document.getElementById('navToggle'),m=document.getElementById('navMobile');
  if(!t||!m)return;
  t.addEventListener('click',function(){
    var open=m.classList.toggle('open');
    t.setAttribute('aria-expanded',open?'true':'false');
  });
  document.addEventListener('click',function(e){
    if(m.classList.contains('open')&&!m.contains(e.target)&&!t.contains(e.target)){m.classList.remove('open');t.setAttribute('aria-expanded','false');}
  });
})();
</script>
</body>
</html>`;
}

// ── robots.txt ─────────────────────────────────────────────
seoRouter.get('/robots.txt', (_req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /app1
Disallow: /app2
Disallow: /app3
Crawl-delay: 2

User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

Sitemap: ${SITE_URL}/sitemap.xml`);
});

// ── sitemap.xml ────────────────────────────────────────────
seoRouter.get('/sitemap.xml', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    ['/',                      '1.0', 'weekly',  today],
    ['/como-baixar-videos',    '0.9', 'monthly', today],
    ['/converter-mp3',         '0.9', 'monthly', today],
    ['/encurtar-links',        '0.8', 'monthly', today],
    ['/converter-json-excel',  '0.8', 'monthly', today],
    ['/link-na-bio',           '0.8', 'monthly', today],
    ['/rastreador-de-habitos', '0.8', 'monthly', today],
    ['/gerador-qr-code',        '0.8', 'monthly', today],
    ['/editor-imagens',         '0.8', 'monthly', today],
    ['/calculadora-financeira', '0.8', 'monthly', today],
    ['/sobre',                 '0.6', 'monthly', today],
    ['/privacidade',           '0.4', 'yearly',  today],
    ['/termos',                '0.4', 'yearly',  today],
    ['/checkout.html',         '0.9', 'monthly', today],
    ['/app4',                  '0.8', 'weekly',  today],
    ['/app5',                  '0.7', 'weekly',  today],
    ['/app6',                  '0.7', 'weekly',  today],
    ['/app7',                  '0.7', 'weekly',  today],
    ['/app8',                  '0.7', 'weekly',  today],
    ['/app9',                  '0.7', 'weekly',  today],
    ['/app10',                 '0.7', 'weekly',  today],
  ];

  const items = urls.map(([loc, pri, freq, mod]) =>
    `  <url>\n    <loc>${SITE_URL}${loc}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`
  ).join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=43200');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${items}\n</urlset>`);
});

// ──────────────────────────────────────────────────────────────────
// HOME PAGE
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/', (_req, res) => {
  setHtmlHeaders(res);

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: 'Ferramentas online gratuitas: baixar vídeos, converter MP3, encurtar links, converter JSON para Excel',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/app4?url={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: OG_IMAGE },
      sameAs: [SITE_URL],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Como baixar vídeo do YouTube?', acceptedAnswer: { '@type': 'Answer', text: 'Acesse a ferramenta de download, cole o link do YouTube e clique em Buscar. Escolha a qualidade e clique em Baixar.' } },
        { '@type': 'Question', name: 'O Util Ferramentas é gratuito?', acceptedAnswer: { '@type': 'Answer', text: 'Sim. Download de vídeos e conversor JSON↔Excel são completamente gratuitos e sem limite de uso.' } },
        { '@type': 'Question', name: 'Como converter vídeo para MP3?', acceptedAnswer: { '@type': 'Answer', text: 'Cole o link do vídeo, aguarde carregar e selecione "Somente áudio (MP3)" na lista de formatos antes de baixar.' } },
        { '@type': 'Question', name: 'Quais sites são suportados?', acceptedAnswer: { '@type': 'Answer', text: 'Mais de 1000 sites incluindo YouTube, Instagram, TikTok, Twitter, Vimeo, Facebook, Reddit e Twitch.' } },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Util Ferramentas — Video Downloader',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '142' },
      description: 'Baixe vídeos do YouTube, Instagram, TikTok e mais de 1000 sites. Gratuito, sem cadastro.',
      url: `${SITE_URL}/app4`,
    },
  ];

  const body = `
<section class="hero-glow">
<h1 class="fade-up">Ferramentas online <span class="gradient-text">gratuitas</span> para o seu dia a dia</h1>
<p class="lead fade-up">Baixe vídeos do YouTube e Instagram, converta para MP3, transforme JSON em Excel, encurte links com analytics — tudo em um só lugar, sem instalar nada, sem cadastro obrigatório.</p>

<div class="stats stagger">
  <div class="stat"><strong>1.000+</strong><span>sites suportados</span></div>
  <div class="stat"><strong>10</strong><span>ferramentas</span></div>
  <div class="stat"><strong>100%</strong><span>online</span></div>
  <div class="stat"><strong>0</strong><span>instalações</span></div>
</div>

<div class="hero-cta fade-up">
  <a href="/app4" class="btn-primary" aria-label="Abrir ferramenta de download de vídeos">${ico('download', 16)} Baixar vídeo grátis</a>
  <a href="/app5" class="btn-outline" aria-label="Abrir conversor JSON para Excel">${ico('converter', 16)} Converter JSON↔Excel</a>
  <a href="/checkout.html" class="btn-outline">Ver plano Pro</a>
</div>
</section>

<h2>Ferramentas disponíveis</h2>
<div class="cards stagger">
  <div class="card">
    <div class="icon">${ico('download', 24)}</div>
    <h3><a href="/como-baixar-videos">Baixar Vídeos Online</a></h3>
    <p>Salve vídeos do YouTube, Instagram, TikTok e outros 1000+ sites em MP4 ou MP3. <span class="tag">Grátis</span></p>
  </div>
  <div class="card">
    <div class="icon">${ico('music', 24)}</div>
    <h3><a href="/converter-mp3">Converter Vídeo para MP3</a></h3>
    <p>Extraia o áudio de qualquer vídeo online e salve como MP3 em 192kbps. <span class="tag">Grátis</span></p>
  </div>
  <div class="card">
    <div class="icon">${ico('converter', 24)}</div>
    <h3><a href="/converter-json-excel">Conversor JSON↔Excel</a></h3>
    <p>Transforme JSON em planilha Excel formatada ou converta Excel/CSV para JSON. <span class="tag">Grátis</span></p>
  </div>
  <div class="card">
    <div class="icon">${ico('qr', 24)}</div>
    <h3><a href="/gerador-qr-code">Gerador de QR Code</a></h3>
    <p>URL, PIX, Wi-Fi, contato e mais — download em PNG e SVG. <span class="tag">Grátis</span></p>
  </div>
  <div class="card">
    <div class="icon">${ico('link', 24)}</div>
    <h3><a href="/encurtar-links">Encurtador de Links</a></h3>
    <p>Links curtos com analytics, QR code e data de expiração. <span class="tag purple">Pro</span></p>
  </div>
  <div class="card">
    <div class="icon">${ico('database', 24)}</div>
    <h3>Gerenciador de Dados</h3>
    <p>Crie estruturas dinâmicas para organizar qualquer tipo de informação. <span class="tag purple">Pro</span></p>
  </div>
</div>

<h2>Como baixar vídeos online: passo a passo</h2>
<p>O processo é simples e leva menos de um minuto:</p>
<ol class="step-list">
  <li><strong>Copie o link</strong> do vídeo diretamente do YouTube, Instagram, TikTok ou qualquer outro site suportado.</li>
  <li><strong>Cole o link</strong> no campo da <a href="/app4">ferramenta de download</a> e clique em "Buscar".</li>
  <li><strong>Escolha o formato:</strong> MP4 para vídeo completo ou MP3 para extrair somente o áudio.</li>
  <li><strong>Clique em "Baixar"</strong> — o arquivo é processado e salvo direto na sua pasta de downloads.</li>
</ol>
<div class="tip"><strong>💡 Dica:</strong> Para converter um vídeo do YouTube para MP3, selecione "Somente áudio (MP3)" na lista de formatos. Ideal para salvar podcasts e músicas.</div>

<h2>Sites de vídeo suportados</h2>
<p>Nossa ferramenta usa o <strong>yt-dlp</strong>, o downloader open-source mais completo disponível, com suporte a mais de 1.000 plataformas:</p>
<table>
  <thead><tr><th>Plataforma</th><th>Conteúdo</th><th>Formatos</th></tr></thead>
  <tbody>
    <tr><td><strong>YouTube</strong></td><td>Vídeos, Shorts, Lives</td><td>MP4 (até 4K), MP3, WebM</td></tr>
    <tr><td><strong>Instagram</strong></td><td>Reels, Stories, Posts</td><td>MP4, MP3</td></tr>
    <tr><td><strong>TikTok</strong></td><td>Vídeos</td><td>MP4 sem marca d'água</td></tr>
    <tr><td><strong>Twitter / X</strong></td><td>Vídeos em tweets</td><td>MP4</td></tr>
    <tr><td><strong>Vimeo</strong></td><td>Vídeos públicos</td><td>MP4 (até 1080p)</td></tr>
    <tr><td><strong>Facebook</strong></td><td>Vídeos públicos</td><td>MP4</td></tr>
    <tr><td><strong>Reddit</strong></td><td>Posts com vídeo</td><td>MP4</td></tr>
    <tr><td><strong>Twitch</strong></td><td>Clips e VODs</td><td>MP4</td></tr>
    <tr><td><strong>Dailymotion</strong></td><td>Vídeos</td><td>MP4</td></tr>
  </tbody>
</table>

<h2>Por que usar o Util Ferramentas?</h2>
<p>Existem dezenas de sites de download de vídeo, mas a maioria redireciona para propagandas, exige instalação de extensões ou limita o número de downloads. O Util Ferramentas foi criado diferente:</p>
<ul>
  <li><strong>Sem instalação</strong> — funciona no navegador, em qualquer dispositivo (PC, celular, tablet)</li>
  <li><strong>Sem cadastro obrigatório</strong> para as ferramentas gratuitas</li>
  <li><strong>Sem limite de downloads</strong> — use quantas vezes quiser</li>
  <li><strong>Sem redirecionamentos</strong> para outros sites</li>
  <li><strong>Múltiplas ferramentas</strong> — download de vídeo, conversão de dados, encurtador de links, tudo em um lugar</li>
</ul>

<h2>Perguntas frequentes</h2>
<div role="list">
  <div class="faq-item" role="listitem" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Como baixar vídeo do YouTube grátis?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Acesse nossa <a href="/app4">ferramenta de download</a>, cole o link do YouTube, aguarde carregar e escolha a qualidade. Clique em Baixar — o arquivo é salvo direto no seu dispositivo. É 100% gratuito.</p>
    </div>
  </div>
  <div class="faq-item" role="listitem" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">Como converter YouTube para MP3?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Cole o link do vídeo e selecione "Somente áudio (MP3)" na lista de formatos. O arquivo MP3 é baixado diretamente. Saiba mais no nosso <a href="/converter-mp3">guia de conversão MP3</a>.</p>
    </div>
  </div>
  <div class="faq-item" role="listitem" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">O serviço é realmente gratuito?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Sim. Download de vídeos, extração de MP3 e o conversor JSON↔Excel são completamente gratuitos e sem limite. O <a href="/checkout.html">Plano Pro</a> (R$29,90/mês) adiciona encurtador de links e gerenciador de dados.</p>
    </div>
  </div>
  <div class="faq-item" role="listitem" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h3 itemprop="name">É seguro usar para baixar vídeos?</h3>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <p itemprop="text">Sim. Os arquivos são processados diretamente no servidor e entregues ao seu dispositivo. Não armazenamos os vídeos baixados nem compartilhamos dados com terceiros. Veja nossa <a href="/privacidade">Política de Privacidade</a>.</p>
    </div>
  </div>
</div>

<div class="related">
  <h2>Guias relacionados</h2>
  <div class="related-links">
    <a href="/como-baixar-videos" class="related-link"><strong>${ico('download', 14)} Como Baixar Vídeos</strong>Guia completo por plataforma</a>
    <a href="/converter-mp3" class="related-link"><strong>${ico('music', 14)} Converter para MP3</strong>YouTube, Instagram e mais</a>
    <a href="/converter-json-excel" class="related-link"><strong>${ico('converter', 14)} JSON para Excel</strong>Conversor online gratuito</a>
    <a href="/encurtar-links" class="related-link"><strong>${ico('link', 14)} Encurtar Links</strong>Com analytics e QR Code</a>
  </div>
</div>`;

  res.send(page({
    title: `${SITE_NAME} — Baixar Vídeos, Converter MP3 e JSON Excel Online`,
    description: 'Baixe vídeos do YouTube, Instagram e TikTok, converta para MP3, transforme JSON em Excel e encurte links. Ferramentas gratuitas, sem instalar, sem cadastro.',
    canonical: `${SITE_URL}/`,
    schema,
    body,
  }));
});

// ──────────────────────────────────────────────────────────────────
// COMO BAIXAR VÍDEOS
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/como-baixar-videos', (_req, res) => {
  setHtmlHeaders(res);

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Como Baixar Vídeos Online Grátis — Guia Completo 2024',
      description: 'Aprenda a salvar vídeos do YouTube, Instagram e TikTok sem instalar programas. Guia passo a passo.',
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: OG_IMAGE } },
      datePublished: '2024-01-01',
      dateModified: new Date().toISOString().split('T')[0],
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/como-baixar-videos` },
      image: OG_IMAGE,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Como Baixar Vídeos', item: `${SITE_URL}/como-baixar-videos` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Como baixar vídeos online',
      description: 'Passo a passo para baixar vídeos do YouTube, Instagram e outros sites.',
      totalTime: 'PT1M',
      tool: [{ '@type': 'HowToTool', name: 'Navegador web' }],
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Copie o link', text: 'No app ou site, clique em Compartilhar e copie o link do vídeo.' },
        { '@type': 'HowToStep', position: 2, name: 'Cole no downloader', text: `Acesse ${SITE_URL}/app4 e cole o link no campo de texto.` },
        { '@type': 'HowToStep', position: 3, name: 'Escolha o formato', text: 'Selecione MP4 para vídeo ou MP3 para áudio apenas.' },
        { '@type': 'HowToStep', position: 4, name: 'Baixe o arquivo', text: 'Clique em Baixar e aguarde o arquivo ser salvo.' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Preciso instalar algum programa para baixar vídeos?', acceptedAnswer: { '@type': 'Answer', text: 'Não. Nossa ferramenta funciona diretamente no navegador, sem instalar nenhum programa ou extensão.' } },
        { '@type': 'Question', name: 'Posso baixar vídeos no celular?', acceptedAnswer: { '@type': 'Answer', text: 'Sim. A ferramenta funciona em smartphones Android e iPhone pelo navegador.' } },
        { '@type': 'Question', name: 'Por que alguns vídeos do YouTube não funcionam?', acceptedAnswer: { '@type': 'Answer', text: 'Vídeos com restrição de idade, conteúdo de membros pagantes ou vídeos privados não podem ser baixados sem autenticação.' } },
      ],
    },
  ];

  const body = `
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="/">Início</a><span aria-hidden="true">›</span><span>Como Baixar Vídeos</span>
</nav>
<span class="tag">Guia Completo</span><span class="tag">Gratuito</span>

<h1>Como baixar vídeos online: guia completo</h1>
<p class="lead">Aprenda a salvar vídeos do YouTube, Instagram, TikTok e mais de 1.000 outros sites diretamente no seu computador ou celular, <strong>sem instalar programas</strong> e de forma completamente gratuita.</p>

<div class="toc">
  <strong>Neste guia:</strong>
  <ol>
    <li><a href="#passo-a-passo">Passo a passo (qualquer plataforma)</a></li>
    <li><a href="#youtube">YouTube — como baixar</a></li>
    <li><a href="#instagram">Instagram — Reels e Stories</a></li>
    <li><a href="#tiktok">TikTok sem marca d'água</a></li>
    <li><a href="#formatos">Diferença entre MP4, WebM e MP3</a></li>
    <li><a href="#celular">Como baixar no celular</a></li>
    <li><a href="#problemas">Resolução de problemas</a></li>
  </ol>
</div>

<h2 id="passo-a-passo">Passo a passo: como baixar qualquer vídeo</h2>
<p>O mesmo processo funciona para YouTube, Instagram, TikTok, Vimeo e todos os outros sites suportados:</p>
<ol class="step-list">
  <li><strong>Copie o link do vídeo</strong> — no aplicativo ou site, toque em "Compartilhar" e copie o link.</li>
  <li><strong>Abra a ferramenta</strong> — acesse <a href="/app4">Util Ferramentas — Download de Vídeos</a>.</li>
  <li><strong>Cole o link</strong> — clique no campo de texto e cole (Ctrl+V no PC, segurar e colar no celular).</li>
  <li><strong>Clique em "Buscar"</strong> — aguarde alguns segundos enquanto carregamos as informações do vídeo.</li>
  <li><strong>Escolha o formato</strong> — MP4 para vídeo completo, MP3 para áudio apenas. Veja as resoluções disponíveis.</li>
  <li><strong>Baixe</strong> — clique em "Baixar" e o arquivo será salvo na pasta de downloads.</li>
</ol>
<div class="tip"><strong>Tempo total:</strong> menos de 60 segundos para a maioria dos vídeos. Vídeos em 4K podem demorar mais.</div>

<h2 id="youtube">Como baixar vídeos do YouTube</h2>
<p>O YouTube é a maior plataforma de vídeos do mundo. Para copiar o link de um vídeo:</p>
<ul>
  <li><strong>No computador:</strong> Clique em "Compartilhar" abaixo do vídeo → "Copiar link"</li>
  <li><strong>No aplicativo iOS/Android:</strong> Toque em "Compartilhar" → "Copiar link"</li>
  <li><strong>Alternativa:</strong> Copie a URL completa da barra de endereços do navegador</li>
</ul>
<p>O YouTube disponibiliza os vídeos em resoluções 360p, 480p, 720p HD, 1080p Full HD, 1440p e 4K. Quanto maior a resolução, maior o arquivo final.</p>
<div class="warning">⚠️ <strong>Atenção:</strong> Vídeos privados, conteúdo exclusivo para membros pagantes e vídeos com restrição de idade não podem ser baixados sem autenticação de conta.</div>

<h2 id="instagram">Como baixar vídeos do Instagram</h2>
<p>Funciona para Reels, vídeos em posts e IGTV de perfis públicos:</p>
<ol class="step-list">
  <li>Abra o Instagram e encontre o vídeo ou Reel</li>
  <li>Toque nos <strong>três pontos (...)</strong> no canto superior direito do post</li>
  <li>Selecione <strong>"Copiar link"</strong></li>
  <li>Cole no <a href="/app4">downloader</a> e baixe em MP4</li>
</ol>
<p>Para Stories: apenas perfis públicos funcionam. Stories expiram após 24h, então baixe antes de sumirem.</p>

<h2 id="tiktok">Como baixar vídeos do TikTok sem marca d'água</h2>
<p>Os vídeos baixados pelo próprio app do TikTok têm uma marca d'água com o nome do usuário. Com nossa ferramenta, você pode baixar <strong>sem a marca d'água</strong>:</p>
<ol class="step-list">
  <li>Abra o TikTok e encontre o vídeo</li>
  <li>Toque em <strong>"Compartilhar"</strong> (seta)</li>
  <li>Selecione <strong>"Copiar link"</strong></li>
  <li>Cole no downloader e baixe em MP4</li>
</ol>

<h2 id="formatos">Diferença entre os formatos de vídeo</h2>
<table>
  <thead><tr><th>Formato</th><th>Uso ideal</th><th>Compatibilidade</th><th>Tamanho</th></tr></thead>
  <tbody>
    <tr><td><strong>MP4</strong></td><td>Assistir, editar, enviar</td><td>Universal — todos os dispositivos</td><td>Médio</td></tr>
    <tr><td><strong>WebM</strong></td><td>Web, YouTube, Vimeo</td><td>Navegadores modernos, alguns players</td><td>Pequeno</td></tr>
    <tr><td><strong>MP3</strong></td><td>Música, podcast, áudio</td><td>Universal — qualquer player</td><td>Pequeno</td></tr>
    <tr><td><strong>M4A</strong></td><td>Áudio alta qualidade</td><td>Apple, players modernos</td><td>Pequeno</td></tr>
  </tbody>
</table>
<p>Para uso geral, recomende o <strong>MP4</strong> — compatível com todos os dispositivos e softwares de edição.</p>

<h2 id="celular">Como baixar vídeos no celular</h2>
<p><strong>Android:</strong> O arquivo é salvo em Armazenamento Interno → Downloads. Encontre no app "Arquivos" ou na Galeria (se for MP4).</p>
<p><strong>iPhone (iOS):</strong> No Safari, após iniciar o download, segure o arquivo e selecione "Salvar nos Arquivos" para guardar no iCloud Drive ou no armazenamento local do iPhone.</p>
<div class="tip"><strong>Dica iOS:</strong> Use o Safari (não o Chrome) para download direto de arquivos no iPhone — o Chrome no iOS às vezes não abre o diálogo de salvar.</div>

<h2 id="problemas">Resolução de problemas comuns</h2>
<div class="box">
  <h3>❓ "Vídeo não encontrado" ou "URL inválida"</h3>
  <p>Verifique se o link foi copiado completo. Links encurtados (bit.ly, etc.) precisam ser a URL original do vídeo.</p>
</div>
<div class="box">
  <h3>❓ Download muito lento ou travando</h3>
  <p>Tente uma resolução menor (720p em vez de 1080p). O tempo de processamento varia conforme o tamanho do vídeo.</p>
</div>
<div class="box">
  <h3>❓ Arquivo baixado não abre</h3>
  <p>Instale o <strong>VLC Media Player</strong> (gratuito) — reproduz praticamente todos os formatos de vídeo em qualquer sistema.</p>
</div>
<div class="box">
  <h3>❓ Vídeo do YouTube não funciona</h3>
  <p>O YouTube bloqueia IPs de servidores cloud. Vídeos públicos normais geralmente funcionam. Conteúdo com restrição de idade não é suportado.</p>
</div>

<div class="hero-cta">
  <a href="/app4" class="btn-primary">${ico('download', 16)} Baixar vídeo agora — grátis</a>
  <a href="/converter-mp3" class="btn-outline">${ico('music', 16)} Converter para MP3</a>
</div>

<div class="related">
  <h2>Leia também</h2>
  <div class="related-links">
    <a href="/converter-mp3" class="related-link"><strong>${ico('music', 14)} Converter para MP3</strong>Guia completo de extração de áudio</a>
    <a href="/converter-json-excel" class="related-link"><strong>${ico('converter', 14)} JSON para Excel</strong>Conversor online gratuito</a>
    <a href="/encurtar-links" class="related-link"><strong>${ico('link', 14)} Encurtar Links</strong>Com analytics em tempo real</a>
    <a href="/" class="related-link"><strong>🏠 Todas as Ferramentas</strong>Ver tudo disponível</a>
  </div>
</div>`;

  res.send(page({
    title: 'Como Baixar Vídeos Online Grátis — YouTube, Instagram, TikTok 2024',
    description: 'Guia completo: como baixar vídeos do YouTube, Instagram, TikTok sem instalar programas. Passo a passo simples, gratuito, funciona no celular e PC.',
    canonical: `${SITE_URL}/como-baixar-videos`,
    ogType: 'article',
    schema,
    body,
  }));
});

// ──────────────────────────────────────────────────────────────────
// CONVERTER MP3
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/converter-mp3', (_req, res) => {
  setHtmlHeaders(res);

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Como Converter Vídeo para MP3 Online Grátis',
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: OG_IMAGE } },
      datePublished: '2024-01-01',
      dateModified: new Date().toISOString().split('T')[0],
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/converter-mp3` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Converter MP3', item: `${SITE_URL}/converter-mp3` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Como converter vídeo do YouTube para MP3',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Copie o link', text: 'Copie o link do vídeo do YouTube.' },
        { '@type': 'HowToStep', position: 2, name: 'Cole na ferramenta', text: `Acesse ${SITE_URL}/app4 e cole o link.` },
        { '@type': 'HowToStep', position: 3, name: 'Selecione MP3', text: 'Escolha "Somente áudio (MP3)" na lista de formatos.' },
        { '@type': 'HowToStep', position: 4, name: 'Baixe o MP3', text: 'Clique em Baixar e salve o arquivo MP3.' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Qual a qualidade do MP3 gerado?', acceptedAnswer: { '@type': 'Answer', text: 'A ferramenta converte em 192kbps, qualidade equivalente a CD, suficiente para qualquer uso.' } },
        { '@type': 'Question', name: 'Posso converter MP3 de qualquer site?', acceptedAnswer: { '@type': 'Answer', text: 'Sim, funciona com qualquer plataforma suportada: YouTube, Instagram, TikTok, Twitter, Vimeo e mais de 1000 outros.' } },
        { '@type': 'Question', name: 'Onde fica o arquivo MP3 depois do download?', acceptedAnswer: { '@type': 'Answer', text: 'No computador, na pasta Downloads. No Android, em Armazenamento → Downloads. No iPhone, no app Arquivos.' } },
      ],
    },
  ];

  const body = `
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="/">Início</a><span>›</span><span>Converter Vídeo para MP3</span>
</nav>
<span class="tag">Guia</span><span class="tag">Gratuito</span>

<h1>Como converter vídeo para MP3 online — gratuito e rápido</h1>
<p class="lead">Aprenda a extrair o áudio de qualquer vídeo do YouTube, Instagram, TikTok e salvar como MP3 de alta qualidade, sem instalar programas, completamente online e gratuito.</p>

<div class="stats">
  <div class="stat"><strong>192kbps</strong><span>qualidade do MP3</span></div>
  <div class="stat"><strong>1.000+</strong><span>sites suportados</span></div>
  <div class="stat"><strong>&lt;1min</strong><span>tempo médio</span></div>
</div>

<h2>O que é conversão de vídeo para MP3?</h2>
<p>Converter vídeo para MP3 significa extrair apenas a trilha de áudio de um arquivo de vídeo e salvá-la no formato MP3. É útil para:</p>
<ul>
  <li>Salvar músicas de clipes do YouTube para ouvir offline</li>
  <li>Extrair o áudio de podcasts, entrevistas e aulas em vídeo</li>
  <li>Criar ringtones a partir de vídeos favoritos</li>
  <li>Ouvir conteúdo sem gastar espaço armazenando o vídeo completo</li>
  <li>Importar músicas para players como Spotify, Apple Music ou VLC</li>
</ul>

<h2>Como converter YouTube para MP3 — passo a passo</h2>
<ol class="step-list">
  <li><strong>Copie o link</strong> do vídeo no YouTube (botão Compartilhar → Copiar link)</li>
  <li><strong>Acesse</strong> a <a href="/app4">ferramenta de conversão</a></li>
  <li><strong>Cole o link</strong> no campo e clique em "Buscar"</li>
  <li><strong>Selecione</strong> <em>"Somente áudio (MP3)"</em> na lista de formatos</li>
  <li><strong>Clique em "Baixar áudio (MP3)"</strong> — o arquivo MP3 é salvo automaticamente</li>
</ol>
<div class="tip"><strong>💡 Qualidade:</strong> Nossa ferramenta converte em <strong>192kbps</strong> — equivalente à qualidade de CD. Perfeito para ouvir em fones de ouvido, caixas de som e no carro.</div>

<h2>Formatos de áudio: MP3 vs outras opções</h2>
<table>
  <thead><tr><th>Formato</th><th>Qualidade</th><th>Tamanho</th><th>Compatibilidade</th></tr></thead>
  <tbody>
    <tr><td><strong>MP3 (192kbps)</strong></td><td>Boa — qualidade CD</td><td>Médio (~4MB/min)</td><td>Universal — todos os devices</td></tr>
    <tr><td><strong>AAC / M4A</strong></td><td>Melhor que MP3</td><td>Menor</td><td>Apple, Android, browsers</td></tr>
    <tr><td><strong>OGG Vorbis</strong></td><td>Boa</td><td>Pequeno</td><td>Android, Linux, alguns players</td></tr>
    <tr><td><strong>WAV / FLAC</strong></td><td>Máxima (sem perda)</td><td>Grande (~10MB/min)</td><td>Universal (players de desktop)</td></tr>
  </tbody>
</table>
<p>Para o uso geral — ouvir no celular, no carro ou em fones — o <strong>MP3 em 192kbps</strong> é mais que suficiente. A diferença em relação a formatos "lossless" é imperceptível na maioria dos equipamentos de áudio comuns.</p>

<h2>Posso converter áudio de qualquer plataforma?</h2>
<p>Sim. A conversão para MP3 funciona com qualquer site suportado pelo downloader: YouTube, Instagram, TikTok, Twitter/X, Vimeo, Facebook, Reddit, Twitch e mais de 1.000 outras plataformas.</p>
<p>A única limitação é que o vídeo precisa ser público. Conteúdo privado, exclusivo para membros ou com restrição de idade não pode ser processado.</p>

<h2>Onde encontrar o arquivo MP3 após o download?</h2>
<p><strong>Windows:</strong> Pasta "Downloads" em C:\Users\SeuNome\Downloads ou na barra lateral do Explorer.</p>
<p><strong>macOS:</strong> Pasta "Downloads" na barra lateral do Finder, ou ~/Downloads no terminal.</p>
<p><strong>Android:</strong> Armazenamento Interno → Downloads. Também aparece no app "Arquivos" ou no seu player de música.</p>
<p><strong>iPhone (iOS):</strong> Após o download, selecione "Salvar nos Arquivos" → iCloud Drive ou "No meu iPhone" para armazenamento local.</p>

<div class="box">
  <h3>Como adicionar o MP3 ao Spotify</h3>
  <p>O Spotify suporta músicas locais em computadores: vá em Configurações → Biblioteca de músicas → ative "Mostrar músicas locais" e aponte para a pasta onde salvou o arquivo MP3. A música aparecerá na seção "Música local".</p>
</div>
<div class="box">
  <h3>Como adicionar ao Apple Music</h3>
  <p>Abra o Apple Music (antes chamado iTunes) e arraste o arquivo MP3 direto para a janela. Ou use Arquivo → Importar. No iPhone, a música sincroniza via iCloud Music Library.</p>
</div>

<h2>Perguntas frequentes</h2>
<div>
  <div class="faq-item">
    <h3>Qual a qualidade do MP3 gerado?</h3>
    <p>A ferramenta converte em <strong>192kbps</strong>, que é considerada qualidade de CD e mais que suficiente para qualquer uso doméstico.</p>
  </div>
  <div class="faq-item">
    <h3>Posso converter MP3 de qualquer site?</h3>
    <p>Sim — YouTube, Instagram, TikTok, Twitter, Vimeo e mais de 1.000 plataformas. Veja a <a href="/como-baixar-videos">lista completa</a>.</p>
  </div>
  <div class="faq-item">
    <h3>O processo é legal?</h3>
    <p>Baixar conteúdo para uso pessoal é geralmente tolerado, mas distribuir ou usar comercialmente conteúdo protegido por direitos autorais sem permissão é ilegal. Sempre respeite os direitos dos criadores.</p>
  </div>
</div>

<div class="hero-cta">
  <a href="/app4" class="btn-primary">${ico('music', 16)} Converter vídeo para MP3 agora</a>
  <a href="/como-baixar-videos" class="btn-outline">📖 Guia de download de vídeos</a>
</div>

<div class="related">
  <h2>Leia também</h2>
  <div class="related-links">
    <a href="/como-baixar-videos" class="related-link"><strong>${ico('download', 14)} Baixar Vídeos</strong>Guia completo por plataforma</a>
    <a href="/converter-json-excel" class="related-link"><strong>${ico('converter', 14)} JSON para Excel</strong>Conversor online gratuito</a>
    <a href="/encurtar-links" class="related-link"><strong>${ico('link', 14)} Encurtar Links</strong>Com analytics e QR code</a>
    <a href="/" class="related-link"><strong>🏠 Página Inicial</strong>Todas as ferramentas</a>
  </div>
</div>`;

  res.send(page({
    title: 'Converter Vídeo para MP3 Online Grátis — YouTube, Instagram 2024',
    description: 'Converta vídeos do YouTube, Instagram e TikTok para MP3 online, grátis, sem instalar. Qualidade 192kbps. Rápido, fácil e sem limite de conversões.',
    canonical: `${SITE_URL}/converter-mp3`,
    ogType: 'article',
    schema,
    body,
  }));
});

// ──────────────────────────────────────────────────────────────────
// ENCURTAR LINKS
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/encurtar-links', (_req, res) => {
  setHtmlHeaders(res);
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Encurtador de Links com Analytics — O que é e como usar',
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: OG_IMAGE } },
      datePublished: '2024-01-01',
      dateModified: new Date().toISOString().split('T')[0],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Encurtador de Links', item: `${SITE_URL}/encurtar-links` },
      ],
    },
  ];
  const body = `
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="/">Início</a><span>›</span><span>Encurtador de Links</span>
</nav>
<span class="tag purple">Plano Pro</span>

<h1>Encurtador de links com analytics: guia completo</h1>
<p class="lead">Descubra como encurtar URLs longas, rastrear cliques em tempo real e gerar QR codes automáticos para suas campanhas digitais, redes sociais e materiais impressos.</p>

<h2>O que é um encurtador de links?</h2>
<p>Um encurtador de links transforma URLs longas e difíceis de lembrar em links curtos e profissionais. Por exemplo, <code>https://meusite.com.br/produtos/categoria/produto-especifico-longo</code> pode virar simplesmente <code>util.link/produto</code>.</p>
<p>Além de facilitar o compartilhamento, um <strong>encurtador profissional</strong> registra cada clique, informa de onde vieram os visitantes e quando clicaram — informações essenciais para marketing digital.</p>

<h2>Para que serve e quem usa</h2>
<div class="cards">
  <div class="card"><div class="icon">${ico('qr', 22)}</div><h3>Redes Sociais</h3><p>Links curtos cabem melhor em posts e bio do Instagram. Mais cliques, visual mais profissional.</p></div>
  <div class="card"><div class="icon">${ico('mail', 22)}</div><h3>E-mail Marketing</h3><p>Rastreie qual link foi clicado em cada campanha para medir resultados reais.</p></div>
  <div class="card"><div class="icon">${ico('file', 22)}</div><h3>Materiais Impressos</h3><p>QR codes em panfletos, banners e embalagens — gerados automaticamente para cada link.</p></div>
  <div class="card"><div class="icon">${ico('chart', 22)}</div><h3>Comparar Canais</h3><p>Crie links diferentes por canal e veja qual Instagram, WhatsApp ou e-mail converte mais.</p></div>
</div>

<h2>Funcionalidades do encurtador no Util Ferramentas</h2>
<ul>
  <li><strong>Analytics em tempo real</strong> — veja cliques dos últimos 30 dias por dia</li>
  <li><strong>QR Code automático</strong> — cada link gera um QR code PNG para download</li>
  <li><strong>Slug personalizado</strong> — escolha o sufixo do seu link: <code>/sua-promo</code></li>
  <li><strong>Data de expiração</strong> — o link para de funcionar automaticamente numa data escolhida</li>
  <li><strong>Limite de cliques</strong> — ideal para promoções com vagas limitadas</li>
  <li><strong>Painel unificado</strong> — todos os seus links em um só lugar</li>
</ul>

<h2>Como criar um link curto</h2>
<ol class="step-list">
  <li>Assine o <a href="/checkout.html">Plano Pro</a> e acesse o painel</li>
  <li>No menu lateral, clique em "Encurtador de Links"</li>
  <li>Cole a URL longa no campo e defina um slug personalizado (opcional)</li>
  <li>Configure data de expiração se necessário</li>
  <li>Clique em "Criar link" — o link curto e o QR code ficam prontos imediatamente</li>
</ol>

<h2>Encurtador de links para negócios: casos de uso reais</h2>
<p><strong>E-commerce:</strong> Crie links diferentes para o mesmo produto em cada anúncio pago, e-mail e post orgânico. Descubra qual canal traz mais compradores.</p>
<p><strong>Eventos:</strong> Link de inscrição com data de expiração automática — quando o evento passa, o link para de funcionar sozinho.</p>
<p><strong>Influenciadores:</strong> Links rastreáveis para parcerias — comprove quantas pessoas você enviou para cada marca.</p>
<p><strong>Cardápios e catálogos:</strong> QR code no cardápio físico apontando para o digital — quando o cardápio muda, basta atualizar o link destino sem reimprimir nada.</p>

<h2>Diferença entre encurtadores gratuitos e profissionais</h2>
<table>
  <thead><tr><th>Recurso</th><th>Grátis (bit.ly, tinyurl)</th><th>Util Ferramentas Pro</th></tr></thead>
  <tbody>
    <tr><td>Links curtos</td><td>✓ Sim</td><td>✓ Ilimitados</td></tr>
    <tr><td>Analytics</td><td>Limitado (7 dias)</td><td>✓ 30 dias histórico</td></tr>
    <tr><td>QR Code</td><td>Pago ou ausente</td><td>✓ Incluído</td></tr>
    <tr><td>Slug personalizado</td><td>Pago</td><td>✓ Incluído</td></tr>
    <tr><td>Data de expiração</td><td>Raro</td><td>✓ Incluído</td></tr>
    <tr><td>Seus dados</td><td>Vendidos para anunciantes</td><td>✓ Privados</td></tr>
  </tbody>
</table>

<div class="hero-cta">
  <a href="/checkout.html" class="btn-primary">${ico('crown', 16)} Assinar Plano Pro — R$29,90/mês</a>
  <a href="/" class="btn-outline">Ver outras ferramentas</a>
</div>

<div class="related">
  <h2>Leia também</h2>
  <div class="related-links">
    <a href="/como-baixar-videos" class="related-link"><strong>${ico('download', 14)} Baixar Vídeos</strong>Guia completo</a>
    <a href="/converter-mp3" class="related-link"><strong>${ico('music', 14)} Converter MP3</strong>Extrair áudio de vídeos</a>
    <a href="/converter-json-excel" class="related-link"><strong>${ico('converter', 14)} JSON para Excel</strong>Conversor gratuito</a>
    <a href="/sobre" class="related-link"><strong>${ico('info', 14)} Sobre</strong>Conheça o Util Ferramentas</a>
  </div>
</div>`;

  res.send(page({
    title: 'Encurtador de Links com Analytics e QR Code — Util Ferramentas',
    description: 'Encurte links, rastreie cliques em tempo real e gere QR codes automáticos. Slug personalizado, data de expiração e painel de analytics completo.',
    canonical: `${SITE_URL}/encurtar-links`,
    ogType: 'article',
    schema,
    body,
  }));
});

// ──────────────────────────────────────────────────────────────────
// CONVERTER JSON EXCEL
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/converter-json-excel', (_req, res) => {
  setHtmlHeaders(res);
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Conversor JSON para Excel Online Gratuito — Como Usar',
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: OG_IMAGE } },
      datePublished: '2024-01-01',
      dateModified: new Date().toISOString().split('T')[0],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Conversor JSON↔Excel', item: `${SITE_URL}/converter-json-excel` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Conversor JSON para Excel Online',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
      description: 'Converta JSON para Excel (.xlsx) e Excel/CSV para JSON online, grátis, com formatação automática.',
      url: `${SITE_URL}/app5`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Como converter JSON para Excel online?', acceptedAnswer: { '@type': 'Answer', text: 'Acesse o conversor, cole seu JSON ou faça upload do arquivo, configure as opções de formatação e clique em Converter.' } },
        { '@type': 'Question', name: 'Qual o tamanho máximo de arquivo aceito?', acceptedAnswer: { '@type': 'Answer', text: 'O conversor aceita arquivos de até 20 MB e JSONs com centenas de milhares de linhas.' } },
        { '@type': 'Question', name: 'O Excel gerado preserva os tipos de dados?', acceptedAnswer: { '@type': 'Answer', text: 'Sim. Números, datas, booleanos e strings são identificados e formatados corretamente na planilha.' } },
      ],
    },
  ];
  const body = `
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="/">Início</a><span>›</span><span>Conversor JSON↔Excel</span>
</nav>
<span class="tag">Gratuito</span><span class="tag">Desenvolvedor</span>

<h1>Conversor JSON para Excel online — rápido e gratuito</h1>
<p class="lead">Transforme arquivos JSON em planilhas Excel (.xlsx) formatadas profissionalmente, ou converta Excel e CSV para JSON estruturado, sem instalar nenhum software.</p>

<div class="stats">
  <div class="stat"><strong>20MB</strong><span>tamanho máximo</span></div>
  <div class="stat"><strong>3</strong><span>formatos: JSON, XLSX, CSV</span></div>
  <div class="stat"><strong>0</strong><span>instalações</span></div>
</div>

<h2>O que é o conversor JSON↔Excel?</h2>
<p>O conversor JSON↔Excel transforma dados estruturados em formato JSON em planilhas Excel prontas para uso, e também faz o processo inverso: converte planilhas Excel (.xlsx) ou arquivos CSV em JSON estruturado com detecção automática de tipos.</p>
<p>É amplamente usado por <strong>desenvolvedores</strong>, <strong>analistas de dados</strong>, <strong>cientistas de dados</strong> e profissionais de TI que precisam trocar dados entre sistemas, preparar relatórios ou importar dados para bancos de dados.</p>

<h2>Quando usar JSON → Excel?</h2>
<ul>
  <li>Exportar dados de uma API REST para uma planilha para análise</li>
  <li>Gerar relatórios para stakeholders que preferem Excel</li>
  <li>Preparar dados para importar em ferramentas de BI (Power BI, Tableau)</li>
  <li>Converter respostas de APIs em tabelas legíveis</li>
  <li>Documentar estruturas de dados de sistemas</li>
</ul>

<h2>Quando usar Excel/CSV → JSON?</h2>
<ul>
  <li>Importar dados de planilhas legadas para um banco de dados</li>
  <li>Converter planilhas para enviar via API</li>
  <li>Processar dados de planilhas em código (JavaScript, Python, etc.)</li>
  <li>Migrar dados entre sistemas com diferentes formatos</li>
  <li>Gerar seeds de banco de dados a partir de planilhas</li>
</ul>

<h2>Como usar o conversor JSON para Excel</h2>
<ol class="step-list">
  <li><strong>Acesse</strong> o <a href="/app5">Conversor JSON↔Excel</a></li>
  <li><strong>Selecione o modo</strong> "JSON → Excel" no painel lateral</li>
  <li><strong>Cole seu JSON</strong> no editor ou use os dados de exemplo para testar</li>
  <li><strong>Configure</strong> o nome da aba, cor do cabeçalho e outras opções</li>
  <li><strong>Clique em "Preview"</strong> para ver como ficará a tabela antes de exportar</li>
  <li><strong>Clique em "Converter"</strong> para baixar o arquivo .xlsx formatado</li>
</ol>
<div class="tip"><strong>Formato esperado:</strong> O JSON deve ser um array de objetos: <code>[{"nome":"Alice","idade":30},{"nome":"Bruno","idade":25}]</code>. Cada chave do objeto vira uma coluna.</div>

<h2>Formatação automática do Excel gerado</h2>
<p>O conversor aplica automaticamente formatações profissionais:</p>
<ul>
  <li><strong>Cabeçalho colorido</strong> — você escolhe a cor; o texto fica branco automaticamente</li>
  <li><strong>Largura automática</strong> — cada coluna ajusta ao conteúdo mais longo</li>
  <li><strong>Linha congelada</strong> — cabeçalho visível ao rolar a planilha</li>
  <li><strong>Linhas alternadas</strong> — fundo levemente diferente nas linhas pares, facilitando a leitura</li>
  <li><strong>Múltiplas abas</strong> — envie um objeto com vários arrays e cada um vira uma aba separada</li>
</ul>

<h2>Detecção automática de tipos (Excel → JSON)</h2>
<p>Ao converter Excel ou CSV para JSON, o sistema detecta automaticamente o tipo de dado de cada célula:</p>
<table>
  <thead><tr><th>Valor na planilha</th><th>Tipo no JSON</th><th>Exemplo</th></tr></thead>
  <tbody>
    <tr><td>Números inteiros ou decimais</td><td><code>number</code></td><td><code>42</code>, <code>3.14</code></td></tr>
    <tr><td>Texto</td><td><code>string</code></td><td><code>"Alice"</code>, <code>"São Paulo"</code></td></tr>
    <tr><td>Verdadeiro / Falso</td><td><code>boolean</code></td><td><code>true</code>, <code>false</code></td></tr>
    <tr><td>Datas (DD/MM/AAAA ou ISO)</td><td><code>string</code> (ISO 8601)</td><td><code>"2024-01-15"</code></td></tr>
    <tr><td>Célula vazia</td><td><code>null</code></td><td><code>null</code></td></tr>
  </tbody>
</table>

<h2>Limites e performance</h2>
<p>O conversor aceita arquivos de até <strong>20 MB</strong> e processa arquivos com centenas de milhares de linhas. Para datasets muito grandes (acima de 100.000 linhas), recomendamos dividir em partes para manter a performance do servidor.</p>

<h2>Perguntas frequentes</h2>
<div>
  <div class="faq-item">
    <h3>Preciso de cadastro para usar o conversor?</h3>
    <p>Não. O conversor JSON↔Excel é completamente gratuito e não requer cadastro.</p>
  </div>
  <div class="faq-item">
    <h3>Meus dados ficam armazenados no servidor?</h3>
    <p>Não. Os arquivos são processados em memória e descartados imediatamente após o download. Não armazenamos seus dados.</p>
  </div>
  <div class="faq-item">
    <h3>O conversor suporta caracteres especiais e acentuação?</h3>
    <p>Sim. O conversor usa UTF-8 internamente e preserva todos os caracteres especiais, incluindo acentos do português e outros alfabetos.</p>
  </div>
</div>

<div class="hero-cta">
  <a href="/app5" class="btn-primary">${ico('converter', 16)} Abrir Conversor JSON↔Excel</a>
  <a href="/como-baixar-videos" class="btn-outline">${ico('download', 16)} Baixar vídeos</a>
</div>

<div class="related">
  <h2>Leia também</h2>
  <div class="related-links">
    <a href="/como-baixar-videos" class="related-link"><strong>${ico('download', 14)} Baixar Vídeos</strong>YouTube, Instagram, TikTok</a>
    <a href="/converter-mp3" class="related-link"><strong>${ico('music', 14)} Converter MP3</strong>Extrair áudio online</a>
    <a href="/encurtar-links" class="related-link"><strong>${ico('link', 14)} Encurtar Links</strong>Com analytics</a>
    <a href="/" class="related-link"><strong>🏠 Início</strong>Todas as ferramentas</a>
  </div>
</div>`;

  res.send(page({
    title: 'Conversor JSON para Excel Online Grátis — Util Ferramentas',
    description: 'Converta JSON para Excel (.xlsx) com formatação automática. Converta Excel e CSV para JSON com detecção de tipos. Online, gratuito, sem cadastro, até 20MB.',
    canonical: `${SITE_URL}/converter-json-excel`,
    ogType: 'article',
    schema,
    body,
  }));
});

// ──────────────────────────────────────────────────────────────────
// SOBRE
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/sobre', (_req, res) => {
  setHtmlHeaders(res, 86400);
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: `Sobre — ${SITE_NAME}`,
      url: `${SITE_URL}/sobre`,
      description: `Conheça o ${SITE_NAME}: ferramentas online gratuitas para download de vídeos, conversão MP3, JSON para Excel e encurtador de links.`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Sobre', item: `${SITE_URL}/sobre` },
      ],
    },
  ];
  const body = `
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="/">Início</a><span>›</span><span>Sobre</span>
</nav>
<h1>Sobre o Util Ferramentas</h1>
<p class="lead">O Util Ferramentas nasceu da necessidade de ter em um único lugar as ferramentas digitais mais usadas no dia a dia — sem propagandas excessivas, sem redirecionamentos desnecessários e sem complicações.</p>

<h2>Nossa missão</h2>
<p>Oferecer ferramentas online gratuitas, rápidas e confiáveis para qualquer pessoa. Seja um estudante que precisa salvar uma aula em vídeo, um desenvolvedor convertendo dados entre formatos, ou um profissional de marketing rastreando cliques de links — o Util Ferramentas tem a ferramenta certa, pronta para usar agora.</p>

<h2>As ferramentas disponíveis</h2>
<div class="cards">
  <div class="card"><div class="icon">${ico('download', 22)}</div><h3><a href="/como-baixar-videos">Download de Vídeos</a></h3><p>YouTube, Instagram, TikTok e 1000+ sites. Grátis.</p></div>
  <div class="card"><div class="icon">${ico('music', 22)}</div><h3><a href="/converter-mp3">Extração de Áudio MP3</a></h3><p>Converta qualquer vídeo para MP3 em 192kbps. Grátis.</p></div>
  <div class="card"><div class="icon">${ico('converter', 22)}</div><h3><a href="/converter-json-excel">Conversor JSON↔Excel</a></h3><p>JSON para Excel e Excel para JSON. Grátis.</p></div>
  <div class="card"><div class="icon">${ico('link', 22)}</div><h3><a href="/encurtar-links">Encurtador de Links</a></h3><p>Links rastreáveis com analytics e QR Code. Pro.</p></div>
  <div class="card"><div class="icon">${ico('database', 22)}</div><h3>Gerenciador de Dados</h3><p>Estruturas dinâmicas sem código. Pro.</p></div>
</div>

<h2>Planos</h2>
<p><strong>Gratuito:</strong> Download de vídeos (App4) e conversor JSON↔Excel (App5) são completamente gratuitos, sem limite de uso e sem cadastro obrigatório.</p>
<p><strong><a href="/checkout.html">Plano Pro</a> — R$29,90/mês:</strong> Adiciona o encurtador de links com analytics, QR code e data de expiração, além do gerenciador de dados dinâmicos para organizar qualquer tipo de informação.</p>

<h2>Privacidade e segurança</h2>
<p>Não vendemos dados. Não armazenamos arquivos processados. Não compartilhamos informações com anunciantes. Leia nossa <a href="/privacidade">Política de Privacidade</a> para mais detalhes.</p>

<h2>Contato e suporte</h2>
<p>Para dúvidas, sugestões ou relatar problemas, entre em contato pela <a href="/checkout.html">página de planos</a>. Respondemos em até 24 horas úteis.</p>`;

  res.send(page({
    title: `Sobre o ${SITE_NAME} — Ferramentas Online Gratuitas`,
    description: `Conheça o ${SITE_NAME}: ferramentas online gratuitas para download de vídeos, conversão MP3, conversor JSON para Excel e encurtador de links com analytics.`,
    canonical: `${SITE_URL}/sobre`,
    schema,
    body,
  }));
});

// ──────────────────────────────────────────────────────────────────
// PRIVACIDADE
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/privacidade', (_req, res) => {
  setHtmlHeaders(res, 86400);
  const updatedDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Política de Privacidade', item: `${SITE_URL}/privacidade` },
    ],
  };
  const body = `
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="/">Início</a><span>›</span><span>Política de Privacidade</span>
</nav>
<h1>Política de Privacidade</h1>
<p><em>Última atualização: ${updatedDate}</em></p>

<h2>1. Informações coletadas</h2>
<p>O ${SITE_NAME} coleta apenas as informações estritamente necessárias:</p>
<ul>
  <li><strong>Dados de conta</strong> — nome e e-mail fornecidos no cadastro (apenas usuários do Plano Pro)</li>
  <li><strong>Dados de uso</strong> — URLs processadas (não armazenadas permanentemente)</li>
  <li><strong>Dados técnicos</strong> — endereço IP para controle de abuso, logs de acesso do servidor</li>
  <li><strong>Cookies</strong> — apenas cookies necessários para autenticação</li>
</ul>

<h2>2. Uso das informações</h2>
<p>As informações são usadas exclusivamente para:</p>
<ul>
  <li>Fornecer os serviços solicitados (download de vídeos, conversão de dados, links)</li>
  <li>Autenticar usuários do Plano Pro</li>
  <li>Prevenir abusos e garantir a segurança do serviço</li>
</ul>

<h2>3. Compartilhamento</h2>
<p>Não vendemos, alugamos nem compartilhamos dados pessoais com terceiros para fins comerciais. Dados podem ser compartilhados apenas quando exigido por lei ou determinação judicial.</p>

<h2>4. Armazenamento</h2>
<p>Arquivos processados (vídeos, planilhas) são tratados temporariamente e removidos automaticamente após a entrega ao usuário. Senhas são armazenadas com hash bcrypt. Conexões são protegidas por SSL/TLS.</p>

<h2>5. Google AdSense e publicidade</h2>
<p>Utilizamos o Google AdSense para exibir anúncios nas páginas públicas. O Google pode usar cookies para exibir anúncios personalizados. Você pode optar por não receber anúncios personalizados em <a href="https://adssettings.google.com" rel="noopener noreferrer nofollow" target="_blank">adssettings.google.com</a>.</p>

<h2>6. Seus direitos (LGPD)</h2>
<p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
<ul>
  <li>Acessar e confirmar a existência de tratamento dos seus dados</li>
  <li>Corrigir dados incompletos ou incorretos</li>
  <li>Solicitar a exclusão de dados desnecessários</li>
  <li>Revogar o consentimento a qualquer momento</li>
</ul>
<p>Para exercer esses direitos, entre em contato pela <a href="/checkout.html">página de contato</a>.</p>

<h2>7. Alterações nesta política</h2>
<p>Esta política pode ser atualizada periodicamente. Usuários cadastrados serão notificados sobre alterações significativas por e-mail.</p>`;

  res.send(page({
    title: `Política de Privacidade — ${SITE_NAME}`,
    description: `Política de privacidade do ${SITE_NAME}. Como coletamos, usamos e protegemos suas informações. Conformidade com a LGPD.`,
    canonical: `${SITE_URL}/privacidade`,
    schema,
    body,
  }));
});

// ──────────────────────────────────────────────────────────────────
// TERMOS
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/termos', (_req, res) => {
  setHtmlHeaders(res, 86400);
  const updatedDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Termos de Uso', item: `${SITE_URL}/termos` },
    ],
  };
  const body = `
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="/">Início</a><span>›</span><span>Termos de Uso</span>
</nav>
<h1>Termos de Uso</h1>
<p><em>Última atualização: ${updatedDate}</em></p>

<h2>1. Aceitação</h2>
<p>Ao usar o ${SITE_NAME}, você concorda com estes Termos de Uso. Se não concordar, não utilize os serviços.</p>

<h2>2. Uso permitido</h2>
<ul>
  <li>Baixar conteúdo que você tem direito de acessar ou que é de domínio público</li>
  <li>Converter dados entre formatos para uso pessoal ou profissional legítimo</li>
  <li>Encurtar links para seus próprios conteúdos</li>
</ul>

<h2>3. Uso proibido</h2>
<ul>
  <li>Baixar ou distribuir conteúdo protegido por direitos autorais sem permissão</li>
  <li>Usar as ferramentas de forma automatizada (bots) sem autorização prévia</li>
  <li>Tentar sobrecarregar, hackear ou comprometer a segurança do sistema</li>
  <li>Criar, armazenar ou compartilhar conteúdo ilegal</li>
</ul>

<h2>4. Direitos autorais</h2>
<p>O ${SITE_NAME} respeita os direitos autorais e espera que os usuários façam o mesmo. O uso das ferramentas de download é de responsabilidade exclusiva do usuário, que deve garantir que possui os direitos necessários.</p>

<h2>5. Limitação de responsabilidade</h2>
<p>O serviço é fornecido "como está". Não nos responsabilizamos por indisponibilidade temporária, mudanças em APIs de terceiros que afetem o funcionamento, ou uso indevido por parte dos usuários.</p>

<h2>6. Plano Pro e cancelamentos</h2>
<p>O Plano Pro é cobrado mensalmente. Cancelamentos podem ser feitos a qualquer momento; o acesso continua até o fim do período pago. Reembolsos são aceitos em até 7 dias após a primeira cobrança se o serviço não funcionar conforme descrito.</p>

<h2>7. Alterações</h2>
<p>Reservamos o direito de modificar estes termos com aviso prévio de 30 dias para usuários do plano pago.</p>

<h2>8. Contato</h2>
<p>Dúvidas sobre estes termos: <a href="/checkout.html">página de contato</a>.</p>`;

  res.send(page({
    title: `Termos de Uso — ${SITE_NAME}`,
    description: `Termos de uso do ${SITE_NAME}. Regras de uso das ferramentas de download de vídeos, conversão MP3, JSON para Excel e encurtador de links.`,
    canonical: `${SITE_URL}/termos`,
    schema,
    body,
  }));
});

// ──────────────────────────────────────────────────────────────────
// LINK NA BIO — App6
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/link-na-bio', (_req, res) => {
  setHtmlHeaders(res);
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Link na Bio: o que é e como criar sua página gratuita',
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: OG_IMAGE } },
      datePublished: '2024-01-01',
      dateModified: new Date().toISOString().split('T')[0],
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/link-na-bio` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Link na Bio', item: `${SITE_URL}/link-na-bio` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Util Ferramentas — Bio Link',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
      description: 'Crie sua página "link na bio" gratuita com múltiplos links, analytics e temas personalizados.',
      url: `${SITE_URL}/app6`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'O que é "link na bio"?', acceptedAnswer: { '@type': 'Answer', text: 'Link na bio é uma página com vários links compartilhada pelo Instagram. Como o Instagram permite apenas um link no perfil, essa página centraliza todos os seus links em um único endereço.' } },
        { '@type': 'Question', name: 'Como criar link na bio grátis?', acceptedAnswer: { '@type': 'Answer', text: 'Acesse o App6 do Util Ferramentas, escolha um nome de usuário e adicione seus links. Sua página ficará disponível em util-ferramentas.onrender.com/bio/seunome.' } },
        { '@type': 'Question', name: 'Qual a diferença entre Linktree e o Util Ferramentas?', acceptedAnswer: { '@type': 'Answer', text: 'O Util Ferramentas é gratuito, sem limite de links, com analytics de visitas e cliques, temas personalizáveis e não exige assinatura para recursos básicos.' } },
      ],
    },
  ];

  const body = `
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="/">Início</a><span>›</span><span>Link na Bio</span>
</nav>
<span class="tag">Gratuito</span><span class="tag">Instagram</span><span class="tag">TikTok</span>

<h1>Link na bio: o que é e como criar sua página gratuita</h1>
<p class="lead">Aprenda a criar sua página de "link na bio" em menos de 2 minutos — reúna todos os seus links importantes em uma única URL para compartilhar no Instagram, TikTok e WhatsApp.</p>

<div class="stats">
  <div class="stat"><strong>1</strong><span>URL para tudo</span></div>
  <div class="stat"><strong>∞</strong><span>links ilimitados</span></div>
  <div class="stat"><strong>5</strong><span>temas visuais</span></div>
  <div class="stat"><strong>0</strong><span>custo</span></div>
</div>

<h2>O que é "link na bio"?</h2>
<p>O Instagram permite apenas <strong>um único link</strong> na bio do perfil. Para quem precisa compartilhar múltiplos links — loja online, YouTube, WhatsApp, portfólio, blog — isso é uma limitação enorme.</p>
<p>A solução foi criar as chamadas "páginas de link na bio": uma página web simples com vários botões, cada um levando para um destino diferente. Você coloca o link dessa página na bio do Instagram e pronto — todos os seus links em um só lugar.</p>

<h2>Para que serve e quem usa</h2>
<div class="cards">
  <div class="card"><div class="icon">${ico('bag', 22)}</div><h3>Lojistas</h3><p>Link para a loja, WhatsApp de vendas, catálogo e Instagram do negócio em uma só página.</p></div>
  <div class="card"><div class="icon">${ico('mic', 22)}</div><h3>Criadores de Conteúdo</h3><p>YouTube, TikTok, Spotify, site de parcerias e contato — tudo centralizado.</p></div>
  <div class="card"><div class="icon">${ico('briefcase', 22)}</div><h3>Profissionais</h3><p>LinkedIn, portfólio, currículo online e e-mail de contato em uma URL só.</p></div>
  <div class="card"><div class="icon">${ico('music', 22)}</div><h3>Músicos e Artistas</h3><p>Streaming, loja de merch, agenda de shows e redes sociais em um link.</p></div>
</div>

<h2>Como criar sua página de link na bio no Util Ferramentas</h2>
<ol class="step-list">
  <li><strong>Acesse o App6</strong> — abra o <a href="/app6">Util Ferramentas Bio Link</a></li>
  <li><strong>Escolha um nome de usuário</strong> — sua página ficará em <code>/bio/seunome</code></li>
  <li><strong>Adicione seus links</strong> — título, URL e ícone para cada link</li>
  <li><strong>Personalize o visual</strong> — escolha o tema (escuro, claro, gradiente) e a cor de destaque</li>
  <li><strong>Copie o link</strong> — <code>util-ferramentas.onrender.com/bio/seunome</code></li>
  <li><strong>Cole na bio do Instagram</strong> — pronto! Todos os seus links em um só lugar</li>
</ol>
<div class="tip"><strong>💡 Dica:</strong> Escolha um nome de usuário simples e igual ao seu @ no Instagram para facilitar a memorização. Ex: se seu Instagram é @joaopaulo, use /bio/joaopaulo</div>

<h2>Funcionalidades da página Bio Link</h2>
<ul>
  <li><strong>Links ilimitados</strong> — adicione quantos links quiser</li>
  <li><strong>Ícones automáticos</strong> — Instagram, TikTok, YouTube, WhatsApp, Spotify e outros reconhecidos automaticamente</li>
  <li><strong>Analytics de visitas</strong> — veja quantas pessoas acessaram sua página por dia</li>
  <li><strong>Analytics de cliques</strong> — saiba quais links são mais clicados</li>
  <li><strong>Temas visuais</strong> — escuro, claro, gradiente e mais</li>
  <li><strong>Cor de destaque</strong> — personalize com a cor da sua marca</li>
  <li><strong>URL limpa</strong> — <code>/bio/seunome</code> é fácil de digitar e lembrar</li>
</ul>

<h2>Link na bio: comparação entre ferramentas</h2>
<table>
  <thead><tr><th>Recurso</th><th>Linktree Grátis</th><th>Later Free</th><th>Util Ferramentas</th></tr></thead>
  <tbody>
    <tr><td>Número de links</td><td>5 links</td><td>Ilimitado</td><td><strong>Ilimitado</strong></td></tr>
    <tr><td>Analytics</td><td>Limitado</td><td>Básico</td><td><strong>Visitas + cliques</strong></td></tr>
    <tr><td>Temas visuais</td><td>2 grátis</td><td>Básico</td><td><strong>5 temas + cor custom</strong></td></tr>
    <tr><td>Remover marca do rodapé</td><td>Pago</td><td>Pago</td><td><strong>Grátis</strong></td></tr>
    <tr><td>Domínio próprio</td><td>Pago</td><td>Não</td><td>Não (URL compartilhada)</td></tr>
    <tr><td>Custo</td><td>Grátis / $9/mês Pro</td><td>Grátis / $18/mês</td><td><strong>100% Grátis</strong></td></tr>
  </tbody>
</table>

<h2>Como colocar link na bio do Instagram</h2>
<ol class="step-list">
  <li>Crie sua página em <a href="/app6">Util Ferramentas Bio Link</a> e copie a URL</li>
  <li>Abra o Instagram e vá no seu perfil</li>
  <li>Toque em <strong>"Editar perfil"</strong></li>
  <li>No campo <strong>"Site"</strong>, cole a URL da sua página bio (<code>util-ferramentas.onrender.com/bio/seunome</code>)</li>
  <li>Toque em <strong>"Concluído"</strong></li>
</ol>
<p>No TikTok, o processo é similar: vá em Editar perfil → campo "Website".</p>

<h2>Perguntas frequentes</h2>
<div>
  <div class="faq-item">
    <h3>Preciso pagar para criar minha página bio?</h3>
    <p>Não. O App6 é completamente gratuito, sem limite de links e sem remover sua autoria da página.</p>
  </div>
  <div class="faq-item">
    <h3>Posso ter mais de uma página bio?</h3>
    <p>Sim. Com uma conta no Util Ferramentas você pode criar múltiplas páginas bio, cada uma com um nome de usuário diferente.</p>
  </div>
  <div class="faq-item">
    <h3>Minha página funciona no celular?</h3>
    <p>Sim. As páginas são responsivas e otimizadas para visualização em smartphones — afinal, é onde a maioria das pessoas vai acessar.</p>
  </div>
  <div class="faq-item">
    <h3>Posso usar no WhatsApp e no TikTok?</h3>
    <p>Sim. O link funciona em qualquer plataforma: Instagram, TikTok, Twitter/X, YouTube, WhatsApp, Telegram, e-mail e qualquer outro lugar.</p>
  </div>
</div>

<div class="hero-cta">
  <a href="/app6" class="btn-primary">${ico('link2', 16)} Criar minha página bio — grátis</a>
  <a href="/encurtar-links" class="btn-outline">${ico('link', 16)} Encurtador de links</a>
</div>

<div class="related">
  <h2>Leia também</h2>
  <div class="related-links">
    <a href="/encurtar-links" class="related-link"><strong>${ico('link', 14)} Encurtar Links</strong>Links rastreáveis com analytics</a>
    <a href="/como-baixar-videos" class="related-link"><strong>${ico('download', 14)} Baixar Vídeos</strong>YouTube, Instagram, TikTok</a>
    <a href="/converter-mp3" class="related-link"><strong>${ico('music', 14)} Converter MP3</strong>Extrair áudio online</a>
    <a href="/" class="related-link"><strong>🏠 Início</strong>Todas as ferramentas</a>
  </div>
</div>`;

  res.send(page({
    title: 'Link na Bio Grátis — Crie sua Página com Múltiplos Links | Util Ferramentas',
    description: 'Crie sua página de link na bio gratuitamente. Reúna todos os seus links do Instagram, TikTok e YouTube em uma única URL. Analytics, temas personalizados, sem limite de links.',
    canonical: `${SITE_URL}/link-na-bio`,
    ogType: 'article',
    schema,
    body,
  }));
});

// ──────────────────────────────────────────────────────────────────
// RASTREADOR DE HÁBITOS — App7
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/rastreador-de-habitos', (_req, res) => {
  setHtmlHeaders(res);
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Rastreador de Hábitos Online Gratuito — Construa Consistência',
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: OG_IMAGE } },
      datePublished: '2024-01-01',
      dateModified: new Date().toISOString().split('T')[0],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Rastreador de Hábitos', item: `${SITE_URL}/rastreador-de-habitos` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Rastreador de Hábitos Online',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
      description: 'Crie e acompanhe seus hábitos diários com streaks, histórico visual e progresso semanal.',
      url: `${SITE_URL}/app7`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'O que é um rastreador de hábitos?', acceptedAnswer: { '@type': 'Answer', text: 'Um rastreador de hábitos é uma ferramenta que ajuda a monitorar atividades diárias, como beber água, exercitar ou ler, mostrando sua consistência ao longo do tempo.' } },
        { '@type': 'Question', name: 'Como funcionam os streaks de hábitos?', acceptedAnswer: { '@type': 'Answer', text: 'Streak é o número de dias consecutivos em que você completou o hábito. Manter o streak cria motivação para não quebrar a sequência.' } },
        { '@type': 'Question', name: 'Por que acompanhar hábitos ajuda?', acceptedAnswer: { '@type': 'Answer', text: 'Estudos mostram que registrar hábitos aumenta a consistência em até 3x. A visualização do progresso cria responsabilidade e motivação contínua.' } },
      ],
    },
  ];

  const body = `
<nav aria-label="Breadcrumb" class="breadcrumb">
  <a href="/">Início</a><span>›</span><span>Rastreador de Hábitos</span>
</nav>
<span class="tag">Gratuito</span><span class="tag">Produtividade</span>

<h1>Rastreador de hábitos online — construa consistência com streaks</h1>
<p class="lead">Crie seus hábitos diários, marque o que fez hoje e acompanhe sua sequência de dias. A ferramenta mais simples para transformar pequenas ações em resultados duradouros.</p>

<div class="stats">
  <div class="stat"><strong>${ico('flame', 24)}</strong><span>streaks diários</span></div>
  <div class="stat"><strong>21</strong><span>dias de histórico</span></div>
  <div class="stat"><strong>0</strong><span>custo</span></div>
</div>

<h2>O que é acompanhamento de hábitos?</h2>
<p>Um rastreador de hábitos é uma ferramenta simples para registrar quais atividades você completou no dia. Parece básico, mas a ciência comportamental mostra que <strong>apenas o ato de marcar um hábito como feito aumenta significativamente a probabilidade de repetir no dia seguinte</strong>.</p>
<p>O conceito foi popularizado pelo escritor James Clear no livro "Hábitos Atômicos": pequenas ações repetidas consistentemente geram mudanças extraordinárias. O truque é não quebrar a sequência — o famoso "não quebre o corrente".</p>

<h2>Como usar o Rastreador de Hábitos</h2>
<ol class="step-list">
  <li><strong>Crie seus hábitos</strong> — escolha um ícone, nome e cor para cada hábito. Exemplos: 💧 Beber água, 🏃 Exercitar, 📚 Ler 10 páginas.</li>
  <li><strong>Marque o que fez</strong> — todo dia, clique no botão de cada hábito que você completou. O card acende com a cor escolhida.</li>
  <li><strong>Veja seu streak</strong> — o 🔥 aparece ao lado de cada hábito mostrando quantos dias seguidos você manteve. 14 dias vira 🔥🔥, 30 dias 🔥🔥🔥.</li>
  <li><strong>Acompanhe o progresso</strong> — a tela "Progresso" mostra gráfico semanal, melhor streak e histórico de 21 dias de cada hábito.</li>
</ol>

<h2>Por que os streaks funcionam</h2>
<p>O mecanismo por trás dos streaks é a aversão à perda — psicologicamente, <strong>dói mais perder algo que já temos do que ganhar algo novo</strong>. Quando você tem um streak de 15 dias, o custo percebido de "quebrar" a sequência é muito maior do que o esforço de manter.</p>
<p>Além disso, o histórico visual de 21 dias cria um "tapete" de quadradinhos coloridos que representa seu esforço acumulado. Ver lacunas nesse tapete é desconfortável — e esse desconforto é produtivo.</p>

<h2>Quais hábitos vale a pena rastrear?</h2>
<div class="cards">
  <div class="card"><div class="icon">${ico('drop', 22)}</div><h3>Hidratação</h3><p>Beber 2 litros de água por dia. Um dos hábitos com maior impacto na energia e concentração.</p></div>
  <div class="card"><div class="icon">${ico('run', 22)}</div><h3>Movimento</h3><p>30 minutos de exercício. Não precisa ser academia — caminhada conta.</p></div>
  <div class="card"><div class="icon">${ico('book', 22)}</div><h3>Leitura</h3><p>10 páginas por dia. 10 páginas × 365 dias = ~12 livros por ano.</p></div>
  <div class="card"><div class="icon">${ico('moon', 22)}</div><h3>Meditação</h3><p>5 minutos de respiração consciente. Reduz ansiedade e melhora o foco.</p></div>
  <div class="card"><div class="icon">${ico('moon', 22)}</div><h3>Sono</h3><p>Dormir antes da meia-noite. A consistência do horário importa mais que a quantidade.</p></div>
  <div class="card"><div class="icon">${ico('write', 22)}</div><h3>Escrita</h3><p>Um parágrafo por dia. Diário, ideias, reflexões — qualquer coisa.</p></div>
</div>

<h2>A regra dos dois dias</h2>
<p>Um dos princípios mais úteis para manutenção de hábitos: <strong>nunca falte dois dias seguidos</strong>. Falhar uma vez é humano; falhar duas vezes seguidas é o início de um novo hábito ruim.</p>
<p>O Rastreador de Hábitos do Util Ferramentas foi desenhado pensando nisso: se você errar um dia, o histórico visual mostra claramente uma lacuna, criando urgência para voltar no dia seguinte.</p>

<h2>Perguntas frequentes</h2>
<div>
  <div class="faq-item">
    <h3>Quantos hábitos devo rastrear ao mesmo tempo?</h3>
    <p>Para quem está começando, <strong>2 a 3 hábitos</strong> é o ideal. Muitos hábitos simultâneos dividem a atenção e tornam o sistema difícil de manter. Comece pequeno e adicione novos à medida que os atuais se tornam automáticos.</p>
  </div>
  <div class="faq-item">
    <h3>O que fazer quando perder um dia?</h3>
    <p>Não se puna — apenas marque o próximo dia. A pesquisa de Phillippa Lally mostrou que falhar ocasionalmente não interrompe a formação do hábito. O que importa é a consistência a longo prazo, não a perfeição.</p>
  </div>
  <div class="faq-item">
    <h3>Quanto tempo leva para formar um hábito?</h3>
    <p>O famoso "21 dias" é um mito. Pesquisas reais indicam entre 18 e 254 dias dependendo do hábito e da pessoa, com média de 66 dias. Por isso o rastreador mostra 21 dias de histórico — para você ver o padrão crescendo.</p>
  </div>
  <div class="faq-item">
    <h3>Preciso de cadastro para usar?</h3>
    <p>Sim — o rastreador salva seus dados na nuvem, então requer uma conta no Util Ferramentas (disponível no plano gratuito). Isso garante que seu histórico não se perde se você trocar de dispositivo.</p>
  </div>
</div>

<div class="hero-cta">
  <a href="/app7" class="btn-primary">${ico('flame', 16)} Começar a rastrear hábitos</a>
  <a href="/checkout.html" class="btn-outline">Ver planos</a>
</div>

<div class="related">
  <h2>Leia também</h2>
  <div class="related-links">
    <a href="/link-na-bio" class="related-link"><strong>${ico('link2', 14)} Link na Bio</strong>Página com seus links</a>
    <a href="/converter-json-excel" class="related-link"><strong>${ico('converter', 14)} JSON para Excel</strong>Conversor gratuito</a>
    <a href="/como-baixar-videos" class="related-link"><strong>${ico('download', 14)} Baixar Vídeos</strong>YouTube, Instagram</a>
    <a href="/" class="related-link"><strong>🏠 Início</strong>Todas as ferramentas</a>
  </div>
</div>`;

  res.send(page({
    title: 'Rastreador de Hábitos Online Grátis — Streaks e Progresso Diário',
    description: 'Crie hábitos diários, marque o que fez hoje e acompanhe streaks de dias seguidos. Rastreador de hábitos online gratuito com histórico visual e progresso semanal.',
    canonical: `${SITE_URL}/rastreador-de-habitos`,
    ogType: 'article',
    schema,
    body,
  }));
});

// ──────────────────────────────────────────────────────────────────
// GERADOR DE QR CODE — App8
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/gerador-qr-code', (_req, res) => {
  setHtmlHeaders(res);
  const schema = [
    { '@context':'https://schema.org','@type':'Article', headline:'Gerador de QR Code Online Grátis — URL, PIX, Wi-Fi e Contato', author:{name:SITE_NAME,url:SITE_URL}, publisher:{name:SITE_NAME,logo:{url:OG_IMAGE}}, datePublished:'2024-01-01', dateModified:new Date().toISOString().split('T')[0] },
    { '@context':'https://schema.org','@type':'BreadcrumbList', itemListElement:[{position:1,name:'Início',item:SITE_URL},{position:2,name:'Gerador de QR Code',item:`${SITE_URL}/gerador-qr-code`}] },
    { '@context':'https://schema.org','@type':'SoftwareApplication', name:'Gerador de QR Code Online', applicationCategory:'UtilitiesApplication', operatingSystem:'Web', offers:{price:'0',priceCurrency:'BRL'}, url:`${SITE_URL}/app8` },
    { '@context':'https://schema.org','@type':'FAQPage', mainEntity:[
      {name:'Como criar QR Code de um link?',acceptedAnswer:{text:'Acesse o gerador, selecione o tipo URL, cole seu link e o QR Code é gerado automaticamente. Faça o download em PNG ou SVG.'}},
      {name:'Como criar QR Code do PIX?',acceptedAnswer:{text:'Selecione o tipo PIX, insira sua chave PIX, nome e cidade. O QR Code EMV é gerado automaticamente para compartilhar.'}},
      {name:'Posso criar QR Code de rede Wi-Fi?',acceptedAnswer:{text:'Sim. Selecione o tipo Wi-Fi, informe o nome da rede (SSID), senha e segurança. Quem escanear se conecta automaticamente sem digitar senha.'}},
    ]},
  ];
  const body = `
<nav class="breadcrumb"><a href="/">Início</a><span>›</span><span>Gerador de QR Code</span></nav>
<span class="tag">Gratuito</span><span class="tag">Download PNG e SVG</span>
<h1>Gerador de QR Code online — URL, PIX, Wi-Fi, Contato e mais</h1>
<p class="lead">Crie QR Codes de qualquer coisa em segundos: links, PIX, Wi-Fi, cartão de visitas digital, email ou número de telefone. Download grátis em PNG e SVG, sem cadastro.</p>

<div class="stats">
  <div class="stat"><strong>7</strong><span>tipos de QR</span></div>
  <div class="stat"><strong>PNG+SVG</strong><span>formatos</span></div>
  <div class="stat"><strong>100%</strong><span>gratuito</span></div>
</div>

<h2>Para que serve um QR Code?</h2>
<p>QR Code (Quick Response Code) é um código bidimensional que qualquer smartphone consegue ler com a câmera. Ao escanear, o dispositivo executa uma ação: abre um link, conecta ao Wi-Fi, salva um contato, inicia um pagamento PIX ou redige um email.</p>
<p>São usados em embalagens, cardápios, cartões de visita, materiais impressos, apresentações, etiquetas de produtos e muito mais.</p>

<h2>Tipos de QR Code que você pode criar</h2>
<div class="cards">
  <div class="card"><div class="icon">${ico('link', 22)}</div><h3>URL / Link</h3><p>Redireciona para qualquer site. O tipo mais comum — use em materiais impressos para enviar ao seu site.</p></div>
  <div class="card"><div class="icon">${ico('finance', 22)}</div><h3>PIX</h3><p>Pagamento PIX com sua chave e valor opcional. Perfeito para cobrança rápida ou em ponto de venda.</p></div>
  <div class="card"><div class="icon">${ico('wifi', 22)}</div><h3>Wi-Fi</h3><p>Conecta automaticamente à rede sem digitar senha. Ideal para recepções, bares e espaços de trabalho.</p></div>
  <div class="card"><div class="icon">${ico('user', 22)}</div><h3>Contato (vCard)</h3><p>Salva seus dados de contato direto na agenda do celular. Substitui o cartão de visita físico.</p></div>
  <div class="card"><div class="icon">${ico('mail', 22)}</div><h3>E-mail</h3><p>Abre o app de email com destinatário, assunto e corpo preenchidos. Facilita contato imediato.</p></div>
  <div class="card"><div class="icon">${ico('text', 22)}</div><h3>Texto livre</h3><p>Exibe qualquer texto ao escanear. Útil para instruções, senhas temporárias ou mensagens.</p></div>
</div>

<h2>Como criar um QR Code</h2>
<ol class="step-list">
  <li><strong>Acesse o Gerador de QR Code</strong> — abra <a href="/app8">o app8</a></li>
  <li><strong>Escolha o tipo</strong> — URL, PIX, Wi-Fi, vCard, email ou texto</li>
  <li><strong>Preencha os dados</strong> — o QR Code é gerado em tempo real enquanto você digita</li>
  <li><strong>Personalize</strong> — escolha cores com preset ou color picker</li>
  <li><strong>Baixe</strong> — PNG para uso digital, SVG para impressão em qualquer tamanho</li>
</ol>

<h2>PNG ou SVG: qual formato usar?</h2>
<table>
  <thead><tr><th>Formato</th><th>Uso ideal</th><th>Qualidade</th></tr></thead>
  <tbody>
    <tr><td><strong>PNG (400px+)</strong></td><td>Sites, redes sociais, apresentações, WhatsApp</td><td>Ótima para telas</td></tr>
    <tr><td><strong>SVG</strong></td><td>Impressão, banners, camisetas, embalagens</td><td>Infinita — não pixeliza nunca</td></tr>
  </tbody>
</table>
<div class="tip"><strong>Regra geral:</strong> Para impressão, sempre use SVG. Para web e digital, use PNG com pelo menos 400×400px.</div>

<h2>QR Code para PIX: como funciona</h2>
<p>O QR Code de PIX gerado segue o padrão EMV do Banco Central do Brasil. Ele contém sua chave PIX, nome e cidade. Quando escaneado pelo app do banco, os dados são preenchidos automaticamente — o pagador só precisa confirmar.</p>
<p>Você pode incluir um valor fixo (ideal para cobranças com preço definido) ou deixar em aberto para o pagador definir o valor.</p>

<h2>Perguntas frequentes</h2>
<div>
  <div class="faq-item"><h3>O QR Code expira?</h3><p>Não. QR Codes gerados com conteúdo fixo (URL, texto, vCard) não expiram. Se quiser QR Codes rastreáveis com analytics, use o <a href="/encurtar-links">Encurtador de Links</a> combinado com o QR Code gerado a partir do link curto.</p></div>
  <div class="faq-item"><h3>Qual é o tamanho mínimo para impressão?</h3><p>Para garantir leitura confiável, use no mínimo 2×2cm em impressão. Quanto mais dados no QR, maior precisa ser. Para conteúdos longos, prefira links curtos para reduzir a densidade do código.</p></div>
  <div class="faq-item"><h3>Preciso de cadastro?</h3><p>Não. O gerador é 100% gratuito e não requer conta.</p></div>
</div>

<div class="hero-cta"><a href="/app8" class="btn-primary">${ico('qr', 16)} Gerar meu QR Code</a><a href="/encurtar-links" class="btn-outline">${ico('link', 16)} Encurtar link</a></div>

<div class="related"><h2>Leia também</h2><div class="related-links">
  <a href="/encurtar-links" class="related-link"><strong>${ico('link', 14)} Encurtar Links</strong>Links curtos com QR integrado</a>
  <a href="/link-na-bio" class="related-link"><strong>${ico('link2', 14)} Link na Bio</strong>Página com seus links</a>
  <a href="/converter-json-excel" class="related-link"><strong>${ico('converter', 14)} JSON para Excel</strong>Conversor de dados</a>
  <a href="/" class="related-link"><strong>🏠 Início</strong>Todas as ferramentas</a>
</div></div>`;
  res.send(page({ title:'Gerador de QR Code Online Grátis — URL, PIX, Wi-Fi, Contato', description:'Crie QR Codes de links, PIX, Wi-Fi e contatos online, grátis. Download PNG e SVG sem cadastro. Personalize cores e tamanho.', canonical:`${SITE_URL}/gerador-qr-code`, ogType:'article', schema, body }));
});

// ──────────────────────────────────────────────────────────────────
// EDITOR DE IMAGENS — App9
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/editor-imagens', (_req, res) => {
  setHtmlHeaders(res);
  const schema = [
    { '@context':'https://schema.org','@type':'Article', headline:'Editor de Imagens Online Grátis — Redimensionar, Comprimir e Converter', author:{name:SITE_NAME,url:SITE_URL}, publisher:{name:SITE_NAME,logo:{url:OG_IMAGE}}, datePublished:'2024-01-01', dateModified:new Date().toISOString().split('T')[0] },
    { '@context':'https://schema.org','@type':'BreadcrumbList', itemListElement:[{position:1,name:'Início',item:SITE_URL},{position:2,name:'Editor de Imagens',item:`${SITE_URL}/editor-imagens`}] },
    { '@context':'https://schema.org','@type':'SoftwareApplication', name:'Editor de Imagens Online', applicationCategory:'UtilitiesApplication', operatingSystem:'Web', offers:{price:'0',priceCurrency:'BRL'}, url:`${SITE_URL}/app9` },
    { '@context':'https://schema.org','@type':'FAQPage', mainEntity:[
      {name:'Como comprimir imagem sem perder qualidade?',acceptedAnswer:{text:'Use qualidade entre 75-85%. Nessa faixa a redução de tamanho é grande (50-70%) com diferença visual quase imperceptível.'}},
      {name:'Como converter PNG para WebP?',acceptedAnswer:{text:'Faça upload da imagem PNG, selecione a ferramenta Converter, escolha WebP e clique em processar. WebP é 25-35% menor que PNG.'}},
      {name:'Minha imagem fica no servidor?',acceptedAnswer:{text:'Não. Todo o processamento acontece no seu browser usando Canvas API. Sua imagem nunca é enviada para nenhum servidor.'}},
    ]},
  ];
  const body = `
<nav class="breadcrumb"><a href="/">Início</a><span>›</span><span>Editor de Imagens</span></nav>
<span class="tag">Gratuito</span><span class="tag">Processamento local</span>
<h1>Editor de imagens online — redimensione, comprima e converta</h1>
<p class="lead">Redimensione, comprima, converta, recorte e adicione marca d'água em imagens diretamente no navegador. <strong>Sua imagem nunca sai do seu dispositivo</strong> — processamento 100% local.</p>

<div class="stats">
  <div class="stat"><strong>6</strong><span>ferramentas</span></div>
  <div class="stat"><strong>Privado</strong><span>sem upload</span></div>
  <div class="stat"><strong>30MB</strong><span>tamanho máximo</span></div>
</div>

<h2>Ferramentas disponíveis</h2>
<div class="cards">
  <div class="card"><div class="icon">${ico('ruler', 22)}</div><h3>Redimensionar</h3><p>Altere largura e altura com opção de manter proporção. Atalhos: FHD (1920×1080), HD (1280×720).</p></div>
  <div class="card"><div class="icon">${ico('compress', 22)}</div><h3>Comprimir</h3><p>Reduza o tamanho do arquivo com controle de qualidade. Ideal para otimizar imagens para web.</p></div>
  <div class="card"><div class="icon">${ico('converter', 22)}</div><h3>Converter formato</h3><p>Transforme JPG em PNG, PNG em WebP, WebP em JPG. WebP é 25-35% menor que JPG na mesma qualidade.</p></div>
  <div class="card"><div class="icon">${ico('crop', 22)}</div><h3>Recortar</h3><p>Corte uma região específica da imagem com coordenadas exatas em pixels.</p></div>
  <div class="card"><div class="icon">${ico('write', 22)}</div><h3>Marca d'água</h3><p>Adicione texto personalizado em 5 posições com controle de opacidade.</p></div>
  <div class="card"><div class="icon">${ico('layers2', 22)}</div><h3>Preto e branco</h3><p>Converta para escala de cinza com algoritmo de luminosidade profissional.</p></div>
</div>

<h2>Como comprimir imagem para web</h2>
<p>Imagens pesadas são a principal causa de sites lentos. O Google PageSpeed penaliza páginas com imagens não otimizadas. A regra geral:</p>
<ol class="step-list">
  <li><strong>Redimensione primeiro</strong> — se sua imagem tem 4000px e vai aparecer em 800px, redimensione para 800px antes de comprimir</li>
  <li><strong>Escolha o formato certo</strong> — fotos: JPG ou WebP; imagens com transparência: PNG; ícones e logos: SVG</li>
  <li><strong>Ajuste a qualidade</strong> — 75-85% oferece excelente relação qualidade/tamanho</li>
</ol>
<div class="tip"><strong>Resultado típico:</strong> Uma foto de 3MB pode ser reduzida para 150-300KB com qualidade visual idêntica ao olho humano.</div>

<h2>JPG vs PNG vs WebP: qual usar?</h2>
<table>
  <thead><tr><th>Formato</th><th>Melhor para</th><th>Suporte</th><th>Tamanho relativo</th></tr></thead>
  <tbody>
    <tr><td><strong>JPG</strong></td><td>Fotos, imagens coloridas</td><td>Universal</td><td>Médio</td></tr>
    <tr><td><strong>PNG</strong></td><td>Logos, transparência, capturas de tela</td><td>Universal</td><td>Grande</td></tr>
    <tr><td><strong>WebP</strong></td><td>Web em geral, substitui JPG e PNG</td><td>Todos os browsers modernos</td><td>25-35% menor</td></tr>
  </tbody>
</table>

<h2>Privacidade: por que processar localmente?</h2>
<p>A maioria dos editores de imagem online envia seu arquivo para um servidor remoto. O Util Ferramentas usa a <strong>Canvas API do navegador</strong> para processar tudo no seu próprio dispositivo. Isso significa que:</p>
<ul>
  <li>Suas imagens pessoais nunca saem do seu computador ou celular</li>
  <li>Funciona offline após carregamento da página</li>
  <li>Não há limite de uso imposto por servidor</li>
  <li>Velocidade máxima — sem tempo de upload/download</li>
</ul>

<h2>Perguntas frequentes</h2>
<div>
  <div class="faq-item"><h3>Qual é o tamanho máximo de arquivo?</h3><p>30 MB. Para arquivos maiores, considere redimensionar primeiro em uma ferramenta dedicada.</p></div>
  <div class="faq-item"><h3>Como adicionar marca d'água em todas as fotos?</h3><p>Processe uma por vez — cada imagem pode ter texto e posição diferentes. Para processamento em lote, entre em contato pelo suporte.</p></div>
  <div class="faq-item"><h3>A qualidade WebP é melhor que JPG?</h3><p>WebP usa compressão mais moderna e gera arquivos menores com qualidade equivalente. A 80% de qualidade, WebP produz arquivo 25-35% menor que JPG equivalente.</p></div>
</div>

<div class="hero-cta"><a href="/app9" class="btn-primary">${ico('image', 16)} Editar imagem agora</a><a href="/converter-json-excel" class="btn-outline">${ico('converter', 16)} Converter dados</a></div>

<div class="related"><h2>Leia também</h2><div class="related-links">
  <a href="/gerador-qr-code" class="related-link"><strong>${ico('qr', 14)} Gerador de QR Code</strong>QR de URL, PIX e Wi-Fi</a>
  <a href="/como-baixar-videos" class="related-link"><strong>${ico('download', 14)} Baixar Vídeos</strong>YouTube e Instagram</a>
  <a href="/converter-json-excel" class="related-link"><strong>${ico('converter', 14)} JSON para Excel</strong>Conversor de dados</a>
  <a href="/" class="related-link"><strong>🏠 Início</strong>Todas as ferramentas</a>
</div></div>`;
  res.send(page({ title:'Editor de Imagens Online Grátis — Comprimir, Redimensionar, Converter', description:'Edite imagens online sem enviar para servidor. Comprima, redimensione, converta JPG/PNG/WebP, adicione marca d\'água. Processamento 100% local e privado.', canonical:`${SITE_URL}/editor-imagens`, ogType:'article', schema, body }));
});

// ──────────────────────────────────────────────────────────────────
// CALCULADORA FINANCEIRA — App10
// ──────────────────────────────────────────────────────────────────
seoRouter.get('/calculadora-financeira', (_req, res) => {
  setHtmlHeaders(res);
  const schema = [
    { '@context':'https://schema.org','@type':'Article', headline:'Calculadora Financeira Online — Juros Compostos, Parcelas e Aposentadoria', author:{name:SITE_NAME,url:SITE_URL}, publisher:{name:SITE_NAME,logo:{url:OG_IMAGE}}, datePublished:'2024-01-01', dateModified:new Date().toISOString().split('T')[0] },
    { '@context':'https://schema.org','@type':'BreadcrumbList', itemListElement:[{position:1,name:'Início',item:SITE_URL},{position:2,name:'Calculadora Financeira',item:`${SITE_URL}/calculadora-financeira`}] },
    { '@context':'https://schema.org','@type':'SoftwareApplication', name:'Calculadora Financeira Online', applicationCategory:'FinanceApplication', operatingSystem:'Web', offers:{price:'0',priceCurrency:'BRL'}, url:`${SITE_URL}/app10` },
    { '@context':'https://schema.org','@type':'FAQPage', mainEntity:[
      {name:'Como calcular juros compostos?',acceptedAnswer:{text:'Insira o valor inicial, aporte mensal, taxa anual e prazo. A calculadora mostra o valor final, total investido e juros ganhos com gráfico de evolução.'}},
      {name:'Como calcular a parcela de um empréstimo?',acceptedAnswer:{text:'Use o simulador de parcelas: informe o valor, taxa mensal e número de parcelas. O resultado mostra a parcela (tabela Price), total pago e custo total em juros.'}},
      {name:'Quanto preciso guardar para me aposentar?',acceptedAnswer:{text:'A calculadora de aposentadoria usa a Regra dos 4%: você precisa de 25x a renda anual desejada investida. Informe sua idade, renda desejada e rentabilidade esperada para descobrir o aporte mensal necessário.'}},
    ]},
  ];
  const body = `
<nav class="breadcrumb"><a href="/">Início</a><span>›</span><span>Calculadora Financeira</span></nav>
<span class="tag">Gratuito</span><span class="tag">6 simulações</span>
<h1>Calculadora financeira online — juros compostos, parcelas e aposentadoria</h1>
<p class="lead">6 simulações financeiras no mesmo lugar: juros compostos com gráfico, parcelas de empréstimo, planejamento de aposentadoria, reserva de emergência, meta de poupança e impacto da inflação.</p>

<div class="stats">
  <div class="stat"><strong>6</strong><span>simulações</span></div>
  <div class="stat"><strong>Privado</strong><span>sem cadastro</span></div>
  <div class="stat"><strong>100%</strong><span>gratuito</span></div>
</div>

<h2>Simulações disponíveis</h2>
<div class="cards">
  <div class="card"><div class="icon">${ico('trendUp', 22)}</div><h3>Juros Compostos</h3><p>Veja seu patrimônio crescer com aportes mensais. Gráfico comparando valor investido vs total acumulado.</p></div>
  <div class="card"><div class="icon">${ico('bank', 22)}</div><h3>Simulador de Parcelas</h3><p>Calcule parcelas de empréstimos e financiamentos (tabela Price) com total de juros pago.</p></div>
  <div class="card"><div class="icon">${ico('sun', 22)}</div><h3>Aposentadoria</h3><p>Quanto poupar por mês para se aposentar com a renda desejada, usando a Regra dos 4%.</p></div>
  <div class="card"><div class="icon">${ico('shield', 22)}</div><h3>Reserva de Emergência</h3><p>Calcule sua meta com barra de progresso e tempo para completar.</p></div>
  <div class="card"><div class="icon">${ico('target', 22)}</div><h3>Meta de Poupança</h3><p>Em quanto tempo você atinge seu objetivo com aportes mensais e rentabilidade.</p></div>
  <div class="card"><div class="icon">${ico('trendDown', 22)}</div><h3>Impacto da Inflação</h3><p>Veja como R$1.000 de hoje valerão menos no futuro com tabela histórica.</p></div>
</div>

<h2>Juros compostos: o poder do tempo</h2>
<p>Albert Einstein teria chamado os juros compostos de "oitava maravilha do mundo". A fórmula é simples: os juros ganhos em um período são adicionados ao capital e passam a render juros também no período seguinte.</p>
<p>O resultado é um crescimento exponencial que fica cada vez mais poderoso com o tempo. <strong>Quem começa cedo ganha muito mais</strong> do que quem investe mais dinheiro por menos tempo.</p>
<div class="box">
  <strong>Exemplo prático:</strong><br/>
  Investir R$500/mês por 30 anos a 10% ao ano = <strong>R$1.130.243</strong><br/>
  Total investido: R$180.000 — Juros ganhos: <strong>R$950.243</strong> (528% de retorno)
</div>

<h2>Como calcular parcelas de empréstimo</h2>
<p>A calculadora usa o sistema Price (parcelas fixas), o mais comum em empréstimos pessoais e financiamentos no Brasil. A fórmula considera:</p>
<ul>
  <li><strong>Valor do empréstimo</strong> — quanto você está pegando</li>
  <li><strong>Taxa de juros mensal</strong> — o banco cobra por mês sobre o saldo devedor</li>
  <li><strong>Número de parcelas</strong> — prazo total do empréstimo</li>
</ul>
<div class="tip"><strong>Atenção às taxas:</strong> Banco tradicional cobra 2-4% ao mês. Crédito consignado fica entre 1.5-2%. Fintech pode oferecer taxas menores. Compare antes de contratar.</div>

<h2>Planejamento de aposentadoria: Regra dos 4%</h2>
<p>A Regra dos 4% diz que um portfólio bem diversificado pode sustentar retiradas anuais de 4% do patrimônio indefinidamente, sem esgotá-lo. Isso significa que para ter <strong>R$5.000/mês</strong> na aposentadoria você precisa de:</p>
<p style="text-align:center;font-size:1.2rem;padding:1rem;background:var(--sur2);border-radius:8px;margin:1rem 0">R$5.000 × 12 meses × 25 = <strong style="color:var(--acc)">R$1.500.000</strong></p>
<p>A calculadora mostra exatamente quanto você precisa poupar por mês para chegar lá, considerando o que já tem investido e a rentabilidade esperada.</p>

<h2>Reserva de emergência: por onde começar</h2>
<p>Antes de investir qualquer dinheiro, toda pessoa deve ter uma <strong>reserva de emergência</strong>: valor equivalente a 3-12 meses de gastos mensais, guardado em aplicações de alta liquidez (CDB com liquidez diária, Tesouro Selic).</p>
<ul>
  <li><strong>Empregado CLT com renda estável:</strong> 3-6 meses de gastos</li>
  <li><strong>Autônomo ou renda variável:</strong> 6-12 meses de gastos</li>
</ul>

<h2>Perguntas frequentes</h2>
<div>
  <div class="faq-item"><h3>As simulações são precisas?</h3><p>As fórmulas utilizadas (Price para empréstimos, montante composto para investimentos) são matematicamente corretas. Porém, rentabilidades passadas não garantem retornos futuros, e a inflação pode afetar o poder de compra real.</p></div>
  <div class="faq-item"><h3>Meus dados financeiros ficam salvos?</h3><p>Não. Todas as simulações acontecem no seu navegador e nenhum dado é enviado ou armazenado. A página pode ser usada completamente offline após o carregamento.</p></div>
  <div class="faq-item"><h3>A calculadora substitui um consultor financeiro?</h3><p>Não. As simulações são educativas e ajudam a entender conceitos e cenários. Para decisões financeiras importantes, recomendamos consultar um planejador financeiro certificado (CFP).</p></div>
</div>

<div class="hero-cta"><a href="/app10" class="btn-primary">${ico('finance', 16)} Abrir Calculadora</a><a href="/rastreador-de-habitos" class="btn-outline">${ico('flame', 16)} Rastreador de Hábitos</a></div>

<div class="related"><h2>Leia também</h2><div class="related-links">
  <a href="/gerador-qr-code" class="related-link"><strong>${ico('qr', 14)} Gerador de QR Code</strong>URL, PIX e Wi-Fi</a>
  <a href="/editor-imagens" class="related-link"><strong>${ico('image', 14)} Editor de Imagens</strong>Comprimir e converter</a>
  <a href="/rastreador-de-habitos" class="related-link"><strong>${ico('flame', 14)} Hábitos</strong>Construa consistência</a>
  <a href="/" class="related-link"><strong>🏠 Início</strong>Todas as ferramentas</a>
</div></div>`;
  res.send(page({ title:'Calculadora Financeira Online — Juros Compostos, Parcelas, Aposentadoria', description:'Calcule juros compostos, parcelas de empréstimo, aposentadoria pela Regra dos 4%, reserva de emergência e impacto da inflação. Grátis, privado, sem cadastro.', canonical:`${SITE_URL}/calculadora-financeira`, ogType:'article', schema, body }));
});
