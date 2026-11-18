const API = '/api';
lucide.createIcons();

async function requisicaoAPI(endpoint, options = {}) {
  try {
    const resposta = await fetch(`${API}${endpoint}`, options);
    const tipoConteudo = resposta.headers.get('content-type') || '';
    const dados = tipoConteudo.includes('application/json')
      ? await resposta.json()
      : { detalhes: await resposta.text() };

    if (!resposta.ok) {
      throw new Error(dados.detalhes || dados.erro || `Erro HTTP ${resposta.status}`);
    }

    return dados;
  } catch (erro) {
    if (erro.message.includes('Failed to fetch')) {
      alert('Servidor Back-end desligado! Rode "node src/server.js" no terminal da pasta backend.');
    } else {
      alert('Atenção: ' + erro.message);
    }
    throw erro;
  }
}

function navegar(secao) {
  ['agenda', 'pacientes', 'medicos'].forEach(s => {
    document.getElementById(`sec-${s}`).classList.toggle('hidden', s !== secao);
    const btn = document.getElementById(`nav-${s}`);
    btn.className = s === secao
      ? 'nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-teal-50 text-teal-700'
      : 'nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50';
  });

  if (secao === 'agenda') carregarConsultas();
  if (secao === 'pacientes') carregarPacientes();
  if (secao === 'medicos') {
    carregarEspecialidadesTags();
    carregarMedicos();
  }
}

function abrirModal(id) { document.getElementById(id).classList.remove('hidden'); }
function fecharModal(id) { document.getElementById(id).classList.add('hidden'); }

// --- 1. AGENDA & PRONTUÁRIOS ---
async function carregarConsultas() {
  const consultas = await requisicaoAPI('/consultas');
  const tbody = document.getElementById('tabela-consultas');

  if (consultas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">Nenhuma consulta agendada ainda.</td></tr>`;
    return;
  }

  const badges = {
    Agendada: 'bg-amber-100 text-amber-800',
    Realizada: 'bg-emerald-100 text-emerald-800',
    Cancelada: 'bg-rose-100 text-rose-800'
  };

  tbody.innerHTML = consultas.map(c => {
    const dataFormatada = new Date(c.data_hora_agendamento).toLocaleString('pt-BR', {
      dateStyle: 'short', timeStyle: 'short'
    });

    let acoes = '';
    if (c.id_prontuario) {
      acoes = `<button onclick="verProntuario(${c.id_consulta})" class="text-teal-700 hover:underline font-medium">Ver Prontuário</button>`;
    } else if (c.status_consulta === 'Agendada') {
      acoes = `
        <button onclick="abrirProntuario(${c.id_consulta})" class="bg-teal-600 text-white px-2.5 py-1 rounded-md text-xs font-medium hover:bg-teal-700 mr-2">Atender</button>
        <button onclick="cancelarConsulta(${c.id_consulta})" class="text-amber-700 hover:underline text-xs mr-2">Cancelar</button>
        <button onclick="excluirConsulta(${c.id_consulta})" class="text-rose-600 hover:underline text-xs">Excluir</button>
      `;
    } else {
      acoes = `<button onclick="excluirConsulta(${c.id_consulta})" class="text-rose-600 hover:underline text-xs">Excluir</button>`;
    }

    return `
      <tr class="hover:bg-slate-50">
        <td class="py-3.5 px-5 font-medium text-slate-900">${dataFormatada}</td>
        <td class="py-3.5 px-5">${c.nome_paciente} <span class="block text-xs text-slate-400">CPF: ${c.cpf_paciente}</span></td>
        <td class="py-3.5 px-5">${c.nome_medico} <span class="block text-xs text-slate-400">CRM: ${c.crm}</span></td>
        <td class="py-3.5 px-5"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badges[c.status_consulta] || ''}">${c.status_consulta}</span></td>
        <td class="py-3.5 px-5 text-right">${acoes}</td>
      </tr>
    `;
  }).join('');
}

async function prepararModalConsulta() {
  const [pacientes, medicos] = await Promise.all([
    requisicaoAPI('/pacientes'),
    requisicaoAPI('/medicos')
  ]);

  if (pacientes.length === 0 || medicos.length === 0) {
    alert('Cadastre pelo menos 1 paciente e 1 médico antes de agendar uma consulta.');
    return;
  }

  document.getElementById('cons-paciente').innerHTML = pacientes
    .map(p => `<option value="${p.id_paciente}">${p.nome_completo} (${p.cpf})</option>`).join('');
  document.getElementById('cons-medico').innerHTML = medicos
    .map(m => `<option value="${m.id_medico}">${m.nome_completo} — ${m.especialidades || 'Clínico Geral'}</option>`).join('');

  abrirModal('modal-consulta');
}

