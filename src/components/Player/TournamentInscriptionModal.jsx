import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabaseClient'

function Stepper({ current, total }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px 0' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: i === current ? '24px' : '8px', height: '8px',
          borderRadius: '4px',
          background: i === current ? '#6BB3D9' : i < current ? '#A8D8EA' : '#E5E7EB',
          transition: 'all 300ms',
        }} />
      ))}
    </div>
  )
}

export default function TournamentInscriptionModal({ tournament, playerId, playerUsername, onClose, onSuccess }) {
  const [step, setStep] = useState(0) // 0=categories, 1=partners, 2=confirm
  const [selectedCats, setSelectedCats] = useState([]) // category ids
  const [partners, setPartners] = useState({}) // { categoryId: { id, username } }
  const [searchText, setSearchText] = useState({}) // { categoryId: string }
  const [searchResults, setSearchResults] = useState({}) // { categoryId: [] }
  const [searchLoading, setSearchLoading] = useState({})
  const [catProgress, setCatProgress] = useState({}) // { categoryId: { approved, existing } }
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const debounceRefs = useRef({})

  const categories = tournament.categories ?? []
  const fee = tournament.inscription_fee ?? 0

  // Load progress (approved count) for each category + existing registrations in this category
  useEffect(() => {
    async function load() {
      const progress = {}
      for (const cat of categories) {
        const { count: approvedCount } = await supabase
          .from('tournament_registrations')
          .select('id', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id)
          .eq('category_id', cat.id)
          .eq('status', 'approved')

        // Check existing registrations for the player in this category
        const { data: existing } = await supabase
          .from('tournament_registrations')
          .select('id, status')
          .eq('tournament_id', tournament.id)
          .eq('category_id', cat.id)
          .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)

        progress[cat.id] = {
          approved: approvedCount ?? 0,
          existing: existing ?? [],
        }
      }
      setCatProgress(progress)
    }
    load()
  }, [tournament.id, categories, playerId])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const toggleCategory = (catId) => {
    setSelectedCats(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    )
  }

  const searchPartner = (catId, text) => {
    setSearchText(prev => ({ ...prev, [catId]: text }))

    if (debounceRefs.current[catId]) clearTimeout(debounceRefs.current[catId])
    if (!text || text.length < 2) {
      setSearchResults(prev => ({ ...prev, [catId]: [] }))
      return
    }

    debounceRefs.current[catId] = setTimeout(async () => {
      setSearchLoading(prev => ({ ...prev, [catId]: true }))

      const { data } = await supabase
        .from('profiles')
        .select('id, username, email')
        .or(`username.ilike.%${text}%,email.ilike.%${text}%`)
        .neq('id', playerId)
        .limit(5)

      setSearchResults(prev => ({ ...prev, [catId]: data ?? [] }))
      setSearchLoading(prev => ({ ...prev, [catId]: false }))
    }, 300)
  }

  const selectPartner = async (catId, profile) => {
    // Validate partner is not already registered in this category with another team
    const { data: existing } = await supabase
      .from('tournament_registrations')
      .select('id, team_name')
      .eq('tournament_id', tournament.id)
      .eq('category_id', catId)
      .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id}`)
      .in('status', ['approved', 'pending'])

    if (existing?.length) {
      setError(`${profile.username} ya esta inscrito/a en esta categoria con otra pareja`)
      setTimeout(() => setError(null), 3000)
      return
    }

    setPartners(prev => ({ ...prev, [catId]: profile }))
    setSearchText(prev => ({ ...prev, [catId]: '' }))
    setSearchResults(prev => ({ ...prev, [catId]: [] }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const rows = selectedCats.map(catId => {
        const partner = partners[catId]
        const teamName = `${playerUsername} / ${partner.username}`
        return {
          tournament_id: tournament.id,
          category_id: catId,
          player1_id: playerId,
          player2_id: partner.id,
          team_name: teamName,
          status: 'pending',
          inscription_fee: fee,
        }
      })

      const { error: insertErr } = await supabase
        .from('tournament_registrations')
        .insert(rows)

      if (insertErr) throw insertErr

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const canGoStep2 = selectedCats.length > 0
  const canGoStep3 = selectedCats.every(catId => partners[catId]?.id)

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      background: '#F2F3F5',
      animation: 'slideUp 300ms ease-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #E0E2E6',
        background: '#FFFFFF', flexShrink: 0,
      }}>
        <button
          onClick={step > 0 && !success ? () => setStep(s => s - 1) : onClose}
          aria-label={step > 0 && !success ? 'Volver al paso anterior' : 'Cerrar inscripcion'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px', display: 'flex', color: '#6B7280',
          }}
        >
          {step > 0 && !success ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          )}
        </button>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
          Inscripcion
        </span>
        <div style={{ width: '28px' }} />
      </div>

      <Stepper current={step} total={3} />

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: '12px', padding: '10px 14px',
            fontSize: '12px', color: '#EF4444', marginBottom: '12px',
          }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{
            textAlign: 'center', padding: '48px 16px',
            animation: 'playerPageEnter 300ms ease-out',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#F0FDF4', border: '2px solid #22C55E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              animation: 'successPop 400ms ease-out',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E"
                strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
              Inscripcion enviada
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              Tu solicitud fue enviada al organizador. Te notificaremos cuando sea aprobada.
            </p>
          </div>
        ) : step === 0 ? (
          /* Step 1: Category selection */
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Selecciona categorias
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(cat => {
                const prog = catProgress[cat.id]
                const approved = prog?.approved ?? 0
                const isFull = approved >= cat.max_couples
                const alreadyInscribed = prog?.existing?.length > 0
                const isSelected = selectedCats.includes(cat.id)
                const disabled = isFull || alreadyInscribed
                const spotsLeft = cat.max_couples - approved

                return (
                  <button
                    key={cat.id}
                    onClick={() => !disabled && toggleCategory(cat.id)}
                    disabled={disabled}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: isSelected ? '#E8F4FA' : '#FFFFFF',
                      border: `1px solid ${isSelected ? '#6BB3D9' : disabled ? '#E5E7EB' : '#E0E2E6'}`,
                      borderRadius: '12px', padding: '14px 16px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.6 : 1,
                      transition: 'all 200ms', textAlign: 'left', width: '100%',
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '6px',
                      border: `2px solid ${isSelected ? '#6BB3D9' : alreadyInscribed ? '#22C55E' : '#D1D5DB'}`,
                      background: isSelected ? '#6BB3D9' : alreadyInscribed ? '#22C55E' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 200ms',
                    }}>
                      {(isSelected || alreadyInscribed) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF"
                          strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                        {cat.name}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                        {isFull ? (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#F59E0B' }}>Completa</span>
                        ) : alreadyInscribed ? (
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#16A34A' }}>Ya inscrito</span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                            {spotsLeft} {spotsLeft === 1 ? 'plaza' : 'plazas'} disponible{spotsLeft !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : step === 1 ? (
          /* Step 2: Partner selection per category */
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Selecciona companero por categoria
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedCats.map(catId => {
                const cat = categories.find(c => c.id === catId)
                const partner = partners[catId]
                const text = searchText[catId] ?? ''
                const results = searchResults[catId] ?? []
                const isLoading = searchLoading[catId]

                return (
                  <div key={catId} style={{
                    background: '#FFFFFF', border: '1px solid #E0E2E6',
                    borderRadius: '12px', padding: '14px 16px',
                  }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: '#6B7280',
                    }}>
                      {cat?.name}
                    </span>

                    {partner ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginTop: '8px', background: '#F0FDF4', borderRadius: '8px',
                        padding: '8px 12px', border: '1px solid #BBF7D0',
                      }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>
                            {partner.username}
                          </span>
                          <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '8px' }}>
                            {partner.email}
                          </span>
                        </div>
                        <button
                          onClick={() => setPartners(prev => {
                            const next = { ...prev }
                            delete next[catId]
                            return next
                          })}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#EF4444', padding: '2px',
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative', marginTop: '8px' }}>
                        <input
                          type="text"
                          value={text}
                          onChange={e => searchPartner(catId, e.target.value)}
                          placeholder="Buscar por nombre o email..."
                          style={{
                            width: '100%', background: '#FFFFFF',
                            border: '1px solid #E0E2E6', borderRadius: '10px',
                            padding: '10px 12px', fontSize: '13px',
                            color: '#1F2937', fontFamily: 'DM Sans, sans-serif',
                            outline: 'none',
                          }}
                          onFocus={e => e.target.style.borderColor = '#6BB3D9'}
                          onBlur={e => { setTimeout(() => e.target.style.borderColor = '#E0E2E6', 200) }}
                        />

                        {/* Autocomplete dropdown */}
                        {(results.length > 0 || isLoading) && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: '#FFFFFF', border: '1px solid #E0E2E6',
                            borderRadius: '10px', marginTop: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 10, maxHeight: '160px', overflowY: 'auto',
                          }}>
                            {isLoading ? (
                              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#9CA3AF' }}>
                                Buscando...
                              </div>
                            ) : results.map(p => (
                              <button
                                key={p.id}
                                onMouseDown={() => selectPartner(catId, p)}
                                style={{
                                  display: 'block', width: '100%', textAlign: 'left',
                                  padding: '10px 12px', background: 'none',
                                  border: 'none', borderBottom: '1px solid #F3F4F6',
                                  cursor: 'pointer', fontSize: '13px',
                                }}
                              >
                                <span style={{ fontWeight: 500, color: '#1F2937' }}>{p.username}</span>
                                <span style={{ color: '#9CA3AF', marginLeft: '8px', fontSize: '11px' }}>{p.email}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Step 3: Confirmation */
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
              Confirmar inscripcion
            </h3>
            <div style={{
              background: '#FFFFFF', border: '1px solid #E0E2E6',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              {selectedCats.map((catId, i) => {
                const cat = categories.find(c => c.id === catId)
                const partner = partners[catId]
                return (
                  <div key={catId} style={{
                    padding: '14px 16px',
                    borderBottom: i < selectedCats.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: '#6B7280',
                    }}>
                      {cat?.name}
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937', marginTop: '4px' }}>
                      {playerUsername} / {partner?.username}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Total cost */}
            {fee > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '16px', padding: '14px 16px',
                background: '#FFFFFF', border: '1px solid #E0E2E6',
                borderRadius: '12px',
              }}>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>Costo total</span>
                <span style={{
                  fontSize: '16px', fontWeight: 700, color: '#1F2937',
                  fontFamily: 'DM Mono, monospace',
                }}>
                  ${(fee * selectedCats.length).toLocaleString('es-AR')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      {!success && (
        <div style={{
          padding: '12px 16px', borderTop: '1px solid #E0E2E6',
          background: '#FFFFFF', flexShrink: 0,
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        }}>
          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              disabled={!canGoStep2}
              aria-label="Siguiente: seleccionar companero"
              style={{
                width: '100%', background: canGoStep2 ? '#6BB3D9' : '#E5E7EB',
                color: canGoStep2 ? '#FFFFFF' : '#9CA3AF',
                border: 'none', borderRadius: '12px', padding: '14px',
                fontSize: '14px', fontWeight: 600, cursor: canGoStep2 ? 'pointer' : 'not-allowed',
                transition: 'all 200ms',
                boxShadow: canGoStep2 ? '0 0 12px rgba(107,179,217,0.15)' : 'none',
              }}
            >
              Siguiente
            </button>
          )}
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={!canGoStep3}
              aria-label="Siguiente: confirmar inscripcion"
              style={{
                width: '100%', background: canGoStep3 ? '#6BB3D9' : '#E5E7EB',
                color: canGoStep3 ? '#FFFFFF' : '#9CA3AF',
                border: 'none', borderRadius: '12px', padding: '14px',
                fontSize: '14px', fontWeight: 600, cursor: canGoStep3 ? 'pointer' : 'not-allowed',
                transition: 'all 200ms',
                boxShadow: canGoStep3 ? '0 0 12px rgba(107,179,217,0.15)' : 'none',
              }}
            >
              Siguiente
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%', background: '#6BB3D9',
                color: '#FFFFFF', border: 'none', borderRadius: '12px',
                padding: '14px', fontSize: '14px', fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                transition: 'all 200ms',
                boxShadow: '0 0 12px rgba(107,179,217,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {submitting && (
                <span style={{
                  width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#FFFFFF', borderRadius: '50%',
                  animation: 'spin 600ms linear infinite', display: 'inline-block',
                }} />
              )}
              {submitting ? 'Enviando...' : 'Confirmar inscripcion'}
            </button>
          )}
        </div>
      )}
    </div>,
    document.body
  )
}
