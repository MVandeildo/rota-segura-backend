/* permite acessar o PostgreSQL */
const db = require('../config/database');

/* permite acessar o bcrypt para criptografar a senha */
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/* Função para validar o formato do email */
const emailValido = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const idValido = (id) => /^\d+$/.test(id) && Number(id) > 0;

/*POST /motoristas - Cria um novo motorista */
exports.criar = async (req, res) => {
    const { nome, email, senha, telefone } = req.body;
    const nomeFormatado = typeof nome === 'string' ? nome.trim() : '';
    const emailFormatado = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!nomeFormatado || !emailFormatado || !senha) {
        return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (!emailValido(emailFormatado)) {
        return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    }

    try {
        const emailExistente = await db.query(
            'SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1)',
            [emailFormatado]
        );
        if (emailExistente.rows.length > 0) {
            return res.status(409).json({ erro: 'E-mail já cadastrado.' });
        }

        const senhaCriptografada = await bcrypt.hash(senha, SALT_ROUNDS);
        const result = await db.query(
            `INSERT INTO usuarios (nome, email, senha, perfil, telefone)
             VALUES ($1, $2, $3, 'MOTORISTA', $4)
             RETURNING id, nome, email, perfil, telefone, created_at`,
            [nomeFormatado, emailFormatado, senhaCriptografada, telefone?.trim() || null]
        );

        return res.status(201).json({
            mensagem: 'Motorista criado com sucesso.',
            motorista: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ erro: 'E-mail já cadastrado.' });
        }
        return res.status(500).json({ erro: 'Erro ao cadastrar motorista.' });
    }
};

    /*GET /motoristas - Lista todos os motoristas cadastrados */
exports.listar = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, nome, email, perfil, telefone, created_at
             FROM usuarios
             WHERE perfil = 'MOTORISTA'
             ORDER BY id ASC`
        );

        return res.status(200).json(result.rows);

    } catch (error) {
        console.error('Erro ao listar motoristas:', error);

        return res.status(500).json({
            erro: 'Erro ao listar motoristas.'
        });
    }
};

exports.buscarPorId = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) {
        return res.status(400).json({ erro: 'ID de motorista inválido.' });
    }

    try {
        const result = await db.query(
            `SELECT id, nome, email, perfil, telefone, created_at
             FROM usuarios WHERE id = $1 AND perfil = 'MOTORISTA'`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Motorista não encontrado.' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        return res.status(500).json({ erro: 'Erro ao buscar motorista.' });
    }
};

/* PUT /motoristas/:id - Atualiza os dados de um motorista existente */
exports.atualizar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) {
        return res.status(400).json({ erro: 'ID de motorista inválido.' });
    }

    const dados = req.body || {};
    const campos = [];
    const valores = [];

    if (Object.prototype.hasOwnProperty.call(dados, 'nome')) {
        const nome = typeof dados.nome === 'string' ? dados.nome.trim() : '';
        if (!nome) {
            return res.status(400).json({ erro: 'Nome não pode ser vazio.' });
        }
        campos.push(`nome = $${valores.length + 1}`);
        valores.push(nome);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'email')) {
        const email = typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : '';
        if (!emailValido(email)) {
            return res.status(400).json({ erro: 'Informe um e-mail válido.' });
        }
        campos.push(`email = $${valores.length + 1}`);
        valores.push(email);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'senha')) {
        if (typeof dados.senha !== 'string' || !dados.senha) {
            return res.status(400).json({ erro: 'Senha não pode ser vazia.' });
        }
        campos.push(`senha = $${valores.length + 1}`);
        valores.push(await bcrypt.hash(dados.senha, SALT_ROUNDS));
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'telefone')) {
        campos.push(`telefone = $${valores.length + 1}`);
        valores.push(typeof dados.telefone === 'string' ? dados.telefone.trim() || null : null);
    }

    if (campos.length === 0) {
        return res.status(400).json({ erro: 'Informe ao menos um campo para atualizar.' });
    }

    try {
        valores.push(id);
        const result = await db.query(
            `UPDATE usuarios SET ${campos.join(', ')}
             WHERE id = $${valores.length} AND perfil = 'MOTORISTA'
             RETURNING id, nome, email, perfil, telefone, created_at`,
            valores
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Motorista não encontrado.' });
        }
        return res.status(200).json({
            mensagem: 'Motorista atualizado com sucesso.',
            motorista: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ erro: 'E-mail já cadastrado.' });
        }
        return res.status(500).json({ erro: 'Erro ao atualizar motorista.' });
    }
};

/* DELETE /api/motoristas/:id */
exports.deletar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) {
        return res.status(400).json({ erro: 'ID de motorista inválido.' });
    }

    try {
        const result = await db.query(
            `DELETE FROM usuarios WHERE id = $1 AND perfil = 'MOTORISTA' RETURNING id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Motorista não encontrado.' });
        }

        return res.status(204).send();

    } catch (error) {
        if (error.code === '23503') {
            return res.status(409).json({ erro: 'Motorista vinculado a uma rota não pode ser removido.' });
        }
        return res.status(500).json({
            erro: 'Erro ao excluir motorista.'
        });
    }
};
