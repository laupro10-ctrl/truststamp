// ─── Tipos compartidos para TruthStamp ───

export interface HashResult {
  sha256: string        // 64 chars hex — integridad exacta
  phash: string         // 16 chars hex (64 bits) — perceptual
}

export interface VerificationResult {
  authentic: boolean
  matchType: 'exact' | 'perceptual' | 'none'
  sha256: string
  phash: string
  registeredAt?: string
  filename?: string
  txHash?: string        // Stellar TX hash
  entityKey?: string     // Arkiv entity key
  explorerUrl?: string   // Stellar explorer
  distance?: number      // Hamming distance para pHash match
}

export interface RegistrationResult {
  success: boolean
  entityKey: string
  txHash?: string       // Stellar TX
  sha256: string
  phash: string
  timestamp: string
}

export interface ArkivEntity {
  key: string
  payload: {
    filename: string
    timestamp: string
    stellarTx?: string
  }
  sha256: string
  phash: string
  creator: string
  owner: string
  createdAtBlock: number
  contentType: string
  expiresAt: number
}
