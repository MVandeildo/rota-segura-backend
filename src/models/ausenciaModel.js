
const db = require('../config/database');

class AusenciaModel {
    // Registra a ausência de um aluno em uma data específica.
    static async create({ aluno_id, data_ausencia }) {
        const result = await db.query(
            `INSERT INTO ausencias_alunos (
                aluno_id,
                data_ausencia
            )
            VALUES ($1, $2)
            RETURNING *`,
            [aluno_id, data_ausencia]
        );

        return result.rows[0];
    }

    // Busca uma ausência pelo seu ID.
    static async findById(id) {
        const result = await db.query(
            `SELECT *
             FROM ausencias_alunos
             WHERE id = $1`,
            [id]
        );

        return result.rows[0];
    }

    // Lista as ausências registradas para uma data.
    static async findByDate(data_ausencia) {
        const result = await db.query(
            `SELECT
                aa.id,
                aa.aluno_id,
                aa.data_ausencia,
                aa.criado_em,
                a.nome AS aluno_nome,
                a.responsavel_id,
                a.rota_id
             FROM ausencias_alunos aa
             INNER JOIN alunos a
                ON a.id = aa.aluno_id
             WHERE aa.data_ausencia = $1
               AND a.ativo = TRUE
             ORDER BY a.nome ASC`,
            [data_ausencia]
        );

        return result.rows;
    }

    // Lista as ausências de um aluno.
    static async findByAlunoId(aluno_id) {
        const result = await db.query(
            `SELECT *
             FROM ausencias_alunos
             WHERE aluno_id = $1
             ORDER BY data_ausencia DESC`,
            [aluno_id]
        );

        return result.rows;
    }

    // Verifica se já existe ausência para o aluno na data.
    static async exists(aluno_id, data_ausencia) {
        const result = await db.query(
            `SELECT id
             FROM ausencias_alunos
             WHERE aluno_id = $1
               AND data_ausencia = $2`,
            [aluno_id, data_ausencia]
        );

        return result.rows.length > 0;
    }

    // Cancela uma ausência pelo ID.
    static async delete(id) {
        const result = await db.query(
            `DELETE FROM ausencias_alunos
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        return result.rows[0];
    }
}

module.exports = AusenciaModel;
