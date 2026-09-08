const alunoService = require('../services/alunoService');

const criarAluno = async (req, res) => {
    try {
        const aluno = await alunoService.criarAluno(req.body);

        return res.status(201).json({
            mensagem: 'Aluno cadastrado com sucesso.',
            aluno
        });

    } catch (error) {
        return res.status(400).json({
            erro: error.message
        });
    }
};


const listarAlunos = (req, res) => {
    try {
        const alunos = alunoService.listarAlunos();

        return res.status(200).json(alunos);

    } catch (error) {
        return res.status(400).json({
            erro: error.message
        });
    }
};


const buscarAlunoPorId = (req, res) => {
    try {
        const aluno = alunoService.buscarAlunoPorId(req.params.id);

        return res.status(200).json(aluno);

    } catch (error) {
        return res.status(404).json({
            erro: error.message
        });
    }
};


const atualizarAluno = async (req, res) => {
    try {
        const aluno = await alunoService.atualizarAluno(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            mensagem: 'Aluno atualizado com sucesso.',
            aluno
        });

    } catch (error) {
        return res.status(400).json({
            erro: error.message
        });
    }
};


const removerAluno = (req, res) => {
    try {
        const aluno = alunoService.removerAluno(req.params.id);

        return res.status(200).json({
            mensagem: 'Aluno inativado com sucesso.',
            aluno
        });

    } catch (error) {
        return res.status(404).json({
            erro: error.message
        });
    }
};


module.exports = {
    criarAluno,
    listarAlunos,
    buscarAlunoPorId: buscarAlunoPorId,
    atualizarAluno,
    removerAluno
};