-- ─────────────────────────────────────────────────────────────────
-- migrations/002_licenses.sql
-- License management + PIX payment tables
-- ─────────────────────────────────────────────────────────────────

-- ── Products (what you sell) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  price_cents   INTEGER NOT NULL,            -- price in BRL cents (e.g., 9700 = R$97,00)
  currency      VARCHAR(3) NOT NULL DEFAULT 'BRL',
  license_type  VARCHAR(50) NOT NULL DEFAULT 'perpetual', -- perpetual | yearly | monthly
  duration_days INTEGER,                     -- NULL = perpetual
  max_activations INTEGER NOT NULL DEFAULT 1,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Licenses ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS licenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key     VARCHAR(50) UNIQUE NOT NULL,     -- XXXX-XXXX-XXXX-XXXX
  product_id      UUID NOT NULL REFERENCES products(id),

  -- Customer info (does not require a user account)
  customer_name   VARCHAR(255) NOT NULL,
  customer_email  VARCHAR(255) NOT NULL,
  customer_doc    VARCHAR(20),                     -- CPF or CNPJ

  -- Status lifecycle: pending_payment → active → expired | revoked
  status          VARCHAR(30) NOT NULL DEFAULT 'pending_payment',

  -- Activation control
  max_activations INTEGER NOT NULL DEFAULT 1,
  activations_count INTEGER NOT NULL DEFAULT 0,

  -- Validity
  activated_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,                     -- NULL = lifetime

  -- Admin notes
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── License activations (tracks which machines use a license) ─────
CREATE TABLE IF NOT EXISTS license_activations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id    UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  machine_id    VARCHAR(255) NOT NULL,             -- hardware fingerprint or device ID
  machine_name  VARCHAR(255),
  ip_address    VARCHAR(50),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(license_id, machine_id)
);

-- ── PIX Payments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pix_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id      UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,

  -- Amount
  amount_cents    INTEGER NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'BRL',

  -- PIX data
  pix_type        VARCHAR(20) NOT NULL DEFAULT 'static', -- static | dynamic
  txid            VARCHAR(100),                   -- gateway transaction ID
  end_to_end_id   VARCHAR(100),                   -- PIX E2E identifier
  pix_key         VARCHAR(255),                   -- pix key used (email/cpf/phone/random)
  qrcode_base64   TEXT,                           -- QR code image as base64
  qrcode_text     TEXT,                           -- "Copia e Cola" string
  payload_url     TEXT,                           -- gateway payload URL (dynamic PIX)

  -- Gateway info
  gateway         VARCHAR(50) NOT NULL DEFAULT 'manual', -- manual | asaas | efipay | mercadopago
  gateway_id      VARCHAR(255),                   -- gateway's own ID for this charge
  gateway_payload JSONB DEFAULT '{}',             -- raw gateway response

  -- Status: pending → paid | expired | cancelled
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at         TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Audit log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS license_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id  UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  event_type  VARCHAR(50) NOT NULL,  -- created | activated | revoked | validated | payment_confirmed
  actor       VARCHAR(100),          -- 'admin' | 'webhook' | 'system' | email
  description TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_licenses_key           ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_email         ON licenses(customer_email);
CREATE INDEX IF NOT EXISTS idx_licenses_status        ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_pix_payments_license   ON pix_payments(license_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_txid      ON pix_payments(txid);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status    ON pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_license_events_license ON license_events(license_id);
CREATE INDEX IF NOT EXISTS idx_activations_license    ON license_activations(license_id);
