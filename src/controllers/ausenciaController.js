const ausenciaService = require('../services/ausenciaService');

const criarAusencia = async (req, res) => {
    try {
        const { aluno_id, data_ausencia } = req.body;
        
        // Padronizado de acordo com os outros métodos (ajuste conforme o seu middleware)
        const responsavel_id = req.usuario?.id || req.userId; 

        // CORRIGIDO: Chamando corretamente o service ao invés da função local
        const novaAusencia = await ausenciaService.criarAusencia({
            aluno_id,
            data_ausencia,
            responsavel_id
        });

        return res.status(201).json({
            message: "Ausência registrada com sucesso!",
            dados: novaAusencia
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            erro: error.message
        });
    }
};

const listarAusenciasPorData = async (req, res) => {
    try {
        const { data } = req.query;

        if (!data) {
            return res.status(400).json({
                erro: 'Informe a data para consultar as ausências.'
            });
        }

        const ausencias = await ausenciaService.listarAusenciasPorData(data);

        return res.status(200).json(ausencias);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            erro: error.message || 'Erro ao consultar ausências.'
        });
    }
};

const listarAusenciasPorAluno = async (req, res) => {
    try {
        const responsavel_id = req.usuario?.id || req.userId;

        if (!responsavel_id) {
            return res.status(401).json({
                erro: 'Usuário não autenticado.'
            });
        }

        const ausencias = await ausenciaService.listarAusenciasPorAluno(
            req.params.alunoId,
            responsavel_id
        );

        return res.status(200).json(ausencias);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            erro: error.message || 'Erro ao consultar histórico.'
        });
    }
};

const cancelarAusencia = async (req, res) => {
    try {
        const responsavel_id = req.usuario?.id || req.userId;

        if (!responsavel_id) {
            return res.status(401).json({
                erro: 'Usuário não autenticado.'
            });
        }

        const ausencia = await ausenciaService.cancelarAusencia(
            req.params.id,
            responsavel_id
        );

        return res.status(200).json({
            mensagem: 'Ausência cancelada com sucesso.',
            ausencia
        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            erro: error.message || 'Erro ao cancelar ausência.'
        });
    }
};

module.exports = {
    criarAusencia,
    listarAusenciasPorData,
    listarAusenciasPorAluno,
    cancelarAusencia
};
