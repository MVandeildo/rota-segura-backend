function getStatus() {
  return {
    status: 'ok',
    service: 'rotasegura-backend',
    timestamp: new Date().toISOString()
  };
}

module.exports = { getStatus };
