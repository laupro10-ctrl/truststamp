# StellarTruth — Ideas y definición del proyecto

**Equipo:** Periodista + Diseñador + Backend + Frontend  
**Track Stellar:** Hacer crecer la blockchain  
**Problema central:** La desinformación no tiene freno porque no hay forma fácil de verificar la fuente original

---

## El problema en detalle

### Escenario real

Un periodista publica una investigación. Alguien la copia, la modifica, y la hace circular como "la versión original". El periodista no tiene forma de probar:
1. Que él la publicó primero
2. Cuál es el texto exacto original
3. Que la versión circulando fue alterada

### Datos que duelen

- 67% de latinoamericanos ha creído una fake news (Reuters Institute)
- El fact-checking tradicional tarda 24-72 horas
- Las plataformas (Twitter, Facebook, TikTok) borran o etiquetan arbitrariamente
- No existe un estándar abierto de "sello de autenticidad periodística"

---

## La solución: StellarTruth

### ¿Qué hace?

Un periodista pública su noticia normalmente (en su medio, blog, Twitter). Pero además:
1. Hashea el contenido (SHA-256)
2. Registra el hash en Stellar con una operación Manage Data
3. El hash queda inmutable, con timestamp, ligado a su wallet

Cuando alguien quiere verificar:
1. Pega el texto que recibió en StellarTruth
2. La app hashea y consulta la blockchain
3. Si el hash existe → la noticia es auténtica, del periodista X, publicada el día Y
4. Si no existe → esa versión NO fue registrada por ningún periodista

### ¿Por qué Stellar?

| Razón | Detalle |
|-------|---------|
| **Costo** | Manage Data cuesta ~$0.00004. Gratis para testnet. |
| **Velocidad** | 3-5 segundos para confirmación |
| **Simplicidad** | Manage Data es key-value. No requiere smart contracts complejos. |
| **Billeteras** | Freighter es fácil de instalar y usar |
| **Inmutabilidad** | Una vez registrado, el dato no se puede borrar ni alterar |

---

## Flujos detallados

### Flujo 1: Periodista publica

```
1. Periodista abre StellarTruth → "Publicar"
2. Conecta Freighter wallet (o ya está conectada)
3. Completa formulario:
   - Título de la noticia
   - Contenido completo
   - Fuente / medio
   - Fecha de publicación
4. Click en "Registrar en Stellar"
5. Frontend:
   a. Hashea el contenido con SHA-256 → "a3f2b8c1..."
   b. Crea metadata JSON: {title, source, date, content_hash}
   c. Llama a Freighter para firmar Manage Data:
      - key = hash
      - value = JSON.stringify(metadata)
   d. Envía transacción a Stellar testnet
6. Confirmación: ✅ "Registrado en bloque #123456"
   - Link a stellar.expert para ver la transacción
   - Hash visible para compartir
```

### Flujo 2: Ciudadano verifica

```
1. Ciudadano abre StellarTruth → "Verificar"
2. Pega el texto que quiere verificar (la noticia sospechosa)
3. Click en "Verificar"
4. Frontend:
   a. Hashea el texto → "a3f2b8c1..."
   b. Consulta backend: POST /api/verify {hash: "a3f2b8c1..."}
   c. Backend busca el hash en cuentas de periodistas conocidos
   d. Si encuentra → devuelve metadata + datos del periodista
   e. Si no → "No registrado en Stellar"
5. Resultado:
   ✅ VERIFICADO
   - Publicado por: 0xABC123... (periodista X)
   - Fecha: 28/05/2026 14:32 UTC
   - Medio: Diario El Nacional
   - Hash: a3f2b8c1...
   - Ver en Stellar Explorer → link

   ❌ NO VERIFICADO
   - Este texto no coincide con ningún registro en Stellar
   - Puede ser información alterada o no verificada
```

---

## Mecanismo Stellar: Manage Data

### ¿Qué es Manage Data?

Una operación nativa de Stellar que permite guardar pares key-value en una cuenta. Está diseñada para adjuntar datos a cuentas, no para contratos complejos.

```
Operación: Manage Data
  Source Account: GABC... (periodista)
  Key: "a3f2b8c1d4e5f6..." (SHA-256 del contenido)
  Value: '{"title":"Investigación corrupción","source":"El Nacional","date":"2026-05-28","content_hash":"a3f2b8c1..."}'
```

### Límites

- Key: hasta 64 bytes (SHA-256 usa 32 bytes → OK)
- Value: hasta 64 bytes (metadata debe ser corta → usar JSON comprimido o solo content_hash y source)
- **Solución para value largo:** Guardar solo `{source, date, content_hash}` en value (~80-100 chars). O usar IPFS para el contenido completo y guardar solo el IPFS hash.

### Alternativa futura: Soroban

Un contrato inteligente que mantenga un registro global de todas las publicaciones, con:
- `publish(hash, metadata)` → cualquiera puede publicar
- `verify(hash)` → devuelve Option<Entry>
- `reputation(author)` → cuántas publicaciones verificadas
- `challenge(hash, evidence)` → reportar contenido falso

Esto es para fase 2. El MVP usa Manage Data.

---

## Identidad del periodista

### Sin KYC

La wallet de Stellar ES la identidad. No necesitamos email, nombre real, ni verificación. La criptografía lo resuelve:
- La clave pública es única
- Solo el dueño de la clave privada puede firmar
- El historial de publicaciones construye reputación

### Opcional: Perfil

Se puede agregar metadata de perfil (nombre, medio, avatar) como otro Manage Data entry:
```
Key: "profile"
Value: '{"name":"María López","outlet":"El Nacional","verified":true}'
```

---

## Ideas futuras (post-hackathon)

1. **Reputación on-chain**: Soroban contract con puntaje de confiabilidad por periodista
2. **Challenge system**: Cualquiera puede impugnar una noticia con evidencia, comunidad vota
3. **IPFS integration**: Guardar contenido completo en IPFS, solo hash en Stellar
4. **Browser extension**: Verificar automáticamente noticias mientras navegás
5. **API pública**: Cualquier medio puede integrar verificación en su sitio
6. **NFT de verificación**: Cada noticia verificada emite un NFT como "certificado de autenticidad"
7. **Federated search**: Índice distribuido de periodistas para no depender de backend centralizado
