import { supabase } from '@/lib/supabase'
import type { RoundKey, ScoreEntry } from '@/types/game'

/**
 * Toda pontuação passa por aqui. Nunca fazemos UPDATE em teams.score
 * diretamente — o trigger `trg_recalc_score` no banco recalcula o cache
 * a partir da soma de `scores` sempre que uma linha é inserida, então o
 * histórico nunca é perdido, mesmo em correções manuais.
 */
export async function addScore(params: {
  gameId: string
  teamId: string
  points: number
  reason: string
  round: RoundKey | 'MANUAL' | null
  questionId?: string | null
}): Promise<ScoreEntry> {
  const { data, error } = await supabase
    .from('scores')
    .insert({
      game_id: params.gameId,
      team_id: params.teamId,
      points: params.points,
      reason: params.reason,
      round: params.round,
      question_id: params.questionId ?? null
    })
    .select('*')
    .single()

  if (error) throw error
  return data as ScoreEntry
}

export async function getScoreHistory(gameId: string): Promise<ScoreEntry[]> {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ScoreEntry[]
}
