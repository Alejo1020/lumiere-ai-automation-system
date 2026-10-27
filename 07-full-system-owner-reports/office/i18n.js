// Lumière · Oficina de IA — Spanish / English texts. Event details arrive in Spanish from n8n and are translated here.
// Textos en español e inglés. Los detalles de los eventos llegan en español desde n8n y se traducen aquí.
window.LumiI18n = (() => {
  'use strict';
  const STR = {
    es: {
      title: 'Lumière · Oficina de IA', brandSub: 'Oficina de IA', afterHours: 'Fuera de horario · la IA sigue atendiendo',
      controls: 'Controles de la oficina', mode: 'Modo', sim: 'Simulación', live: 'En vivo', speed: 'Velocidad', restart: 'Reiniciar simulación',
      pause: 'Pausar', play: 'Reproducir', language: 'Idioma', team: 'Equipo',
      canvas: 'Oficina pixel art con seis agentes de IA: Valentina en Recepción, Sofía en Atención, Mateo en Seguimiento, Lucía en Agenda, Elena en Post-servicio y Daniel en Fidelización, más la Oficina Lumière, un café y un lounge',
      kValor: 'Valor estimado', kRoi: 'ROI del sistema', kHoras: 'Horas ahorradas', kLeads: 'Leads atendidos', kCitas: 'Citas sin recepcionista',
      kResenas: 'Reseñas pedidas', kVuelven: 'Clientas que vuelven', kEscalSim: 'Casos escalados', kEscalLive: 'Casos abiertos',
      periodSim: 'Octubre · mes a la fecha', periodLive: 'Últimos 30 días', logTitle: 'Registro de eventos',
      badgeDemo: 'Datos de demostración', badgeLive: 'En vivo', badgeConnecting: 'Conectando…', badgeOff: 'Sin conexión con n8n',
      foot: 'Cada persona de la oficina es un agente de IA (n8n + Claude) del sistema de Lumière Aesthetics. Solo se animan los hitos.',
      footSim: 'Modo simulación: octubre de demostración, sin gastar mensajes ni IA.', footLive: 'Modo en vivo: eventos reales del sistema, actualizados cada pocos segundos.',
      system: 'Sistema', ownerTag: 'Lumière',
      zones: { recepcion: 'Recepción', equipo: 'Equipo', duena: 'Oficina Lumière', estudio: 'Estudio', cafe: 'Café', lounge: 'Lounge' },
      roles: { P30: 'Recepción', P31: 'Atención', P32: 'Seguimiento', P33: 'Agenda', P34: 'Post-servicio', P35: 'Fidelización' },
      tipo: { lead_llega: 'Lead nuevo', cita_agendada: 'Cita agendada', toque_enviado: 'Mensaje enviado', recordatorio_confirmado: 'Cita confirmada',
        resena: 'Reseña', clienta_vuelve: 'Clienta que vuelve', escalamiento: 'Escalamiento', error: 'Falla' },
      seq: { wa_sin_respuesta: 'Seguimiento a lead', conversacion_sin_cita: 'Seguimiento a lead', recordatorio_cita: 'Recordatorio de cita',
        post_servicio: 'Gracias + pedir calificación', no_show: 'Te extrañamos (no asistió)', retoque: 'Invitación a retoque', reactivacion: 'Te extrañamos + oferta', otro: 'Mensaje enviado' },
      summary: 'Resumen', teamTitle: 'El equipo', agents: 'Agentes', activityToday: 'Actividad de hoy', eventsPerHour: 'hitos por hora',
      leadsToday: 'Leads hoy', bookingsToday: 'Citas hoy', nightToday: 'Fuera de horario', nightSub: 'hitos atendidos hoy',
      agentTitle: 'Agente', rowState: 'Estado', rowTasks: 'Tareas hoy', rowLast: 'Último', rowChannel: 'Canal', none: 'Nada todavía hoy',
      light: 'Luz', lightAuto: 'Auto', lightDay: 'Día', lightNight: 'Noche', statusSim: 'Simulación', statusPaused: 'En pausa', statusLive: 'En vivo', statusOff: 'Sin conexión',
      teamNote: (w, b) => `${w} en su escritorio · ${b} en pausa`, viewAgent: (n, r) => `Ver a ${n}, ${r}`,
      states: { busy: 'Atendiendo', online: 'En línea', coffee: 'Por un café', water: 'Por agua', lounge: 'En el lounge', chat: 'Conversando', door: 'Escalando a Lumière', back: 'Volviendo' },
      channel: { P30: 'Landing + WhatsApp', P31: 'WhatsApp + Google Calendar', P32: 'WhatsApp + email de respaldo', P33: 'WhatsApp', P34: 'WhatsApp + email de respaldo', P35: 'WhatsApp + email de respaldo' },
      desc: {
        P30: 'Recibe cada lead de la landing en segundos, de día o de noche, y abre la conversación por WhatsApp.',
        P31: 'Responde por WhatsApp, resuelve dudas de tratamientos y agenda directo en Google Calendar.',
        P32: 'Retoma a los leads que se quedaron callados o no agendaron, sin sonar insistente.',
        P33: 'Manda recordatorios 48, 24 y 2 horas antes de cada cita y confirma la asistencia.',
        P34: 'Agradece después de la visita, pide la calificación y lleva las notas altas a Google.',
        P35: 'Invita a retoques a tiempo y trae de vuelta a las clientas que no han vuelto.'
      },
      before: h => `(${h} h antes)`, touch: n => `(toque ${n})`, reminder: ' · recordatorio', locale: 'es'
    },
    en: {
      title: 'Lumière · AI Office', brandSub: 'AI Office', afterHours: 'After hours · the AI keeps answering',
      controls: 'Office controls', mode: 'Mode', sim: 'Simulation', live: 'Live', speed: 'Speed', restart: 'Restart simulation',
      pause: 'Pause', play: 'Play', language: 'Language', team: 'Team',
      canvas: 'Pixel-art office with six AI agents: Valentina at Reception, Sofía in Client Care, Mateo in Follow-up, Lucía in Scheduling, Elena in Post-visit and Daniel in Loyalty, plus the Lumière Office, a café and a lounge',
      kValor: 'Estimated value', kRoi: 'System ROI', kHoras: 'Hours saved', kLeads: 'Leads answered', kCitas: 'Bookings without front desk',
      kResenas: 'Reviews requested', kVuelven: 'Clients who came back', kEscalSim: 'Escalated cases', kEscalLive: 'Open cases',
      periodSim: 'October · month to date', periodLive: 'Last 30 days', logTitle: 'Event log',
      badgeDemo: 'Demo data', badgeLive: 'Live', badgeConnecting: 'Connecting…', badgeOff: 'No connection to n8n',
      foot: 'Every person in the office is an AI agent (n8n + Claude) in the Lumière Aesthetics system. Only milestones animate.',
      footSim: 'Simulation mode: a demo October, no messages or AI spent.', footLive: 'Live mode: real system events, updated every few seconds.',
      system: 'System', ownerTag: 'Lumière',
      zones: { recepcion: 'Reception', equipo: 'Team', duena: 'Lumière Office', estudio: 'Studio', cafe: 'Café', lounge: 'Lounge' },
      roles: { P30: 'Reception', P31: 'Client Care', P32: 'Follow-up', P33: 'Scheduling', P34: 'Post-visit', P35: 'Loyalty' },
      tipo: { lead_llega: 'New lead', cita_agendada: 'Booking', toque_enviado: 'Message sent', recordatorio_confirmado: 'Appointment confirmed',
        resena: 'Review', clienta_vuelve: 'Client came back', escalamiento: 'Escalation', error: 'Failure' },
      seq: { wa_sin_respuesta: 'Lead follow-up', conversacion_sin_cita: 'Lead follow-up', recordatorio_cita: 'Appointment reminder',
        post_servicio: 'Thank-you + rating request', no_show: 'We miss you (no-show)', retoque: 'Touch-up invitation', reactivacion: 'We miss you + offer', otro: 'Message sent' },
      summary: 'Summary', teamTitle: 'The team', agents: 'Agents', activityToday: "Today's activity", eventsPerHour: 'milestones per hour',
      leadsToday: 'Leads today', bookingsToday: 'Bookings today', nightToday: 'After hours', nightSub: 'milestones handled today',
      agentTitle: 'Agent', rowState: 'Status', rowTasks: 'Tasks today', rowLast: 'Latest', rowChannel: 'Channel', none: 'Nothing yet today',
      light: 'Light', lightAuto: 'Auto', lightDay: 'Day', lightNight: 'Night', statusSim: 'Simulation', statusPaused: 'Paused', statusLive: 'Live', statusOff: 'Offline',
      teamNote: (w, b) => `${w} at their desk · ${b} on a break`, viewAgent: (n, r) => `Show ${n}, ${r}`,
      states: { busy: 'Handling', online: 'Online', coffee: 'Getting coffee', water: 'Getting water', lounge: 'In the lounge', chat: 'Chatting', door: 'Escalating to Lumière', back: 'Heading back' },
      channel: { P30: 'Landing page + WhatsApp', P31: 'WhatsApp + Google Calendar', P32: 'WhatsApp + backup email', P33: 'WhatsApp', P34: 'WhatsApp + backup email', P35: 'WhatsApp + backup email' },
      desc: {
        P30: 'Picks up every landing-page lead within seconds, day or night, and opens the WhatsApp conversation.',
        P31: 'Answers on WhatsApp, handles treatment questions and books straight into Google Calendar.',
        P32: 'Follows up with leads who went quiet or never booked, without sounding pushy.',
        P33: 'Sends reminders 48, 24 and 2 hours before each appointment and confirms attendance.',
        P34: 'Thanks clients after the visit, asks for a rating and sends happy ones to Google.',
        P35: 'Invites clients back for touch-ups on time and wins back the ones who stopped coming.'
      },
      before: h => `(${h} h before)`, touch: n => `(touch ${n})`, reminder: ' · reminder', locale: 'en-US'
    }
  };

  // Services and case types as they come from the Sheet / servicios y tipos de caso como vienen del Sheet
  const SERVICE_EN = {
    'Consulta + análisis de piel': 'Consultation + skin analysis', 'Depilación láser': 'Laser hair removal', 'Láser facial': 'Laser facial',
    'Microneedling con PRP': 'Microneedling with PRP', 'Rellenos dérmicos': 'Dermal fillers', 'No estoy segura': 'Not sure yet'
  };
  // Escalation reasons (Escalamientos.motivo) / motivos de escalamiento
  const CASE = {
    es: { pide_humano: 'pidió hablar con una persona', medico: 'tema médico', queja: 'queja', dinero: 'tema de pagos', enredo: 'conversación enredada' },
    en: { pide_humano: 'asked for a person', medico: 'medical topic', queja: 'complaint', dinero: 'payment issue', enredo: 'tangled conversation' }
  };
  const svc = s => SERVICE_EN[s.trim()] || s;
  const RULES = [
    [/^(\S+) llegó desde la landing · (.+)$/, (m, n, s) => `${n} came in from the landing page · ${svc(s)}`],
    [/^(\S+) volvió a llenar el formulario · (.+)$/, (m, n, s) => `${n} filled out the form again · ${svc(s)}`],
    [/^(\S+) volvió y agendó (.+) · (.+)$/, (m, n, s, d) => `${n} came back and booked ${svc(s)} · ${d}`],
    [/^(\S+) agendó (.+) · (.+)$/, (m, n, s, d) => `${n} booked ${svc(s)} · ${d}`],
    [/^(\S+) confirmó su cita de (.+) · (.+)$/, (m, n, s, d) => `${n} confirmed her ${svc(s)} appointment · ${d}`],
    [/^Nota (\d)\/5 en (.+) · se pidió reseña en Google$/, (m, k, s) => `Rated ${k}/5 for ${svc(s)} · Google review requested`],
    [/^Nota (\d)\/5 en (.+?) · (.+)$/, (m, k, s, rest) => `Rated ${k}/5 for ${svc(s)} · ${rest.replace('pasó al equipo', 'handed to the team')}`],
    [/^(\S+) · caso (\S+) pasó al equipo$/, (m, n, c) => `${n} · ${CASE.en[c] || c} · handed to the team`],
    [/^Falla en (.+) · el monitor ya avisó$/, (m, w) => `Failure in ${w} · the monitor already sent an alert`]
  ];
  function detail(text, lang) {
    if (lang !== 'en') return text.replace(/^(\S+) · caso (\S+) pasó al equipo$/, (m, n, c) => `${n} · ${CASE.es[c] || c} · pasó al equipo`);
    for (const [re, fn] of RULES) if (re.test(text)) return text.replace(re, fn);
    return text;
  }
  return { STR, detail };
})();
