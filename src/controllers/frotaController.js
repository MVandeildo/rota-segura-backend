const FrotaModel = require('../models/FrotaModel');

exports.resumo = async (req, res) => {
  try {
    const resumo = await FrotaModel.resumo();
    return res.status(200).json(resumo);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar resumo da frota.' });
  }
};

exports.listarVeiculos = async (req, res) => {
  try {
    const veiculos = await FrotaModel.listarVeiculos();
    return res.status(200).json(veiculos);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao listar veículos da frota.' });
  }
};

exports.rotasPorVeiculo = async (req, res) => {
  const { veiculoId } = req.params;

  try {
    const rotas = await FrotaModel.listarRotasPorVeiculo(veiculoId);

    if (rotas.length === 0) {
      return res.status(404).json({ erro: 'Nenhuma rota encontrada para este veículo.' });
    }

    return res.status(200).json(rotas);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar rotas do veículo.' });
  }
};
