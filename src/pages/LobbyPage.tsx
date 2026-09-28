import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getOrCreateActiveGame } from '@/services/gamesService'
import type { Game, Team, Player } from '@/types/game'

const DEFAULT_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04']
const DEFAULT_NAMES = ['Time Azul', 'Time Vermelho', 'Time Verde', 'Time Amarelo']

export function LobbyPage() {
  const [game, setGame] = useState<Game | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState<Record<string, string>>({})

  useEffect(() => {
    void (async () => {
      const g = await getOrCreateActiveGame()
      setGame(g)
      const { data } = await supabase.from('teams').select('*').eq('game_id', g.id).order('sort_order')
      setTeams((data ?? []) as Team[])

      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .in('team_id', (data ?? []).map((t) => t.id))
      setPlayers((playersData ?? []) as Player[])
    })()
  }, [])

  async function addTeam() {
    if (!game || teams.length >= 4) return
    const idx = teams.length
    const { data, error } = await supabase
      .from('teams')
      .insert({
        game_id: game.id,
        name: DEFAULT_NAMES[idx] ?? `Time ${idx + 1}`,
        short_name: DEFAULT_NAMES[idx]?.split(' ')[1] ?? `T${idx + 1}`,
        color: DEFAULT_COLORS[idx] ?? '#64748b',
        sort_order: idx
      })
      .select('*')
      .single()
    if (!error && data) setTeams((prev) => [...prev, data as Team])
  }

  async function renameTeam(id: string, name: string) {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))
    await supabase.from('teams').update({ name }).eq('id', id)
  }

  async function addPlayer(teamId: string) {
    const name = newPlayerName[teamId]?.trim()
    if (!name) return
    const { data, error } = await supabase
      .from('players')
      .insert({ team_id: teamId, name })
      .select('*')
      .single()
    if (!error && data) setPlayers((prev) => [...prev, data as Player])
    setNewPlayerName((prev) => ({ ...prev, [teamId]: '' }))
  }

  if (!game) return <div className="p-8">Carregando...</div>

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-3xl font-bold">🎄 Cadastro de equipes</h1>
      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className="rounded-xl border-2 p-4" style={{ borderColor: team.color }}>
            <input
              className="mb-2 w-full rounded bg-natal-panel px-3 py-2 text-lg font-semibold"
              value={team.name}
              onChange={(e) => renameTeam(team.id, e.target.value)}
            />

            <div className="flex gap-2">
              <input
                className="flex-1 rounded bg-natal-panel px-3 py-2"
                placeholder="Nome do jogador"
                value={newPlayerName[team.id] ?? ''}
                onChange={(e) => setNewPlayerName((prev) => ({ ...prev, [team.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer(team.id)}
              />
              <button
                onClick={() => addPlayer(team.id)}
                className="rounded bg-natal-gold px-4 py-2 font-semibold text-black"
              >
                Adicionar
              </button>
            </div>

            <ul className="mt-2 space-y-1">
              {players
                .filter((p) => p.team_id === team.id)
                .map((p) => (
                  <li key={p.id} className="rounded bg-black/20 px-3 py-1 text-sm">
                    {p.name}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {teams.length < 4 && (
        <button onClick={addTeam} className="mt-4 rounded bg-natal-green px-4 py-2 font-semibold">
          + Adicionar equipe ({teams.length}/4)
        </button>
      )}

      <p className="mt-6 text-sm text-gray-400">
        Mínimo de 2 equipes para iniciar. Continue no Painel do Administrador.
      </p>
    </div>
  )
}
