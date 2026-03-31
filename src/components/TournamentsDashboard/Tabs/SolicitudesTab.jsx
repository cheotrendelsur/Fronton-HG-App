import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabaseClient'
import RequestsSection from './RequestsSection'
import ApprovedSection from './ApprovedSection'

const SELECT_FIELDS = 'id, team_name, category_id, status, requested_at, inscription_fee, player1_id, player2_id, categories(name)'

export default function SolicitudesTab({ tournament }) {
  const { profile } = useAuth()

  const [pending,          setPending]          = useState([])
  const [decided,          setDecided]          = useState([])
  const [loading,          setLoading]          = useState(true)
  const [loadError,        setLoadError]        = useState(false)
  const [actingId,         setActingId]         = useState(null)
  const [actionError,      setActionError]      = useState('')
  const [filter,           setFilter]           = useState('all')
  const [fullCategoryIds,  setFullCategoryIds]  = useState(new Set())

  const loadRegistrations = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [pendingRes, decidedRes] = await Promise.all([
        supabase
          .from('tournament_registrations')
          .select(SELECT_FIELDS)
          .eq('tournament_id', tournament.id)
          .eq('status', 'pending')
          .order('requested_at', { ascending: true }),
        supabase
          .from('tournament_registrations')
          .select(SELECT_FIELDS)
          .eq('tournament_id', tournament.id)
          .in('status', ['approved', 'rejected'])
          .order('decided_at', { ascending: false }),
      ])
      if (pendingRes.error) throw pendingRes.error
      if (decidedRes.error) throw decidedRes.error

      // Resolve player names from profiles
      const allRegs = [...(pendingRes.data ?? []), ...(decidedRes.data ?? [])]
      const playerIds = [...new Set(allRegs.flatMap(r => [r.player1_id, r.player2_id]).filter(Boolean))]
      const profileMap = {}
      if (playerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', playerIds)
        for (const p of (profiles ?? [])) profileMap[p.id] = p
      }
      const enrich = (r) => ({
        ...r,
        player1: profileMap[r.player1_id] ?? null,
        player2: profileMap[r.player2_id] ?? null,
      })
      setPending((pendingRes.data ?? []).map(enrich))
      setDecided((decidedRes.data ?? []).map(enrich))

      // Load which categories are full
      const { data: progData } = await supabase
        .from('tournament_progress')
        .select('category_id')
        .eq('tournament_id', tournament.id)
        .eq('status', 'full')
      setFullCategoryIds(new Set((progData ?? []).map(p => p.category_id)))
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [tournament.id])

  useEffect(() => { loadRegistrations() }, [loadRegistrations])

  async function refreshFullCategories() {
    const { data } = await supabase
      .from('tournament_progress')
      .select('category_id')
      .eq('tournament_id', tournament.id)
      .eq('status', 'full')
    setFullCategoryIds(new Set((data ?? []).map(p => p.category_id)))
  }

  async function handleApprove(registration) {
    // Guard: block if category is already full
    if (fullCategoryIds.has(registration.category_id)) {
      setActionError('Categoría llena — no se aceptan más participantes.')
      setTimeout(() => setActionError(''), 4000)
      return
    }
    setActingId(registration.id)
    try {
      // 1. Update registration status
      const { error: regErr } = await supabase
        .from('tournament_registrations')
        .update({
          status:     'approved',
          decided_at: new Date().toISOString(),
          decided_by: profile?.id ?? null,
        })
        .eq('id', registration.id)
      if (regErr) throw regErr

      // 2. Update tournament_progress
      await updateProgress(registration.category_id, 'approve')

      // 3. Move card: pending → decided
      const updatedReg = { ...registration, status: 'approved' }
      setPending(prev => prev.filter(r => r.id !== registration.id))
      setDecided(prev => [updatedReg, ...prev])

      // 4. Refresh which categories are now full
      await refreshFullCategories()
    } catch {
      setActionError('Error al admitir la solicitud. Intenta de nuevo.')
      setTimeout(() => setActionError(''), 4000)
    } finally {
      setActingId(null)
    }
  }

  async function handleReject(registration) {
    setActingId(registration.id)
    try {
      // 1. Update registration status
      const { error: regErr } = await supabase
        .from('tournament_registrations')
        .update({
          status:     'rejected',
          decided_at: new Date().toISOString(),
          decided_by: profile?.id ?? null,
        })
        .eq('id', registration.id)
      if (regErr) throw regErr

      // 2. Move card: pending → decided (no progress update for rejections)
      const updatedReg = { ...registration, status: 'rejected' }
      setPending(prev => prev.filter(r => r.id !== registration.id))
      setDecided(prev => [updatedReg, ...prev])
    } catch {
      setActionError('Error al rechazar la solicitud. Intenta de nuevo.')
      setTimeout(() => setActionError(''), 4000)
    } finally {
      setActingId(null)
    }
  }

  async function updateProgress(categoryId, action) {
    if (action !== 'approve') return

    const { data: existing } = await supabase
      .from('tournament_progress')
      .select('id, teams_approved, teams_registered, max_teams_allowed')
      .eq('tournament_id', tournament.id)
      .eq('category_id', categoryId)
      .maybeSingle()

    if (existing) {
      const newApproved    = existing.teams_approved + 1
      const newRegistered  = Math.max(existing.teams_registered, newApproved)
      const newStatus      = newApproved >= existing.max_teams_allowed ? 'full' : 'open'
      await supabase
        .from('tournament_progress')
        .update({ teams_approved: newApproved, teams_registered: newRegistered, status: newStatus })
        .eq('id', existing.id)
    } else {
      // No progress row yet — create one from category's max_couples
      const category   = (tournament.categories ?? []).find(c => c.id === categoryId)
      const maxAllowed = category?.max_couples ?? 16
      await supabase.from('tournament_progress').insert({
        tournament_id:    tournament.id,
        category_id:      categoryId,
        max_teams_allowed: maxAllowed,
        teams_registered:  1,
        teams_approved:    1,
        status:           1 >= maxAllowed ? 'full' : 'open',
      })
    }
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {loadError && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3"
             style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="text-red-500 text-xs">Error al cargar las solicitudes.</p>
          <button
            type="button"
            onClick={loadRegistrations}
            className="text-red-400 text-xs underline underline-offset-2 hover:text-red-300 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl px-4 py-3"
             style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="text-red-500 text-xs">{actionError}</p>
        </div>
      )}

      <RequestsSection
        registrations={pending}
        loading={loading}
        actingId={actingId}
        fullCategoryIds={fullCategoryIds}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <div className="h-px" style={{ background: '#E0E2E6' }} />

      <ApprovedSection
        registrations={decided}
        loading={loading}
        filter={filter}
        onFilterChange={setFilter}
      />
    </div>
  )
}
