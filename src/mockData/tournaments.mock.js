export const mockTournaments = [
  {
    id: 'tour-001',
    name: 'Torneo Apertura HGV 2026',
    status: 'active',
    startDate: '2026-05-04',
    endDate: '2026-05-18',
    location: 'Sede Principal HGV — Caracas',
    inscriptionFee: 40,
    description: 'Gran torneo de apertura de la temporada 2026. Modalidad de grupos + eliminatoria directa.',
    coverImageUrl: null,
    prizeDescription: '🥇 Trofeo + $200 | 🥈 Medalla + $100 | 🥉 Medalla',
    rulesSummary: 'Partidos a 2 sets de 6 games con tie-break a 7. Tercer set super tie-break a 10 puntos.',
    categories: [
      { id: 'cat-masc-3', name: 'Masculina Tercera', maxCouples: 12, enrolledCount: 12 },
      { id: 'cat-masc-4', name: 'Masculina Cuarta', maxCouples: 12, enrolledCount: 10 },
      { id: 'cat-fem-3', name: 'Femenina Tercera', maxCouples: 8, enrolledCount: 6 }
    ],
    courts: [
      { id: 'court-a', name: 'Cancha Principal' },
      { id: 'court-b', name: 'Cancha Norte' },
      { id: 'court-c', name: 'Cancha Sur' }
    ],
    days: ['2026-05-04', '2026-05-05', '2026-05-11', '2026-05-12', '2026-05-18'],
    progress: { completed: 18, total: 42, percentage: 43 }
  },
  {
    id: 'tour-002',
    name: 'Copa Gallega Clausura',
    status: 'inscription',
    startDate: '2026-06-14',
    endDate: '2026-06-28',
    location: 'Sede Principal HGV — Caracas',
    inscriptionFee: 50,
    description: 'Torneo de clausura con premiación especial para las mejores parejas del semestre.',
    coverImageUrl: null,
    prizeDescription: '🥇 Trofeo + $300 | 🥈 $150 | 🥉 $75',
    rulesSummary: 'Partidos a muerte súbita a 30 puntos.',
    categories: [
      { id: 'cat-cl-masc-3', name: 'Masculina Tercera', maxCouples: 16, enrolledCount: 4 },
      { id: 'cat-cl-masc-4', name: 'Masculina Cuarta', maxCouples: 16, enrolledCount: 2 },
      { id: 'cat-cl-master', name: 'Máster', maxCouples: 8, enrolledCount: 0 }
    ],
    courts: [
      { id: 'court-a', name: 'Cancha Principal' },
      { id: 'court-b', name: 'Cancha Norte' }
    ],
    days: ['2026-06-14', '2026-06-15', '2026-06-21', '2026-06-22', '2026-06-28'],
    progress: { completed: 0, total: 0, percentage: 0 }
  }
];
