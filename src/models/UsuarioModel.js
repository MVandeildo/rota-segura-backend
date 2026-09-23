const db = require("../config/database");

class UsuarioModel {
    static async findByEmail(email) {
        const result = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const result = await db.query("SELECT id, nome, email, perfil, telefone, created_at FROM usuarios WHERE id = $1", [id]);
        return result.rows[0];
    }

    static async create({ nome, email, senha, perfil, telefone }) {
        const result = await db.query(`INSERT INTO usuarios (nome, email, senha, perfil, telefone)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING id, nome, email, perfil, telefone, created_at`,
            [nome, email, senha, perfil, telefone || null]);
        return result.rows[0];
    }
}

module.exports = UsuarioModel;