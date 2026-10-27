# WhatsApp AI Agent that Answers and Books (Lumière Aesthetics)

🇬🇧 English | [🇪🇸 Español](README.es.md)

> Part of the **Lumière Aesthetics** portfolio (P30–P36): one fictional med spa in Old Town Scottsdale, Arizona, built as if it were a paying client.
> P30 captures the lead on the landing page. **P31 answers her on WhatsApp within seconds, solves her questions with the spa's real data and books the appointment in Google Calendar, with no receptionist involved.** A person only steps in for 5 specific cases.
>
> 💬 **WhatsApp or SMS:** the demo runs on WhatsApp, but every message goes out through one shared sending block, so the same system works over SMS (Twilio) without changing the logic.

---

## Problem

A med spa pays for every lead, and then loses many of them in the gap between "I'm interested" and "I'm booked":

- **Slow first reply.** The front desk answers between patients and only during business hours. A lead that arrives at 9 p.m. or on Sunday waits until the next day, and by then she has booked somewhere else.
- **Booking takes back-and-forth.** "What day works for you?" → "Thursday?" → "Thursday we have 10 or 3" → … Every exchange is another chance for the lead to go cold, and a receptionist's hour spent on scheduling.
- **The receptionist cannot do everything.** Prices, hours, parking, "does it hurt?": the same questions over and over.
- **Some conversations must reach a human.** Pregnancy, allergies, an upset client, a refund. An automated assistant must never improvise there.

## Solution

Seven n8n workflows that work as one system: three that do the work and four **shared pieces** that the rest of the portfolio (P32–P35) reuses.

```
LANDING (P30) ── new lead ──► P31a First Contact ── WhatsApp in ~3 s
                                                     │
                                       she replies on WhatsApp
                                                     ▼
P31b WhatsApp Inbound (Twilio webhook, the clinic's single WhatsApp door)
  Ack Twilio → Parse → P31d Client Context (who she is, appointment, open case, history)
  → Route: unknown number = ignore │ opt-out word = confirm + stop │ open case = forward to team
  → P31f Availability (free 1-hour slots from Google Calendar)
  → Claude Sonnet (rules + spa data from the Sheet, cached) → JSON {reply, action, booking}
  → action:
       reply                    → send
       book / reschedule/cancel → P31g Booking (re-checks the calendar, writes Calendar + Citas)
       escalate (5 cases only)  → Escalamientos + WhatsApp alert to the team, agent goes quiet
  → P31e Send WhatsApp (sends + logs) → Leads.estado

P31c Delivery Status ◄── Twilio status callbacks: delivered / read / failed
  (if the opener never arrived → lead = contacto_fallido)
```

**The Google Sheet is the single database** (one tab per entity, joined by `lead_id`): `Leads`, `Conversaciones`, `Citas`, `Escalamientos`, plus `Servicios` and `Negocio`. **All spa data (prices, durations, hours, notice, booking window, team number) lives in the Sheet, not in the code.** The owner changes a price or adds a fact as a new row, and the agent follows it on the next message.

**Agent rules (same for every agent in the portfolio):**
- Introduces herself as Lumière's virtual assistant, replies in the client's language (EN/ES).
- Only states facts from the Sheet. Never invents prices, availability or promotions. No medical advice.
- Off-topic questions and prompt-injection attempts get a kind redirect and **are never escalated**.
- **Books only after an explicit "yes"** to service, day and time. New clients book the free consultation first.
- Escalates to a person in exactly 5 cases: asks for a human, medical topic, complaint, unusual money (refunds, disputes, special discounts), or the agent is stuck. Then it stays quiet until the team closes the case in the Sheet.

## Business Result

Measured in real end-to-end tests (landing → WhatsApp → Google Calendar):

| Metric | Before (typical front desk) | With P31 |
|---|---|---|
| First reply to a new lead | hours (or next business day) | **~3 seconds, 24/7** |
| Reply to each client message | depends on the front desk | **~6–10 seconds** |
| Booking a consultation | phone/text back-and-forth | **3 messages in the same chat**, written straight into Google Calendar |
| Reschedule / cancel | call the spa | in the chat, with the calendar freed instantly |
| Double bookings | possible | blocked: the calendar is re-checked right before writing |
| Health / complaint / refund cases | handled by whoever sees it | **WhatsApp alert to the team with a summary**, agent goes quiet |
| "Did she get our message?" | unknown | every message tracked: delivered / read / failed |

What the owner sees: appointments appearing in her phone's calendar, booked while the spa was closed, and alerts only when she actually needs to act.

