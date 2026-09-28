import type { Team } from '@/types/game'

const MEDALS = ['🥇', '🥈', '🥉', '4º']

export function Scoreboard({ teams, big = false }: { teams: Team[]; big?: boolean }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score)

  return (
    <div className={`grid gap-4 ${big ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {sorted.map((team, i) => (
        <div
          key={team.id}
          className="flex items-center justify-between rounded-2xl px-6 py-4 shadow-lg"
          style={{ backgroundColor: `${team.color}22`, border: `3px solid ${team.color}` }}
        >
          <div className="flex items-center gap-4">
            {big && <span className="text-4xl">{MEDALS[i] ?? ''}</span>}
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            <span className={big ? 'text-tv-lg font-bold' : 'text-xl font-semibold'}>
              {team.name}
            </span>
          </div>
          <span className={big ? 'text-tv-lg font-black tabular-nums' : 'text-xl font-bold tabular-nums'}>
            {team.score.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}
