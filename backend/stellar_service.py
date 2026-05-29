from stellar_sdk import Server, Keypair, TransactionBuilder, Network
from stellar_sdk.xdr import TransactionEnvelope
import os
import base64
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

HORIZON_URL = "https://horizon-testnet.stellar.org"
server = Server(HORIZON_URL)
SECRET = os.getenv("REGISTRY_SECRET_KEY")
PUBLIC = os.getenv("REGISTRY_PUBLIC_KEY")
NETWORK = Network.TESTNET_NETWORK_PASSPHRASE

if not SECRET or not PUBLIC:
    raise RuntimeError(
        "Faltan REGISTRY_PUBLIC_KEY / REGISTRY_SECRET_KEY en .env — "
        "ejecuta: python ../scripts/setup_stellar.py"
    )

kp = Keypair.from_secret(SECRET)


def _hash_to_key(file_hash: str) -> str:
    hash_bytes = bytes.fromhex(file_hash)
    b64 = base64.urlsafe_b64encode(hash_bytes).decode().rstrip("=")
    return f"ts:{b64}"[:64]


# ─── Registro via backend (cuenta central) ───

def register_content(file_hash: str, filename: str = "unknown") -> dict:
    key = _hash_to_key(file_hash)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    value = f"{timestamp}|{filename}"[:64]

    account = server.load_account(PUBLIC)

    tx = (
        TransactionBuilder(
            source_account=account,
            network_passphrase=NETWORK,
            base_fee=100,
        )
        .append_manage_data_op(data_name=key, data_value=value)
        .set_timeout(30)
        .build()
    )

    tx.sign(kp)
    response = server.submit_transaction(tx)

    return {
        "success": True,
        "tx_id": response["hash"],
        "key": key,
        "timestamp": timestamp,
        "ledger": response.get("ledger"),
    }


# ─── Submit de transaccion firmada por Freighter ───

def submit_signed_transaction(signed_xdr: str) -> dict:
    """
    Recibe un XDR firmado (por Freighter en el frontend) y lo
    envia a la red Stellar. La tx ya viene firmada — solo la submitimos.
    """
    try:
        tx_envelope = TransactionEnvelope.from_xdr(
            signed_xdr, NETWORK
        )
        response = server.submit_transaction(tx_envelope)

        # Extraer la key de ManageData del resultado
        result_meta = response.get("result_meta_xdr", "")
        ledger = response.get("ledger")

        return {
            "tx_id": response["hash"],
            "ledger": ledger,
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
    except Exception as e:
        # Si falla submit, intentamos dar mas info del error
        raise Exception(f"Error al submitir tx firmada: {str(e)}")


# ─── Verificacion en una cuenta ───

def verify_content(file_hash: str) -> dict:
    key = _hash_to_key(file_hash)

    account_data = server.accounts().account_id(PUBLIC).call()
    data_entries = account_data.get("data", {})

    if key in data_entries:
        raw = data_entries[key]
        decoded = base64.b64decode(raw).decode()

        parts = decoded.split("|", 1)
        timestamp = parts[0] if len(parts) > 0 else "unknown"
        filename = parts[1] if len(parts) > 1 else "unknown"

        return {
            "authentic": True,
            "timestamp": timestamp,
            "filename": filename,
            "tx_key": key,
            "registry_account": PUBLIC,
        }

    return {"authentic": False}


# ─── Verificacion en multiples cuentas ───

def verify_hash_across_journalists(
    file_hash: str, journalist_accounts: list[str]
) -> dict:
    """
    Busca el hash en la cuenta registry y en TODAS las cuentas
    de periodistas conocidos. Retorna el primer match.
    """
    key = _hash_to_key(file_hash)

    for account_id in journalist_accounts:
        try:
            account_data = server.accounts().account_id(account_id).call()
            data_entries = account_data.get("data", {})

            if key in data_entries:
                raw = data_entries[key]
                decoded = base64.b64decode(raw).decode()

                parts = decoded.split("|", 1)
                timestamp = parts[0] if len(parts) > 0 else "unknown"
                filename = parts[1] if len(parts) > 1 else "unknown"

                return {
                    "authentic": True,
                    "timestamp": timestamp,
                    "filename": filename,
                    "tx_key": key,
                    "journalist_account": account_id,
                }
        except Exception:
            continue  # cuenta no existe o error → siguiente

    return {"authentic": False}


# ─── Obtener registros ───

def get_account_registrations() -> list:
    account_data = server.accounts().account_id(PUBLIC).call()
    data_entries = account_data.get("data", {})

    registrations = []
    for key, raw_value in data_entries.items():
        if not key.startswith("ts:"):
            continue
        decoded = base64.b64decode(raw_value).decode()
        parts = decoded.split("|", 1)

        b64 = key[3:]
        b64_padded = b64 + "=" * (-len(b64) % 4)
        try:
            sha256 = base64.urlsafe_b64decode(b64_padded).hex()
        except Exception:
            sha256 = ""

        registrations.append({
            "sha256": sha256,
            "filename": parts[1] if len(parts) > 1 else "unknown",
            "timestamp": parts[0] if len(parts) > 0 else "unknown",
        })

    registrations.sort(key=lambda r: r["timestamp"], reverse=True)
    return registrations
