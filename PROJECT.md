# TruthStamp

> **"El notario digital descentralizado para periodistas, medios e instituciones: si el hash está en Stellar, el contenido es auténtico."**

Hackathon IdeaForge 2026 · Sponsors: **Stellar** · **Arkviv**

---

## El Problema

### La crisis de autenticidad del contenido digital en 2026

Los deepfakes crecieron **900% entre 2023 y 2025** — de ~500.000 casos rastreados a más de 8 millones.
El contenido sintético está proyectado para representar hasta el **90% de los medios online en 2026**.

En 2026, la clonación de voz y video hiperrealista puede suplantar candidatos en tiempo real.
El riesgo crítico: un deepfake puede hacerse viral en **10 minutos**, mientras que la verificación tarda **horas**.

### ¿Qué existe hoy para combatirlo?

**C2PA** (Coalition for Content Provenance and Authenticity) es el estándar actual — y tiene un problema enorme:

- C2PA certifica el **historial del contenido**, no su verdad
- **No usa blockchain** — usa hashing, árboles de Merkle y firmas digitales en servidores centralizados
- Las plataformas (Instagram, Twitter, YouTube) **eliminan los metadatos embebidos** durante el procesamiento, borrando los manifiestos C2PA antes de que los espectadores los vean
- Un servidor centralizado puede ser hackeado o manipulado

### El contexto regulatorio que lo hace urgente HOY

- **EU AI Act** (efectiva agosto 2026) — exige etiquetado de transparencia para contenido generado por IA
- **U.S. Digital Authenticity and Provenance Act (2025)** — divulgación de proveniencia en medios regulados federalmente
- **Contexto electoral LatAm 2026** — elecciones en toda la región

---

## La Solución: TruthStamp

**Registro inmutable de contenido real sobre Stellar blockchain.**

Cuando un periodista, medio o institución publica contenido real, registra ese archivo en Stellar en el momento exacto de creación. Ese registro es un sello notarial digital que **nadie puede falsificar ni borrar**.

### La analogía simple

> Es como el número de serie de un billete. Si el número existe en el banco central, es real. Si no existe, es falso. TruthStamp hace lo mismo con fotos, videos y noticias — usando Stellar como el "banco central" descentralizado que nadie controla.

---

## Cómo Funciona

### Registro

```
[Periodista saca foto/video]
         ↓
[TruthStamp calcula el hash SHA-256 del archivo en el browser]
         ↓
[Registra hash + timestamp + metadata en Stellar Testnet]
         ↓
[TX ID = prueba inmutable de existencia en ese momento]
```

### Verificación

```
[Usuario sube foto/video sospechoso]
         ↓
[TruthStamp calcula su hash SHA-256]
         ↓
[Consulta Stellar: ¿existe este hash? ¿quién lo registró? ¿cuándo?]
         ↓
[✅ Auténtico / ❌ No registrado / ⚠️ Modificado]
```

---

## Por Qué Stellar es Ideal

| Característica | Valor para TruthStamp |
|---|---|
| Transacciones en 5 segundos | Registrar contenido es instantáneo |
| Fee ~0.00001 XLM | Registrar miles de fotos cuesta casi nada |
| Soroban smart contracts | Lógica de reputación y verificación on-chain |
| X-Ray (ZK layer, Q1 2026) | Privacidad para contenido sensible sin hacerlo público |
| Inmutabilidad total | Ninguna empresa ni gobierno puede borrar el registro |

---

## Diferenciación vs. Competencia

| Competidor | Limitación | Cómo TruthStamp lo supera |
|---|---|---|
| **C2PA** | No usa blockchain; metadatos se borran en pipelines | Hash on-chain sobrevive cualquier procesamiento |
| **Truepic** ($36M, respaldado por Microsoft) | Solución cerrada y corporativa | Open, público, sin cuenta requerida |
| **Numbers Protocol** | Blockchain propia + token propio | Stellar: fees mínimos, sin token nuevo |
| Todos | Sin foco en LatAm ni español | Foco regional, contexto electoral 2026 |

---

## MVP para el Hackathon

### Fase 1 — Lo que mostramos

- Upload de imagen/video → cálculo de hash SHA-256 en el browser
- Registro en Stellar Testnet con un click
- Panel de verificación: subir archivo → resultado en tiempo real
- Perfil del creador con historial on-chain

### Fase 2 — Backend

- Node.js + Stellar SDK + Soroban smart contract
- API pública de verificación (cualquier app puede consultar)

### Fase 3 — Futuro

- Plugin para navegador que verifica automáticamente imágenes al cargarlas
- Integración con medios y agencias de noticias
- Modelo de reputación on-chain: más contenido verificado = más credibilidad

---

## Stack Técnico

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Blockchain:** Stellar Testnet via `@stellar/stellar-sdk`
- **Hashing:** Web Crypto API — SHA-256 nativo en browser, sin librerías externas
- **Almacenamiento on-chain:** ManageData operations (key: `ts:{base64url_hash}`)
- **Verificación:** Horizon API — O(1) lookup en la cuenta registry

---

## Repositorio

**GitHub:** https://github.com/laupro10-ctrl/truststamp

```bash
git clone https://github.com/laupro10-ctrl/truststamp.git
cd truststamp
npm install
npm run setup:stellar   # genera cuenta Stellar Testnet automáticamente
npm run dev
```

---

*Una foto. Un hash. Un sello eterno en blockchain.*
