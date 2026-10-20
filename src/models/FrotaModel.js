const db = require('../config/database');

class FrotaModel {
  static async resumo() {
    const [veiculos, rotas, motoristas] = await Promise.all([
      db.query('SELECT * FROM veiculos ORDER BY id ASC'),
      db.query(`
        SELECT r.*, v.placa, v.modelo, u.nome AS motorista_nome
        FROM rotas r
        LEFT JOIN veiculos v ON r.veiculo_id = v.id
        LEFT JOIN usuarios u ON r.motorista_id = u.id
        ORDER BY r.id ASC
      `),
      db.query("SELECT id, nome, email, perfil, telefone FROM usuarios WHERE perfil = 'MOTORISTA' ORDER BY id ASC")
    ]);

    const veiculosAtivos = veiculos.rows.filter((veiculo) => veiculo.status === 'ATIVO').length;

    return {
      total_veiculos: veiculos.rows.length,
      veiculos_ativos: veiculosAtivos,
      total_rotas: rotas.rows.length,
      total_motoristas: motoristas.rows.length,
      veiculos: veiculos.rows,
      rotas: rotas.rows,
      motoristas: motoristas.rows
    };
  }

  static async listarVeiculos() {
    const result = await db.query('SELECT * FROM veiculos ORDER BY id ASC');
    return result.rows;
  }

  static async listarRotasPorVeiculo(veiculoId) {
    const result = await db.query(
      `
        SELECT r.*, u.nome AS motorista_nome
        FROM rotas r
        LEFT JOIN usuarios u ON r.motorista_id = u.id
        WHERE r.veiculo_id = $1
        ORDER BY r.id ASC
      `,
      [veiculoId]
    );

    return result.rows;
  }
}

module.exports = FrotaModel;
