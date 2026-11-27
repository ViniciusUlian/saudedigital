const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.id_consulta,
        c.data_hora_agendamento,
        c.status_consulta,
        p.nome_completo AS nome_paciente,
        p.cpf AS cpf_paciente,
        m.nome_completo AS nome_medico,
        m.crm,
        e.nome_especialidade,
        u.nome_unidade,
        u.tipo_unidade,
        pr.id_prontuario
      FROM consulta c
      INNER JOIN paciente p ON c.id_paciente = p.id_paciente
      INNER JOIN medico m ON c.id_medico = m.id_medico
      INNER JOIN especialidade e ON c.id_especialidade = e.id_especialidade
      INNER JOIN unidade u ON c.id_unidade = u.id_unidade
      LEFT JOIN prontuario pr ON c.id_consulta = pr.id_consulta
      ORDER BY c.data_hora_agendamento DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar consultas', detalhes: error.message });
  }
});

router.post('/', async (req, res) => {
  const { id_paciente, id_medico, id_especialidade, id_unidade, data_hora_agendamento } = req.body;
  const dataFormatada = data_hora_agendamento.replace('T', ' ') + ':00';

  try {
    const [result] = await db.query(
      `INSERT INTO consulta (id_paciente, id_medico, id_especialidade, id_unidade, data_hora_agendamento, status_consulta)
       VALUES (?, ?, ?, ?, ?, 'Agendada')`,
      [id_paciente, id_medico, id_especialidade, id_unidade, dataFormatada]
    );
    res.status(201).json({ id_consulta: result.insertId, mensagem: 'Consulta agendada com sucesso!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        erro: 'Conflito de agenda',
        detalhes: 'O médico ou o paciente já possui uma consulta marcada neste dia e horário.'
      });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
      return res.status(400).json({
        erro: 'Especialidade inválida para o médico',
        detalhes: 'O médico selecionado não possui habilitação nesta especialidade.'
      });
    }
    res.status(500).json({ erro: 'Erro ao agendar consulta', detalhes: error.message });
  }
});

router.patch('/:id/cancelar', async (req, res) => {
  try {
    await db.query("UPDATE consulta SET status_consulta = 'Cancelada' WHERE id_consulta = ?", [req.params.id]);
    res.json({ mensagem: 'Consulta cancelada.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cancelar consulta', detalhes: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM consulta WHERE id_consulta = ?', [req.params.id]);
    res.json({ mensagem: 'Consulta excluída com sucesso.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(409).json({
        erro: 'Exclusão bloqueada',
        detalhes: 'Esta consulta já possui prontuário emitido e não pode ser excluída.'
      });
    }
    res.status(500).json({ erro: 'Erro ao excluir consulta', detalhes: error.message });
  }
});

module.exports = router;