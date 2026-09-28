-- =====================================================================
-- Desafio de Natal da Família — Schema inicial
-- Não contém DROP TABLE nem TRUNCATE.
-- Rode este arquivo uma única vez no SQL editor do Supabase.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- GAMES: uma partida (permite recomeçar em outro Natal sem apagar nada)
-- ---------------------------------------------------------------------
create table if not exists games (
  id            uuid primary key default gen_random_uuid(),
  name          text not null default 'Desafio de Natal da Família',
  status        text not null default 'LOBBY'
                  check (status in ('LOBBY','READY','QUESTION','PLAYING','ANSWER','REVEAL','SCORE','NEXT','FINISHED')),
  current_round text check (current_round in ('MUSIC','PROVERB','WORD','PHOTO')),
  current_question_id uuid,       -- referencia dinâmica (id da pergunta ativa, qualquer tabela de rodada)
  current_question_stage int default 1, -- ex: nível 1/2/3 de pistas, ou 3/5/10 notas
  timer_ends_at timestamptz,
  timer_seconds int,              -- duração configurada (para reexibir/reiniciar)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- TEAMS
-- ---------------------------------------------------------------------
create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references games(id) on delete cascade,
  name        text not null,
  short_name  text not null,
  color       text not null default '#2563eb', -- hex usado na UI (bolinha, faixa, etc.)
  score       int not null default 0,           -- cache; fonte da verdade é SUM(scores)
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique (game_id, name)
);

