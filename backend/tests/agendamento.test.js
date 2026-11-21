const { validarAgendamento } = require('../src/services/validarAgendamento');

describe('Regras de Agendamento de Consultas', () => {
  test('deve bloquear agendamento antes das 08:00', () => {
    const resultado = validarAgendamento({
      dataHora: '2026-12-10T07:59:00',
      horariosOcupados: []
    });
    expect(resultado.valido).toBe(false);
  });

  test('deve bloquear agendamento em horário já ocupado', () => {
    const resultado = validarAgendamento({
      dataHora: '2026-12-10T14:00:00',
      horariosOcupados: ['2026-12-10T14:00:00']
    });
    expect(resultado.valido).toBe(false);
  });

  test('deve permitir agendamento em horário comercial disponível', () => {
    const resultado = validarAgendamento({
      dataHora: '2026-12-10T14:00:00',
      horariosOcupados: ['2026-12-10T10:00:00']
    });
    expect(resultado.valido).toBe(true);
  });
});