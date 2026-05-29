# PLAN DE TAREAS — StellarTruth

**Equipo disponible:**
| Rol | Persona | Habilidades principales |
|-----|---------|------------------------|
| **P1** | Periodista | Conoce el dolor: fuentes falsas, desinformación, verificación |
| **P2** | Diseñador | UI/UX, diseño visual, presentación |
| **P3** | Backend | APIs, consultas Stellar, lógica de servidor |
| **P4** | Frontend | React, integración Freighter, hashing |
| **P5** | Coordinador Stellar | Stellar SDK, Manage Data, arquitectura |

---

## FASE 1 — Fundamentos (primeras 2h)

### TAREA 1: Scaffold del proyecto
**Asignado a: P4 (Frontend)**
**Tiempo estimado: 45 min**
- [ ] Crear frontend con Vite + React + TypeScript
  ```bash
  npm create vite@latest frontend -- --template react-ts
  cd frontend && npm install @stellar/stellar-sdk @stellar/freighter-api react-router-dom
  ```
- [ ] Crear backend Flask
  ```bash
  mkdir backend && cd backend
  python -m venv venv
  # Windows: venv\Scripts\activate
  pip install flask flask-cors stellar-sdk
  ```
- [ ] Estructura de carpetas lista
- [ ] Verificar que `npm run dev` y `python app.py` arrancan

**Entregable:** Proyecto que compila y corre en localhost

---

### TAREA 2: Configurar Stellar testnet + Freighter
**Asignado a: P5 (Coordinador Stellar)**
**Tiempo estimado: 45 min**
- [ ] Crear 2 cuentas en testnet (periodista + ciudadano)
  - Faucet: https://laboratory.stellar.org/#create-account
- [ ] Instalar Freighter wallet en navegador
- [ ] Verificar conexión Freighter desde frontend
- [ ] Probar Manage Data: guardar key=test, value=hello
  ```js
  const op = StellarSdk.Operation.manageData({
    name: 'test_hash',
    value: 'hello world'
  });
  ```
- [ ] Confirmar datos en stellar.expert

**Entregable:** 2 wallets con XLM, Freighter conectable, Manage Data probado

---

### TAREA 3: Diseño de pantallas (mockup)
**Asignado a: P2 (Diseñador)**
**Tiempo estimado: 30 min**
- [ ] Diseñar las 3 pantallas del flujo:
  1. **Publicar** — periodista ingresa título, contenido, fuente, fecha
  2. **Verificar** — ciudadano pega texto, ve resultado ✅ o ❌
  3. **Confirmación** — post-publicación: tx hash, link explorer, hash para compartir
- [ ] Definir paleta de colores, tipografía, estilo visual
- [ ] Decidir qué datos van en cada pantalla

**Entregable:** Wireframes/diseño de las 3 pantallas

---

### TAREA 4: Definir datos y flujo del negocio
**Asignado a: P1 (Periodista)**
**Tiempo estimado: 20 min**
- [ ] Definir estructura de una "Publicación":
  ```json
  {
    "title": "Investigación: contratos irregulares en ministerio",
    "content": "Texto completo de la nota...",
    "source": "El Nacional",
    "date": "2026-05-28",
    "journalist_address": "GABC123..."
  }
  ```
- [ ] Preparar 3 ejemplos reales de noticias para el demo:
  - 1 investigación política
  - 1 nota deportiva
  - 1 nota de salud/ciencia
- [ ] Preparar 1 ejemplo de "fake" (texto alterado para demo de ❌)

**Entregable:** 3 noticias reales + 1 fake para el demo

---

## FASE 2 — Core técnico (2-3h)

### TAREA 5: Frontend — Hashing + Wallet connect
**Asignado a: P4 (Frontend) + P5 (Coordinador)**
**Tiempo estimado: 60 min**
- [ ] Instalar dependencias
- [ ] Componente WalletConnect:
  - Botón "Conectar Freighter"
  - Mostrar address + balance
