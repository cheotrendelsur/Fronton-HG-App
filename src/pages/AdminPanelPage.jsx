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
    // 1. Escribir en el historial PRIMERO, antes de borrar.
    //    Si este paso falla, abortamos sin tocar auth.users.
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

    // 2. Invocar la Edge Function para borrar de auth.users.
    //    La escritura en el historial ya garantiza que el usuario
    //    verá la pantalla de rechazo aunque su cuenta no exista.
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
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-8 animate-fade-up">

        {/* ── Cabecera ── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-ink-primary text-xl font-semibold tracking-tight">
              Panel de Administración
            </h1>
            <p className="text-ink-muted text-xs mt-1">
              Gestión de solicitudes de organizador
            </p>
          </div>
          <button
            onClick={() => { loadRequests(); loadHistory() }}
            disabled={loading}
            className="w-9 h-9 rounded-xl bg-surface-800 border border-border-default flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:border-border-strong transition-all duration-200 disabled:opacity-40"
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
          <div className="bg-red-950/60 border border-red-900/50 rounded-xl px-4 py-3 space-y-1">
            <p className="text-red-400 text-xs font-semibold">Error</p>
            <p className="text-red-400/70 text-xs leading-relaxed">{error}</p>
            <button onClick={() => setError('')}
              className="text-red-400 text-xs underline underline-offset-2">
              Cerrar
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            SECCIÓN 1 — Solicitudes pendientes
        ══════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">
              Pendientes
            </h2>
            {!loading && requests.length > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: 'rgba(245,158,11,0.15)',
                  border:     '1px solid rgba(245,158,11,0.3)',
                  color:      '#f59e0b',
                }}
              >
                {requests.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i}
                  className="h-28 bg-surface-900 border border-border-default rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-surface-900 border border-border-default rounded-2xl px-4 py-10 text-center">
              <div className="w-9 h-9 rounded-xl bg-surface-800 border border-border-default flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#5c665c" strokeWidth={1.8}
                  className="w-4 h-4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="9"/>
                </svg>
              </div>
              <p className="text-ink-secondary text-sm font-medium">Sin solicitudes pendientes</p>
              <p className="text-ink-muted text-xs mt-1 opacity-60">
                Todas las cuentas han sido revisadas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
                const busy = Boolean(actionMap[req.id])
                return (
                  <div key={req.id}
                    className="bg-surface-900 border border-border-default rounded-2xl p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                          style={{
                            background: 'rgba(184,245,51,0.1)',
                            border:     '1px solid rgba(184,245,51,0.2)',
                            color:      '#b8f533',
                          }}
                        >
                          {req.username?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-ink-primary text-sm font-semibold truncate">
                            @{req.username ?? '—'}
                          </p>
                          <p className="text-ink-muted text-xs mt-0.5 truncate">
                            {req.email ?? '—'}
                          </p>
                        </div>
                      </div>
                      <span
                        className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: 'rgba(245,158,11,0.12)',
                          border:     '1px solid rgba(245,158,11,0.25)',
                          color:      '#f59e0b',
                        }}
                      >
                        Pendiente
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={busy}
                        onClick={() => handleReject(req)}
                        className="
                          py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200
                          bg-surface-800 border-border-default text-ink-secondary
                          hover:border-red-800/70 hover:text-red-400 hover:bg-red-950/30
                          disabled:opacity-40 disabled:cursor-not-allowed
                        "
                      >
                        {actionMap[req.id] === 'rejected' ? 'Eliminando...' : 'Rechazar'}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => handleApprove(req)}
                        className="
                          py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                          text-ink-inverse disabled:opacity-40 disabled:cursor-not-allowed
                        "
                        style={{
                          background: busy ? '#659606' : '#b8f533',
                          boxShadow:  busy ? 'none' : '0 0 12px rgba(184,245,51,0.2)',
                        }}
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

        {/* ══════════════════════════════════════════
            SECCIÓN 2 — Historial de solicitudes
        ══════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-ink-secondary text-xs font-semibold uppercase tracking-widest">
              Historial
            </h2>
            {!histLoading && history.length > 0 && (
              <span className="text-ink-muted text-[10px]">
                ({history.length})
              </span>
            )}
          </div>

          {histLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i}
                  className="h-16 bg-surface-900 border border-border-default rounded-xl animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-surface-900 border border-border-default rounded-xl px-4 py-8 text-center">
              <p className="text-ink-muted text-xs opacity-60">Aún no hay acciones registradas</p>
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
                    className="
                      group relative flex items-center gap-3 px-4 py-3
                      bg-surface-900 border rounded-xl
                      cursor-pointer select-none
                      transition-all duration-200
                      hover:bg-surface-800 active:scale-[0.985]
                    "
                    style={{
                      borderColor: accepted
                        ? 'rgba(184,245,51,0.15)'
                        : 'rgba(248,113,113,0.15)',
                    }}
                  >
                    {/* Indicador de acción */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{
                        background: accepted
                          ? 'rgba(184,245,51,0.1)'
                          : 'rgba(248,113,113,0.1)',
                        border: accepted
                          ? '1px solid rgba(184,245,51,0.2)'
                          : '1px solid rgba(248,113,113,0.2)',
                      }}
                    >
                      {accepted ? (
                        <svg viewBox="0 0 16 16" fill="none" stroke="#b8f533" strokeWidth={2}
                          className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 8l3.5 3.5 7-7"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 16 16" fill="none" stroke="#f87171" strokeWidth={2}
                          className="w-3.5 h-3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4l8 8M12 4l-8 8"/>
                        </svg>
                      )}
                    </div>

                    {/* Datos del usuario */}
                    <div className="flex-1 min-w-0">
                      <p className="text-ink-primary text-xs font-semibold truncate">
                        @{item.username}
                      </p>
                      <p className="text-ink-muted text-[10px] truncate mt-0.5">
                        {item.email}
                      </p>
                    </div>

                    {/* Badge + fecha */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                        style={{
                          background: accepted
                            ? 'rgba(184,245,51,0.12)'
                            : 'rgba(248,113,113,0.12)',
                          color: accepted ? '#b8f533' : '#f87171',
                        }}
                      >
                        {accepted ? 'Aceptado' : 'Rechazado'}
                      </span>
                      <p className="text-ink-muted text-[9px]">
                        {dateStr} · {timeStr}
                      </p>
                    </div>

                    {/* Flecha indicadora de "clickeable" */}
                    <svg viewBox="0 0 16 16" fill="none" stroke="#3a3e3e" strokeWidth={1.5}
                      className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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