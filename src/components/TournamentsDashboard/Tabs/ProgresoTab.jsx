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
  const [progressMap, setProgressMap] = useState({})
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState(false)

  const categories = tournament.categories ?? []

  const loadProgress = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const { data, error } = await supabase
        .from('tournament_progress')
        .select('category_id, teams_approved, max_teams_allowed, status')
        .eq('tournament_id', tournament.id)
      if (error) throw error
      const map = {}
      for (const row of (data ?? [])) map[row.category_id] = row
      setProgressMap(map)
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
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
