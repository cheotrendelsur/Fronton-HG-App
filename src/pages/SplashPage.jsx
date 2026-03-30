import { useEffect, useState } from 'react'
import lobo from '../assets/lobo.png'

const SPLASH_KEY = 'hgv-splash-shown'

export default function SplashPage({ onDone }) {
  const [phase, setPhase] = useState('enter') // 'enter' | 'exit'

  useEffect(() => {
    // Phase: enter (1.2s) → hold → exit starts at 2.2s
    const exitTimer = setTimeout(() => setPhase('exit'), 2200)
    const doneTimer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, '1')
      onDone()
    }, 2700)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <>
      <style>{`
        @keyframes hgv-shield-enter {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes hgv-title-enter {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hgv-sub-enter {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hgv-exit {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.1); }
        }
        .splash-shield-enter {
          animation: hgv-shield-enter 1.2s ease-out both;
        }
        .splash-shield-exit {
          animation: hgv-exit 0.5s ease-in both;
        }
        .splash-title-enter {
          animation: hgv-title-enter 0.5s ease-out 0.3s both;
        }
        .splash-title-exit {
          animation: hgv-exit 0.5s ease-in both;
        }
        .splash-sub-enter {
          animation: hgv-sub-enter 0.5s ease-out 0.5s both;
        }
        .splash-sub-exit {
          animation: hgv-exit 0.5s ease-in both;
        }
        .splash-wrap-exit {
          animation: hgv-exit 0.5s ease-in both;
        }
        @media (prefers-reduced-motion: reduce) {
          .splash-shield-enter, .splash-shield-exit,
          .splash-title-enter, .splash-title-exit,
          .splash-sub-enter, .splash-sub-exit,
          .splash-wrap-exit {
            animation: none;
          }
        }
      `}</style>

      <div
        className={phase === 'exit' ? 'splash-wrap-exit' : ''}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: '#1E2024',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
        aria-hidden="true"
      >
        {/* Shield */}
        <img
          src={lobo}
          alt="Escudo HGV"
          className={phase === 'exit' ? 'splash-shield-exit' : 'splash-shield-enter'}
          style={{ width: '160px', height: 'auto', display: 'block' }}
        />

        {/* Title */}
        <p
          className={phase === 'exit' ? 'splash-title-exit' : 'splash-title-enter'}
          style={{
            color: '#E5E7EB',
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            margin: 0,
          }}
        >
          FRONTÓN HGV
        </p>

        {/* Tagline */}
        <p
          className={phase === 'exit' ? 'splash-sub-exit' : 'splash-sub-enter'}
          style={{
            color: '#6B7280',
            fontSize: '13px',
            fontStyle: 'italic',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            margin: 0,
          }}
        >
          Por nuestro frontón y raíces
        </p>

        {/* Footer text */}
        <p
          className={phase === 'exit' ? 'splash-sub-exit' : 'splash-sub-enter'}
          style={{
            color: '#4B5563',
            fontSize: '10px',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            margin: 0,
            animationDelay: phase === 'exit' ? '0s' : '0.7s',
          }}
        >
          Hermandad Gallega de Venezuela
        </p>
      </div>
    </>
  )
}

export { SPLASH_KEY }
