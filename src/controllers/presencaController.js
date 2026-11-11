const PresencaModel = require('../models/PresencaModel');
const { enviarPresenca } = require('../services/notificacaoService');

const coordenadaValida = (valor, minimo, maximo) =>
    typeof valor === 'number' &&
    Number.isFinite(valor) &&
    valor >= minimo &&
    valor <= maximo;

const dataValida = (valor) => {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return false;
    }

    const data = new Date(`${valor}T00:00:00.000Z`);
    return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
};

exports.listarRotaDoDia = async (req, res) => {
    const data = req.query.data;
    if (data !== undefined && !dataValida(data)) {
        return res.status(400).json({
            erro: 'Informe uma data válida no formato AAAA-MM-DD.'
        });
    }

    try {
        const alunos = await PresencaModel.listarAlunosDaRotaDoDia({
            motoristaId: req.usuario.id,
            data: data || null
        });

        return res.status(200).json({
            alunos
        });
    } catch (error) {
        console.error('Erro ao listar alunos da rota do dia:', error);
        return res.status(500).json({ erro: 'Erro ao listar alunos da rota do dia.' });
    }
};

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

    if (!coordenadaValida(latitude, -90, 90) || !coordenadaValida(longitude, -180, 180)) {
        return res.status(400).json({
            erro: 'Informe latitude e longitude válidas para confirmar a presença.'
        });
    }

    try {
        const presenca = await PresencaModel.registrar({
            alunoId,
            motoristaId: req.usuario.id,
            tipo,
            latitude,
            longitude
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
                status: presenca.tipo === 'EMBARQUE' ? 'EMBARCADO' : 'DESEMBARCADO',
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
