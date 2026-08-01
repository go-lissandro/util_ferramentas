# Dashboard Visual Identity Redesign — Design Doc

**Date:** 2026-07-31
**Scope:** Fase 1 — `app1-dashboard` (React admin panel)
**Approach:** C — Híbrido Inteligente (token-first + biblioteca de componentes própria + migração incremental opcional p/ Tailwind/shadcn)
**Status:** Aprovado seccionalmente pelo cliente

---

## Contexto

O `app1-dashboard` é o painel admin de uma plataforma SaaS multi-tenant ("navalha suíça digital": 10 apps utilitários — baixar vídeo, converter arquivos, encurtador, QR code, etc.) rodando sob um gateway Express + PostgreSQL, deployado no Render.

O visual atual é funcional mas desprovido de identidade: menus são texto+emoji, profundidade é simulada com hex arbitrários (`#1a1a24`, `#2a2a38`) — não há elevation real. Cada página repete `style={{...}}` inline dezenas de vezes. Não há design system; maquiagem sobre base frágil.

### Briefing do cliente (verbatim, resumido)

1. **B2C utilitário de uso rápido** — pessoa chega c/ problema específico, quer resolver em segundos. Confiável, direto, sem "site amador cheio de propaganda". Não é enterprise; é *utilitário com orgulho*.
2. **"Ferramenteiro moderno"** — oficina bem organizada, não bagunça de gadgets. Ousado no contraste (títulos grandes, cor de assinatura forte), disciplinado no ruído. Microcopy c/ leve humor permitida, UI limpa e confiante, zero infantilização.
3. **Fase 1 = primeiro minuto do free:** Dashboard, Apps, Login. Users/Billing/Settings/Products/Licenses/Plans/PurchaseRequests → fase 2.
4. **Prioridades (ordem):** design system componentizado (fundação) → dark mode c/ elevation real → micro-animações funcionais c/ propósito. **Sem glassmorphism, sem ilustração custom** (polimento de fase 2).
5. **Stack:** livre p/ migrar CSS-in-JS → Tailwind se reduzir dívida. shadcn/ui + Radix como base de componentes/acessibilidade.
6. **Referências:** Linear (disciplina tipográfica, hovers quase imperceptíveis), Vercel (hierarquia preto/branco/acento), Raycast (ferramenta "chata" parecendo desejável).
7. **Iterativo:** fase 1 primeiro, validar, depois expandir.

### Arquitetura atual (relevante)

```
apps/app1-dashboard/
├── index.html (title brand, fonts)
├── vite.config.ts   base /app1/, proxy /api → :3000
└── src/
    ├── main.tsx       BrowserRouter basename /app1, QueryClient (staleTime 5m)
    ├── App.tsx        Routes: /login + ProtectedRoute(Outlet)
    ├── index.css      :root tokens + .card/.btn-primary/.btn-ghost/.input-field + animações
    ├── store/authStore.ts    Zustand persist (user, tenant, accessToken…)
    ├── services/api.ts       axios + authApi + usersApi
    ├── components/layout/DashboardLayout.tsx   sidebar + Outlet (240px, inline styles)
    └── pages/
        ├── LoginPage.tsx         react-hook-form + zod, gradient logo, error box
        ├── DashboardPage.tsx     StatCard (inline), recharts BarChart, quick actions emoji, apps grid
        ├── AppsPage.tsx           card por app c/ APP_ICONS/APP_DESCRIPTIONS
        ├── BillingPage.tsx  (fase 2)   PlansPage, LicensesPage, ProductsPage, PurchaseRequestsPage,
        └── SettingsPage, UsersPage     (fase 2)
```

**Stack:** React 18, React Router 6, TanStack Query 5, Zustand 4, react-hook-form + zod, lucide-react, recharts, clsx, Tailwind 3 configurado (mas as pages usam quase só inline styles hoje).

---

## Princípios guia

