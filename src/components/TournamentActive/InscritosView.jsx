import CategoryAccordion from './CategoryAccordion'

export default function InscritosView({ categories, teamsByCategory }) {
  return (
    <div className="space-y-3">
      {categories.map(cat => (
        <CategoryAccordion
          key={cat.id}
          category={cat}
          teams={teamsByCategory[cat.id] ?? []}
        />
      ))}

      {categories.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>No hay categorías en este torneo</p>
        </div>
      )}
    </div>
  )
}
