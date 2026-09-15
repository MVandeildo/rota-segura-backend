const db = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// POST /api/gestores - Cadastrar um novo gestor
exports.criar = async (req, res) => {
  const { nome, email, senha, telefone } = req.body;

  // Validação dos dados obrigatórios
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
  }

  try {
    // Verifica se o e-mail já está cadastrado
    const emailExistente = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (emailExistente.rows.length > 0) {
      return res.status(400).json({ erro: 'O e-mail informado já está em uso.' });
    }

    // Criptografa a senha antes de salvar
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    // Insere o gestor garantindo o perfil 'GESTOR'
    const result = await db.query(
      `INSERT INTO usuarios (nome, email, senha, perfil, telefone) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, nome, email, perfil, telefone, created_at`,
      [nome, email, senhaHash, 'GESTOR', telefone || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao cadastrar gestor.', detalhe: error.message });
  }
};

// GET /api/gestores - Listar todos os gestores
exports.listar = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nome, email, perfil, telefone, created_at 
       FROM usuarios 
       WHERE perfil = 'GESTOR' 
       ORDER BY id ASC`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao listar gestores.', detalhe: error.message });
  }
};

// GET /api/gestores/:id - Buscar gestor por ID
exports.buscarPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT id, nome, email, perfil, telefone, created_at 
       FROM usuarios 
       WHERE id = $1 AND perfil = 'GESTOR'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Gestor não encontrado.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar gestor.', detalhe: error.message });
  }
};

// PUT /api/gestores/:id - Atualizar dados do gestor
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, telefone } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios para atualização.' });
  }

  try {
    // Verifica se o gestor existe
    const gestorExistente = await db.query('SELECT * FROM usuarios WHERE id = $1 AND perfil = \'GESTOR\'', [id]);
    if (gestorExistente.rows.length === 0) {
      return res.status(404).json({ erro: 'Gestor não encontrado.' });
    }

    // Verifica se o e-mail informado pertence a outro usuário
    const emailConflito = await db.query('SELECT id FROM usuarios WHERE email = $1 AND id <> $2', [email, id]);
    if (emailConflito.rows.length > 0) {
      return res.status(400).json({ erro: 'O e-mail informado já pertence a outro usuário.' });
    }

    let result;

    // Atualização com alteração de senha
    if (senha) {
      const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
      result = await db.query(
        `UPDATE usuarios 
         SET nome = $1, email = $2, senha = $3, telefone = $4 
         WHERE id = $5 AND perfil = 'GESTOR' 
         RETURNING id, nome, email, perfil, telefone, created_at`,
        [nome, email, senhaHash, telefone || null, id]
      );
    } else {
      // Atualização mantendo a senha atual
      result = await db.query(
        `UPDATE usuarios 
         SET nome = $1, email = $2, telefone = $3 
         WHERE id = $4 AND perfil = 'GESTOR' 
         RETURNING id, nome, email, perfil, telefone, created_at`,
        [nome, email, telefone || null, id]
      );
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao atualizar gestor.', detalhe: error.message });
  }
};

// DELETE /api/gestores/:id - Remover gestor
exports.deletar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM usuarios 
       WHERE id = $1 AND perfil = 'GESTOR' 
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Gestor não encontrado.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao remover gestor.', detalhe: error.message });
  }
};