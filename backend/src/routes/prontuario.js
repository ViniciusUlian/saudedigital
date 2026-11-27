const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Listar todos os prontuários através da visão VW_PRONTUARIO_COMPLETO (3FN)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vw_prontuario_completo ORDER BY id_prontuario DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar prontuários', detalhes: error.message });
  }
});

// Buscar prontuário de uma consulta específica
router.get('/:id_consulta', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM vw_prontuario_completo WHERE id_consulta = ?',
      [req.params.id_consulta]
    );
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'Prontuário não encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar prontuário', detalhes: error.message });
  }
});

// Emitir prontuário (1:1 com consulta) e atualizar status para Realizada
router.post('/', async (req, res) => {
  const { id_consulta, sintomas_relatados, diagnostico, prescricao_medica, observacoes_adicionais } = req.body;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO prontuario (id_consulta, sintomas_relatados, diagnostico, prescricao_medica, observacoes_adicionais)
       VALUES (?, ?, ?, ?, ?)`,
      [id_consulta, sintomas_relatados, diagnostico, prescricao_medica, observacoes_adicionais || null]
    );

    await conn.query("UPDATE consulta SET status_consulta = 'Realizada' WHERE id_consulta = ?", [id_consulta]);

    await conn.commit();
    res.status(201).json({ id_prontuario: result.insertId, mensagem: 'Atendimento finalizado e prontuário salvo!' });
  } catch (error) {
    await conn.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Prontuário já existe', detalhes: 'Esta consulta já possui um prontuário registrado.' });
    }
    res.status(500).json({ erro: 'Erro ao salvar prontuário', detalhes: error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;