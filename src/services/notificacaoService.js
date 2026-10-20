const { getApps, initializeApp, applicationDefault } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const DispositivoFcmModel = require('../models/DispositivoFcmModel');

const TAMANHO_LOTE_FCM = 500;

const obterMessaging = () => {
    const app = getApps()[0] || initializeApp({
        credential: applicationDefault()
    });

    return getMessaging(app);
};

const enviarPresenca = async ({ presenca }) => {
    if (!presenca.responsavel_id) {
        return { status: 'sem_responsavel' };
    }

    const tokens = await DispositivoFcmModel.listarTokensPorUsuario(presenca.responsavel_id);
    if (tokens.length === 0) {
        return { status: 'sem_dispositivo' };
    }

    const tipoEmbarque = presenca.tipo === 'EMBARQUE';
    const mensagem = {
        notification: {
            title: tipoEmbarque ? 'Embarque confirmado' : 'Desembarque confirmado',
            body: tipoEmbarque
                ? `${presenca.aluno_nome} embarcou no veículo escolar.`
                : `${presenca.aluno_nome} desembarcou do veículo escolar.`
        },
        data: {
            tipo: presenca.tipo,
            presenca_id: String(presenca.id),
            aluno_id: String(presenca.aluno_id),
            rota_id: String(presenca.rota_id)
        }
    };

    const messaging = obterMessaging();
    let enviados = 0;
    let falhas = 0;
    const tokensInvalidos = [];

    for (let inicio = 0; inicio < tokens.length; inicio += TAMANHO_LOTE_FCM) {
        const lote = tokens.slice(inicio, inicio + TAMANHO_LOTE_FCM);
        const resposta = await messaging.sendEachForMulticast({
            ...mensagem,
            tokens: lote
        });

        enviados += resposta.successCount;
        falhas += resposta.failureCount;
        resposta.responses.forEach((item, indice) => {
            if (
                !item.success &&
                ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered']
                    .includes(item.error?.code)
            ) {
                tokensInvalidos.push(lote[indice]);
            }
        });
    }

    await DispositivoFcmModel.removerTokens(tokensInvalidos);

    return {
        status: falhas === 0 ? 'enviada' : enviados > 0 ? 'parcial' : 'falha',
        enviados,
        falhas
    };
};

module.exports = { enviarPresenca };
