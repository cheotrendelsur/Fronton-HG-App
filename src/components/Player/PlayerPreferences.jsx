import { useState, useEffect } from 'react'
import { mockPlayerPreferences } from '../../mockData'

const USE_MOCK = true // Cambiar a false cuando se conecte Supabase

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: checked ? '#6BB3D9' : '#E5E7EB',
        border: 'none',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 200ms',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'left 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }} />
    </button>
  )
}

function PreferenceRow({ label, description, checked, onChange, disabled, isLast }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: isLast ? 'none' : '1px solid #E8EAEE',
      gap: '12px',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#1F2937',
          fontFamily: 'DM Sans, sans-serif',
          marginBottom: description ? '2px' : 0,
        }}>
          {label}
        </p>
        {description && (
          <p style={{
            fontSize: '11px',
            color: '#9CA3AF',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {description}
          </p>
        )}
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

export default function PlayerPreferences({ playerId }) {
  const [prefs, setPrefs] = useState({
    theme: 'light',
    notify_schedule_changes: true,
    notify_setbacks: true,
    notify_results: true,
    notify_general: true,
  })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (USE_MOCK) {
      setPrefs({
        theme: mockPlayerPreferences.theme,
        notify_schedule_changes: mockPlayerPreferences.notifyScheduleChanges,
        notify_setbacks: mockPlayerPreferences.notifySetbacks,
        notify_results: mockPlayerPreferences.notifyResults,
        notify_general: mockPlayerPreferences.notifyGeneral,
      })
      setLoading(false)
      return
    }

    if (!playerId) return
    loadPreferences()
  }, [playerId])

  async function loadPreferences() {
    if (USE_MOCK) return
    setLoading(true)
    try {
      const { supabase } = await import('../../lib/supabaseClient')
      const { data, error } = await supabase
        .from('player_preferences')
        .select('*')
        .eq('player_id', playerId)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setPrefs({
          theme: data.theme || 'light',
          notify_schedule_changes: data.notify_schedule_changes ?? true,
          notify_setbacks: data.notify_setbacks ?? true,
          notify_results: data.notify_results ?? true,
          notify_general: data.notify_general ?? true,
        })
      }
    } catch (err) {
      console.error('Load preferences error:', err)
    } finally {
      setLoading(false)
    }
  }

  function updatePref(key, value) {
    const prev = prefs[key]
    setPrefs(p => ({ ...p, [key]: value }))

    if (USE_MOCK) {
      if (key === 'theme') {
        setToast('Tema oscuro próximamente')
        setTimeout(() => setToast(null), 2500)
        // Revert after showing toast since we're not implementing dark mode
        setTimeout(() => setPrefs(p => ({ ...p, theme: prev })), 300)
      }
      return
    }

    // Real Supabase update
    ;(async () => {
      try {
        const { supabase } = await import('../../lib/supabaseClient')
        const { error } = await supabase
          .from('player_preferences')
          .update({ [key]: value, updated_at: new Date().toISOString() })
          .eq('player_id', playerId)
        if (error) throw error
      } catch (err) {
        console.error('Update preference error:', err)
        setPrefs(p => ({ ...p, [key]: prev }))
      }
    })()
  }

  if (loading) {
    return (
      <div style={{ padding: '0 16px' }}>
        <div className="shimmer" style={{ height: '200px', borderRadius: '16px' }} />
      </div>
    )
  }

  const notifications = [
    { key: 'notify_schedule_changes', label: 'Cambios de horario', description: 'Aviso cuando cambia el horario de un partido' },
    { key: 'notify_setbacks', label: 'Contratiempos de cancha', description: 'Alertas sobre incidencias en canchas' },
    { key: 'notify_results', label: 'Resultados de partidos', description: 'Notificación al registrar un resultado' },
    { key: 'notify_general', label: 'Generales', description: 'Anuncios y novedades del torneo' },
  ]

  return (
    <div style={{ padding: '0 16px', position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div className="profile-toast-enter" style={{
          position: 'fixed',
          top: '72px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '10px 20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
          maxWidth: '90vw',
        }}>
          <span style={{ color: '#3B82F6', fontSize: '13px', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
            {toast}
          </span>
        </div>
      )}

      {/* Theme toggle */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E0E2E6',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}>
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
            Apariencia
          </span>
        </div>
        <div style={{ padding: '4px 16px' }}>
          <PreferenceRow
            label="Modo oscuro"
            description="Cambia el tema visual de la aplicación"
            checked={prefs.theme === 'dark'}
            onChange={v => updatePref('theme', v ? 'dark' : 'light')}
            isLast
          />
        </div>
      </div>

      {/* Notifications */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E0E2E6',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
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
            Notificaciones
          </span>
        </div>
        <div style={{ padding: '0 16px' }}>
          {notifications.map((n, i) => (
            <PreferenceRow
              key={n.key}
              label={n.label}
              description={n.description}
              checked={prefs[n.key]}
              onChange={v => updatePref(n.key, v)}
              isLast={i === notifications.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
