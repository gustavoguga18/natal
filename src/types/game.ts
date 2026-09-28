export type GameStatus =
  | 'LOBBY'
  | 'READY'
  | 'QUESTION'
  | 'PLAYING'
  | 'ANSWER'
  | 'REVEAL'
  | 'SCORE'
  | 'NEXT'
  | 'FINISHED'

export type RoundKey = 'MUSIC' | 'PROVERB' | 'WORD' | 'PHOTO'

export interface Game {
  id: string
  name: string
  status: GameStatus
  current_round: RoundKey | null
  current_question_id: string | null
  current_question_stage: number
  timer_ends_at: string | null
  timer_seconds: number | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  game_id: string
  name: string
  short_name: string
  color: string
  score: number
  sort_order: number
}

export interface Player {
  id: string
  team_id: string
  name: string
}

export type Difficulty = 'facil' | 'medio' | 'dificil'

export interface MusicQuestion {
  id: string
  game_id: string
  title: string
  artist: string | null
  year_or_decade: string | null
  file_3_notes: string
  file_5_notes: string
  file_10_notes: string
  correct_answer: string
  difficulty: Difficulty
  points_3_notes: number
  points_5_notes: number
  points_10_notes: number
  used: boolean
  sort_order: number
}

export interface ProverbQuestion {
  id: string
  game_id: string
  prompt_text: string
  correct_answer: string
  difficulty: Difficulty
  points: number
  used: boolean
  sort_order: number
}

export interface WordQuestion {
  id: string
  game_id: string
  correct_word: string
  clue_1: string
  clue_2: string
  clue_3: string
  category: string | null
  difficulty: Difficulty
  points_clue_1: number
  points_clue_2: number
  points_clue_3: number
  used: boolean
  sort_order: number
}

export interface PhotoQuestion {
  id: string
  game_id: string
  photo_path: string
  exposure_seconds: number
  used: boolean
  sort_order: number
}

export interface PhotoQuestionItem {
  id: string
  photo_question_id: string
  prompt_text: string
  correct_answer: string
  points: number
  sort_order: number
}

export interface ScoreEntry {
  id: string
  game_id: string
  team_id: string
  points: number
  reason: string
  round: RoundKey | 'MANUAL' | null
  question_id: string | null
  created_at: string
}

export interface GameEvent {
  id: string
  game_id: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}
