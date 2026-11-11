const db = require("../config/database");

class RotaModel {
    static async findAll() {
        const result = await db.query(`
            SELECT r.*, v.placa AS veiculo_placa, v.modelo AS veiculo_modelo,
                   u.nome AS motorista_nome,
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', p.id,
                               'endereco', p.endereco,
                               'horario_embarque', p.horario_embarque,
                               'horario_desembarque', p.horario_desembarque,
                               'ordem', p.ordem
                           ) ORDER BY p.ordem
                       ) FILTER (WHERE p.id IS NOT NULL),
                       '[]'::json
                   ) AS paradas
            FROM rotas r 
            LEFT JOIN veiculos v ON r.veiculo_id = v.id
            LEFT JOIN usuarios u ON r.motorista_id = u.id
            LEFT JOIN paradas_rota p ON p.rota_id = r.id
            GROUP BY r.id, v.placa, v.modelo, u.nome
            ORDER BY r.id ASC
        `);
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query(`
            SELECT r.*, v.placa AS veiculo_placa, v.modelo AS veiculo_modelo,
                   u.nome AS motorista_nome,
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', p.id,
                               'endereco', p.endereco,
                               'horario_embarque', p.horario_embarque,
                               'horario_desembarque', p.horario_desembarque,
                               'ordem', p.ordem
                           ) ORDER BY p.ordem
                       ) FILTER (WHERE p.id IS NOT NULL),
                       '[]'::json
                   ) AS paradas
            FROM rotas r 
            LEFT JOIN veiculos v ON r.veiculo_id = v.id
            LEFT JOIN usuarios u ON r.motorista_id = u.id
            LEFT JOIN paradas_rota p ON p.rota_id = r.id
            WHERE r.id = $1
            GROUP BY r.id, v.placa, v.modelo, u.nome
        `, [id]);
        return result.rows[0];
    }

    static async create({ nome, turno = 'MANHA', veiculo_id, motorista_id = null, destino_lat = null, destino_lng = null, paradas = [] }) {
        const client = await db.connect();
        let rotaId;

        try {
            await client.query('BEGIN');
            const result = await client.query(
                `INSERT INTO rotas (nome, turno, veiculo_id, motorista_id, destino_lat, destino_lng, ativa)
                 VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id`,
                [nome, turno, veiculo_id, motorista_id, destino_lat, destino_lng]
            );
            rotaId = result.rows[0].id;
            await this.replaceStops(client, rotaId, paradas);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return this.findById(rotaId);
    }

    static async update(id, { nome, turno, veiculo_id, motorista_id, destino_lat, destino_lng, ativa, paradas }) {
        const client = await db.connect();
        let updated = false;

        try {
            await client.query('BEGIN');
            const result = await client.query(
                `UPDATE rotas
                 SET nome = COALESCE($1, nome),
                     turno = COALESCE($2, turno),
                     veiculo_id = COALESCE($3, veiculo_id),
                     motorista_id = CASE WHEN $4::boolean THEN $5 ELSE motorista_id END,
                     destino_lat = COALESCE($6, destino_lat),
                     destino_lng = COALESCE($7, destino_lng),
                     ativa = COALESCE($8, ativa)
                 WHERE id = $9
                 RETURNING id`,
                [
                    nome ?? null,
                    turno ?? null,
                    veiculo_id ?? null,
                    motorista_id !== undefined,
                    motorista_id ?? null,
                    destino_lat ?? null,
                    destino_lng ?? null,
                    ativa ?? null,
                    id
                ]
            );

            if (result.rows.length > 0) {
                updated = true;
                if (paradas !== undefined) {
                    await this.replaceStops(client, id, paradas);
                }
            }

            await client.query(updated ? 'COMMIT' : 'ROLLBACK');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return updated ? this.findById(id) : null;
    }

    static async replaceStops(client, rotaId, paradas) {
        await client.query('DELETE FROM paradas_rota WHERE rota_id = $1', [rotaId]);
        for (const [index, parada] of paradas.entries()) {
            await client.query(
                `INSERT INTO paradas_rota (rota_id, endereco, horario_embarque, horario_desembarque, ordem)
                 VALUES ($1, $2, $3, $4, $5)`,
                [rotaId, parada.endereco, parada.horario_embarque, parada.horario_desembarque, index + 1]
            );
        }
    }

    static async updateStatus(id, ativa) {
        const result = await db.query(
            'UPDATE rotas SET ativa = $1 WHERE id = $2 RETURNING id',
            [ativa, id]
        );
        return result.rows.length > 0 ? this.findById(id) : null;
    }

    static async updateLocalizacao(rotaId, { latitude, longitude, velocidade = null, heading = null }) {
        const result = await db.query(
            `UPDATE rotas 
             SET latitude = $1, longitude = $2, velocidade = $3, heading = $4, ultima_atualizacao = NOW() 
             WHERE id = $5 RETURNING *`,
            [latitude, longitude, velocidade, heading, rotaId]
        );
        return result.rows[0];
    }
}

module.exports = RotaModel;
