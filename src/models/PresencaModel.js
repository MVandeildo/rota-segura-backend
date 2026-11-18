const db = require('../config/database');

class PresencaModel {
    static async listarAlunosDaRotaDoDia({ motoristaId, data }) {
        const result = await db.query(
            `WITH dia AS (
                SELECT COALESCE($2::date, CURRENT_DATE) AS data
            )
            SELECT
                r.id AS rota_id,
                r.nome AS rota_nome,
                a.id AS aluno_id,
                a.nome AS aluno_nome,
                CASE ultima_presenca.tipo
                    WHEN 'EMBARQUE' THEN 'EMBARCADO'
                    WHEN 'DESEMBARQUE' THEN 'DESEMBARCADO'
                    ELSE 'PENDENTE'
                END AS status,
                ultima_presenca.tipo AS ultimo_evento,
                ultima_presenca.registrado_em AS ultimo_registro_em
            FROM rotas r
            INNER JOIN alunos a ON a.rota_id = r.id AND a.ativo = TRUE
            CROSS JOIN dia
            LEFT JOIN LATERAL (
                SELECT p.tipo, p.registrado_em
                FROM presencas_alunos p
                WHERE p.aluno_id = a.id
                  AND p.rota_id = r.id
                  AND p.registrado_em >= dia.data
                  AND p.registrado_em < dia.data + INTERVAL '1 day'
                ORDER BY p.registrado_em DESC, p.id DESC
                LIMIT 1
            ) ultima_presenca ON TRUE
            WHERE r.motorista_id = $1
            ORDER BY r.id ASC, a.nome ASC, a.id ASC`,
            [motoristaId, data]
        );

        return result.rows;
    }

    static async registrar({ alunoId, motoristaId, tipo, latitude, longitude }) {
        let viagemRes = await db.query(
            `SELECT v.id FROM viagens v
             INNER JOIN alunos a ON a.rota_id = v.rota_id
             WHERE a.id = $1 AND v.data = CURRENT_DATE AND v.status != 'FINALIZADA'
             ORDER BY v.id DESC LIMIT 1`,
            [alunoId]
        );

        let viagemId = viagemRes.rows[0]?.id;

        if (!viagemId) {
            const novaViagem = await db.query(
                `INSERT INTO viagens (rota_id, motorista_id, data, status, iniciada_em, created_at)
                 SELECT a.rota_id, $2, CURRENT_DATE, 'EM_ANDAMENTO', clock_timestamp(), clock_timestamp()
                 FROM alunos a WHERE a.id = $1
                 RETURNING id`,
                [alunoId, motoristaId]
            );
            viagemId = novaViagem.rows[0]?.id;
        }

        const result = await db.query(
            `WITH registro AS (
                INSERT INTO presencas_alunos (
                    aluno_id, rota_id, motorista_id, viagem_id, tipo, latitude, longitude, registrado_em
                )
                SELECT a.id, a.rota_id, $2, $3, $4, $5, $6, clock_timestamp()
                FROM alunos a
                WHERE a.id = $1
                  AND a.ativo = TRUE
                ON CONFLICT (viagem_id, aluno_id, tipo) 
                DO UPDATE SET 
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    registrado_em = clock_timestamp()
                RETURNING id, aluno_id, rota_id, motorista_id, viagem_id, tipo, latitude, longitude, registrado_em
            )
            SELECT registro.*, a.nome AS aluno_nome, a.responsavel_id
            FROM registro
            INNER JOIN alunos a ON a.id = registro.aluno_id`,
            [alunoId, motoristaId, viagemId, tipo, latitude, longitude]
        );

        return result.rows[0];
    }
}

module.exports = PresencaModel;
