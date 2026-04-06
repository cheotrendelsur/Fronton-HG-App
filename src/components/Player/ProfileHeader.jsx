import { useState, useRef } from 'react'
import { mockCurrentPlayer } from '../../mockData'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

export default function ProfileHeader({ profile, onAvatarUpdated }) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)

  const avatarUrl = previewUrl || profile?.avatar_url
  const username = profile?.username || 'Jugador'
  const email = profile?.email || ''
  const status = profile?.status || mockCurrentPlayer.status
  const initial = username.charAt(0).toUpperCase()

  function handleCameraClick() {
    if (USE_MOCK) {
      setToast('Funcionalidad próximamente')
      setTimeout(() => setToast(null), 2500)
      return
    }
    fileRef.current?.click()
  }

  async function handleFileChange(e) {
    if (USE_MOCK) return
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return

    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    setUploading(true)
    try {
      const { supabase } = await import('../../lib/supabaseClient')
      const ext = file.name.split('.').pop()
      const filePath = `${profile.id}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateErr) throw updateErr

      setPreviewUrl(publicUrl)
      onAvatarUpdated?.(publicUrl)
    } catch (err) {
      console.error('Avatar upload error:', err)
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="profile-header-enter" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 16px 24px',
      background: 'linear-gradient(180deg, #E8F4FA 0%, #F2F3F5 100%)',
      borderRadius: '0 0 24px 24px',
      position: 'relative',
    }}>
      {/* Toast */}
      {toast && (
        <div className="profile-toast-enter" style={{
          position: 'absolute',
          top: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '10px',
          padding: '6px 16px',
          zIndex: 10,
        }}>
          <span style={{ color: '#3B82F6', fontSize: '12px', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
            {toast}
          </span>
        </div>
      )}

      {/* Avatar */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '3px solid #FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          overflow: 'hidden',
          background: avatarUrl ? 'transparent' : '#6BB3D9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{
              color: '#FFFFFF',
              fontSize: '32px',
              fontWeight: 700,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {initial}
            </span>
          )}
        </div>

        {/* Camera button */}
        <button
          onClick={handleCameraClick}
          disabled={uploading}
          aria-label="Cambiar avatar"
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#6BB3D9',
            border: '2px solid #FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 200ms',
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </button>

        {!USE_MOCK && (
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        )}
      </div>

      {/* Name + email + badge */}
      <p style={{
        color: '#1F2937',
        fontSize: '20px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        fontFamily: 'DM Sans, sans-serif',
        marginBottom: '4px',
      }}>
        {username}
      </p>
      <p style={{
        color: '#6B7280',
        fontSize: '13px',
        fontWeight: 400,
        fontFamily: 'DM Sans, sans-serif',
        marginBottom: '8px',
      }}>
        {email}
      </p>

      {/* Status badge */}
      <span style={{
        fontSize: '10px',
        fontWeight: 600,
        background: '#F0FDF4',
        color: '#16A34A',
        border: '1px solid #BBF7D0',
        borderRadius: '6px',
        padding: '3px 10px',
        textTransform: 'capitalize',
      }}>
        {status === 'active' ? 'Activo' : status}
      </span>
    </div>
  )
}
