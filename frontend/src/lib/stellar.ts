// ─── TruthStamp — Stellar Client ───
//
// Maneja la conexion con Freighter wallet.
// El usuario firma sus propias transacciones ManageData con su wallet.

import {
  isConnected,
  getAddress,
  signTransaction,
} from '@stellar/freighter-api'

import {
  TransactionBuilder,
  Operation,
  Networks,
  BASE_FEE,
} from '@stellar/stellar-sdk'

const STELLAR_EXPLORER = 'https://stellar.expert/explorer/testnet'

// ─── Conexion de wallet ───

export async function connectWallet(): Promise<{
  connected: boolean
  publicKey?: string
  error?: string
}> {
  try {
    const connectedResult = await isConnected()
    if (!connectedResult.isConnected) {
      return {
        connected: false,
        error: 'Freighter no detectado. Instala la extension de Freighter.',
      }
    }

    const result = await getAddress()
    if ('error' in result && result.error) {
      return {
        connected: false,
        error: (result as { errorMessage?: string }).errorMessage || 'Error al conectar',
      }
    }

    return {
      connected: true,
      publicKey: (result as { address?: string }).address,
    }
  } catch {
    return {
      connected: false,
      error: 'Error al conectar con Freighter',
    }
  }
}

export async function getPublicKey(): Promise<string | null> {
  try {
    const connectedResult = await isConnected()
    if (!connectedResult.isConnected) return null

    const result = await getAddress()
    if ('error' in result && result.error) return null

    return (result as { address?: string }).address ?? null
  } catch {
    return null
  }
}

// ─── Crear y firmar transaccion ManageData ───

export async function createAndSignManageData(
  hashHex: string,
  filename: string,
  journalistPublicKey: string,
): Promise<{ signedXdr: string; txHash: string }> {
  // Convertir SHA-256 hex a base64url (sin padding) para la key
  const hashBytes = new Uint8Array(
    hashHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)),
  )
  const b64 = btoa(String.fromCharCode(...hashBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  const dataKey = `ts:${b64}`.slice(0, 64)

  const now = new Date().toISOString()
  const dataValue = `${now}|${filename}`.slice(0, 64)

  // Obtener la cuenta del periodista desde Horizon
  const horizonUrl = 'https://horizon-testnet.stellar.org'
  const accountResp = await fetch(`${horizonUrl}/accounts/${journalistPublicKey}`)
  if (!accountResp.ok) {
    throw new Error(
      `No se pudo cargar la cuenta ${journalistPublicKey.slice(0, 8)}... ` +
      '¿Tiene fondos? Visite https://laboratory.stellar.org/#create-account',
    )
  }
  const accountData = await accountResp.json()
  const sequence = accountData.sequence

  // Construir transaccion
  const tx = new TransactionBuilder(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { publicKey: journalistPublicKey, sequence } as any,
    {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    },
  )
    .addOperation(
      Operation.manageData({
        name: dataKey,
        value: dataValue,
      }),
    )
    .setTimeout(30)
    .build()

  // Firmar con Freighter
  const xdr = tx.toXDR()
  const signResult = await signTransaction(xdr, {
    networkPassphrase: Networks.TESTNET,
  })

  if ('error' in signResult && signResult.error) {
    throw new Error(
      (signResult as { errorMessage?: string }).errorMessage ||
      'Error al firmar con Freighter',
    )
  }

  return {
    signedXdr: (signResult as { signedTxXdr: string }).signedTxXdr,
    txHash: tx.hash().toString('hex'),
  }
}

// ─── Formatear links al explorer ───

export function explorerLink(txHash: string): string {
  return `${STELLAR_EXPLORER}/tx/${txHash}`
}

export function accountLink(publicKey: string): string {
  return `${STELLAR_EXPLORER}/account/${publicKey}`
}

// ─── Verificar si Freighter esta instalado ───

export async function hasFreighter(): Promise<boolean> {
  try {
    const result = await isConnected()
    return result.isConnected
  } catch {
    return false
  }
}
