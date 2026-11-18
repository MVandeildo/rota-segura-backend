const alunoService = require('../services/alunoService');
const UsuarioModel = require('../models/UsuarioModel');

const criarAluno = async (req, res) => {
    try {
        const userRole = req.usuario?.perfil 
            || req.usuario?.role 
            || req.headers['x-user-role'] 
            || req.body.userRole;

        const normalizedRole = userRole ? String(userRole).toUpperCase() : '';
        const isAdminOrGestor = ['ADMIN', 'GESTOR', 'ADMINISTRADOR'].includes(normalizedRole);

        if (!isAdminOrGestor) {
            return res.status(403).json({ 
                erro: 'Acesso negado. Apenas administradores e gestores podem cadastrar novos estudantes.' 
            });
        }

        // Extraímos explicitamente a matrícula e o e-mail do responsável
        const { matricula, email_responsavel, responsavel_id, ...restoBody } = req.body;

        // Validação e limpeza do e-mail do responsável
        let emailResponsavelValidado = null;
        if (email_responsavel && email_responsavel.trim() !== '') {
            const usuarioResponsavel = await UsuarioModel.findByEmail(email_responsavel);
            
            if (!usuarioResponsavel) {
                return res.status(400).json({ 
                    erro: 'Não existe nenhum usuário cadastrado com este e-mail de responsável.' 
                });
            }
            emailResponsavelValidado = usuarioResponsavel.email;
        }

        // Montamos o objeto garantindo que a matrícula seja enviada de forma limpa
        const dadosAluno = {
            ...restoBody,
            matricula: matricula ? String(matricula).trim() : null,
            email_responsavel: emailResponsavelValidado,
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
        const userPerfil = req.usuario?.perfil ? String(req.usuario.perfil).toUpperCase() : '';

        const alunos = (userPerfil === 'RESPONSAVEL' && usuarioId)
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
        // Garante que se a matrícula for enviada na atualização, ela também seja tratada
        const dadosAtualizacao = { ...req.body };
        if (dadosAtualizacao.matricula) {
            dadosAtualizacao.matricula = String(dadosAtualizacao.matricula).trim();
        }

        const aluno = await alunoService.atualizarAluno(
            req.params.id,
            dadosAtualizacao
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
