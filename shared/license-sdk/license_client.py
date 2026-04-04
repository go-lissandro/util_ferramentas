"""
─────────────────────────────────────────────────────────────────
SaaS Platform — License SDK para Python
Versão: 1.0.0

Use este arquivo no SEU SOFTWARE PYTHON para validar licenças.

Não requer dependências externas — usa apenas a stdlib do Python.

Uso:
    from license_client import LicenseClient

    client = LicenseClient('https://seudominio.com')
    result = client.validate('XXXX-XXXX-XXXX-XXXX')

    if not result['valid']:
        print(f"Licença inválida: {result['error']}")
        sys.exit(1)
─────────────────────────────────────────────────────────────────
"""

import hashlib
import json
import os
import platform
import socket
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional


class LicenseClient:
    """
    Cliente de validação de licenças para o SaaS Platform.

    Args:
        gateway_url:  URL base do gateway (ex: 'https://seudominio.com')
        cache_ttl:    Tempo em segundos que o cache offline é válido (padrão: 3600)
        offline_mode: Se True, usa cache quando servidor está offline (padrão: True)
        timeout:      Timeout em segundos para requisições (padrão: 8)
    """

    def __init__(
        self,
        gateway_url: str,
        cache_ttl: int = 3600,
        offline_mode: bool = True,
        timeout: int = 8,
    ):
        self.gateway_url  = gateway_url.rstrip("/")
        self.cache_ttl    = cache_ttl
        self.offline_mode = offline_mode
        self.timeout      = timeout
        self._cache_file  = Path.home() / ".saas_license_cache"
        self._id_file     = Path.home() / ".saas_machine_id"

    # ── Public API ─────────────────────────────────────────────────

    def validate(
        self,
        license_key: str,
        machine_name: Optional[str] = None,
    ) -> dict:
        """
        Valida uma chave de licença contra o servidor.

        Returns:
            dict com campos:
              valid (bool)     — se a licença é válida
              error (str)      — mensagem de erro se inválida
              code (str)       — código de erro
              license (dict)   — detalhes da licença (se válida)
              _from_cache (bool) — True se resultado veio do cache offline
        """
        machine_id   = self._get_machine_id()
        machine_name = machine_name or socket.gethostname()

        try:
            result = self._post("/api/licenses/validate", {
                "key":          license_key,
                "machine_id":   machine_id,
                "machine_name": machine_name,
            })

            if result.get("valid"):
                self._write_cache({
                    "license_key":  license_key,
                    "result":       result,
                    "validated_at": time.time(),
                })

            return result

        except (urllib.error.URLError, TimeoutError, OSError, ConnectionError) as e:
            if self.offline_mode:
                cached = self._read_cache()
                if cached and cached.get("license_key") == license_key:
                    age = time.time() - cached.get("validated_at", 0)
                    if age < self.cache_ttl:
                        return {
                            **cached["result"],
                            "_from_cache": True,
                            "_cache_age":  round(age),
                        }
                return {
                    "valid": False,
                    "error": "Servidor indisponível e cache expirado. Conecte-se à internet.",
                    "code":  "OFFLINE_CACHE_EXPIRED",
                }

            raise RuntimeError(f"Falha ao conectar ao servidor de licenças: {e}") from e

    def deactivate(self, license_key: str) -> bool:
        """Desativa esta máquina para a licença (antes de mover para outro PC)."""
        try:
            result = self._post("/api/licenses/deactivate", {
                "key":       license_key,
                "machine_id": self._get_machine_id(),
            })
            return result.get("success", False)
        except Exception:
            return False

    # ── Internal helpers ───────────────────────────────────────────

    def _post(self, path: str, body: dict) -> dict:
        url     = f"{self.gateway_url}{path}"
        payload = json.dumps(body).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent":   "LicenseSDK-Python/1.0",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=self.timeout) as res:
            return json.loads(res.read().decode("utf-8"))

    def _get_machine_id(self) -> str:
        if self._id_file.exists():
            return self._id_file.read_text().strip()

        # Build fingerprint from system info
        parts = [
            platform.node(),
            platform.system(),
            platform.machine(),
            platform.processor(),
            str(platform.python_version()),
        ]
        machine_id = hashlib.sha256("|".join(parts).encode()).hexdigest()[:32]
        self._id_file.write_text(machine_id)
        return machine_id

    def _write_cache(self, data: dict) -> None:
        try:
            self._cache_file.write_text(json.dumps(data))
        except Exception:
            pass

    def _read_cache(self) -> Optional[dict]:
        try:
            if self._cache_file.exists():
                return json.loads(self._cache_file.read_text())
        except Exception:
            pass
        return None


# ─────────────────────────────────────────────────────────────────
# Convenience function — validate and exit if invalid
# ─────────────────────────────────────────────────────────────────

def require_license(
    gateway_url: str,
    license_key: Optional[str] = None,
    env_var: str = "LICENSE_KEY",
    exit_on_fail: bool = True,
) -> dict:
    """
    Valida a licença e encerra o processo se inválida.

    Args:
        gateway_url:  URL do gateway
        license_key:  Chave de licença (ou None para ler de env_var)
        env_var:      Nome da variável de ambiente (padrão: LICENSE_KEY)
        exit_on_fail: Se True, chama sys.exit(1) se licença inválida

    Returns:
        dict com os detalhes da licença válida

    Example:
        license = require_license('https://seudominio.com')
        print(f"Bem-vindo, {license['customer']}!")
    """
    key = license_key or os.environ.get(env_var, "").strip()

    if not key:
        print(
            f"\n❌ Licença não encontrada.\n"
            f"   Defina {env_var}=XXXX-XXXX-XXXX-XXXX ou passe via argumento.\n"
            f"   Compre em: {gateway_url}/checkout.html\n"
        )
        if exit_on_fail:
            sys.exit(1)

    client = LicenseClient(gateway_url)
    result = client.validate(key)

    if not result["valid"]:
        error = result.get("error", "Desconhecido")
        code  = result.get("code", "")
        print(f"\n❌ Licença inválida: {error}")

        hints = {
            "PENDING_PAYMENT":        f"   Finalize o pagamento em: {gateway_url}/checkout.html",
            "MAX_ACTIVATIONS_REACHED": "   Limite de máquinas atingido. Contate o suporte.",
            "EXPIRED":                 f"   Renove sua licença em: {gateway_url}/checkout.html",
            "REVOKED":                 "   Esta licença foi revogada. Contate o suporte.",
            "NOT_FOUND":               "   Chave não encontrada. Verifique se digitou corretamente.",
        }
        if code in hints:
            print(hints[code])
        print()

        if exit_on_fail:
            sys.exit(1)

    lic = result.get("license", {})
    cached_notice = " (cache offline)" if result.get("_from_cache") else ""
    print(f"✅ Licença válida{cached_notice}")
    print(f"   Produto:   {lic.get('product', '-')}")
    print(f"   Cliente:   {lic.get('customer', '-')}")
    expires = lic.get("expires_at", None)
    print(f"   Expira em: {expires or 'Nunca (vitalícia)'}")
    print()

    return lic


# ─────────────────────────────────────────────────────────────────
# CLI — test from command line:
#   python license_client.py XXXX-XXXX-XXXX-XXXX https://seudominio.com
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python license_client.py <LICENSE_KEY> <GATEWAY_URL>")
        sys.exit(1)

    key = sys.argv[1]
    url = sys.argv[2]

    require_license(gateway_url=url, license_key=key)
