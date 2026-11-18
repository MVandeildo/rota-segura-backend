const db = require("../config/database");

class RotaModel {
    static async findAll() {
        const client = await db.connect();
        try {
            const query = `
                SELECT id, nome, destino_lat, destino_lng, turno, ativa 
                FROM rotas 
                ORDER BY id DESC;
            `;
            const result = await client.query(query);
            return result.rows;
        } finally {
            client.release();
        }
    }

    static async findById(id) {
        const result = await db.query(`
            SELECT r.*, 
                   COALESCE(
                       (SELECT json_agg(
                           json_build_object(
                               'id', p.id,
                               'endereco', p.endereco,
                               'horario_embarque', p.horario_embarque,
                               'horario_desembarque', p.horario_desembarque,
                               'ordem', p.ordem
                           ) ORDER BY p.ordem
                       ) FROM paradas_rota p WHERE p.rota_id = r.id),
                       '[]'::json
                   ) AS paradas
            FROM rotas r
            WHERE r.id = $1
        `, [id]);
        return result.rows[0];
    }

    static async create({ nome, turno, destino_lat, destino_lng, ativa, paradas }) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const rotaQuery = `
                INSERT INTO rotas (nome, turno, destino_lat, destino_lng, ativa)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const rotaValues = [
                nome, 
                turno || 'MANHA', 
                destino_lat || null, 
                destino_lng || null, 
                ativa ?? true
            ];
            
            const rotaResult = await client.query(rotaQuery, rotaValues);
            const novaRota = rotaResult.rows[0];

            if (paradas && paradas.length > 0) {
                for (const [index, parada] of paradas.entries()) {
                    await client.query(
                        `INSERT INTO paradas_rota (rota_id, endereco, horario_embarque, horario_desembarque, ordem)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [novaRota.id, parada.endereco, parada.horario_embarque || null, parada.horario_desembarque || null, index + 1]
                    );
                }
            }

            await client.query('COMMIT');
            return novaRota;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async update(id, { nome, turno, destino_lat, destino_lng, ativa, paradas }) {
        const client = await db.connect();
        let updated = false;

        try {
            await client.query('BEGIN');
            const result = await client.query(
                `UPDATE rotas
                 SET nome = COALESCE($1, nome),
                     turno = COALESCE($2, turno),
                     destino_lat = COALESCE($3, destino_lat),
                     destino_lng = COALESCE($4, destino_lng),
                     ativa = COALESCE($5, ativa)
                 WHERE id = $6
                 RETURNING id`,
                [
                    nome ?? null,
                    turno ?? null,
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
                [rotaId, parada.endereco, parada.horario_embarque || null, parada.horario_desembarque || null, index + 1]
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

    static async getPosicaoAtual(id) {
        const result = await db.query(
            'SELECT id, latitude_atual, longitude_atual FROM rotas WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) return null;
        return {
            lat: result.rows[0].latitude_atual,
            lng: result.rows[0].longitude_atual
        };
    }

    static async updateLocalizacao(id, lat, lng) {
        const result = await db.query(
            `UPDATE rotas 
             SET latitude_atual = $1, longitude_atual = $2 
             WHERE id = $3 
             RETURNING id, latitude_atual, longitude_atual`,
            [lat, lng, id]
        );
        return result.rows[0] || null;
    }
}

module.exports = RotaModel;