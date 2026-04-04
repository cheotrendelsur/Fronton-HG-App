import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const username = profile?.username ?? 'Usuario'
  const email = profile?.email ?? ''
  const role = profile?.role ?? ''
  const initial = username.charAt(0).toUpperCase()

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <Layout>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '32px 16px 24px',
          background: 'linear-gradient(180deg, #E8F4FA 0%, #F2F3F5 100%)',
          borderRadius: '16px', marginBottom: '24px',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: '#6BB3D9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid #FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            marginBottom: '12px',
          }}>
            <span style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
              {initial}
            </span>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: 0 }}>{username}</p>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>{email}</p>
          <span style={{
            marginTop: '8px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', background: '#E8F4FA', color: '#3A8BB5',
            borderRadius: '6px', padding: '3px 10px', border: '1px solid #D0E5F0',
          }}>
            {role === 'organizer' ? 'Organizador' : role === 'admin' ? 'Administrador' : role}
          </span>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="Cerrar sesion"
          style={{
            width: '100%', background: 'transparent',
            border: '1px solid #EF4444', borderRadius: '12px',
            padding: '14px', fontSize: '14px', fontWeight: 600,
            color: '#EF4444', fontFamily: 'DM Sans, sans-serif',
            cursor: signingOut ? 'not-allowed' : 'pointer',
            opacity: signingOut ? 0.6 : 1,
            transition: 'all 200ms',
          }}
        >
          {signingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}
        </button>
      </div>
    </Layout>
  )
}
