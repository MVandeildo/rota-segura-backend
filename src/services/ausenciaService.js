
const AusenciaModel = require('../models/AusenciaModel');
const AlunoModel = require('../models/AlunoModel');

const criarErro = (mensagem, statusCode = 400) => {
    const error = new Error(mensagem);
    error.statusCode = statusCode;
    return error;
};

// Valida e normaliza uma data no formato AAAA-MM-DD.
const normalizarDataAusencia = (data) => {
    if (typeof data !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        throw criarErro(
            'Data de ausência inválida. Use o formato AAAA-MM-DD.'
        );
    }

    const dataValidada = new Date(`${data}T00:00:00.000Z`);

    if (
        Number.isNaN(dataValidada.getTime()) ||
        dataValidada.toISOString().slice(0, 10) !== data
    ) {
        throw criarErro(
            'Data de ausência inválida. Use o formato AAAA-MM-DD.'
        );
    }

    const hoje = new Date();
    const hojeFormatado = [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1).padStart(2, '0'),
        String(hoje.getDate()).padStart(2, '0')
    ].join('-');

    if (data < hojeFormatado) {
        throw criarErro(
            'Não é permitido registrar ausência para uma data passada.'
        );
    }

    return data;
};

// Converte e valida um ID numérico positivo.
const normalizarId = (id, campo = 'ID do aluno') => {
    const idNumerico = Number(id);

    if (
        id === undefined ||
        id === null ||
        id === '' ||
        !Number.isSafeInteger(idNumerico) ||
        idNumerico <= 0
    ) {
        throw criarErro(`${campo} inválido.`);
    }

    return idNumerico;
};

// Registra uma ausência para um aluno.
const registrarAusencia = async ({
    aluno_id,
    data_ausencia,
    responsavel_id
}) => {
    const alunoId = normalizarId(aluno_id);
    const responsavelId = normalizarId(
        responsavel_id,
        'ID do responsável'
    );

    const dataNormalizada = normalizarDataAusencia(data_ausencia);

    const aluno = await AlunoModel.findById(alunoId);

    if (!aluno || aluno.ativo !== true) {
        throw criarErro('Aluno não encontrado ou inativo.', 404);
    }

    if (
        aluno.responsavel_id === null ||
        aluno.responsavel_id === undefined ||
        Number(aluno.responsavel_id) !== responsavelId
    ) {
        throw criarErro(
            'Você não tem permissão para registrar ausência para este aluno.',
            403
        );
    }

    const ausenciaExistente = await AusenciaModel.exists(
        alunoId,
        dataNormalizada
    );

    if (ausenciaExistente) {
        throw criarErro(
            'Já existe uma ausência registrada para este aluno nessa data.',
            409
        );
    }

    return AusenciaModel.create({
        aluno_id: alunoId,
        data_ausencia: dataNormalizada
    });
};

// Lista as ausências de uma data.
const listarAusenciasPorData = async (data) => {
    const dataNormalizada = normalizarDataAusencia(data);

    return AusenciaModel.findByDate(dataNormalizada);
};

// Lista o histórico de ausências de um aluno,
// garantindo que o responsável tenha acesso a ele.
const listarAusenciasPorAluno = async (aluno_id, responsavel_id) => {
    const alunoId = normalizarId(aluno_id);
    const responsavelId = normalizarId(
        responsavel_id,
        'ID do responsável'
    );

    const aluno = await AlunoModel.findById(alunoId);

    if (!aluno || aluno.ativo !== true) {
        throw criarErro('Aluno não encontrado ou inativo.', 404);
    }

    if (Number(aluno.responsavel_id) !== responsavelId) {
        throw criarErro(
            'Você não tem permissão para consultar as ausências deste aluno.',
            403
        );
    }

    return AusenciaModel.findByAlunoId(alunoId);
};

// Cancela uma ausência, verificando o vínculo com o responsável.
const cancelarAusencia = async (id, responsavel_id) => {
    const ausenciaId = normalizarId(id, 'ID da ausência');
    const responsavelId = normalizarId(
        responsavel_id,
        'ID do responsável'
    );

    const ausencia = await AusenciaModel.findById(ausenciaId);

    if (!ausencia) {
        throw criarErro('Ausência não encontrada.', 404);
    }

    const aluno = await AlunoModel.findById(ausencia.aluno_id);

    if (
        !aluno ||
        Number(aluno.responsavel_id) !== responsavelId
    ) {
        throw criarErro(
            'Você não tem permissão para cancelar esta ausência.',
            403
        );
    }

    return AusenciaModel.delete(ausenciaId);
};

module.exports = {
    registrarAusencia,
    listarAusenciasPorData,
    listarAusenciasPorAluno,
    cancelarAusencia
};
