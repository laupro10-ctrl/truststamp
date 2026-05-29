// ─── TruthStamp — Arkiv Client ───
//
// PublicClient: solo lectura, seguro para browser, sin private key.
// WalletClient: firma con VITE_ARKIV_PRIVATE_KEY → escribe entidades en Arkiv.
//
// Red: Braga testnet (chain ID 60138453102)
// RPC: https://braga.hoodi.arkiv.network/rpc

import {
  createPublicClient,
  createWalletClient,
  http,
  jsonToPayload,
} from '@arkiv-network/sdk'
import { privateKeyToAccount } from '@arkiv-network/sdk/accounts'
import { braga } from '@arkiv-network/sdk/chains'
import type { VerificationResult } from '../types'
import { hammingDistance, PHASH_THRESHOLD } from './hash'

// ─── Cliente publico (browser-safe) ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _publicClient: any = null

export function getPublicClient() {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: braga,
      transport: http(),
    })
  }
  return _publicClient
}

// ─── Wallet client (requiere VITE_ARKIV_PRIVATE_KEY en .env) ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _walletClient: any = null

function getWalletClient() {
  const pk = (import.meta.env.VITE_ARKIV_PRIVATE_KEY ?? '') as string
  if (!pk) return null
  if (!_walletClient) {
    try {
      const account = privateKeyToAccount(pk as `0x${string}`)
      _walletClient = createWalletClient({ account, chain: braga, transport: http() })
    } catch {
      return null
    }
  }
  return _walletClient
}

// ─── Tipos internos de respuesta Arkiv ───

interface ArkivEntityRaw {
  key: string
  value?: string
  contentType?: string
  creator?: string
  owner?: string
  expiresAt?: number
  createdAtBlock?: number
  stringAttributes?: { key: string; value: string }[]
  numericAttributes?: { key: string; value: number }[]
}

// ─── Helpers ───

function getAttr(
  entity: ArkivEntityRaw,
  key: string,
): string | undefined {
  return entity.stringAttributes?.find((a) => a.key === key)?.value
}

function decodePayload(hexValue: string | undefined): Record<string, unknown> | null {
  if (!hexValue) return null
  try {
    const hex = hexValue.startsWith('0x') ? hexValue.slice(2) : hexValue
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

// ─── Verificacion ───

const INCLUDE_DATA = {
  key: true,
  payload: true,
  attributes: true,
  creator: true,
  owner: true,
  contentType: true,
  expiration: true,
} as Record<string, boolean>

export async function verifyBySha256(sha256: string): Promise<VerificationResult | null> {
  const client = getPublicClient()

  try {
    const response: { data?: ArkivEntityRaw[] } = await client.query(
      `type = "truthstamp" && sha256 = "${sha256}"`,
      { includeData: INCLUDE_DATA },
    )

    const data = response.data ?? []
    for (const entity of data) {
      const payload = decodePayload(entity.value)
      const phash = getAttr(entity, 'phash') ?? ''

      return {
        authentic: true,
        matchType: 'exact',
        sha256,
        phash,
        registeredAt: payload?.timestamp as string | undefined,
        filename: payload?.filename as string | undefined,
        txHash: payload?.stellarTx as string | undefined,
        entityKey: entity.key,
      }
    }
    return null
  } catch (err) {
    console.error('Arkiv verifyBySha256 error:', err)
    return null
  }
}

export async function verifyByPHash(phash: string): Promise<VerificationResult | null> {
  const client = getPublicClient()

  try {
    const response: { data?: ArkivEntityRaw[] } = await client.query(
      `type = "truthstamp"`,
      {
        includeData: INCLUDE_DATA,
        resultsPerPage: 200,
      },
    )

    const data = response.data ?? []
    let bestMatch: VerificationResult | null = null
    let bestDistance = Infinity

    for (const entity of data) {
      const entityPHash = getAttr(entity, 'phash')
      if (!entityPHash) continue

      const distance = hammingDistance(phash, entityPHash)
      if (distance <= PHASH_THRESHOLD && distance < bestDistance) {
        bestDistance = distance

        const payload = decodePayload(entity.value)
        const entitySha256 = getAttr(entity, 'sha256') ?? ''

        bestMatch = {
          authentic: true,
          matchType: 'perceptual',
          sha256: entitySha256,
          phash: entityPHash,
          registeredAt: payload?.timestamp as string | undefined,
          filename: payload?.filename as string | undefined,
          txHash: payload?.stellarTx as string | undefined,
          entityKey: entity.key,
          distance,
        }
      }
    }

    return bestMatch
  } catch (err) {
    console.error('Arkiv verifyByPHash error:', err)
    return null
  }
}

// ─── Fallback: verifica contra Stellar via backend ───

async function verifyByStellar(sha256: string): Promise<VerificationResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/verify/${sha256}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.authentic) return null
    return {
      authentic: true,
      matchType: 'exact',
      sha256,
      phash: '',
      registeredAt: data.timestamp,
      filename: data.filename,
    }
  } catch {
    return null
  }
}

