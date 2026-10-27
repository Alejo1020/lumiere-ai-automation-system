# Sistema completo + reportes a la dueña + oficina de IA (Lumière Aesthetics) 🏆

[🇬🇧 English](README.md) | 🇪🇸 Español

> Insignia del portafolio **Lumière Aesthetics** (P30–P36): un med spa ficticio en Old Town Scottsdale, Arizona, construido como si fuera un cliente que paga.
> P30 captura el lead, P31 atiende y agenda por WhatsApp, P32 recupera a los leads que se quedan callados, P33 se asegura de que las clientas lleguen, P34 pide la calificación y la reseña, P35 hace volver a las clientas. **P36 une los seis en un solo sistema y demuestra su valor en plata cada semana y cada mes**, y suma una "oficina de IA" en pixel art para mostrarlo funcionando en vivo en una llamada de ventas.
>
> 💬 **WhatsApp o SMS:** la demo corre por WhatsApp, pero todos los mensajes salen por un solo bloque de envío compartido, así que el mismo sistema funciona por SMS (Twilio) sin cambiar la lógica.

**Demo en vivo:** https://lumiere-office.pages.dev (simulación de un mes de demostración) · `?mode=live` muestra los eventos del sistema real.

---

## Problema

La dueña de un med spa que compra automatización termina pagando varios retainers y no tiene cómo saber si le rinden.

- **No hay números.** Nadie le dice cuántos leads se atendieron a las 11 p. m., cuántas citas se agendaron sin recepcionista ni cuántas inasistencias se evitaron. Se le van 1-2 horas a la semana mirando la agenda y el WhatsApp para "más o menos saber cómo vamos".
- **Las alertas llegan tarde o nunca.** Una queja, una pregunta médica o una falla del sistema le deberían llegar en minutos, y solo esas, no 50 notificaciones al día.
- **El retainer es el primer gasto que se corta.** Si el valor no se ve cada mes, el servicio se cancela en el primer mes flojo.

## Solución

Cinco workflows nuevos de n8n encima de P30–P35, más cambios pequeños en los que ya existían. Cada flujo emite sus hitos con un solo formato; los reportes leen el mismo Google Sheet que escriben los agentes; la dueña edita los supuestos.

```
Cada flujo (P30, P31b, P31g, P32a, P33a, P34a, P34b, P35a, Error Alert)
  └─ hito → P36a Office Event → hoja Eventos  (lead llega, cita, toque enviado, recordatorio confirmado,
                                                reseña, clienta que vuelve, escalamiento, error)

Dueña, en el momento (WhatsApp, solo cuando debe actuar)
  escalamiento (P31b) · nota baja (P34b) · falla del sistema (Error Alert: sin tecnicismos, máx. 1 por flujo cada 30 min)

Dueña, cada lunes 8 a. m. (WhatsApp, 30 segundos)       Dueña, día 1 de cada mes (correo con la marca)
  P36b Weekly Summary                                    P36c Monthly ROI
    → P36d Metrics (un solo juego de números)              → P36d Metrics (mes vs. mes calendario anterior)
    → plantilla fija, sin líneas en cero                   → Sonnet escribe una nota de 3 frases; todo número que
    → P31e WhatsApp                                          escriba debe existir en los datos, si no, nota fija
                                                           → 6 tarjetas, mes contra mes, "cómo lo calculamos"
                                                           → P32c email (modo interno)

Demo en vivo: oficina de IA (Cloudflare Pages)
  simulación: repite un mes de demostración en ~4 minutos, sin n8n, sin tokens, sin mensajes
  en vivo: consulta P36e Office Feed (webhook de solo lectura, solo nombres de pila, números en caché 5 min)
```

**Cómo se calcula el valor (`P36d`, la dueña lo ve en el correo):**

| Concepto | Fórmula | Fuente |
|---|---|---|
| Horas ahorradas | tareas que hizo el sistema × minutos que tardaría una persona × $/hora | Hojas + hoja `ROI` |
| No-shows evitados | visitas con recordatorio × tasa de inasistencia sin sistema (20 %) − inasistencias reales | `Citas`, `Seguimientos`, `ROI` |
| Citas recuperadas | citas agendadas después de un seguimiento (P32) o un mensaje de retoque (P35), al precio "desde" del servicio | `Citas`, `Seguimientos`, `Servicios` |
| ROI | (horas + no-shows evitados + recuperadas) ÷ retainer mensual | todo lo anterior |

Todos los supuestos viven en una hoja `ROI` que la dueña puede editar ($22/h de recepción, minutos por tarea, 20 % de no-show base, $175 por consulta, retainer). Los agentes nunca la leen.

**La oficina de IA:** seis salas con un agente de IA cada una (Recepción P30, Atención P31, Seguimiento P32, Agenda P33, Post-servicio P34, Fidelización P35), la oficina de la dueña con los números en vivo, una puerta de escalamiento con campana y un registro de eventos. Solo se animan los hitos: una clienta entra a Recepción, una tarjeta de cita vuela de Atención a Agenda, una estrella en Post-servicio, un corazón en Fidelización, suena la campana con un escalamiento. **Fuera del horario la oficina se oscurece, pero las pantallas siguen encendidas: "fuera de horario, la IA sigue atendiendo".**

## Resultado de negocio

Mes de demostración (octubre, datos generados en las mismas hojas): los números que recibe la dueña.

