# 💰 Sistema de Licenciamento com PIX — Guia Completo

> Gerencie licenças do seu software com pagamento via PIX brasileiro.
> Sem mensalidade de gateway. Confirmação manual ou automática.

---

## 🗺 Visão Geral do Fluxo

```
CLIENTE                         SEU SISTEMA
   │                                 │
   │  1. Acessa /checkout.html       │
   │  ──────────────────────────────►│
   │                                 │
   │  2. Preenche nome + email       │
   │  ──────────────────────────────►│
   │                                 │  POST /api/licenses/checkout
   │                                 │  → cria licença (status: pending_payment)
   │                                 │  → gera QR Code PIX
   │                                 │
   │  3. Recebe QR Code PIX          │
   │  ◄──────────────────────────────│
   │                                 │
   │  4. Paga no banco               │
   │  (fora do sistema)              │
   │                                 │
   ├─── MODO MANUAL ─────────────────┤
   │                                 │  Admin vê pagamento no banco
   │                                 │  Admin clica "Confirmar Pagamento"
   │                                 │  → licença ativa automaticamente
   │                                 │
   ├─── MODO AUTOMÁTICO (Asaas) ─────┤
   │                                 │  Asaas detecta PIX recebido
   │                                 │  Webhook → POST /api/webhooks/pix/asaas
   │                                 │  → licença ativa automaticamente
   │                                 │
   │  5. Recebe email com chave      │
   │  ◄──────────────────────────────│
   │                                 │
   │  6. Ativa no software           │
   │  (insere a chave)               │
   │                                 │  GET /api/licenses/validate/:key
   │                                 │  → válida + registra máquina
```

---

## 🚀 Setup em 5 Minutos (Modo Manual — Zero Custo)

O modo manual usa **PIX estático** — você gera o QR code com sua própria
chave PIX e confirma os pagamentos manualmente pelo painel admin.

### 1. Configure sua chave PIX

No arquivo `gateway/.env`:

```bash
PIX_KEY=seu@email.com           # sua chave PIX (email, CPF, telefone ou aleatória)
PIX_MERCHANT_NAME=MINHA EMPRESA # aparece no QR code (sem acentos, máx 25 chars)
PIX_MERCHANT_CITY=SAO PAULO     # cidade (sem acentos, máx 15 chars)
```

### 2. Crie um produto no painel admin

1. Acesse `http://localhost:3000/app1` e faça login
2. Menu **Licenças** → botão **"Nova Licença"**
3. Primeiro, crie um produto via API (ou use o painel):

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meu Software Pro",
    "description": "Licença vitalícia para 1 PC",
    "price_cents": 19700,
    "license_type": "perpetual",
    "max_activations": 1
  }'
```

### 3. Compartilhe a página de checkout

Envie este link para seus clientes:
```
http://seudominio.com/checkout.html
```

A página já está em português, com QR Code PIX e polling automático.

### 4. Confirme o pagamento

Quando receber o PIX no banco:
1. Vá em **Licenças** no painel admin
2. Clique no ícone 👁 da licença
3. Clique em **"Confirmar Pagamento Manualmente"**
4. A licença é ativada instantaneamente

---

## ⚡ Automação com Asaas (Recomendado para escala)

O Asaas detecta o pagamento PIX automaticamente e ativa a licença via webhook.
**Conta grátis**, sem mensalidade — cobra apenas 0,99% por transação.

### Setup

```bash
# 1. Crie conta em https://www.asaas.com (grátis)
# 2. Vá em Integrações → API → gerar token

# gateway/.env
ASAAS_API_KEY=aact_YourKeyHere
ASAAS_SANDBOX=true    # use false em produção
ASAAS_WEBHOOK_TOKEN=  # opcional: token para verificar assinatura do webhook
```

### Configurar webhook no Asaas

No painel Asaas → Configurações → Webhooks → Adicionar:
```
URL:    https://seudominio.com/api/webhooks/pix/asaas
Evento: PAYMENT_RECEIVED
```

### Testar no sandbox

```bash
# Simular pagamento (sandbox Asaas)
curl -X POST https://sandbox.asaas.com/api/v3/payments/{id}/receiveInCash \
  -H "access_token: $ASAAS_API_KEY"
```

---

## 🔐 Integrar no Seu Software

### Node.js / Electron

```javascript
const { LicenseClient } = require('./license-client.js');

// Na inicialização do app
async function checkLicense() {
  const client = new LicenseClient('https://seudominio.com');
  
  // Lê a chave armazenada pelo usuário
  const key = store.get('licenseKey'); // electron-store, localStorage, etc.
  
  if (!key) {
    showLicenseDialog();
    return;
  }
  
  const result = await client.validate(key);
  
  if (!result.valid) {
    if (result.code === 'MAX_ACTIVATIONS_REACHED') {
      dialog.showErrorBox('Licença', 'Limite de máquinas atingido.\nContate o suporte.');
    } else {
      showLicenseDialog(result.error);
    }
    app.quit();
    return;
  }
  
  console.log(`✅ Licença: ${result.license.product} (${result.license.customer})`);
}

