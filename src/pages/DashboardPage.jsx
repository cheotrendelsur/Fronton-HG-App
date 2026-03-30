import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

// ─── Mock data (se reemplazará con Supabase) ────────────────────────────────
const MOCK_TOURNAMENTS = [
  { id: 1, name: 'Open Verano 2025',  sport: 'Pádel', phase: 'Fase de Grupos',   progress: 60, daysLeft: 3, categories: ['3.ª', '4.ª'], matchesToday: 4, status: 'active' },
  { id: 2, name: 'Liga Tenis Indoor', sport: 'Tenis', phase: 'Cuartos de Final', progress: 80, daysLeft: 1, categories: ['A', 'B'],       matchesToday: 6, status: 'active' },
]

const MOCK_STANDINGS = [
  { pos: 1, name: 'García / López',   pts: 9, w: 3, l: 0, diff: '+12', trend: 'up'   },
  { pos: 2, name: 'Martín / Ruiz',    pts: 6, w: 2, l: 1, diff: '+4',  trend: 'same' },
  { pos: 3, name: 'Torres / Vega',    pts: 6, w: 2, l: 1, diff: '+2',  trend: 'up'   },
  { pos: 4, name: 'Sanz / Molina',    pts: 3, w: 1, l: 2, diff: '-3',  trend: 'down' },
  { pos: 5, name: 'Díaz / Fernández', pts: 0, w: 0, l: 3, diff: '-15', trend: 'down' },
]

const MOCK_NEXT_MATCH = {
  category: '3.ª Categoría', court: 'Pista 1', time: '19:30', day: 'Hoy',
  teamA: 'García / López', teamB: 'Martín / Ruiz',
}
// ────────────────────────────────────────────────────────────────────────────

const STATUS_ACCENT = { active: '#6BB3D9', draft: '#D1D5DB', finished: '#22C55E' }