- [ ] Función de hashing SHA-256:
  ```js
  async function hashContent(title, content, source, date) {
    const data = JSON.stringify({title, content, source, date});
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }
  ```
- [ ] Routing entre pantallas (Publicar, Verificar)

**Entregable:** Wallet conectada + función hash funcionando

---

### TAREA 6: Publicar en Stellar (Manage Data)
**Asignado a: P5 (Coordinador) + P4 (Frontend)**
**Tiempo estimado: 60 min**
- [ ] Pantalla "Publicar":
  - Formulario: título, contenido, fuente, fecha
  - Botón "Registrar en Stellar"
- [ ] Integración Freighter para firmar:
  ```js
  const account = await freighter.getPublicKey();
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET
  })
  .addOperation(StellarSdk.Operation.manageData({
    name: hash,
    value: JSON.stringify({s: source, d: date, t: title.substring(0,20)})
  }))
  .setTimeout(30)
  .build();
  ```
- [ ] Confirmación: tx hash + link stellar.expert + hash para compartir
- [ ] Loading state durante firma y confirmación

**Entregable:** Periodista puede publicar y ver confirmación on-chain

---

### TAREA 7: Verificar contenido
**Asignado a: P4 (Frontend) + P3 (Backend)**
**Tiempo estimado: 45 min**
- [ ] Pantalla "Verificar":
  - Textarea para pegar el texto de la noticia
  - Botón "Verificar"
  - Área de resultado: ✅ o ❌
- [ ] Backend endpoint:
  ```python
  @app.route('/api/verify', methods=['POST'])
  def verify():
      data = request.json
      hash_to_find = data['hash']
      # Consultar cuentas conocidas de periodistas
      for journalist in KNOWN_JOURNALISTS:
          account = server.accounts().account_id(journalist).call()
          if hash_to_find in account['data']:
              return {'found': True, 'metadata': account['data'][hash_to_find], ...}
      return {'found': False}
  ```
- [ ] Resultado muestra:
  - ✅: autor (address), fecha, fuente, link explorer
  - ❌: "Este texto no está registrado en Stellar"

**Entregable:** Ciudadano puede verificar y obtener resultado

---

### TAREA 8: Backend — Índice de periodistas
**Asignado a: P3 (Backend)**
**Tiempo estimado: 30 min**
- [ ] `GET /api/journalists` — lista de periodistas registrados
- [ ] `POST /api/journalists` — registrar nuevo periodista (address + nombre + medio)
- [ ] Cache de cuentas en memoria (dict)
- [ ] Si hay tiempo: buscar automáticamente Manage Data entries de periodistas nuevos

**Entregable:** API que mantiene registro de periodistas conocidos

---

## FASE 3 — Integración y polish (1-2h)

### TAREA 9: Flujo completo punt a punta
**Asignado a: P4 + P5 + P3**
**Tiempo estimado: 30 min**
- [ ] Conectar frontend → backend → Stellar en ambos flujos
- [ ] Probar: publicar noticia → verificar noticia (debe dar ✅)
- [ ] Probar: verificar texto falso (debe dar ❌)
- [ ] Grabar video del flujo como plan B

**Entregable:** Demo funcional de punta a punta

---

### TAREA 10: UI polish + error handling
**Asignado a: P4 (Frontend) + P2 (Diseñador)**
**Tiempo estimado: 30 min**
- [ ] Loading states (spinner mientras procesa)
- [ ] Error states (wallet no conectada, fondos insuficientes, error de red)
- [ ] Estados vacíos (sin periodistas, sin búsquedas)
- [ ] Responsive para laptop del demo
- [ ] Aplicar diseño de P2 (colores, tipografía)

**Entregable:** UI profesional con todos los estados cubiertos

---

### TAREA 11: Demo script + preparación final
**Asignado a: TODO EL EQUIPO**
**Tiempo estimado: 30 min**
- [ ] Script del demo:
  - **P1 (Periodista)** presenta el problema real de desinformación
  - **P4** opera la computadora
  - **P5** explica la parte técnica
  - **P2** destaca el diseño y experiencia
