const API = '/api';
lucide.createIcons();

let cacheProntuarios = [];

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
    alert('Atenção: ' + erro.message);
    throw erro;
  }
}

function navegar(secao) {
  ['agenda', 'prontuarios', 'pacientes', 'medicos', 'unidades'].forEach(s => {
    document.getElementById(`sec-${s}`).classList.toggle('hidden', s !== secao);
    const btn = document.getElementById(`nav-${s}`);
    btn.className = s === secao
      ? 'nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-teal-50 text-teal-700'
      : 'nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50';
  });

  if (secao === 'agenda') carregarConsultas();
  if (secao === 'prontuarios') carregarProntuarios();
  if (secao === 'pacientes') carregarPacientes();
  if (secao === 'medicos') {
    carregarEspecialidadesTags();
    carregarMedicos();
  }
  if (secao === 'unidades') carregarUnidades();
}

function abrirModal(id) { document.getElementById(id).classList.remove('hidden'); }
function fecharModal(id) { document.getElementById(id).classList.add('hidden'); }

async function buscarCep(cep, idLogradouro, idNumero) {
  const limpo = cep.replace(/\D/g, '');
  if (limpo.length !== 8) return;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
    const dados = await res.json();
    if (!dados.erro) {
      document.getElementById(idLogradouro).value = dados.logradouro;
      document.getElementById(idNumero).focus();
    }
  } catch (e) {}
}

