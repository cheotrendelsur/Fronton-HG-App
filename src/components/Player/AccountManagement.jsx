import { useState, useEffect } from 'react'
import { mockCurrentPlayer } from '../../mockData'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  const bg = type === 'success' ? '#F0FDF4' : type === 'info' ? '#EFF6FF' : '#FEF2F2'
  const border = type === 'success' ? '#BBF7D0' : type === 'info' ? '#BFDBFE' : '#FECACA'
  const color = type === 'success' ? '#16A34A' : type === 'info' ? '#3B82F6' : '#EF4444'

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
      <span style={{
        color,
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: 'DM Sans, sans-serif',
      }}>
        {message}
      </span>
    </div>
  )
}

export default function AccountManagement({ profile, onProfileUpdated }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdErrors, setPwdErrors] = useState({})
  const [pwdSaving, setPwdSaving] = useState(false)

  const initialUsername = USE_MOCK ? mockCurrentPlayer.username : (profile?.username || '')
  const initialEmail = USE_MOCK ? mockCurrentPlayer.email : (profile?.email || '')
  const hasChanges = username !== initialUsername || email !== initialEmail

  useEffect(() => {
    if (USE_MOCK) {
      setUsername(mockCurrentPlayer.username)
      setEmail(mockCurrentPlayer.email)
    } else if (profile) {
      setUsername(profile.username || '')
      setEmail(profile.email || '')
    }
  }, [profile])

  function validateFields() {
    const errs = {}
    if (!username.trim()) errs.username = 'El nombre de usuario es obligatorio'
    if (username.trim().length < 3) errs.username = 'Mínimo 3 caracteres'
    if (!email.trim()) errs.email = 'El email es obligatorio'
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Formato de email inválido'
    }
    return errs
  }

  async function handleSave() {
    const errs = validateFields()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)

    if (USE_MOCK) {
      // Simulated save
      setTimeout(() => {
        setSaving(false)
        setToast({ message: 'Cambios guardados', type: 'success' })
        onProfileUpdated?.({ ...profile, username: username.trim(), email: email.trim() })
      }, 1000)
      return
    }

    // Real Supabase logic preserved
    try {
      const { supabase } = await import('../../lib/supabaseClient')
      if (username !== profile?.username) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username.trim())
          .neq('id', profile.id)
          .maybeSingle()
        if (existing) {
          setErrors({ username: 'Este nombre de usuario ya está en uso' })
          setSaving(false)
          return
        }
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ username: username.trim(), email: email.trim() })
        .eq('id', profile.id)

      if (profileErr) throw profileErr

      if (email.trim() !== profile?.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email: email.trim() })
        if (authErr) throw authErr
      }

      setToast({ message: 'Datos actualizados correctamente', type: 'success' })
      onProfileUpdated?.({ ...profile, username: username.trim(), email: email.trim() })
    } catch (err) {
      console.error('Account save error:', err)
      setToast({ message: err.message || 'Error al guardar', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function validatePasswords() {
    const errs = {}
    if (!passwords.current) errs.current = 'Ingresa tu contraseña actual'
    if (!passwords.newPwd) errs.newPwd = 'Ingresa la nueva contraseña'
    if (passwords.newPwd.length > 0 && passwords.newPwd.length < 6) errs.newPwd = 'Mínimo 6 caracteres'
    if (passwords.newPwd !== passwords.confirm) errs.confirm = 'Las contraseñas no coinciden'
    return errs
  }

  async function handlePasswordChange() {
    const errs = validatePasswords()
    setPwdErrors(errs)
    if (Object.keys(errs).length) return

    setPwdSaving(true)

    if (USE_MOCK) {
      setTimeout(() => {
        setPwdSaving(false)
        setToast({ message: 'Funcionalidad próximamente', type: 'info' })
        setShowPasswordForm(false)
        setPasswords({ current: '', newPwd: '', confirm: '' })
        setPwdErrors({})
      }, 800)
      return
    }

    try {
      const { supabase } = await import('../../lib/supabaseClient')
      const { error } = await supabase.auth.updateUser({ password: passwords.newPwd })
      if (error) throw error
      setToast({ message: 'Contraseña actualizada correctamente', type: 'success' })
      setShowPasswordForm(false)
      setPasswords({ current: '', newPwd: '', confirm: '' })
      setPwdErrors({})
    } catch (err) {
      console.error('Password change error:', err)
      setToast({ message: err.message || 'Error al cambiar contraseña', type: 'error' })
    } finally {
      setPwdSaving(false)
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%',
    background: '#FFFFFF',
    border: `1px solid ${hasError ? '#EF4444' : '#E0E2E6'}`,
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#1F2937',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 200ms',
    boxSizing: 'border-box',
  })

  const labelStyle = {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#6B7280',
    marginBottom: '6px',
    display: 'block',
    fontFamily: 'DM Sans, sans-serif',
  }

  const errorStyle = {
    color: '#EF4444',
    fontSize: '11px',
    marginTop: '4px',
    fontFamily: 'DM Sans, sans-serif',
  }

  return (
    <div style={{ padding: '0 16px' }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Section card */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E0E2E6',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E8EAEE',
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#6B7280',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Datos personales
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Username */}
          <div>
            <label style={labelStyle}>Nombre de usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: undefined })) }}
              style={inputStyle(errors.username)}
              onFocus={e => e.target.style.borderColor = '#6BB3D9'}
              onBlur={e => e.target.style.borderColor = errors.username ? '#EF4444' : '#E0E2E6'}
            />
            {errors.username && <p style={errorStyle}>{errors.username}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
              style={inputStyle(errors.email)}
              onFocus={e => e.target.style.borderColor = '#6BB3D9'}
              onBlur={e => e.target.style.borderColor = errors.email ? '#EF4444' : '#E0E2E6'}
            />
            {errors.email && <p style={errorStyle}>{errors.email}</p>}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            aria-label="Guardar cambios"
            style={{
              width: '100%',
              background: hasChanges ? '#6BB3D9' : '#E5E7EB',
              color: hasChanges ? '#FFFFFF' : '#9CA3AF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              opacity: saving ? 0.7 : 1,
              transition: 'all 200ms',
              boxShadow: hasChanges ? '0 0 12px rgba(107,179,217,0.15)' : 'none',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Password section */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E0E2E6',
        borderRadius: '16px',
        overflow: 'hidden',
        marginTop: '16px',
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: showPasswordForm ? '1px solid #E8EAEE' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#6B7280',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Contraseña
          </span>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            aria-label={showPasswordForm ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
            style={{
              background: 'none',
              border: 'none',
              color: '#6BB3D9',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {showPasswordForm ? 'Cancelar' : 'Cambiar'}
          </button>
        </div>

        {showPasswordForm && (
          <div style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'playerPageEnter 200ms ease-out both',
          }}>
            {/* Current password */}
            <div>
              <label style={labelStyle}>Contraseña actual</label>
              <input
                type="password"
                value={passwords.current}
                onChange={e => { setPasswords(p => ({ ...p, current: e.target.value })); setPwdErrors(p => ({ ...p, current: undefined })) }}
                placeholder="Tu contraseña actual"
                style={inputStyle(pwdErrors.current)}
                onFocus={e => e.target.style.borderColor = '#6BB3D9'}
                onBlur={e => e.target.style.borderColor = pwdErrors.current ? '#EF4444' : '#E0E2E6'}
              />
              {pwdErrors.current && <p style={errorStyle}>{pwdErrors.current}</p>}
            </div>

            {/* New password */}
            <div>
              <label style={labelStyle}>Nueva contraseña</label>
              <input
                type="password"
                value={passwords.newPwd}
                onChange={e => { setPasswords(p => ({ ...p, newPwd: e.target.value })); setPwdErrors(p => ({ ...p, newPwd: undefined })) }}
                placeholder="Mínimo 6 caracteres"
                style={inputStyle(pwdErrors.newPwd)}
                onFocus={e => e.target.style.borderColor = '#6BB3D9'}
                onBlur={e => e.target.style.borderColor = pwdErrors.newPwd ? '#EF4444' : '#E0E2E6'}
              />
              {pwdErrors.newPwd && <p style={errorStyle}>{pwdErrors.newPwd}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label style={labelStyle}>Confirmar contraseña</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={e => { setPasswords(p => ({ ...p, confirm: e.target.value })); setPwdErrors(p => ({ ...p, confirm: undefined })) }}
                placeholder="Repite la contraseña"
                style={inputStyle(pwdErrors.confirm)}
                onFocus={e => e.target.style.borderColor = '#6BB3D9'}
                onBlur={e => e.target.style.borderColor = pwdErrors.confirm ? '#EF4444' : '#E0E2E6'}
              />
              {pwdErrors.confirm && <p style={errorStyle}>{pwdErrors.confirm}</p>}
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={pwdSaving}
              aria-label="Actualizar contraseña"
              style={{
                width: '100%',
                background: '#6BB3D9',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
                opacity: pwdSaving ? 0.7 : 1,
                transition: 'all 200ms',
                boxShadow: '0 0 12px rgba(107,179,217,0.15)',
              }}
            >
              {pwdSaving ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
