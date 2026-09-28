# 🎄 Desafio de Natal da Família

Jogo de perguntas em equipe para a confraternização de Natal: a **TV** exibe pergunta/placar/cronômetro,
o **administrador** controla tudo pelo notebook, e as respostas são dadas verbalmente.

## Status deste pacote

Este é o **scaffold funcional** do sistema, pronto para rodar localmente e evoluir:

✅ Implementado e funcionando:
- Estrutura completa do banco (`sql/001_schema.sql`) com FKs, índices, constraints, RLS e trigger
  que recalcula `teams.score` automaticamente a partir do histórico em `scores` (nunca apaga histórico).
- Seed de exemplo (`sql/002_seed.sql`): 4 equipes, 3 músicas placeholder, 10 ditados, 10 palavras.
- Cliente Supabase, tipos TypeScript de todo o domínio.
- Store global (Zustand) alimentado por Supabase Realtime — TV e Admin leem o mesmo estado.
- Cronômetro sincronizado por timestamp (`timer_ends_at`), não por contagem local.
- Painel do Administrador: cadastro de equipes/jogadores (Lobby), seleção de rodada e pergunta,
  estágios (3/5/10 notas e pistas 1/2/3), atribuição de pontos por equipe com histórico, avançar pergunta,
  encerrar partida.
- Tela da TV: placar, pergunta ativa por rodada, cronômetro, tela final com pódio.
- Configuração PWA (manifest, cache de estáticos, sem dados sensíveis em cache).

🚧 Para você (ou para uma próxima sessão) completar, seguindo o padrão já estabelecido:
- **Rodada de fotos**: upload para o Storage, formulário de cadastro (foto + tempo de exposição +
  múltiplas perguntas), exibição cronometrada na TV e depois ocultação da imagem.
- **Reprodução de áudio** da rodada de música na TV (o Admin já seleciona o estágio; falta o `<audio>`
  na TV apontando para a Storage URL pública do arquivo).
- **Tela "Continuar partida?"** explícita no Admin ao carregar (hoje ele já recupera o jogo em andamento
  automaticamente via `getOrCreateActiveGame`, mas sem a confirmação visual pedida no briefing).
- **Login do administrador** via Supabase Auth (e-mail/senha) — as policies de escrita (`auth_write`) já
  exigem `auth.role() = 'authenticated'`, falta a tela de login no frontend.
- Tratamento visual de empate na tela final.
- Botões de pausar/reiniciar partida.

## Por que essas escolhas de arquitetura

- **Estado no banco, não em sockets próprios**: TV e Admin nunca calculam nada sozinhos — ambos só
  espelham `games`/`teams` via Realtime. Isso resolve sincronismo e persistência ao mesmo tempo.
- **4 tabelas de perguntas separadas** em vez de uma genérica com JSON: cada rodada tem campos muito
  diferentes; tabelas próprias tornam o cadastro no Admin simples de validar.
- **`scores` é append-only**: nunca fazemos `UPDATE` em `teams.score` diretamente. Um trigger no Postgres
  recalcula o total a partir do histórico sempre que uma linha é inserida — corrigir pontuação manual é
  só inserir outra linha (positiva ou negativa).

## Como rodar

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor, rode `sql/001_schema.sql` e depois `sql/002_seed.sql`.
3. Crie os buckets no Storage: `music` (público) e `photos` (público) para os áudios/fotos.
4. Copie `.env.example` para `.env.local` e preencha com a URL e a **anon key** (nunca a service role).
5. Crie um usuário (e-mail/senha) em Authentication > Users, para o login do Admin (a fazer, ver acima).
6. Instale e rode:

```bash
npm install
npm run dev
```

7. Abra `/lobby` para cadastrar as equipes, `/admin` para operar a partida, e `/tv` em tela cheia num
   segundo monitor/TV (F11 no navegador).

## Segurança

- A `anon key` é pública por design e vai no frontend — a proteção real é o RLS (leitura livre,
  escrita só autenticado).
- **Nunca** coloque a `service role key` em nenhum arquivo deste projeto ou em variáveis `VITE_*`
  (tudo que começa com `VITE_` vai parar no bundle do navegador).
