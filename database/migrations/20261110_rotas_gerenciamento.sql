BEGIN;

ALTER TABLE rotas
    ADD COLUMN IF NOT EXISTS ativa BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS destino_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS destino_lng DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS paradas_rota (
    id BIGSERIAL PRIMARY KEY,
    rota_id INTEGER NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    endereco VARCHAR(255) NOT NULL,
    horario_embarque TIME,
    horario_desembarque TIME,
    ordem INTEGER NOT NULL,
    CONSTRAINT paradas_rota_rota_ordem_unique UNIQUE (rota_id, ordem)
);

CREATE INDEX IF NOT EXISTS idx_paradas_rota_ordem ON paradas_rota (rota_id, ordem);

COMMIT;