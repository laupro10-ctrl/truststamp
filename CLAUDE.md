# StellarTruth — Contexto del Proyecto para Claude Code

## ¿Qué es StellarTruth?

Plataforma descentralizada de verificación de información periodística sobre Stellar blockchain.

> *"Un periodista publica una investigación. El gobierno la tilda de fake. Pero el hash está en Stellar. Inmutable. Innegable."*

Hackathon Stellar 2026 — Track: crecer la blockchain. Sponsors: **Stellar** + **Arkviv**.

## El problema que resuelve

Cualquiera puede publicar contenido falso y atribuirlo a una fuente legítima. No hay forma de verificar si una noticia realmente viene de quien dice venir. StellarTruth registra el hash SHA-256 del contenido en Stellar en el momento exacto de publicación — cualquiera puede verificar autenticidad on-chain.

## Stack técnico

- **Frontend:** Vite + React + TypeScript + Tailwind CSS
- **Backend:** Flask (Python)
- **Blockchain:** Stellar SDK JS + ManageData operations en Stellar Testnet
- **Wallet:** Freighter (extensión de browser — el usuario conecta su propia wallet)
- **Red:** Stellar Testnet

## Estructura del proyecto

```
stellar-hackathon/  (o truthstamp/)
├── frontend/           # Vite + React + TypeScript
│   └── src/
│       ├── lib/
│       │   ├── hash.ts         # SHA-256 via Web Crypto API
│       │   └── stellar.ts      # Stellar SDK: ManageData, verificación
│       ├── components/
│       └── pages/
│           ├── Home.tsx
│           ├── Register.tsx    # Publicar hash de contenido
│           └── Verify.tsx      # Verificar autenticidad
├── backend/            # Flask API
├── contracts/          # (futuro: Soroban para reputación)
└── docs/
```

## Cómo funciona en Stellar

- **Publicar:** Usuario conecta Freighter wallet → calcula hash SHA-256 del contenido → ManageData operation on-chain con key=`ts:{base64url_hash}` y value=`{timestamp}|{filename}`
- **Verificar:** Cualquiera sube el contenido → calcula hash → consulta Horizon API → ✅ / ❌

## Flujo de la demo

```
Periodista conecta wallet (Freighter)
         ↓
Sube foto/video → hash SHA-256 calculado en browser
         ↓
Firma transacción con Freighter → ManageData en Stellar Testnet
         ↓
Ciudadano sube el mismo archivo → hash calculado
         ↓
Consulta Stellar → ✅ Auténtico / ❌ No registrado
```

## Lo mínimo para la demo

1. Conectar wallet Freighter
2. Publicar hash en Stellar via ManageData
3. Verificar hash consultando Stellar
4. UI: pantalla publicar + pantalla verificar
5. Mostrar timestamp on-chain

## Setup inicial

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
flask run
```

## Notas para Claude

- Freighter es la wallet oficial de Stellar para browsers — se instala como extensión de Chrome/Firefox
- El hashing ocurre 100% en el browser con `crypto.subtle.digest` — sin upload a servidor
- ManageData key: `ts:` + base64url(sha256) = 46 bytes (límite 64) ✓
- ManageData value: `{ISO_timestamp}|{filename_truncated}` ≤ 64 bytes ✓
- El backend Flask es para lógica que no puede ir en el frontend (futura API pública)
- No agregar base de datos — todo el estado vive on-chain en Stellar
