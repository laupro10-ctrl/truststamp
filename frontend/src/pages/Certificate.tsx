import { Link, useSearchParams } from 'react-router-dom'
import tsLogo from '../assets/truthstamp-mark.svg'
import { explorerLink } from '../lib/stellar'

export default function Certificate() {
  const [params] = useSearchParams()

  const filename = params.get('filename') || '—'
  const sha256 = params.get('sha256') || ''
  const phash = params.get('phash') || ''
  const txHash = params.get('tx') || ''
  const timestamp = params.get('ts') || ''
  const ledger = params.get('ledger') || ''

  const date = timestamp
    ? new Date(timestamp).toLocaleDateString('es-AR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    : new Date().toLocaleString('es-AR')

  if (!sha256) {
    return (
      <div className="page">
        <nav className="top-nav no-print">
          <Link to="/" className="back-link">&larr; TruthStamp</Link>
        </nav>
        <div className="result-card not-found">
          <div className="result-icon">x</div>
          <h2>Certificado no disponible</h2>
          <p>No se recibieron los datos necesarios para generar el certificado.</p>
          <Link to="/" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <nav className="top-nav no-print">
        <Link to="/" className="back-link">&larr; TruthStamp</Link>
        <button
          className="btn-sm"
          onClick={() => window.print()}
          style={{ marginLeft: 'auto' }}
        >
          Imprimir / Guardar PDF
        </button>
      </nav>

      <div className="certificate">
        <div className="cert-header">
          <div className="cert-brand">
            <img src={tsLogo} alt="TruthStamp" className="cert-logo" />
            <span>TruthStamp</span>
          </div>
          <div className="cert-kind">Certificado de registro</div>
        </div>

        <h1 className="cert-title">Constancia de anclaje en blockchain</h1>
        <p className="cert-subtitle">
          Este documento certifica que la huella criptografica del archivo fue
          registrada de forma inmutable en la red Stellar.
        </p>

        <div className="cert-grid">
          <div>
            <div className="cert-row">
              <div className="cert-key">Archivo</div>
              <div className="cert-val cert-val-big">{filename}</div>
            </div>
            <div className="cert-row">
              <div className="cert-key">Huella SHA-256</div>
              <div className="cert-val">{sha256}</div>
            </div>
            {phash && (
              <div className="cert-row">
                <div className="cert-key">Huella perceptual (pHash)</div>
                <div className="cert-val">{phash}</div>
              </div>
            )}
            {txHash && (
              <div className="cert-row">
                <div className="cert-key">ID de transaccion (Stellar Testnet)</div>
                <div className="cert-val">{txHash}</div>
              </div>
            )}
            <div className="cert-row">
              <div className="cert-key">Operacion</div>
              <div className="cert-val">
                {ledger ? `Ledger #${ledger}` : '—'} · ManageData · 0.00001 XLM
              </div>
            </div>
            <div className="cert-row" style={{ border: 0 }}>
              <div className="cert-key">Fecha y hora de registro</div>
              <div className="cert-val cert-val-big">{date}</div>
            </div>
          </div>
          {txHash && (
            <div className="cert-qr">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(explorerLink(txHash))}`}
                alt="QR a la transaccion"
                className="cert-qr-img"
              />
              <a
                href={explorerLink(txHash)}
                target="_blank"
                rel="noopener"
                className="cert-qr-link"
              >
                Ver transaccion en Stellar Expert &rarr;
              </a>
            </div>
          )}
        </div>

        <div className="cert-footer">
          <div className="cert-footer-net">
            Red: Stellar Testnet · horizon-testnet.stellar.org
          </div>
          <div className="cert-footer-stamp">Verificable publicamente</div>
        </div>
      </div>
    </div>
  )
}
