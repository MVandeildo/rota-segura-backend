const usuarioService = require('../services/usuarioService');

const responderErro = (res, error, mensagem) => {
    return res.status(error.statusCode || 500).json({
        erro: error.statusCode ? error.message : mensagem
    });
};

const criarUsuario = async (req, res) => {
    try {
        const usuario = await usuarioService.criarUsuario(req.body);

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso.',
            usuario
        });

    } catch (error) {
        return responderErro(res, error, 'Erro ao cadastrar usuário.');
    }
};


const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await usuarioService.listarUsuarios();

        return res.status(200).json(usuarios);

    } catch (error) {
        return responderErro(res, error, 'Erro ao listar usuários.');
    }
};


const buscarUsuario = async (req, res) => {
    try {
        const usuario = await usuarioService.buscarUsuarioPorId(req.params.id);

        return res.status(200).json(usuario);

    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar usuário.');
    }
};


const atualizarUsuario = async (req, res) => {
    try {
        const usuario = await usuarioService.atualizarUsuario(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            mensagem: 'Usuário atualizado com sucesso.',
            usuario
        });

    } catch (error) {
        return responderErro(res, error, 'Erro ao atualizar usuário.');
    }
};


const removerUsuario = async (req, res) => {
    try {
        const usuario = await usuarioService.removerUsuario(req.params.id);

        return res.status(200).json({
            mensagem: 'Usuário inativado com sucesso.',
            usuario
        });

    } catch (error) {
        return responderErro(res, error, 'Erro ao remover usuário.');
    }
};


module.exports = {
    criarUsuario,
    listarUsuarios,
    buscarUsuario,
    atualizarUsuario,
    removerUsuario
};