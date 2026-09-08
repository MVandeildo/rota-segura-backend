const db = require('../config/database');

// Criar Rota
exports.criar = async (req, res) => {
  const { nome, turno, veiculo_id, motorista_id } = req.body;

  if (!nome || !turno || !veiculo_id || !motorista_id) {
    return res.status(400).json({ erro: 'Nome, turno, veiculo_id e motorista_id são obrigatórios.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO rotas (nome, turno, veiculo_id, motorista_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, turno, veiculo_id, motorista_id]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao criar rota.', detalhe: error.message });
  }
};

// Listar todas as Rotas
exports.listar = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, v.placa, u.nome AS motorista_nome 
      FROM rotas r
      LEFT JOIN veiculos v ON r.veiculo_id = v.id
      LEFT JOIN usuarios u ON r.motorista_id = u.id
      ORDER BY r.id ASC
    `);
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao listar rotas.' });
  }
};

// Buscar Rota por ID
exports.buscarPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM rotas WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Rota não encontrada.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar rota.' });
  }
};

// Atualizar Rota
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, turno, veiculo_id, motorista_id } = req.body;

  if (!nome || !turno || !veiculo_id || !motorista_id) {
    return res.status(400).json({ erro: 'Nome, turno, veiculo_id e motorista_id são obrigatórios.' });
  }

  try {
    const result = await db.query(
      'UPDATE rotas SET nome = $1, turno = $2, veiculo_id = $3, motorista_id = $4 WHERE id = $5 RETURNING *',
      [nome, turno, veiculo_id, motorista_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Rota não encontrada.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao atualizar rota.' });
  }
};

// Deletar Rota
exports.deletar = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM rotas WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Rota não encontrada.' });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao remover rota.' });
  }
};