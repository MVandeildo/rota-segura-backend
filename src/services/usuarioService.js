const bcrypt = require('bcrypt');

let usuarios = [];
let proximoId = 1;

const PERFIS_VALIDOS = [
    'GESTOR',
    'MOTORISTA',
    'RESPONSAVEL'
];

const criarUsuario = async (dados) => {
    const { nome, email, senha, perfil } = dados;

    if (!nome || !email || !senha || !perfil) {
        throw new Error('Nome, email, senha e perfil são obrigatórios.');
    }

    if (!PERFIS_VALIDOS.includes(perfil)) {
        throw new Error(
            'Perfil inválido. Use GESTOR, MOTORISTA ou RESPONSAVEL.'
        );
    }

    const emailExistente = usuarios.find(
        usuario => usuario.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExistente) {
        throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novoUsuario = {
        id: proximoId++,
        nome,
        email,
        senha: senhaCriptografada,
        perfil,
        ativo: true
    };

    usuarios.push(novoUsuario);

    const { senha: _, ...usuarioSemSenha } = novoUsuario;

    return usuarioSemSenha;
};


const listarUsuarios = () => {
    return usuarios.map(({ senha, ...usuario }) => usuario);
};


const buscarUsuarioPorId = (id) => {
    const usuario = usuarios.find(
        usuario => usuario.id === Number(id)
    );

    if (!usuario) {
        throw new Error('Usuário não encontrado.');
    }

    const { senha, ...usuarioSemSenha } = usuario;

    return usuarioSemSenha;
};


const atualizarUsuario = async (id, dados) => {
    const usuario = usuarios.find(
        usuario => usuario.id === Number(id)
    );

    if (!usuario) {
        throw new Error('Usuário não encontrado.');
    }

    const { nome, email, senha, perfil } = dados;

    if (perfil && !PERFIS_VALIDOS.includes(perfil)) {
        throw new Error(
            'Perfil inválido. Use GESTOR, MOTORISTA ou RESPONSAVEL.'
        );
    }

    if (email) {
        const emailExistente = usuarios.find(
            outroUsuario =>
                outroUsuario.email.toLowerCase() === email.toLowerCase() &&
                outroUsuario.id !== usuario.id
        );

        if (emailExistente) {
            throw new Error(
                'Já existe outro usuário cadastrado com este e-mail.'
            );
        }

        usuario.email = email;
    }

    if (nome) {
        usuario.nome = nome;
    }

    if (perfil) {
        usuario.perfil = perfil;
    }

    if (senha) {
        usuario.senha = await bcrypt.hash(senha, 10);
    }

    const { senha: _, ...usuarioSemSenha } = usuario;

    return usuarioSemSenha;
};


const removerUsuario = (id) => {
    const indice = usuarios.findIndex(
        usuario => usuario.id === Number(id)
    );

    if (indice === -1) {
        throw new Error('Usuário não encontrado.');
    }

    usuarios[indice].ativo = false;

    const { senha, ...usuarioSemSenha } = usuarios[indice];

    return usuarioSemSenha;
};


module.exports = {
    criarUsuario,
    listarUsuarios,
    buscarUsuarioPorId,
    atualizarUsuario,
    removerUsuario
};