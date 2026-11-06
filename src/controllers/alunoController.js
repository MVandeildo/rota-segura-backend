const alunoService = require('../services/alunoService');
const UsuarioModel = require('../models/UsuarioModel');

const criarAluno = async (req, res) => {
    try {
        const userRole = req.usuario?.perfil 
            || req.usuario?.role 
            || req.headers['x-user-role'] 
            || req.body.userRole;

        if (userRole !== 'administrador' && userRole !== 'admin') {
            return res.status(403).json({ 
                erro: 'Acesso negado. Apenas administradores podem cadastrar novos estudantes.' 
            });
        }

        const { email_responsavel } = req.body;
        
        let responsavelId = req.body.responsavel_id || null;

        if (email_responsavel && email_responsavel.trim() !== '' && !responsavelId) {
            const usuarioResponsavel = await UsuarioModel.findByEmail(email_responsavel);
            
            if (!usuarioResponsavel) {
                return res.status(400).json({ 
                    erro: 'Não existe nenhum usuário cadastrado com este e-mail de responsável.' 
                });
            }
            responsavelId = usuarioResponsavel.id;
        }

        const dadosAluno = {
            ...req.body,
            responsavel_id: responsavelId ? Number(responsavelId) : null,
            usuario_id: req.usuario?.id ? Number(req.usuario.id) : null
        };

        const aluno = await alunoService.criarAluno(dadosAluno);

        return res.status(201).json({
            mensagem: 'Aluno cadastrado com sucesso.',
            aluno
        });

    } catch (error) {
        console.error('Erro ao criar aluno:', error);
        return res.status(400).json({
            erro: error.message
        });
    }
};

const listarAlunos = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id;

        const alunos = usuarioId 
            ? await alunoService.listarAlunosPorResponsavel(usuarioId)
            : await alunoService.listarAlunos();

        return res.status(200).json({
            type: "success",
            alunos
        });

    } catch (error) {
        return res.status(400).json({
            erro: error.message
        });
    }
};

const buscarAlunoPorId = async (req, res) => {
    try {
        const aluno = await alunoService.buscarAlunoPorId(req.params.id);

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

const removerAluno = async (req, res) => {
    try {
        const aluno = await alunoService.removerAluno(req.params.id);

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
    buscarAlunoPorId,
    atualizarAluno,
    removerAluno
};
