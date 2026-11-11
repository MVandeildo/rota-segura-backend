const RelatorioModel = require('../models/RelatorioModel');

const dataValida = (valor) => {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return false;
    }

    const [ano, mes, dia] = valor.split('-').map(Number);
    const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
    const diasNoMes = [31, bissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    return ano > 0 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasNoMes[mes - 1];
};

const idValido = (valor) =>
    typeof valor === 'string' &&
    /^\d+$/.test(valor) &&
    Number.isSafeInteger(Number(valor)) &&
    Number(valor) > 0 &&
    Number(valor) <= 2147483647;

const escaparCsv = (valor) => {
    if (valor === null || valor === undefined) {
        return '';
    }

    let texto = valor instanceof Date ? valor.toISOString() : String(valor);
    if (typeof valor === 'string' && /^[\s]*[=+\-@]/.test(texto)) {
        texto = `'${texto}`;
    }

    return `"${texto.replace(/"/g, '""')}"`;
};

const gerarCsv = (registros) => {
    const cabecalho = [
        'ID da presença',
        'Data e hora',
        'Tipo',
        'ID do aluno',
        'Nome do aluno',
        'ID da rota',
        'Nome da rota',
        'ID do motorista',
        'Nome do motorista',
        'Latitude',
        'Longitude'
    ];

    const linhas = registros.map((registro) => [
        registro.presenca_id,
        registro.registrado_em,
        registro.tipo,
        registro.aluno_id,
        registro.aluno_nome,
        registro.rota_id,
        registro.rota_nome,
        registro.motorista_id,
        registro.motorista_nome,
        registro.latitude,
        registro.longitude
    ]);

    return `\uFEFF${[cabecalho, ...linhas]
        .map((linha) => linha.map(escaparCsv).join(';'))
        .join('\r\n')}`;
};

exports.auditoria = async (req, res) => {
    const { data_inicio, data_fim, rota_id, motorista_id, formato = 'json' } = req.query;

    if (data_inicio !== undefined && !dataValida(data_inicio)) {
        return res.status(400).json({
            erro: 'data_inicio deve estar no formato YYYY-MM-DD e ser uma data válida.'
        });
    }

    if (data_fim !== undefined && !dataValida(data_fim)) {
        return res.status(400).json({
            erro: 'data_fim deve estar no formato YYYY-MM-DD e ser uma data válida.'
        });
    }

    if (data_inicio && data_fim && data_inicio > data_fim) {
        return res.status(400).json({
            erro: 'data_inicio não pode ser posterior a data_fim.'
        });
    }

    if (rota_id !== undefined && !idValido(rota_id)) {
        return res.status(400).json({ erro: 'rota_id deve ser um inteiro positivo.' });
    }

    if (motorista_id !== undefined && !idValido(motorista_id)) {
        return res.status(400).json({ erro: 'motorista_id deve ser um inteiro positivo.' });
    }

    if (!['json', 'csv'].includes(formato)) {
        return res.status(400).json({ erro: 'formato deve ser json ou csv.' });
    }

    try {
        const filtros = {
            dataInicio: data_inicio,
            dataFim: data_fim,
            rotaId: rota_id ? Number(rota_id) : undefined,
            motoristaId: motorista_id ? Number(motorista_id) : undefined
        };
        const registros = await RelatorioModel.listarAuditoria(filtros);

        if (formato === 'csv') {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="relatorio-auditoria.csv"'
            );
            return res.status(200).send(gerarCsv(registros));
        }

        return res.status(200).json({
            filtros: {
                data_inicio: data_inicio || null,
                data_fim: data_fim || null,
                rota_id: rota_id ? Number(rota_id) : null,
                motorista_id: motorista_id ? Number(motorista_id) : null
            },
            total_registros: registros.length,
            registros
        });
    } catch (error) {
        console.error('Erro ao gerar relatório de auditoria:', error);
        return res.status(500).json({ erro: 'Erro ao gerar relatório de auditoria.' });
    }
};
