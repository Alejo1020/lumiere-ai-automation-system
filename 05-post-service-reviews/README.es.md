# Post-servicio y reputación online (Lumière Aesthetics)

[🇬🇧 English](README.md) | 🇪🇸 Español

> Parte del portafolio **Lumière Aesthetics** (P30–P36): un med spa ficticio en Old Town Scottsdale, Arizona, construido como si fuera un cliente que paga.
> P30 captura el lead, P31 atiende y agenda por WhatsApp, P32 recupera a los leads que se quedan callados, P33 asegura que las clientas lleguen. **P34 se encarga de lo que pasa después de la cita**: un agradecimiento y una nota del 1 al 5 por WhatsApp. A las clientas contentas les llega el link de reseña en Google; las molestas llegan a la dueña en privado antes de que el problema se vuelva una reseña pública. A quien no llegó, un amable "te extrañamos, ¿reagendamos?".

---

## Problema

Para un med spa, las reseñas de Google son la vitrina: las clientas nuevas comparan estrellas y cantidad de reseñas antes de llamar.

- **Las clientas contentas no dejan reseña.** La recepción pide "¡déjanos una reseña!" al cobrar, cuando se acuerda; salen 2-3 reseñas al mes mientras la competencia tiene cientos.
- **Las molestas sí la dejan, en público.** Una o dos reseñas malas al mes aparecen antes de que la dueña sepa que algo salió mal.
- **Los no-shows se olvidan.** Después de los recordatorios (P33) algunas clientas igual faltan, y nadie las llama para reagendar.

Números de ejemplo para un spa como Lumière (~80 citas/mes, ~74 atendidas, ticket promedio ~$450): si cerca de la mitad responde la nota (~37), ~31 quedan contentas y reciben el link y ~35 % deja la reseña → **~11 reseñas/mes en vez de 2-3**; **~5 notas bajas al mes atajadas en privado**; recuperar 2 de ~5 no-shows → **~$900/mes**; y ~2 horas/semana que la recepción deja de gastar pidiendo reseñas y persiguiendo no-shows.

## Solución

Dos workflows nuevos de n8n más una acción nueva `rate` en la asistente de WhatsApp construida en P31. Los mensajes que salen son plantillas fijas (sin IA); Claude solo se usa para entender la respuesta.

```
P34a Post-Service (cada minuto)
  Read All Sheets (1 batchGet: Leads, Citas, Seguimientos, Calificaciones, Conversaciones, Escalamientos, Negocio, Servicios)
  → Pick Due Messages: a quién le toca qué mensaje ahora (y por qué a las demás no)
  → Build Message: plantilla fija estilo Meta, en español o inglés
  → WhatsApp por P31e  |  email de respaldo por P32c si el WhatsApp falló
  → Log to Seguimientos (cita_id, paso, canal)

Ella responde por WhatsApp → P31b (de P31) lee la nota (Claude)
  "Me fue súper bien" (sin número) → la asistente pide un número del 1 al 5
  "5"                              → rate → P34b Rating
P34b Rating
  → fila en Calificaciones
  → 4-5: respuesta fija con el link de reseña en Google
  → 1-3: disculpa + "¿qué pasó?", caso en Escalamientos (queja), alerta por WhatsApp a la dueña;
         la asistente se calla y le reenvía al equipo sus siguientes mensajes hasta que cierren el caso
```

| Paso | Cuándo (producción) | Plantilla |
|---|---|---|
| `gracias` | 2 h después de una cita marcada `asistio` | Agradecimiento + "responde con un número del 1 al 5" |
| `recordatorio_nota` | 24 h después, solo si no dijo nada | Un solo recordatorio de la nota |
| `te_extranamos` | 2 h después de una cita marcada `no_asistio` | "Te extrañamos, ¿te busco otro horario?" (la asistente reagenda) |

**Reglas para que sea respetuoso:** máximo un recordatorio; nada si ya calificó, ya reagendó, se dio de baja o tiene un caso abierto con el equipo; citas de hace más de 3 días se ignoran; en producción solo de 9 a. m. a 8 p. m. hora del spa; si el WhatsApp falla (status callback de Twilio) el mismo mensaje sale una vez por email con la plantilla de Lumière. Cualquiera puede dejar reseña: el sistema solo decide **cuándo** pedirla; nada se paga ni se filtra. Un interruptor `DEMO_MODE` convierte horas en minutos para demos en vivo.

## Resultado de negocio

Probado en vivo con Twilio WhatsApp (modo demo):

