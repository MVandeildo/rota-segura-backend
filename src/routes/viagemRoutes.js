
const express = require('express');
const router = express.Router();

const viagemController = require('../controllers/viagemController');
const { authMiddleware } = require('../utils/protected');

router.use(authMiddleware);

router.post('/', viagemController.iniciarViagem);

router.post('/:id/finalizar', viagemController.finalizarViagem);

router.post('/:id/posicao', viagemController.atualizarLocalizacao);

router.post('/:id/presenca', viagemController.registrarPresenca);

router.post(
    '/rota/:rotaId/finalizar',
    viagemController.finalizarViagemPorRota
);

module.exports = router;
