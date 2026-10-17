const PresencaModel = require('../models/PresencaModel');
const { enviarPresenca } = require('../services/notificacaoService');

const coordenadaValida = (valor, minimo, maximo) =>
    typeof valor === 'number' &&
    Number.isFinite(valor) &&
    valor >= minimo &&
    valor <= maximo;

exports.registrar = async (req, res) => {
    const { aluno_id, tipo, latitude, longitude } = req.body || {};
    const alunoId = Number(aluno_id);

    if (!Number.isInteger(alunoId) || alunoId <= 0) {
        return res.status(400).json({ erro: 'Informe um aluno_id válido.' });
    }

    if (!['EMBARQUE', 'DESEMBARQUE'].includes(tipo)) {
        return res.status(400).json({
            erro: 'Tipo de presença inválido. Use EMBARQUE ou DESEMBARQUE.'
        });
    }

    const coordenadasInformadas = latitude !== undefined || longitude !== undefined;
    if (
        coordenadasInformadas &&
        (!coordenadaValida(latitude, -90, 90) || !coordenadaValida(longitude, -180, 180))
    ) {
        return res.status(400).json({
            erro: 'Informe latitude e longitude válidas juntas.'
        });
    }

    try {
        const presenca = await PresencaModel.registrar({
            alunoId,
            motoristaId: req.usuario.id,
            tipo,
            latitude: coordenadasInformadas ? latitude : null,
            longitude: coordenadasInformadas ? longitude : null
        });

        if (!presenca) {
            return res.status(403).json({
                erro: 'Aluno não encontrado ou não vinculado a uma rota deste motorista.'
            });
        }

        let notificacao;
        try {
            notificacao = await enviarPresenca({ presenca });
        } catch (error) {
            console.error('Falha ao enviar notificação de presença via FCM:', error);
            notificacao = { status: 'falha' };
        }

        return res.status(201).json({
            mensagem: 'Presença registrada com sucesso.',
            presenca: {
                id: presenca.id,
                aluno_id: presenca.aluno_id,
                rota_id: presenca.rota_id,
                tipo: presenca.tipo,
                latitude: presenca.latitude,
                longitude: presenca.longitude,
                registrado_em: presenca.registrado_em
            },
            notificacao
        });
    } catch (error) {
        console.error('Erro ao registrar presença:', error);
        return res.status(500).json({ erro: 'Erro ao registrar presença.' });
    }
};