1. **Token-first:** os tokens são a única fonte de verdade. Componentes são a única camada que conhece os tokens. Pages têm lógica e conteúdo — **zero `style={{...}}` inline**.
2. **Elevation nomeada por função, não por hex.** Cada nível visualmente distinto do vizinho; se dois cards na mesma camada parecem iguais, a elevation falhou.
3. **Estados sempre completos:** todo componente/componente composto tem default/hover/focus/disabled/loading/empty. Skeleton substitui "Carregando...". Empty state é 2º touchpoint visual mais importante (depois do hero).
4. **Motion c/ propósito:** feedback tátil (clique), orientação (entrada escalonada), sinal (badge novidade). Animação `dur > 400ms` em hover/focus = bug. `prefers-reduced-motion` mandatório em tudo.
5. **Brand voice centralizada** em `src/lib/strings.ts` — português, leveza sem infantilização, localizada e fácil de trocar.
6. **Acessibilidade não-negociável:** contraste AA, focus ring spark visível, `aria-*` via Radix onde DOM nativo não chega.
7. **Não regressão funcional:** rotas, mutations, queries React Query, persist Zustand, `usersApi`/`authApi`/`api` — idênticos. Só a apresentação muda.

---

## Seção 1 — Design Tokens

Arquivo único de fonte da verdade: `src/ui/tokens.ts` (TS tipado, importável) refletido em `src/index.css` (`:root` + helpers).

### Elevation (4 camadas reais)

| Elevation | Token surface | Hex proposto | Uso |
|---|---|---|---|
| 0 · void | `--surface-void` | `#0b0b0f` | fundo absoluto, quase nunca visível (login de fundo) |
| 1 · floor | `--surface-floor` | `#121216` | área principal de conteúdo, sidebar |
| 2 · raised | `--surface-raised` | `#181820` | cards, inputs — a "bancada" |
| 3 · overlay | `--surface-overlay` | `#20202b` | menus, popovers, dropdowns — a "prateleira" |
| 4 · floating | `--surface-floating` | `#28283a` | modais, toasts, drawer mobile — "mãos na obra" |

Cada nível tem **sua própria borda** (`--border-void` … `--border-floating`) e **sua própria sombra** (`--shadow-elevation-1` … `--shadow-elevation-4`). Sombras ficam mais difusas e deslocam mais p/ baixo conforme a elevation sobe.

### Cores de assinatura — "Spark" + "Ember"

```
--spark:      #6d5cff   (roxo mais saturated — "ferramenta energizada")
--spark-glow: #8b7bff   (highlight, gradientes)
--ember:      #ff7a45   (NOVO — contraste ousado: badges de notificação, upgrade, estados críticos.
                          NUNCA decorativo. A cor das "brasas/ferramenta quente" do workshop.)
--ember-soft: #ff9d6e
--ember-bright: #ff8d5e  (fallback p/ garantir AA em body text se necessário — uso preferido em ícone/badge/large)
```

Demais cores funcionais mantêm a família atual, renomeadas semanticamente:

```
--text:        #e8e8f0
--text-muted:  #8888a8
--text-subtle: #6b6b8a   (NOVO — sublabels, tooltips)
--success:     #00d4aa
--warning:     #ffb347
--danger:      #ff4d6a
--bg:          var(--surface-void)   (alias p/ compat)
```

### Tipografia (vibe Linear/Vercel)

Fontes mantidas: `Inter` (display+body), `JetBrains Mono` (mono). Disciplina via tokens:

```
--font-display: 'Inter', system-ui, sans-serif   (weights 600/700 — só títulos)
--font-body:    'Inter', system-ui, sans-serif   (weights 400/500)
--font-mono:    'JetBrains Mono', monospace

/* type scale
   --text-display: reservado p/ números de MetricCard + hero do Dashboard/Login.
                   É o "contraste ousado" — valores, não títulos de página. */
--text-display: 2rem   / 1.15
--text-h1:      1.5rem  / 1.3       (títulos de página: "Apps", "Usuários", etc.)
--text-h2:      1.125rem / 1.4      (títulos de card/seção, nome de app no AppsPage)
--text-body:    0.875rem / 1.6
--text-label:  0.78rem / letter-spacing .05em   (uppercase — o "selo", group headers da sidebar)
--text-mono:   0.78rem

/* geometry — menos arredondado que hoje = "precisão de ferramenta" */
--radius: 4 / 8 / 12 / 16px   (--radius-sm/--md/--lg/--xl)
/* spacing — escala 8px rígida */
--space: 4 / 8 / 12 / 16 / 24 / 32 / 48   (--space-1..-6)
/* z-index por camada */
--z-floor: 0  --z-raised: 1  --z-overlay: 10  --z-floating: 20  --z-drawer: 30  --z-toast: 40
```

