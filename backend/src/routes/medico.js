const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar especialidades disponíveis (para preencher checkboxes no front-end)
router.get('/especialidades', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id_especialidade, nome_especialidade FROM especialidade ORDER BY nome_especialidade');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar especialidades', detalhes: error.message });
  }
});

// Listar médicos com suas especialidades (N:M)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.id_medico,
        m.crm,
        m.nome_completo,
        m.telefone,
        m.email,
        GROUP_CONCAT(e.nome_especialidade SEPARATOR ', ') AS especialidades
      FROM medico m
      LEFT JOIN medico_especialidade me ON m.id_medico = me.id_medico
      LEFT JOIN especialidade e ON me.id_especialidade = e.id_especialidade
      GROUP BY m.id_medico, m.crm, m.nome_completo, m.telefone, m.email
      ORDER BY m.nome_completo
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar médicos', detalhes: error.message });
  }
});

// Cadastrar médico e vincular especialidades na tabela associativa
router.post('/', async (req, res) => {
  const { crm, nome_completo, telefone, email, especialidades } = req.body; // especialidades = array de IDs [1, 2]
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO medico (crm, nome_completo, telefone, email) VALUES (?, ?, ?, ?)',
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

// Criar nova especialidade
router.post('/especialidades', async (req, res) => {
  const { nome_especialidade } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO especialidade (nome_especialidade) VALUES (?)',
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

// Apagar especialidade (bloqueia se houver médico associado)
router.delete('/especialidades/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM especialidade WHERE id_especialidade = ?', [req.params.id]);
    res.json({ mensagem: 'Especialidade excluída com sucesso.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(409).json({
        erro: 'Exclusão bloqueada',
        detalhes: 'Esta especialidade não pode ser apagada pois há médico(s) associado(s) a ela.'
      });
    }
    res.status(500).json({ erro: 'Erro ao excluir especialidade', detalhes: error.message });
  }
});

// Excluir médico (bloqueia se existir consulta marcada/registrada com ele)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();

  try {
    const [consultas] = await conn.query(
      'SELECT COUNT(*) AS total FROM consulta WHERE id_medico = ?',
      [id]
    );

    if (consultas[0].total > 0) {
      return res.status(409).json({
        erro: 'Exclusão bloqueada',
        detalhes: 'Este médico não pode ser excluído pois existe(m) paciente(s) com consulta(s) vinculada(s) a ele.'
      });
    }

    await conn.beginTransaction();
    await conn.query('DELETE FROM medico_especialidade WHERE id_medico = ?', [id]);
    await conn.query('DELETE FROM medico WHERE id_medico = ?', [id]);
    await conn.commit();

    res.json({ mensagem: 'Médico excluído com sucesso.' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ erro: 'Erro ao excluir médico', detalhes: error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;