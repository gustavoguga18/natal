import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  // Falha alto e cedo: é melhor quebrar no console do que silenciosamente
  // não conectar no meio de uma partida ao vivo.
  // eslint-disable-next-line no-console
  console.error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas. Copie .env.example para .env.local.'
  )
}

// IMPORTANTE: este cliente usa somente a anon key (pública, segura no
// navegador). A escrita é protegida por RLS + Supabase Auth (ver README).
// NUNCA importe a service role key aqui.
export const supabase = createClient(url, anonKey, {
  realtime: { params: { eventsPerSecond: 10 } }
})