create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RODADA 1 — QUAL É A MÚSICA?
-- ---------------------------------------------------------------------
create table if not exists music_questions (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid not null references games(id) on delete cascade,
  title           text not null,
  artist          text,
  year_or_decade  text,
  file_3_notes    text not null, -- path no Storage (bucket "music")
  file_5_notes    text not null,
  file_10_notes   text not null,
  correct_answer  text not null,
  difficulty      text not null default 'medio' check (difficulty in ('facil','medio','dificil')),
  points_3_notes  int not null default 1000,
  points_5_notes  int not null default 500,
  points_10_notes int not null default 300,
  used            boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RODADA 2 — COMPLETE O DITADO
-- ---------------------------------------------------------------------
create table if not exists proverb_questions (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references games(id) on delete cascade,
  prompt_text    text not null, -- "Água mole em pedra dura..."
  correct_answer text not null, -- "...tanto bate até que fura."
  difficulty     text not null default 'medio' check (difficulty in ('facil','medio','dificil')),
  points         int not null default 500,
  used           boolean not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RODADA 3 — QUAL É A PALAVRA?
-- ---------------------------------------------------------------------
create table if not exists word_questions (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references games(id) on delete cascade,
  correct_word   text not null,
  clue_1         text not null,
  clue_2         text not null,
  clue_3         text not null,
  category       text,
  difficulty     text not null default 'medio' check (difficulty in ('facil','medio','dificil')),
  points_clue_1  int not null default 1000,
  points_clue_2  int not null default 500,
  points_clue_3  int not null default 300,
  used           boolean not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RODADA 4 — MEMÓRIA DA FOTO
-- ---------------------------------------------------------------------
create table if not exists photo_questions (
  id                 uuid primary key default gen_random_uuid(),
  game_id            uuid not null references games(id) on delete cascade,
  photo_path         text not null, -- path no Storage (bucket "photos")
  exposure_seconds   int not null default 15,
  used               boolean not null default false,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now()
);

-- Uma foto pode ter várias perguntas
create table if not exists photo_question_items (
  id               uuid primary key default gen_random_uuid(),
  photo_question_id uuid not null references photo_questions(id) on delete cascade,
  prompt_text      text not null,
  correct_answer   text not null,
  points           int not null default 300,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- SCORES — histórico append-only (nunca é sobrescrito nem apagado)
-- ---------------------------------------------------------------------
create table if not exists scores (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid not null references games(id) on delete cascade,
  team_id      uuid not null references teams(id) on delete cascade,
  points       int not null,             -- pode ser negativo (correção manual)
  reason       text not null,            -- ex: "Qual é a música?"
  round        text check (round in ('MUSIC','PROVERB','WORD','PHOTO','MANUAL')),
  question_id  uuid,                     -- id da pergunta de origem, se houver
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- GAME_EVENTS — log de tudo que acontece (auditoria/depuração)
-- ---------------------------------------------------------------------
create table if not exists game_events (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references games(id) on delete cascade,
  event_type text not null,   -- ex: 'TIMER_START','QUESTION_SHOWN','ANSWER_VALIDATED'
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index if not exists idx_teams_game            on teams(game_id);
create index if not exists idx_players_team           on players(team_id);
create index if not exists idx_music_game             on music_questions(game_id);
create index if not exists idx_proverb_game           on proverb_questions(game_id);
create index if not exists idx_word_game              on word_questions(game_id);
create index if not exists idx_photo_game             on photo_questions(game_id);
create index if not exists idx_photo_items_photo      on photo_question_items(photo_question_id);
create index if not exists idx_scores_game            on scores(game_id);
create index if not exists idx_scores_team            on scores(team_id);
create index if not exists idx_events_game            on game_events(game_id);

-- ---------------------------------------------------------------------
-- Trigger: manter teams.score em sincronia com SUM(scores) automaticamente
-- (a coluna score é só um cache de leitura rápida; a verdade é a tabela scores)
-- ---------------------------------------------------------------------
create or replace function recalc_team_score() returns trigger as $$
begin
  update teams
    set score = coalesce((select sum(points) from scores where team_id = coalesce(new.team_id, old.team_id)), 0)
    where id = coalesce(new.team_id, old.team_id);
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_recalc_score on scores;
create trigger trg_recalc_score
  after insert or update or delete on scores
  for each row execute function recalc_team_score();

-- updated_at automático em games
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_games_updated_at on games;
create trigger trg_games_updated_at
  before update on games
  for each row execute function set_updated_at();

-- =====================================================================
-- RLS
-- Este é um jogo doméstico, sem login de participantes. A estratégia:
--  - leitura pública (a TV precisa ler sem autenticação)
--  - escrita só com a service role (usada apenas no painel admin,
--    autenticado com senha simples via variável de ambiente + Supabase Auth
--    anônimo, NUNCA com a service role key no navegador — ver README)
-- Ajuste conforme a política de autenticação que você decidir usar no admin.
-- =====================================================================
alter table games                 enable row level security;
alter table teams                 enable row level security;
alter table players               enable row level security;
alter table music_questions       enable row level security;
alter table proverb_questions     enable row level security;
alter table word_questions        enable row level security;
alter table photo_questions       enable row level security;
alter table photo_question_items  enable row level security;
alter table scores                enable row level security;
alter table game_events           enable row level security;

-- leitura pública para todas as tabelas (necessário para a Tela da TV)
do $$
declare t text;
begin
  for t in select unnest(array[
    'games','teams','players','music_questions','proverb_questions',
    'word_questions','photo_questions','photo_question_items','scores','game_events'
  ])
  loop
    execute format('drop policy if exists "public_read" on %I;', t);
    execute format('create policy "public_read" on %I for select using (true);', t);
  end loop;
end $$;

-- escrita apenas para usuários autenticados (o painel admin faz login
-- via Supabase Auth — e-mail/senha de uso familiar; ver README)
do $$
declare t text;
begin
  for t in select unnest(array[
    'games','teams','players','music_questions','proverb_questions',
    'word_questions','photo_questions','photo_question_items','scores','game_events'
  ])
  loop
    execute format('drop policy if exists "auth_write" on %I;', t);
    execute format(
      'create policy "auth_write" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'');',
      t
    );
  end loop;
end $$;
