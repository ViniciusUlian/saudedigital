function validarAgendamento({ dataHora, horariosOcupados }) {
  const hora = new Date(dataHora).getHours();
  if (hora < 8 || hora >= 18) {
    return { valido: false, erro: 'Fora do horário de expediente' };
  }
  if (horariosOcupados.includes(dataHora)) {
    return { valido: false, erro: 'Horário já ocupado' };
  }
  return { valido: true };
}

module.exports = { validarAgendamento };