function Card({ children, className = '', accentColor }) {
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden ${className}`}
      style={{
        border:     '1px solid #E8EAEE',
        boxShadow:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        borderLeft: accentColor ? `4px solid ${accentColor}` : '1px solid #E8EAEE',
      }}
    >
      {children}
    </div>
  )
}

function Badge({ children, variant = 'default' }) {
  const styles = {
    default:  { background: '#F3F4F6', color: '#4B5563' },
    celeste:  { background: '#E8F4FA', color: '#3A8BB5' },
    warning:  { background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' },
    finished: { background: '#F0FDF4', color: '#16A34A' },
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={styles[variant] ?? styles.default}
    >
      {children}
    </span>
  )
}

function ProgressBar({ value }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: '#6BB3D9' }} />
    </div>
  )
}

function TrendIcon({ trend }) {
  if (trend === 'up')   return <span style={{ color: '#6BB3D9', fontSize: '10px' }}>▲</span>
  if (trend === 'down') return <span style={{ color: '#EF4444', fontSize: '10px' }}>▼</span>
  return <span style={{ color: '#9CA3AF', fontSize: '10px' }}>—</span>
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const isOrganizer = profile?.role === 'organizer'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-2 space-y-6 animate-fade-up">

        {/* ── Bienvenida ───────────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <div>
            <p style={{ color: '#6B7280', fontSize: '13px' }}>{greeting},</p>
            <h1 style={{ color: '#1F2937', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', margin: '2px 0 0' }}>
              Bienvenido a Frontón HGV
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '2px' }}>@{profile?.username}</p>
          </div>
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#E8F4FA', border: '2px solid #6BB3D9' }}
          >
            <span style={{ color: '#3A8BB5', fontSize: '17px', fontWeight: 700 }}>
              {(profile?.username?.[0] ?? '?').toUpperCase()}
            </span>
          </div>
        </header>

        {/* ── Próximo partido ───────────────────────────────────── */}
        <Card accentColor={STATUS_ACCENT.active}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: '#6B7280', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Próximo Partido
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#6BB3D9' }} />
                <span style={{ color: '#6BB3D9', fontSize: '12px', fontWeight: 500 }}>{MOCK_NEXT_MATCH.day}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <p className="flex-1 text-center" style={{ color: '#1F2937', fontWeight: 600, fontSize: '13px', lineHeight: 1.3 }}>
                {MOCK_NEXT_MATCH.teamA}
              </p>
              <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em' }}>VS</span>
              <p className="flex-1 text-center" style={{ color: '#1F2937', fontWeight: 600, fontSize: '13px', lineHeight: 1.3 }}>
                {MOCK_NEXT_MATCH.teamB}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="celeste">{MOCK_NEXT_MATCH.time}</Badge>
              <Badge>{MOCK_NEXT_MATCH.court}</Badge>
              <Badge>{MOCK_NEXT_MATCH.category}</Badge>
            </div>
          </div>
        </Card>

        {/* ── Torneos Activos ───────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ color: '#1F2937', fontWeight: 600, fontSize: '15px' }}>Torneos Activos</h2>
            <button style={{ color: '#6BB3D9', fontSize: '13px', fontWeight: 500 }}>Ver todos</button>
          </div>

          <div className="space-y-3">
            {MOCK_TOURNAMENTS.map(t => (
              <Card
                key={t.id}
                accentColor={STATUS_ACCENT[t.status] ?? STATUS_ACCENT.draft}
                className="active:scale-[0.985] transition-transform duration-150 cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 style={{ color: '#1F2937', fontWeight: 600, fontSize: '14px', lineHeight: 1.3 }}>{t.name}</h3>
                      <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '2px' }}>{t.sport}</p>
                    </div>
                    <Badge variant={t.daysLeft <= 1 ? 'warning' : 'default'}>
                      {t.daysLeft === 1 ? 'Mañana acaba' : `${t.daysLeft} días`}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#6B7280', fontSize: '12px' }}>{t.phase}</span>
                      <span style={{ color: '#6BB3D9', fontSize: '12px', fontWeight: 600 }}>{t.progress}%</span>
                    </div>
                    <ProgressBar value={t.progress} />
                  </div>

                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
                    <div className="flex gap-1.5">
                      {t.categories.map(c => <Badge key={c}>Cat. {c}</Badge>)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6BB3D9' }} />
                      <span style={{ color: '#6B7280', fontSize: '12px' }}>{t.matchesToday} partidos hoy</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {isOrganizer && (
              <button
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200"
                style={{ border: '2px dashed #D1D5DB', color: '#9CA3AF', fontSize: '14px', fontWeight: 500 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                  <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8" strokeLinecap="round"/>
                </svg>
                Crear nuevo torneo
              </button>
            )}
          </div>
        </section>

        {/* ── Clasificación Preview ────────────────────────────── */}
        <section className="pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ color: '#1F2937', fontWeight: 600, fontSize: '15px' }}>Clasificación</h2>
            <div className="flex items-center gap-2">
              <Badge>Grupo A</Badge>
              <button style={{ color: '#6BB3D9', fontSize: '13px', fontWeight: 500 }}>Ver todo</button>
            </div>
          </div>

          <Card>
            <div className="grid grid-cols-[28px_1fr_36px_36px_36px_40px] gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
              {['#','Pareja','V','D','+/-','Pts'].map((h, i) => (
                <span key={i} style={{ color: '#9CA3AF', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 1 ? 'left' : 'center' }}>
                  {h}
                </span>
              ))}
            </div>

            {MOCK_STANDINGS.map((row, i) => (
              <div
                key={row.pos}
                className="grid grid-cols-[28px_1fr_36px_36px_36px_40px] gap-2 px-4 py-3 items-center"
                style={{
                  borderBottom: i < MOCK_STANDINGS.length - 1 ? '1px solid #F9FAFB' : undefined,
                  background:   row.pos === 1 ? '#F0F9FF' : undefined,
                }}
              >
                <div className="flex items-center justify-center">
                  {row.pos <= 2 ? (
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{ background: row.pos === 1 ? '#6BB3D9' : '#F3F4F6', color: row.pos === 1 ? '#FFFFFF' : '#6B7280' }}
                    >
                      {row.pos}
                    </span>
                  ) : (
                    <span style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center', width: '100%', display: 'block' }}>{row.pos}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 min-w-0">
                  <TrendIcon trend={row.trend} />
                  <span className="text-sm truncate" style={{ color: row.pos === 1 ? '#1F2937' : '#374151', fontWeight: row.pos === 1 ? 600 : 400 }}>
                    {row.name}
                  </span>
                </div>

                <span style={{ color: '#6B7280', fontSize: '12px', textAlign: 'center' }}>{row.w}</span>
                <span style={{ color: '#6B7280', fontSize: '12px', textAlign: 'center' }}>{row.l}</span>
                <span
                  className="text-xs text-center font-mono"
                  style={{ color: row.diff.startsWith('+') ? '#6BB3D9' : row.diff.startsWith('-') ? '#EF4444' : '#9CA3AF' }}
                >
                  {row.diff}
                </span>
                <span className="text-sm font-bold text-center" style={{ color: row.pos === 1 ? '#6BB3D9' : '#1F2937' }}>
                  {row.pts}
                </span>
              </div>
            ))}
          </Card>
        </section>

      </div>
    </Layout>
  )
}
