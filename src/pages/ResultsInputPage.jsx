import Layout from '../components/Layout'

export default function ResultsInputPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-2">
        <p className="text-ink-secondary text-sm font-medium">Carga de Marcadores</p>
        <p className="text-ink-muted text-xs opacity-50">Disponible en próximas fases</p>
      </div>
    </Layout>
  )
}