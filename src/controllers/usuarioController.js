const usuarioService = require('../services/usuarioService');

const criarUsuario = async (req, res) => {
    try {
        const usuario = await usuarioService.criarUsuario(req.body);

        return res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso.',
            usuario
        });

    } catch (error) {
        return res.status(400).json({
            erro: error.message
        });
    }
};


const listarUsuarios = (req, res) => {
    try {
        const usuarios = usuarioService.listarUsuarios();

        return res.status(200).json(usuarios);

    } catch (error) {
        return res.status(400).json({
            erro: error.message
        });
    }
};


const buscarUsuario = (req, res) => {
    try {
        const usuario = usuarioService.buscarUsuarioPorId(req.params.id);

        return res.status(200).json(usuario);

    } catch (error) {
        return res.status(404).json({
            erro: error.message
        });
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
        return res.status(400).json({
            erro: error.message
        });
    }
};


const removerUsuario = (req, res) => {
    try {
        const usuario = usuarioService.removerUsuario(req.params.id);

        return res.status(200).json({
            mensagem: 'Usuário inativado com sucesso.',
            usuario
        });

    } catch (error) {
        return res.status(404).json({
            erro: error.message
        });
    }
};


module.exports = {
    criarUsuario,
    listarUsuarios,
    buscarUsuario,
    atualizarUsuario,
    removerUsuario
};