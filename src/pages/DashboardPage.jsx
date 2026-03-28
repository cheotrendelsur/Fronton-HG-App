import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

// ─── Datos mock (se reemplazarán en Fase 2) ────────────────────────────────
const MOCK_TOURNAMENTS = [
  {
    id: 1,
    name: 'Open Verano 2025',
    sport: 'Pádel',
    sportEmoji: '🎾',
    phase: 'Fase de Grupos',
    progress: 60,
    daysLeft: 3,
    categories: ['3.ª', '4.ª'],
    matchesToday: 4,
  },
  {
    id: 2,
    name: 'Liga Tenis Indoor',
    sport: 'Tenis',
    sportEmoji: '🎾',
    phase: 'Cuartos de Final',
    progress: 80,
    daysLeft: 1,
    categories: ['A', 'B'],
    matchesToday: 6,
  },
]

const MOCK_STANDINGS = [
  { pos: 1, name: 'García / López',   pts: 9, w: 3, l: 0, diff: '+12', trend: 'up'   },
  { pos: 2, name: 'Martín / Ruiz',    pts: 6, w: 2, l: 1, diff: '+4',  trend: 'same' },
  { pos: 3, name: 'Torres / Vega',    pts: 6, w: 2, l: 1, diff: '+2',  trend: 'up'   },
  { pos: 4, name: 'Sanz / Molina',    pts: 3, w: 1, l: 2, diff: '-3',  trend: 'down' },
  { pos: 5, name: 'Díaz / Fernández', pts: 0, w: 0, l: 3, diff: '-15', trend: 'down' },
]

const MOCK_NEXT_MATCH = {
  tournament: 'Open Verano 2025',
  category:   '3.ª Categoría',
  court:      'Pista 1',
  time:       '19:30',
  day:        'Hoy',
  teamA:      'García / López',
  teamB:      'Martín / Ruiz',
}
// ────────────────────────────────────────────────────────────────────────────

// Componente: Card base
function Card({ children, className = '' }) {
  return (
    <div className={`
      bg-surface-900 border border-border-default rounded-2xl
      shadow-card overflow-hidden
      ${className}
    `}>
      {children}
    </div>
  )
}

// Componente: Badge de deporte/fase
function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-surface-700 text-ink-secondary',
    neon:    'bg-neon-900 text-neon-300 border border-neon-800',
    warning: 'bg-amber-950 text-amber-400 border border-amber-900',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