document.getElementById('form-consulta').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    id_paciente: document.getElementById('cons-paciente').value,
    id_medico: document.getElementById('cons-medico').value,
    data_hora_agendamento: document.getElementById('cons-data').value
  };

  await requisicaoAPI('/consultas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  fecharModal('modal-consulta');
  e.target.reset();
  carregarConsultas();
});

async function cancelarConsulta(id) {
  if (!confirm('Deseja marcar esta consulta como cancelada?')) return;
  await requisicaoAPI(`/consultas/${id}/cancelar`, { method: 'PATCH' });
  carregarConsultas();
}

async function excluirConsulta(id) {
  if (!confirm('Deseja excluir permanentemente esta consulta?')) return;
  await requisicaoAPI(`/consultas/${id}`, { method: 'DELETE' });
  carregarConsultas();
}

function abrirProntuario(idConsulta) {
  document.getElementById('pront-id-consulta').value = idConsulta;
  abrirModal('modal-prontuario');
}

document.getElementById('form-prontuario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    id_consulta: document.getElementById('pront-id-consulta').value,
    sintomas_relatados: document.getElementById('pront-sintomas').value,
    diagnostico: document.getElementById('pront-diagnostico').value,
    prescricao_medica: document.getElementById('pront-prescricao').value,
    observacoes_adicionais: document.getElementById('pront-obs').value
  };

  await requisicaoAPI('/prontuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  fecharModal('modal-prontuario');
  e.target.reset();
  carregarConsultas();
});

async function verProntuario(idConsulta) {
  const p = await requisicaoAPI(`/prontuarios/${idConsulta}`);
  document.getElementById('conteudo-prontuario').innerHTML = `
    <div><strong class="text-slate-900">Sintomas Relatados:</strong><p class="bg-slate-50 p-2.5 rounded-lg mt-1">${p.sintomas_relatados}</p></div>
    <div><strong class="text-slate-900">Diagnóstico:</strong><p class="bg-slate-50 p-2.5 rounded-lg mt-1">${p.diagnostico}</p></div>
    <div><strong class="text-slate-900">Prescrição Médica:</strong><p class="bg-slate-50 p-2.5 rounded-lg mt-1">${p.prescricao_medica}</p></div>
    ${p.observacoes_adicionais ? `<div><strong class="text-slate-900">Observações:</strong><p class="bg-slate-50 p-2.5 rounded-lg mt-1">${p.observacoes_adicionais}</p></div>` : ''}
  `;
  abrirModal('modal-ver-prontuario');
}

// --- 2. PACIENTES ---
async function buscarCep(cep) {
  const limpo = cep.replace(/\D/g, '');
  if (limpo.length !== 8) return;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
    const dados = await res.json();
    if (!dados.erro) {
      document.getElementById('pac-logradouro').value = dados.logradouro;
      document.getElementById('pac-numero').focus();
    }
  } catch (e) {}
}

