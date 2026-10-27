const express = require('express');
const router = express.Router();
const rotaController = require('../controllers/rotaController');

router.post('/', rotaController.criar);
router.get('/', rotaController.listar);
router.get('/:id', rotaController.buscarPorId);
router.put('/:id', rotaController.atualizar);
router.delete('/:id', rotaController.deletar);
router.get('/:id/posicao-atual', rotaController.obterPosicaoAtual);
router.patch('/:id/localizacao', rotaController.atualizarLocalizacao);
router.patch('/:id/iniciar', rotaController.iniciar);
router.patch('/:id/finalizar', rotaController.finalizar);

module.exports = router;
