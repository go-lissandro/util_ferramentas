#!/bin/bash
# ─────────────────────────────────────────────────────────
# scripts/setup.sh — One-command local environment setup
# Usage: chmod +x scripts/setup.sh && ./scripts/setup.sh
# ─────────────────────────────────────────────────────────

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  🚀 SaaS Platform — Local Setup${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# ── Check prerequisites ──────────────────────────────────
echo -e "${YELLOW}► Checking prerequisites...${NC}"

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}✗ $1 is not installed. Please install it first.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ $1 found${NC}"
}

check_command node
check_command npm
check_command docker
check_command docker compose

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}✗ Node.js 20+ required. Current: $(node -v)${NC}"
  exit 1
fi

# ── Setup .env files ────────────────────────────────────
echo -e "\n${YELLOW}► Setting up environment files...${NC}"

if [ ! -f "gateway/.env" ]; then
  cp gateway/.env.example gateway/.env
  echo -e "${GREEN}✓ Created gateway/.env from .env.example${NC}"
  echo -e "${YELLOW}  ⚠ Review gateway/.env and update secrets before production!${NC}"
else
  echo -e "${GREEN}✓ gateway/.env already exists${NC}"
fi

if [ ! -f "apps/app2-urlshortener/.env" ]; then
  cat > apps/app2-urlshortener/.env << 'EOF'
PORT=4001
NODE_ENV=development
DATABASE_URL=postgresql://saas_user:saas_password@localhost:5432/saas_platform
BASE_URL=http://localhost:3000/app2
EOF
  echo -e "${GREEN}✓ Created apps/app2-urlshortener/.env${NC}"
fi

# ── Start infrastructure ─────────────────────────────────
echo -e "\n${YELLOW}► Starting Docker services (PostgreSQL + Redis)...${NC}"
docker compose up -d postgres redis

echo -e "${YELLOW}  Waiting for PostgreSQL to be ready...${NC}"
until docker compose exec -T postgres pg_isready -U saas_user -d saas_platform &> /dev/null; do
  sleep 1
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# ── Install dependencies ─────────────────────────────────
echo -e "\n${YELLOW}► Installing dependencies...${NC}"

echo "  Installing gateway..."
(cd gateway && npm install --silent)
echo -e "${GREEN}✓ Gateway deps installed${NC}"

echo "  Installing app1-dashboard..."
(cd apps/app1-dashboard && npm install --silent)
echo -e "${GREEN}✓ App1 deps installed${NC}"

echo "  Installing app2-urlshortener..."
(cd apps/app2-urlshortener && npm install --silent)
(cd apps/app2-urlshortener/client && npm install --silent)
echo -e "${GREEN}✓ App2 deps installed${NC}"

# ── Done ─────────────────────────────────────────────────
echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Setup complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Start all services:  ${CYAN}npm run dev${NC}"
echo ""
echo -e "  URLs:"
echo -e "  • Gateway:     ${CYAN}http://localhost:3000${NC}"
echo -e "  • App1:        ${CYAN}http://localhost:3000/app1${NC}"
echo -e "  • App2:        ${CYAN}http://localhost:3000/app2${NC}"
echo -e "  • Health:      ${CYAN}http://localhost:3000/health${NC}"
echo ""
echo -e "  To stop infrastructure: ${YELLOW}npm run docker:down${NC}"
echo ""