| | Septiembre | Octubre |
|---|---|---|
| Leads nuevos (respuesta promedio ~5 s, la mitad fuera de horario) | 95 | 122 |
| Citas agendadas por la asistente, sin recepcionista | 48 | 74 |
| Citas recuperadas (seguimiento + clientas que volvieron) | 16 | 29 |
| No-shows evitados | 8 | 15 |
| Horas de recepción ahorradas | 38 | 57 |
| **Valor estimado** | **$5,689** | **$10,761** |
| **ROI vs. un retainer de $1,800** | **3,2x** | **6,0x** |

Probado en vivo de punta a punta con Twilio WhatsApp en el sistema real: una clienta que vuelve agendó un HydraFacial en el chat (*cita* + *clienta que vuelve*), recibió el recordatorio y respondió "sí" (*recordatorio confirmado*, evento verde en Calendar), calificó 5 (*reseña pedida*) y pidió hablar con una persona (*escalamiento*: campana, alerta al equipo y la dueña, la asistente en silencio). Cada hito apareció en la oficina pública en segundos. El WhatsApp semanal y el correo mensual llegaron; la alerta de error mandó un WhatsApp y frenó el segundo.

Costo de operación: la nota mensual es una llamada a Sonnet (< $0,01); todo lo demás son plantillas fijas y lecturas del Sheet.

## Valor para el negocio

> "Cada lunes te llega un WhatsApp con la semana pasada en números: leads atendidos, citas agendadas sin tu recepcionista, inasistencias evitadas en dólares. El día 1, un correo con el valor del mes contra lo que te cuesta el sistema: este octubre fue 6 veces. Y el sistema solo te escribe cuando tienes que actuar: una queja, una pregunta médica o si algo falla. ¿Quieres verlo funcionando? Esta es tu oficina ahora mismo."

- **Para quién es:** dueñas de med spas, clínicas estéticas y dentales que tienen (o quieren) las automatizaciones de las partes 1–6.
- Los reportes convierten la automatización en números que la dueña puede revisar cada mes: qué agendó, qué ahorró y cuánto devolvió.
- **Se puede ampliar con:** un asistente de la dueña por WhatsApp ("¿cuántas citas tengo mañana?", "¿cómo vamos vs. el mes pasado?") sobre el mismo Sheet y Calendar.

## Stack técnico

n8n (self-hosted, Docker) · Claude API (Sonnet: nota mensual; la asistente de P31) · Twilio WhatsApp (sandbox) · Gmail · Google Sheets API · Google Calendar · Cloudflare Pages (oficina) · Cloudflare Tunnel · HTML/CSS/JS + Canvas sin frameworks

| Archivo | Rol |
|---|---|
| `p36a-office-event.json` | Pieza compartida: un hito → hoja `Eventos` (8 tipos conocidos, nunca rompe al que la llama) |
| `p36b-weekly-summary.json` | WhatsApp del lunes 8 a. m. a la dueña (`DEMO_MODE` = Sheet demo + semana fija) |
| `p36c-monthly-roi.json` | Correo de ROI del día 1 con la marca; nota de Sonnet validada contra los datos |
| `p36d-metrics.json` | Pieza compartida: todos los números de los reportes para un rango + el anterior |
| `p36e-office-feed.json` | Webhook GET de solo lectura para la oficina en modo en vivo |
| `../01-lead-capture/p30-error-alert.json` | Monitor de errores: correo a quien mantiene el sistema + WhatsApp sin tecnicismos a la dueña (con límite) + evento |
| `../01-lead-capture/p30-lead-capture.json` | Captura de leads, ahora con su nodo de evento |
| `office/` | La página de la oficina de IA (simulación + en vivo) |

Actualizados en sus propias carpetas: `p31b` (eventos de escalamiento y clienta que vuelve, copia a la dueña), `p31g` (eventos de cita y confirmación), `p32a` · `p33a` · `p34a` · `p35a` (eventos de toques), `p32c` (modo interno para reportes a la dueña: sin link de baja), `p34b` (evento de reseña o escalamiento, alerta a la dueña + equipo). Todos los IDs y credenciales en los JSON son placeholders (`YOUR_...`).

## Aprendizajes técnicos clave

- **Un sub-workflow devuelve la salida de su ÚLTIMO nodo.** Una rama paralela de "emitir evento" en un sub-workflow de agendamiento podía cambiar lo que recibe quien lo llama. Solución: poner el nodo Execute Workflow de "dispara y sigue" *en línea*; con "esperar al sub-workflow" apagado deja pasar sus items de entrada.
- **El texto de IA en un reporte de números se verifica, no se confía.** Claude solo recibe números ya formateados y cada número de su párrafo debe existir en esos datos (normalizando $, comas, %, x); un "$12,500" inventado cae a una nota fija.
- **Alertar sin inundar.** El monitor de errores usa la hoja `Eventos` como memoria: máximo un WhatsApp a la dueña por workflow cada 30 minutos, sin contar el evento de su propia ejecución (que se escribe en paralelo).
- **Los meses se comparan como meses.** "Los mismos días hacia atrás" compara 1-31 de octubre con 31 ago-30 sep; un mes completo se compara con el mes calendario anterior y cuesta un retainer entero.
- **Los datos demo necesitan un buen generador aleatorio.** Un LCG simple daba sorteos correlacionados: una probabilidad de inasistencia del 8 % salió 1 vez en 148 visitas. Mulberry32 lo arregló; siempre revisar los totales generados contra las tasas esperadas.
- **Relojes simulados vs. cuadros perdidos.** Si el reloj usa el delta limitado de la animación, una pestaña en segundo plano frena todo el mes; el tiempo real mueve el reloj y el delta limitado mueve los sprites.
- **El Error Workflow no corre en ejecuciones por CLI** (`n8n execute`): para probarlo hace falta un webhook temporal activo que falle a propósito.