| Qué pasó | Resultado |
|---|---|
| Cita marcada `asistio` | Agradecimiento + pedido de nota, registrado una sola vez |
| 5 min de silencio | Un recordatorio de la nota y nada más |
| Respondió "Me fue súper bien, me encantó" | La asistente pidió el número (nunca lo adivina) |
| Respondió "5" | Link de reseña en Google en ~7 s; nota guardada con su comentario |
| Respondió "2, me hicieron esperar mucho" | Disculpa sin link + alerta "⭐ LOW RATING 2/5" a la dueña por WhatsApp + caso de queja abierto, en el mismo segundo |
| Volvió a escribir con el caso abierto | La asistente no respondió; el mensaje se reenvió al equipo |
| WhatsApp a un número inválido (63015) | El mismo mensaje salió por email al minuto siguiente, sin duplicados (caminos de agradecimiento y no-show) |
| Pruebas de lógica | 25/25 casos simulados (silencio, respondió, ya calificó, baja, caso abierto, reagendó, entrega fallida, fuera de horario…) |

Costo por mensaje: **$0 de IA** en las plantillas; leer la respuesta es una llamada corta a Claude (< $0,02).

## Cómo se vende

**Pitch (a la dueña de un med spa):**
> "¿Cuántas clientas contentas se fueron el mes pasado sin dejar reseña, y cuántas molestas la dejaron antes de que pudieras arreglarlo? Después de cada cita, esto le agradece a la clienta por WhatsApp y le pide una nota rápida del 1 al 5. Las contentas reciben tu link de reseña en Google en ese momento, cuando están felices. Si alguien pone un 2, te llega una alerta por WhatsApp al instante y hablas con ella en privado antes de que se vuelva una reseña pública. Y a quien faltó a su cita le llega un amable '¿reagendamos?'. Pasar de 2 a 11 reseñas al mes y recuperar dos no-shows lo paga varias veces."

- **Cliente objetivo:** med spas, clínicas estéticas y dentales, salones, cualquier negocio de citas que viva de sus reseñas en Google.
- **Precio (propuesta, por validar):** setup **$700-1.200** + retainer **$200-400/mes**. Se vende solo (con cualquier agenda que pueda marcar "asistió") o como parte del sistema completo de Lumière (P36), donde las reseñas y las quejas atajadas alimentan el informe mensual de ROI de la dueña.
- **Nota de producción:** los mensajes post-cita salen fuera de la ventana de 24 h de WhatsApp, así que necesitan plantillas aprobadas por Meta; ya están armadas como plantilla + variables. El mismo sistema funciona por SMS cambiando la pieza de canal (P31e). El link de reseña es el de "escribir una reseña" del Google Business Profile de la clínica.

## Stack técnico

n8n (self-hosted, Docker) · Claude API (Sonnet, solo para leer la respuesta) · Twilio WhatsApp (sandbox) · Gmail (respaldo por email) · Google Sheets API · Cloudflare Tunnel

| Workflow | Función |
|---|---|
| `p34a-post-service.json` | Programador: elige a quién le toca qué mensaje, llena la plantilla, envía (WhatsApp o email de respaldo) y registra |
| `p34b-rating.json` | Pieza compartida: guarda la nota; 4-5 → link de reseña, 1-3 → disculpa + caso + alerta a la dueña |
| `../02-whatsapp-ai-agent-booking/p31b-whatsapp-inbound.json` | Actualizado: acción nueva `rate`, "cita por calificar" en el estado en vivo |
| `../02-whatsapp-ai-agent-booking/p31d-client-context.json` | Actualizado: también devuelve la cita por calificar y sus notas anteriores |

Reutiliza: `P31e Send WhatsApp`, `P32c Send Email`, `P31b WhatsApp Inbound`, `P31d Client Context`. Todos los IDs y credenciales de los JSON son placeholders (`YOUR_...`).

## Aprendizajes técnicos clave

- **Plantillas fijas al salir, IA solo al entrar.** El agradecimiento, el recordatorio y el "te extrañamos" son plantillas: gratis, instantáneas y justo lo que Meta aprueba. Claude solo lee la respuesta, y el seguimiento (link o disculpa) también es un mensaje fijo, así el link nunca sale mal.
- **Nunca adivinar la nota.** "Me encantó" no es un 5. La asistente pide el número una vez, y el parser solo acepta un entero del 1 al 5 cuando de verdad hay una cita esperando nota.
- **Una nota baja no es un escalamiento normal.** "2, me hicieron esperar" se guarda como nota *y* abre un caso de queja desde la pieza de calificación, así la dueña recibe la nota, el comentario y el contexto en una sola alerta.
- **Reutilizar la regla "caso abierto = silencio".** Después de una nota baja la asistente deja de responder y le reenvía al equipo sus mensajes: el mismo mecanismo de escalamiento de P31, sin lógica nueva.
- **Respaldo por email a partir del estado de entrega.** La decisión lee el status callback de Twilio (`failed / undelivered`) en el registro del chat; un WhatsApp fallido se vuelve un email al minuto siguiente, y solo una vez.
- **Los sub-workflows tienen que estar publicados.** Llamar a uno sin publicar falla con "Workflow is not active and cannot be executed"; las piezas compartidas se publican aunque no tengan disparador propio.
- **El historial viejo se puede colar en las respuestas.** Una prueba que movió una cita a mano dejó una hora vieja en el historial y la asistente la "corrigió" sin que nadie preguntara; el prompt ahora dice que responda solo lo del último mensaje.
