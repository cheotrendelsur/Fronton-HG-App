export const mockNotifications = [
  {
    id: 'notif-001',
    type: 'schedule_change',
    message: 'Tu partido del Dom 11 May se movió de 17:00 a 17:30',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // hace 25 min
    read: false
  },
  {
    id: 'notif-002',
    type: 'setback',
    message: 'Contratiempo en Cancha Principal: lluvia. Retraso estimado 20 min.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // hace 2h
    read: false
  },
  {
    id: 'notif-003',
    type: 'general',
    message: 'Los grupos del Torneo Apertura han sido publicados.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // hace 2 días
    read: true
  }
];
