# Agente de IA por WhatsApp que atiende y agenda (Lumière Aesthetics)

[🇬🇧 English](README.md) | 🇪🇸 Español

> Hace parte del portafolio **Lumière Aesthetics** (P30–P36): un med spa ficticio en Old Town Scottsdale, Arizona, construido como si fuera un cliente que paga.
> P30 captura el lead en la landing. **P31 le responde por WhatsApp en segundos, resuelve sus dudas con los datos reales del spa y le agenda la cita en Google Calendar, sin recepcionista.** Una persona solo interviene en 5 casos concretos.
>
> 💬 **WhatsApp o SMS:** la demo corre por WhatsApp, pero todos los mensajes salen por un solo bloque de envío compartido, así que el mismo sistema funciona por SMS (Twilio) sin cambiar la lógica.

---

## Problema

Un med spa paga por cada lead, y después pierde muchos en el espacio entre "me interesa" y "ya agendé":

- **Primera respuesta lenta.** La recepción contesta entre pacientes y solo en horario. Un lead que llega a las 9 p. m. o un domingo espera hasta el otro día, y para entonces ya agendó en otro lado.
- **Agendar es un ida y vuelta.** "¿Qué día te sirve?" → "¿El jueves?" → "El jueves tenemos 10 o 3" → … Cada mensaje es otra oportunidad de que el lead se enfríe, y otra hora de la recepcionista cuadrando agenda.
- **La recepcionista no da abasto.** Precios, horario, parqueadero, "¿duele?": las mismas preguntas una y otra vez.
- **Hay conversaciones que deben llegar a un humano.** Embarazo, alergias, una clienta molesta, un reembolso. Un asistente automático nunca debe improvisar ahí.

## Solución

Siete workflows de n8n que funcionan como uno solo: tres que hacen el trabajo y cuatro **piezas compartidas** que reutiliza el resto del portafolio (P32–P35).

```
LANDING (P30) ── lead nuevo ──► P31a First Contact ── WhatsApp en ~3 s
                                                        │
                                          ella responde por WhatsApp
                                                        ▼
P31b WhatsApp Inbound (webhook de Twilio, la única puerta de WhatsApp del spa)
  Ack Twilio → Parse → P31d Client Context (quién es, su cita, caso abierto, historial)
  → Ruta: número desconocido = ignorar │ palabra de baja = confirmar y parar │ caso abierto = reenviar al equipo
  → P31f Availability (horarios libres de 1 hora desde Google Calendar)
  → Claude Sonnet (reglas + datos del spa desde el Sheet, en caché) → JSON {reply, action, booking}
  → acción:
       reply                        → enviar
       book / reschedule / cancel   → P31g Booking (vuelve a mirar el calendario, escribe en Calendar + Citas)
       escalate (solo 5 casos)      → Escalamientos + alerta por WhatsApp al equipo, el agente calla
  → P31e Send WhatsApp (envía + registra) → Leads.estado

P31c Delivery Status ◄── avisos de Twilio: delivered / read / failed
  (si la apertura nunca llegó → lead = contacto_fallido)
```

**El Google Sheet es la única base de datos** (una hoja por entidad, unidas por `lead_id`): `Leads`, `Conversaciones`, `Citas`, `Escalamientos`, más `Servicios` y `Negocio`. **Todos los datos del spa (precios, duraciones, horario, anticipación, ventana de agenda, número del equipo) viven en el Sheet, no en el código.** La dueña cambia un precio o agrega un dato como fila nueva, y el agente lo sigue desde el siguiente mensaje.

**Reglas del agente (las mismas para todos los agentes del portafolio):**
- Se presenta como asistente virtual de Lumière y responde en el idioma de la clienta (ES/EN).
- Solo dice datos del Sheet. Nunca inventa precios, disponibilidad ni promociones. Nunca da consejo médico.
- Las preguntas fuera de tema y los intentos de manipulación reciben una respuesta amable que vuelve al tema, y **nunca se escalan**.
- **Solo agenda después de un "sí" explícito** a servicio, día y hora. Las clientas nuevas agendan primero la consulta gratis.
- Escala a una persona exactamente en 5 casos: pide un humano, tema médico, queja, plata fuera de lo normal (reembolsos, disputas, descuentos especiales) o el agente se enreda. Después calla hasta que el equipo cierre el caso en el Sheet.

## Resultado de negocio

Medido en pruebas reales de punta a punta (landing → WhatsApp → Google Calendar):

| Métrica | Antes (recepción típica) | Con P31 |
|---|---|---|
| Primera respuesta a un lead nuevo | horas (o el siguiente día hábil) | **~3 segundos, 24/7** |
| Respuesta a cada mensaje de la clienta | depende de la recepción | **~6–10 segundos** |
| Agendar una consulta | ida y vuelta por llamada o texto | **3 mensajes en el mismo chat**, directo a Google Calendar |
| Reprogramar o cancelar | llamar al spa | en el chat, liberando el calendario al instante |
| Citas dobles | posibles | bloqueadas: se revisa el calendario justo antes de escribir |
| Salud, quejas o reembolsos | los atiende quien los vea | **alerta por WhatsApp al equipo con resumen**, el agente calla |
| "¿Le llegó nuestro mensaje?" | no se sabe | cada mensaje con su estado: entregado / leído / fallido |

