function notFoundHandler(req, res) {
  return res.status(404).json({
    error: 'Rota nao encontrada'
  });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    error: statusCode === 500 ? 'Erro interno do servidor' : error.message
  });
}

module.exports = { notFoundHandler, errorHandler };
