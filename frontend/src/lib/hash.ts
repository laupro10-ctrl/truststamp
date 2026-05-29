// ─── TruthStamp — Hashing: SHA-256 + pHash ───
//
// SHA-256: integridad byte a byte (Web Crypto API)
// pHash:   hash perceptual — mismo resultado visual post-recompresión
//          (Canvas + DCT 2D, sin dependencias externas)

// ─── SHA-256 (exacto) ───

export async function sha256FromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer as BufferSource)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function sha256FromBytes(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── pHash (perceptual) ───
//
// Algoritmo:
//   1. Cargar imagen → canvas → redimensionar a 32×32
//   2. Convertir a escala de grises
//   3. DCT 2D sobre matriz 32×32
//   4. Extraer sub-bloque 8×8 de arriba-izquierda (bajas frecuencias)
//   5. Comparar cada coeficiente con la media → 64 bits
//   6. Resultado: 16 chars hex

const PHASH_SIZE = 32    // resolución interna
const PHASH_BITS = 8      // sub-bloque DCT: 8×8 = 64 bits

export async function phashFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const hash = computePHash(img)
        resolve(hash)
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo cargar la imagen para pHash'))
    }
    img.src = url
  })
}

function computePHash(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = PHASH_SIZE
  canvas.height = PHASH_SIZE
  const ctx = canvas.getContext('2d')!

  // Redimensionar a 32×32
  ctx.drawImage(img, 0, 0, PHASH_SIZE, PHASH_SIZE)
  const imageData = ctx.getImageData(0, 0, PHASH_SIZE, PHASH_SIZE)
  const pixels = imageData.data

  // Paso 1: convertir a escala de grises (matriz 32×32)
  const gray: number[][] = []
  for (let y = 0; y < PHASH_SIZE; y++) {
    gray[y] = []
    for (let x = 0; x < PHASH_SIZE; x++) {
      const idx = (y * PHASH_SIZE + x) * 4
      // luminance: 0.299R + 0.587G + 0.114B
      gray[y][x] = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2]
    }
  }

  // Paso 2: DCT 2D sobre la matriz 32×32
  const dct = computeDCT2D(gray, PHASH_SIZE)

  // Paso 3: extraer sub-bloque 8×8 (esquina superior izquierda)
  const lowFreq: number[] = []
  for (let i = 0; i < PHASH_BITS; i++) {
    for (let j = 0; j < PHASH_BITS; j++) {
      lowFreq.push(dct[i][j])
    }
  }

  // Paso 4: media de los 64 coeficientes (excluyendo DC [0,0])
  const ac = lowFreq.slice(1) // excluir el coeficiente DC
  const mean = ac.reduce((sum, v) => sum + v, 0) / ac.length

  // Paso 5: cada coeficiente → bit (1 si > media, 0 si no)
  // El DC [0,0] se compara igual que el resto
  const bits: number[] = []
  for (const v of lowFreq) {
    bits.push(v > mean ? 1 : 0)
  }

  // Paso 6: 64 bits → 16 caracteres hex
  let hex = ''
  for (let i = 0; i < 64; i += 4) {
    const nibble = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3]
    hex += nibble.toString(16)
  }
  return hex
}

// DCT 2D — Discrete Cosine Transform tipo II
// Fórmula estándar para JPEG/pHash:
//   C(u,v) = α(u)α(v) Σ_x Σ_y f(x,y) cos[(2x+1)uπ/2N] cos[(2y+1)vπ/2N]
function computeDCT2D(matrix: number[][], N: number): number[][] {
  const dct: number[][] = Array.from({ length: N }, () => new Array(N).fill(0))

  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      let sum = 0
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          sum +=
            matrix[x][y] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N))
        }
      }
      const au = u === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N)
      const av = v === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N)
      dct[u][v] = au * av * sum
    }
  }
  return dct
}

// ─── Comparación de pHashes ───

export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity
  let distance = 0
  for (let i = 0; i < hash1.length; i++) {
    const diff = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16)
    distance += popcount(diff)
  }
  return distance
}

function popcount(n: number): number {
  let count = 0
  while (n) {
    count++
    n &= n - 1
  }
  return count
}

// Umbral típico: ≤ 10 bits → misma imagen (después de recompresión)
export const PHASH_THRESHOLD = 10

// ─── Hash completo de un archivo ───

export async function hashFile(file: File): Promise<{
  sha256: string
  phash: string
  isImage: boolean
}> {
  const sha256 = await sha256FromFile(file)
  const isImage = file.type.startsWith('image/')
  const phash = isImage ? await phashFromFile(file) : ''
  return { sha256, phash, isImage }
}
