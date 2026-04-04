/**
 * ─────────────────────────────────────────────────────────────────
 * SaaS Platform — License SDK
 * Versão: 1.0.0
 *
 * Use este arquivo no SEU SOFTWARE para validar licenças em tempo real.
 *
 * Instalação:
 *   Copie este arquivo para o seu projeto ou instale via npm:
 *   npm install node-machine-id  (para obter o ID de máquina)
 *
 * Uso básico:
 *   const license = new LicenseClient('https://seudominio.com');
 *   const result  = await license.validate('XXXX-XXXX-XXXX-XXXX');
 *   if (!result.valid) { showError(result.error); process.exit(1); }
 * ─────────────────────────────────────────────────────────────────
 */

const https = require('https');
const http  = require('http');
const os    = require('os');
const crypto = require('crypto');
const fs    = require('fs');
const path  = require('path');

// ─────────────────────────────────────────────────────────────────
// LicenseClient
// ─────────────────────────────────────────────────────────────────
class LicenseClient {
  /**
   * @param {string} gatewayUrl - URL base do seu gateway (sem barra final)
   *   Exemplo: 'https://seudominio.com' ou 'http://localhost:3000'
   * @param {object} options
   * @param {string} options.cacheFile  - Caminho do cache local (padrão: .license_cache)
   * @param {number} options.cacheTTL   - TTL do cache em segundos (padrão: 3600 = 1h)
   * @param {boolean} options.offlineMode - Aceitar cache offline quando servidor indisponível
   */
  constructor(gatewayUrl, options = {}) {
    this.gatewayUrl  = gatewayUrl.replace(/\/$/, '');
    this.cacheFile   = options.cacheFile  || path.join(os.tmpdir(), '.saas_license_cache');
    this.cacheTTL    = options.cacheTTL   ?? 3600;
    this.offlineMode = options.offlineMode ?? true;
  }

  // ── Validate a license key ─────────────────────────────────────
  async validate(licenseKey, options = {}) {
    const machineId   = options.machineId   || this._getMachineId();
    const machineName = options.machineName || os.hostname();

    // 1. Try server validation
    try {
      const result = await this._request('POST', '/api/licenses/validate', {
        key: licenseKey,
        machine_id:   machineId,
        machine_name: machineName,
      });

      // Cache successful validation
      if (result.valid) {
        this._writeCache({ licenseKey, result, validatedAt: Date.now() });
      }

      return result;

    } catch (err) {
      // 2. If server unreachable + offline mode enabled → check cache
      if (this.offlineMode && this._isNetworkError(err)) {
        const cached = this._readCache();
        if (cached && cached.licenseKey === licenseKey) {
          const age = (Date.now() - cached.validatedAt) / 1000;
          if (age < this.cacheTTL) {
            return {
              ...cached.result,
              _fromCache: true,
              _cacheAge: Math.round(age),
            };
          }
        }
        return {
          valid: false,
          error: 'Servidor indisponível e cache expirado. Conecte-se à internet.',
          code: 'OFFLINE_CACHE_EXPIRED',
        };
      }
      throw err;
    }
  }

  // ── Check if license is still valid (lightweight poll) ────────
  async check(licenseKey) {
    return this.validate(licenseKey, { skipMachineCheck: true });
  }

  // ── Generate a machine fingerprint ────────────────────────────
  _getMachineId() {
    // Try to read a stored persistent ID first
    const idFile = path.join(os.tmpdir(), '.saas_machine_id');
    if (fs.existsSync(idFile)) {
      return fs.readFileSync(idFile, 'utf-8').trim();
    }

    // Generate from system info
    const info = [
      os.hostname(),
      os.platform(),
      os.arch(),
      os.cpus()?.[0]?.model || '',
      Object.values(os.networkInterfaces())
        .flat()
        .filter(n => !n.internal && n.mac !== '00:00:00:00:00:00')
        .map(n => n.mac)
        .sort()
        .join(','),
    ].join('|');

    const id = crypto.createHash('sha256').update(info).digest('hex').slice(0, 32);
    fs.writeFileSync(idFile, id, 'utf-8');
    return id;
  }

  // ── HTTP request helper ────────────────────────────────────────
  _request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url      = new URL(this.gatewayUrl + path);
      const lib      = url.protocol === 'https:' ? https : http;
      const payload  = body ? JSON.stringify(body) : null;

      const options = {
        hostname: url.hostname,
        port:     url.port || (url.protocol === 'https:' ? 443 : 80),
        path:     url.pathname + url.search,
        method,
        headers: {
          'Content-Type':  'application/json',
          'User-Agent':    'LicenseSDK/1.0',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
        timeout: 8000,
      };

      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('Invalid JSON response from license server'));
          }
        });
      });

      req.on('error',   reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('NETWORK_TIMEOUT')); });

      if (payload) req.write(payload);
      req.end();
    });
  }

  _isNetworkError(err) {
    return ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'NETWORK_TIMEOUT'].some(
      c => err.message?.includes(c) || err.code === c
    );
  }

  _writeCache(data) {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(data), 'utf-8');
    } catch { /* ignore cache write errors */ }
  }

  _readCache() {
    try {
      if (!fs.existsSync(this.cacheFile)) return null;
      return JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));
    } catch { return null; }
  }
}

