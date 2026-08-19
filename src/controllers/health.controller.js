const healthService = require('../services/health.service');

function getHealth(req, res) {
  return res.status(200).json(healthService.getStatus());
}

module.exports = { getHealth };
