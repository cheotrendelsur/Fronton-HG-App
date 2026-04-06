// Jugador logueado simulado
export const mockCurrentPlayer = {
  id: 'mock-player-001',
  username: 'José Martínez',
  email: 'jose.martinez@hgv.com',
  avatarUrl: null, // Sin avatar — se muestra inicial "C"
  role: 'player',
  status: 'active',
  joinedDate: '2025-09-15'
};

// Estadísticas históricas del jugador
export const mockPlayerStats = {
  totalMatches: 42,
  matchesWon: 28,
  matchesLost: 14,
  winRate: 66.7,
  setsWon: 58,
  setsLost: 27,
  gamesWon: 728,
  gamesLost: 517,
  // Stats filtradas por categoría
  byCategory: {
    'cat-masc-3': { played: 24, won: 18, lost: 6, winRate: 75.0 },
    'cat-masc-4': { played: 18, won: 10, lost: 8, winRate: 55.6 }
  }
};

// Preferencias del jugador
export const mockPlayerPreferences = {
  theme: 'light',
  notifyScheduleChanges: true,
  notifySetbacks: true,
  notifyResults: true,
  notifyGeneral: false
};
