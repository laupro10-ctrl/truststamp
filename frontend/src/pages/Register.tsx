import { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { hashFile } from '../lib/hash'
import { registerContent } from '../lib/arkiv'
import { connectWallet, createAndSignManageData, explorerLink } from '../lib/stellar'
import { useToast } from '../components/Toast'
import sealOutline from '../assets/truthstamp-mark-outline.svg'

type Step = 'upload' | 'wallet' | 'hashing' | 'signing' | 'registering' | 'seal' | 'done' | 'error'

export default function Register() {
  const location = useLocation()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [sha256, setSha256] = useState('')
  const [phash, setPHash] = useState('')
  const [isImage, setIsImage] = useState(true)
  const [txHash, setTxHash] = useState('')
  const [journalistAddress, setJournalistAddress] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { show } = useToast()

  const processFile = useCallback((f: File) => {
    setFile(f)
    setStep('upload')
    setErrorMsg('')
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview('')
    }
  }, [])

  useEffect(() => {
    const fileFromNav = (location.state as { file?: File } | null)?.file
    if (fileFromNav) processFile(fileFromNav)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
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

  const handleRegister = async () => {
    if (!file) return

    try {
      // Paso 1: Conectar Freighter
      setStep('wallet')
      const wallet = await connectWallet()
      if (!wallet.connected || !wallet.publicKey) {
        setErrorMsg(wallet.error || 'Conecta Freighter para continuar')
        setStep('error')
        show(wallet.error || 'Wallet no conectada', 'error')
        return
      }
      setJournalistAddress(wallet.publicKey)

      // Paso 2: Hashear
      setStep('hashing')
      const { sha256, phash, isImage: img } = await hashFile(file)
      setSha256(sha256)
      setPHash(phash)
      setIsImage(img)

      // Paso 3: Firmar transaccion con Freighter
      setStep('signing')
      const { signedXdr } = await createAndSignManageData(
        sha256, file.name, wallet.publicKey,
      )

      // Paso 4: Enviar al backend (submit + Arkiv)
      setStep('registering')
      const result = await registerContent(
        sha256, phash, file.name, signedXdr, wallet.publicKey,
      )

      if (!result.success) {
        setErrorMsg(result.error ?? 'Error desconocido')
        setStep('error')
        show(result.error ?? 'Error al registrar', 'error')
        return
      }

      setTxHash(result.txHash ?? '')

      setStep('seal')
      await new Promise((r) => setTimeout(r, 1200))
      setStep('done')
      show('Contenido registrado exitosamente', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar'
      setErrorMsg(msg)
      setStep('error')
      show(msg, 'error')
    }
  }

  const handleReset = () => {
    setFile(null); setPreview(''); setSha256(''); setPHash('')
    setIsImage(true); setTxHash(''); setJournalistAddress(''); setErrorMsg(''); setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const copyHash = () => {
    navigator.clipboard.writeText(sha256)
    show('SHA-256 copiado al portapapeles', 'info')
  }

  const shareLink = () => {
    const url = `${window.location.origin}/verify?sha256=${sha256}`
    navigator.clipboard.writeText(url)
    show('Enlace de verificacion copiado', 'info')
  }

  return (
    <div className="page">
      <nav className="top-nav">
        <Link to="/" className="back-link">&larr; TruthStamp</Link>
        {journalistAddress && (
          <span className="wallet-pill" style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>
            {journalistAddress.slice(0, 8)}...{journalistAddress.slice(-4)}
          </span>
        )}
      </nav>

      <div className="page-content">
        <h1>Registrar contenido</h1>
        <p className="subtitle">
          Arrastre un archivo, peguelo (Ctrl+V) o haga clic. El hash se
          calcula localmente en el navegador.
        </p>

        {(step === 'upload' || step === 'error') && (
          <div className="upload-zone">
            {preview ? (
              <div className="preview-box" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <img src={preview} alt="Preview" />
                <p className="filename">{file?.name}</p>
                <p className="drop-hint">Arrastre otra imagen para reemplazarla</p>
              </div>
            ) : (
              <div
                className={`drop-area ${dragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.odt,.rtf,.txt,.csv,.md,.json" onChange={handleFileSelect} hidden />
                <div className="drop-icon">+</div>
                <p>Arrastre un archivo o haga clic para seleccionar</p>
                <p className="drop-hint">Tambien puede pegarla (Ctrl+V)</p>
              </div>
            )}

            {file && (
              <button className="btn-primary" onClick={handleRegister}>
                Conectar wallet y registrar
              </button>
            )}

            {errorMsg && step === 'error' && (
              <div className="result-card error">
                <p>{errorMsg}</p>
                <button className="btn-secondary" onClick={handleReset}>Reintentar</button>
              </div>
            )}
          </div>
        )}

        {(step === 'wallet' || step === 'hashing' || step === 'signing' || step === 'registering' || step === 'seal') && (
          <div className="progress-steps">
            <div className={`prog-step ${step === 'wallet' ? 'active' : (step !== 'wallet' && step !== 'upload' && step !== 'error') ? 'done' : 'pending'}`}>
              <span className="prog-num">{step === 'wallet' ? '1' : '✓'}</span>
              <span className="prog-label">Conectar Freighter</span>
            </div>
            <div className={`prog-step ${step === 'hashing' ? 'active' : step !== 'wallet' && step !== 'hashing' && step !== 'upload' && step !== 'error' ? 'done' : 'pending'}`}>
              <span className="prog-num">{step === 'hashing' ? '2' : step !== 'wallet' && step !== 'hashing' && step !== 'upload' && step !== 'error' ? '✓' : '2'}</span>
              <span className="prog-label">Calcular hash SHA-256 + pHash</span>
            </div>
            <div className={`prog-step ${step === 'signing' ? 'active' : (step === 'registering' || step === 'seal' || step === 'done') ? 'done' : 'pending'}`}>
              <span className="prog-num">{step === 'signing' ? '3' : (step === 'registering' || step === 'seal' || step === 'done') ? '✓' : '3'}</span>
              <span className="prog-label">Firmar con Freighter</span>
            </div>
            <div className={`prog-step ${step === 'registering' ? 'active' : (step === 'seal' || step === 'done') ? 'done' : 'pending'}`}>
              <span className="prog-num">{step === 'registering' ? '4' : (step === 'seal' || step === 'done') ? '✓' : '4'}</span>
              <span className="prog-label">Anclaje en Stellar</span>
            </div>
          </div>
        )}

        {step === 'hashing' && sha256 && (
          <div className="hash-display">
            <div className="hash-row"><span className="hash-label">SHA-256</span><code className="hash-value">{sha256}</code></div>
            {phash && <div className="hash-row"><span className="hash-label">pHash</span><code className="hash-value">{phash}</code></div>}
            <div className={`hash-note ${isImage ? 'hash-note-good' : 'hash-note-warn'}`}>
              {isImage
                ? 'Esta imagen puede verificarse incluso despues de recompresion (WhatsApp, redes sociales).'
                : 'Este archivo requiere coincidencia EXACTA. Si es modificado o recomprimido, el hash cambiara.'}
            </div>
          </div>
        )}

        {step === 'signing' && (
          <div className="progress-card">
            <div className="spinner" />
            <p>Freighter abrira una ventana para firmar la transaccion...</p>
            <p className="drop-hint" style={{ marginTop: 8 }}>
              Periodista: {journalistAddress.slice(0, 12)}...{journalistAddress.slice(-6)}
            </p>
          </div>
        )}

        {step === 'registering' && (
          <div className="progress-card">
            <div className="spinner" />
            <p>Anclando en Stellar testnet...</p>
          </div>
        )}

        {step === 'seal' && (
          <div className="seal-animation">
            <img src={sealOutline} alt="" className="seal-svg" />
            <p className="seal-text">Generando sello notarial...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="result-card success">
            <div className="result-icon"><img src={sealOutline} alt="" className="seal-done" /></div>
            <h2>Anclado en Stellar</h2>
            <p className="match-explanation">
              Prueba inmutable generada. Cualquier persona puede verificar este archivo a partir de ahora.
            </p>

            <div className="cert-details">
              <div className="cert-row"><span>Periodista</span><strong>{journalistAddress.slice(0, 12)}...{journalistAddress.slice(-6)}</strong></div>
              <div className="cert-row"><span>Archivo</span><strong>{file?.name}</strong></div>
              <div className="cert-row"><span>SHA-256</span><code>{sha256.slice(0, 20)}...</code></div>
              {phash && <div className="cert-row"><span>pHash</span><code>{phash}</code></div>}
              {txHash && (
                <div className="cert-row">
                  <span>Transaccion Stellar</span>
                  <a href={explorerLink(txHash)} target="_blank" rel="noopener">Ver en explorer &rarr;</a>
                </div>
              )}
            </div>

            <div className="cert-actions">
              <Link to={`/certificate?sha256=${encodeURIComponent(sha256)}&filename=${encodeURIComponent(file?.name || '')}&phash=${encodeURIComponent(phash)}&tx=${encodeURIComponent(txHash)}&ts=${encodeURIComponent(new Date().toISOString())}`} className="btn-primary">
                Descargar certificado
              </Link>
              <button className="btn-sm" onClick={copyHash}>Copiar hash</button>
              <button className="btn-sm" onClick={shareLink}>Copiar enlace</button>
              <Link to="/verify" className="btn-secondary">Verificar otro</Link>
              <button className="btn-primary" onClick={handleReset}>Nuevo registro</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
