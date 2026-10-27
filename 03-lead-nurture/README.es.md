# Nurturing automático para leads que no agendan (Lumière Aesthetics)

[🇬🇧 English](README.md) | 🇪🇸 Español

> Parte del portafolio **Lumière Aesthetics** (P30–P36): un med spa ficticio en Old Town Scottsdale, Arizona, construido como si fuera un cliente que paga.
> P30 captura el lead y P31 atiende y agenda por WhatsApp. **P32 recupera a las clientas que se quedaron calladas sin agendar**: una secuencia corta y personalizada por WhatsApp (o un correo con la marca si el WhatsApp falló) que se detiene sola apenas responde, agenda, se da de baja o un mensaje rebota.

---

## Problema

La mayoría de los leads de un med spa no agenda en la primera conversación. Preguntan un precio, dicen "lo pienso" y desaparecen.

- **Nadie hace seguimiento.** La recepción está ocupada con las clientas que tiene enfrente; hacerle seguimiento a mano al 60–70 % de los leads nunca pasa de forma constante.
- **Cuando alguien lo hace, es genérico.** "¡Hola, solo para saber!" ignora lo que la clienta preguntó y se siente como spam.
- **Un seguimiento mal hecho cuesta más de lo que trae.** Escribirle a quien ya agendó, a quien dijo que no le escribieran o a un número que no funciona daña la marca y la reputación del remitente.

Números de ejemplo para un spa como Lumière (~120 leads/mes, ticket promedio ~$450): si el 60–70 % no agenda el primer día y el nurturing recupera el 10–15 %, son **~10 citas extra ≈ $4.500/mes** que hoy se pierden, más ~5 horas/semana que la recepción gastaría haciéndolo a mano.

## Solución

Tres workflows de n8n. P32 reusa las piezas compartidas de P31 (contexto de la clienta, canal de WhatsApp, agendamiento) y agrega un canal de email compartido que van a usar P34 y P35.

```
P32a Nurture Sequences (cada minuto)
  Read All Sheets (1 batchGet: Leads, Conversaciones, Citas, Escalamientos, Seguimientos, Negocio)
  → Pick Due Touches: quién se quedó callada, qué secuencia, ronda y paso, y quién debe parar (y por qué)
  → P31d Client Context (su chat, su tratamiento, datos del spa)
  → Claude Sonnet escribe UNA línea personalizada {{3}} (o asunto + cuerpo en email)
  → Parse Touch: JSON inválido, muy largo, un número o link que no está en los datos del spa → texto de respaldo
  → WhatsApp → P31e Send WhatsApp (plantilla estilo Meta: texto fijo + {{1}} nombre, {{2}} tratamiento, {{3}} Claude)
    email    → P32c Send Email (HTML con la marca, pie legal, link de baja)
  → Log to Seguimientos (una fila por toque)

P32b Email Unsubscribe   GET muestra un botón (los filtros abren los links) · POST deja el lead en opt_out
Ella responde por WhatsApp → P31b (de P31) contesta con todo el historial, incluidos los toques, y agenda.
```

**Secuencias (4 toques cada una):** qué esperar en la primera visita → su duda u objeción → una pregunta frecuente con su respuesta → una última invitación sin presión.

| Secuencia | A quién | Tiempos (producción) |
|---|---|---|
| `wa_sin_respuesta` | recibió el primer WhatsApp y nunca respondió | D+1, D+3, D+7, D+14 |
| `wa_sin_agendar` | conversó con la asistente pero no agendó | D+1, D+3, D+7, D+14 |
| `email_recuperacion` | el WhatsApp no se pudo entregar y tiene email | D+0, D+2, D+5, D+10 |

**Se detiene sola cuando:** responde (la atiende P31), agenda, la escalan a una persona, se da de baja (WhatsApp o email) o un toque falla (status callback de Twilio). Si responde y se vuelve a callar, arranca una segunda ronda (máximo 2 por WhatsApp, 1 por email). En producción solo envía de 9 a. m. a 7 p. m. hora del spa, nunca en domingo, máximo 20 toques por corrida. El interruptor `DEMO_MODE` cambia días por minutos para las demos en vivo.

**Sin columnas de secuencia en la base de datos.** El estado de cada secuencia se *deduce* de dos hojas: el último mensaje real en `Conversaciones` es el ancla y los toques posteriores en `Seguimientos` son la ronda actual. No hay nada que mantener sincronizado ni que reiniciar.

## Resultado de negocio

Probado de punta a punta en condiciones reales (Twilio WhatsApp + Gmail + Google Calendar):

