const express = require('express');
const motoristaController = require('../controllers/motoristaController');

const router = express.Router();

router.post('/', motoristaController.criar);
router.get('/', motoristaController.listar);
router.put('/:id', motoristaController.atualizar);
router.delete('/:id', motoristaController.deletar);

module.exports = router;