import { randomBytes } from 'crypto';

/**
 * Generates a license key in format: XXXX-XXXX-XXXX-XXXX
 * Uses crypto.randomBytes for cryptographic randomness.
 * Characters: uppercase A-Z + digits 2-9 (avoids 0/O and 1/I confusion)
 */
export function generateLicenseKey(): string {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = 4;
  const segmentLen = 4;

  const parts: string[] = [];
  for (let s = 0; s < segments; s++) {
    let segment = '';
    const bytes = randomBytes(segmentLen);
    for (let i = 0; i < segmentLen; i++) {
      segment += ALPHABET[bytes[i] % ALPHABET.length];
    }
    parts.push(segment);
  }

  return parts.join('-'); // e.g. "A3KM-9XZP-QWER-7YTU"
}

/**
 * Format cents to BRL currency string
 * e.g. 9700 → "R$ 97,00"
 */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/**
 * Build PIX static payload (EMV QRCode string — "Copia e Cola")
 * Follows BACEN's PIX specification.
 */
export function buildPixPayload(params: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount?: number;       // in BRL cents (omit for open amount)
  txId?: string;         // max 25 chars, alphanumeric only
  description?: string;  // max 72 chars
}): string {
  const { pixKey, merchantName, merchantCity, amount, txId, description } = params;

  const sanitize = (s: string, maxLen: number) =>
    s.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, maxLen).padEnd(0);

  const safeName = sanitize(merchantName, 25);
  const safeCity = sanitize(merchantCity, 15);
  const safeTxId = txId ? sanitize(txId, 25) : '***';
  const safeDesc = description ? sanitize(description, 72) : '';

  // Build EMV TLV fields
  const buildField = (id: string, value: string) =>
    `${id}${value.length.toString().padStart(2, '0')}${value}`;

  // 26 — Merchant Account Information
  const guiField  = buildField('00', 'BR.GOV.BCB.PIX');
  const keyField  = buildField('01', pixKey);
  const descField = safeDesc ? buildField('02', safeDesc) : '';
  const mai       = buildField('26', `${guiField}${keyField}${descField}`);

  // Amount field (54) — optional
  const amountField = amount
    ? buildField('54', (amount / 100).toFixed(2))
    : '';

  // 62 — Additional data (txid)
  const txidField = buildField('05', safeTxId);
  const additionalData = buildField('62', txidField);

  // Assemble payload (without CRC)
  const payload =
    buildField('00', '01') +           // Payload format indicator
    buildField('01', '12') +           // Point of initiation (12 = multiple use)
    mai +
    buildField('52', '0000') +         // MCC
    buildField('53', '986') +          // Currency (BRL = 986)
    amountField +
    buildField('58', 'BR') +           // Country
    buildField('59', safeName) +       // Merchant name
    buildField('60', safeCity) +       // Merchant city
    additionalData +
    '6304';                            // CRC placeholder

  // CRC-16/CCITT-FALSE
  const crc = crc16(payload);
  return payload + crc;
}

function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ((crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0'));
}
