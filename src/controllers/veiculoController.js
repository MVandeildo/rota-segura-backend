const db = require("../config/database");

// Criar Veiculo
exports.criar = async (req, res) =>{
    const {placa, modelo, capacidade} = req.body;

  if(!placa || !modelo || !Number.isInteger(capacidade) || capacidade <= 0){
        return res.status(400).json({ erro: "Placa, modelo e capacidade são obrigatorios"});
    }

    try{
        const result = await db.query(
            "INSERT INTO veiculos (placa, modelo, capacidade, status) VALUES ($1, $2, $3, $4) RETURNING *",
            [placa, modelo, capacidade, "ATIVO"]
        );
        return res.status(201).json(result.rows[0]);
    }catch (error){
        return res.status(500).json({ erro: "Erro ao cadastrar veiculo."});
    }
};

// Listar todos os Veiculos
exports.listar = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM veiculos ORDER BY id ASC");
        return res.status(200).json(result.rows)
    } catch (error) {
      return res.status(500).json({erro: "Erro ao buscar veiculo."});
    }
};

// BUscar Veiculo por ID
exports.buscarPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM veiculos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar veículo.' });
  }
};

// Atualizar Veículo
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { placa, modelo, capacidade, status } = req.body;

  if (!placa || !modelo || !Number.isInteger(capacidade) || capacidade <= 0 || !['ATIVO', 'INATIVO'].includes(status)) {
    return res.status(400).json({ erro: 'Placa, modelo, capacidade e status válidos são obrigatórios.' });
  }

  try {
    const result = await db.query(
      'UPDATE veiculos SET placa = $1, modelo = $2, capacidade = $3, status = $4 WHERE id = $5 RETURNING *',
      [placa, modelo, capacidade, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao atualizar veículo.' });
  }
};

// Remover/Inativar Veículo
exports.deletar = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "UPDATE veiculos SET status = 'INATIVO' WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao remover veículo.' });
  }
};