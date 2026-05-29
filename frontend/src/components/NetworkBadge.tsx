// ─── Network status badge ───
// Muestra estado de Arkiv y Stellar (online/offline)

import { useState, useEffect } from 'react'

interface NetworkStatus {
  arkiv: boolean
  stellar: boolean
}

async function checkArkiv(): Promise<boolean> {
  try {
    const res = await fetch('https://braga.hoodi.arkiv.network/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'arkiv_getEntityCount', params: [] }),
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function checkStellar(): Promise<boolean> {
  try {
    const res = await fetch('https://truststamp.onrender.com/api/health', {
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

export default function NetworkBadge() {
  const [status, setStatus] = useState<NetworkStatus>({ arkiv: false, stellar: false })

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const [arkiv, stellar] = await Promise.all([checkArkiv(), checkStellar()])
      if (!cancelled) setStatus({ arkiv, stellar })
    }
    check()
    const interval = setInterval(check, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="network-badge">
      <span className={`net-dot ${status.arkiv ? 'online' : 'offline'}`} />
      <span className="net-label">Arkiv</span>
      <span className="net-sep">·</span>
      <span className={`net-dot ${status.stellar ? 'online' : 'offline'}`} />
      <span className="net-label">Stellar</span>
    </div>
  )
}
