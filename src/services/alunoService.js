const AlunoModel = require('../models/AlunoModel');
const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcrypt');

const criarErro = (mensagem, statusCode = 400) => {
    const error = new Error(mensagem);
    error.statusCode = statusCode;
    return error;
};

const normalizarDataNascimento = (dataNascimento) => {
    const data = dataNascimento instanceof Date
        ? dataNascimento.toISOString().slice(0, 10)
        : dataNascimento;

    if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        throw criarErro('Data de nascimento inválida. Use o formato AAAA-MM-DD.');
    }

    const dataParseada = new Date(`${data}T00:00:00.000Z`);
    if (Number.isNaN(dataParseada.getTime()) || dataParseada.toISOString().slice(0, 10) !== data) {
        throw criarErro('Data de nascimento inválida. Use o formato AAAA-MM-DD.');
    }

    return data;
};

const alunoMenorDeIdade = (dataNascimento) => {
    const hoje = new Date();
    const limiteMaioridade = new Date(Date.UTC(
        hoje.getUTCFullYear() - 18,
        hoje.getUTCMonth(),
        hoje.getUTCDate()
    )).toISOString().slice(0, 10);

    return dataNascimento > limiteMaioridade;
};

const normalizarResponsavelId = (responsavelId, dataNascimento, emailResponsavel) => {
    const menorDeIdade = alunoMenorDeIdade(dataNascimento);

    // Se temos um ID válido, normaliza e retorna
    if (responsavelId !== undefined && responsavelId !== null && responsavelId !== '') {
        const responsavelIdNumerico = Number(responsavelId);
        if (Number.isInteger(responsavelIdNumerico) && responsavelIdNumerico > 0) {
            return responsavelIdNumerico;
        }
    }

    // Se o aluno é menor de idade, exige obrigatoriamente um responsável vinculado ou e-mail
    if (menorDeIdade && (!emailResponsavel || emailResponsavel.trim() === '')) {
        throw criarErro('Aluno menor de 18 anos deve ter um responsável vinculado (informe o e-mail ou ID).');
    }

    // Se for MAIOR de 18 anos, o responsável/e-mail passa a ser opcional
    if (!menorDeIdade) {
        return responsavelId ? Number(responsavelId) : null;
    }

    return responsavelId ? Number(responsavelId) : null;
};

const criarAluno = async (dados = {}) => {
    const {
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
        email_estudante, 
        senha_estudante   
    } = dados;

    if (
        !nome ||
        !data_nascimento ||
        !serie ||
        !endereco_embarque ||
        !numero ||
        !bairro ||
        !cidade ||
        !estado ||
        !cep ||
        rota_id === undefined || rota_id === null || rota_id === ''
    ) {
        throw criarErro(
            'Nome, data de nascimento, série, endereço, número, bairro, cidade, estado, CEP e rota são obrigatórios.'
        );
    }

    const dataNascimentoNormalizada = normalizarDataNascimento(data_nascimento);
    const responsavelIdNormalizado = normalizarResponsavelId(responsavel_id, dataNascimentoNormalizada, email_responsavel);

    let usuarioIdFinal = dados.usuario_id || null;

    // Se o administrador informou um e-mail e senha para o estudante logar no sistema
    if (email_estudante && email_estudante.trim() !== '') {
        let usuarioExistente = await UsuarioModel.findByEmail(email_estudante);

        if (!usuarioExistente) {
            const senhaTemporaria = senha_estudante || '123456'; 
            const hashedPassword = await bcrypt.hash(senhaTemporaria, 10);

            const novoUsuario = await UsuarioModel.create({
                nome,
                email: email_estudante,
                password: hashedPassword,
                perfil: 'estudante'
            });
            usuarioIdFinal = novoUsuario.id;
        } else {
            usuarioIdFinal = usuarioExistente.id;
        }
    }

    return AlunoModel.create({
        nome,
        data_nascimento: dataNascimentoNormalizada,
        serie,
        endereco_embarque,
        numero,
        bairro,
        cidade,
        estado,
        cep,
        email_responsavel: email_responsavel || null,
        responsavel_id: responsavelIdNormalizado,
        rota_id: Number(rota_id),
        usuario_id: usuarioIdFinal ? Number(usuarioIdFinal) : null
    });
};

