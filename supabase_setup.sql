-- =======================================================
-- JOINGO Feira v2 – Setup do Supabase (só frontend)
-- Execute no painel: SQL Editor → New query → Run
-- =======================================================

-- 1. Tabela de participantes
CREATE TABLE IF NOT EXISTS participantes (
  id                  BIGSERIAL    PRIMARY KEY,
  nome                TEXT         NOT NULL,
  email               TEXT         NOT NULL,
  cpf                 TEXT,
  nascimento          DATE,
  telefone            TEXT,
  conhecia_joingo     TEXT,
  foto_url            TEXT,
  foto_path           TEXT,
  descriptor          FLOAT8[],
  total_participacoes INTEGER      NOT NULL DEFAULT 1,
  ganhou_brinde       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participantes_email ON participantes(email);
CREATE INDEX IF NOT EXISTS idx_participantes_created ON participantes(created_at DESC);

-- 2. Habilitar RLS
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;

-- 3. Policies para anon key (sem backend — o frontend usa a chave pública)
--    Permite SELECT, INSERT e UPDATE para qualquer requisição anônima.
--    Isso é seguro porque a aplicação é interna/operada por você.

DROP POLICY IF EXISTS "anon select" ON participantes;
CREATE POLICY "anon select" ON participantes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "anon insert" ON participantes;
CREATE POLICY "anon insert" ON participantes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "anon update" ON participantes;
CREATE POLICY "anon update" ON participantes
  FOR UPDATE USING (true) WITH CHECK (true);

-- =======================================================
-- STORAGE
-- =======================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-participantes', 'fotos-participantes', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública das fotos
DROP POLICY IF EXISTS "fotos publicas leitura" ON storage.objects;
CREATE POLICY "fotos publicas leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos-participantes');

-- Upload pelo frontend (anon key)
DROP POLICY IF EXISTS "fotos upload anon" ON storage.objects;
CREATE POLICY "fotos upload anon"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'fotos-participantes');

-- =======================================================
-- QUERY PARA EXPORTAR CSV DIRETO PELO SUPABASE
-- (alternativa ao botão do app)
-- SQL Editor → cole abaixo → Run → Download CSV
-- =======================================================
/*
SELECT
  id,
  nome,
  email,
  cpf,
  TO_CHAR(nascimento, 'DD/MM/YYYY')    AS nascimento,
  telefone,
  conhecia_joingo,
  total_participacoes,
  ganhou_brinde,
  foto_url,
  TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS cadastrado_em
FROM participantes
ORDER BY created_at DESC;
*/
