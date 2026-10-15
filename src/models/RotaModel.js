const db = require("../config/database");

class RotaModel {
    static async findAll() {
        const result = await db.query(`
            SELECT r.*, v.placa as veiculo_placa, v.modelo as veiculo_modelo 
            FROM rotas r 
            LEFT JOIN veiculos v ON r.veiculo_id = v.id 
            ORDER BY r.id ASC
        `);
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query(`
            SELECT r.*, v.placa as veiculo_placa, v.modelo as veiculo_modelo 
            FROM rotas r 
            LEFT JOIN veiculos v ON r.veiculo_id = v.id 
            WHERE r.id = $1
        `, [id]);
        return result.rows[0];
    }

    static async create({ nome, veiculo_id, destino_lat, destino_lng }) {
        const result = await db.query(
            `INSERT INTO rotas (nome, veiculo_id, destino_lat, destino_lng) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [nome, veiculo_id, destino_lat, destino_lng]
        );
        return result.rows[0];
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