async function carregarPacientes() {
  const pacientes = await requisicaoAPI('/pacientes');
  const tbody = document.getElementById('tabela-pacientes');

  if (pacientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400">Nenhum paciente cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = pacientes.map(p => `
    <tr class="hover:bg-slate-50">
      <td class="py-3.5 px-5 font-medium text-slate-900">${p.nome_completo}</td>
      <td class="py-3.5 px-5 font-mono text-xs">${p.cpf}</td>
      <td class="py-3.5 px-5">${new Date(p.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
      <td class="py-3.5 px-5">${p.telefone}</td>
      <td class="py-3.5 px-5 text-slate-500">${p.logradouro}, ${p.numero_endereco} — CEP ${p.cep}</td>
      <td class="py-3.5 px-5 text-right">
        <button onclick="excluirPaciente(${p.id_paciente}, '${p.nome_completo}')" class="text-rose-600 hover:underline text-xs font-medium">
          Excluir
        </button>
      </td>
    </tr>
  `).join('');
}

async function excluirPaciente(id, nome) {
  if (!confirm(`Deseja excluir o paciente "${nome}"?`)) return;
  await requisicaoAPI(`/pacientes/${id}`, { method: 'DELETE' });
  carregarPacientes();
}

document.getElementById('form-paciente').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    nome_completo: document.getElementById('pac-nome').value,
    cpf: document.getElementById('pac-cpf').value.replace(/\D/g, ''),
    data_nascimento: document.getElementById('pac-nasc').value,
    telefone: document.getElementById('pac-tel').value,
    email: document.getElementById('pac-email').value,
    cep: document.getElementById('pac-cep').value.replace(/\D/g, ''),
    logradouro: document.getElementById('pac-logradouro').value,
    numero_endereco: document.getElementById('pac-numero').value
  };

  await requisicaoAPI('/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  fecharModal('modal-paciente');
  e.target.reset();
  carregarPacientes();
});

// --- 3. MÉDICOS & ESPECIALIDADES ---
async function carregarEspecialidadesTags() {
  const especialidades = await requisicaoAPI('/medicos/especialidades');
  const container = document.getElementById('lista-tags-especialidades');

  if (especialidades.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400">Nenhuma especialidade cadastrada.</span>`;
    return;
  }

  container.innerHTML = especialidades.map(e => `
    <span class="inline-flex items-center gap-1.5 bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full text-xs font-medium">
      ${e.nome_especialidade}
      <button onclick="excluirEspecialidade(${e.id_especialidade}, '${e.nome_especialidade}')" 
        title="Apagar especialidade" class="text-teal-600 hover:text-rose-600 font-bold ml-1">×</button>
    </span>
  `).join('');
}

document.getElementById('form-especialidade').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome_especialidade = document.getElementById('esp-nome').value;
  await requisicaoAPI('/medicos/especialidades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome_especialidade })
  });
  e.target.reset();
  carregarEspecialidadesTags();
});

async function excluirEspecialidade(id, nome) {
  if (!confirm(`Deseja apagar a especialidade "${nome}"?`)) return;
  await requisicaoAPI(`/medicos/especialidades/${id}`, { method: 'DELETE' });
  carregarEspecialidadesTags();
}

async function carregarMedicos() {
  const medicos = await requisicaoAPI('/medicos');
  const grid = document.getElementById('grid-medicos');

  if (medicos.length === 0) {
    grid.innerHTML = `<p class="text-slate-400 text-sm col-span-3">Nenhum médico cadastrado.</p>`;
    return;
  }

  grid.innerHTML = medicos.map(m => `
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start gap-2">
          <h3 class="font-bold text-slate-900">${m.nome_completo}</h3>
          <span class="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 shrink-0">CRM ${m.crm}</span>
        </div>
        <p class="text-xs text-teal-700 font-medium mt-1">${m.especialidades || 'Sem especialidade vinculada'}</p>
      </div>
      <div class="text-xs text-slate-500 pt-3 mt-2 border-t border-slate-100 flex justify-between items-end">
        <div>
          <p>${m.email}</p>
          <p>${m.telefone}</p>
        </div>
        <button onclick="excluirMedico(${m.id_medico}, '${m.nome_completo}')" class="text-rose-600 hover:underline font-medium">
          Excluir
        </button>
      </div>
    </div>
  `).join('');
}

async function excluirMedico(id, nome) {
  if (!confirm(`Deseja excluir o médico "${nome}"?`)) return;
  await requisicaoAPI(`/medicos/${id}`, { method: 'DELETE' });
  carregarMedicos();
}

async function prepararModalMedico() {
  const especialidades = await requisicaoAPI('/medicos/especialidades');
  const container = document.getElementById('lista-checkbox-especialidades');

  if (especialidades.length === 0) {
    container.innerHTML = `<p class="text-xs text-amber-700 col-span-2">Cadastre uma especialidade acima antes de vincular.</p>`;
  } else {
    container.innerHTML = especialidades.map(e => `
      <label class="flex items-center gap-2 text-xs cursor-pointer">
        <input type="checkbox" name="esp" value="${e.id_especialidade}" class="rounded text-teal-600" />
        <span>${e.nome_especialidade}</span>
      </label>
    `).join('');
  }

  abrirModal('modal-medico');
}

document.getElementById('form-medico').addEventListener('submit', async (e) => {
  e.preventDefault();
  const selecionadas = Array.from(document.querySelectorAll('input[name="esp"]:checked')).map(cb => Number(cb.value));
  const payload = {
    nome_completo: document.getElementById('med-nome').value,
    crm: document.getElementById('med-crm').value,
    telefone: document.getElementById('med-tel').value,
    email: document.getElementById('med-email').value,
    especialidades: selecionadas
  };

  await requisicaoAPI('/medicos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  fecharModal('modal-medico');
  e.target.reset();
  carregarMedicos();
});

carregarConsultas();