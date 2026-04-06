// Tablas de clasificación por categoría
export const mockGroupClassifications = {
  'cat-masc-3': {
    groupName: 'Grupo A',
    standings: [
      { position: 1, teamName: 'Pérez / Ramos',      played: 3, won: 3, lost: 0, setsWon: 6, setsLost: 1, gamesDiff: '+28', points: 9, isCurrentPlayer: false },
      { position: 2, teamName: 'Martínez / Pinto',   played: 3, won: 2, lost: 1, setsWon: 5, setsLost: 2, gamesDiff: '+15', points: 6, isCurrentPlayer: true },
      { position: 3, teamName: 'Rivera / Gómez',      played: 2, won: 1, lost: 1, setsWon: 2, setsLost: 3, gamesDiff: '-5',  points: 3, isCurrentPlayer: false },
      { position: 4, teamName: 'Fernández / Castro',  played: 2, won: 0, lost: 2, setsWon: 0, setsLost: 4, gamesDiff: '-22', points: 0, isCurrentPlayer: false },
      { position: 5, teamName: 'Vargas / Ruiz',       played: 2, won: 0, lost: 2, setsWon: 1, setsLost: 4, gamesDiff: '-16', points: 0, isCurrentPlayer: false }
    ]
  },
  'cat-masc-4': {
    groupName: 'Grupo B',
    standings: [
      { position: 1, teamName: 'Torres / López',      played: 3, won: 2, lost: 1, setsWon: 5, setsLost: 3, gamesDiff: '+10', points: 6, isCurrentPlayer: false },
      { position: 2, teamName: 'Martínez / Díaz',       played: 2, won: 1, lost: 1, setsWon: 3, setsLost: 3, gamesDiff: '+2',  points: 3, isCurrentPlayer: true },
      { position: 3, teamName: 'Morales / Suárez',     played: 2, won: 1, lost: 1, setsWon: 3, setsLost: 3, gamesDiff: '-1',  points: 3, isCurrentPlayer: false },
      { position: 4, teamName: 'Gil / Martínez',       played: 3, won: 1, lost: 2, setsWon: 2, setsLost: 4, gamesDiff: '-11', points: 3, isCurrentPlayer: false }
    ]
  }
};

// Bracket de eliminatoria (para cuando se avance a esa fase)
export const mockBracket = {
  'cat-masc-3': {
    phases: [
      {
        name: 'Semifinales',
        matches: [
          { id: 'sf-1', team1: '1° Grupo A', team2: '2° Grupo B', score1: null, score2: null, winner: null, status: 'pending' },
          { id: 'sf-2', team1: '1° Grupo B', team2: '2° Grupo A', score1: null, score2: null, winner: null, status: 'pending' }
        ]
      },
      {
        name: 'Final',
        matches: [
          { id: 'final-1', team1: 'Ganador SF1', team2: 'Ganador SF2', score1: null, score2: null, winner: null, status: 'pending' }
        ]
      }
    ]
  }
};
