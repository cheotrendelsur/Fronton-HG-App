import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockCurrentPlayer } from '../../mockData'
import usePlayerContext from '../../hooks/usePlayerContext'
import ProfileHeader from '../../components/Player/ProfileHeader'
import PlayerStats from '../../components/Player/PlayerStats'
import AccountManagement from '../../components/Player/AccountManagement'
import PlayerPreferences from '../../components/Player/PlayerPreferences'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

function ProfileSkeleton() {
  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Header gradient skeleton */}
      <div className="shimmer" style={{ height: '200px', borderRadius: '0 0 24px 24px', marginBottom: '24px' }} />
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Stats grid skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[0,1,2,3].map(i => <div key={i} className="shimmer" style={{ height: '80px', borderRadius: '16px' }} />)}
        </div>
        {/* Account card skeleton */}
        <div className="shimmer" style={{ height: '200px', borderRadius: '16px' }} />
        {/* Preferences skeleton */}
        <div className="shimmer" style={{ height: '160px', borderRadius: '16px' }} />
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#6B7280',
      marginBottom: '8px',
      padding: '0 16px',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {children}
    </h2>
  )
}

function TermsModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 200ms ease-out both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '20px 20px 0 0',
          maxHeight: '85vh',
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 300ms ease-out both',
        }}
      >
        {/* Drag handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0 4px',
        }}>
          <div style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            background: '#D1D5DB',
          }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '8px 16px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E0E2E6',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1F2937',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Términos de uso
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: '#F3F4F6',
              border: '1px solid #E0E2E6',
              borderRadius: '12px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '16px',
          overflowY: 'auto',
          flex: 1,
        }}>
          <div style={{
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#4B5563',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            <p style={{ marginBottom: '12px' }}>
              <strong>1. Uso de la Plataforma</strong><br />
              Frontón HGV es una aplicación para la gestión de torneos de deportes de raqueta. Al registrarte, aceptas utilizar la plataforma de forma responsable y conforme a las normas de la Hermandad Gallega de Venezuela.
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>2. Datos Personales</strong><br />
              Los datos proporcionados (nombre, email) se utilizan exclusivamente para la gestión de torneos y la comunicación entre organizadores y jugadores. No compartimos información con terceros.
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>3. Responsabilidad</strong><br />
              Los organizadores son responsables de la correcta gestión de sus torneos. Los jugadores se comprometen a respetar los horarios y resultados registrados en la plataforma.
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>4. Modificaciones</strong><br />
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Se notificará a los usuarios de cambios significativos.
            </p>
            <p>
              <strong>5. Contacto</strong><br />
              Para consultas o reportes, contacta al administrador de la plataforma a través de la Hermandad Gallega de Venezuela.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Toast({ message, type, onClose }) {
  const bg = type === 'success' ? '#F0FDF4' : type === 'info' ? '#EFF6FF' : '#FEF2F2'
  const border = type === 'success' ? '#BBF7D0' : type === 'info' ? '#BFDBFE' : '#FECACA'
  const color = type === 'success' ? '#16A34A' : type === 'info' ? '#3B82F6' : '#EF4444'

  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="profile-toast-enter" style={{
      position: 'fixed',
      top: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: '12px',
      padding: '10px 20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
      maxWidth: '90vw',
    }}>
      <span style={{ color, fontSize: '13px', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
        {message}
      </span>
    </div>
  )
}

export default function PlayerProfile() {
  const navigate = useNavigate()
  const { playerId, playerProfile, playerRegistrations, loading, refetch } = usePlayerContext()
  const [profile, setProfile] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [toast, setToast] = useState(null)
  const [pullState, setPullState] = useState('idle')
  const [mockLoading, setMockLoading] = useState(USE_MOCK)
  const startYRef = useRef(0)
  const mainRef = useRef(null)

  useEffect(() => {
    if (USE_MOCK) {
      const t = setTimeout(() => setMockLoading(false), 500)
      return () => clearTimeout(t)
    }
  }, [])

  // Mock profile adapted
  const mockProfile = USE_MOCK ? {
    id: mockCurrentPlayer.id,
    username: mockCurrentPlayer.username,
    email: mockCurrentPlayer.email,
    avatar_url: mockCurrentPlayer.avatarUrl,
    status: mockCurrentPlayer.status,
  } : null

  const currentProfile = USE_MOCK ? (profile || mockProfile) : (profile || playerProfile)

  function handleAvatarUpdated(url) {
    if (USE_MOCK) {
      setToast({ message: 'Funcionalidad próximamente', type: 'info' })
      return
    }
    setProfile(p => ({ ...(p || playerProfile), avatar_url: url }))
  }

  function handleProfileUpdated(updated) {
    setProfile(updated)
  }

  async function handleSignOut() {
    setSigningOut(true)
    setToast({ message: 'Cerrando sesión...', type: 'info' })
    try {
      const { supabase } = await import('../../lib/supabaseClient')
      await supabase.auth.signOut()
      navigate('/auth', { replace: true })
    } catch (err) {
      console.error('Sign out error:', err)
      setSigningOut(false)
    }
  }

  const handleRefresh = useCallback(async () => {
    if (USE_MOCK) return
    setPullState('refreshing')
    await refetch()
    setTimeout(() => setPullState('idle'), 400)
  }, [refetch])

  const onTouchStart = useCallback(e => {
    if (USE_MOCK) return
    if (mainRef.current?.scrollTop > 0) return
    startYRef.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback(e => {
    if (USE_MOCK) return
    if (pullState === 'refreshing') return
    if (mainRef.current?.scrollTop > 0) return
    const deltaY = e.touches[0].clientY - startYRef.current
    if (deltaY > 60) setPullState('pulling')
  }, [pullState])

  const onTouchEnd = useCallback(() => {
    if (USE_MOCK) return
    if (pullState === 'pulling') handleRefresh()
    else setPullState('idle')
  }, [pullState, handleRefresh])

  if (mockLoading || (!USE_MOCK && loading && !currentProfile)) {
    return <ProfileSkeleton />
  }

  return (
    <div
      ref={mainRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ paddingBottom: '32px' }}
    >
      {/* Toast */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Pull to refresh indicator */}
      {!USE_MOCK && pullState !== 'idle' && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{
            animation: pullState === 'refreshing' ? 'spin 0.8s linear infinite' : 'none',
          }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="#6BB3D9" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* 1. Profile Header */}
      <ProfileHeader
        profile={currentProfile}
        onAvatarUpdated={handleAvatarUpdated}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
        {/* 2. Stats */}
        <div>
          <SectionTitle>Estadísticas</SectionTitle>
          <PlayerStats
            playerId={USE_MOCK ? 'mock-player-001' : playerId}
            registrations={USE_MOCK ? null : playerRegistrations}
          />
        </div>

        {/* 3. Account Management */}
        <div>
          <SectionTitle>Mi cuenta</SectionTitle>
          <AccountManagement
            profile={currentProfile}
            onProfileUpdated={handleProfileUpdated}
          />
        </div>

        {/* 4. Preferences */}
        <div>
          <SectionTitle>Preferencias</SectionTitle>
          <PlayerPreferences playerId={USE_MOCK ? 'mock-player-001' : playerId} />
        </div>

        {/* 5. Separator + Actions */}
        <div style={{
          borderTop: '1px solid #E8EAEE',
          margin: '8px 16px 0',
          paddingTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Cerrar sesión"
            className="player-card-press"
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid #EF4444',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#EF4444',
              fontFamily: 'DM Sans, sans-serif',
              cursor: signingOut ? 'not-allowed' : 'pointer',
              opacity: signingOut ? 0.6 : 1,
              transition: 'all 200ms',
            }}
          >
            {signingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>

          {/* Terms link */}
          <button
            onClick={() => setShowTerms(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              fontSize: '12px',
              fontWeight: 400,
              textDecoration: 'underline',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              padding: '4px 0',
            }}
          >
            Términos de uso
          </button>
        </div>
      </div>

      {/* Terms modal */}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  )
}