app.whenReady().then(checkLicense);
```

### Python / PyInstaller

```python
from license_client import require_license
import sys

# Uma linha — valida e encerra se inválida
license = require_license('https://seudominio.com')

# Continue com o app normalmente
print(f"Bem-vindo, {license['customer']}!")
```

### Python com input de chave pelo usuário

```python
from license_client import LicenseClient
import os, sys

def activate():
    key = input("Digite sua chave de licença: ").strip()
    client = LicenseClient('https://seudominio.com')
    result = client.validate(key)
    
    if result['valid']:
        # Salvar chave para próximas execuções
        with open(os.path.expanduser('~/.myapp_key'), 'w') as f:
            f.write(key)
        print("✅ Ativado com sucesso!")
    else:
        print(f"❌ {result['error']}")
        sys.exit(1)

# Verificar se já tem chave salva
key_file = os.path.expanduser('~/.myapp_key')
if os.path.exists(key_file):
    with open(key_file) as f:
        saved_key = f.read().strip()
    
    client = LicenseClient('https://seudominio.com')
    result = client.validate(saved_key)
    
    if not result['valid']:
        os.remove(key_file)  # remove chave inválida
        activate()           # pedir nova chave
else:
    activate()
```

### PHP

```php
<?php
class LicenseClient {
    private $gatewayUrl;
    private $cacheFile;
    private $cacheTtl;
    
    public function __construct(string $gatewayUrl, int $cacheTtl = 3600) {
        $this->gatewayUrl = rtrim($gatewayUrl, '/');
        $this->cacheFile  = sys_get_temp_dir() . '/.saas_license_cache';
        $this->cacheTtl   = $cacheTtl;
    }
    
    public function validate(string $licenseKey): array {
        $machineId = $this->getMachineId();
        
        $ch = curl_init($this->gatewayUrl . '/api/licenses/validate');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode(['key' => $licenseKey, 'machine_id' => $machineId]),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
        ]);
        
        $response = curl_exec($ch);
        $error    = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            // offline mode: try cache
            $cached = $this->readCache();
            if ($cached && $cached['license_key'] === $licenseKey) {
                if (time() - $cached['validated_at'] < $this->cacheTtl) {
                    return array_merge($cached['result'], ['_from_cache' => true]);
                }
            }
            return ['valid' => false, 'error' => 'Servidor indisponível', 'code' => 'OFFLINE'];
        }
        
        $result = json_decode($response, true);
        if ($result['valid']) {
            $this->writeCache(['license_key' => $licenseKey, 'result' => $result, 'validated_at' => time()]);
        }
        return $result;
    }
    
    private function getMachineId(): string {
        $idFile = sys_get_temp_dir() . '/.saas_machine_id';
        if (file_exists($idFile)) return trim(file_get_contents($idFile));
        $id = substr(hash('sha256', php_uname() . phpversion()), 0, 32);
        file_put_contents($idFile, $id);
        return $id;
    }
    
    private function writeCache(array $data): void {
        file_put_contents($this->cacheFile, json_encode($data));
    }
    
    private function readCache(): ?array {
        if (!file_exists($this->cacheFile)) return null;
        return json_decode(file_get_contents($this->cacheFile), true);
    }
}

// Uso
$license = new LicenseClient('https://seudominio.com');
$result  = $license->validate('XXXX-XXXX-XXXX-XXXX');

if (!$result['valid']) {
    die("Licença inválida: " . $result['error']);
}

echo "✅ " . $result['license']['product'];
?>
```

---

## 🎛 Painel Admin — Referência

### Tela de Licenças (`/app1/licenses`)

| Coluna | Descrição |
|--------|-----------|
| Licença | Chave no formato `XXXX-XXXX-XXXX-XXXX` |
| Cliente | Nome e email |
| Produto | Nome do produto |
| Valor | Preço em R$ |
| Status | Ativa / Aguard. Pagamento / Expirada / Revogada |
| Ações | Ver detalhes, confirmar pagamento, revogar |

### Status das licenças

| Status | Significado |
|--------|-------------|
| `pending_payment` | QR Code gerado, aguardando pagamento |
| `active` | Licença paga e funcional |
| `expired` | Prazo de validade vencido |
| `revoked` | Revogada manualmente pelo admin |
| `suspended` | Suspensa temporariamente |

### Ações disponíveis por status

| Status | Confirmar Pgto | Ativar | Revogar |
|--------|---------------|--------|---------|
| `pending_payment` | ✅ | ✅ | ✅ |
| `active` | — | — | ✅ |
| `expired` | — | ✅ (reativar) | ✅ |
| `revoked` | — | — | — |

---

## 📡 API de Licenças — Referência

### Endpoints Públicos (sem autenticação)

```
GET  /api/licenses/products           → lista produtos ativos
POST /api/licenses/checkout           → inicia compra, retorna QR PIX
GET  /api/licenses/status/:licenseId  → status do pagamento (polling)
GET  /api/licenses/validate/:key      → valida chave (software)
POST /api/licenses/validate           → valida chave via POST (seguro)
```

### Endpoints Admin (requer JWT de admin)

```
GET    /api/admin/products            → lista produtos
POST   /api/admin/products            → cria produto
PATCH  /api/admin/products/:id        → edita produto

