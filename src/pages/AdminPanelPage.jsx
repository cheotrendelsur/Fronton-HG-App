import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function AdminPanelPage() {
  const { profile } = useAuth()
  const navigate    = useNavigate()

  const [requests,  setRequests]  = useState([])
  const [history,   setHistory]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [histLoading, setHistLoading] = useState(true)
  const [error,     setError]     = useState('')
  const [actionMap, setActionMap] = useState({})

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err, status, statusText } = await supabase
      .from('profiles')
      .select('id, username, email, status, created_at')
      .eq('role', 'organizer')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (err) {
      setError(`Error ${status} ${statusText}: ${err.message}`)
      setRequests([])
    } else {
      setRequests(data ?? [])
    }
    setLoading(false)
  }, [])

  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    const { data } = await supabase
      .from('organizer_requests_history')
      .select('id, username, email, action, acted_at')
      .order('acted_at', { ascending: false })
      .limit(50)
    setHistory(data ?? [])
    setHistLoading(false)
  }, [])

  useEffect(() => {
    if (!profile) return
    if (profile.role !== 'admin') {
      navigate('/dashboard', { replace: true })
      return
    }
    loadRequests()
    loadHistory()
  }, [profile, navigate, loadRequests, loadHistory])

  async function recordHistory(req, action) {
    await supabase
      .from('organizer_requests_history')
      .insert({
        user_id:  req.id,
        username: req.username,
        email:    req.email,
        action,
        acted_by: profile.id,
      })
  }

  async function handleApprove(req) {
    setActionMap(prev => ({ ...prev, [req.id]: 'active' }))

    await recordHistory(req, 'accepted')

    const { error: err } = await supabase
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', req.id)

    if (err) {
      setError(`No se pudo aprobar: ${err.message}`)
      setActionMap(prev => { const n = { ...prev }; delete n[req.id]; return n })
      return
    }

    setRequests(prev => prev.filter(r => r.id !== req.id))
    setActionMap(prev => { const n = { ...prev }; delete n[req.id]; return n })
    loadHistory()
  }

  async function handleReject(req) {
  setActionMap(prev => ({ ...prev, [req.id]: 'rejected' }))
  setError('')

  try {
    const { error: histErr } = await supabase
      .from('organizer_requests_history')
      .insert({
        user_id:  req.id,
        username: req.username,
        email:    req.email,
        action:   'rejected',
        acted_by: profile.id,
      })

    if (histErr) throw new Error(`Historial: ${histErr.message}`)

    const { data, error: fnErr } = await supabase.functions.invoke('delete-user', {
      body: { userId: req.id },
    })

    if (fnErr) throw new Error(`Edge Function: ${fnErr.message}`)
    if (!data?.success) throw new Error(data?.error ?? 'Respuesta inesperada')

    setRequests(prev => prev.filter(r => r.id !== req.id))
    loadHistory()
  } catch (err) {
    setError(`No se pudo rechazar: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    setActionMap(prev => { const n = { ...prev }; delete n[req.id]; return n })
  }
}

  if (!profile || profile.role !== 'admin') return null

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-8 animate-fade-up"
           style={{ background: '#F2F3F5' }}>

        {/* ── Cabecera ── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#1F2937' }}>
              Panel de Administración
            </h1>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
              Gestión de solicitudes de organizador
            </p>
          </div>
          <button
            onClick={() => { loadRequests(); loadHistory() }}
            disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40"
            style={{ background: '#FFFFFF', border: '1px solid #E0E2E6', color: '#6B7280' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-3.1-6.8"/>
              <path d="M21 3v5h-5"/>
            </svg>
          </button>
        </header>

        {/* ── Error global ── */}
        {error && (
          <div className="rounded-xl px-4 py-3 space-y-1"
               style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-red-500 text-xs font-semibold">Error</p>
            <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            <button onClick={() => setError('')}
              className="text-red-500 text-xs underline underline-offset-2">
              Cerrar
            </button>
          </div>
        )}

        {/* SECCIÓN 1 — Solicitudes pendientes */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
              Pendientes
            </h2>
            {!loading && requests.length > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: '#FFF5D6', border: '1px solid #F5E6A3', color: '#92750F' }}
              >
                {requests.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i}
                  className="h-28 rounded-2xl animate-pulse"
                  style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl px-4 py-10 text-center"
                 style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-3"
                   style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={1.8}
                  className="w-4 h-4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="9"/>
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: '#1F2937' }}>Sin solicitudes pendientes</p>
              <p className="text-xs mt-1 opacity-60" style={{ color: '#6B7280' }}>
                Todas las cuentas han sido revisadas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
                const busy = Boolean(actionMap[req.id])
                return (
                  <div key={req.id}
                    className="rounded-2xl p-4 space-y-4"
                    style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                          style={{ background: '#E8F4FA', border: '1px solid #D0E5F0', color: '#3A8BB5' }}
                        >
                          {req.username?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#1F2937' }}>
                            @{req.username ?? '—'}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>
                            {req.email ?? '—'}
                          </p>
                        </div>
                      </div>
                      <span
                        className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: '#FFF5D6', border: '1px solid #F5E6A3', color: '#92750F' }}
                      >
                        Pendiente
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={busy}
                        onClick={() => handleReject(req)}
                        className="py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                          text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: '#EF4444' }}
                      >
                        {actionMap[req.id] === 'rejected' ? 'Eliminando...' : 'Rechazar'}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => handleApprove(req)}
                        className="py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                          text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: '#6BB3D9' }}
                      >
                        {actionMap[req.id] === 'active' ? 'Aprobando...' : 'Aceptar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* SECCIÓN 2 — Historial de solicitudes */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
              Historial
            </h2>
            {!histLoading && history.length > 0 && (
              <span className="text-[10px]" style={{ color: '#9CA3AF' }}>
                ({history.length})
              </span>
            )}
          </div>

          {histLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i}
                  className="h-16 rounded-xl animate-pulse"
                  style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }} />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl px-4 py-8 text-center"
                 style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
              <p className="text-xs opacity-60" style={{ color: '#9CA3AF' }}>Aún no hay acciones registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(item => {
                const accepted = item.action === 'accepted'
                const date     = new Date(item.acted_at)
                const dateStr  = date.toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })
                const timeStr  = date.toLocaleTimeString('es-ES', {
                  hour: '2-digit', minute: '2-digit'
                })

                return (
                  <div
                    key={item.id}
                    className="group relative flex items-center gap-3 px-4 py-3 rounded-xl
                      cursor-pointer select-none transition-all duration-200 active:scale-[0.985]"
                    style={{
                      background: '#FFFFFF',
                      border: accepted
                        ? '1px solid #D0E5F0'
                        : '1px solid #FECACA',
                    }}
                  >
                    {/* Indicador de acción */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{
                        background: accepted ? '#E8F4FA' : '#FEF2F2',
                        border: accepted ? '1px solid #D0E5F0' : '1px solid #FECACA',
                      }}
                    >
                      {accepted ? (
                        <svg viewBox="0 0 16 16" fill="none" stroke="#6BB3D9" strokeWidth={2}
                          className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 8l3.5 3.5 7-7"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 16 16" fill="none" stroke="#EF4444" strokeWidth={2}
                          className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4l8 8M12 4l-8 8"/>
                        </svg>
                      )}
                    </div>

                    {/* Datos del usuario */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#1F2937' }}>
                        @{item.username}
                      </p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: '#9CA3AF' }}>
                        {item.email}
                      </p>
                    </div>

                    {/* Badge + fecha */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                        style={{
                          background: accepted ? '#E8F4FA' : '#FEF2F2',
                          color: accepted ? '#3A8BB5' : '#EF4444',
                        }}
                      >
                        {accepted ? 'Aceptado' : 'Rechazado'}
                      </span>
                      <p className="text-[9px]" style={{ color: '#9CA3AF' }}>
                        {dateStr} · {timeStr}
                      </p>
                    </div>

                    {/* Flecha */}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}
                      className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ color: '#D1D5DB' }}
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 4l4 4-4 4"/>
                    </svg>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </Layout>
  )
}
