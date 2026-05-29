import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEntityCount } from '../lib/arkiv'
import NetworkBadge from '../components/NetworkBadge'

interface RecentRegistration {
  filename: string
  timestamp: string
  sha256: string
}

type Tab = 'register' | 'verify' | 'hash'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('register')
  const [entityCount, setEntityCount] = useState<number | null>(null)
  const [recent, setRecent] = useState<RecentRegistration[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [hashInput, setHashInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Despertar el backend de Render (puede estar dormido tras inactividad)
    fetch('https://truststamp.onrender.com/api/health').catch(() => {})
    getEntityCount().then((n) => setEntityCount(n)).catch(() => {})
    fetchRecent()
  }, [])

  const fetchRecent = async () => {
    try {
      const res = await fetch('https://truststamp.onrender.com/api/registrations')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setRecent(data.slice(0, 5))
      }
    } catch { /* */ }
  }

  const processFile = useCallback((f: File) => {
    setFile(f)
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : '')
  }, [])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  const handleAction = () => {
    if (activeTab === 'register' && file) {
      navigate('/register', { state: { file } })
    } else if (activeTab === 'verify' && file) {
      navigate('/verify', { state: { file } })
    } else if (activeTab === 'hash' && hashInput.length === 64) {
      navigate(`/verify?sha256=${hashInput.trim().toLowerCase()}`)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleHashSubmit = (e: React.FormEvent) => { e.preventDefault(); handleAction() }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'register', label: 'REGISTRAR' },
    { id: 'verify',   label: 'VERIFICAR' },
    { id: 'hash',     label: 'HASH'      },
  ]

  const descriptions: Record<Tab, { title: string; text: string }> = {
    register: {
      title: 'Registrar contenido',
      text: 'Cargue una imagen, video, PDF, documento o audio. Se calcula SHA-256 + pHash en el navegador y se ancla en Stellar + Arkiv.',
    },
    verify: {
      title: 'Verificar autenticidad',
      text: 'Cargue un archivo para comprobar su autenticidad contra la blockchain. Imagenes: deteccion exacta (SHA-256) + perceptual (pHash). Otros formatos: solo SHA-256 (archivo identico).',
    },
    hash: {
      title: 'Verificar por hash',
      text: 'Ingrese un hash SHA-256 para consultar si el contenido fue registrado previamente en TruthStamp.',
    },
  }

  const desc = descriptions[activeTab]

  return (
    <div className="home">
      <NetworkBadge />

      <section className="hero-section">
        <div className="hero-lockup">
          <svg className="hero-mark" viewBox="0 0 64 64" fill="none">
            <rect x="5.75" y="5.75" width="52.5" height="52.5" rx="15" fill="none" stroke="#38DDA0" strokeWidth="3.5" />
            <path d="M19.5 33.5 L28 42 L45.5 22" stroke="#38DDA0" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hero-wordmark">TruthStamp</span>
        </div>
        <p className="tagline">
          Protocolo descentralizado de autenticacion de contenido.
          Si el hash esta registrado en Stellar, el contenido es autentico.
        </p>

        {/* ─── Tab bar + body ─── */}
        <div className="vt-container">
          <div className="vt-tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                className={`vt-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(t.id); clearFile(); setHashInput('') }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="vt-body">
            {activeTab !== 'hash' ? (
              <>
                {/* Drop zone — whole area is draggable, click opens picker */}
                <div
                  className={`vt-dropzone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.odt,.rtf,.txt,.csv,.md,.json,.xml,.ppt,.pptx,.xls,.xlsx,.zip"
                    onChange={handleFileSelect}
                    hidden
                  />

                  {file ? (
                    /* ── File selected state ── */
                    <div className="vt-selected">
                      {preview && (
                        <img src={preview} alt="" className="vt-thumb" />
                      )}
                      <div className="vt-file-info">
                        <span className="vt-filename">{file.name}</span>
                        <span className="vt-filesize">{formatBytes(file.size)}</span>
                      </div>
                      <button
                        className="vt-remove-btn"
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearFile() }}
                      >
                        × Quitar
                      </button>
                    </div>
                  ) : (
                    /* ── Empty / drop state ── */
                    <div className="vt-dropcontent">
                      <svg className="vt-file-icon" viewBox="0 0 54 68" fill="none" aria-hidden="true">
                        <path d="M4 4 H34 L50 20 V64 H4 Z" stroke="currentColor" strokeWidth="2.5" />
                        <path d="M34 4 V20 H50" stroke="currentColor" strokeWidth="2.5" />
                        <line x1="12" y1="34" x2="42" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                        <line x1="12" y1="44" x2="42" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                        <line x1="12" y1="54" x2="28" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                      </svg>

                      <button
                        className="vt-choose-btn"
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                      >
                        {activeTab === 'register' ? 'Seleccionar archivo' : 'Elegir archivo'}
                      </button>

                      <p className="vt-drag-hint">o arrastrá y soltá un archivo aquí</p>

                      <p className="vt-disclaimer">
                        El archivo <strong>nunca sale de tu dispositivo</strong>.
                        Solo su huella SHA-256 se ancla en Stellar + Arkiv.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action button — only shows once a file is loaded */}
                {file && (
                  <button className="vt-action-btn" onClick={handleAction}>
                    {activeTab === 'register' ? 'REGISTRAR EN BLOCKCHAIN' : 'VERIFICAR AUTENTICIDAD'}
                  </button>
                )}
              </>
            ) : (
              /* ── HASH tab ── */
              <form className="vt-hashform" onSubmit={handleHashSubmit}>
                <input
                  type="text"
                  className="vt-hashinput"
                  placeholder="Ingrese un hash SHA-256 (64 caracteres hexadecimales)..."
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  maxLength={64}
                />
                <button type="submit" className="vt-action-btn" disabled={hashInput.length !== 64}>
                  VERIFICAR HASH
                </button>
              </form>
            )}
          </div>
        </div>{/* vt-container */}

        {/* ─── Description ─── */}
        <div className="vt-desc">
          <h2>{desc.title}</h2>
          <p>{desc.text}</p>
        </div>
      </section>

      <div className="home-bottom">
        {/* ─── Recent ─── */}
        {recent.length > 0 && (
          <section className="recent-section">
            <h2>ULTIMOS REGISTROS</h2>
            <div className="recent-table">
              <div className="recent-header">
                <span>FECHA</span>
                <span>HASH</span>
              </div>
              {recent.map((r, i) => (
                <div key={i} className="recent-row">
                  <span className="recent-date">
                    {new Date(r.timestamp).toLocaleDateString('es-AR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <code className="recent-hash">{r.sha256?.slice(0, 12)}...</code>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="how-it-works">
          <h2>COMO FUNCIONA</h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>Hash en el navegador</h3>
              <p>SHA-256 para integridad exacta. Para imagenes se calcula tambien pHash (resistente a recompresion). El contenido nunca abandona su equipo.</p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>Anclaje en blockchain</h3>
              <p>El periodista firma con su wallet Freighter. Arkiv como capa de datos + Stellar como registro inmutable.</p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>Verificacion inmediata</h3>
              <p>Coincidencia exacta por SHA-256. Para imagenes: si fue recomprimida, el pHash permite igual su identificacion visual.</p>
            </div>
          </div>
        </section>

        <footer className="home-footer">
          <p>
            {entityCount !== null && entityCount > 0 && (
              <span>{entityCount} registros on-chain &middot; </span>
            )}
            Powered by Stellar + Arkiv &middot; Desarrollado por Hookia &middot; PunaTech 2026
          </p>
        </footer>
      </div>
    </div>
  )
}
