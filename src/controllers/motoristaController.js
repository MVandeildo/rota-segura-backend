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

    /*inserir no banco de dados o motorista com perfil "motorista" */
    const result = await db.query(
        `INSERT INTO usuarios 
        (nome, email, senha, perfil, telefone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nome, email, perfil, telefone, created_at`,
        [
            nome.trim(),
            emailFormatado,
            senhaCriptografada,
            'MOTORISTA',
            telefone?.trim() || null
        ]
    );

    res.status(201).json({ mensagem: 'Motorista criado com sucesso.', motorista: result.rows[0] });
    
    } catch (error) {
        console.error('Erro ao cadastrar motorista:', error);

        return res.status(500).json({
        erro: 'Erro ao cadastrar motorista.'
    });
    }
}
