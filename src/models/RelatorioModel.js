const db = require('../config/database');

class RelatorioModel {
    static async listarAuditoria(filtros) {
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

        const where = condicoes.length > 0
            ? `WHERE ${condicoes.join(' AND ')}`
            : '';

        const result = await db.query(
            `SELECT
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
             FROM presencas_alunos p
             INNER JOIN alunos a ON a.id = p.aluno_id
             INNER JOIN rotas r ON r.id = p.rota_id
             INNER JOIN usuarios m ON m.id = p.motorista_id
             ${where}
             ORDER BY p.registrado_em DESC, p.id DESC`,
            parametros
        );

        return result.rows;
    }
}

module.exports = RelatorioModel;
