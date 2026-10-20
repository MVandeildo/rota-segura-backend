const express = require('express');

const gestorController = require('../controllers/gestorController');

const router = express.Router();

router.post('/', gestorController.criar);
router.get('/', gestorController.listar);
router.get('/:id', gestorController.buscarPorId);
router.put('/:id', gestorController.atualizar);
router.delete('/:id', gestorController.deletar);

module.exports = router;