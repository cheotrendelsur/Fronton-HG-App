// Próximos partidos programados del jugador
export const mockScheduledMatches = [
  {
    id: 'match-001',
    tournamentId: 'tour-001',
    tournamentName: 'Torneo Apertura HGV 2026',
    categoryId: 'cat-masc-3',
    categoryName: 'Masculina Tercera',
    phase: 'group_phase',
    groupName: 'Grupo A',
    team1Name: 'Martínez / Pinto',
    team2Name: 'Rivera / Gómez',
    isPlayerTeam1: true,
    scheduledDate: '2026-05-11',
    scheduledTime: '17:30',
    courtName: 'Cancha Principal',
    status: 'scheduled'
  },
  {
    id: 'match-002',
    tournamentId: 'tour-001',
    tournamentName: 'Torneo Apertura HGV 2026',
    categoryId: 'cat-masc-4',
    categoryName: 'Masculina Cuarta',
    phase: 'group_phase',
    groupName: 'Grupo B',
    team1Name: 'Torres / López',
    team2Name: 'Martínez / Díaz',
    isPlayerTeam1: false,
    scheduledDate: '2026-05-11',
    scheduledTime: '18:30',
    courtName: 'Cancha Norte',
    status: 'scheduled'
  },
  {
    id: 'match-003',
    tournamentId: 'tour-001',
    tournamentName: 'Torneo Apertura HGV 2026',
    categoryId: 'cat-masc-3',
    categoryName: 'Masculina Tercera',
    phase: 'group_phase',
    groupName: 'Grupo A',
    team1Name: 'Martínez / Pinto',
    team2Name: 'Fernández / Castro',
    isPlayerTeam1: true,
    scheduledDate: '2026-05-12',
    scheduledTime: '09:00',
    courtName: 'Cancha Sur',
    status: 'scheduled'
  }
];

// Resultados recientes (partidos ya jugados)
export const mockCompletedMatches = [
  {
    id: 'match-past-001',
    tournamentId: 'tour-001',
    categoryId: 'cat-masc-3',
    categoryName: 'Masculina Tercera',
    team1Name: 'Martínez / Pinto',
    team2Name: 'Vargas / Ruiz',
    scoreTeam1: '6-4, 6-3',
    scoreTeam2: '4-6, 3-6',
    isPlayerWinner: true,
    completedDate: '2026-05-05'
  },
  {
    id: 'match-past-002',
    tournamentId: 'tour-001',
    categoryId: 'cat-masc-4',
    categoryName: 'Masculina Cuarta',
    team1Name: 'Martínez / Díaz',
    team2Name: 'Morales / Suárez',
    scoreTeam1: '3-6, 6-4, 7-10',
    scoreTeam2: '6-3, 4-6, 10-7',
    isPlayerWinner: false,
    completedDate: '2026-05-04'
  },
  {
    id: 'match-past-003',
    tournamentId: 'tour-001',
    categoryId: 'cat-masc-3',
    categoryName: 'Masculina Tercera',
    team1Name: 'Pérez / Ramos',
    team2Name: 'Martínez / Pinto',
    scoreTeam1: '2-6, 1-6',
    scoreTeam2: '6-2, 6-1',
    isPlayerWinner: true,
    completedDate: '2026-05-04'
  }
];
