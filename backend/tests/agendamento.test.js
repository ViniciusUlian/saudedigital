const { validarAgendamento } = require('../src/services/validarAgendamento');

describe('Regras de Agendamento de Consultas', () => {
  test('deve bloquear agendamento antes das 08:00', () => {
    const resultado = validarAgendamento({
      dataHora: '2026-12-10T07:59:00',
      horariosOcupados: []
    });
    expect(resultado.valido).toBe(false);
  });
});