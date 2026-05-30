# TruthStamp

> Protocolo descentralizado de autenticación de contenido.  
> Si el hash está registrado en Stellar, el contenido es auténtico.

**Hackathon PunaTech 2026 · Sponsors: Stellar + Arkiv**

> ⚠️ **DISCLAIMER:** TruthStamp es un prototipo desarrollado durante un hackathon. Opera sobre Stellar Testnet y Arkiv Braga Testnet. **No usar en mainnet ni con fondos reales.** Las claves en este repositorio son solo de prueba y no tienen valor economico. No esta auditado ni listo para produccion.

---

## El problema

En 2026, los deepfakes crecieron un 900% y el contenido sintético puede representar hasta el 90% de los medios online. Cualquiera puede publicar una imagen o video falso y atribuirlo a una fuente legítima — no existe una forma sencilla, abierta y sin intermediarios de verificar la autenticidad.

Los estándares actuales como C2PA usan servidores centralizados que pueden ser manipulados y cuya metadata es eliminada por plataformas como Instagram o Twitter.

---

## La solución

TruthStamp registra el hash SHA-256 de cualquier archivo (foto, video, PDF) directamente en Stellar blockchain en el momento exacto de su publicación. El hash es inmutable — si el contenido fue alterado aunque sea un pixel, el hash no coincide.

> *"Un periodista publica una investigación. El gobierno la tilda de fake.  
> Pero el hash está en Stellar. Inmutable. Innegable."*

---

## Cómo funciona

```
Periodista sube un archivo
        ↓
SHA-256 + pHash calculados 100% en el navegador
(el archivo nunca sale del dispositivo)
        ↓
Hash anclado en Stellar (ManageData) + Arkiv (entidad on-chain)
        ↓
Cualquier persona sube el mismo archivo → verificación instantánea
✅ Auténtico / ❌ No registrado
```

La verificación usa **doble capa**:
- **SHA-256** — coincidencia exacta byte a byte
- **pHash** — coincidencia perceptual para detectar recompresiones de plataformas

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Vite + React + TypeScript |
| Backend | Flask (Python) |
| Blockchain 1 | Stellar Testnet — ManageData operations |
| Blockchain 2 | Arkiv Braga testnet — `@arkiv-network/sdk` |
| Hashing | Web Crypto API (SHA-256) + DCT perceptual hash |
| Deploy | Netlify (frontend) + Render (backend) |

---

## Estructura del proyecto

```
truthstamp/
├── frontend/          # Vite + React app
│   └── src/
│       ├── lib/
│       │   ├── arkiv.ts     # Arkiv SDK: registro + verificación
│       │   ├── hash.ts      # SHA-256 + pHash en browser
│       │   └── stellar.ts   # Stellar explorer links
│       └── pages/
│           ├── Home.tsx       # Upload UI estilo VirusTotal
│           ├── Register.tsx   # Flujo de registro
│           ├── Verify.tsx     # Flujo de verificación
│           └── Certificate.tsx # Certificado descargable
├── backend/           # Flask API
│   ├── app.py               # Endpoints REST
│   └── stellar_service.py   # Stellar ManageData operations
├── docs/              # Arquitectura, pitch, ideas
└── scripts/           # Setup de cuenta Stellar testnet
```

---

## Setup local

```bash
# Frontend
cd frontend
npm install
npm run dev        # http://localhost:5173

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # completar con keys de Stellar testnet
flask run              # http://localhost:5000
```

### Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `REGISTRY_PUBLIC_KEY` | Cuenta Stellar que actúa como registro (backend) |
| `REGISTRY_SECRET_KEY` | Secret key para firmar transacciones (backend) |
| `VITE_ARKIV_PRIVATE_KEY` | Clave EVM para escribir en Arkiv Braga testnet (opcional) |

> Generar cuenta Stellar testnet: `python scripts/setup_stellar.py`

---

## Flujo de verificación

La verificación consulta ambas blockchains en cascada:

1. **Arkiv** — búsqueda exacta por SHA-256
2. **Stellar** — fallback para registros anteriores a Arkiv
3. **Arkiv** — coincidencia perceptual por pHash

Esto garantiza que todos los registros son encontrables independientemente de cuándo fueron creados.

---

## Prueba de integración con Arkiv

Wallet en Arkiv Braga testnet: `0x07d6a1254Dc8D351Bb9b282c5ef5D48A102E104c`

Entidad de ejemplo registrada on-chain:

| Campo | Valor |
|-------|-------|
| **Entity Key** | `0x9fc7aca6f394d84fbcdaea9af13b96267c5acabc976819cdaee94efc370622dd` |
| **Archivo** | WhatsApp Image 2026-05-28 at 10.11.30.jpeg |
| **Timestamp** | 2026-05-30T02:57:53Z |
| **Stellar TX** | [`1f5876e2...c5f9`](https://stellar.expert/explorer/testnet/tx/1f5876e2ee2f63ad5238fe506851513298d26948d782b53d891606c09937c5f9) |

En total: **5 entidades `truthstamp`** registradas desde esta wallet en Arkiv Braga testnet. Cada registro ancla simultáneamente en Stellar (ManageData) y Arkiv (entidad on-chain).

---

## Equipo — Hookia · PunaTech 2026
