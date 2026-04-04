/**
 * InscriptionFlowModal — 3-step partnership request flow.
 * Step 1: Select categories  |  Step 2: Search partner per category  |  Step 3: Confirm
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../../lib/supabaseClient'
import usePartnershipRequest from '../../../hooks/usePartnershipRequest'

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

export default function InscriptionFlowModal({ tournament, playerId, onClose, onSuccess }) {
  const { createRequest, searchPlayers, availablePlayers, searchLoading } = usePartnershipRequest()

  const [step, setStep] = useState(0)
  const [selectedCats, setSelectedCats] = useState([])
  const [partners, setPartners] = useState({})       // { catId: { id, username } }
  const [searchText, setSearchText] = useState({})    // { catId: string }
  const [catProgress, setCatProgress] = useState({})  // { catId: { approved, existing } }
  const [activeCatSearch, setActiveCatSearch] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const categories = tournament.categories ?? []
  const fee = tournament.inscription_fee ?? 0

  // Load approved counts + existing registrations per category
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

        const { data: existing } = await supabase
          .from('tournament_registrations')
          .select('id, status')
          .eq('tournament_id', tournament.id)
          .eq('category_id', cat.id)
          .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)

        // Also check pending partnership requests
        const { data: pendingReqs } = await supabase
          .from('tournament_partnership_requests')
          .select('id, status')
          .eq('tournament_id', tournament.id)
          .eq('category_id', cat.id)
          .or(`requester_id.eq.${playerId},partner_requested_id.eq.${playerId}`)
          .in('status', ['pending_partner_acceptance', 'converted_to_registration'])

        progress[cat.id] = {
          approved: approvedCount ?? 0,
          existing: existing ?? [],
          pendingRequests: pendingReqs ?? [],
        }
      }
      setCatProgress(progress)
    }
    load()
  }, [tournament.id, categories, playerId])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Auto-close on success
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [success, onClose, onSuccess])

  const toggleCategory = (catId) => {
    setSelectedCats(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    )
  }

  const handleSearch = (catId, text) => {
    setSearchText(prev => ({ ...prev, [catId]: text }))
    setActiveCatSearch(catId)
    searchPlayers(tournament.id, catId, text)
  }

  const selectPartner = (catId, player) => {
    setPartners(prev => ({ ...prev, [catId]: player }))
    setSearchText(prev => ({ ...prev, [catId]: '' }))
    setActiveCatSearch(null)
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    setError(null)
    try {
      for (const catId of selectedCats) {
        const partner = partners[catId]
        if (!partner) continue
        const result = await createRequest(tournament.id, catId, partner.id)
        if (!result.success) {
          setError(result.error)
          setSubmitting(false)
          return
        }
      }
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Error al enviar solicitudes')
    } finally {
      setSubmitting(false)
    }
  }

  const canGoStep2 = selectedCats.length > 0
  const canGoStep3 = selectedCats.every(catId => partners[catId])

  // Helpers
  const isCatFull = (cat) => {
    const p = catProgress[cat.id]
    return p && cat.max_couples > 0 && p.approved >= cat.max_couples
  }
  const isAlreadyInscribed = (cat) => {
    const p = catProgress[cat.id]
    return p?.existing?.some(e => e.status === 'approved')
  }
  const hasPendingRequest = (cat) => {
    const p = catProgress[cat.id]
    return p?.pendingRequests?.length > 0
  }

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'fadeIn 200ms ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: '480px', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 300ms ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid #E0E2E6', flexShrink: 0,
        }}>
          <button
            onClick={step > 0 && !success ? () => setStep(s => s - 1) : onClose}
            aria-label={step > 0 ? 'Volver' : 'Cerrar'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}
          >
            {step > 0 && !success ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            )}
          </button>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
            Solicitar Inscripcion
          </span>
          <div style={{ width: '28px' }} />
        </div>

        <Stepper current={step} total={3} />

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {success ? (
            <SuccessScreen />
          ) : step === 0 ? (
            <StepCategories
              categories={categories}
              selectedCats={selectedCats}
              catProgress={catProgress}
              toggleCategory={toggleCategory}
              isCatFull={isCatFull}
              isAlreadyInscribed={isAlreadyInscribed}
              hasPendingRequest={hasPendingRequest}
            />
          ) : step === 1 ? (
            <StepPartners
              categories={categories.filter(c => selectedCats.includes(c.id))}
              partners={partners}
              searchText={searchText}
              availablePlayers={activeCatSearch ? availablePlayers : []}
              searchLoading={searchLoading}
              activeCatSearch={activeCatSearch}
              onSearch={handleSearch}
              onSelect={selectPartner}
              onClear={(catId) => {
                setPartners(prev => { const n = { ...prev }; delete n[catId]; return n })
              }}
            />
          ) : (
            <StepConfirm
              categories={categories}
              selectedCats={selectedCats}
              partners={partners}
              fee={fee}
              error={error}
            />
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid #E0E2E6', flexShrink: 0,
            paddingBottom: 'env(safe-area-inset-bottom, 12px)',
          }}>
            {step === 0 && (
              <button onClick={() => setStep(1)} disabled={!canGoStep2}
                aria-label="Siguiente: seleccionar pareja"
                style={btnStyle(canGoStep2)}>Siguiente</button>
            )}
            {step === 1 && (
              <button onClick={() => setStep(2)} disabled={!canGoStep3}
                aria-label="Siguiente: confirmar"
                style={btnStyle(canGoStep3)}>Siguiente</button>
            )}
            {step === 2 && (
              <button onClick={handleConfirm} disabled={submitting}
                aria-label="Confirmar solicitudes de inscripcion"
                style={{ ...btnStyle(true), opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Enviando...' : 'Confirmar solicitudes'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

function btnStyle(enabled) {
  return {
    width: '100%',
    background: enabled ? '#6BB3D9' : '#E5E7EB',
    color: enabled ? '#FFFFFF' : '#9CA3AF',
    border: 'none', borderRadius: '12px', padding: '14px',
    fontSize: '14px', fontWeight: 600,
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 200ms',
    boxShadow: enabled ? '0 0 12px rgba(107,179,217,0.15)' : 'none',
  }
}

// ── Step 1: Category selection ──
function StepCategories({ categories, selectedCats, catProgress, toggleCategory, isCatFull, isAlreadyInscribed, hasPendingRequest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
        Selecciona las categorias en las que quieres inscribirte:
      </p>
      {categories.map(cat => {
        const full = isCatFull(cat)
        const inscribed = isAlreadyInscribed(cat)
        const pending = hasPendingRequest(cat)
        const disabled = full || inscribed || pending
        const checked = selectedCats.includes(cat.id)
        const p = catProgress[cat.id]
        const spots = cat.max_couples - (p?.approved ?? 0)

        return (
          <button
            key={cat.id}
            onClick={() => !disabled && toggleCategory(cat.id)}
            disabled={disabled}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: checked ? '#E8F4FA' : '#FFFFFF',
              border: `1px solid ${checked ? '#6BB3D9' : '#E0E2E6'}`,
              borderRadius: '12px', padding: '14px 16px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1, textAlign: 'left',
              transition: 'all 200ms', width: '100%',
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: '20px', height: '20px', borderRadius: '6px',
              border: `2px solid ${checked ? '#6BB3D9' : '#D1D5DB'}`,
              background: checked ? '#6BB3D9' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 200ms',
            }}>
              {(checked || inscribed) && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: 0 }}>{cat.name}</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '2px 0 0' }}>
                {inscribed ? 'Ya inscrito' : pending ? 'Solicitud pendiente' : full ? 'Completa' : `${spots} plaza${spots !== 1 ? 's' : ''} disponible${spots !== 1 ? 's' : ''}`}
              </p>
            </div>

            {inscribed && (
              <span style={{ fontSize: '10px', fontWeight: 600, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '2px 8px' }}>Inscrito</span>
            )}
            {pending && (
              <span style={{ fontSize: '10px', fontWeight: 600, background: '#FFF5D6', color: '#92750F', border: '1px solid #F5E6A3', borderRadius: '6px', padding: '2px 8px' }}>Pendiente</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Step 2: Partner search per category ──
function StepPartners({ categories, partners, searchText, availablePlayers, searchLoading, activeCatSearch, onSearch, onSelect, onClear }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>
        Busca un companero para cada categoria:
      </p>
      {categories.map(cat => {
        const selected = partners[cat.id]
        const text = searchText[cat.id] ?? ''
        const isActive = activeCatSearch === cat.id
        const results = isActive ? availablePlayers : []

        return (
          <div key={cat.id} style={{
            background: '#F9FAFB', border: '1px solid #E0E2E6',
            borderRadius: '12px', padding: '14px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>{cat.name}</p>

            {selected ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#E8F4FA', borderRadius: '10px', padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#6BB3D9', color: '#FFFFFF', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 600,
                  }}>
                    {selected.username?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937' }}>{selected.username}</span>
                </div>
                <button onClick={() => onClear(cat.id)} aria-label="Cambiar companero"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '12px', fontWeight: 500 }}>
                  Cambiar
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text" value={text}
                  onChange={e => onSearch(cat.id, e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  style={{
                    width: '100%', background: '#FFFFFF', border: '1px solid #E0E2E6',
                    borderRadius: '10px', padding: '10px 12px', fontSize: '13px',
                    color: '#1F2937', outline: 'none', transition: 'border-color 200ms',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6BB3D9'}
                  onBlur={e => { setTimeout(() => e.target.style.borderColor = '#E0E2E6', 200) }}
                />
                {searchLoading && isActive && (
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px' }}>Buscando...</p>
                )}
                {results.length > 0 && (
                  <div style={{
                    marginTop: '4px', background: '#FFFFFF', border: '1px solid #E0E2E6',
                    borderRadius: '10px', overflow: 'hidden',
                  }}>
                    {results.map(p => (
                      <button key={p.id} onClick={() => onSelect(cat.id, p)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          width: '100%', padding: '10px 12px', border: 'none',
                          background: 'transparent', cursor: 'pointer', textAlign: 'left',
                          borderBottom: '1px solid #F3F4F6', transition: 'background 150ms',
                        }}
                        onPointerDown={e => e.currentTarget.style.background = '#F3F4F6'}
                        onPointerUp={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: '#E8F4FA', color: '#3A8BB5', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 600,
                        }}>
                          {p.username?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937', margin: 0 }}>{p.username}</p>
                          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{p.email}</p>
                        </div>
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
  )
}

// ── Step 3: Confirmation ──
function StepConfirm({ categories, selectedCats, partners, fee, error }) {
  const totalCost = fee * selectedCats.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>
        Se enviaran solicitudes de pareja. Tu companero debe aceptar antes de que el organizador apruebe la inscripcion.
      </p>

      {selectedCats.map(catId => {
        const cat = categories.find(c => c.id === catId)
        const partner = partners[catId]
        return (
          <div key={catId} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FFFFFF', border: '1px solid #E0E2E6',
            borderRadius: '12px', padding: '12px 16px',
          }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', margin: 0 }}>{cat?.name}</p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>
                Pareja: {partner?.username ?? '?'}
              </p>
            </div>
            <span style={{
              fontSize: '10px', fontWeight: 600, background: '#E8F4FA', color: '#3A8BB5',
              borderRadius: '6px', padding: '2px 8px',
            }}>
              Solicitud
            </span>
          </div>
        )
      })}

      {totalCost > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
          background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E0E2E6',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>Costo total</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', fontFamily: 'DM Mono, monospace' }}>
            ${totalCost.toLocaleString('es-AR')}
          </span>
        </div>
      )}

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: '12px', padding: '10px 16px',
        }}>
          <p style={{ fontSize: '12px', color: '#EF4444', margin: 0 }}>{error}</p>
        </div>
      )}
    </div>
  )
}

// ── Success screen ──
function SuccessScreen() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
      <div style={{ animation: 'successPop 400ms ease-out both' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <p style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
        ¡Solicitudes enviadas!
      </p>
      <p style={{ fontSize: '13px', color: '#6B7280' }}>
        Tu companero debe aceptar la solicitud. Recibiras una notificacion.
      </p>
    </div>
  )
}
