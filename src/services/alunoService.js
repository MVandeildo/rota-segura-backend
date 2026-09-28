const AlunoModel = require('../models/AlunoModel');

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

const normalizarResponsavelId = (responsavelId, dataNascimento) => {
    const menorDeIdade = alunoMenorDeIdade(dataNascimento);

    if (responsavelId === undefined || responsavelId === null || responsavelId === '') {
        if (menorDeIdade) {
            throw criarErro('Aluno menor de 18 anos deve ter um responsável vinculado.');
        }
        return null;
    }

    const responsavelIdNumerico = Number(responsavelId);
    if (!Number.isInteger(responsavelIdNumerico) || responsavelIdNumerico <= 0) {
        throw criarErro('ID do responsável inválido.');
    }

    return responsavelIdNumerico;
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
        responsavel_id,
        rota_id
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
        rota_id === undefined || rota_id === null || rota_id === ''
    ) {
        throw new Error(
            'Nome, data de nascimento, série, endereço, número, bairro, cidade, estado e rota são obrigatórios.'
        );
    }

    const dataNascimentoNormalizada = normalizarDataNascimento(data_nascimento);
    const responsavelIdNormalizado = normalizarResponsavelId(
        responsavel_id,
        dataNascimentoNormalizada
    );

    return AlunoModel.create({
        nome,
        data_nascimento: dataNascimentoNormalizada,
        serie,
        endereco_embarque,
        numero,
        bairro,
        cidade,
        estado,
        cep: cep || null,
        responsavel_id: responsavelIdNormalizado,
        rota_id: Number(rota_id)
    });
};


const listarAlunos = async () => {
    return AlunoModel.findAll();
};


const buscarAlunoPorId = async (id) => {
    const aluno = await AlunoModel.findById(id);

    if (!aluno) {
        throw new Error('Aluno não encontrado.');
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

    if (Object.prototype.hasOwnProperty.call(dadosAtualizados, 'responsavel_id')) {
        dadosAtualizados.responsavel_id = normalizarResponsavelId(
            dadosAtualizados.responsavel_id,
            dataNascimento
        );
    } else if (alunoMenorDeIdade(dataNascimento) && !alunoExistente.responsavel_id) {
        throw criarErro('Aluno menor de 18 anos deve ter um responsável vinculado.');
    }

    if (dadosAtualizados.rota_id) {
        dadosAtualizados.rota_id = Number(dadosAtualizados.rota_id);
    }

    const aluno = await AlunoModel.update(id, dadosAtualizados);

    if (!aluno) {
        throw new Error('Aluno não encontrado.');
    }

    return aluno;
};


const removerAluno = async (id) => {
    const aluno = await AlunoModel.deactivate(id);

    if (!aluno) {
        throw new Error('Aluno não encontrado.');
    }

    return aluno;
};


module.exports = {
    criarAluno,
    listarAlunos,
    buscarAlunoPorId,
    atualizarAluno,
    removerAluno
};