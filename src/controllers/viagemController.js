const ViagemModel = require('../models/viagemModel');


exports.iniciarViagem = async (req, res) => {
    const { rota_id, veiculo_id } = req.body;
    const motorista_id = req.usuario?.id;

    if (
        !Number.isInteger(Number(rota_id)) ||
        Number(rota_id) <= 0 ||
        !Number.isInteger(Number(veiculo_id)) ||
        Number(veiculo_id) <= 0
    ) {
        return res.status(400).json({
            erro: 'Informe IDs válidos para a rota e o veículo.'
        });
    }

    if (!motorista_id) {
        return res.status(401).json({
            erro: 'Motorista não identificado na sessão.'
        });
    }

    try {
        const viagem = await ViagemModel.criarViagem({
            rota_id: Number(rota_id),
            veiculo_id: Number(veiculo_id),
            motorista_id: Number(motorista_id)
        });

        if (!viagem) {
            return res.status(500).json({
                erro: 'Não foi possível registrar a viagem.'
            });
        }

        const io = req.app.get('io');

        if (io) {
            io.to(`rota_${rota_id}`).emit(
                'viagem_iniciada',
                viagem
            );
        }

        return res.status(201).json({
            mensagem: 'Viagem iniciada com sucesso.',
            viagem
        });

    } catch (error) {
        console.error('Erro ao iniciar viagem:', error);

        return res.status(500).json({
            erro: 'Erro interno ao iniciar viagem.',
            detalhe: error.message
        });
    }
};


exports.finalizarViagem = async (req, res) => {
    const { id } = req.params;
    try {
        const viagem = await ViagemModel.finalizarViagem(Number(id));
        if (!viagem) {
            console.log();
            return res.status(404).json({ erro: `Viagem com ID ${id} não encontrada ou já finalizada.` });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`rota_${viagem.rota_id}`).emit('viagem_finalizada', viagem);
        }

        return res.status(200).json({
            mensagem: 'Viagem finalizada com sucesso.',
            viagem
        });
    } catch (error) {
        console.error('Erro ao finalizar viagem:', error);
        return res.status(500).json({ erro: 'Erro interno ao finalizar viagem.' });
    }
};

exports.finalizarViagemPorRota = async (req, res) => {
    const rotaId = Number(req.params.rotaId);

    if (!Number.isInteger(rotaId) || rotaId <= 0) {
        return res.status(400).json({
            erro: 'ID da rota inválido.'
        });
    }

    try {
        const viagens =
            await ViagemModel.buscarViagensEmAndamentoPorRota(rotaId);

        if (viagens.length === 0) {
            return res.status(404).json({
                erro: 'Não existe viagem em andamento para esta rota.'
            });
        }

        if (viagens.length > 1) {
            return res.status(409).json({
                erro: 'Existe mais de uma viagem em andamento para esta rota. Não foi possível identificar qual deve ser finalizada.'
            });
        }

        const viagem = await ViagemModel.finalizarViagem(viagens[0].id);

        if (!viagem) {
            return res.status(409).json({
                erro: 'A viagem já foi finalizada ou não está mais em andamento.'
            });
        }

        const io = req.app.get('io');

        if (io) {
            io.to(`rota_${viagem.rota_id}`).emit(
                'viagem_finalizada',
                viagem
            );
        }

        return res.status(200).json({
            mensagem: 'Viagem finalizada com sucesso.',
            viagem
        });

    } catch (error) {
        console.error('Erro ao finalizar viagem por rota:', error);

        return res.status(500).json({
            erro: 'Erro interno ao finalizar viagem.'
        });
    }
};

exports.atualizarLocalizacao = async (req, res) => {
    const { id } = req.params; // viagem_id
    const { latitude, longitude, velocidade, heading } = req.body;

    if (
        latitude == null || longitude == null ||
        !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
    ) {
        return res.status(400).json({ erro: 'Latitude e longitude inválidas.' });
    }

    try {
        const viagem = await ViagemModel.findById(Number(id));
        if (!viagem || viagem.status !== 'EM_ANDAMENTO') {
            return res.status(404).json({ erro: 'Viagem não encontrada ou não está em andamento.' });
        }

        const posicao = await ViagemModel.registrarPosicao(Number(id), { latitude, longitude, velocidade, heading });

        const payloadGPS = {
            viagem_id: Number(id),
            rota_id: viagem.rota_id,
            latitude: Number(latitude),
            longitude: Number(longitude),
            velocidade: velocidade ?? null,
            heading: heading ?? null,
            timestamp: posicao.criado_em
        };

        const io = req.app.get('io');
        if (io) {
            io.to(`rota_${viagem.rota_id}`).emit('posicao_atualizada', payloadGPS);
        }

        return res.status(200).json({
            mensagem: 'Posição registrada com sucesso.',
            dados: payloadGPS
        });
    } catch (error) {
        console.error('Erro ao atualizar posição da viagem:', error);
        return res.status(500).json({ erro: 'Erro interno ao atualizar posição.' });
    }
};

exports.registrarPresenca = async (req, res) => {
    const { id } = req.params; // viagem_id
    const { aluno_id, tipo, latitude, longitude } = req.body; 

    if (!aluno_id || !['EMBARQUE', 'DESEMBARQUE'].includes(tipo)) {
        return res.status(400).json({ erro: 'aluno_id e tipo (EMBARQUE ou DESEMBARQUE) são obrigatórios.' });
    }

    try {
        const presenca = await ViagemModel.registrarPresenca(Number(id), Number(aluno_id), tipo, { latitude, longitude });

        return res.status(201).json({
            mensagem: `Presença de ${tipo.toLowerCase()} registrada com sucesso.`,
            presenca
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                erro: `Este aluno já possui o registro de "${tipo}" nesta viagem.`
            });
        }
        console.error('Erro ao registrar presença:', error);
        return res.status(500).json({ erro: 'Erro interno ao registrar presença.' });
    }
};