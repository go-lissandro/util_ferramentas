# Design System — Util Ferramentas

Design system compartilhado entre as apps da plataforma.

## Arquivos

| Arquivo | Uso |
|---------|-----|
| `tokens.css` | CSS custom properties (cores, glass, gradientes, easing) |
| `glass.css` | Classes utilitárias: `.glass-card`, `.glass-strong`, `.ds-app-header`, `.skeleton`, animações |
| `index.ts` | Tokens JS para inline styles + helpers (`glassCard`, `burstConfetti`, `countUp`, `formatBRL`) |

## Como usar

### CSS (apps com Tailwind ou CSS puro)

```css
@import '../../shared/design-system/tokens.css';
@import '../../shared/design-system/glass.css';
```

### TS (apps com inline styles — React)

```ts
import { DS, glassCard, burstConfetti, countUp } from '../../shared/design-system';

// Card glass
<div style={glassCard({ padding: '1.5rem' })}>...</div>

// Confetti ao concluir
burstConfetti(e.currentTarget);

// Contagem animada
countUp(elRef.current, 42);
```

## Convenções

- Tema escuro: `#0a0a0f` (fundo) + `#6c63ff` (roxo) + `#00d4aa` (verde)
- Todas as animações respeitam `prefers-reduced-motion`
- Prefira as classes CSS quando possível; `index.ts` é só para casos que exigem inline styles
