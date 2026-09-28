import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getOrCreateActiveGame, setCurrentQuestion, startTimer, updateGameStatus, logEvent } from '@/services/gamesService'
import { addScore } from '@/services/scoresService'
import { supabase } from '@/lib/supabase'
import type { MusicQuestion, ProverbQuestion, RoundKey, WordQuestion } from '@/types/game'

const ROUND_LABELS: Record<RoundKey, string> = {
  MUSIC: '🎵 Qual é a música?',
  PROVERB: '📖 Complete o ditado',
  WORD: '🔤 Qual é a palavra?',
  PHOTO: '📸 Memória da foto'
}

// Pontuação por estágio, conforme as regras de cada rodada.
const MUSIC_STAGE_POINTS = (q: MusicQuestion, stage: number) =>
  stage === 1 ? q.points_3_notes : stage === 2 ? q.points_5_notes : q.points_10_notes

const WORD_STAGE_POINTS = (q: WordQuestion, stage: number) =>
  stage === 1 ? q.points_clue_1 : stage === 2 ? q.points_clue_2 : q.points_clue_3

export function AdminPage() {
  const { game, teams, init } = useGameStore()
  const [round, setRound] = useState<RoundKey>('MUSIC')
  const [musicQs, setMusicQs] = useState<MusicQuestion[]>([])
  const [proverbQs, setProverbQs] = useState<ProverbQuestion[]>([])
  const [wordQs, setWordQs] = useState<WordQuestion[]>([])
  const [activeQuestion, setActiveQuestion] = useState<MusicQuestion | ProverbQuestion | WordQuestion | null>(null)

  useEffect(() => {
    let cleanup: (() => void) | undefined
    void (async () => {
      const g = await getOrCreateActiveGame()
      cleanup = init(g.id)
      const [m, p, w] = await Promise.all([
        supabase.from('music_questions').select('*').eq('game_id', g.id).order('sort_order'),
        supabase.from('proverb_questions').select('*').eq('game_id', g.id).order('sort_order'),
        supabase.from('word_questions').select('*').eq('game_id', g.id).order('sort_order')
      ])
      setMusicQs((m.data ?? []) as MusicQuestion[])
      setProverbQs((p.data ?? []) as ProverbQuestion[])
      setWordQs((w.data ?? []) as WordQuestion[])
    })()
    return () => cleanup?.()
  }, [init])

  useEffect(() => {
    if (!game?.current_question_id || !game.current_round) {
      setActiveQuestion(null)
      return
    }
    const list = game.current_round === 'MUSIC' ? musicQs : game.current_round === 'PROVERB' ? proverbQs : wordQs
    setActiveQuestion((list as any[]).find((q) => q.id === game.current_question_id) ?? null)
  }, [game?.current_question_id, game?.current_round, musicQs, proverbQs, wordQs])

  if (!game) return <div className="p-8">Carregando...</div>

  const pendingList =
    round === 'MUSIC' ? musicQs.filter((q) => !q.used) : round === 'PROVERB' ? proverbQs.filter((q) => !q.used) : round === 'WORD' ? wordQs.filter((q) => !q.used) : []

  async function pickQuestion(id: string) {
    await setCurrentQuestion(game!.id, round, id, 1)
    await logEvent(game!.id, 'QUESTION_SHOWN', { round, id })
  }

  async function playStage(stage: number) {
    await supabase.from('games').update({ current_question_stage: stage, status: 'QUESTION' }).eq('id', game!.id)
  }

  async function fireTimer(seconds: number) {
    await startTimer(game!.id, seconds)
    await logEvent(game!.id, 'TIMER_START', { seconds })
  }

  async function awardTeam(teamId: string, points: number, reason: string) {
    await addScore({ gameId: game!.id, teamId, points, reason, round, questionId: activeQuestion?.id ?? null })
    await updateGameStatus(game!.id, 'REVEAL')
  }

  async function markUsedAndAdvance() {
    if (activeQuestion) {
      const table = round === 'MUSIC' ? 'music_questions' : round === 'PROVERB' ? 'proverb_questions' : 'word_questions'
      await supabase.from(table).update({ used: true }).eq('id', activeQuestion.id)
      if (round === 'MUSIC') setMusicQs((prev) => prev.map((q) => (q.id === activeQuestion.id ? { ...q, used: true } : q)))
      if (round === 'PROVERB') setProverbQs((prev) => prev.map((q) => (q.id === activeQuestion.id ? { ...q, used: true } : q)))
      if (round === 'WORD') setWordQs((prev) => prev.map((q) => (q.id === activeQuestion.id ? { ...q, used: true } : q)))
    }
    await supabase.from('games').update({ current_question_id: null, status: 'SCORE' }).eq('id', game!.id)
  }

  async function finishGame() {
    await updateGameStatus(game!.id, 'FINISHED')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">🎄 Painel do Administrador</h1>
      <p className="text-sm text-gray-400">
        Estado atual: <b>{game.status}</b> {game.current_round && `— ${ROUND_LABELS[game.current_round]}`}
      </p>

      {/* Placar rápido */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {teams.map((t) => (
          <div key={t.id} className="rounded-lg p-3 text-center" style={{ backgroundColor: `${t.color}33` }}>
            <div className="font-semibold">{t.short_name}</div>
            <div className="text-xl font-bold">{t.score}</div>
          </div>
        ))}
      </div>

      {/* Seleção de rodada */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ROUND_LABELS) as RoundKey[]).map((r) => (
          <button
            key={r}
            onClick={() => setRound(r)}
            className={`rounded px-3 py-2 ${round === r ? 'bg-natal-gold text-black' : 'bg-natal-panel'}`}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      {round === 'PHOTO' && (
        <p className="text-sm text-gray-400">
          Rodada de fotos: implemente o cadastro de fotos + upload no Storage e a listagem aqui, seguindo o
          mesmo padrão das outras rodadas (ver <code>photo_questions</code> / <code>photo_question_items</code>).
        </p>
      )}

      {round !== 'PHOTO' && !activeQuestion && (
        <div>
          <h3 className="mb-2 font-semibold">Perguntas disponíveis ({pendingList.length})</h3>
          <div className="space-y-1">
            {pendingList.map((q: any) => (
              <button
                key={q.id}
                onClick={() => pickQuestion(q.id)}
                className="block w-full rounded bg-natal-panel px-3 py-2 text-left hover:bg-natal-panel/70"
              >
                {q.title ?? q.prompt_text ?? q.correct_word}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeQuestion && (
        <div className="space-y-4 rounded-xl border border-natal-gold/40 p-4">
          <h3 className="font-semibold">Pergunta ativa</h3>

          {round === 'MUSIC' && (
            <div className="flex gap-2">
              {[1, 2, 3].map((stage) => (
                <button key={stage} onClick={() => playStage(stage)} className="rounded bg-natal-panel px-3 py-2">
                  ▶ {stage === 1 ? '3 notas' : stage === 2 ? '5 notas' : '10 notas'}
                </button>
              ))}
            </div>
          )}

          {round === 'WORD' && (
            <div className="flex gap-2">
              {[1, 2, 3].map((stage) => (
                <button key={stage} onClick={() => playStage(stage)} className="rounded bg-natal-panel px-3 py-2">
                  Pista {stage}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => fireTimer(15)} className="rounded bg-natal-panel px-3 py-2">⏱ 15s</button>
            <button onClick={() => fireTimer(30)} className="rounded bg-natal-panel px-3 py-2">⏱ 30s</button>
          </div>

          <div>
            <p className="mb-1 text-sm text-gray-400">
              Resposta correta:{' '}
              <b>
                {(activeQuestion as any).correct_answer ?? (activeQuestion as any).correct_word}
              </b>
            </p>
            <div className="flex flex-wrap gap-2">
              {teams.map((t) => {
                const stage = game.current_question_stage
                const points =
                  round === 'MUSIC'
                    ? MUSIC_STAGE_POINTS(activeQuestion as MusicQuestion, stage)
                    : round === 'WORD'
                    ? WORD_STAGE_POINTS(activeQuestion as WordQuestion, stage)
                    : (activeQuestion as ProverbQuestion).points
                return (
                  <button
                    key={t.id}
                    onClick={() => awardTeam(t.id, points, ROUND_LABELS[round])}
                    className="rounded px-3 py-2 font-semibold"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.short_name} +{points}
                  </button>
                )
              })}
            </div>
          </div>

          <button onClick={markUsedAndAdvance} className="rounded bg-natal-green px-4 py-2 font-semibold">
            Próxima pergunta →
          </button>
        </div>
      )}

      <div className="border-t border-gray-700 pt-4">
        <button onClick={finishGame} className="rounded bg-natal-red px-4 py-2 font-semibold">
          Encerrar partida
        </button>
      </div>
    </div>
  )
}
