const db = require("../config/database");

const camposAtualizaveis = ['nome', 'email', 'senha', 'perfil', 'telefone'];

class UsuarioModel {
    static async findAll() {
        const result = await db.query(
            'SELECT id, nome, email, perfil, telefone, created_at FROM usuarios ORDER BY id ASC'
        );
        return result.rows;
    }

    static async findByEmail(email) {
        const result = await db.query(
            'SELECT id, nome, email, perfil, telefone, created_at FROM usuarios WHERE LOWER(email) = LOWER($1)',
            [email]
        );
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

    static async update(id, dados) {
        const campos = camposAtualizaveis.filter(campo =>
            Object.prototype.hasOwnProperty.call(dados, campo)
        );

        if (campos.length === 0) {
            return this.findById(id);
        }

        const atribuicoes = campos.map((campo, indice) => `${campo} = $${indice + 1}`);
        const valores = campos.map(campo => dados[campo]);
        valores.push(id);

        const result = await db.query(
            `UPDATE usuarios SET ${atribuicoes.join(', ')}
             WHERE id = $${valores.length}
             RETURNING id, nome, email, perfil, telefone, created_at`,
            valores
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query(
            `DELETE FROM usuarios WHERE id = $1
             RETURNING id, nome, email, perfil, telefone, created_at`,
            [id]
        );
        return result.rows[0];
    }
}

module.exports = UsuarioModel;