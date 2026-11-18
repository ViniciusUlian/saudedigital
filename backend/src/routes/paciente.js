const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar todos os pacientes
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id_paciente, cpf, nome_completo, data_nascimento, telefone, email, cep, logradouro, numero_endereco 
       FROM paciente 
       ORDER BY nome_completo`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar pacientes', detalhes: error.message });
  }
});

// Cadastrar novo paciente
router.post('/', async (req, res) => {
  const { cpf, nome_completo, data_nascimento, telefone, email, cep, logradouro, numero_endereco } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO paciente (cpf, nome_completo, data_nascimento, telefone, email, cep, logradouro, numero_endereco)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

// Excluir paciente (bloqueia se possuir consultas)
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM paciente WHERE id_paciente = ?', [req.params.id]);
    res.json({ mensagem: 'Paciente excluído com sucesso.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(409).json({
        erro: 'Exclusão bloqueada',
        detalhes: 'Este paciente não pode ser excluído enquanto suas consultas não forem excluídas antes.'
      });
    }
    res.status(500).json({ erro: 'Erro ao excluir paciente', detalhes: error.message });
  }
});

module.exports = router;