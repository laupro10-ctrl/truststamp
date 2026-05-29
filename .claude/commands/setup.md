# /setup

Guía al usuario para configurar TruthStamp desde cero:

1. Verificar que `npm install` fue ejecutado
2. Verificar si `.env.local` existe — si no, correr `npm run setup:stellar`
3. Verificar que las variables `VITE_REGISTRY_PUBLIC_KEY` y `VITE_REGISTRY_SECRET_KEY` estén seteadas
4. Confirmar que la cuenta Stellar tiene saldo en testnet (mínimo 2 XLM)
5. Dar instrucciones para correr `npm run dev`

Si algo falla, guiar paso a paso según el error.
