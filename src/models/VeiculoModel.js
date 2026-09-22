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
        const result = db.query("SELECT * FROM veiculos WHERE placa = $1", [placa]);
        return result.rows[0];
    }

    static async create({ placa, modelo, capacidade, status = 'ATIVO' }) {
        const result = await db.query(
            `INSERT INTO veiculos (placa, modelo, capacidade, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [placa, modelo, capacidade, status]
        );
        return result.rows[0];
    }

    static async update(id, { placa, modelo, capacidade, status }) {
        const result = await db.query(
            `UPDATE veiculos 
       SET placa = $1, modelo = $2, capacidade = $3, status = $4 
       WHERE id = $5 RETURNING *`,
            [placa, modelo, capacidade, status, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM veiculos WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }

}

module.exports = VeiculoModel;