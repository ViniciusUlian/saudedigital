const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const filtro = req.query.todos === 'true' ? '' : "WHERE status = 'ATIVO'";
    const [rows] = await db.query(
      `SELECT id_paciente, cpf, nome_completo, data_nascimento, telefone, email, cep, logradouro, numero_endereco, status
       FROM paciente ${filtro}
       ORDER BY nome_completo`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar pacientes', detalhes: error.message });
  }
});

router.post('/', async (req, res) => {
  const { cpf, nome_completo, data_nascimento, telefone, email, cep, logradouro, numero_endereco } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO paciente (cpf, nome_completo, data_nascimento, telefone, email, cep, logradouro, numero_endereco, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ATIVO')`,
      [cpf, nome_completo, data_nascimento, telefone, email, cep, logradouro, numero_endereco]
    );
    res.status(201).json({ id_paciente: result.insertId, mensagem: 'Paciente cadastrado com sucesso!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'CPF duplicado', detalhes: 'Já existe um paciente cadastrado com este CPF.' });
    }
    res.status(500).json({ erro: 'Erro ao cadastrar paciente', detalhes: error.message });
  }
});

// Exclusão Lógica (Soft Delete)
router.delete('/:id', async (req, res) => {
  try {
    const [agendadas] = await db.query(
      "SELECT COUNT(*) AS total FROM consulta WHERE id_paciente = ? AND status_consulta = 'Agendada'",
      [req.params.id]
    );

    if (agendadas[0].total > 0) {
      return res.status(409).json({
        erro: 'Inativação bloqueada',
        detalhes: 'Este paciente possui consultas agendadas em aberto. Exclua ou cancele as consultas antes.'
      });
    }

    await db.query("UPDATE paciente SET status = 'INATIVO' WHERE id_paciente = ?", [req.params.id]);
    res.json({ mensagem: 'Paciente marcado como INATIVO (prontuários preservados).' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao inativar paciente', detalhes: error.message });
  }
});

router.patch('/:id/reativar', async (req, res) => {
  try {
    await db.query("UPDATE paciente SET status = 'ATIVO' WHERE id_paciente = ?", [req.params.id]);
    res.json({ mensagem: 'Paciente reativado com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao reativar paciente', detalhes: error.message });
  }
});

module.exports = router;