### Motion (tokenizado, não string mágica)

```
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)   /* overshoot leve — "acorda" */
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1)       /* entradas naturais */
--dur-fast:  120ms   /* hover, focus — feedback tátil */
--dur-base:  200ms   /* transições de estado */
--dur-page:  340ms   /* entrada de página escalonada */

/* REGRA FIXA (no tokens.ts como comentário + futuro eslint): 
   animação c/ dur > 400ms em hover/focus = bug. Página/drawer podem dur-page; 
   microinterações nunca. */
```

---

## Seção 2 — Component Library (`src/ui/`)

A única camada que conhece os tokens. Cada page da fase 1 compõe só esses. Bundle mínimo: Radix só onde vale (Tooltip, DropdownMenu, Dialog p/ drawer).

```
src/ui/
├── tokens.ts            ← TS tokens tipados (intellisense p/ componentes; pages não tocam hex)
├── Button.tsx
├── Card.tsx
├── Input.tsx
├── Badge.tsx
├── Avatar.tsx
├── Tooltip.tsx          ← Radix Tooltip
├── DropdownMenu.tsx     ← Radix DropdownMenu
├── Spinner.tsx
├── Skeleton.tsx         ← shimmer, substitui "Carregando..."
├── layout/
│   ├── Stack.tsx        ← column c/ gap (spacing scale)
│   ├── Grid.tsx         ← grid auto-fit / colunas fixas
│   └── Inline.tsx       ← row c/ gap
└── index.ts             ← barrel export
```

### APIs

```tsx
/* Button — feedback tátil no clique (scale 0.97 + dur-fast). 
   Hover: border sobe uma elevation (raised→floating), nunca só opacidade. */
<Button variant="primary" size="md">Assinar Pro</Button>
variant: 'primary' | 'ghost' | 'critical' | 'subtle'
size:    'sm' | 'md' | 'lg'

/* Card — elevação explícita. interactive=true é o GATE do hover: 
   falso = nunca anima no hover (plástico evitado); true = vira Link-ish,
   acorda no hover (raised→floating, spring). Hover nunca acontece sem interactive. */
<Card elevation="raised" interactive={false}>...</Card>
elevation: 'floor' | 'raised' | 'overlay' | 'floating'
interactive?: boolean   /* DEFAULT false. true => Link-ish, acorda no hover (spring) */

/* Input — wrapper renderiza label + estado de erro + focus ring (spark-glow) */
<Input label="Email" value=... error=... placeholder=... />

/* Badge — o "selo" */
<Badge tone="spark" dot>2</Badge>
tone: 'spark' | 'ember' | 'success' | 'neutral'
dot?: boolean

/* Avatar — inicial + gradiente de assinatura (formaliza o existente) */
<Avatar name="Lissandro" size="sm" />

/* Tooltip / DropdownMenu — Radix (focus-visible, keyboard, dismiss-out) */

/* Skeleton — blocos c/ shimmer; só renderiza se isLoading */

/* Stack/Grid/Inline — helpers spacing baseados na escala 8px;
   usados p/ layout de pages no lugar de style={{display/grid/gap}} */
```

### Princípios dos componentes

