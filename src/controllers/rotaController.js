const db = require("../config/database");
const RotaModel = require("../models/RotaModel");
const { calcularETA } = require("../services/etaService");

// Criar Rota
exports.criar = async (req, res) => {
    const { nome, veiculo_id, destino_lat, destino_lng } = req.body;

    if (!nome || !veiculo_id || destino_lat == null || destino_lng == null) {
        return res.status(400).json({ erro: "Nome, veiculo_id, destino_lat e destino_lng são obrigatórios." });
    }

    try {
        const novaRota = await RotaModel.create({ nome, veiculo_id, destino_lat, destino_lng });
        return res.status(201).json(novaRota);
    } catch (error) {
        console.error("Erro ao criar rota:", error);
        return res.status(500).json({ erro: "Erro ao criar rota.", detalhe: error.message });
    }
};

// Listar todas as Rotas
exports.listar = async (req, res) => {
    try {
        const rotas = await RotaModel.findAll();
        return res.status(200).json(rotas);
    } catch (error) {
        console.error("Erro ao listar rotas:", error);
        return res.status(500).json({ erro: "Erro ao buscar rotas." });
    }
};

// Buscar Rota por ID
exports.buscarPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const rota = await RotaModel.findById(id);
        if (!rota) {
            return res.status(404).json({ erro: 'Rota não encontrada.' });
        }
        return res.status(200).json(rota);
    } catch (error) {
        console.error("Erro ao buscar rota:", error);
        return res.status(500).json({ erro: 'Erro ao buscar rota.' });
    }
};

// Atualizar Rota
exports.atualizar = async (req, res) => {
    const { id } = req.params;
    const { nome, veiculo_id, destino_lat, destino_lng } = req.body;

    try {
        const result = await db.query(
            `UPDATE rotas SET nome = $1, veiculo_id = $2, destino_lat = $3, destino_lng = $4 
             WHERE id = $5 RETURNING *`,
            [nome, veiculo_id, destino_lat, destino_lng, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Rota não encontrada.' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao atualizar rota:", error);
        return res.status(500).json({ erro: 'Erro ao atualizar rota.' });
    }
};

// Deletar Rota
exports.deletar = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM rotas WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Rota não encontrada.' });
        }
        return res.status(200).json({ mensagem: 'Rota removida com sucesso.', id: result.rows[0].id });
    } catch (error) {
        console.error("Erro ao deletar rota:", error);
        return res.status(500).json({ erro: 'Erro ao remover rota.' });
    }
};

// Obter Posição Atual e ETA para a Rota
exports.obterPosicaoAtual = async (req, res) => {
    const { id } = req.params;

    try {
        const rota = await RotaModel.findById(id);

        if (!rota) {
            return res.status(404).json({ erro: 'Rota não encontrada.' });
        }

        if (!rota.latitude || !rota.longitude) {
            return res.status(404).json({ erro: 'Nenhuma localização registrada para esta rota.' });
        }

        let etaInfo = { duracaoMinutos: null, distanciaKm: null, etaTexto: "Indisponível" };
        if (rota.destino_lat && rota.destino_lng) {
            etaInfo = await calcularETA(rota.latitude, rota.longitude, rota.destino_lat, rota.destino_lng);
        }

        return res.status(200).json({
            rota_id: rota.id,
            veiculo_id: rota.veiculo_id,
            latitude: Number(rota.latitude),
            longitude: Number(rota.longitude),
            velocidade: rota.velocidade || null,
            heading: rota.heading || null,
            eta: etaInfo.etaTexto,
            duracaoMinutos: etaInfo.duracaoMinutos,
            distanciaKm: etaInfo.distanciaKm,
            timestamp: rota.ultima_atualizacao
        });
    } catch (error) {
        console.error("Erro ao obter posição atual da rota:", error);
        return res.status(500).json({ erro: 'Erro interno ao buscar posição atual.' });
    }
};

// Atualizar Localização via GPS (Associada à Rota)
exports.atualizarLocalizacao = async (req, res) => {
    const { id } = req.params;
    const { latitude, longitude, velocidade, heading } = req.body;

    if (
        latitude == null || longitude == null ||
        !Number.isFinite(Number(latitude)) ||
        !Number.isFinite(Number(longitude)) ||
        Number(latitude) < -90 || Number(latitude) > 90 ||
        Number(longitude) < -180 || Number(longitude) > 180
    ) {
        return res.status(400).json({
            erro: "Latitude e longitude inválidas."
        });
    }

    try {
        const rotaAtualizada = await RotaModel.updateLocalizacao(id, {
            latitude,
            longitude,
            velocidade,
            heading
        });

        if (!rotaAtualizada) {
            return res.status(404).json({ erro: "Rota não encontrada." });
        }

        let etaInfo = { duracaoMinutos: null, distanciaKm: null, etaTexto: "Indisponível" };
        if (rotaAtualizada.destino_lat && rotaAtualizada.destino_lng) {
            etaInfo = await calcularETA(latitude, longitude, rotaAtualizada.destino_lat, rotaAtualizada.destino_lng);
        }

        const payloadGPS = {
            rota_id: Number(id),
            veiculo_id: rotaAtualizada.veiculo_id,
            latitude: Number(latitude),
            longitude: Number(longitude),
            velocidade: velocidade || null,
            heading: heading || null,
            eta: etaInfo.etaTexto,
            duracaoMinutos: etaInfo.duracaoMinutos,
            distanciaKm: etaInfo.distanciaKm,
            timestamp: rotaAtualizada.ultima_atualizacao
        };

        const io = req.app.get("io");
        if (io) {
            io.to(`rota_${id}`).emit("posicao_atualizada", payloadGPS);
        }

        return res.status(200).json({
            mensagem: "Localização atualizada e transmitida com sucesso.",
            dados: payloadGPS
        });

    } catch (error) {
        console.error("Erro ao atualizar localização da rota:", error);
        return res.status(500).json({ erro: "Erro interno ao atualizar localização." });
    }
};
