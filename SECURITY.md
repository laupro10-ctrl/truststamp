# Politica de Seguridad — TruthStamp

## Alcance

Esta politica aplica al proyecto TruthStamp: frontend (React), backend (Flask), landing page, y toda la infraestructura relacionada.

## Reportar una vulnerabilidad

Si descubris una vulnerabilidad de seguridad, **no la reportes como un issue publico**. Envia un correo a:

**[benjatitovincenti@gmail.com](mailto:benjatitovincenti@gmail.com)**

Inclui en tu reporte:

- Descripcion de la vulnerabilidad
- Pasos para reproducirla
- Impacto potencial
- Sugerencia de solucion (si tenes)

### Tiempos de respuesta

| Etapa | Plazo |
|-------|-------|
| Acuse de recibo | 48 horas |
| Evaluacion inicial | 5 dias habiles |
| Resolucion o plan de accion | 15 dias habiles |
| Divulgacion publica | Coordinada con quien reporta |

### Recompensas

TruthStamp es un proyecto open-source sin fines de lucro. No ofrecemos recompensas economicas, pero daremos credito publico a quien reporte vulnerabilidades validas (si asi lo desea).

## Buenas practicas de seguridad

### Para contribuidores

- **Nunca subas claves privadas** al repositorio. Ni siquiera las de testnet.
- Usa `.env.local` para variables sensibles (esta en `.gitignore`)
- Verifica que `console.log` no exponga datos sensibles antes de hacer commit
- Las claves en `CREDENCIALES-DEMO.txt` son SOLO para testnet — no tienen valor real

### Para deploy

- Las claves privadas de Stellar deben configurarse como **variables de entorno** en Render/Netlify, nunca en el codigo
- El backend usa `REGISTRY_SECRET_KEY` — esta variable NUNCA debe exponerse en logs o respuestas HTTP
- La private key de Arkiv (`VITE_ARKIV_PRIVATE_KEY`) va en `.env.local` (excluida de Git)
- Rotar claves de testnet periodicamente

### Modelo de amenazas

| Riesgo | Mitigacion |
|--------|-----------|
| Clave privada expuesta en Git | `.gitignore` + `VITE_*` en `.env.local` |
| Abuso de endpoint de registro | Rate-limiting (10 req/min por IP) |
| Suplantacion de periodista | Freighter firma con llave privada del usuario |
| Hash falso on-chain | ManageData es inmutable, la verificacion es criptografica |
| Backend caido | Frontend tiene fallback Arkiv directo |

## Versiones soportadas

| Version | Soporte |
|---------|---------|
| `master` (rama principal) | ✅ Soporte activo |
| Ramas `feat/*` y `fix/*` | ❌ Solo durante desarrollo |

## Divulgacion responsable

TruthStamp sigue el principio de divulgacion responsable. Una vez resuelta una vulnerabilidad:

1. Publicamos un advisory en GitHub
2. Etiquetamos el release con la correccion
3. Damos credito a quien reporto (si lo desea)
4. Documentamos la leccion aprendida