1. **Zero `style={{...}}` nas pages.** Layout via `<Stack>/<Grid>/<Inline>`.
2. **Estados sempre completos:** todo input/button tem hover/focus/disabled/loading.
3. **Tokens via TS import:** componentes têm intellisense; pages não decoram hex.
4. **Acessibilidade AA:** focus ring visível (spark), `aria-*` via Radix onde nativo não chega. `--ember` (#ff7a45) no `--surface-raised` (#181820) passa AA p/ texto grande/bold/ícone; body-text usa `--ember-bright` (#ff8d5e) se precisar — mas uso é maioritariamente badge/ícone/large.
5. **Bundle mínimo:** DOM puro na maioria; Radix só em Tooltip/DropdownMenu (~3KB).

---

## Seção 3 — Fase 1 Pages

### 3.1 Sidebar (DashboardLayout.tsx) — a "estante"

```
┌─────────────────────────────────────┐
│  ◆  Workspace                  ⭐ Pro │  logo gradiente spark + nome + Badge ember="Pro"
│     [card upgrade se free: "Faltam 2 ferramentas. Ver Pro ↗"]
├─────────────────────────────────────┤
│  FERRAMENTAS          ← group header, --text-label uppercase
│  ▸  Overview
│  ▸  Apps
│  ▸  Compras PIX          [•ember]    badge contador só se >0; pulse só se >0
│  ▸  Planos & Acesso
│  ─                                    separador sutil (surface-floor)
│  ADMINISTRAÇÃO
│  ▸  Usuários
│  ▸  Produtos
│  ▸  Licenças
├─────────────────────────────────────┤
│  ◯ Lissandro                        avatar + nome + email (truncate + Tooltip se overflow)
│    lissandro@…
│  [ Sair ]                            btn-subtle (icon + label)
└─────────────────────────────────────┘
  width 256 (era 240) · surface-floor · border-floor · scrollbar fina
```

**Estados de item (Linear/Raycast — "quase imperceptível"):**
- **Default:** ícone+label `--text-muted`.
- **Hover:** ícone+label → `--text`; fundo transparent→`--surface-raised`; `--dur-fast`. **Sem opacidade.**
- **Ativo:** fundo `--surface-raised`, barra esquerda spark 3px (era 2px transparent), ícone `--spark`, label bold. "Ferramenta na mão".
- **Focus-visible:** ring spark.
- **Badges:** contador só se >0; tone ember; `dot` se >0.

**Group headers** ("FERRAMENTAS", "ADMINISTRAÇÃO") = o "male" do briefing: deixam claro o que cada seção faz sem descrever. MEP branca (`--space-lg`) entre grupos.

**Banner upgrade (free):** card discreto no *piso* — gradient subtraindo (spark-glow 6%), borda dashed `--border-raised`, microcopy *"Faltam 2 ferramentas. Ver Pro ↗"*. Não encosta, não interrompe (-Raycast: upsell parece serviço, não propaganda).

**NAV_ITEMS (refatorado利于 groups):**

```ts
const NAV_GROUPS = [
  { label: 'Ferramentas', items: [
      { to: '/', icon: LayoutGrid, label: 'Overview', end: true },
      { to: '/apps', icon: Boxes, label: 'Apps' },
      { to: '/purchase-requests', icon: ShoppingBag, label: 'Compras PIX', badge: true },
      { to: '/plans', icon: ToggleRight, label: 'Planos & Acesso' },
  ]},
  { label: 'Administração', items: [
      { to: '/users', icon: Users, label: 'Usuários' },
      { to: '/products', icon: Package, label: 'Produtos' },
      { to: '/licenses', icon: Key, label: 'Licenças' },
      { to: '/settings', icon: Settings, label: 'Configurações' },
  ]},
];
```

(Pending count query mantém intacta.)

### 3.2 DashboardPage — a "bancada de trabalho"

- **Hero:** saudação dinâmica por horário (ver Seção 4) + subtext *"sua oficina está em ordem"* (substitui "👋"). Workspace · Plano **Pro ⭐** (spark inline).
- **Pending alert:** se `pending>0`: `<Card elevation="raised" interactive>` leve c/ Badge ember + *"N pagamentos aguardando aprovação"* → link p/ `/purchase-requests`.
- **Upgrade banner (free):** `<Card>` gradient subtraindo, Crown spark, microcopy, `<Button primary>` *"Assinar Pro — R$29,90 ↗"*.

**(a) MetricCard (composto) — 6 stats:**
- `<Card interactive elevation="raised">` c/ **barra vertical 3px à esquerda** na cor context (spark/ember/success/`#4ecdc4`/`#ff7eb3`).
- Ícone recess (quadrado raised 40×40, ícone colorido dentro — "gaveta").
- Valor `--text-display` bold (2rem — sobe de 1.875rem): o contraste ousado.
- `interactive` só se `href` linkável. Hover: elevation raised→floating + barra context 3→4px + `ease-spring`.
- Loading → `<Skeleton>` (nunca "—").

**(b) Cliques chart (recharts):**
- `<Card elevation="raised">`, header *"Cliques nos links · 7d"* + chip spark (`dot` + `"234 total"`).
- Barras **gradient spark** bottom→top (saturado→light), cada barra mais clara L→R = progressão temporal (Cell por Cell fillOpacity).
- Axis `--surface-overlay`, **sem grid lines**.
- Tooltip `<Card elevation="floating">` style.
- Empty state: `<Spinner>` + microcopy *"Ainda não há cliques. Crie um link e veja a régua."*

**(c) ActionTile (composto) — Quick Actions:**
- Cada ação = `<Card interactive>`, lucide icon 32px + label + sub (substitui emoji).
- Ícones reais por app: Download, RepeatTypes, Link, Flame, QrCode, Image, CalculatorCoins, Link2 (a mapear no `APP_ICONS` → `APP_LUCIDE`).
- Hover: tile scale(1.0)→(1.02) `ease-spring` + ícone sobe uma tonalidade.

**(d) Apps grid (referência final):**
- App tile mostrando o que é: ícone + nome + **contagem** se disponível do stats (e.g. "7 links criados"), else **estado** ("Disponível" / `🔒 Pro`).
- `border-raised`, hover→floating.
- Locked apps: elevation floor (recessado), Badge ember `Pro` no canto.

### 3.3 AppsPage — a "vitrine do arsenal"

```
┌─────────────────────────────────────────────┐
│ [icon 44×44 raised]   URL Shortener    ●live │  header: ícone + nome (--text-h2 bold) + dot/lock
│                    app2.util-ferramentas…   │  path em --font-mono --text-subtle
├─────────────────────────────────────────────┤
│ Encurtador — crie links curtos com analytics │  tagline (era "URL Shortener —...")
├─────────────────────────────────────────────┤
│  ✓ Links personalizados                       │  features (CheckCircle2 spark/success)
│  ✓ Analytics de cliques                       │
│  ✓ QR code automático                         │
├─────────────────────────────────────────────┤
│ [Abrir app ↗]          (ou [Fazer upgrade ⚡])│  CTA primary se hasAccess, ghost se locked
└─────────────────────────────────────────────┘
  Card elevation=raised, interactive.
  "live" dot = Badge tone=success dot=true, pulse suave (dur-base loop 1s) — sinal de disponibilidade.
  Locked: dot→🔒 (Lock icon), card surface-floor, Badge ember "Pro".
```

Hover no card: elevation + border→spark-glow 10%.

### 3.4 LoginPage — a "porta da oficina"

- **Split panel:** left = workshop atmospheric (surface-floor + gradient spark→transparent 4%, brandmark ◆ spark-glow, tagline rotativa brand voice `font-display` 2.5rem); right = form.
- Right: `<Card elevation="floating">` — eleva-se do chão. Inputs c/ label-floats, icon olho mantido (Eye/EyeOff).
- Erro → `<Badge tone="ember">` inline (não box vermelho hard).
- Submitting → `<Spinner>` + microcopy rotativa *"Afiação das ferramentas…"*.
- "Assinar agora" → `<Button variant="subtle">` c/ seta (não link gigante).
- **Responsivo:** <768px, left panel some, form full `--surface-void`.

### Responsivo geral (fase 1 intro)

- **Sidebar <768px:** colapsa p/ **top bar** c/ toggle → **drawer overlay** (`--surface-overlay`, Radix Dialog). Fase 1 implementa o drawer mobile.
- **Dashboard/Apps grids:** reflow automático (`grid auto-fit` — já faz).
- **Login split:** <768px colapsa (acima).

---

## Seção 4 — Motion + Microcopy

### Motion — tabela de regras (propósito, não decoração)

| Interação | Token | O que acontece | Propósito |
|---|---|---|---|
| Hover `Card interactive` | `dur-fast`/`ease-spring` | elevation raised→floating + border→spark-glow 10% | "estendeu a mão p/ pegar a ferramenta" |
| Clique `Button` | `dur-fast` | scale 0.97 + volta | feedback tátil — "engatilhou" |
| Focus-visible (qualquer) | `dur-fast`/`ease-out` | ring `--spark` 3px aparece | acessibilidade |
| Entrada de página | `dur-page`/`ease-out` | `fadeInUp` escalonado (stagger 60ms) | orientação |
| Badge contador >0 | `dur-base`/loop | `dot` ember pulse ON 200ms / OFF (não infinito) | novidade, não alarme |
| Login submitting | `dur-base` | spinner + label→microcopy rotativa | usuário vê ação acontecer |
| Sidebar item ativo muda | `dur-fast` | barra spark 3px desliza item ant→novo | "olhar seguiu a ferramenta" |
| Drawer mobile abre | `dur-base`/`ease-out` | slide-in + overlay fade | mobile natural |

**`prefers-reduced-motion` mandatório:** se ativo, **todas** animações viram instantâneas (ou fade 80ms). Implementado via media query global — nada de respeitar só o enter.

### Microcopy — `src/lib/strings.ts` (brand voice centralizada)

```
LOADING:
  auth:        "Afiação das ferramentas…"
  general:     "Carregando arsenal…"
  chart:       "Medindo os cliques…"

EMPTY:
  links:       "Ainda não há links régua. Crie um em Apps."
  clicksChart: "Sem cliques registrados — ainda. Publique um link."
  users:       "Ninguém na oficina ainda. Adicione pela página Compras PIX."
  apps:        "Seu arsenal está completo. Às ferramentas."
  products:    "Sem produtos na bancada. Comece pelo primeiro."

ERROR:
  auth:        "Essa combinação não abriu a porta. Confira e tente de novo."
  network:     "Conexção caiu — a oficina segue de pé, tenta de novo."
  generic:     "Algo enroscou. Recarrega ou tenta em instantes."

SUCCESS:
  proUpgrade:  "Pro ativado. Duas ferramentas a mais no cinto."

UPGRADE (sidebar card, free):
  primary:     "Faltam 2 ferramentas. Ver Pro ↗"

SAUDAÇÃO DINÂMICA (Dashboard hero):
  06–11h  "Bom dia, {name}"
  12–17h  "Boa tarde, {name}"
  18–23h  "Boa noite, {name}"
  00–05h  "Madrugada na oficina, {name}"
  subtext: "sua oficina está em ordem"
```

**Empty states visuais:** microcopy + ícone lucide recessado (`--surface-raised`, opacity 40%) + `<Button variant="subtle">` CTA p/ ação natural. Não texto cru.

**Inline success/error:** form → `<Badge tone="ember">` (não box vermelho); success → `<Badge tone="success">`.

---

## Inventário de arquivos (fase 1)

```
ATUALIZAR:
  index.html                              ← title brand, preconnect fonts (já ok)
  src/index.css                           ← reescreve tokens (Seção 1); .card/.btn-*/.input-field 
                                            viram wrappers finos p/ compat (fase 2 ainda os usa);
                                            remove animações duplicadas; + reduced-motion
  src/components/layout/DashboardLayout.tsx   ← 3.1 (sidebar + groups + drawer mobile)
  src/pages/DashboardPage.tsx                  ← 3.2 (MetricCard/ActionTile/chart/apps)
  src/pages/AppsPage.tsx                       ← 3.3
  src/pages/LoginPage.tsx                      ← 3.4 (split panel)

CRIAR:
  src/ui/tokens.ts
  src/ui/Button.tsx · Card · Input · Badge · Avatar · Tooltip · DropdownMenu · Spinner · Skeleton
  src/ui/layout/Stack.tsx · Grid · Inline
  src/ui/index.ts
  src/lib/strings.ts                         ← brand voice centralizada

NÃO TOCADAS (fase 2): Billing, Users, Products, Licenses, Plans, PurchaseRequests, Settings.
  Continuam funcionando pq App.tsx/login permanecem; .card/.btn-* continuam (compat tokens novos).
```

---

## Definition of Done (fase 1)

- [ ] Cada elevation visualmente distinto do vizinho (verificação visual).
- [ ] Contraste: `--ember` em badges/ícones passa AA (range-check inline).
- [ ] Estados completos (hover/focus/disabled/loading/empty) em todos os `src/ui/`.
- [ ] `prefers-reduced-motion` respeitado na página inteira.
- [ ] Responsivo: login split-panel colapsa <768px; sidebar drawer <768px.
- [ ] **Zero `style={{...}}`** nas pages da fase 1 (`grep -rn "style={{" src/pages src/components` deve falhar p/ arquivos da fase 1).
- [ ] Não há regressão funcional: rotas `App.tsx`, mutations/queries React Query, persist Zustand, `usersApi`/`authApi`/`api` — idênticos.
- [ ] `npm run build` (tsc + vite) pasa.
```
