import Layout from '../components/Layout'

export default function OrganizerHubPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-2">
        <p className="text-sm font-medium" style={{ color: '#1F2937' }}>Panel de Control de Torneos</p>
        <p className="text-xs opacity-50" style={{ color: '#6B7280' }}>Disponible en próximas fases</p>
      </div>
    </Layout>
  )
}
