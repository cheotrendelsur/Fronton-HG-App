import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function usePlayerContext() {
  const { session, profile } = useAuth()
  const playerId = session?.user?.id ?? null

  const [playerRegistrations, setPlayerRegistrations] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetchRegistrations = useCallback(async () => {
    if (!playerId) {
      setPlayerRegistrations([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('tournament_registrations')
        .select(`
          id,
          team_name,
          player1_id,
          player2_id,
          status,
          category_id,
          tournament_id,
          categories ( id, name ),
          tournaments ( id, name, status, start_date, end_date, sport_id )
        `)
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .eq('status', 'approved')

      if (err) throw err
      setPlayerRegistrations(data ?? [])
    } catch (e) {
      console.error('usePlayerContext fetch error:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  return {
    playerId,
    playerProfile: profile,
    playerRegistrations,
    loading,
    error,
    refetch: fetchRegistrations,
  }
}
