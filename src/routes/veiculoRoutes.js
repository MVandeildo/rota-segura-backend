const express = require('express');
const router = express.Router();
const veiculoController = require('../controllers/veiculoController');

router.post('/', veiculoController.criar);
router.get('/', veiculoController.listar);
router.get('/:id', veiculoController.buscarPorId);
router.put('/:id', veiculoController.atualizar);
router.delete('/:id', veiculoController.deletar);

module.exports = router;