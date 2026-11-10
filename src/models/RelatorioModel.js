const db = require('../config/database');

class RelatorioModel {
    /**
     * @param {number} responsavelId - ID do usuário responsável
     * @returns {Promise<number[]>} Array com os IDs dos estudantes vinculados
     */
    static async buscarIdsAlunosPorResponsavel(responsavelId) {
        const result = await db.query(
            `SELECT aluno_id FROM responsavel_alunos WHERE responsavel_id = $1`,
            [responsavelId]
        );
        return result.rows.map(row => row.aluno_id);
    }

    /**
     * @param {Object} filtros - 
     * @returns {Promise<Object[]>}
     */
    static async listarAuditoria(filtros = {}) {
        const condicoes = [];
        const parametros = [];

        if (filtros.dataInicio) {
            parametros.push(filtros.dataInicio);
            condicoes.push(`p.registrado_em >= $${parametros.length}::date`);
        }

        if (filtros.dataFim) {
            parametros.push(filtros.dataFim);
            condicoes.push(`p.registrado_em < ($${parametros.length}::date + INTERVAL '1 day')`);
        }

        if (filtros.rotaId) {
            parametros.push(filtros.rotaId);
            condicoes.push(`p.rota_id = $${parametros.length}`);
        }

        if (filtros.motoristaId) {
            parametros.push(filtros.motoristaId);
            condicoes.push(`p.motorista_id = $${parametros.length}`);
        }

        if (filtros.alunoId) {
            parametros.push(filtros.alunoId);
            condicoes.push(`p.aluno_id = $${parametros.length}`);
        }

        if (filtros.alunosPermitidos && Array.isArray(filtros.alunosPermitidos)) {
            if (filtros.alunosPermitidos.length === 0) {
                condicoes.push(`1 = 0`); 
            } else {
                parametros.push(filtros.alunosPermitidos);
                condicoes.push(`p.aluno_id = ANY($${parametros.length})`);
            }
        }

        const where = condicoes.length > 0
            ? `WHERE ${condicoes.join(' AND ')}`
            : '';

        const query = `
            SELECT
                p.id AS presenca_id,
                p.registrado_em,
                p.tipo,
                a.id AS aluno_id,
                a.nome AS aluno_nome,
                r.id AS rota_id,
                r.nome AS rota_nome,
                m.id AS motorista_id,
                m.nome AS motorista_nome,
                p.latitude,
                p.longitude
            FROM historico_viagens p
            INNER JOIN alunos a ON a.id = p.aluno_id
            INNER JOIN rotas r ON r.id = p.rota_id
            INNER JOIN usuarios m ON m.id = p.motorista_id
            ${where}
            ORDER BY p.registrado_em DESC, p.id DESC
        `;

        const result = await db.query(query, parametros);
        return result.rows;
    }
}

module.exports = RelatorioModel;
