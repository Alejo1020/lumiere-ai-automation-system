# Recordatorios de citas y anti no-shows (Lumière Aesthetics)

[🇬🇧 English](README.md) | 🇪🇸 Español

> Parte del portafolio **Lumière Aesthetics** (P30–P36): un med spa ficticio en Old Town Scottsdale, Arizona, construido como si fuera un cliente que paga.
> P30 captura el lead, P31 atiende y agenda por WhatsApp, P32 recupera a los leads que se quedaron callados. **P33 se asegura de que las clientas que agendaron sí lleguen**: recordatorios en cascada antes de cada cita, donde ella confirma, reprograma o cancela en un mensaje, y el espacio cancelado vuelve de inmediato al calendario.
>
> 💬 **WhatsApp o SMS:** la demo corre por WhatsApp, pero todos los mensajes salen por un solo bloque de envío compartido, así que el mismo sistema funciona por SMS (Twilio) sin cambiar la lógica.

---

## Problema

Una silla vacía es lo más caro de un med spa: la especialista, la sala y el tiempo se pagan aunque la clienta no llegue.

- **Las inasistencias son normales.** Sin recordatorios, las clínicas que trabajan con citas suelen perder entre el 15 y el 20 % de las reservas porque la gente simplemente se olvida.
- **Confirmar por teléfono se come a la recepción.** Llamar a cada clienta el día anterior toma horas a la semana, y la mitad de las llamadas caen al buzón.
- **Una cancelación tardía se pierde dos veces.** Si cancela no llegando, nadie más puede tomar ese espacio.

Números de ejemplo para un spa como Lumière (~80 citas al mes, ticket promedio ~$450): bajar las inasistencias de ~15-20 % a ~5-8 % son **~8 sillas llenas ≈ $3.600 al mes** de ingreso protegido, más ~4 horas a la semana que la recepción deja de gastar en llamadas de confirmación.

## Solución

Un workflow nuevo de n8n más una acción nueva, `confirm`, en las piezas compartidas que se construyeron en P31. Los recordatorios son plantillas fijas (sin IA), así que no cuestan nada aparte del mensaje.

```
P33a Appointment Reminders (cada minuto)
  Read All Sheets (1 batchGet: Leads, Citas, Seguimientos, Negocio, Servicios)
  → Pick Due Reminders: a qué cita le toca qué paso ahora (y por qué a las demás no)
  → Build Reminder: plantilla fija estilo Meta, en español o inglés, "hoy / mañana / día", hora, servicio, dirección
  → P31e Send WhatsApp (lo registra en el historial del chat, así la asistente lo ve)
  → Log to Seguimientos (cita_id, ronda = inicio de la cita, paso)

Ella responde por WhatsApp → P31b (construido en P31): la asistente lee el recordatorio en el historial
  "Sí, ahí estaré"       → confirm    → P31g: Citas = confirmada + evento en verde en Google Calendar
  "¿Podemos moverla?"    → reschedule → P31g: horarios libres reales, se mueve el mismo evento
  "No puedo ir"          → cancel     → P31g: se borra el evento y el espacio queda libre
```

| Paso | Cuándo (producción) | Plantilla |
|---|---|---|
| `48h` | 48 h antes | `confirmar`: recordatorio + "responde SÍ para confirmar, o dime si necesitas cambiarla" |
| `24h` | 24 h antes | `confirmar` (solo si todavía no confirmó) |
| `2h` | 2 h antes | `te_esperamos` si confirmó (dirección + parqueadero) · `ultimo_aviso` si no |

**Reglas para que no sea molesto:** solo sale el último paso que ya tocó (si n8n estuvo caído, nunca le llegan dos recordatorios seguidos); un paso se salta si ella agendó, reprogramó o confirmó después de su hora; una cita reprogramada arranca una cascada nueva; a quien se dio de baja no le llega nada; en producción solo se envía de 8 a. m. a 8 p. m. hora del spa. Un interruptor `DEMO_MODE` convierte 48 h / 24 h / 2 h en 15 / 10 / 5 minutos para demos en vivo.

## Resultado de negocio

Probado en vivo con Twilio WhatsApp + Google Calendar (modo demo):

