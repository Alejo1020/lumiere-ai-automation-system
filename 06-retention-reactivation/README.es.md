# Retención y reactivación de clientas (Lumière Aesthetics)

[🇬🇧 English](README.md) | 🇪🇸 Español

> Parte del portafolio **Lumière Aesthetics** (P30–P36): un med spa ficticio en Old Town Scottsdale, Arizona, construido como si fuera un cliente que paga.
> P30 captura el lead, P31 atiende y agenda por WhatsApp, P32 recupera leads que se quedaron callados, P33 se asegura de que las citas se cumplan y P34 pide la calificación y la reseña. **P35 trae de vuelta a las clientas sin pagar publicidad**: un recordatorio de retoque cuando le toca su tratamiento (botox cada ~3 meses, HydraFacial cada mes…) y un "te extrañamos" con una oferta de bienvenida cuando lleva tiempo sin venir. Si responde "sí", la misma asistente de WhatsApp la agenda ahí mismo.

---

## Problema

Un med spa paga por ganar cada clienta nueva (anuncios, consulta gratis, $50 de crédito). La ganancia está en las que vuelven, y casi todos los spas lo dejan al azar.

- **Nadie le avisa que ya le toca.** El botox dura 3-4 meses, el HydraFacial es mensual, el láser y el microneedling van por sesiones. Las clientas vuelven "cuando se acuerdan", o se van con el spa que les escribió primero.
- **Las inactivas se pierden en silencio.** No hay una lista de quién dejó de venir ni tiempo para escribirles una por una.
- **Las ofertas le llegan a quien no es.** Cuando hay promo se manda a todas, incluso a la que acaba de quejarse.

Números de ejemplo para un spa como Lumière (~350 clientas atendidas, ticket promedio ~$450): cerca del 40 % de las clientas de botox se pasa de los 4 meses o no vuelve. Recuperar **8-10 visitas al mes = ~$3.600-4.500/mes** de ingresos sin gastar en anuncios, más ~1 hora a la semana que la recepción deja de gastar en "habría que llamarla".

## Solución

Un workflow nuevo de n8n más una regla nueva en la asistente de WhatsApp construida en P31. Los mensajes de salida son plantillas fijas (sin IA); Claude solo entiende la respuesta y agenda.

```
P35a Retention (cada minuto)
  Read All Sheets (1 batchGet: Leads, Citas, Seguimientos, Calificaciones, Conversaciones, Escalamientos, Negocio, Servicios)
  → Pick Due Messages: según su ÚLTIMA visita, a quién le toca qué mensaje ahora (y por qué a las demás no)
  → Build Message: plantilla fija estilo Meta, en español o inglés; el texto de la oferta sale de la hoja Negocio
  → WhatsApp con P31e  |  respaldo por email con P32c si el WhatsApp falló
  → Log en Seguimientos (secuencia, ronda = su última visita, paso, canal)

Responde por WhatsApp → P31b (de P31) ve "RETENTION MESSAGE" en su estado en vivo
  "Sí, quiero volver"      → es clienta que vuelve: ¿qué tratamiento? → horarios libres → confirma → agenda (P31g)
  "No, gracias"            → una frase cálida, sin insistir
  "¿Cómo aplico los $50?"  → repite la oferta exacta; el equipo la aplica en la visita (nunca inventa otra)
```

| Secuencia | Cuándo (producción) | Plantilla |
|---|---|---|
| `retoque` | Fin de la visita + `retoque_dias` del servicio (botox 90, HydraFacial 30, rellenos 270…) | "Ya van 3 meses desde tu botox, es el mejor momento para tu retoque. ¿Te busco un horario?" |
| `reactivacion` | 120 días sin venir (`dias_reactivacion`); en retoques largos, retoque + 30 días | "Te extrañamos" + `oferta_reactivacion` (ej. $50 de crédito si agenda en 14 días) |
| `recordatorio` | 7 días después de cualquiera de las dos, solo si no respondió | Un seguimiento corto |

**La dueña lo maneja desde el Sheet, no desde el código:** días de retoque por servicio (`Servicios.retoque_dias`), el umbral de inactividad y el texto de la oferta en español e inglés (`Negocio`). Oferta vacía = mensaje sin oferta.

**Reglas para no ser invasivos:** máximo un seguimiento por mensaje; nada si tiene una cita próxima, se dio de baja o tiene un caso abierto con el equipo; mínimo 14 días desde cualquier otro mensaje automático (nurturing, recordatorios, post-servicio); **sin oferta si calificó su última visita con 1-3**; en producción solo de lunes a sábado de 10 a. m. a 7 p. m. Una visita nueva arranca una ronda nueva sola. Si el WhatsApp falla (status callback de Twilio), la invitación sale una vez por email con la plantilla de Lumière. Un interruptor `DEMO_MODE` convierte días en minutos para demos en vivo.

## Resultado de negocio

