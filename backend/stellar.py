import requests
import base64

HORIZON_URL = "https://horizon-testnet.stellar.org"
STELLAR_EXPERT = "https://stellar.expert/explorer/testnet"

# Prefijo que usamos en ManageData — debe coincidir con el frontend
DATA_KEY_PREFIX = "ts:"


def _hash_to_data_key(hash_hex: str) -> str:
    """Convierte un SHA-256 hex en la ManageData key que usamos on-chain."""
    hash_bytes = bytes.fromhex(hash_hex)
    b64url = base64.urlsafe_b64encode(hash_bytes).rstrip(b"=").decode()
    return f"{DATA_KEY_PREFIX}{b64url}"


def _decode_data_value(raw_b64: str) -> tuple[str | None, str | None]:
    """Decodifica el valor ManageData → (registered_at, filename)."""
    try:
        # Padding de base64 estándar
        padded = raw_b64 + "=="
        decoded = base64.b64decode(padded).decode("utf-8", errors="replace")
        parts = decoded.split("|", 1)
        registered_at = parts[0] if parts else None
        filename = parts[1] if len(parts) > 1 else None
        return registered_at, filename
    except Exception:
        return None, None


def _get_account_raw(public_key: str) -> dict:
    """Llama a Horizon y devuelve el JSON de la cuenta."""
    resp = requests.get(
        f"{HORIZON_URL}/accounts/{public_key}",
        timeout=10,
        headers={"Accept": "application/json"},
    )
    resp.raise_for_status()
    return resp.json()


def verify_hash_on_account(hash_hex: str, public_key: str) -> dict:
    """
    Verifica si un hash SHA-256 está registrado en la cuenta Stellar dada.

    Retorna:
      { registered: bool, registered_at?, filename?, explorer_url? }
    """
    data_key = _hash_to_data_key(hash_hex)

    account = _get_account_raw(public_key)
    data = account.get("data", {})

    if data_key not in data:
        return {"registered": False}

    registered_at, filename = _decode_data_value(data[data_key])

    return {
        "registered": True,
        "registered_at": registered_at,
        "filename": filename,
        "account": public_key,
        "explorer_url": f"{STELLAR_EXPERT}/account/{public_key}",
    }


def get_account_stats(public_key: str) -> dict:
    """
    Devuelve estadísticas de registros de una cuenta:
    cuántos archivos registró y cuándo fue el más reciente.
    """
    account = _get_account_raw(public_key)
    data = account.get("data", {})

    registrations = []
    for key, raw_b64 in data.items():
        if not key.startswith(DATA_KEY_PREFIX):
            continue
        registered_at, filename = _decode_data_value(raw_b64)
        registrations.append({
            "filename": filename,
            "registered_at": registered_at,
        })

    registrations.sort(key=lambda r: r["registered_at"] or "", reverse=True)

    return {
        "account": public_key,
        "total_registrations": len(registrations),
        "latest": registrations[0] if registrations else None,
        "history": registrations,
        "explorer_url": f"{STELLAR_EXPERT}/account/{public_key}",
    }