| Qué pasó | Resultado |
|---|---|
| El lead nunca respondió | 4 toques personalizados, cada 5 min en modo demo, cada uno con un ángulo distinto |
| Respondió a un toque | La asistente contestó con los toques en contexto; el nurturing paró |
| Se volvió a quedar callada | La ronda 2 arrancó sola con una plantilla de "retomo nuestra conversación" |
| Agendó | Cita en Google Calendar; P32 no le volvió a escribir |
| Un lead de email se dio de baja | Un clic + confirmar → `opt_out`; el siguiente correo nunca salió |
| Toque no entregado (error 63015) | La secuencia paró en la corrida siguiente |
| Salida de Claude | 0 respaldos en las pruebas; precios y datos siempre tomados del Sheet del spa |

Costo: ~2.000 tokens de entrada por toque, casi todos en caché → **menos de $0,01 por toque**.

## Cómo se vende

**Pitch (a la dueña de un med spa):**
> "La mayoría de las personas que preguntan por un tratamiento no agendan ese día, y nadie de tu equipo tiene tiempo de perseguirlas. Este sistema lo hace por ti: unos pocos mensajes cortos y personales durante las dos semanas siguientes, usando lo que cada persona preguntó de verdad, y se detiene en el segundo en que responde o agenda. Si 10 de esos leads vuelven cada mes, son unos $4.500 que hoy estás dejando sobre la mesa."

- **Cliente objetivo:** med spas, clínicas estéticas y dentales, cualquier negocio de citas que recibe leads que no convierte el primer día.
- **Precio (propuesta, por validar):** setup **$1.000–2.200** + retainer **$350–700/mes** ("recuperación de clientes" en el menú de servicios). Se vende solo o dentro del sistema completo de Lumière (P36).
- **Nota de producción:** los mensajes fuera de la ventana de 24 h de WhatsApp necesitan plantillas aprobadas por Meta. El workflow ya arma cada toque como plantilla + variables, así que salir a producción es registrar las plantillas y enviar `ContentSid` + `ContentVariables`. El mismo sistema funciona por SMS cambiando la pieza de canal (P31e).

## Stack técnico

n8n (self-hosted, Docker) · Claude API (Sonnet, prompt caching, salida JSON) · Twilio WhatsApp (sandbox) · Gmail API · Google Sheets API · Cloudflare Tunnel

| Workflow | Rol |
|---|---|
| `p32a-nurture-sequences.json` | Programador: elige toques, Claude escribe, envía y registra |
| `p32b-email-unsubscribe.json` | Página de baja (botón con GET / baja con POST) |
| `p32c-send-email.json` | Compartido: correo HTML con la marca + pie legal (lo reusan P34/P35) |

Reusa de P31: `P31d Client Context`, `P31e Send WhatsApp`, `P31b WhatsApp Inbound` (respuestas). Todos los IDs y credenciales de los JSON son placeholders (`YOUR_...`).

## Aprendizajes técnicos clave

- **Deducir el estado, no guardarlo.** En vez de columnas `paso / próxima_fecha / estado` que se desincronizan, el estado de la secuencia se calcula en cada corrida desde `Conversaciones` (ancla = último mensaje que no es de nurturing) y `Seguimientos` (toques después del ancla). Las respuestas, las citas y las rondas nuevas no necesitan escrituras extra.
- **Sin ráfagas después de una caída.** Un toque toca cuando pasó *ancla + paso* **y** se respeta el espacio desde el toque anterior; si n8n estuvo apagado horas, no dispara tres toques seguidos.
- **Claude escribe una variable, no el mensaje.** Los toques de WhatsApp son plantillas estilo Meta; Claude solo llena `{{3}}` (≤160 caracteres). La validación rechaza cualquier número que no esté en los datos del spa, cualquier link, JSON inválido o respuesta cortada, y usa un texto de respaldo.
- **Los toques anteriores van en el prompt.** Sin ellos Claude repetía el mismo ángulo (lección de la v1). Ahora cada toque ve los anteriores y el chat reciente; un toque de segunda ronda retoma donde quedó la conversación y nunca propone horarios (la disponibilidad pudo cambiar).
- **Un link de baja nunca actúa con GET.** Los filtros de seguridad del correo abren los links solos; el GET solo muestra un botón y el POST da la baja.
- **IF v2 + campo que no existe.** `boolean → is not true` sobre un campo ausente mandó el item a la rama *false*. Fix: convertir en la expresión (`{{ $json.lead_id ? true : false }}`) y usar `is true`.
- **Toda configuración nueva del negocio la ve el agente.** El agente de P31 convierte cualquier fila extra de la hoja `Negocio` en un dato que puede decir; las claves técnicas (como el WhatsApp de los botones del correo) hay que agregarlas a su lista interna.