// ─── Verificacion combinada: Arkiv (exacta) → Stellar → Arkiv (perceptual) ───

export async function verifyContent(
  sha256: string,
  phash: string,
): Promise<VerificationResult> {
  // 1. Arkiv — coincidencia exacta por SHA-256
  const exactMatch = await verifyBySha256(sha256)
  if (exactMatch) return exactMatch

  // 2. Stellar — fallback para registros que aun no esten en Arkiv
  const stellarMatch = await verifyByStellar(sha256)
  if (stellarMatch) return stellarMatch

  // 3. Arkiv — coincidencia perceptual por pHash
  if (phash) {
    const perceptualMatch = await verifyByPHash(phash)
    if (perceptualMatch) return perceptualMatch
  }

  return {
    authentic: false,
    matchType: 'none',
    sha256,
    phash,
  }
}

// ─── Registro (Stellar via backend + Arkiv directo si hay private key) ───

const API_BASE = 'https://truststamp.onrender.com'

export async function registerContent(
  sha256: string,
  phash: string,
  filename: string,
  signedTx?: string,
  journalistAddress?: string,
): Promise<{ success: boolean; entityKey?: string; txHash?: string; error?: string }> {
  // 1. Stellar — via backend (con tx firmada por Freighter si hay)
  const body: Record<string, string> = { sha256, phash, filename }
  if (signedTx) body.signed_tx = signedTx
  if (journalistAddress) body.journalist_address = journalistAddress

  const res = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const data = await res.json()
    return { success: false, error: data.error || 'Error al registrar' }
  }

  const backendResult = await res.json()

  // 2. Arkiv — si VITE_ARKIV_PRIVATE_KEY esta configurada
  let entityKey: string | undefined = backendResult.entityKey
  try {
    const wc = getWalletClient()
    if (wc) {
      const payload = jsonToPayload({
        type: 'truthstamp',
        filename,
        timestamp: new Date().toISOString(),
        stellarTx: backendResult.txHash ?? '',
      })
      const arkivResult = await wc.createEntity({
        payload,
        contentType: 'application/json',
        expiresIn: 86400 * 365, // 1 ano en segundos
        attributes: [
          { key: 'sha256', value: sha256 },
          { key: 'phash',  value: phash  },
          { key: 'type',   value: 'truthstamp' },
        ],
      })
      entityKey = arkivResult.entityKey
    }
  } catch (err) {
    console.warn('[Arkiv] write failed (non-fatal):', err)
  }

  return { success: true, entityKey, txHash: backendResult.txHash }
}

export async function getEntityCount(): Promise<number> {
  try {
    const client = getPublicClient()
    const count = await client.getEntityCount()
    return typeof count === 'number' ? count : Number(count)
  } catch {
    return 0
  }
}
