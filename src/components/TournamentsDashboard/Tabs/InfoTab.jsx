import EditTournamentForm from '../EditTournamentForm'

export default function InfoTab({ tournament, onUpdate }) {
  return <EditTournamentForm tournament={tournament} onUpdate={onUpdate} />
}
