const db = require("../config/database");

class VeiculoModel {
    static async findAll() {
        const result = await db.query("SELECT * FROM veiculos ORDER BY id ASC");
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query("SELECT * FROM veiculos WHERE id = $1", [id]);
        return result.rows[0];
    }

    static async findByPlaca(placa) {
        const result = await db.query("SELECT * FROM veiculos WHERE placa = $1", [placa]);
        return result.rows[0];
    }

    static async create({ placa, modelo, capacidade, status = 'ATIVO', latitude = null, longitude = null, ultima_atualizacao = null, velocidade = null, heading = null }) {
        const result = await db.query(
            `INSERT INTO veiculos (placa, modelo, capacidade, status, latitude, longitude, ultima_atualizacao, velocidade, heading) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [placa, modelo, capacidade, status, latitude, longitude, ultima_atualizacao, velocidade, heading]
        );
        return result.rows[0];
    }

    static async update(id, { placa, modelo, capacidade, status, latitude, longitude, ultima_atualizacao, velocidade, heading }) {
        const result = await db.query(
            `UPDATE veiculos 
       SET placa = $1, modelo = $2, capacidade = $3, status = $4, latitude = $5, longitude = $6, ultima_atualizacao = $7, velocidade = $8, heading = $9 
       WHERE id = $10 RETURNING *`,
            [placa, modelo, capacidade, status, latitude, longitude, ultima_atualizacao, velocidade, heading, id]
        );
        return result.rows[0];
    }

    static async updateLocalizacao(id, { latitude, longitude, velocidade = null, heading = null }) {
        const result = await db.query(
            `UPDATE veiculos 
       SET latitude = $1, longitude = $2, velocidade = $3, heading = $4, ultima_atualizacao = NOW() 
       WHERE id = $5 RETURNING *`,
            [latitude, longitude, velocidade, heading, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM veiculos WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }

}

module.exports = VeiculoModel;
