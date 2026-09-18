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

exports.criar = async (req, res) => {
    const { nome, email, senha, telefone } = req.body;
    const emailFormatado = email?.trim().toLowerCase();

    /* Validação dos campos obrigatórios */
    if (!nome || !emailFormatado || !senha) {
        return res.status(400).json({
            erro: 'Nome, e-mail e senha são obrigatórios.'
        });
    }

    /* Validação do formato do email */
    if (!emailValido(emailFormatado)) {
        return res.status(400).json({
            erro: 'Informe um e-mail válido.'
        });
    }

  try{
        const emailExistente = await db.query('SELECT id FROM usuarios WHERE email = $1', [emailFormatado]);

        if (emailExistente.rows.length > 0) {
            return res.status(400).json({
            erro: 'E-mail já cadastrado.'
        });
    }

    /* Criptografando a senha */
    const senhaCriptografada = await bcrypt.hash(senha, SALT_ROUNDS);

    /*POST /motoristas - Cria um novo motorista */
exports.criar = async (req, res) => {
    const { nome, email, senha, telefone } = req.body;
    const emailFormatado = email?.trim().toLowerCase();

    /* Validação dos campos obrigatórios */
    if (!nome || !emailFormatado || !senha) {
        return res.status(400).json({
            erro: 'Nome, e-mail e senha são obrigatórios.'
        });
    }

    /* Validação do formato do email */
    if (!emailValido(emailFormatado)) {
        return res.status(400).json({
            erro: 'Informe um e-mail válido.'
        });
    }

    try{
        const [emailExistente] = await db.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [emailFormatado]
        );
        if (emailExistente.length > 0) {
            return res.status(400).json({
            erro: 'E-mail já cadastrado.'
        });
    }

    /* Criptografando a senha */
    const senhaCriptografada = await bcrypt.hash(senha, SALT_ROUNDS);

    /*inserir no banco de dados o motorista com perfil "motorista" */
    const [result] = await db.query(
        `INSERT INTO usuarios
        (nome, email, senha, perfil, telefone)
        VALUES (?, ?, ?, ?, ?)`,
    [
        nome.trim(),
        emailFormatado,
        senhaCriptografada,
        'MOTORISTA',
        telefone?.trim() || null
    ]
    );

    const [motorista] = await db.query(
        `SELECT id, nome, email, perfil, telefone, created_at
        FROM usuarios
        WHERE id = ?`,
        [result.insertId]
    );

    res.status(201).json({
        mensagem: 'Motorista criado com sucesso.',
        motorista: motorista[0]
    });

    } catch (error) {
        console.error('Erro ao cadastrar motorista:', error);

        return res.status(500).json({
        erro: 'Erro ao cadastrar motorista.'
    });
    }
}

    /*GET /motoristas - Lista todos os motoristas cadastrados */
exports.listar = async (req, res) => {
    try {
        const [motoristas] = await db.query(
            `SELECT id, nome, email, perfil, telefone, created_at
             FROM usuarios
             WHERE perfil = 'MOTORISTA'
             ORDER BY id ASC`
        );

        return res.status(200).json(motoristas);

    } catch (error) {
        console.error('Erro ao listar motoristas:', error);

        return res.status(500).json({
            erro: 'Erro ao listar motoristas.'
        });
    }
};

/* PUT /motoristas/:id - Atualiza os dados de um motorista existente */
exports.atualizar = async (req, res) => {
    const { id } = req.params;
    const { nome, email, senha, telefone } = req.body;

    const emailFormatado = email?.trim().toLowerCase();

    /* Validação dos campos obrigatórios */
    if (!nome || !emailFormatado) {
        return res.status(400).json({
            erro: 'Nome e e-mail são obrigatórios.'
        });
    }

    /* Validação do formato do e-mail */
    if (!emailValido(emailFormatado)) {
        return res.status(400).json({
            erro: 'Informe um e-mail válido.'
        });
    }

    try {
        /* Verifica se o motorista existe */
        const [motoristas] = await db.query(
            `SELECT id
             FROM usuarios
             WHERE id = ? AND perfil = 'MOTORISTA'`,
            [id]
        );

        if (motoristas.length === 0) {
            return res.status(404).json({
                erro: 'Motorista não encontrado.'
            });
        }

        /* Verifica se o novo e-mail já pertence a outro usuário */
        const [emailExistente] = await db.query(
            `SELECT id
             FROM usuarios
             WHERE email = ? AND id <> ?`,
            [emailFormatado, id]
        );

        if (emailExistente.length > 0) {
            return res.status(400).json({
                erro: 'O e-mail informado já pertence a outro usuário.'
            });
        }

        /* Se uma nova senha foi enviada, criptografa antes de salvar */
        if (senha) {
            const senhaCriptografada = await bcrypt.hash(
                senha,
                SALT_ROUNDS
            );

            await db.query(
                `UPDATE usuarios
                 SET nome = ?, email = ?, senha = ?, telefone = ?
                 WHERE id = ? AND perfil = 'MOTORISTA'`,
                [
                    nome.trim(),
                    emailFormatado,
                    senhaCriptografada,
                    telefone?.trim() || null,
                    id
                ]
            );
        } else {
            /* Atualiza sem alterar a senha */
            await db.query(
                `UPDATE usuarios
                 SET nome = ?, email = ?, telefone = ?
                 WHERE id = ? AND perfil = 'MOTORISTA'`,
                [
                    nome.trim(),
                    emailFormatado,
                    telefone?.trim() || null,
                    id
                ]
            );
        }

        /* Busca os dados atualizados */
        const [motoristaAtualizado] = await db.query(
            `SELECT id, nome, email, perfil, telefone, created_at
             FROM usuarios
             WHERE id = ?`,
            [id]
        );

        return res.status(200).json({
            mensagem: 'Motorista atualizado com sucesso.',
            motorista: motoristaAtualizado[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar motorista:', error);

        return res.status(500).json({
            erro: 'Erro ao atualizar motorista.'
        });
    }
};

/* DELETE /api/motoristas/:id */
exports.deletar = async (req, res) => {
    const { id } = req.params;

    try {
        /* Verifica se o motorista existe */
        const [motoristas] = await db.query(
            `SELECT id
             FROM usuarios
             WHERE id = ? AND perfil = 'MOTORISTA'`,
            [id]
        );

        if (motoristas.length === 0) {
            return res.status(404).json({
                erro: 'Motorista não encontrado.'
            });
        }

        /* Exclui o motorista */
        await db.query(
            `DELETE FROM usuarios
             WHERE id = ? AND perfil = 'MOTORISTA'`,
            [id]
        );

        return res.status(204).send();

    } catch (error) {
        console.error('Erro ao excluir motorista:', error);

        return res.status(500).json({
            erro: 'Erro ao excluir motorista.'
        });
    }
};
