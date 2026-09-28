import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Game, Team } from '@/types/game'

interface GameStoreState {
  game: Game | null
  teams: Team[]
  loading: boolean
  init: (gameId: string) => () => void // retorna função de cleanup (unsubscribe)
}

/**
 * Store única, alimentada por Supabase Realtime. Tanto a Tela da TV quanto
 * o Painel do Administrador usam este mesmo store: nenhum dos dois calcula
 * estado por conta própria, ambos só refletem o que está no banco. Isso é
 * o que garante que o cronômetro e o placar fiquem sincronizados entre as
 * duas telas sem lógica extra de sincronização manual.
 */
export const useGameStore = create<GameStoreState>((set) => ({
  game: null,
  teams: [],
  loading: true,

  init: (gameId: string) => {
    set({ loading: true })

    // carga inicial
    void (async () => {
      const [{ data: game }, { data: teams }] = await Promise.all([
        supabase.from('games').select('*').eq('id', gameId).single(),
        supabase.from('teams').select('*').eq('game_id', gameId).order('sort_order')
      ])
      set({ game: game as Game, teams: (teams ?? []) as Team[], loading: false })
    })()

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') return
          set({ game: payload.new as Game })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `game_id=eq.${gameId}` },
        () => {
          // Mudança de pontuação: relê a lista inteira (simples e barato
          // para 2–4 equipes; evita reconstruir o array manualmente).
          void supabase
            .from('teams')
            .select('*')
            .eq('game_id', gameId)
            .order('sort_order')
            .then(({ data }) => set({ teams: (data ?? []) as Team[] }))
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }
}))
