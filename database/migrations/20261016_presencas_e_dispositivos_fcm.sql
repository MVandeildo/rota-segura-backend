BEGIN;

CREATE TABLE IF NOT EXISTS presencas_alunos (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    rota_id INTEGER NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    motorista_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    tipo VARCHAR(12) NOT NULL CHECK (tipo IN ('EMBARQUE', 'DESEMBARQUE')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude IS NOT NULL AND longitude IS NOT NULL AND
         latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

CREATE INDEX IF NOT EXISTS idx_presencas_alunos_aluno_registrado
    ON presencas_alunos (aluno_id, registrado_em DESC);

CREATE TABLE IF NOT EXISTS dispositivos_fcm (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispositivos_fcm_usuario
    ON dispositivos_fcm (usuario_id);

COMMIT;