## How This Sells

**Pitch (to a med spa owner):**
> "Every lead that fills your form gets a WhatsApp from your clinic in 3 seconds, day or night. Your assistant answers prices and questions with your real information, books the free consultation straight into your Google Calendar, and only bothers your team for the cases that need a human: health questions, complaints or money. You stop losing the leads that come in after hours, and your receptionist stops spending her day playing calendar ping-pong."

- **Target client:** med spas, aesthetic and dental clinics, salons: any appointment-based business in the US that already gets leads from ads or a website.
- **Pricing (proposal, to validate with real clients):** setup **$2,000–4,000** + retainer **$500–1,000/month** (combines "fast lead response" and "smart booking" from the service menu). Sold alone or as part of the full Lumière system (P36).
- **What justifies the retainer:** the assistant keeps booking every month, its rules and data are maintained, and the owner sees the results (P36 adds the weekly summary and monthly ROI report).
- **Production note:** the demo uses the Twilio WhatsApp Sandbox. With a real client: a WhatsApp Business sender, Meta-approved templates for messages outside the 24-hour window, a fixed domain instead of a quick tunnel, and the consent text reviewed by a lawyer. The same system works over SMS by changing one workflow (P31e).

## Tech Stack

n8n (self-hosted, Docker) · Claude API (Sonnet, prompt caching, JSON output) · Twilio WhatsApp (sandbox) · Google Sheets API · Google Calendar API (freeBusy + events) · Cloudflare Tunnel · Cloudflare Pages (landing, P30)

| Workflow | Role |
|---|---|
| `p31a-first-contact.json` | Opening WhatsApp the moment P30 saves a new lead |
| `p31b-whatsapp-inbound.json` | Single WhatsApp door: routing, Claude, escalation, booking, reply |
| `p31c-delivery-status.json` | Twilio status callbacks → delivery status, failed openers |
| `p31d-client-context.json` | Shared: full client picture from all sheets in one read |
| `p31e-send-whatsapp.json` | Shared: the only place that talks to the channel (send + log) |
| `p31f-availability.json` | Shared: free 1-hour slots from Google Calendar |
| `p31g-booking.json` | Shared: book / reschedule / cancel with a final calendar check |

All IDs, numbers and credentials in the JSON files are placeholders (`YOUR_...`).

## Key Technical Learnings

- **Sub-workflows as shared building blocks.** Client Context, Send WhatsApp, Availability and Booking are called with *Execute Workflow*, with no URL, no tunnel and nothing public. In n8n 2.x a sub-workflow must be **published** to be called outside the editor (`Workflow is not active and cannot be executed`); the UI would not activate a trigger-less workflow, but the API did.
- **n8n computes, Claude decides.** Free slots are calculated by n8n from Google Calendar and given to Claude as a list; Claude only picks one and returns JSON. Then n8n re-checks the slot right before writing. Claude cannot invent availability and two clients can never get the same hour.
- **Claude copies the format of the chat history.** With past assistant turns as plain text, Claude answered in plain text, and once it even repeated the JSON with a "correction" in between. That triggered false escalations. Fix: past assistant turns are sent in the same JSON format Claude must use, a format reminder goes at the end of the system prompt, and the parser walks every complete JSON object in the text (brace counting that respects strings) and keeps the last valid one.
- **Prompt caching with live data.** Rules + spa facts from the Sheet go in a cached system block; live state, free slots and history stay outside the cache (~2.5–3K tokens cached per conversation).
- **One read, one snapshot.** `values:batchGet` reads the six sheets in a single call, so every decision is made on a consistent picture of the client.
- **Twilio accepts and fails later.** A 201 + SID does not mean delivered. Every message carries a `StatusCallback`; status only moves forward (callbacks arrive out of order) and a failed opener marks the lead `contacto_fallido` (real test: error 63015 in ~3 s).
- **The Twilio sandbox swallows `STOP`.** It disconnects the number and the message never reaches the webhook. Opt-out was tested with `BAJA`/`UNSUBSCRIBE`; a real sender delivers STOP and the flow handles it.
- **Safe defaults everywhere.** Unparseable Claude output → safe reply + escalation; a slot taken at the last second → the "booked!" reply is replaced with three real free slots; unknown numbers get nothing; a daily reply cap protects against abuse and cost.
- **Concurrency-safe writes.** New rows use the Sheets API `values:append` (atomic) instead of the n8n Sheets node, which overwrote rows under simultaneous executions in P30.