Probado en vivo con Twilio WhatsApp (modo demo):

| Qué pasó | Resultado |
|---|---|
| Clienta inactiva desde su última visita | "Te extrañamos" + oferta de $50, registrado una vez |
| 5 min sin respuesta | Un seguimiento con la oferta, y nada más |
| Respondió "Sí, quiero volver" | La asistente repitió la oferta exacta y preguntó el tratamiento (sugirió el que le interesaba) |
| "Botox" → "el lunes 26 a las 10 am" → "Sí" | Agendada en Google Calendar + Citas en ~3 minutos de chat, sin intervención humana |
| "¿Cómo aplico los 50?" | "El equipo lo aplica en tu visita", sin inventar condiciones |
| Siguiente corrida | Ya tiene cita → el sistema deja de escribirle |
| Retoque y reactivación a un número inválido (63015) | La misma invitación salió por email al minuto, sin duplicados |
| Pruebas de lógica | 35/35 casos simulados (días de demo y de producción, silencio, respondió, baja, caso abierto, cita próxima, toque reciente, nota baja, rellenos vs. 120 días, domingo/noche…) |

Costo por mensaje: **$0 de IA** en las plantillas de salida; leer la respuesta es una llamada corta a Claude (< $0,02).

## Cómo se vende

**Pitch (a la dueña de un med spa):**
> "¿Cuántas de tus clientas de botox ya pasaron sus 4 meses, y cuántas van a agendar en el spa de la esquina? Esto le escribe por WhatsApp a cada clienta la semana en que le toca su retoque, y a las que dejaron de venir con tu oferta de bienvenida. Si dice que sí, la asistente la agenda ahí mismo. Diez clientas de vuelta al mes son unos $4.500, sin gastar un dólar en anuncios, y la oferta la cambias en una hoja de cálculo, sin llamarme."

- **Cliente objetivo:** med spas, clínicas estéticas y dentales, salones, barberías, fisioterapia: cualquier negocio con tratamientos que se repiten.
- **Precio (propuesta, por validar):** setup **$1.000-1.500** + retainer **$300-500/mes**. Se vende solo (con cualquier historial de citas) o como parte del sistema completo de Lumière (P36), donde "clientas que volvieron" alimenta el informe mensual de ROI de la dueña.
- **Nota de producción:** son mensajes de marketing fuera de la ventana de 24 h de WhatsApp, así que necesitan plantillas de *marketing* aprobadas por Meta y baja clara; ya están construidos como plantilla + variables. El mismo sistema funciona por SMS cambiando la pieza de canal (P31e).

## Stack técnico

n8n (self-hosted, Docker) · Claude API (Sonnet, solo para leer la respuesta y agendar) · Twilio WhatsApp (sandbox) · Google Calendar · Gmail (respaldo por email) · Google Sheets API · Cloudflare Tunnel

| Workflow | Rol |
|---|---|
| `p35a-retention.json` | Programador: elige retoque / reactivación por clienta, llena la plantilla, envía (WhatsApp o email de respaldo) y registra |
| `../02-whatsapp-ai-agent-booking/p31b-whatsapp-inbound.json` | Actualizado: regla de retoque / te extrañamos y "RETENTION MESSAGE" (con la oferta exacta) en el estado en vivo; las claves de la oferta quedan fuera de los datos generales |

Reutiliza: `P31e Send WhatsApp`, `P32c Send Email`, `P31b WhatsApp Inbound`, `P31d Client Context`, `P31g Booking`. Todos los IDs y credenciales de los JSON son placeholders (`YOUR_...`).

## Aprendizajes técnicos clave

- **La última visita es la ronda.** Cada mensaje cuelga de su última visita atendida (`ronda = inicio de la visita`). Una visita nueva arranca un ciclo nuevo sin columnas extra ni marcas que resetear.
- **Retoques largos vs. inactividad.** Con un umbral fijo de 120 días, una clienta de rellenos (retoque a 270 días) recibiría "te extrañamos" antes de que le tocara el retoque → reactivación = máx(120, retoque + 30).
- **La oferta vive en los datos, y solo donde se envió.** La oferta queda fuera de los datos generales de la asistente (si no, le ofrece $50 a todo el mundo) y solo aparece en el estado en vivo cuando esa clienta la recibió, copiada tal cual del mensaje. No se puede "mejorar" ni inventar.
- **Respeto entre flujos.** Un descanso de 14 días contra *cualquier* mensaje automático (nurturing, recordatorios, post-servicio) evita que las cinco secuencias se apilen sobre la misma clienta; un caso abierto o una nota baja bloquean ofertas.
- **Un workflow importado puede no estar activo de verdad.** Un workflow creado con `n8n import:workflow` aparecía activo, pero su Schedule Trigger nunca corrió (cero ejecuciones, sin error). Desactivarlo y activarlo por la API lo arregló: siempre revisar que aparezcan ejecuciones del trigger después de activar.
