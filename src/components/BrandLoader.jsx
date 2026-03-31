import lobo from '../assets/lobo.png'

export default function BrandLoader({ size = 48, className = '' }) {
  const ringSize = size + 16

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: ringSize, height: ringSize }}
    >
      {/* Anillo giratorio */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: '3px solid transparent',
          borderRightColor: '#6BB3D9',
          borderBottomColor: '#6BB3D9',
          borderLeftColor: '#6BB3D9',
          animation: 'brand-spin-ring 1.2s linear infinite',
        }}
      />
      {/* Escudo girando */}
      <img
        src={lobo}
        alt=""
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          animation: 'brand-spin-shield 2s linear infinite',
        }}
      />
      <style>{`
        @keyframes brand-spin-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes brand-spin-shield {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