// ─────────────────────────────────────────────────────────────────
// Python equivalent (copy to your Python project)
// ─────────────────────────────────────────────────────────────────
const PYTHON_SDK = `
# license_client.py — Python SDK
import hashlib, json, os, platform, socket, urllib.request, urllib.error, time

class LicenseClient:
    def __init__(self, gateway_url, cache_ttl=3600, offline_mode=True):
        self.gateway_url = gateway_url.rstrip('/')
        self.cache_ttl   = cache_ttl
        self.offline_mode = offline_mode
        self._cache_file = os.path.join(os.path.expanduser('~'), '.saas_license_cache')

    def validate(self, license_key, machine_name=None):
        machine_id   = self._get_machine_id()
        machine_name = machine_name or socket.gethostname()

        try:
            payload = json.dumps({
                'key': license_key,
                'machine_id': machine_id,
                'machine_name': machine_name,
            }).encode('utf-8')

            req = urllib.request.Request(
                f'{self.gateway_url}/api/licenses/validate',
                data=payload,
                headers={'Content-Type': 'application/json', 'User-Agent': 'LicenseSDK-Python/1.0'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=8) as res:
                result = json.loads(res.read().decode())

            if result.get('valid'):
                self._write_cache({'license_key': license_key, 'result': result, 'validated_at': time.time()})
            return result

        except (urllib.error.URLError, TimeoutError, OSError):
            if self.offline_mode:
                cached = self._read_cache()
                if cached and cached.get('license_key') == license_key:
                    age = time.time() - cached.get('validated_at', 0)
                    if age < self.cache_ttl:
                        return {**cached['result'], '_from_cache': True}
            return {'valid': False, 'error': 'Servidor indisponível', 'code': 'OFFLINE'}

    def _get_machine_id(self):
        id_file = os.path.join(os.path.expanduser('~'), '.saas_machine_id')
        if os.path.exists(id_file):
            with open(id_file) as f: return f.read().strip()
        info = platform.node() + platform.system() + platform.machine() + platform.processor()
        machine_id = hashlib.sha256(info.encode()).hexdigest()[:32]
        with open(id_file, 'w') as f: f.write(machine_id)
        return machine_id

    def _write_cache(self, data):
        try:
            with open(self._cache_file, 'w') as f: json.dump(data, f)
        except: pass

    def _read_cache(self):
        try:
            if os.path.exists(self._cache_file):
                with open(self._cache_file) as f: return json.load(f)
        except: pass
        return None


# ── Usage example ──────────────────────────────────────────────
if __name__ == '__main__':
    client = LicenseClient('https://seudominio.com')
    result = client.validate('XXXX-XXXX-XXXX-XXXX')

    if not result['valid']:
        print(f"Licença inválida: {result['error']}")
        exit(1)

    print(f"✅ Licença válida — {result['license']['product']}")
    print(f"   Cliente:   {result['license']['customer']}")
    print(f"   Expira em: {result['license'].get('expires_at', 'Nunca (vitalícia)')}")
`;

// ─────────────────────────────────────────────────────────────────
// Usage examples
// ─────────────────────────────────────────────────────────────────
async function exampleUsage() {
  const client = new LicenseClient('https://seudominio.com', {
    offlineMode: true,
    cacheTTL: 3600, // 1 hour offline grace period
  });

  // ── Validate on startup ──────────────────────────────────────
  const licenseKey = process.env.LICENSE_KEY
    || readStoredKey()
    || promptUserForKey();

  console.log('Validando licença...');
  const result = await client.validate(licenseKey);

  if (!result.valid) {
    console.error(`\n❌ Licença inválida: ${result.error}`);
    console.error(`   Código: ${result.code}`);

    if (result.code === 'PENDING_PAYMENT') {
      console.error('   Acesse https://seudominio.com/app1/checkout para finalizar o pagamento.');
    } else if (result.code === 'MAX_ACTIVATIONS_REACHED') {
      console.error('   Limite de ativações atingido. Contate o suporte.');
    } else if (result.code === 'EXPIRED') {
      console.error('   Renove sua licença em https://seudominio.com/app1/checkout');
    }

    process.exit(1);
  }

  const lic = result.license;
  console.log(`✅ Licença válida${result._fromCache ? ' (cache offline)' : ''}`);
  console.log(`   Produto:   ${lic.product}`);
  console.log(`   Cliente:   ${lic.customer}`);
  console.log(`   Expira em: ${lic.expires_at || 'Nunca (vitalícia)'}`);
  console.log(`   Ativações: ${lic.activations_used}/${lic.activations_max}`);

  // ── Periodic re-validation (every 24h) ──────────────────────
  setInterval(async () => {
    const recheck = await client.validate(licenseKey);
    if (!recheck.valid) {
      console.error('Licença inválida. Encerrando...');
      process.exit(1);
    }
  }, 24 * 60 * 60 * 1000);
}

function readStoredKey() {
  const file = path.join(os.homedir(), '.myapp_license');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8').trim() : null;
}

function promptUserForKey() {
  // In a real app: show a dialog box
  return process.env.LICENSE_KEY || '';
}

module.exports = { LicenseClient };

// Uncomment to run example:
// exampleUsage().catch(console.error);
