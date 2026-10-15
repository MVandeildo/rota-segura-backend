const db = require("../config/database");
const VeiculoModel = require("../models/VeiculoModel");
const { calcularETA } = require("../services/etaService");

// Criar Veículo
exports.criar = async (req, res) => {
    const { placa, modelo, capacidade } = req.body;

    if (!placa || !modelo || !Number.isInteger(capacidade) || capacidade <= 0) {
        return res.status(400).json({ erro: "Placa, modelo e capacidade são obrigatórios" });
    }

    try {
        const result = await db.query(
            "INSERT INTO veiculos (placa, modelo, capacidade, status) VALUES ($1, $2, $3, $4) RETURNING *",
            [placa, modelo, capacidade, "ATIVO"]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao cadastrar veículo:", error);
        return res.status(500).json({
        erro: "Erro ao cadastrar veículo.",
        detalhe: error.message
    });
    }
};

// Listar todos os Veículos
exports.listar = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM veiculos ORDER BY id ASC");
        return res.status(200).json(result.rows);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao buscar veículos." });
    }
};

// Buscar Veículo por ID
exports.buscarPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM veiculos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Veículo não encontrado.' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        return res.status(500).json({ erro: 'Erro ao buscar veículo.' });
    }
};

// Obter Posição Atual e ETA para o Responsável (Passo 5 - Fallback)
exports.obterPosicaoAtual = async (req, res) => {
    const { id } = req.params;
    const { destino_lat, destino_lng } = req.query;

    try {
        const veiculo = await VeiculoModel.findById(id);

        if (!veiculo) {
            return res.status(404).json({ erro: 'Veículo não encontrado.' });
        }

        if (!veiculo.latitude || !veiculo.longitude) {
            return res.status(404).json({ erro: 'Nenhuma localização registrada para este veículo.' });
        }

        let etaInfo = { duracaoMinutos: null, distanciaKm: null, etaTexto: "Indisponível" };
        if (destino_lat && destino_lng) {
            etaInfo = await calcularETA(veiculo.latitude, veiculo.longitude, destino_lat, destino_lng);
        }

        return res.status(200).json({
            veiculo_id: veiculo.id,
            latitude: Number(veiculo.latitude),
            longitude: Number(veiculo.longitude),
            velocidade: veiculo.velocidade || null,
            heading: veiculo.heading || null,
            eta: etaInfo.etaTexto,
            duracaoMinutos: etaInfo.duracaoMinutos,
            distanciaKm: etaInfo.distanciaKm,
            timestamp: veiculo.ultima_atualizacao
        });
    } catch (error) {
        console.error("Erro ao obter posição atual do veículo:", error);
        return res.status(500).json({ erro: 'Erro interno ao buscar posição atual.' });
    }
};

// Atualizar Veículo
exports.atualizar = async (req, res) => {
    const { id } = req.params;
    const { placa, modelo, capacidade, status } = req.body;

    if (!placa || !modelo || !Number.isInteger(capacidade) || capacidade <= 0 || !['ATIVO', 'INATIVO'].includes(status)) {
        return res.status(400).json({ erro: 'Placa, modelo, capacidade e status válidos são obrigatórios.' });
    }

    try {
        const result = await db.query(
            'UPDATE veiculos SET placa = $1, modelo = $2, capacidade = $3, status = $4 WHERE id = $5 RETURNING *',
            [placa, modelo, capacidade, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Veículo não encontrado.' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        return res.status(500).json({ erro: 'Erro ao atualizar veículo.' });
    }
};

// Remover/Inativar Veículo
exports.deletar = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            "UPDATE veiculos SET status = 'INATIVO' WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Veículo não encontrado.' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        return res.status(500).json({ erro: 'Erro ao remover veículo.' });
    }
};

// Atualizar Localização via GPS (Passo 4)
exports.atualizarLocalizacao = async (req, res) => {
    const { id } = req.params;
    const { latitude, longitude, velocidade, heading, rota_id, destino_lat, destino_lng } = req.body;

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
        const veiculoAtualizado = await VeiculoModel.updateLocalizacao(id, {
            latitude,
            longitude,
            velocidade,
            heading
        });

        if (!veiculoAtualizado) {
            return res.status(404).json({ erro: "Veículo não encontrado." });
        }

        let etaInfo = { duracaoMinutos: null, distanciaKm: null, etaTexto: "Indisponível" };
        if (destino_lat && destino_lng) {
            etaInfo = await calcularETA(latitude, longitude, destino_lat, destino_lng);
        }

        const payloadGPS = {
            veiculo_id: Number(id),
            latitude: Number(latitude),
            longitude: Number(longitude),
            velocidade: velocidade || null,
            heading: heading || null,
            eta: etaInfo.etaTexto,
            duracaoMinutos: etaInfo.duracaoMinutos,
            distanciaKm: etaInfo.distanciaKm,
            timestamp: veiculoAtualizado.ultima_atualizacao
        };

        const io = req.app.get("io");
        if (io && rota_id) {
            io.to(`rota_${rota_id}`).emit("posicao_atualizada", payloadGPS);
        }

        return res.status(200).json({
            mensagem: "Localização atualizada e transmitida com sucesso.",
            dados: payloadGPS
        });

    } catch (error) {
        console.error("Erro ao atualizar localização do veículo:", error);
        return res.status(500).json({ erro: "Erro interno ao atualizar localização." });
    }
};
