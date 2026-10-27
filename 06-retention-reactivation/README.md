# Client Retention & Reactivation (Lumière Aesthetics)

🇬🇧 English | [🇪🇸 Español](README.es.md)

> Part of the **Lumière Aesthetics** portfolio (P30–P36): one fictional med spa in Old Town Scottsdale, Arizona, built as if it were a paying client.
> P30 captures the lead, P31 answers and books on WhatsApp, P32 brings back quiet leads, P33 makes sure booked clients show up, P34 asks for the rating and the review. **P35 brings past clients back without paying for ads**: a touch-up reminder when her treatment is due (Botox every ~3 months, HydraFacial every month…) and a "we miss you" with a welcome-back offer when she hasn't come in a while. If she answers "yes", the same WhatsApp assistant books her on the spot.
>
> 💬 **WhatsApp or SMS:** the demo runs on WhatsApp, but every message goes out through one shared sending block, so the same system works over SMS (Twilio) without changing the logic.

---

## Problem

A med spa pays to win each new client (ads, free consultation, $50 credit). The profit is in the clients who come back — and most spas leave that to chance.

- **Nobody tells her it's time.** Botox lasts 3–4 months, a HydraFacial is monthly, laser and microneedling are series. Clients come back "when they remember", or go to the spa that wrote to them first.
- **Inactive clients just fade away.** There is no list of who stopped coming, and no one has the time to write to them one by one.
- **Offers go to the wrong people.** When there is a promo, it's blasted to everyone — including clients who just complained.

Example numbers for a spa like Lumière (~350 clients served, average ticket ~$450): about 40% of Botox clients go past 4 months or don't come back. Recovering **8–10 visits a month = ~$3,600–4,500/month** in revenue with no ad spend, plus ~1 hour a week the front desk stops spending on "we should call her".

## Solution

One new n8n workflow plus a new rule in the WhatsApp assistant built in P31. Outgoing messages are fixed templates (no AI); Claude is used only to understand her reply and book.

```
P35a Retention (every minute)
  Read All Sheets (1 batchGet: Leads, Citas, Seguimientos, Calificaciones, Conversaciones, Escalamientos, Negocio, Servicios)
  → Pick Due Messages: based on her LAST visit, who needs which message now (and why the others don't)
  → Build Message: fixed Meta-style template, Spanish or English; the offer text comes from the Negocio sheet
  → WhatsApp via P31e  |  email fallback via P32c if the WhatsApp failed
  → Log to Seguimientos (sequence, round = her last visit, step, channel)

She replies on WhatsApp → P31b (built in P31) sees "RETENTION MESSAGE" in its live state
  "Sí, quiero volver"   → she is a returning client: which treatment? → free slots → confirm → book (P31g)
  "No, gracias"         → one warm sentence, no insisting
  "How do I get the $50?" → repeats the offer exactly; the team applies it at the visit (never invents another)
```

| Sequence | When (production) | Template |
|---|---|---|
| `retoque` | Visit end + `retoque_dias` of the service (Botox 90, HydraFacial 30, Fillers 270…) | "It's been 3 months since your Botox — best time for your touch-up. Want me to find you a time?" |
| `reactivacion` | 120 days without a visit (`dias_reactivacion`); for long touch-ups, touch-up + 30 days | "We miss you" + `oferta_reactivacion` (e.g. $50 credit if she books within 14 days) |
| `recordatorio` | 7 days after either invitation, only if she said nothing | One short follow-up |

**The owner controls it from the Sheet, not the code:** touch-up days per service (`Servicios.retoque_dias`), the inactivity threshold and the offer text in Spanish and English (`Negocio`). Empty offer = message without an offer.

**Rules that keep it respectful:** one follow-up at most per message; nothing if she has an upcoming appointment, opted out, or has an open case with the team; at least 14 days since any other automated message (nurturing, reminders, post-visit); **no offer if she rated her last visit 1–3**; production sends Monday–Saturday 10 a.m.–7 p.m. A new visit starts a new round automatically. If the WhatsApp fails (Twilio status callback) the invitation goes once by email with the Lumière template. A `DEMO_MODE` switch turns days into minutes for live demos.

