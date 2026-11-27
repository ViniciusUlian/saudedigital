const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar especialidades (ativas por padrão)
router.get('/especialidades', async (req, res) => {
  try {
    const filtro = req.query.todos === 'true' ? '' : "WHERE status = 'ATIVO'";
    const [rows] = await db.query(
      `SELECT id_especialidade, nome_especialidade, status FROM especialidade ${filtro} ORDER BY nome_especialidade`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar especialidades', detalhes: error.message });
  }
});

// Listar apenas as especialidades ativas vinculadas a um médico específico
router.get('/:id/especialidades', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id_especialidade, e.nome_especialidade
      FROM especialidade e
      INNER JOIN medico_especialidade me ON e.id_especialidade = me.id_especialidade
      WHERE me.id_medico = ? AND e.status = 'ATIVO'
      ORDER BY e.nome_especialidade
    `, [req.params.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar especialidades do médico', detalhes: error.message });
  }
});

router.post('/especialidades', async (req, res) => {
  const { nome_especialidade } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO especialidade (nome_especialidade, status) VALUES (?, 'ATIVO')",
      [nome_especialidade.trim()]
    );
    res.status(201).json({ id_especialidade: result.insertId, mensagem: 'Especialidade criada!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Duplicidade', detalhes: 'Esta especialidade já está cadastrada.' });
    }
    res.status(500).json({ erro: 'Erro ao criar especialidade', detalhes: error.message });
  }
});

// Soft Delete de Especialidade
router.delete('/especialidades/:id', async (req, res) => {
  try {
    const [vinculos] = await db.query(`
      SELECT COUNT(*) AS total
      FROM medico_especialidade me
      INNER JOIN medico m ON me.id_medico = m.id_medico
      WHERE me.id_especialidade = ? AND m.status = 'ATIVO'
    `, [req.params.id]);

    if (vinculos[0].total > 0) {
      return res.status(409).json({
        erro: 'Inativação bloqueada',
        detalhes: 'Esta especialidade não pode ser inativada pois há médico(s) ativo(s) associado(s) a ela.'
      });
    }

    await db.query("UPDATE especialidade SET status = 'INATIVO' WHERE id_especialidade = ?", [req.params.id]);
    res.json({ mensagem: 'Especialidade marcada como INATIVA.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao inativar especialidade', detalhes: error.message });
  }
});

// Listar médicos (ativos por padrão)
router.get('/', async (req, res) => {
  try {
    const filtro = req.query.todos === 'true' ? '' : "WHERE m.status = 'ATIVO'";
    const [rows] = await db.query(`
      SELECT 
        m.id_medico, m.crm, m.nome_completo, m.telefone, m.email, m.status,
        GROUP_CONCAT(e.nome_especialidade SEPARATOR ', ') AS especialidades
      FROM medico m
      LEFT JOIN medico_especialidade me ON m.id_medico = me.id_medico
      LEFT JOIN especialidade e ON me.id_especialidade = e.id_especialidade AND e.status = 'ATIVO'
      ${filtro}
      GROUP BY m.id_medico, m.crm, m.nome_completo, m.telefone, m.email, m.status
      ORDER BY m.nome_completo
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar médicos', detalhes: error.message });
  }
});

router.post('/', async (req, res) => {
  const { crm, nome_completo, telefone, email, especialidades } = req.body;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO medico (crm, nome_completo, telefone, email, status) VALUES (?, ?, ?, ?, 'ATIVO')",
      [crm, nome_completo, telefone, email]
    );
    const idMedico = result.insertId;

    if (Array.isArray(especialidades) && especialidades.length > 0) {
      const valoresVinculo = especialidades.map(idEsp => [idMedico, idEsp]);
      await conn.query('INSERT INTO medico_especialidade (id_medico, id_especialidade) VALUES ?', [valoresVinculo]);
    }

    await conn.commit();
    res.status(201).json({ id_medico: idMedico, mensagem: 'Médico cadastrado com sucesso!' });
  } catch (error) {
    await conn.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'CRM duplicado', detalhes: 'Já existe um médico cadastrado com este CRM.' });
    }
    res.status(500).json({ erro: 'Erro ao cadastrar médico', detalhes: error.message });
  } finally {
    conn.release();
  }
});

// Soft Delete de Médico
router.delete('/:id', async (req, res) => {
  try {
    const [consultas] = await db.query(
      "SELECT COUNT(*) AS total FROM consulta WHERE id_medico = ? AND status_consulta = 'Agendada'",
      [req.params.id]
    );

    if (consultas[0].total > 0) {
      return res.status(409).json({
        erro: 'Inativação bloqueada',
        detalhes: 'Este médico possui paciente(s) com consulta(s) agendada(s) com ele.'
      });
    }

    await db.query("UPDATE medico SET status = 'INATIVO' WHERE id_medico = ?", [req.params.id]);
    res.json({ mensagem: 'Médico marcado como INATIVO (histórico clínico preservado).' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao inativar médico', detalhes: error.message });
  }
});

router.patch('/:id/reativar', async (req, res) => {
  try {
    await db.query("UPDATE medico SET status = 'ATIVO' WHERE id_medico = ?", [req.params.id]);
    res.json({ mensagem: 'Médico reativado com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao reativar médico', detalhes: error.message });
  }
});

module.exports = router;

module.exports = router;