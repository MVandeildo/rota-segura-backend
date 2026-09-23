const express = require('express');
const frotaController = require('../controllers/frotaController');

const router = express.Router();

router.get('/resumo', frotaController.resumo);
router.get('/veiculos', frotaController.listarVeiculos);
router.get('/veiculo/:veiculoId', frotaController.rotasPorVeiculo);

module.exports = router;
