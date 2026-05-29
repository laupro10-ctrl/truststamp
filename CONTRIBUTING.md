# Contribuir a TruthStamp

Gracias por tu interes en contribuir a TruthStamp. Este documento describe las pautas para colaborar con el proyecto.

TruthStamp es un protocolo descentralizado de verificacion de contenido construido sobre Stellar y Arkiv. Fue creado durante el hackathon IdeaForge 2026 por el equipo Hookia para PunaTech.

## Como contribuir

### Reportar bugs

Si encontraste un bug, por favor abri un issue en GitHub con:

1. Titulo descriptivo
2. Pasos para reproducir el error
3. Comportamiento esperado vs. comportamiento observado
4. Capturas de pantalla (si aplica)
5. Entorno: navegador, sistema operativo, version de Freighter

Usa la plantilla de *Bug Report* al crear el issue.

### Sugerir funcionalidades

Para proponer nuevas funcionalidades:

1. Revisa que no exista un issue similar
2. Abri un *Feature Request* usando la plantilla
3. Describi el problema que resuelve y por que es relevante para el proyecto
4. Si tenes una idea de como implementarlo, compartila

### Enviar codigo (Pull Requests)

1. **Hace un fork** del repositorio
2. **Crea una rama** con un nombre descriptivo: `feat/verificacion-por-lote`, `fix/error-freighter-safari`
3. **Desarrolla tus cambios** siguiendo las convenciones del proyecto
4. **Probalos localmente:**
   ```bash
   cd frontend && npm install --legacy-peer-deps && npm run dev
   cd backend && pip install -r requirements.txt && python app.py
   ```
5. **Hace commit** con mensajes claros: `feat: agregar soporte para verificacion por lote`
6. **Envia el PR** contra la rama `master`
7. **Responde a revisiones** — el equipo revisara tu codigo y dara feedback

Usa la plantilla de Pull Request disponible en el repositorio.

### Convenciones de codigo

- **TypeScript/React:** camelCase, tipos explicitos, componentes funcionales con hooks
- **Python:** snake_case, type hints cuando sea posible, PEP 8
- **Commits:** siguen el formato [Conventional Commits](https://www.conventionalcommits.org/): `tipo: descripcion corta`
  - `feat:` nueva funcionalidad
  - `fix:` correccion de bug
  - `docs:` cambios en documentacion
  - `refactor:` refactorizacion sin cambios funcionales
  - `chore:` tareas de mantenimiento

### Entorno de desarrollo

```bash
# Frontend
cd frontend
cp ../.env.example .env.local   # configurar variables
npm install --legacy-peer-deps
npm run dev                       # http://localhost:5173

# Backend
cd backend
cp .env.example .env             # configurar variables
python ../scripts/setup_stellar.py  # generar wallet testnet
pip install -r requirements.txt
python app.py                     # http://localhost:5000
```

### ¿No sabes por donde empezar?

Los issues etiquetados como `good first issue` son ideales para quienes contribuyen por primera vez. Tambien podes revisar los `help wanted`.

### Contacto

¿Dudas? Abri un issue o contactanos en [benjatitovincenti@gmail.com](mailto:benjatitovincenti@gmail.com).

---

TruthStamp es un proyecto open-source bajo licencia Apache 2.0. Al contribuir, aceptas que tu codigo se distribuya bajo esa misma licencia.
