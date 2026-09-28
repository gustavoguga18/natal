import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getOrCreateActiveGame } from '@/services/gamesService'
import { Scoreboard } from '@/components/Scoreboard'
import { TimerDisplay } from '@/components/TimerDisplay'
import { supabase } from '@/lib/supabase'
import type { MusicQuestion, ProverbQuestion, WordQuestion } from '@/types/game'

const ROUND_TITLES: Record<string, string> = {
  MUSIC: '🎵 Qual é a música?',
  PROVERB: '📖 Complete o ditado',
  WORD: '🔤 Qual é a palavra?',
  PHOTO: '📸 Memória da foto'
}

export function TvPage() {
  const { game, teams, init } = useGameStore()
  const [question, setQuestion] = useState<MusicQuestion | ProverbQuestion | WordQuestion | null>(null)

  useEffect(() => {
    let cleanup: (() => void) | undefined
    void (async () => {
      const g = await getOrCreateActiveGame()
      cleanup = init(g.id)
    })()
    return () => cleanup?.()
  }, [init])

  // Recarrega a pergunta ativa sempre que o game muda de pergunta/rodada.
  useEffect(() => {
    if (!game?.current_question_id || !game.current_round) {
      setQuestion(null)
      return
    }
    const table =
      game.current_round === 'MUSIC'
        ? 'music_questions'
        : game.current_round === 'PROVERB'
        ? 'proverb_questions'
        : game.current_round === 'WORD'
        ? 'word_questions'
        : null
    if (!table) return
    void supabase
      .from(table)
      .select('*')
      .eq('id', game.current_question_id)
      .single()
      .then(({ data }) => setQuestion(data as typeof question))
  }, [game?.current_question_id, game?.current_round])

  if (!game) return <div className="p-8 text-2xl">Conectando...</div>

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-10 bg-natal-bg p-10 text-center">
      <h1 className="text-4xl font-bold text-natal-gold">🎄 Desafio de Natal da Família 🎄</h1>

      {game.status === 'LOBBY' && (
        <p className="text-tv-lg">Preparando a partida...</p>
      )}

      {(game.status === 'READY' || game.status === 'QUESTION' || game.status === 'PLAYING') &&
        game.current_round && (
          <div className="flex flex-col items-center gap-8">
            <h2 className="text-tv-lg font-bold">{ROUND_TITLES[game.current_round]}</h2>

            {game.current_round === 'MUSIC' && question && 'title' in question && (
              <p className="text-2xl text-gray-300">
                Nível: {game.current_question_stage === 1 ? '3 notas (1000 pts)' : game.current_question_stage === 2 ? '5 notas (500 pts)' : '10 notas (300 pts)'}
              </p>
            )}

            {game.current_round === 'PROVERB' && question && 'prompt_text' in question && (
              <p className="max-w-4xl text-tv-lg font-semibold">"{(question as ProverbQuestion).prompt_text}"</p>
            )}

            {game.current_round === 'WORD' && question && 'clue_1' in question && (
              <p className="max-w-4xl text-tv-lg font-semibold">
                {game.current_question_stage === 1
                  ? (question as WordQuestion).clue_1
                  : game.current_question_stage === 2
                  ? (question as WordQuestion).clue_2
                  : (question as WordQuestion).clue_3}
              </p>
            )}

            <TimerDisplay timerEndsAt={game.timer_ends_at} />
          </div>
        )}

      {game.status === 'REVEAL' && question && (
        <div className="text-tv-lg font-bold text-natal-green">✅ Resposta correta!</div>
      )}

      {(game.status === 'LOBBY' || game.status === 'SCORE' || game.status === 'NEXT') && (
        <Scoreboard teams={teams} />
      )}

      {game.status === 'FINISHED' && (
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-tv-xl font-black text-natal-gold">🎄 FIM DO DESAFIO! 🎄</h2>
          <Scoreboard teams={teams} big />
          <p className="text-2xl">Parabéns a todos! ❤️</p>
        </div>
      )}
    </div>
  )
}
