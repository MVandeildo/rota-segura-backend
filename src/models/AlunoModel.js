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
    'email_responsavel',
    'responsavel_id',
    'rota_id',
    'usuario_id' // Adicionado para suportar o vínculo de login do estudante
];

class AlunoModel {
    static async findAll() {
        const result = await db.query(`
            SELECT alunos.*, 
                   resp.nome AS responsavel_nome,
                   est.email AS email_estudante 
            FROM alunos 
            LEFT JOIN usuarios resp ON alunos.responsavel_id = resp.id 
            LEFT JOIN usuarios est ON alunos.usuario_id = est.id 
            WHERE alunos.ativo = TRUE 
            ORDER BY alunos.id ASC
        `);
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query(`
            SELECT alunos.*, 
                   resp.nome AS responsavel_nome,
                   est.email AS email_estudante 
            FROM alunos 
            LEFT JOIN usuarios resp ON alunos.responsavel_id = resp.id 
            LEFT JOIN usuarios est ON alunos.usuario_id = est.id 
            WHERE alunos.id = $1
        `, [id]);
        return result.rows[0];
    }

    static async findByResponsavel(responsavelId) {
        const result = await db.query(
            'SELECT * FROM alunos WHERE responsavel_id = $1 AND ativo = TRUE ORDER BY id ASC',
            [responsavelId]
        );
        return result.rows;
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
        email_responsavel,
        responsavel_id,
        rota_id,
        usuario_id
    }) {
        const result = await db.query(
            `INSERT INTO alunos (
                nome, data_nascimento, serie, endereco_embarque, numero,
                bairro, cidade, estado, cep, email_responsavel, responsavel_id, rota_id, usuario_id, ativo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE)
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
                email_responsavel,
                responsavel_id,
                rota_id,
                usuario_id || null
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
