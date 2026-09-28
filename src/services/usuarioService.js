const bcrypt = require('bcrypt');
const UsuarioModel = require('../models/UsuarioModel');

const PERFIS_VALIDOS = [
    'GESTOR',
    'MOTORISTA',
    'RESPONSAVEL'
];

const criarErro = (mensagem, statusCode) => {
    const error = new Error(mensagem);
    error.statusCode = statusCode;
    return error;
};

const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const criarUsuario = async (dados = {}) => {
    const nome = typeof dados.nome === 'string' ? dados.nome.trim() : '';
    const email = typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : '';
    const { senha, perfil } = dados;
    const telefone = typeof dados.telefone === 'string' ? dados.telefone.trim() : null;

    if (!nome || !email || !senha || !perfil) {
        throw criarErro('Nome, email, senha e perfil são obrigatórios.', 400);
    }

    if (!emailValido(email)) {
        throw criarErro('Informe um e-mail válido.', 400);
    }

    if (!PERFIS_VALIDOS.includes(perfil)) {
        throw criarErro('Perfil inválido. Use GESTOR, MOTORISTA ou RESPONSAVEL.', 400);
    }

    const emailExistente = await UsuarioModel.findByEmail(email);

    if (emailExistente) {
        throw criarErro('Já existe um usuário cadastrado com este e-mail.', 409);
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    return UsuarioModel.create({
        nome,
        email,
        senha: senhaCriptografada,
        perfil,
        telefone
    });
};


const listarUsuarios = async () => {
    return UsuarioModel.findAll();
};


const buscarUsuarioPorId = async (id) => {
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        throw criarErro('ID de usuário inválido.', 400);
    }

    const usuario = await UsuarioModel.findById(Number(id));

    if (!usuario) {
        throw criarErro('Usuário não encontrado.', 404);
    }

    return usuario;
};


const atualizarUsuario = async (id, dados = {}) => {
    const usuarioExistente = await buscarUsuarioPorId(id);
    const dadosAtualizados = {};

    if (Object.prototype.hasOwnProperty.call(dados, 'nome')) {
        if (typeof dados.nome !== 'string' || !dados.nome.trim()) {
            throw criarErro('Nome não pode ser vazio.', 400);
        }
        dadosAtualizados.nome = dados.nome.trim();
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'email')) {
        const email = typeof dados.email === 'string' ? dados.email.trim().toLowerCase() : '';
        if (!emailValido(email)) {
            throw criarErro('Informe um e-mail válido.', 400);
        }

        const emailExistente = await UsuarioModel.findByEmail(email);
        if (emailExistente && emailExistente.id !== usuarioExistente.id) {
            throw criarErro('Já existe outro usuário cadastrado com este e-mail.', 409);
        }
        dadosAtualizados.email = email;
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'perfil')) {
        if (!PERFIS_VALIDOS.includes(dados.perfil)) {
            throw criarErro('Perfil inválido. Use GESTOR, MOTORISTA ou RESPONSAVEL.', 400);
        }
        dadosAtualizados.perfil = dados.perfil;
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'senha')) {
        if (typeof dados.senha !== 'string' || !dados.senha) {
            throw criarErro('Senha não pode ser vazia.', 400);
        }
        dadosAtualizados.senha = await bcrypt.hash(dados.senha, 10);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'telefone')) {
        dadosAtualizados.telefone = typeof dados.telefone === 'string'
            ? dados.telefone.trim() || null
            : null;
    }

    if (Object.keys(dadosAtualizados).length === 0) {
        throw criarErro('Informe ao menos um campo válido para atualizar.', 400);
    }

    return UsuarioModel.update(Number(id), dadosAtualizados);
};


const removerUsuario = async (id) => {
    await buscarUsuarioPorId(id);

    try {
        const usuario = await UsuarioModel.delete(Number(id));
        if (!usuario) {
            throw criarErro('Usuário não encontrado.', 404);
        }
        return usuario;
    } catch (error) {
        if (error.code === '23503') {
            throw criarErro('Usuário vinculado a outros registros não pode ser removido.', 409);
        }
        throw error;
    }
};


module.exports = {
    criarUsuario,
    listarUsuarios,
    buscarUsuarioPorId,
    atualizarUsuario,
    removerUsuario
};