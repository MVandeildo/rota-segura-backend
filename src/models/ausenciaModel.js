
const db = require('../config/database');

class AusenciaModel {
    static async create({ aluno_id, responsavel_id, data_ausencia }) {
        const result = await db.query(
            `INSERT INTO ausencias_alunos (
                aluno_id,
                responsavel_id,
                data_ausencia
            )
            VALUES ($1, $2, $3)
            RETURNING *`,
            [aluno_id, responsavel_id, data_ausencia]
        );

        return result.rows[0];
    }

    static async findById(id) {
        const result = await db.query(
            `SELECT *
             FROM ausencias_alunos
             WHERE id = $1`,
            [id]
        );

        return result.rows[0];
    }

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
