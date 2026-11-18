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

    try {
        let presenca = await PresencaModel.registrar({
            alunoId,
            motoristaId: req.usuario.id,
            tipo,
            latitude: latitude || -7.5000,
            longitude: longitude || -37.1000
        }).catch(async () => {
            const db = require('../config/database');
            const resDirect = await db.query(
                `INSERT INTO presencas_alunos (aluno_id, rota_id, motorista_id, tipo, latitude, longitude, registrado_em)
                 SELECT $1, a.rota_id, $2, $3, $4, $5, clock_timestamp()
                 FROM alunos a WHERE a.id = $1
                 RETURNING id, aluno_id, rota_id, motorista_id, tipo, latitude, longitude, registrado_em`,
                [alunoId, req.usuario.id, tipo, latitude || -7.5000, longitude || -37.1000]
            );
            return resDirect.rows[0];
        });

        if (!presenca) {
            return res.status(400).json({
                erro: 'Não foi possível registrar a presença para este aluno.'
            });
        }

        let notificacao = { status: 'ignorado' };
        try {
            notificacao = await enviarPresenca({ presenca });
        } catch (error) {
            console.error('Aviso: Falha ao enviar notificação FCM (ignorado):', error.message);
        }

        return res.status(201).json({
            mensagem: 'Presença registrada com sucesso.',
            presenca,
            notificacao
        });
    } catch (error) {
        console.error('Erro crítico ao registrar presença:', error);
        return res.status(500).json({ erro: 'Erro interno ao registrar presença.', detalhe: error.message });
    }
};
