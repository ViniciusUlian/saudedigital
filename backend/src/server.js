const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Confira se os nomes abaixo batem com os arquivos dentro de backend/src/routes/
const pacientesRoutes = require('./routes/paciente');
const medicosRoutes = require('./routes/medico');
const consultasRoutes = require('./routes/consulta');
const prontuariosRoutes = require('./routes/prontuario');

const app = express();
app.use(cors());
app.use(express.json());

// Entrega os arquivos do front-end (index.html, app.js) na URL principal
app.use(express.static(path.join(__dirname, '../../frontend')));

// Rotas da API
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/prontuarios', prontuariosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));