/**
 * usePartnershipRequest — Hook that centralizes partnership request logic.
 */
import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import {
  createPartnershipRequest,
  acceptPartnershipRequest,
  declinePartnershipRequest,
  searchAvailablePlayers,
  getPendingPartnershipRequests,
} from '../services/partnership/partnershipRequestPersistence'

export default function usePartnershipRequest() {
  const { session } = useAuth()
  const playerId = session?.user?.id ?? null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pendingRequests, setPendingRequests] = useState({ asRequester: [], asPartner: [] })
  const [availablePlayers, setAvailablePlayers] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const debounceRef = useRef(null)

  /** Create a partnership request */
  const createRequest = useCallback(async (tournamentId, categoryId, partnerRequestedId) => {
    if (!playerId) return { success: false, error: 'No autenticado' }
    setLoading(true)
    setError(null)
    try {
      const result = await createPartnershipRequest(supabase, tournamentId, categoryId, playerId, partnerRequestedId)
      if (!result.success) setError(result.error)
      return result
    } finally {
      setLoading(false)
    }
  }, [playerId])

  /** Accept a partnership request (as the requested partner) */
  const acceptRequest = useCallback(async (requestId) => {
    if (!playerId) return { success: false, error: 'No autenticado' }
    setLoading(true)
    setError(null)
    try {
      const result = await acceptPartnershipRequest(supabase, requestId, playerId)
      if (!result.success) setError(result.error)
      return result
    } finally {
      setLoading(false)
    }
  }, [playerId])

  /** Decline a partnership request (as the requested partner) */
  const declineRequest = useCallback(async (requestId, reason) => {
    if (!playerId) return { success: false, error: 'No autenticado' }
    setLoading(true)
    setError(null)
    try {
      const result = await declinePartnershipRequest(supabase, requestId, reason)
      if (!result.success) setError(result.error)
      return result
    } finally {
      setLoading(false)
    }
  }, [playerId])

  /** Search available players with 300ms debounce */
  const searchPlayers = useCallback((tournamentId, categoryId, searchTerm) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!searchTerm || searchTerm.length < 2) {
      setAvailablePlayers([])
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    debounceRef.current = setTimeout(async () => {
      const result = await searchAvailablePlayers(supabase, tournamentId, categoryId, searchTerm, playerId)
      setAvailablePlayers(result.success ? result.players : [])
      setSearchLoading(false)
    }, 300)
  }, [playerId])

  /** Fetch all pending partnership requests for the current player */
  const fetchPendingRequests = useCallback(async () => {
    if (!playerId) return { asRequester: [], asPartner: [] }
    setLoading(true)
    setError(null)
    try {
      const result = await getPendingPartnershipRequests(supabase, playerId)
      if (result.success) {
        setPendingRequests({ asRequester: result.asRequester, asPartner: result.asPartner })
      }
      return result
    } finally {
      setLoading(false)
    }
  }, [playerId])

  return {
    loading,
    searchLoading,
    error,
    pendingRequests,
    availablePlayers,
    createRequest,
    acceptRequest,
    declineRequest,
    searchPlayers,
    fetchPendingRequests,
  }
}
