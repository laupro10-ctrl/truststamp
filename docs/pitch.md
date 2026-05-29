# Pitch — StellarTruth

## Hook (10 segundos)

> "¿Cómo sabés que esta noticia que te llegó por WhatsApp la escribió realmente el periodista que dice? Hoy no tenés forma. StellarTruth te la da."

---

## Problema (20 segundos)

Vivimos en una epidemia de desinformación:

- 67% de latinoamericanos ha creído una fake news
- El fact-checking tarda días y llega tarde
- Las plataformas borran contenido arbitrariamente
- Un periodista serio puede ver su trabajo desacreditado por una versión falseada

**El problema de fondo:** no existe un estándar abierto y descentralizado para probar "yo escribí esto, en esta fecha, y esta es la versión original".

---

## Solución — El demo (30 segundos)

**[Abrir demo — pantalla de publicar]**

> "StellarTruth le da a periodistas y ciudadanos una herramienta simple para anclar la verdad a la blockchain de Stellar."

1. Periodista escribe su investigación
2. Click en "Registrar en Stellar"
3. **3 segundos después**, el hash de su contenido queda inmutable on-chain
4. Cualquiera que reciba esa noticia puede verificarla: pega el texto, consulta Stellar
5. Si el hash coincide → auténtico. Si no → manipulado.

> "Sin servidores centrales. Sin que nadie pueda borrarlo. La verdad anclada a una blockchain pública."

---

## Cómo funciona (30 segundos)

**[Mostrar diagrama de arquitectura]**

Tres piezas simples sobre Stellar:

| Capa | Tecnología | Función |
|------|-----------|---------|
| Registro | Manage Data (Stellar) | Guarda hash + metadata on-chain |
| Identidad | Stellar public key | El periodista es su wallet, sin KYC |
| Verificación | SHA-256 + consulta | Mismo texto → mismo hash → match o no |

---

## Por qué Stellar (15 segundos)

> "¿Por qué Stellar y no Ethereum? Porque publicar un hash en Ethereum cuesta $3. En Stellar cuesta $0.00004. Para un periodista que publica 10 notas por día, Ethereum es inviable. Stellar fue diseñado para transacciones rápidas y baratas — y un hash es la transacción más simple que existe."

---

## Impacto (10 segundos)

> "No estamos reemplazando a los periódicos. Les estamos dando un sello digital de autenticidad que nadie —ni un gobierno, ni una plataforma, ni un troll— puede falsificar. Cada verificación es una transacción en Stellar. Cada periodista que se suma hace crecer la blockchain con actividad real."

---

## Preguntas esperadas y respuestas

**"¿Esto no resuelve las fake news, solo verifica la fuente."**
> Exacto. No decimos "esta noticia es verdad". Decimos "esta noticia fue publicada por este periodista en esta fecha". La veracidad del contenido la juzga el lector. Lo que eliminamos es la suplantación de fuente — que es el vector de ataque más común en desinformación.

**"¿Y si un periodista publica algo falso a propósito?"**
> Su reputación queda on-chain. Cada publicación está ligada a su wallet para siempre. Si miente, su historial lo muestra. Y en futuras versiones, agregamos un sistema de challenges donde la comunidad puede impugnar contenido con evidencia.

**"¿Por qué Stellar y no Ethereum/L2?"**
> Fees. Manage Data en Stellar cuesta $0.00004. En Ethereum L1, $3. En L2, $0.01-0.05. Stellar gana por mucho. Además, la operación Manage Data es nativa del protocolo — no requiere smart contract, no tiene riesgo de bugs.

**"¿No puedo simplemente twittear la noticia y ya?"**
> Twitter puede borrarlo. Puede banear al periodista. Puede alterar timestamps. Puede cambiar el algoritmo. Stellar es una blockchain pública — nadie puede borrar, modificar, ni censurar un Manage Data entry.

**"¿Qué pasa si alguien sube un hash de contenido falso?"**
> El hash solo prueba que ESE contenido fue registrado por ESA wallet en ESA fecha. Si el contenido es falso, el hash igual es válido. La verificación es sobre la fuente, no sobre la verdad. Para veracidad del contenido, StellarTruth se complementa con fact-checkers tradicionales.

**"¿Cómo escala esto si hay miles de periodistas?"**
> El backend mantiene un índice de cuentas de periodistas. Para búsqueda masiva, se puede implementar un índice en Soroban o una red de validadores. Pero para el MVP, consultar 50-100 cuentas de periodistas es instantáneo.

**"¿Esto no lo puede hacer también un notario digital tradicional?"**
> Un notario cobra, tarda, y es una entidad centralizada que puede ser comprometida, sobornada, o cerrada. Stellar es una red descentralizada de validadores — no hay una sola entidad que pueda alterar el registro.