// Componente: Barra de progreso
function ProgressBar({ value }) {
  return (
    <div className="w-full h-1 bg-surface-600 rounded-full overflow-hidden">
      <div
        className="h-full bg-neon-300 rounded-full transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

// Componente: Indicador de tendencia
function TrendIcon({ trend }) {
  if (trend === 'up')   return <span className="text-neon-400 text-xs">▲</span>
  if (trend === 'down') return <span className="text-red-400 text-xs">▼</span>
  return <span className="text-ink-muted text-xs">—</span>
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const isOrganizer = profile?.role === 'organizer'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6 animate-fade-up">

        {/* ── Header ──────────────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-ink-muted text-sm">{greeting},</p>
            <h1 className="text-ink-primary text-2xl font-semibold tracking-tight mt-0.5">
              @{profile?.username}
            </h1>
          </div>
          <div className="w-11 h-11 rounded-full bg-neon-900 border border-neon-800 flex items-center justify-center shadow-neon-sm">
            <span className="text-neon-300 text-lg font-bold uppercase">
              {profile?.username?.[0] ?? '?'}
            </span>
          </div>
        </header>

        {/* ── Próximo partido (card destacada) ─────────────────── */}
        <Card className="relative">
          {/* Borde izquierdo neon */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-300 rounded-l-2xl shadow-neon-sm" />

          <div className="p-4 pl-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-ink-muted text-xs font-medium uppercase tracking-widest">
                Próximo Partido
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-300 animate-pulse-neon" />
                <span className="text-neon-300 text-xs font-medium">{MOCK_NEXT_MATCH.day}</span>
              </div>
            </div>

            {/* Equipos */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 text-center">
                <p className="text-ink-primary font-semibold text-sm leading-tight">
                  {MOCK_NEXT_MATCH.teamA}
                </p>
              </div>
              <div className="flex-shrink-0 text-center">
                <span className="text-ink-muted text-xs font-bold tracking-widest">VS</span>
              </div>
              <div className="flex-1 text-center">
                <p className="text-ink-primary font-semibold text-sm leading-tight">
                  {MOCK_NEXT_MATCH.teamB}
                </p>
              </div>
            </div>

            {/* Meta-info */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="neon">{MOCK_NEXT_MATCH.time}</Badge>
              <Badge>{MOCK_NEXT_MATCH.court}</Badge>
              <Badge>{MOCK_NEXT_MATCH.category}</Badge>
            </div>
          </div>
        </Card>

        {/* ── Torneos Activos ───────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-ink-primary font-semibold text-base">Torneos Activos</h2>
            <button className="text-neon-400 text-sm font-medium hover:text-neon-300 transition-colors">
              Ver todos
            </button>
          </div>

          <div className="space-y-3">
            {MOCK_TOURNAMENTS.map((t, i) => (
              <Card
                key={t.id}
                className="active:scale-[0.985] transition-transform duration-150 cursor-pointer"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center text-xl flex-shrink-0">
                        {t.sportEmoji}
                      </div>
                      <div>
                        <h3 className="text-ink-primary font-semibold text-sm leading-tight">
                          {t.name}
                        </h3>
                        <p className="text-ink-muted text-xs mt-0.5">{t.sport}</p>
                      </div>
                    </div>
                    <Badge variant={t.daysLeft <= 1 ? 'warning' : 'default'}>
                      {t.daysLeft === 1 ? 'Mañana acaba' : `${t.daysLeft} días`}
                    </Badge>
                  </div>

                  {/* Progreso */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-muted text-xs">{t.phase}</span>
                      <span className="text-ink-secondary text-xs font-medium">{t.progress}%</span>
                    </div>
                    <ProgressBar value={t.progress} />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                    <div className="flex gap-1.5">
                      {t.categories.map(c => (
                        <Badge key={c}>Cat. {c}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-300" />
                      <span className="text-ink-secondary text-xs">
                        {t.matchesToday} partidos hoy
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* CTA para organizador */}
            {isOrganizer && (
              <button className="
                w-full py-3.5 rounded-2xl border-2 border-dashed border-border-strong
                text-ink-muted text-sm font-medium
                hover:border-neon-800 hover:text-neon-400 hover:bg-neon-900/20
                transition-all duration-200
                flex items-center justify-center gap-2
              ">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M12 8v8M8 12h8" strokeLinecap="round"/>
                </svg>
                Crear nuevo torneo
              </button>
            )}
          </div>
        </section>

        {/* ── Clasificación Preview ────────────────────────────── */}
        <section className="pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-ink-primary font-semibold text-base">Clasificación</h2>
            <div className="flex items-center gap-2">
              <Badge>Grupo A</Badge>
              <button className="text-neon-400 text-sm font-medium hover:text-neon-300 transition-colors">
                Ver todo
              </button>
            </div>
          </div>

          <Card>
            {/* Header tabla */}
            <div className="grid grid-cols-[28px_1fr_36px_36px_36px_40px] gap-2 px-4 py-2.5 border-b border-border-subtle">
              <span className="text-ink-muted text-[10px] font-semibold uppercase tracking-wider text-center">#</span>
              <span className="text-ink-muted text-[10px] font-semibold uppercase tracking-wider">Pareja</span>
              <span className="text-ink-muted text-[10px] font-semibold uppercase tracking-wider text-center">V</span>
              <span className="text-ink-muted text-[10px] font-semibold uppercase tracking-wider text-center">D</span>
              <span className="text-ink-muted text-[10px] font-semibold uppercase tracking-wider text-center">+/-</span>
              <span className="text-ink-muted text-[10px] font-semibold uppercase tracking-wider text-center">Pts</span>
            </div>

            {/* Filas */}
            {MOCK_STANDINGS.map((row, i) => (
              <div
                key={row.pos}
                className={`
                  grid grid-cols-[28px_1fr_36px_36px_36px_40px] gap-2
                  px-4 py-3 items-center
                  ${i < MOCK_STANDINGS.length - 1 ? 'border-b border-border-subtle' : ''}
                  ${row.pos === 1 ? 'bg-neon-900/20' : ''}
                  transition-colors hover:bg-surface-800/50
                `}
              >
                {/* Posición */}
                <div className="flex items-center justify-center">
                  {row.pos <= 2 ? (
                    <span className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold
                      ${row.pos === 1 ? 'bg-neon-300 text-ink-inverse' : 'bg-surface-600 text-ink-secondary'}
                    `}>
                      {row.pos}
                    </span>
                  ) : (
                    <span className="text-ink-muted text-xs text-center w-full">{row.pos}</span>
                  )}
                </div>

                {/* Nombre */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <TrendIcon trend={row.trend} />
                  <span className={`text-sm truncate ${
                    row.pos === 1 ? 'text-ink-primary font-medium' : 'text-ink-secondary'
                  }`}>
                    {row.name}
                  </span>
                </div>

                {/* Victorias */}
                <span className="text-ink-secondary text-xs text-center">{row.w}</span>
                {/* Derrotas */}
                <span className="text-ink-secondary text-xs text-center">{row.l}</span>
                {/* Diferencia */}
                <span className={`text-xs text-center font-mono ${
                  row.diff.startsWith('+') ? 'text-neon-400' :
                  row.diff.startsWith('-') ? 'text-red-400' : 'text-ink-muted'
                }`}>
                  {row.diff}
                </span>

                {/* Puntos */}
                <span className={`text-sm font-bold text-center ${
                  row.pos === 1 ? 'text-neon-300' : 'text-ink-primary'
                }`}>
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