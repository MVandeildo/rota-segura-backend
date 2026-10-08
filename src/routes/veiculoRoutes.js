const express = require('express');
const router = express.Router();
const veiculoController = require('../controllers/veiculoController');

router.post('/', veiculoController.criar);
router.get('/', veiculoController.listar);
router.get('/:id', veiculoController.buscarPorId);
router.get('/:id/posicao-atual', veiculoController.obterPosicaoAtual);
router.put('/:id', veiculoController.atualizar);
router.delete('/:id', veiculoController.deletar);
router.patch('/:id/localizacao', veiculoController.atualizarLocalizacao);

module.exports = router;