const listarAlunos = async () => {
    return AlunoModel.findAll();
};

const listarAlunosPorResponsavel = async (responsavelId) => {
    if (typeof AlunoModel.findByResponsavel === 'function') {
        return AlunoModel.findByResponsavel(responsavelId);
    }
    const todos = await AlunoModel.findAll();
    return todos.filter(aluno => Number(aluno.responsavel_id) === Number(responsavelId));
};

const buscarAlunoPorId = async (id) => {
    const aluno = await AlunoModel.findById(id);

    if (!aluno) {
        throw criarErro('Aluno não encontrado.', 404);
    }

    return aluno;
};

const atualizarAluno = async (id, dados) => {
    const alunoExistente = await buscarAlunoPorId(id);
    const dadosAtualizados = { ...dados };

    const dataNascimento = normalizarDataNascimento(
        Object.prototype.hasOwnProperty.call(dadosAtualizados, 'data_nascimento')
            ? dadosAtualizados.data_nascimento
            : alunoExistente.data_nascimento
    );

    if (Object.prototype.hasOwnProperty.call(dadosAtualizados, 'data_nascimento')) {
        dadosAtualizados.data_nascimento = dataNascimento;
    }

    if (!Object.prototype.hasOwnProperty.call(dadosAtualizados, 'responsavel_id') || !dadosAtualizados.responsavel_id) {
        dadosAtualizados.responsavel_id = alunoExistente.responsavel_id;
    } else {
        dadosAtualizados.responsavel_id = normalizarResponsavelId(
            dadosAtualizados.responsavel_id,
            dataNascimento,
            dadosAtualizados.email_responsavel || alunoExistente.email_responsavel
        );
    }

    if (dadosAtualizados.rota_id) {
        dadosAtualizados.rota_id = Number(dadosAtualizados.rota_id);
    }

    // Se um novo e-mail de estudante foi informado na edição
    if (dadosAtualizados.email_estudante && dadosAtualizados.email_estudante.trim() !== '') {
        if (alunoExistente.usuario_id) {
            // Atualiza o e-mail na tabela de usuários existente
            await UsuarioModel.update(alunoExistente.usuario_id, {
                email: dadosAtualizados.email_estudante
            });
            if (dadosAtualizados.senha_estudante && dadosAtualizados.senha_estudante.trim() !== '') {
                const hashedPassword = await bcrypt.hash(dadosAtualizados.senha_estudante, 10);
                await UsuarioModel.update(alunoExistente.usuario_id, {
                    password: hashedPassword
                });
            }
        } else {
            // Se não tinha usuário vinculado, cria um novo
            const senhaTemporaria = dadosAtualizados.senha_estudante || '123456';
            const hashedPassword = await bcrypt.hash(senhaTemporaria, 10);
            const novoUsuario = await UsuarioModel.create({
                nome: dadosAtualizados.nome || alunoExistente.nome,
                email: dadosAtualizados.email_estudante,
                password: hashedPassword,
                perfil: 'estudante'
            });
            dadosAtualizados.usuario_id = novoUsuario.id;
        }
    }

    const aluno = await AlunoModel.update(id, dadosAtualizados);

    if (!aluno) {
        throw criarErro('Aluno não encontrado.', 404);
    }

    return aluno;
};

const removerAluno = async (id) => {
    const aluno = await AlunoModel.deactivate(id);

    if (!aluno) {
        throw criarErro('Aluno não encontrado.', 404);
    }

    return aluno;
};

module.exports = {
    criarAluno,
    listarAlunos,
    listarAlunosPorResponsavel,
    buscarAlunoPorId,
    atualizarAluno,
    removerAluno
};
