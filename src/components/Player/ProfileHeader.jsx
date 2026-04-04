import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function ProfileHeader({ profile, onAvatarUpdated }) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileRef = useRef(null)

  const avatarUrl = previewUrl || profile?.avatar_url
  const username = profile?.username || 'Jugador'
  const email = profile?.email || ''
  const initial = username.charAt(0).toUpperCase()

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return

    // Preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    setUploading(true)
    try {
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
    }}>
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
          onClick={() => fileRef.current?.click()}
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

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Name + email */}
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
      }}>
        {email}
      </p>
    </div>
  )
}