Lo que ve la dueña: citas que aparecen en el calendario de su celular, agendadas mientras el spa estaba cerrado, y alertas solo cuando de verdad tiene que actuar.

## Valor para el negocio

> "Cada lead que llena tu formulario recibe un WhatsApp de tu clínica en 3 segundos, de día o de noche. Tu asistente responde precios y dudas con tu información real, agenda la consulta gratis directo en tu Google Calendar y solo molesta a tu equipo en los casos que necesitan una persona: salud, quejas o plata. Dejas de perder los leads que llegan fuera de horario, y tu recepcionista deja de pasarse el día cuadrando agenda."

- **Para quién es:** med spas, clínicas estéticas y dentales, salones: cualquier negocio con citas que ya recibe leads por anuncios o por su web.
- Funciona solo o dentro del sistema completo (parte 7), donde el resumen semanal y el informe mensual de ROI le muestran a la dueña lo que agendó el asistente.

## Salir a producción

La demo usa el Sandbox de WhatsApp de Twilio. Con un negocio real:

- Un número de WhatsApp Business en vez del número del sandbox.
- Plantillas aprobadas por Meta para mensajes fuera de la ventana de 24 h.
- Un dominio fijo en vez de un Quick Tunnel.
- Que un abogado revise el texto de consentimiento.
- Para usar SMS en vez de WhatsApp solo cambia un workflow (P31e, el bloque de envío).

## Stack técnico

n8n (self-hosted, Docker) · Claude API (Sonnet, prompt caching, salida JSON) · Twilio WhatsApp (sandbox) · Google Sheets API · Google Calendar API (freeBusy + eventos) · Cloudflare Tunnel · Cloudflare Pages (landing, P30)

| Workflow | Función |
|---|---|
| `p31a-first-contact.json` | WhatsApp de apertura en el instante en que P30 guarda un lead nuevo |
| `p31b-whatsapp-inbound.json` | Puerta única de WhatsApp: ruteo, Claude, escalamiento, agenda y respuesta |
| `p31c-delivery-status.json` | Avisos de estado de Twilio → estado de entrega y aperturas fallidas |
| `p31d-client-context.json` | Compartida: foto completa de la clienta con todas las hojas en una sola lectura |
| `p31e-send-whatsapp.json` | Compartida: el único lugar que habla con el canal (envía + registra) |
| `p31f-availability.json` | Compartida: horarios libres de 1 hora desde Google Calendar |
| `p31g-booking.json` | Compartida: agendar, reprogramar o cancelar con revisión final del calendario |

Todos los IDs, números y credenciales de los JSON son placeholders (`YOUR_...`).

## Aprendizajes técnicos clave

- **Sub-workflows como piezas compartidas.** Client Context, Send WhatsApp, Availability y Booking se llaman con *Execute Workflow*: sin URL, sin tunnel y sin nada público. En n8n 2.x un sub-workflow tiene que estar **publicado** para que lo llamen fuera del editor (`Workflow is not active and cannot be executed`). La interfaz no dejó activar un workflow sin trigger, pero la API sí.
- **n8n calcula, Claude decide.** n8n calcula los horarios libres desde Google Calendar y se los da a Claude como lista; Claude solo elige uno y devuelve JSON. Después n8n vuelve a revisar el horario justo antes de escribir. Claude no puede inventar disponibilidad y dos clientas nunca quedan a la misma hora.
- **Claude copia el formato del historial.** Con los turnos anteriores de la asistente en texto plano, Claude respondió en texto plano, y una vez hasta repitió el JSON con una "corrección" en medio. Eso generaba escalamientos falsos. Solución: los turnos anteriores se mandan en el mismo formato JSON que Claude debe usar, va un recordatorio de formato al final del system prompt, y el parser recorre todos los objetos JSON completos del texto (contando llaves y respetando strings) y se queda con el último válido.
- **Prompt caching con datos en vivo.** Las reglas y los datos del spa desde el Sheet van en un bloque del system prompt en caché; el estado en vivo, los horarios libres y el historial quedan fuera del caché (~2.500–3.000 tokens en caché por conversación).
- **Una lectura, una foto.** `values:batchGet` lee las seis hojas en una sola llamada, así cada decisión se toma sobre una foto consistente de la clienta.
- **Twilio acepta y falla después.** Un 201 con SID no significa entregado. Cada mensaje lleva un `StatusCallback`; el estado solo avanza (los avisos llegan desordenados) y una apertura fallida marca el lead como `contacto_fallido` (prueba real: error 63015 en ~3 s).
- **El sandbox de Twilio se come el `STOP`.** Desconecta el número y el mensaje nunca llega al webhook. La baja se probó con `BAJA`/`UNSUBSCRIBE`; con un número real el STOP sí llega y el flujo lo maneja.
- **Valores seguros por defecto.** Si no se puede leer la respuesta de Claude → respuesta segura + escalamiento. Si el horario se ocupó en el último segundo → el "¡listo!" se reemplaza por tres horarios libres reales. Los números desconocidos no reciben nada. Un tope diario de respuestas protege contra abuso y costo.
- **Escrituras seguras con ejecuciones simultáneas.** Las filas nuevas usan `values:append` de la API de Sheets (atómico) en vez del nodo de Sheets de n8n, que en P30 pisaba filas cuando corrían varias ejecuciones a la vez.
