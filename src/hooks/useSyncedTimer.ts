import { useEffect, useState } from 'react'

/**
 * O cronômetro nunca é contado localmente: cada cliente apenas calcula
 * `timerEndsAt - now()` a cada tick. Como `timerEndsAt` vem do banco (via
 * Realtime), a TV e o Admin sempre mostram o mesmo tempo restante, mesmo
 * que um deles tenha atualizado a página no meio da contagem.
 */
export function useSyncedTimer(timerEndsAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!timerEndsAt) {
      setSecondsLeft(null)
      return
    }
    const end = new Date(timerEndsAt).getTime()

    const tick = () => {
      const diff = Math.max(0, Math.round((end - Date.now()) / 1000))
      setSecondsLeft(diff)
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [timerEndsAt])

  const isExpired = secondsLeft === 0
  return { secondsLeft, isExpired }
}
