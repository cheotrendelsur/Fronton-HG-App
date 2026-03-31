import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import CategoryProgressCard from './CategoryProgressCard'

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="rounded-2xl p-4 space-y-3 animate-pulse"
             style={{ background: '#FFFFFF', border: '1px solid #E0E2E6' }}>
          <div className="flex justify-between">
            <div className="h-3.5 rounded-full w-1/3" style={{ background: '#E5E7EB' }} />
            <div className="h-3.5 rounded-full w-10" style={{ background: '#E5E7EB' }} />
          </div>
          <div className="h-3 rounded-full w-full" style={{ background: '#E5E7EB' }} />
          <div className="h-3 rounded-full w-1/4" style={{ background: '#E5E7EB' }} />
        </div>
      ))}
    </div>
  )
}

export default function ProgresoTab({ tournament }) {
  const [progressMap, setProgressMap]   = useState({})
  const [teamsByCat, setTeamsByCat]     = useState({})
  const [loading,     setLoading]       = useState(true)
  const [loadError,   setLoadError]     = useState(false)

  const categories = tournament.categories ?? []

  const loadProgress = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [progRes, regsRes] = await Promise.all([
        supabase
          .from('tournament_progress')
          .select('category_id, teams_approved, max_teams_allowed, status')
          .eq('tournament_id', tournament.id),
        supabase
          .from('tournament_registrations')
          .select('id, team_name, category_id, status, player1_id, player2_id')
          .eq('tournament_id', tournament.id)
          .eq('status', 'approved'),
      ])
      if (progRes.error) throw progRes.error
      const map = {}
      for (const row of (progRes.data ?? [])) map[row.category_id] = row
      setProgressMap(map)

      // Resolve player names
      const regs = regsRes.data ?? []
      const playerIds = [...new Set(regs.flatMap(r => [r.player1_id, r.player2_id]).filter(Boolean))]
      const profileMap = {}
      if (playerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', playerIds)
        for (const p of (profiles ?? [])) profileMap[p.id] = p
      }

      const byCat = {}
      for (const reg of regs) {
        if (!byCat[reg.category_id]) byCat[reg.category_id] = []
        byCat[reg.category_id].push({
          ...reg,
          player1: profileMap[reg.player1_id] ?? null,
          player2: profileMap[reg.player2_id] ?? null,
        })
      }
      setTeamsByCat(byCat)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [tournament.id])

  useEffect(() => { loadProgress() }, [loadProgress])

  return (
    <div className="px-4 py-6 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#1F2937' }}>
        Progreso de Inscripción
      </h3>

      {loadError && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3"
             style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="text-red-500 text-xs">Error al cargar el progreso.</p>
          <button type="button" onClick={loadProgress}
            className="text-red-500 text-xs underline underline-offset-2 hover:text-red-400 transition-colors">
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : categories.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Sin categorías registradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => {
            const prog     = progressMap[cat.id]
            const approved = prog?.teams_approved    ?? 0
            const max      = prog?.max_teams_allowed ?? cat.max_couples ?? 0
            return (
              <CategoryProgressCard
                key={cat.id}
                categoryName={cat.name}
                approved={approved}
                max={max}
                teams={teamsByCat[cat.id] ?? []}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
