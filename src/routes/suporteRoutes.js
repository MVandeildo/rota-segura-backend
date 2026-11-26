const express = require('express');
const router = express.Router();
const suporteController = require('../controllers/suporteController');

router.post('/chamados', suporteController.criarChamado);
router.get('/chamados', suporteController.listarChamados);
router.patch('/chamados/:id/status', suporteController.atualizarStatusChamado);

module.exports = router;