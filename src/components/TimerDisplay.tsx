import { useSyncedTimer } from '@/hooks/useSyncedTimer'

export function TimerDisplay({ timerEndsAt }: { timerEndsAt: string | null }) {
  const { secondsLeft, isExpired } = useSyncedTimer(timerEndsAt)

  if (secondsLeft === null) return null

  if (isExpired) {
    return <div className="text-tv-xl font-black text-natal-red animate-pulse">⏰ TEMPO ESGOTADO!</div>
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="text-tv-xl font-black tabular-nums text-natal-gold">
      {mm}:{ss}
    </div>
  )
}
