import { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { hashFile } from '../lib/hash'
import { verifyContent, verifyBySha256 } from '../lib/arkiv'
import { explorerLink } from '../lib/stellar'
import { useToast } from '../components/Toast'
import type { VerificationResult } from '../types'

type Step = 'upload' | 'checking' | 'result'

export default function Verify() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [hashInput, setHashInput] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { show } = useToast()

  // Pre-cargar archivo si viene del Home (navigate con state)
  useEffect(() => {
    const fileFromNav = (location.state as { file?: File } | null)?.file
    if (fileFromNav) processFile(fileFromNav)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const hashFromUrl = searchParams.get('sha256')
    if (hashFromUrl && hashFromUrl.length === 64) {
      setHashInput(hashFromUrl)
      verifyHash(hashFromUrl)
    }
  }, [searchParams])

  const verifyHash = async (hash: string) => {
    setStep('checking')
    try {
      const r = await verifyBySha256(hash)
      if (r) {
        setResult(r)
        show('Contenido autentico encontrado', 'success')
      } else {
        setResult({
          authentic: false,
          matchType: 'none',
          sha256: hash,
          phash: '',
        })
        show('Hash no registrado en la blockchain', 'error')
      }
      setStep('result')
    } catch {
      setResult({ authentic: false, matchType: 'none', sha256: hash, phash: '' })
      setStep('result')
      show('Error al consultar la blockchain', 'error')
    }
  }

  const processFile = useCallback((f: File) => {
    setFile(f)
    setResult(null)
    setStep('upload')
    setHashInput('')
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile()
          if (blob) processFile(blob)
          break
        }
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [processFile])

  const handleVerify = async () => {
    if (!file) return
    setStep('checking')
    try {
      const { sha256, phash } = await hashFile(file)
      const r = await verifyContent(sha256, phash)
      setResult(r)
      setStep('result')
      if (r.authentic) {
        show(
          r.matchType === 'exact'
            ? 'Coincidencia exacta encontrada'
            : `Coincidencia perceptual (distancia: ${r.distance})`,
          'success',
        )
      } else {
        show('Contenido no registrado en blockchain', 'error')
      }
    } catch {
      setResult({ authentic: false, matchType: 'none', sha256: '', phash: '' })
      setStep('result')
      show('Error al verificar', 'error')
    }
  }

  const handleHashSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = hashInput.trim().toLowerCase()
    if (clean.length !== 64) {
      show('SHA-256 invalido: debe contener 64 caracteres hexadecimales', 'error')
      return
    }
    verifyHash(clean)
  }

  const handleReset = () => {
    setFile(null)
    setPreview('')
    setResult(null)
    setHashInput('')
    setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="page">
      <nav className="top-nav">
        <Link to="/" className="back-link">&larr; TruthStamp</Link>
      </nav>

      <div className="page-content">
        <h1>Verificar autenticidad</h1>
        <p className="subtitle">
          Compruebe si un archivo fue registrado previamente. Primero busca por
          SHA-256 (coincidencia exacta). Si no encuentra, busca por pHash
          (coincidencia perceptual).
        </p>

        {(step === 'upload' || step === 'checking') && (
          <>
            <div className="upload-zone">
              {preview ? (
                <div
                  className="preview-box"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <img src={preview} alt="Preview" />
                  <p className="filename">{file?.name}</p>
                </div>
              ) : (
                <div
                  className={`drop-area ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.odt,.rtf,.txt,.csv,.md,.json"
                    onChange={handleFileSelect}
                    hidden
                  />
                  <div className="drop-icon">?</div>
                  <p>Arrastre un archivo, haga clic o peguelo (Ctrl+V)</p>
                </div>
              )}

              {file && step === 'upload' && (
                <button className="btn-primary" onClick={handleVerify}>
                  Verificar autenticidad
                </button>
              )}

              {step === 'checking' && (
                <div className="progress-card">
                  <div className="spinner" />
                  <p>Calculando hash y consultando la blockchain...</p>
                </div>
              )}
            </div>

            <div className="divider">
              <span>o verificar por hash</span>
            </div>

            <form className="hash-input-form" onSubmit={handleHashSubmit}>
              <input
                type="text"
                className="hash-input"
                placeholder="Ingrese un hash SHA-256 (64 caracteres)..."
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                maxLength={64}
              />
              <button
                type="submit"
                className="btn-secondary"
                disabled={hashInput.length !== 64}
              >
                Verificar hash
              </button>
            </form>
          </>
        )}

        {step === 'result' && result && (
          <div className="verify-result">
            {result.authentic ? (
              <div className="result-card success">
                <div className="result-icon">
                  {result.matchType === 'exact' ? '+' : '~'}
                </div>
                <h2>
                  {result.matchType === 'exact'
                    ? 'Autentico — coincidencia exacta'
                    : 'Autentico — coincidencia perceptual'}
                </h2>

                <p className="match-explanation">
                  {result.matchType === 'exact'
                    ? 'El archivo es identico al original registrado. SHA-256 coincide byte por byte.'
                    : `La imagen coincide visualmente (distancia Hamming: ${result.distance}). Posiblemente fue recomprimida por una plataforma digital.`}
                </p>

                <div className="cert-details">
                  <div className="cert-row">
                    <span>Archivo original</span>
                    <strong>{result.filename}</strong>
                  </div>
                  <div className="cert-row">
                    <span>Fecha de registro</span>
                    <strong>{result.registeredAt}</strong>
                  </div>
                  {result.entityKey && (
                    <div className="cert-row">
                      <span>Entidad Arkiv</span>
                      <code>{result.entityKey.slice(0, 14)}...</code>
                    </div>
                  )}
                  {result.txHash && (
                    <div className="cert-row">
                      <span>Transaccion Stellar</span>
                      <a
                        href={explorerLink(result.txHash)}
                        target="_blank"
                        rel="noopener"
                      >
                        Ver en explorer &rarr;
                      </a>
                    </div>
                  )}
                </div>

                <button className="btn-secondary" onClick={handleReset}>
                  Verificar otro archivo
                </button>
              </div>
            ) : (
              <div className="result-card not-found">
                <div className="result-icon">x</div>
                <h2>No registrado en blockchain</h2>
                <p>
                  Este contenido no posee un registro en TruthStamp.
                </p>
                <div className="hash-note hash-note-warn" style={{ textAlign: 'left', marginBottom: 16 }}>
                  Si el archivo fue reenviado por WhatsApp, Telegram o redes sociales, puede
                  haber sido recomprimido y su SHA-256 ya no coincidira con el original.
                  Para imagenes se busca tambien por similitud visual (pHash). Para otros
                  formatos (PDF, video, audio, documentos) el archivo debe ser identico
                  byte por byte al original registrado.
                </div>
                <div className="cert-details">
                  <div className="cert-row">
                    <span>SHA-256</span>
                    <code>{result.sha256.slice(0, 20)}...</code>
                  </div>
                  {result.phash && (
                    <div className="cert-row">
                      <span>pHash</span>
                      <code>{result.phash}</code>
                    </div>
                  )}
                </div>
                <div className="cert-actions">
                  <Link to="/register" className="btn-primary">
                    Registrar este contenido
                  </Link>
                  <button className="btn-secondary" onClick={handleReset}>
                    Verificar otro archivo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