- [ ] Ensayar 2 veces el flujo completo
- [ ] Cronometrar: < 3 minutos
- [ ] Preparar respuestas a preguntas (ver docs/pitch.md)

**Entregable:** Demo ensayado, roles claros, plan B grabado

---

## RESUMEN POR PERSONA

### P1 — Periodista
| Fase | Tarea | Tiempo |
|------|-------|--------|
| 1 | T4: Definir datos y flujo | 20 min |
| 3 | T11: Demo script | 30 min |
| **Total** | | **~50 min** |

### P2 — Diseñador
| Fase | Tarea | Tiempo |
|------|-------|--------|
| 1 | T3: Diseño de pantallas | 30 min |
| 3 | T10: UI polish (con P4) | 30 min |
| 3 | T11: Demo script | 30 min |
| **Total** | | **~90 min** |

### P3 — Backend
| Fase | Tarea | Tiempo |
|------|-------|--------|
| 2 | T7: Endpoint verificar (con P4) | 45 min |
| 2 | T8: Índice de periodistas | 30 min |
| 3 | T9: Integración | 30 min |
| 3 | T11: Demo script | 30 min |
| **Total** | | **~135 min** |

### P4 — Frontend
| Fase | Tarea | Tiempo |
|------|-------|--------|
| 1 | T1: Scaffold | 45 min |
| 2 | T5: Hashing + wallet (con P5) | 60 min |
| 2 | T6: Publicar (con P5) | 60 min |
| 2 | T7: Verificar (con P3) | 45 min |
| 3 | T9: Integración | 30 min |
| 3 | T10: UI polish (con P2) | 30 min |
| 3 | T11: Demo script | 30 min |
| **Total** | | **~300 min (5h)** |

### P5 — Coordinador Stellar
| Fase | Tarea | Tiempo |
|------|-------|--------|
| 1 | T2: Stellar testnet + Freighter | 45 min |
| 2 | T5: Hashing + wallet (con P4) | 60 min |
| 2 | T6: Publicar (con P4) | 60 min |
| 3 | T9: Integración | 30 min |
| 3 | T11: Demo script | 30 min |
| **Total** | | **~225 min (3.75h)** |

---

## CRONOGRAMA SUGERIDO (6 horas)

```
HORA 0:00  — Kickoff (10 min)
             Todos: entender el flujo, preguntas

HORA 0:10  — FASE 1 en paralelo (45 min)
             P1 → T4 (datos negocio)
             P2 → T3 (diseño pantallas)
             P4 → T1 (scaffold)
             P5 → T2 (Stellar testnet)

HORA 1:00  — FASE 2: Core (2.5h)
             P4+P5 → T5 (frontend wallet + hash)
             P4+P5 → T6 (publicar en Stellar)
             P4+P3 → T7 (verificar contenido)
             P3 → T8 (backend índice periodistas)

HORA 3:30  — FASE 3: Integración + Polish (2h)
             P4+P5+P3 → T9 (flujo completo)
             P4+P2 → T10 (UI polish)
             TODOS → T11 (ensayo ×2)

HORA 5:30  — Buffer + grabación plan B (30 min)

HORA 6:00  — DEMO TIME 🚀
```

---

## DECISIONES CRÍTICAS (tomar YA)

1. **¿Manage Data o Soroban?** → Manage Data. Más simple, nativo, sin compilar Rust. Alcanza perfecto.
2. **¿Contenido on-chain u off-chain?** → Solo hash on-chain. Contenido off-chain (lo tiene el medio/periodista).
3. **¿Quién presenta?** → P1 (periodista) abre con el problema real. P5 explica lo técnico.
4. **¿Plan B?** → Grabar video del flujo funcionando ANTES del demo.
5. **Value limit (64 bytes):** → Usar JSON comprimido: `{"s":"ElNacional","d":"2026-05-28","t":"Investigacion..."}`
