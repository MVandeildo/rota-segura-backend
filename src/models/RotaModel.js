const db = require('../config/database');

class RotaModel {
    static async findAll() {
        const query = `
      SELECT r.*, 
             v.placa AS veiculo_placa, v.modelo AS veiculo_modelo,
             u.nome AS motorista_nome, u.telefone AS motorista_telefone
      FROM rotas r
      LEFT JOIN veiculos v ON r.veiculo_id = v.id
      LEFT JOIN usuarios u ON r.motorista_id = u.id
      ORDER BY r.id ASC
    `;
        const result = await db.query(query);
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query('SELECT * FROM rotas WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async create({ nome, turno, veiculo_id, motorista_id }) {
        const result = await db.query(
            `INSERT INTO rotas (nome, turno, veiculo_id, motorista_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [nome, turno, veiculo_id, motorista_id]
        );
        return result.rows[0];
    }

    static async update(id, { nome, turno, veiculo_id, motorista_id }) {
        const result = await db.query(
            `UPDATE rotas 
       SET nome = $1, turno = $2, veiculo_id = $3, motorista_id = $4 
       WHERE id = $5 RETURNING *`,
            [nome, turno, veiculo_id, motorista_id, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM rotas WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }
}

module.exports = RotaModel;