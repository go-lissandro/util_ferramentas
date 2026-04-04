#!/bin/bash
# ─────────────────────────────────────────────────────────────
# scripts/add-app.sh — Scaffold a new app in the platform
# Usage: ./scripts/add-app.sh app3 "My New App"
# ─────────────────────────────────────────────────────────────

set -e

APP_KEY="${1:-app3}"
APP_DESC="${2:-New App}"
APP_PORT="${3:-4002}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "\n${CYAN}🔧 Scaffolding new app: ${APP_KEY} — ${APP_DESC}${NC}\n"

APP_DIR="apps/${APP_KEY}"
mkdir -p "${APP_DIR}/src"

# ── package.json ─────────────────────────────────────────
cat > "${APP_DIR}/package.json" << EOF
{
  "name": "@saas-platform/${APP_KEY}",
  "version": "1.0.0",
  "scripts": {
    "dev":   "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-async-errors": "^3.1.1",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0"
  }
}
EOF

# ── Minimal Express server ───────────────────────────────
cat > "${APP_DIR}/src/server.ts" << EOF
import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: '${APP_KEY}' }));

// ── Your routes here ──────────────────────────────────
app.get('/', (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  const userId   = req.headers['x-user-id'];
  res.json({ message: 'Hello from ${APP_DESC}!', tenantId, userId });
});

const PORT = process.env.PORT || ${APP_PORT};
app.listen(PORT, () => console.log(\`🚀 ${APP_DESC} running on port \${PORT}\`));
EOF

# ── tsconfig ─────────────────────────────────────────────
cat > "${APP_DIR}/tsconfig.json" << EOF
{
  "compilerOptions": {
    "target": "ES2020", "module": "commonjs",
    "outDir": "./dist", "rootDir": "./src",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true
  },
  "include": ["src/**/*"], "exclude": ["node_modules"]
}
EOF

# ── .env ─────────────────────────────────────────────────
cat > "${APP_DIR}/.env" << EOF
PORT=${APP_PORT}
NODE_ENV=development
EOF

echo -e "${GREEN}✅ App scaffolded at: ${APP_DIR}${NC}"
echo ""
echo -e "  ${CYAN}Next steps:${NC}"
echo -e "  1. Add to gateway proxy registry in ${CYAN}gateway/src/proxy/proxyRouter.ts${NC}:"
echo -e "     {"
echo -e "       key: '${APP_KEY}',"
echo -e "       pathPrefix: '/${APP_KEY}',"
echo -e "       target: process.env.${APP_KEY^^}_URL || 'http://localhost:${APP_PORT}',"
echo -e "       protected: true,"
echo -e "       description: '${APP_DESC}',"
echo -e "     }"
echo ""
echo -e "  2. Add env var to ${CYAN}gateway/.env${NC}:"
echo -e "     ${APP_KEY^^}_URL=http://localhost:${APP_PORT}"
echo ""
echo -e "  3. Add to ${CYAN}render.yaml${NC} for deploy"
echo ""
echo -e "  4. Start developing: ${CYAN}cd ${APP_DIR} && npm install && npm run dev${NC}"
echo ""
