
const db = require('../config/database');

class RelatorioModel {
    
static async listarViagens(filtros = {}) {
    const condicoes = [];
    const parametros = [];

    if (filtros.dataInicio) {
        parametros.push(filtros.dataInicio);
        condicoes.push(`v.data >= $${parametros.length}::date`);
    }

    if (filtros.dataFim) {
        parametros.push(filtros.dataFim);
        condicoes.push(`v.data <= $${parametros.length}::date`);
    }

    if (filtros.rotaId) {
        parametros.push(filtros.rotaId);
        condicoes.push(`v.rota_id = $${parametros.length}`);
    }

    if (filtros.motoristaId) {
        parametros.push(filtros.motoristaId);
        condicoes.push(`v.motorista_id = $${parametros.length}`);
    }

    const where = condicoes.length
        ? `WHERE ${condicoes.join(' AND ')}`
        : '';

    const result = await db.query(`
        SELECT
            v.id AS viagem_id,
            v.rota_id,
            r.nome AS rota_nome,
            v.veiculo_id,
            v.motorista_id,
            m.nome AS motorista_nome,
            v.data,
            v.turno,
            v.status,
            v.iniciada_em,
            v.finalizada_em,
            v.created_at
        FROM viagens v
        LEFT JOIN rotas r ON r.id = v.rota_id
        LEFT JOIN usuarios m ON m.id = v.motorista_id
        ${where}
        ORDER BY v.data DESC, v.id DESC
    `, parametros);

    return result.rows;
}

}

module.exports = RelatorioModel;
