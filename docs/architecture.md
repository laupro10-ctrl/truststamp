# Arquitectura — StellarTruth

## Diagrama de alto nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    PERIODISTA                                 │
│  Freighter Wallet ──→ Escribe noticia ──→ Hash SHA-256       │
│                           │                                   │
│              Firma Manage Data(key=hash, value=metadata)      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    STELLAR BLOCKCHAIN (Testnet)               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Manage Data Entry                         │   │
│  │  Key: "a3f2b8c1..." (SHA-256 del contenido)           │   │
│  │  Value: {"title":"...","source":"...","date":"..."}    │   │
│  │  Source Account: GABC... (periodista)                  │   │
│  │  Timestamp: bloque #123456                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    CIUDADANO (Verificador)                    │
│                                                              │
│  Pega texto ──→ Hash ──→ Consulta Stellar ──→ Resultado     │
│                                                              │
│  ✅ VERIFICADO: autor, fecha, fuente                         │
│  ❌ NO ENCONTRADO: posible fake                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack tecnológico

| Capa | Herramienta | Justificación |
|------|------------|--------------|
| Blockchain | Stellar testnet | Entorno de desarrollo sin costo |
| Almacenamiento on-chain | Manage Data | Key-value nativo, más simple que Soroban |
| Hashing | SHA-256 (Web Crypto API) | Nativo del navegador, determinístico |
| Frontend | Vite + React + TypeScript | Rápido de montar, hot reload |
| Backend | Flask (Python) | Ligero, consulta cuentas Stellar |
| Wallet navegador | Freighter | Wallet Stellar más usada, fácil de integrar |
| SDK Stellar | stellar-sdk (JS) + stellar-sdk (Python) | Publicar y consultar datos |

---

## Flujo de datos — Publicar

```
1. PERIODISTA escribe contenido
   Frontend (React) ──→ SHA-256(content) ──→ hash

2. PERIODISTA firma transacción
   Freighter ──→ stellar-sdk ──→ ManageDataOp({
     source: periodista_public_key,
     key: hash,
     value: JSON.stringify({title, source, date})
   })

3. Transacción confirmada
   Stellar testnet ──→ bloque minado ──→ tx hash
   Frontend muestra: "✅ Registrado - Bloque #123456"
```

---

## Flujo de datos — Verificar

```
1. CIUDADANO pega texto
   Frontend ──→ SHA-256(texto) ──→ hash

2. Consultar Stellar
   Backend ──→ GET /api/verify?hash=a3f2b8c1...
     ├── stellar-sdk account_data(periodista_address)
     ├── busca key=hash en data_attr
     ├── si existe → decodifica value (JSON metadata)
     └── devuelve {found: true, metadata, journalist, timestamp}

3. Mostrar resultado
   Frontend ──→ ✅ o ❌ con detalles
```

---

## Endpoints del backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/journalists` | Lista de periodistas registrados (address + perfil) |
| POST | `/api/verify` | Recibe `{hash}`, busca en cuentas conocidas, devuelve resultado |
| POST | `/api/register` | Registra un periodista nuevo (address + metadata off-chain) |

---

## Estructura de datos

### Manage Data Entry (on-chain)

```
Key (32 bytes): SHA-256 del contenido de la noticia
Value (≤64 bytes): JSON comprimido con metadata
{
  "s": "El Nacional",       // source
  "d": "2026-05-28",        // date  
  "t": "Investigación..."   // title (abreviado si necesario)
}
```

### Perfil de periodista (off-chain, en backend)

```json
{
  "address": "GABC123...",
  "name": "María López",
  "outlet": "El Nacional",
  "verified_since": "2026-01-15",
  "total_publications": 47
}
```

---

## Decisiones de arquitectura para hackathon

1. **Manage Data, no Soroban.** Manage Data es nativo, simple, y alcanza perfecto para el MVP. Soroban agrega complejidad innecesaria de compilación Rust + deploy.
2. **Hash on-chain, contenido off-chain.** Subir el contenido completo a blockchain es caro e innecesario. El hash es suficiente como prueba criptográfica.
3. **Value limitado a 64 bytes.** Stellar limita Manage Data value a 64 bytes. Usamos JSON comprimido con campos cortos.
4. **Sin base de datos.** El estado vive en Stellar. Backend solo cachea periodistas conocidos en memoria.
5. **Búsqueda por backend.** Stellar no tiene "buscar todos los Manage Data". El backend conoce las cuentas de periodistas y las consulta una por una.
6. **Testnet.** Fondos falsos, cero riesgo, mismo comportamiento que mainnet.
