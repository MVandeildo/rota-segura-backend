const db = require('../config/database');

class PresencaModel {
    static async registrar({ alunoId, motoristaId, tipo, latitude, longitude }) {
        const result = await db.query(
            `WITH registro AS (
                INSERT INTO presencas_alunos (
                    aluno_id, rota_id, motorista_id, tipo, latitude, longitude
                )
                SELECT a.id, a.rota_id, $2, $3, $4, $5
                FROM alunos a
                INNER JOIN rotas r ON r.id = a.rota_id
                WHERE a.id = $1
                  AND a.ativo = TRUE
                  AND r.motorista_id = $2
                RETURNING id, aluno_id, rota_id, motorista_id, tipo, latitude, longitude, registrado_em
            )
            SELECT registro.*, a.nome AS aluno_nome, a.responsavel_id
            FROM registro
            INNER JOIN alunos a ON a.id = registro.aluno_id`,
            [alunoId, motoristaId, tipo, latitude, longitude]
        );

        return result.rows[0];
    }
}

module.exports = PresencaModel;
