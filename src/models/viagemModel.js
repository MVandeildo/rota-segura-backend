const db = require('../config/database');

class ViagemModel {
    static async criarViagem({ rota_id, veiculo_id, motorista_id }) {
    const query = `
        INSERT INTO viagens (rota_id, veiculo_id, motorista_id, data, turno, status, iniciada_em)
        VALUES ($1, $2, $3, CURRENT_DATE, (SELECT turno FROM rotas WHERE id = $1), 'EM_ANDAMENTO', NOW())
        RETURNING *;
    `;
    const result = await db.query(query, [rota_id, veiculo_id, motorista_id]);
    return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT v.*, r.nome as rota_nome, r.turno 
            FROM viagens v
            JOIN rotas r ON v.rota_id = r.id
            WHERE v.id = $1;
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
    
    static async buscarViagensEmAndamentoPorRota(rotaId) {
        const query = `
            SELECT id, rota_id, veiculo_id, motorista_id, status, iniciada_em
            FROM viagens
            WHERE rota_id = $1
            AND status = 'EM_ANDAMENTO'
            ORDER BY iniciada_em DESC, id DESC;
        `;

        const result = await db.query(query, [rotaId]);
        return result.rows;
    }

    static async finalizarViagem(id) {
    const query = `
        UPDATE viagens
        SET status = 'CONCLUIDA',
            finalizada_em = NOW()
        WHERE id = $1 AND status = 'EM_ANDAMENTO'
        RETURNING *;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
    }

    static async registrarPosicao(viagemId, { latitude, longitude, velocidade, heading }) {
        const query = `
            INSERT INTO posicoes_viagem (viagem_id, latitude, longitude, velocidade, heading)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await db.query(query, [viagemId, latitude, longitude, velocidade || null, heading || null]);
        return result.rows[0];
    }

    static async registrarPresenca(viagemId, alunoId, tipo, { latitude, longitude }) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const queryPresenca = `
                INSERT INTO presencas_alunos (viagem_id, aluno_id, tipo, latitude, longitude)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const resPresenca = await client.query(queryPresenca, [viagemId, alunoId, tipo, latitude || null, longitude || null]);

            const statusViagemAluno = tipo === 'EMBARQUE' ? 'EMBARCADO' : 'DESEMBARCADO';
            await client.query(`
                UPDATE viagens_alunos 
                SET status = $1, atualizado_em = NOW()
                WHERE viagem_id = $2 AND aluno_id = $3;
            `, [statusViagemAluno, viagemId, alunoId]);

            await client.query('COMMIT');
            return resPresenca.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ViagemModel;