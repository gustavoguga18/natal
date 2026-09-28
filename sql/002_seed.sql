-- =====================================================================
-- Seed de exemplo — rode depois do 001_schema.sql
-- Cria uma partida de teste com 4 equipes e perguntas de exemplo.
-- Não é destrutivo: só faz INSERT.
-- =====================================================================

insert into games (id, name, status)
values ('00000000-0000-0000-0000-000000000001', 'Desafio de Natal da Família 2026', 'LOBBY')
on conflict (id) do nothing;

insert into teams (game_id, name, short_name, color, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Time Azul',     'AZUL',     '#2563eb', 1),
  ('00000000-0000-0000-0000-000000000001', 'Time Vermelho', 'VERMELHO', '#dc2626', 2),
  ('00000000-0000-0000-0000-000000000001', 'Time Verde',    'VERDE',    '#16a34a', 3),
  ('00000000-0000-0000-0000-000000000001', 'Time Amarelo',  'AMARELO',  '#ca8a04', 4)
on conflict (game_id, name) do nothing;

-- Músicas placeholder: troque file_3_notes/5/10 pelos paths reais após
-- fazer upload no bucket "music" do Storage (ex: 'jingle-bells/3-notas.mp3')
insert into music_questions
  (game_id, title, artist, year_or_decade, file_3_notes, file_5_notes, file_10_notes, correct_answer, difficulty)
values
  ('00000000-0000-0000-0000-000000000001','Placeholder Música 1','Artista 1','—','placeholder/3-notas.mp3','placeholder/5-notas.mp3','placeholder/10-notas.mp3','Resposta 1','facil'),
  ('00000000-0000-0000-0000-000000000001','Placeholder Música 2','Artista 2','—','placeholder/3-notas.mp3','placeholder/5-notas.mp3','placeholder/10-notas.mp3','Resposta 2','medio'),
  ('00000000-0000-0000-0000-000000000001','Placeholder Música 3','Artista 3','—','placeholder/3-notas.mp3','placeholder/5-notas.mp3','placeholder/10-notas.mp3','Resposta 3','dificil');

insert into proverb_questions (game_id, prompt_text, correct_answer, difficulty, points) values
  ('00000000-0000-0000-0000-000000000001','Água mole em pedra dura...','...tanto bate até que fura.','facil',300),
  ('00000000-0000-0000-0000-000000000001','Quem com ferro fere...','...com ferro será ferido.','facil',300),
  ('00000000-0000-0000-0000-000000000001','Filho de peixe...','...peixinho é.','facil',300),
  ('00000000-0000-0000-0000-000000000001','Antes tarde...','...do que nunca.','facil',300),
  ('00000000-0000-0000-0000-000000000001','Quem tudo quer...','...tudo perde.','medio',500),
  ('00000000-0000-0000-0000-000000000001','Devagar se vai ao...','...longe.','medio',500),
  ('00000000-0000-0000-0000-000000000001','Mais vale um pássaro na mão...','...do que dois voando.','medio',500),
  ('00000000-0000-0000-0000-000000000001','Cão que ladra...','...não morde.','medio',500),
  ('00000000-0000-0000-0000-000000000001','A pressa é inimiga...','...da perfeição.','dificil',1000),
  ('00000000-0000-0000-0000-000000000001','Em terra de cego...','...quem tem um olho é rei.','dificil',1000);

insert into word_questions (game_id, correct_word, clue_1, clue_2, clue_3, category, difficulty) values
  ('00000000-0000-0000-0000-000000000001','FACA','É encontrado na cozinha.','É usado para cortar alimentos.','Possui uma lâmina.','Objetos','facil'),
  ('00000000-0000-0000-0000-000000000001','ÁRVORE DE NATAL','Aparece em dezembro.','Costuma ter enfeites e luzes.','Fica na sala, geralmente verde.','Natal','facil'),
  ('00000000-0000-0000-0000-000000000001','PRESÉPIO','É montado no Natal.','Representa o nascimento de Jesus.','Tem pastores, manjedoura e Rei Magos.','Natal','medio'),
  ('00000000-0000-0000-0000-000000000001','PANETONE','É comum comer no Natal.','Pode ter frutas cristalizadas.','É um pão doce italiano.','Comidas','facil'),
  ('00000000-0000-0000-0000-000000000001','PAPAI NOEL','Usa roupa vermelha.','Mora no Polo Norte, segundo a lenda.','Entrega presentes na noite de Natal.','Natal','facil'),
  ('00000000-0000-0000-0000-000000000001','GUIRLANDA','Fica pendurada na porta.','Geralmente é redonda.','Feita de folhas ou pinheiro.','Decoração','medio'),
  ('00000000-0000-0000-0000-000000000001','SINO','Faz barulho quando balança.','Aparece em canções natalinas.','Pode ser dourado ou prateado.','Natal','medio'),
  ('00000000-0000-0000-0000-000000000001','TRENÓ','Desliza na neve.','É puxado por renas, na lenda.','Papai Noel usa para viajar.','Natal','dificil'),
  ('00000000-0000-0000-0000-000000000001','VELA','Pode ser acesa.','Derrete com o calor.','Usada em ceias e jantares.','Objetos','facil'),
  ('00000000-0000-0000-0000-000000000001','MEIA','Fica pendurada na lareira.','Usada nos pés.','No Natal, ganha presentes dentro.','Natal','medio');

-- Fotos: cadastre de fato pelo painel admin (upload real); isto é só a estrutura.
