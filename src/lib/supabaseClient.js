import { createClient } from '@supabase/supabase-js'
import { get, set, del } from 'idb-keyval'

const idbStorage = {
  getItem:    (key)        => get(key).then(v => v ?? null),
  setItem:    (key, value) => set(key, value),
  removeItem: (key)        => del(key),
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let _instance = null

function getClient() {
  if (_instance) return _instance

  _instance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession:     true,
      storageKey:         'rackettourneys-auth-v2',
      storage:            idbStorage,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
      lock:               (_name, _timeout, fn) => fn(),
    },
    global: {
      // Esto garantiza que apikey viaje en TODAS las peticiones,
      // incluyendo functions.invoke — resuelve el 401 del Gateway
      headers: {
        apikey: supabaseKey,
      },
    },
  })

  return _instance
}

export const supabase = getClient()

export async function refreshSessionSafely() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) return false

    const now       = Math.floor(Date.now() / 1000)
    const expiresAt = data.session.expires_at ?? 0

    if (expiresAt - now < 300) {
      const { error: refreshErr } = await supabase.auth.refreshSession()
      if (refreshErr) {
        await supabase.auth.signOut()
        return false
      }
    }

    return true
  } catch {
    return false
  }
}