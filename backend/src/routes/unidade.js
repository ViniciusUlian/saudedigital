const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar unidades (por padrão apenas ATIVO; use ?todos=true para incluir INATIVO)
router.get('/', async (req, res) => {
  try {
    const filtro = req.query.todos === 'true' ? '' : "WHERE status = 'ATIVO'";
    const [rows] = await db.query(
      `SELECT id_unidade, nome_unidade, tipo_unidade, cep, logradouro, numero_endereco, status
       FROM unidade ${filtro}
       ORDER BY tipo_unidade DESC, nome_unidade ASC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar unidades', detalhes: error.message });
  }
});

// Cadastrar nova unidade (Matriz ou Filial)
router.post('/', async (req, res) => {
  const { nome_unidade, tipo_unidade, cep, logradouro, numero_endereco } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO unidade (nome_unidade, tipo_unidade, cep, logradouro, numero_endereco, status)
       VALUES (?, ?, ?, ?, ?, 'ATIVO')`,
      [nome_unidade, tipo_unidade, cep, logradouro, numero_endereco]
    );
    res.status(201).json({ id_unidade: result.insertId, mensagem: 'Unidade cadastrada com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cadastrar unidade', detalhes: error.message });
  }
});

// Exclusão Lógica (Soft Delete)
router.delete('/:id', async (req, res) => {
  try {
    const [agendadas] = await db.query(
      "SELECT COUNT(*) AS total FROM consulta WHERE id_unidade = ? AND status_consulta = 'Agendada'",
      [req.params.id]
    );

    if (agendadas[0].total > 0) {
      return res.status(409).json({
        erro: 'Inativação bloqueada',
        detalhes: 'Esta unidade possui consultas agendadas em aberto. Cancele ou conclua antes de inativá-la.'
      });
    }

    await db.query("UPDATE unidade SET status = 'INATIVO' WHERE id_unidade = ?", [req.params.id]);
    res.json({ mensagem: 'Unidade marcada como INATIVA (histórico preservado).' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao inativar unidade', detalhes: error.message });
  }
});

// Reativar unidade
router.patch('/:id/reativar', async (req, res) => {
  try {
    await db.query("UPDATE unidade SET status = 'ATIVO' WHERE id_unidade = ?", [req.params.id]);
    res.json({ mensagem: 'Unidade reativada com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao reativar unidade', detalhes: error.message });
  }
});

module.exports = router;