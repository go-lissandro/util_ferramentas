# Visual Overhaul — Apps Pro

Data: 2026-08-01
Status: Em implementação
Escopo: App2, App3, App6, App7, App10

## Objetivo

Modernizar o visual das 5 apps Pro da plataforma Util Ferramentas com glassmorphism, micro-animações, design system compartilhado e experiência de usuário refinada.

## Design System Compartilhado

Criar `shared/design-system/` como workspace npm com:

### Tokens CSS

```css
--bg-primary: #0a0a0f;
--glass-bg: rgba(17, 17, 24, 0.7);
--glass-border: rgba(255, 255, 255, 0.06);
--glass-blur: 16px;
--gradient-primary: linear-gradient(135deg, #6c63ff, #00d4aa);
--gradient-glow: radial-gradient(circle at 50% 0%, rgba(108,99,255,0.15), transparent 70%);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
```

### Classes utilitárias

- `.glass-card` — background com blur + backdrop-filter + border sutil
- `.glass-card-hover` — hover com glow e translateY
- `.app-header` — Header padronizado com ícone gradiente + nome + tag
- `.skeleton` — Animação shimmer para loading states
- `.fade-in`, `.stagger > *` — Animações de entrada

### Estrutura

```
shared/design-system/
├── package.json
├── tokens.css
├── glass.css
├── index.ts (exporta helpers TS)
└── README.md
```

## App2 — URL Shortener (/app2)

### Header
- Gradiente `#6c63ff → #00d4aa` no ícone
- Glass blur na barra (`background: rgba(17,17,24,0.8); backdrop-filter: blur(12px)`)

### Stats
- Glass cards com ícones flutuantes animados
- Animação de contagem ao carregar

### Lista de Links
- Cards glassmorphism com hover scale + glow na borda esquerda
- Animação stagger na lista

### Modal (criar/editar link)
- Overlay com backdrop blur forte
- Card com glass e entrada spring
- Inputs com glow ring no focus

### QR Code
- Expansão animada (scale de 0 para 1)
- Borda com glow pulsante

### Loading
- Skeleton shimmer cards enquanto carrega

### Micro-interações
- Copy button: flash verde + check animado
- Delete: shake + fade out

## App3 — Data Manager (/app3)

### Sidebar
- Glass blur na sidebar
- Items com indicador luminoso gradiente
- Active: glow accent + ícone colorido

### Cards de Estrutura
- Glass cards, ícone grande colorido, contadores animados

### Schema Builder
- Campos com borda glow no focus
- Arrastar com sombra dinâmica

### Empty State
- Ilustração temática, CTA destacado

## App6 — BioLink (/app6)

### Live Preview
- Moldura de celular fake com notch
- Glass card container
- Preview com update pulse

### Editor
- Glass panel → drag and drop para reordenar links
- Transições suaves entre mudanças

### Theme picker
- Swatches em grid com preview real
- Cada swatch mostra vidro da página

### Analytics
- Cards de stats com glass, bar chart com animação de crescimento
- Top links com barras horizontais gradientes

## App7 — Habits (/app7)

### Círculo de check
- Partículas/confetti ao completar hábito
- Escala + cor do hábito

### Progresso do dia
- Barra gradiente animada
- Glow verde quando 100%

### Habit cards
- Glass forte, glow border na cor do hábito
- Tag "feito hoje" com fade animado

### Streak
- 7+ dias: borda flamejante animada
- 30+ dias: efeito festa

### History dots
- Animação de preenchimento com atraso

## App10 — Finance (/app10)

### Sidebar
- Sidebar flutuante com tabs
- Indicador animado de aba ativa

### Inputs
- Sliders customizados, anel glow nos inputs
- Range com track gradiente

### Charts
- Barras com gradiente + animação de entrada
- Animação ao mudar valores (transição suave)

### Resultados
- Card principal com glow, glass nos demais
- Valor principal pulsa ao mudar

### Loan alert
- Painel com animação pulsante na borda para simulações de empréstimo

## Plano de Implementação

1. Criar `shared/design-system/` com tokens e classes base
2. Consumir tokens em cada app (import CSS)
3. App7 (Habits) — Primeiro, mais simples em componentes
4. App2 (URL Shortener) — Cards + lista com efeitos
5. App3 (Data Manager) — Sidebar + schema
6. App6 (BioLink) — Editor + preview
7. App10 (Finance) — Charts + inputs