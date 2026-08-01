# Design System — Util Ferramentas

Design system compartilhado entre as apps da plataforma.

## Arquivos

| Arquivo | Uso |
|---------|-----|
| `tokens.css` | CSS custom properties (cores, glass, gradientes, easing) + temas por app (`[data-app="appX"]`) |
| `glass.css` | Classes utilitárias: `.glass-card`, `.glass-strong`, `.ds-app-header`, `.skeleton`, animações, `.ds-btn`, `.ds-icon` |
| `icons.tsx` | Sistema de ícones SVG inline (`AppIcon`) + metadados por app (`getAppMeta`, `APPS`) |
| `index.ts` | Tokens JS para inline styles + helpers (`glassCard`, `burstConfetti`, `countUp`, `formatBRL`) + re-export de `icons` |

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

### Ícones SVG (AppIcon)

```tsx
import { AppIcon, setAppTheme, getAppMeta } from '../../shared/design-system/icons';

// Ativa o tema da app no <html> (define as cores do data-app)
setAppTheme('app4');

// Ícone com cor herdada do contexto
<AppIcon name="download" size={20} />

// Ícone com cor explícita
<AppIcon name="link" size={16} color="#6c63ff" />

// Metadados da app (gradiente, cor de destaque, nome, ícone)
const meta = getAppMeta('app4');   // { icon: 'download', accent, gradient, name, path }
<div style={{ background: meta.gradient }}>
  <AppIcon name={meta.icon} size={18} color="#fff" />
</div>
```

Nomes de ícones disponíveis: `dashboard`, `link`, `link2`, `database`, `download`, `converter`, `flame`, `qr`, `image`, `finance`, `video`, `folder`, `pencil`, `settings`, `trash`, `check`, `lock`, `eye`, `mouse`, `cart`, `file`, `crown`, `alert`, `copy`, `refresh`, `upload`, `plus`, `chart`, `phone`, `wifi`, `text`, `user`, `users`, `users_config`, `inbox`, `cube`, `music`, `layers`, `ruler`, `crop`, `shield`, `target`, `trendUp`, `trendDown`, `bank`, `sun`, `mail`, `award`, `compress`.

### Temas por app

Cada app define a própria cor de destaque, gradiente e ícone no `tokens.css`:

```ts
// no entry point da app (main.tsx)
import { setAppTheme } from '../../shared/design-system/icons';
setAppTheme('app3');   // ativa o tema verde do Gerenciador de Dados
```

Os temas usam `:root[data-app="appX"]` e ficam disponíveis como CSS variables
`--app-accent`, `--app-accent-soft`, `--app-accent-glow` e `--app-gradient`.

## Convenções

- Tema escuro: `#0a0a0f` (fundo) + `#6c63ff` (roxo) + `#00d4aa` (verde)
- Cada app tem uma identidade visual própria (`--app-accent`), mas compartilha o mesmo base
- Todas as animações respeitam `prefers-reduced-motion`
- Prefira as classes CSS quando possível; `index.ts` é só para casos que exigem inline styles
- Ícones de chrome (navegação, botões, stats) devem usar `AppIcon`; emojis ficam reservados para conteúdo de usuário (ex.: tipos de link do Bio, presets de hábitos)
