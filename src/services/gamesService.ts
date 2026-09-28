import { supabase } from '@/lib/supabase'
import type { Game, GameStatus, RoundKey } from '@/types/game'

export async function getOrCreateActiveGame(): Promise<Game> {
  const { data: existing, error: findError } = await supabase
    .from('games')
    .select('*')
    .neq('status', 'FINISHED')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return existing as Game

  const { data: created, error: createError } = await supabase
    .from('games')
    .insert({ name: 'Desafio de Natal da Família', status: 'LOBBY' })
    .select('*')
    .single()

  if (createError) throw createError
  return created as Game
}

export async function updateGameStatus(gameId: string, status: GameStatus) {
  const { error } = await supabase.from('games').update({ status }).eq('id', gameId)
  if (error) throw error
}

export async function setCurrentQuestion(
  gameId: string,
  round: RoundKey,
  questionId: string,
  stage = 1
) {
  const { error } = await supabase
    .from('games')
    .update({
      current_round: round,
      current_question_id: questionId,
      current_question_stage: stage,
      status: 'QUESTION'
    })
    .eq('id', gameId)
  if (error) throw error
}

export async function startTimer(gameId: string, seconds: number) {
  const endsAt = new Date(Date.now() + seconds * 1000).toISOString()
  const { error } = await supabase
    .from('games')
    .update({ timer_ends_at: endsAt, timer_seconds: seconds, status: 'PLAYING' })
    .eq('id', gameId)
  if (error) throw error
}

export async function clearTimer(gameId: string) {
  const { error } = await supabase
    .from('games')
    .update({ timer_ends_at: null })
    .eq('id', gameId)
  if (error) throw error
}

export async function logEvent(
  gameId: string,
  eventType: string,
  payload: Record<string, unknown> = {}
) {
  // Log "melhor esforço": nunca deve derrubar o fluxo do jogo.
  const { error } = await supabase.from('game_events').insert({
    game_id: gameId,
    event_type: eventType,
    payload
  })
  if (error) console.warn('Falha ao registrar evento', eventType, error)
}