GET    /api/admin/licenses            → lista licenças (filtros: status, search)
GET    /api/admin/licenses/:id        → detalhe + pagamentos + eventos + máquinas
POST   /api/admin/licenses            → cria licença manualmente
POST   /api/admin/licenses/:id/activate         → ativa licença
POST   /api/admin/licenses/:id/revoke           → revoga licença
POST   /api/admin/licenses/:id/confirm-payment  → confirma pagamento manual
DELETE /api/admin/licenses/:id/activations/:mid → desativa uma máquina
GET    /api/admin/stats               → resumo: totais + receita
```

### Webhooks (chamados pelo gateway de pagamento)

```
POST /api/webhooks/pix/asaas   → confirmação automática Asaas
POST /api/webhooks/pix/efipay  → confirmação automática EFI Pay
```

---

## 💡 Casos de Uso Comuns

### Criar e enviar licença manualmente (pagamento offline)

```bash
# 1. Criar produto
TOKEN="eyJhbGciOiJIUzI1NiJ9..."

curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Software Pro","price_cents":9700,"license_type":"perpetual","max_activations":1}'

# 2. Criar e ativar licença imediatamente
curl -X POST http://localhost:3000/api/admin/licenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "uuid-do-produto",
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "activate_now": true,
    "notes": "Pagamento recebido via transferência"
  }'
# Retorna: { license_key: "A3KM-9XZP-QWER-7YTU" }
```

### Gerar relatório de receita

```bash
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer $TOKEN"
# Retorna: totais por status + receita total + receita do mês
```

### Validar licença manualmente (teste)

```bash
curl http://localhost:3000/api/licenses/validate/A3KM-9XZP-QWER-7YTU
# { valid: true, license: { product, customer, expires_at, ... } }
```

---

## 🔒 Segurança

### Como as chaves são geradas

- Alphabet: `A-Z` (sem I e O) + `2-9` (sem 0 e 1) = 32 caracteres
- 16 caracteres × log₂(32) = **80 bits de entropia**
- Impossível de adivinhar por força bruta

### Proteção anti-sharing

O campo `machine_id` identifica cada computador que usa a licença.
Se `max_activations = 1`, apenas **um PC pode usar** a licença simultaneamente.

```bash
# Desativar uma máquina específica (admin)
curl -X DELETE http://localhost:3000/api/admin/licenses/:id/activations/:machineId \
  -H "Authorization: Bearer $TOKEN"
```

### Rate limiting

O endpoint `/api/licenses/validate` é protegido pelo rate limiter do gateway.
Configure `RATE_LIMIT_MAX_REQUESTS` no `.env` para evitar scraping de chaves.

---

## 📊 Modelo de Preço Sugerido

| Produto | Preço | Configuração recomendada |
|---------|-------|--------------------------|
| Licença Individual | R$ 97 | `perpetual`, `max_activations: 1` |
| Licença Empresa (5 PCs) | R$ 297 | `perpetual`, `max_activations: 5` |
| Assinatura Anual | R$ 197/ano | `yearly`, `duration_days: 365` |
| Assinatura Mensal | R$ 29/mês | `monthly`, `duration_days: 30` |

---

## 🐛 Troubleshooting

### QR Code não aparece na página de checkout

Verifique se `PIX_KEY` está configurado no `gateway/.env`.

### Licença não ativa após pagamento confirmado manualmente

Confirme que clicou em **"Confirmar Pagamento Manualmente"** no detalhe da licença
(ícone 👁 → botão verde).

### `MAX_ACTIVATIONS_REACHED` no software do cliente

1. Vá em Licenças → detalhes da licença
2. Seção "Máquinas Ativas"
3. Clique no botão para desativar a máquina antiga

### Webhook Asaas não está sendo recebido

```bash
# Verificar logs do gateway
docker compose logs gateway -f

# Testar webhook manualmente
curl -X POST http://localhost:3000/api/webhooks/pix/asaas \
  -H "Content-Type: application/json" \
  -d '{"event":"PAYMENT_RECEIVED","payment":{"id":"pay_123","externalReference":"SEU_TXID","status":"RECEIVED"}}'
```
