"""
TruthStamp Backend — Stellar
------------------------------
Registro y verificacion de contenido via Stellar ManageData.

Registro:      POST /api/register  { sha256, phash, filename, journalist_address, signed_tx }
Verificacion:  GET  /api/verify/<sha256>
Recientes:     GET  /api/registrations
Periodistas:   GET  /api/journalists  |  POST /api/journalists
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time
from collections import defaultdict

app = Flask(__name__)
CORS(app)

# ─── Rate limiting manual (en memoria) ───

_request_log = defaultdict(list)  # ip -> [timestamps]
RATE_LIMIT_MAX = 10              # requests
RATE_LIMIT_WINDOW = 60           # segundos

def _rate_limit(ip: str) -> bool:
    """Retorna True si la IP excedio el limite."""
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    _request_log[ip] = [t for t in _request_log[ip] if t > window_start]
    _request_log[ip].append(now)
    return len(_request_log[ip]) > RATE_LIMIT_MAX

@app.before_request
def check_rate_limit():
    if request.endpoint in ("register", "verify", "registrations", "add_journalist"):
        ip = request.remote_addr or "unknown"
        if _rate_limit(ip):
            return jsonify({"error": "demasiadas solicitudes — espera unos segundos"}), 429

# ─── Importar Stellar service ───

try:
    from stellar_service import (
        register_content as stellar_register,
        verify_content   as stellar_verify,
        get_account_registrations,
        submit_signed_transaction,
        verify_hash_across_journalists,
    )
    STELLAR_AVAILABLE = True
except Exception as e:
    STELLAR_AVAILABLE = False
    _STELLAR_ERROR = str(e)

# ─── Registro de periodistas (en memoria) ───

KNOWN_JOURNALISTS: list[str] = []

# Cargar la cuenta registry historica si existe
_registry_key = os.getenv("REGISTRY_PUBLIC_KEY", "").strip()
if _registry_key:
    KNOWN_JOURNALISTS.append(_registry_key)


# ─── Endpoints ───

@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "stellar_available": STELLAR_AVAILABLE,
        "stellar_network": "testnet",
        "rate_limit_window_s": RATE_LIMIT_WINDOW,
        "journalists_tracked": len(KNOWN_JOURNALISTS),
    })


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    sha256   = (data.get("sha256") or data.get("hash", "")).strip().lower()
    phash    = (data.get("phash") or "").strip().lower()
    filename = data.get("filename", "unknown")[:64]
    signed_tx = data.get("signed_tx", "").strip()
    journalist = (data.get("journalist_address") or "").strip()

    if not sha256 or len(sha256) != 64:
        return jsonify({"error": "SHA-256 invalido — debe ser 64 chars hex"}), 400

    if not STELLAR_AVAILABLE:
        return jsonify({"error": "Stellar no disponible", "detail": _STELLAR_ERROR}), 503

    try:
        # Si viene una tx firmada por Freighter, la submitimos
        if signed_tx:
            result = submit_signed_transaction(signed_tx)
            result["success"] = True
            result["sha256"]  = sha256
            result["phash"]   = phash
            result["filename"] = filename
            result["journalist_address"] = journalist
            if "tx_id" in result and "txHash" not in result:
                result["txHash"] = result["tx_id"]

            # Registrar al periodista si es nuevo
            if journalist and journalist not in KNOWN_JOURNALISTS:
                KNOWN_JOURNALISTS.append(journalist)

            return jsonify(result)

        # Fallback: registro via backend (cuenta registry central)
        result = stellar_register(sha256, filename)
        result["success"] = True
        result["sha256"]  = sha256
        result["phash"]   = phash
        result["filename"] = filename
        if "tx_id" in result and "txHash" not in result:
            result["txHash"] = result["tx_id"]
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": "no se pudo registrar", "detail": str(e)}), 503


@app.route("/api/verify/<file_hash>")
def verify(file_hash):
    file_hash = file_hash.strip().lower()

    if len(file_hash) != 64:
        return jsonify({"error": "hash invalido"}), 400

    if not STELLAR_AVAILABLE:
        return jsonify({"authentic": False, "error": "Stellar no disponible"}), 503

    try:
        # Buscar en cuenta registry + cuentas de periodistas conocidos
        result = verify_hash_across_journalists(file_hash, KNOWN_JOURNALISTS)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": "no se pudo verificar", "detail": str(e)}), 503


@app.route("/api/registrations")
def registrations():
    if not STELLAR_AVAILABLE:
        return jsonify([])

    try:
        result = get_account_registrations()
        return jsonify(result)
    except Exception:
        return jsonify([])


@app.route("/api/journalists", methods=["GET", "POST"])
def journalists():
    if request.method == "POST":
        data = request.get_json(force=True)
        address = (data.get("address") or "").strip()
        if not address:
            return jsonify({"error": "direccion requerida"}), 400
        if address not in KNOWN_JOURNALISTS:
            KNOWN_JOURNALISTS.append(address)
        return jsonify({"registered": True, "total": len(KNOWN_JOURNALISTS)})

    return jsonify({
        "journalists": KNOWN_JOURNALISTS,
        "total": len(KNOWN_JOURNALISTS),
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
