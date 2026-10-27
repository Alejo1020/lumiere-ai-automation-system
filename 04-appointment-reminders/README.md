# Appointment Reminders & No-Show Prevention (Lumière Aesthetics)

🇬🇧 English | [🇪🇸 Español](README.es.md)

> Part of the **Lumière Aesthetics** portfolio (P30–P36): one fictional med spa in Old Town Scottsdale, Arizona, built as if it were a paying client.
> P30 captures the lead, P31 answers and books on WhatsApp, P32 brings back the leads who went quiet. **P33 makes sure booked clients actually show up**: a reminder cascade before every appointment where she confirms, reschedules or cancels in one message, and a cancelled slot goes straight back to the calendar.
>
> 💬 **WhatsApp or SMS:** the demo runs on WhatsApp, but every message goes out through one shared sending block, so the same system works over SMS (Twilio) without changing the logic.

---

## Problem

An empty chair is the most expensive thing in a med spa: the specialist, the room and the time are paid for whether the client comes or not.

- **No-shows are normal.** Without reminders, appointment-based clinics usually lose 15–20% of their bookings to people who simply forget.
- **Confirming by phone eats the front desk.** Calling every client the day before takes hours a week, and half the calls go to voicemail.
- **Late cancellations are lost twice.** If she cancels by not showing up, nobody else can take that slot.

Example numbers for a spa like Lumière (~80 appointments/month, average ticket ~$450): bringing no-shows from ~15–20% down to ~5–8% means **~8 chairs filled ≈ $3,600/month** of protected revenue, plus ~4 hours/week the front desk stops spending on confirmation calls.

## Solution

One new n8n workflow plus a new `confirm` action in the shared pieces built in P31. Reminders are fixed templates (no AI), so they cost nothing beyond the message itself.

```
P33a Appointment Reminders (every minute)
  Read All Sheets (1 batchGet: Leads, Citas, Seguimientos, Negocio, Servicios)
  → Pick Due Reminders: which appointment needs which step right now (and why the others don't)
  → Build Reminder: fixed Meta-style template, Spanish or English, "today / tomorrow / weekday", time, service, address
  → P31e Send WhatsApp (logs it in the chat history, so the assistant sees it)
  → Log to Seguimientos (cita_id, round = appointment start, step)

She replies on WhatsApp → P31b (built in P31): the assistant reads the reminder in the history
  "Yes, I'll be there"   → confirm    → P31g: Citas = confirmada + event turns green in Google Calendar
  "Can we move it?"      → reschedule → P31g: real free slots, same event moved
  "I can't make it"      → cancel     → P31g: event deleted, the slot is free again
```

| Step | When (production) | Template |
|---|---|---|
| `48h` | 48 h before | `confirmar` — reminder + "reply YES to confirm, or tell me if you need to change it" |
| `24h` | 24 h before | `confirmar` (only if she has not confirmed yet) |
| `2h` | 2 h before | `te_esperamos` if confirmed (address + parking) · `ultimo_aviso` if not |

**Rules that keep it from being annoying:** only the latest due step is sent (if n8n was down, she never gets two reminders in a row); a step is skipped if she booked, rescheduled or confirmed after its time; a rescheduled appointment starts a new cascade; opted-out clients get nothing; production sends only 8 a.m.–8 p.m. spa time. A `DEMO_MODE` switch turns 48 h / 24 h / 2 h into 15 / 10 / 5 minutes for live demos.

## Business Result

Tested live with Twilio WhatsApp + Google Calendar (demo mode):

| What happened | Result |
|---|---|
| Appointment 15 min away | Reminder 1 sent at the exact minute, logged once |
| 10 min away, no answer yet | Reminder 2 sent, no duplicates in later runs |
| She replied "Sí, ahí estaré" | Assistant confirmed in ~12 s; appointment `confirmada`, event green in the owner's calendar |
| 5 min away, already confirmed | Friendly "we'll see you today" with address and parking (no "please confirm" again) |
| Delivery | Every message `delivered` / `read` via Twilio status callback |
| Logic tests | 16/16 simulated cases (bursts, reschedule, late booking, opt-out, quiet hours…) |

Cost per reminder: **$0 in AI** (fixed templates) — only the WhatsApp/SMS message fee.

## Business Value

> "How many chairs sat empty last month because someone forgot? This sends every client a short reminder before her appointment; she confirms, moves it or cancels with one message, and the freed slot goes back on your calendar right away. You see who confirmed in green on your phone. If it saves 8 appointments a month, that's about $3,600 — and your front desk stops calling people one by one."

- **Who it's for:** med spas, aesthetic and dental clinics, salons, any business that lives on booked appointments.
- Works alone with any calendar booking, or as part of the full system (part 7), where the no-shows it prevents show up in the owner's monthly ROI report.

## Going to Production

- Reminders go outside WhatsApp's 24-hour window, so they need Meta-approved *utility* templates. They are already built as template + variables.
- For SMS instead of WhatsApp, only the sending block changes (P31e).

## Tech Stack

n8n (self-hosted, Docker) · Twilio WhatsApp (sandbox) · Google Calendar API · Google Sheets API · Claude API (only in P31's assistant, for the replies) · Cloudflare Tunnel

| Workflow | Role |
|---|---|
| `p33a-appointment-reminders.json` | Scheduler: picks due reminders, fills the template, sends, logs |
| `../02-whatsapp-ai-agent-booking/p31b-whatsapp-inbound.json` | Updated: new `confirm` action for replies to a reminder |
| `../02-whatsapp-ai-agent-booking/p31g-booking.json` | Updated: `confirm` op (status + green event); reschedule clears the green |

Reuses from P31: `P31e Send WhatsApp`, `P31b WhatsApp Inbound`, `P31g Booking`. All IDs and credentials in the JSON files are placeholders (`YOUR_...`).

## Key Technical Learnings

- **No AI where a template is better.** Reminders are transactional (Meta *utility* templates). Fixed text + variables is free, instant, can't hallucinate a time, and is exactly what Meta approves. AI is used only where it adds value: understanding her reply.
- **One door for WhatsApp replies.** Replies to reminders go through the same assistant (P31b) that already reschedules and cancels, so "yes", "can we do 3 pm instead?" or "I'm sick, cancel it" all just work. The reminder is logged in the chat history, so the assistant knows what she is answering.
- **A "yes" is not always a confirmation.** The prompt separates a "yes" to a reminder (`confirm`) from a "yes" to a new booking question (`book`).
- **Round = appointment start time.** Storing the start time each reminder was sent for makes a reschedule start a fresh cascade with no extra columns or resets.
- **Latest step only, and never right after a change.** Missed steps are skipped (no bursts after downtime), and a step whose time passed before she booked or confirmed is skipped too.
- **n8n-mcp + IF branches.** `addConnection` with `sourceOutput: "true"` on an IF node saved a non-existent output and the run silently stopped at the IF; use `branch: "true"` and check the structure.
- **Google Calendar colors.** `colorId: '10'` marks the event green; to clear it in a PATCH send `colorId: null` (an empty string returns 400).