| Qué pasó | Resultado |
|---|---|
| Cita a 15 min | Recordatorio 1 enviado en el minuto exacto, registrado una sola vez |
| A 10 min, sin respuesta | Recordatorio 2 enviado, sin duplicados en las corridas siguientes |
| Respondió "Sí, ahí estaré" | La asistente confirmó en ~12 s; cita `confirmada`, evento en verde en el calendario de la dueña |
| A 5 min, ya confirmada | "Te esperamos hoy" con dirección y parqueadero (no vuelve a pedir confirmación) |
| Entrega | Todos los mensajes `delivered` / `read` por el status callback de Twilio |
| Pruebas de lógica | 16/16 casos simulados (ráfagas, reprogramar, agendó tarde, baja, horario…) |

Costo por recordatorio: **$0 de IA** (plantillas fijas); solo la tarifa del mensaje de WhatsApp/SMS.

## Cómo se vende

**Pitch (para la dueña de un med spa):**
> "¿Cuántas sillas quedaron vacías el mes pasado porque alguien se olvidó? Esto le manda a cada clienta un recordatorio corto antes de su cita; ella confirma, la mueve o cancela con un mensaje, y el espacio libre vuelve a tu calendario al instante. Desde el celular ves en verde quién confirmó. Si salva 8 citas al mes, son unos $3.600, y tu recepción deja de llamar a la gente una por una."

- **Cliente objetivo:** med spas, clínicas estéticas y odontológicas, salones, cualquier negocio que vive de citas.
- **Precio (propuesta, por validar):** setup **$800-1.500** + retainer **$250-500 al mes**. Se vende solo (funciona con cualquier agenda en calendario) o dentro del sistema completo de Lumière (P36), donde los no-shows evitados aparecen en el informe mensual de ROI a la dueña.
- **Nota de producción:** los recordatorios salen fuera de la ventana de 24 h de WhatsApp, así que necesitan plantillas *utility* aprobadas por Meta. Ya están armados como plantilla + variables. El mismo sistema funciona por SMS cambiando la pieza del canal (P31e).

## Stack técnico

n8n (self-hosted, Docker) · Twilio WhatsApp (sandbox) · Google Calendar API · Google Sheets API · Claude API (solo en la asistente de P31, para las respuestas) · Cloudflare Tunnel

| Workflow | Función |
|---|---|
| `p33a-appointment-reminders.json` | Programador: elige recordatorios, llena la plantilla, envía y registra |
| `../02-whatsapp-ai-agent-booking/p31b-whatsapp-inbound.json` | Actualizado: acción nueva `confirm` para respuestas a un recordatorio |
| `../02-whatsapp-ai-agent-booking/p31g-booking.json` | Actualizado: op `confirm` (estado + evento verde); reprogramar le quita el verde |

Reutiliza de P31: `P31e Send WhatsApp`, `P31b WhatsApp Inbound`, `P31g Booking`. Todos los IDs y credenciales de los JSON son placeholders (`YOUR_...`).

## Aprendizajes técnicos

- **Sin IA donde una plantilla es mejor.** Los recordatorios son transaccionales (plantillas *utility* de Meta). Texto fijo + variables es gratis, instantáneo, no puede inventar una hora y es justo lo que Meta aprueba. La IA solo se usa donde aporta: entender la respuesta de la clienta.
- **Una sola puerta para las respuestas de WhatsApp.** Las respuestas a los recordatorios pasan por la misma asistente (P31b) que ya reprograma y cancela, así que "sí", "¿mejor a las 3 p. m.?" o "estoy enferma, cancélala" funcionan solos. El recordatorio queda en el historial, así la asistente sabe qué le están respondiendo.
- **Un "sí" no siempre es una confirmación.** El prompt separa el "sí" a un recordatorio (`confirm`) del "sí" a una pregunta de cita nueva (`book`).
- **Ronda = hora de inicio de la cita.** Guardar el inicio para el que se mandó cada recordatorio hace que una reprogramación arranque una cascada nueva, sin columnas extra ni reinicios.
- **Solo el último paso, y nunca justo después de un cambio.** Los pasos que no salieron se saltan (nada de ráfagas después de una caída), y también el paso cuya hora pasó antes de que agendara o confirmara.
- **n8n-mcp + ramas de un IF.** `addConnection` con `sourceOutput: "true"` en un IF guardó una salida inexistente y la ejecución se detenía en silencio en el IF; hay que usar `branch: "true"` y revisar la estructura.
- **Colores de Google Calendar.** `colorId: '10'` pone el evento en verde; para quitarlo en un PATCH se manda `colorId: null` (con texto vacío responde 400).
