"""
Arkiv Service — JSON-RPC queries + Stellar anchoring.
=====================================================

Para crear entidades en Arkiv se necesita el SDK (@arkiv-network/sdk) 
que es TypeScript. El registro on-chain se hace via Stellar (stellar_service.py),
que ya funciona.

La verificación en Arkiv la hace el frontend directamente con PublicClient
(sin backend, sin key). Este modulo solo maneja las consultas desde el backend
para el endpoint /api/verify/<hash>.
"""

import requests
import os
from datetime import datetime, timezone

ARKIV_RPC = "https://braga.hoodi.arkiv.network/rpc"

# Importar stellar_service para el anclaje
try:
    from stellar_service import register_content as stellar_register
    STELLAR_AVAILABLE = True
except Exception:
    STELLAR_AVAILABLE = False


def _arkiv_rpc(method: str, params: list) -> dict:
    """Llamada generica JSON-RPC 2.0 a Arkiv Braga testnet."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params,
    }
    resp = requests.post(
        ARKIV_RPC,
        json=payload,
        timeout=10,
        headers={"Content-Type": "application/json"},
    )
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise Exception(data["error"].get("message", str(data["error"])))
    return data.get("result", data)


def verify_entity(sha256: str) -> dict:
    """
    Verifica si un hash SHA-256 esta registrado en Arkiv.
    Consulta via JSON-RPC (read-only, sin clave privada).
    """
    query = f'type = "truthstamp" && sha256 = "{sha256}"'
    result = _arkiv_rpc("arkiv_query", [
        query,
        {
            "includeData": {
                "key": True,
                "payload": True,
                "attributes": True,
                "creator": True,
                "owner": True,
                "contentType": True,
                "expiration": True,
            },
            "resultsPerPage": "0x1",
        },
    ])

    data_entries = result.get("data", [])
    if not data_entries:
        return {"authentic": False, "sha256": sha256}

    entity = data_entries[0]
    payload_hex = entity.get("value", "")

    # Decodificar payload
    filename = "unknown"
    timestamp = "unknown"
    try:
        if payload_hex and payload_hex.startswith("0x"):
            import codecs
            raw = codecs.decode(payload_hex[2:], "hex")
            import json
            payload = json.loads(raw.decode("utf-8"))
            filename = payload.get("filename", "unknown")
            timestamp = payload.get("timestamp", "unknown")
    except Exception:
        pass

    # Obtener phash de los atributos
    phash = ""
    for attr in entity.get("stringAttributes", []):
        if attr["key"] == "phash":
            phash = attr["value"]

    return {
        "authentic": True,
        "sha256": sha256,
        "phash": phash,
        "filename": filename,
        "timestamp": timestamp,
        "entity_key": entity.get("key"),
        "creator": entity.get("creator"),
        "owner": entity.get("owner"),
    }


def get_registration_count() -> dict:
    """Devuelve cuantas entidades truthstamp hay en Arkiv."""
    count = _arkiv_rpc("arkiv_getEntityCount", [])
    return {
        "total_entities": count if isinstance(count, int) else 0,
        "network": "braga-testnet",
    }


def register_entity(sha256: str, phash: str, filename: str) -> dict:
    """
    Registra contenido usando Stellar (ManageData) como anclaje inmutable.
    
    Arkiv entity creation requiere el SDK TypeScript y una wallet con GLM.
    Para el MVP del hackathon, el anclaje primario es Stellar.
    La verificacion en Arkiv la hace el frontend directamente.
    """
    result = {
        "success": True,
        "sha256": sha256,
        "phash": phash,
        "filename": filename,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    # Anclaje Stellar (ManageData)
    if STELLAR_AVAILABLE:
        try:
            tx_result = stellar_register(sha256, filename)
            result["txHash"] = tx_result.get("tx_id")
            result["stellarLedger"] = tx_result.get("ledger")
            result["stellarKey"] = tx_result.get("key")
        except Exception as e:
            result["stellarError"] = str(e)
    else:
        result["stellarError"] = "stellar_service no disponible"

    return result
