BEGIN;

CREATE TABLE IF NOT EXISTS presencas_alunos (
    id SERIAL PRIMARY KEY,
    viagem_id INTEGER NOT NULL REFERENCES viagens(id) ON DELETE CASCADE,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    tipo VARCHAR(12) NOT NULL CHECK (tipo IN ('EMBARQUE', 'DESEMBARQUE')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude IS NOT NULL AND longitude IS NOT NULL AND
         latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    ),
    CONSTRAINT presencas_alunos_viagem_aluno_tipo_unique UNIQUE (viagem_id, aluno_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_presencas_alunos_aluno_registrado
    ON presencas_alunos (aluno_id, registrado_em DESC);

CREATE INDEX IF NOT EXISTS idx_presencas_alunos_viagem
    ON presencas_alunos (viagem_id);

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