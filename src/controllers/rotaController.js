const db = require("../config/database");
const RotaModel = require("../models/RotaModel");
const { calcularETA } = require("../services/etaService");

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;
const horaValida = (valor) => typeof valor === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);

const validarParadas = (paradas) => Array.isArray(paradas) && paradas.length > 0 &&
    paradas.every((parada) =>
        parada &&
        typeof parada.endereco === 'string' &&
        parada.endereco.trim() &&
        horaValida(parada.horario_embarque) &&
        horaValida(parada.horario_desembarque)
    );

// Criar Rota
exports.criar = async (req, res) => {
    const { nome, turno = 'MANHA', veiculo_id, motorista_id, destino_lat, destino_lng, paradas = [] } = req.body;

    if (typeof nome !== 'string' || !nome.trim() || !idValido(veiculo_id)) {
        return res.status(400).json({ erro: "Nome e veiculo_id válido são obrigatórios." });
    }
    if (typeof turno !== 'string' || !turno.trim()) {
        return res.status(400).json({ erro: 'Turno da rota inválido.' });
    }
    if (motorista_id != null && !idValido(motorista_id)) {
        return res.status(400).json({ erro: "motorista_id inválido." });
    }
    if (!Array.isArray(paradas) || (paradas.length > 0 && !validarParadas(paradas))) {
        return res.status(400).json({ erro: "Informe endereços e horários válidos para as paradas." });
    }
    if ((destino_lat == null) !== (destino_lng == null) ||
        (destino_lat != null && (!Number.isFinite(Number(destino_lat)) || !Number.isFinite(Number(destino_lng))))) {
        return res.status(400).json({ erro: "As coordenadas de destino devem ser informadas juntas e ser válidas." });
    }

    try {
        const novaRota = await RotaModel.create({
            nome: nome.trim(),
            turno: turno.trim().toUpperCase(),
            veiculo_id: Number(veiculo_id),
            motorista_id: motorista_id == null ? null : Number(motorista_id),
            destino_lat,
            destino_lng,
            paradas
        });
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
    const { nome, turno, veiculo_id, motorista_id, destino_lat, destino_lng, ativa, paradas } = req.body;

    if (!idValido(id)) {
        return res.status(400).json({ erro: 'ID de rota inválido.' });
    }
    if (nome !== undefined && (typeof nome !== 'string' || !nome.trim())) {
        return res.status(400).json({ erro: 'Nome da rota inválido.' });
    }
    if (turno !== undefined && (typeof turno !== 'string' || !turno.trim())) {
        return res.status(400).json({ erro: 'Turno da rota inválido.' });
    }
    if (veiculo_id !== undefined && !idValido(veiculo_id)) {
        return res.status(400).json({ erro: 'veiculo_id inválido.' });
    }
    if (motorista_id != null && motorista_id !== undefined && !idValido(motorista_id)) {
        return res.status(400).json({ erro: 'motorista_id inválido.' });
    }
    if (ativa !== undefined && typeof ativa !== 'boolean') {
        return res.status(400).json({ erro: 'O status da rota deve ser booleano.' });
    }
    if (paradas !== undefined && !validarParadas(paradas)) {
        return res.status(400).json({ erro: 'Informe endereços e horários válidos para as paradas.' });
    }
    if ((destino_lat == null) !== (destino_lng == null) ||
        (destino_lat != null && (!Number.isFinite(Number(destino_lat)) || !Number.isFinite(Number(destino_lng))))) {
        return res.status(400).json({ erro: "As coordenadas de destino devem ser informadas juntas e ser válidas." });
    }

    try {
        const rota = await RotaModel.update(Number(id), {
            nome: nome === undefined ? undefined : nome.trim(),
            turno: turno === undefined ? undefined : turno.trim().toUpperCase(),
            veiculo_id: veiculo_id === undefined ? undefined : Number(veiculo_id),
            motorista_id: motorista_id === undefined ? undefined : motorista_id == null ? null : Number(motorista_id),
            destino_lat,
            destino_lng,
            ativa,
            paradas
        });
        if (!rota) {
            return res.status(404).json({ erro: 'Rota não encontrada.' });
        }
        return res.status(200).json(rota);
    } catch (error) {
        console.error("Erro ao atualizar rota:", error);
        return res.status(500).json({ erro: 'Erro ao atualizar rota.' });
    }
};

exports.atualizarStatus = async (req, res) => {
    const { id } = req.params;
    const { ativa } = req.body;

    if (!idValido(id) || typeof ativa !== 'boolean') {
        return res.status(400).json({ erro: 'Informe um ID de rota e status válidos.' });
    }

    try {
        const rota = await RotaModel.updateStatus(Number(id), ativa);
        if (!rota) {
            return res.status(404).json({ erro: 'Rota não encontrada.' });
        }
        return res.status(200).json(rota);
    } catch (error) {
        console.error('Erro ao atualizar status da rota:', error);
        return res.status(500).json({ erro: 'Erro ao atualizar status da rota.' });
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
