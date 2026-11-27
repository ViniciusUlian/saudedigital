const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pacientesRoutes = require('./routes/paciente');
const medicosRoutes = require('./routes/medico');
const consultasRoutes = require('./routes/consulta');
const prontuariosRoutes = require('./routes/prontuario');
const unidadesRoutes = require('./routes/unidade');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../../frontend')));

app.use('/api/pacientes', pacientesRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/prontuarios', prontuariosRoutes);
app.use('/api/unidades', unidadesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));