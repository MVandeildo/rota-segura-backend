const db = require('../config/database');

const camposAtualizaveis = [
    'nome',
    'data_nascimento',
    'serie',
    'endereco_embarque',
    'numero',
    'bairro',
    'cidade',
    'estado',
    'cep',
    'responsavel_id',
    'rota_id'
];

class AlunoModel {
    static async findAll() {
        const result = await db.query('SELECT * FROM alunos ORDER BY id ASC');
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query('SELECT * FROM alunos WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async create({
        nome,
        data_nascimento,
        serie,
        endereco_embarque,
        numero,
        bairro,
        cidade,
        estado,
        cep,
        responsavel_id,
        rota_id
    }) {
        const result = await db.query(
            `INSERT INTO alunos (
                nome, data_nascimento, serie, endereco_embarque, numero,
                bairro, cidade, estado, cep, responsavel_id, rota_id, ativo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
            RETURNING *`,
            [
                nome,
                data_nascimento,
                serie,
                endereco_embarque,
                numero,
                bairro,
                cidade,
                estado,
                cep,
                responsavel_id,
                rota_id
            ]
        );
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
            `UPDATE alunos SET ${atribuicoes.join(', ')}
            WHERE id = $${valores.length} RETURNING *`,
            valores
        );
        return result.rows[0];
    }

    static async deactivate(id) {
        const result = await db.query(
            'UPDATE alunos SET ativo = FALSE WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }
}

module.exports = AlunoModel;