// --- 1. AGENDA ---
async function carregarConsultas() {
  const consultas = await requisicaoAPI('/consultas');
  const tbody = document.getElementById('tabela-consultas');

  if (consultas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400">Nenhuma consulta agendada.</td></tr>`;
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
      acoes = `<button onclick="verProntuario(${c.id_consulta})" class="text-teal-700 hover:underline font-medium text-xs">Ver Prontuário</button>`;
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
        <td class="py-3.5 px-5">${c.nome_medico} <span class="block text-xs text-teal-700 font-medium">${c.nome_especialidade}</span></td>
        <td class="py-3.5 px-5 text-xs text-slate-600">${c.nome_unidade} <span class="block text-slate-400">${c.tipo_unidade}</span></td>
        <td class="py-3.5 px-5"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badges[c.status_consulta] || ''}">${c.status_consulta}</span></td>
        <td class="py-3.5 px-5 text-right">${acoes}</td>
      </tr>
    `;
  }).join('');
}

async function prepararModalConsulta() {
  const [unidades, pacientes, medicos] = await Promise.all([
    requisicaoAPI('/unidades'),
    requisicaoAPI('/pacientes'),
    requisicaoAPI('/medicos')
  ]);

  if (unidades.length === 0 || pacientes.length === 0 || medicos.length === 0) {
    alert('Cadastre pelo menos 1 unidade, 1 paciente e 1 médico ativos antes de agendar.');
    return;
  }

  document.getElementById('cons-unidade').innerHTML = unidades
    .map(u => `<option value="${u.id_unidade}">${u.nome_unidade} (${u.tipo_unidade})</option>`).join('');
  document.getElementById('cons-paciente').innerHTML = pacientes
    .map(p => `<option value="${p.id_paciente}">${p.nome_completo} (${p.cpf})</option>`).join('');
  document.getElementById('cons-medico').innerHTML = medicos
    .map(m => `<option value="${m.id_medico}">${m.nome_completo} — CRM ${m.crm}</option>`).join('');

  await carregarEspecialidadesDoMedico(medicos[0].id_medico);
  abrirModal('modal-consulta');
}

async function carregarEspecialidadesDoMedico(idMedico) {
  const especialidades = await requisicaoAPI(`/medicos/${idMedico}/especialidades`);
  const select = document.getElementById('cons-especialidade');

  if (especialidades.length === 0) {
    select.innerHTML = `<option value="">Médico sem especialidade ativa vinculada</option>`;
  } else {
    select.innerHTML = especialidades
      .map(e => `<option value="${e.id_especialidade}">${e.nome_especialidade}</option>`).join('');
  }
}

document.getElementById('form-consulta').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    id_unidade: document.getElementById('cons-unidade').value,
    id_paciente: document.getElementById('cons-paciente').value,
    id_medico: document.getElementById('cons-medico').value,
    id_especialidade: document.getElementById('cons-especialidade').value,
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
  navegar('prontuarios');
});

// --- 2. PRONTUÁRIOS (VW_PRONTUARIO_COMPLETO) ---
function normalizarDadosProntuario(p) {
  return {
    id_prontuario: p.id_prontuario,
    id_consulta: p.id_consulta,
    data: p.data_hora_agendamento || p.data_consulta || p.data_atendimento,
    paciente: p.nome_paciente || p.paciente || 'Paciente',
    cpf: p.cpf_paciente || p.cpf || '',
    medico: p.nome_medico || p.medico || 'Médico',
    crm: p.crm || p.crm_medico || '',
    especialidade: p.nome_especialidade || p.especialidade || '',
    unidade: p.nome_unidade || p.unidade || '',
    endereco_unidade: p.endereco_unidade || (p.logradouro ? `${p.logradouro}, ${p.numero_endereco || ''}` : ''),
    sintomas: p.sintomas_relatados,
    diagnostico: p.diagnostico,
    prescricao: p.prescricao_medica,
    observacoes: p.observacoes_adicionais
  };
}

async function carregarProntuarios() {
  const dados = await requisicaoAPI('/prontuarios');
  cacheProntuarios = dados.map(normalizarDadosProntuario);
  renderizarCardsProntuarios(cacheProntuarios);
}

function filtrarProntuarios() {
  const termo = document.getElementById('busca-prontuario').value.toLowerCase();
  const filtrados = cacheProntuarios.filter(p =>
    p.paciente.toLowerCase().includes(termo) ||
    p.medico.toLowerCase().includes(termo) ||
    (p.diagnostico || '').toLowerCase().includes(termo) ||
    p.especialidade.toLowerCase().includes(termo)
  );
  renderizarCardsProntuarios(filtrados);
}

function renderizarCardsProntuarios(lista) {
  const grid = document.getElementById('grid-prontuarios');
  if (lista.length === 0) {
    grid.innerHTML = `<p class="text-slate-400 text-sm col-span-2">Nenhum prontuário encontrado.</p>`;
    return;
  }

  grid.innerHTML = lista.map(p => {
    const dataStr = p.data ? new Date(p.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
    return `
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div class="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <span class="text-xs font-mono text-slate-400">Prontuário #${p.id_prontuario} • ${dataStr}</span>
            <h3 class="font-bold text-slate-900 text-base mt-0.5">${p.paciente}</h3>
            ${p.cpf ? `<span class="text-xs text-slate-500">CPF: ${p.cpf}</span>` : ''}
          </div>
          <button onclick="verProntuario(${p.id_consulta})" class="bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-xs font-semibold">
            Abrir Completo
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg">
          <div>
            <span class="text-slate-400 block">Médico Responsável (3FN)</span>
            <strong class="text-slate-800">${p.medico}</strong> ${p.crm ? `(CRM ${p.crm})` : ''}
            <span class="block text-teal-700 font-medium">${p.especialidade}</span>
          </div>
          <div>
            <span class="text-slate-400 block">Local de Atendimento</span>
            <strong class="text-slate-800">${p.unidade}</strong>
            <span class="block text-slate-500">${p.endereco_unidade}</span>
          </div>
        </div>

        <div class="text-xs space-y-1">
          <p><strong class="text-slate-700">Diagnóstico:</strong> ${p.diagnostico}</p>
          <p class="text-slate-500 truncate"><strong class="text-slate-700">Prescrição:</strong> ${p.prescricao}</p>
        </div>
      </div>
    `;
  }).join('');
}

async function verProntuario(idConsulta) {
  const bruto = await requisicaoAPI(`/prontuarios/${idConsulta}`);
  const p = normalizarDadosProntuario(bruto);

  document.getElementById('conteudo-prontuario').innerHTML = `
    <div class="bg-teal-50/70 border border-teal-100 p-3.5 rounded-xl text-xs space-y-1">
      <p><strong>Paciente:</strong> ${p.paciente} ${p.cpf ? `— CPF ${p.cpf}` : ''}</p>
      <p><strong>Médico:</strong> ${p.medico} ${p.crm ? `(CRM ${p.crm})` : ''} • <strong>Especialidade:</strong> ${p.especialidade}</p>
      <p><strong>Unidade:</strong> ${p.unidade} ${p.endereco_unidade ? `— ${p.endereco_unidade}` : ''}</p>
    </div>
    <div><strong class="text-slate-900">Sintomas Relatados:</strong><p class="bg-slate-50 p-2.5 rounded-lg mt-1">${p.sintomas}</p></div>
    <div><strong class="text-slate-900">Diagnóstico:</strong><p class="bg-slate-50 p-2.5 rounded-lg mt-1">${p.diagnostico}</p></div>
    <div><strong class="text-slate-900">Prescrição Médica:</strong><p class="bg-slate-50 p-2.5 rounded-lg mt-1">${p.prescricao}</p></div>
    ${p.observacoes ? `<div><strong class="text-slate-900">Observações:</strong><p class="bg-slate-50 p-2.5 rounded-lg mt-1">${p.observacoes}</p></div>` : ''}
  `;
  abrirModal('modal-ver-prontuario');
}

// --- 3. PACIENTES (SOFT DELETE) ---
async function carregarPacientes() {
  const todos = document.getElementById('chk-pacientes-inativos').checked;
  const pacientes = await requisicaoAPI(`/pacientes?todos=${todos}`);
  const tbody = document.getElementById('tabela-pacientes');

  if (pacientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400">Nenhum paciente encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = pacientes.map(p => {
    const inativo = p.status === 'INATIVO';
    return `
      <tr class="hover:bg-slate-50 ${inativo ? 'opacity-60 bg-slate-50/50' : ''}">
        <td class="py-3.5 px-5 font-medium text-slate-900">${p.nome_completo}</td>
        <td class="py-3.5 px-5 font-mono text-xs">${p.cpf}</td>
        <td class="py-3.5 px-5">${new Date(p.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
        <td class="py-3.5 px-5">${p.telefone}</td>
        <td class="py-3.5 px-5 text-slate-500">${p.logradouro}, ${p.numero_endereco} — CEP ${p.cep}</td>
        <td class="py-3.5 px-5 text-right space-x-2">
          <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${inativo ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}">${p.status}</span>
          ${inativo
            ? `<button onclick="reativarRegistro('pacientes', ${p.id_paciente}, carregarPacientes)" class="text-teal-700 hover:underline text-xs font-medium">Reativar</button>`
            : `<button onclick="inativarPaciente(${p.id_paciente}, '${p.nome_completo}')" class="text-rose-600 hover:underline text-xs font-medium">Inativar</button>`
          }
        </td>
      </tr>
    `;
  }).join('');
}

async function inativarPaciente(id, nome) {
  if (!confirm(`Deseja inativar o paciente "${nome}"? O histórico clínico será preservado.`)) return;
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

// --- 4. MÉDICOS & ESPECIALIDADES (SOFT DELETE) ---
async function carregarEspecialidadesTags() {
  const especialidades = await requisicaoAPI('/medicos/especialidades');
  const container = document.getElementById('lista-tags-especialidades');

  if (especialidades.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400">Nenhuma especialidade ativa.</span>`;
    return;
  }

  container.innerHTML = especialidades.map(e => `
    <span class="inline-flex items-center gap-1.5 bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full text-xs font-medium">
      ${e.nome_especialidade}
      <button onclick="inativarEspecialidade(${e.id_especialidade}, '${e.nome_especialidade}')" 
        title="Inativar especialidade" class="text-teal-600 hover:text-rose-600 font-bold ml-1">×</button>
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

async function inativarEspecialidade(id, nome) {
  if (!confirm(`Deseja inativar a especialidade "${nome}"?`)) return;
  await requisicaoAPI(`/medicos/especialidades/${id}`, { method: 'DELETE' });
  carregarEspecialidadesTags();
}

async function carregarMedicos() {
  const todos = document.getElementById('chk-medicos-inativos').checked;
  const medicos = await requisicaoAPI(`/medicos?todos=${todos}`);
  const grid = document.getElementById('grid-medicos');

  if (medicos.length === 0) {
    grid.innerHTML = `<p class="text-slate-400 text-sm col-span-3">Nenhum médico encontrado.</p>`;
    return;
  }

  grid.innerHTML = medicos.map(m => {
    const inativo = m.status === 'INATIVO';
    return `
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between ${inativo ? 'opacity-60' : ''}">
        <div>
          <div class="flex justify-between items-start gap-2">
            <h3 class="font-bold text-slate-900">${m.nome_completo}</h3>
            <span class="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 shrink-0">CRM ${m.crm}</span>
          </div>
          <p class="text-xs text-teal-700 font-medium mt-1">${m.especialidades || 'Sem especialidade ativa'}</p>
        </div>
        <div class="text-xs text-slate-500 pt-3 mt-2 border-t border-slate-100 flex justify-between items-end">
          <div>
            <p>${m.email}</p>
            <p>${m.telefone}</p>
          </div>
          <div class="text-right space-y-1">
            <span class="block text-[10px] font-bold ${inativo ? 'text-slate-500' : 'text-emerald-600'}">${m.status}</span>
            ${inativo
              ? `<button onclick="reativarRegistro('medicos', ${m.id_medico}, carregarMedicos)" class="text-teal-700 hover:underline font-medium">Reativar</button>`
              : `<button onclick="inativarMedico(${m.id_medico}, '${m.nome_completo}')" class="text-rose-600 hover:underline font-medium">Inativar</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function inativarMedico(id, nome) {
  if (!confirm(`Deseja inativar o médico "${nome}"?`)) return;
  await requisicaoAPI(`/medicos/${id}`, { method: 'DELETE' });
  carregarMedicos();
}

async function prepararModalMedico() {
  const especialidades = await requisicaoAPI('/medicos/especialidades');
  const container = document.getElementById('lista-checkbox-especialidades');

  if (especialidades.length === 0) {
    container.innerHTML = `<p class="text-xs text-amber-700 col-span-2">Cadastre uma especialidade antes de vincular.</p>`;
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

// --- 5. UNIDADES (MATRIZ E FILIAIS) ---
async function carregarUnidades() {
  const todos = document.getElementById('chk-unidades-inativas').checked;
  const unidades = await requisicaoAPI(`/unidades?todos=${todos}`);
  const grid = document.getElementById('grid-unidades');

  if (unidades.length === 0) {
    grid.innerHTML = `<p class="text-slate-400 text-sm col-span-3">Nenhuma unidade encontrada.</p>`;
    return;
  }

  grid.innerHTML = unidades.map(u => {
    const inativo = u.status === 'INATIVO';
    const isMatriz = (u.tipo_unidade || '').toUpperCase() === 'MATRIZ';
    return `
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between ${inativo ? 'opacity-60' : ''}">
        <div>
          <div class="flex justify-between items-start gap-2">
            <h3 class="font-bold text-slate-900">${u.nome_unidade}</h3>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${isMatriz ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'}">
              ${u.tipo_unidade}
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-2">${u.logradouro}, ${u.numero_endereco} — CEP ${u.cep}</p>
        </div>
        <div class="text-xs pt-3 border-t border-slate-100 flex justify-between items-center">
          <span class="font-bold ${inativo ? 'text-slate-500' : 'text-emerald-600'}">${u.status}</span>
          ${inativo
            ? `<button onclick="reativarRegistro('unidades', ${u.id_unidade}, carregarUnidades)" class="text-teal-700 hover:underline font-medium">Reativar</button>`
            : `<button onclick="inativarUnidade(${u.id_unidade}, '${u.nome_unidade}')" class="text-rose-600 hover:underline font-medium">Inativar</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('form-unidade').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    nome_unidade: document.getElementById('uni-nome').value,
    tipo_unidade: document.getElementById('uni-tipo').value,
    cep: document.getElementById('uni-cep').value.replace(/\D/g, ''),
    logradouro: document.getElementById('uni-logradouro').value,
    numero_endereco: document.getElementById('uni-numero').value
  };

  await requisicaoAPI('/unidades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  fecharModal('modal-unidade');
  e.target.reset();
  carregarUnidades();
});

async function inativarUnidade(id, nome) {
  if (!confirm(`Deseja inativar a unidade "${nome}"?`)) return;
  await requisicaoAPI(`/unidades/${id}`, { method: 'DELETE' });
  carregarUnidades();
}

async function reativarRegistro(recurso, id, callbackRecarregar) {
  await requisicaoAPI(`/${recurso}/${id}/reativar`, { method: 'PATCH' });
  callbackRecarregar();
}

carregarConsultas();