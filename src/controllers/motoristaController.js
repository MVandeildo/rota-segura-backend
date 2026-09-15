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

}