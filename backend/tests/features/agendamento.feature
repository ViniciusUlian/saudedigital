# language: pt
Funcionalidade: Validação de Agendamento de Consultas
  Como recepcionista da clínica SaúdeDigital
  Quero que o sistema valide horários e conflitos antes de confirmar a consulta
  Para evitar agendamentos duplicados ou fora do expediente

  Cenário: Bloquear agendamento em horário já ocupado
    Dado que o médico já possui consulta marcada para "2026-12-10" às "14:00"
    Quando tentar agendar uma nova consulta para o mesmo médico nesse horário
    Então o sistema deve rejeitar o agendamento por conflito de horário

  Cenário: Bloquear agendamento fora do horário comercial
    Dado que a clínica funciona das "08:00" às "18:00"
    Quando tentar agendar uma consulta às "07:59"
    Então o sistema deve rejeitar o agendamento por estar fora do expediente