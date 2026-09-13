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