## Business Result

Tested live with Twilio WhatsApp (demo mode):

| What happened | Result |
|---|---|
| Client inactive since her last visit | "We miss you" + $50 offer sent, logged once |
| 5 min of silence | One follow-up with the offer, then nothing more |
| She replied "Sí, quiero volver" | The assistant repeated the exact offer and asked which treatment (suggested the one she was interested in) |
| "Botox" → "Monday 26 at 10 am" → "Sí" | Booked in Google Calendar + Citas in ~3 minutes of chat, no human involved |
| "¿Cómo aplico los 50?" | "The team applies it at your visit" — no invented terms |
| Next run | She has an appointment → the system stops writing to her |
| Touch-up and reactivation to an invalid number (63015) | Same invitation went by email next minute, no duplicates |
| Logic tests | 35/35 simulated cases (demo and production days, silence, replied, opt-out, open case, upcoming appointment, recent touch, low rating, fillers vs. 120 days, Sunday/night…) |

Cost per message: **$0 in AI** for the outgoing templates; reading her reply is one short Claude call (< $0.02).

## Business Value

> "How many of your Botox clients are past their 4 months right now — and how many of them will book with the spa down the street? This writes to each client on WhatsApp the week her touch-up is due, and to the ones who stopped coming with your welcome-back offer. If she says yes, the assistant books her right there. Ten clients back a month is about $4,500, without spending a dollar on ads — and you change the offer yourself in a spreadsheet."

- **Who it's for:** med spas, aesthetic and dental clinics, salons, barbershops, physiotherapy — any business with repeat treatments.
- Works alone with any booking history, or as part of the full system (part 7), where "clients who came back" feeds the owner's monthly ROI report.

## Going to Production

- These are marketing messages outside WhatsApp's 24-hour window, so they need Meta-approved *marketing* templates and a clear opt-out; they are already built as template + variables.
- For SMS instead of WhatsApp, only the sending block changes (P31e).

## Tech Stack

n8n (self-hosted, Docker) · Claude API (Sonnet, only to read the reply and book) · Twilio WhatsApp (sandbox) · Google Calendar · Gmail (email fallback) · Google Sheets API · Cloudflare Tunnel

| Workflow | Role |
|---|---|
| `p35a-retention.json` | Scheduler: picks touch-up / reactivation per client, fills the template, sends (WhatsApp or email fallback), logs |
| `../02-whatsapp-ai-agent-booking/p31b-whatsapp-inbound.json` | Updated: touch-up / we-miss-you rule and "RETENTION MESSAGE" (with the exact offer) in the live state; offer keys hidden from general facts |

Reuses: `P31e Send WhatsApp`, `P32c Send Email`, `P31b WhatsApp Inbound`, `P31d Client Context`, `P31g Booking`. All IDs and credentials in the JSON files are placeholders (`YOUR_...`).

## Key Technical Learnings

- **The last visit is the round.** Every message hangs from her last attended visit (`ronda = visit start`). A new visit starts a fresh cycle with no extra columns or flags to reset.
- **Long touch-ups vs. inactivity.** With a fixed 120-day threshold, a filler client (270-day touch-up) would get "we miss you" before her touch-up was even due → reactivation = max(120, touch-up + 30).
- **The offer lives in the data, and only where it was sent.** The offer is hidden from the assistant's general facts (otherwise it offers $50 to everyone) and shown only in the live state when that client actually received it, copied verbatim from the message. It can't be "improved" or invented.
- **Respect across flows.** A 14-day gap against *any* automated message (nurturing, reminders, post-visit) keeps the five sequences from stacking on the same client; an open case or a low rating blocks offers.
- **Imported workflows may not really be active.** A workflow created with `n8n import:workflow` showed as active but its Schedule Trigger never ran (zero executions, no error). Deactivating and activating through the API fixed it — always check for trigger executions after activating.
