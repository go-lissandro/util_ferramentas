# 🚀 Util Ferramentas — SaaS Multi-App

Plataforma SaaS completa com 6 apps rodando em instância única no Render + Neon.

**URL:** `https://util-ferramentas.onrender.com`

---

## Apps

| URL | App | Plano | Descrição |
|-----|-----|-------|-----------|
| `/` | Landing page | Público | SEO + AdSense |
| `/app1` | Admin Dashboard | Todos | Gerenciar usuários, pagamentos, planos |
| `/app2` | URL Shortener | Pro | Links curtos com analytics e QR code |
| `/app3` | Data Manager | Pro | Gerenciamento dinâmico de dados |
| `/app4` | Video Downloader | Grátis | Download de vídeos de 1000+ sites |
| `/app5` | JSON↔Excel | Grátis | Conversor de dados |
| `/app6` | Bio Link | Grátis | Página "link na bio" para Instagram |
| `/app7` | Rastreador de Hábitos | Grátis | Streaks, histórico visual, progresso diário |
| `/app8` | Gerador de QR Code | Grátis | URL, PIX, Wi-Fi, vCard, e-mail |
| `/app9` | Editor de Imagens | Grátis | Redimensionar, comprimir, converter, marca d'água |
| `/app10` | Calculadora Financeira | Grátis | Juros compostos, parcelas, aposentadoria |
| `/checkout.html` | Checkout | Público | Pagamento PIX + ativação de conta |

---

## Deploy no Render

### Variáveis de Ambiente (obrigatórias)

```
NODE_ENV=production
PORT=10000
JWT_SECRET=<64 chars aleatórios>
DATABASE_URL=<string Neon PostgreSQL>
ALLOWED_ORIGINS=https://util-ferramentas.onrender.com
```

### Variáveis opcionais

```
# PIX
PIX_KEY=seu@email.com.br
PIX_QR_IMAGE_URL=https://i.imgur.com/XXXXXXX.png
PRO_PLAN_PRICE_CENTS=2990

# SEO
SITE_URL=https://util-ferramentas.onrender.com
SITE_NAME=Util Ferramentas

# Google
GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
GOOGLE_SEARCH_CONSOLE=verification_token

# Vídeos
YOUTUBE_COOKIES_FILE=/opt/render/project/src/gateway/cookies/youtube.txt
```

### Build Command (copiar para o Render)

```
pip install yt-dlp --break-system-packages && cd ../apps/app1-dashboard && npm install && npm run build && cd ../app2-urlshortener/client && npm install && npm run build && cd ../../app3-datamanager/client && npm install && npm run build && cd ../../app4-videodownloader/client && npm install && npm run build && cd ../../app5-converter/client && npm install && npm run build && cd ../../app6-biolink/client && npm install && npm run build && cd ../../../gateway && npm install --include=dev && npm run build
```

### Start Command

```
npm start
```

---

## Primeiro usuário admin

Após o deploy, crie o admin com:

```bash
ADMIN_EMAIL=seu@email.com ADMIN_PASSWORD=suasenha node scripts/seed-admin.js
```

Ou via painel Render → Shell.

---

## Planos de acesso

| App | Gratuito | Pro |
|-----|----------|-----|
| App4 — Video Downloader | ✅ | ✅ |
| App5 — JSON↔Excel | ✅ | ✅ |
| App6 — Bio Link | ✅ | ✅ |
| App7 — Rastreador de Hábitos | ✅ | ✅ |
| App2 — URL Shortener | ❌ | ✅ |
| App3 — Data Manager | ❌ | ✅ |

Configure via App1 → Planos & Acesso.

---

## Fluxo de pagamento PIX

1. Usuário acessa `/checkout.html` e preenche nome + email
2. Sistema gera ID de referência (`UTL-XXXX`) e exibe QR Code estático
3. Usuário faz o PIX com o ID na descrição e clica "Já paguei"
4. Admin vê em App1 → Compras PIX → verifica → aprova
5. Sistema cria conta e exibe credenciais para o admin enviar ao usuário

---

## Estrutura

```
saas-platform/
├── gateway/                    ← API Node.js/Express (único serviço Render)
│   └── src/
│       ├── server.ts           ← Entry point
│       ├── config/
│       │   ├── database.ts     ← PostgreSQL + migrações automáticas
│       │   └── middleware.ts   ← CORS, rate limit, body parser
│       ├── middleware/
│       │   └── auth.ts         ← JWT authenticate, requireRole, injectDdmTenant
│       ├── routes/
│       │   ├── auth.routes.ts  ← Login, /me
│       │   ├── checkout.routes.ts ← PIX checkout + admin approval
│       │   ├── users.routes.ts ← Stats, list, permissions
│       │   ├── licenses.routes.ts ← License keys
│       │   └── seo.routes.ts   ← Landing page + 8 páginas SEO
│       ├── app2/               ← URL Shortener (embutido)
│       ├── app4/               ← Video Downloader
│       ├── app5/               ← JSON↔Excel Converter
│       ├── app6/               ← Bio Link
│       └── ddm/                ← Data Manager (App3 backend)
├── apps/
│   ├── app1-dashboard/         ← React Admin (Vite + Zustand + React Query)
│   ├── app2-urlshortener/client/
│   ├── app3-datamanager/client/
│   ├── app4-videodownloader/client/
│   ├── app5-converter/client/
│   └── app6-biolink/client/
├── scripts/
│   └── seed-admin.js           ← Cria primeiro usuário admin
└── render.yaml                 ← Config de deploy
```

---

## Desenvolvimento local

```bash
# 1. Banco de dados
cp gateway/.env.example gateway/.env
# Edite DATABASE_URL com seu Neon ou PostgreSQL local

# 2. Gateway
cd gateway && npm install && npm run dev

# 3. App1 (em outro terminal)
cd apps/app1-dashboard && npm install && npm run dev

# 4. Seed admin
cd gateway && node ../scripts/seed-admin.js
```
