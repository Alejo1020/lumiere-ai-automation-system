# Post-Service Follow-Up & Online Reputation (Lumière Aesthetics)

🇬🇧 English | [🇪🇸 Español](README.es.md)

> Part of the **Lumière Aesthetics** portfolio (P30–P36): one fictional med spa in Old Town Scottsdale, Arizona, built as if it were a paying client.
> P30 captures the lead, P31 answers and books on WhatsApp, P32 brings back quiet leads, P33 makes sure booked clients show up. **P34 handles what happens after the visit**: a thank-you and a 1–5 rating on WhatsApp. Happy clients get the Google review link; unhappy ones reach the owner in private before the problem becomes a public review. Clients who didn't show up get a friendly "we missed you, want to rebook?".
>
> 💬 **WhatsApp or SMS:** the demo runs on WhatsApp, but every message goes out through one shared sending block, so the same system works over SMS (Twilio) without changing the logic.

---

## Problem

For a med spa, Google reviews are the storefront: new clients compare stars and review counts before they ever call.

- **Happy clients don't review.** The front desk asks "leave us a review!" at checkout when it remembers; it turns into 2–3 reviews a month while competitors have hundreds.
- **Unhappy clients do — in public.** One or two bad reviews a month show up before the owner even knows something went wrong.
- **No-shows are forgotten.** After the reminders (P33) a few clients still miss their appointment, and nobody calls them to rebook.

Example numbers for a spa like Lumière (~80 appointments/month, ~74 attended, average ticket ~$450): if about half answer the rating (~37), ~31 are happy and get the link and ~35% of them leave a review → **~11 reviews/month instead of 2–3**; **~5 low ratings/month caught in private**; recovering 2 of ~5 no-shows → **~$900/month**; and ~2 hours/week the front desk stops spending on asking for reviews and chasing no-shows.

## Solution

Two new n8n workflows plus a new `rate` action in the WhatsApp assistant built in P31. Outgoing messages are fixed templates (no AI); Claude is used only to understand her reply.

```
P34a Post-Service (every minute)
  Read All Sheets (1 batchGet: Leads, Citas, Seguimientos, Calificaciones, Conversaciones, Escalamientos, Negocio, Servicios)
  → Pick Due Messages: who needs which message now (and why the others don't)
  → Build Message: fixed Meta-style template, Spanish or English
  → WhatsApp via P31e  |  email fallback via P32c if the WhatsApp failed
  → Log to Seguimientos (cita_id, step, channel)

She replies on WhatsApp → P31b (built in P31) reads the score (Claude)
  "Me fue súper bien" (no number) → the assistant asks for a number from 1 to 5
  "5"                             → rate → P34b Rating
P34b Rating
  → Calificaciones row
  → 4–5: fixed reply with the Google review link
  → 1–3: apology + "what happened?", case in Escalamientos (complaint), WhatsApp alert to the owner;
         the assistant goes quiet and forwards her next messages to the team until the case is closed
```

| Step | When (production) | Template |
|---|---|---|
| `gracias` | 2 h after an appointment marked `asistio` | Thank you + "reply with a number from 1 to 5" |
| `recordatorio_nota` | 24 h later, only if she said nothing | One short nudge for the rating |
| `te_extranamos` | 2 h after an appointment marked `no_asistio` | "We missed you, want me to find another time?" (the assistant rebooks) |

**Rules that keep it respectful:** one reminder at most; nothing if she already rated, already rebooked, opted out or has an open case with the team; appointments older than 3 days are ignored; production sends only 9 a.m.–8 p.m. spa time; if the WhatsApp fails (Twilio status callback) the same message goes once by email with the Lumière template. Everyone may leave a review — the system only decides **when** to ask; nothing is paid or gated. A `DEMO_MODE` switch turns hours into minutes for live demos.

## Business Result

Tested live with Twilio WhatsApp (demo mode):

| What happened | Result |
|---|---|
| Appointment marked `asistio` | Thank-you + rating request sent, logged once |
| 5 min of silence | One rating nudge, then nothing more |
| She replied "Me fue súper bien, me encantó" | The assistant asked for the number (never guesses it) |
| She replied "5" | Google review link in ~7 s; rating saved with her comment |
| She replied "2, me hicieron esperar mucho" | Apology without link + owner alert "⭐ LOW RATING 2/5" on WhatsApp + complaint case opened, in the same second |
| She wrote again with the case open | The assistant stayed quiet; the message was forwarded to the team |
| WhatsApp to an invalid number (63015) | Same message went by email next minute, no duplicates (thank-you and no-show paths) |
| Logic tests | 25/25 simulated cases (silence, replied, already rated, opt-out, open case, rebooked, failed delivery, quiet hours…) |

Cost per message: **$0 in AI** for the outgoing templates; reading her reply is one short Claude call (< $0.02).

## How This Sells

**Pitch (to a med spa owner):**
> "How many happy clients left last month without writing a review — and how many unhappy ones wrote one before you could fix it? After every visit this thanks the client on WhatsApp and asks for a quick 1 to 5. The happy ones get your Google review link right then, while they're glowing. If someone gives a 2, you get a WhatsApp alert instantly and talk to her in private before it becomes a public review. And anyone who missed her appointment gets a friendly 'want to rebook?'. Going from 2 to 11 reviews a month and recovering two no-shows pays for it many times over."

- **Target client:** med spas, aesthetic and dental clinics, salons, any appointment-based business that lives on Google reviews.
- **Pricing (proposal, to validate):** setup **$700–1,200** + retainer **$200–400/month**. Sold alone (any booking system that can mark "attended") or as part of the full Lumière system (P36), where reviews and saved complaints feed the owner's monthly ROI report.
- **Production note:** post-visit messages go outside WhatsApp's 24-hour window, so they need Meta-approved templates; they are already built as template + variables. The same system works over SMS by swapping the channel piece (P31e). The review link is the clinic's Google Business Profile "write a review" link.

## Tech Stack

n8n (self-hosted, Docker) · Claude API (Sonnet, only to read the reply) · Twilio WhatsApp (sandbox) · Gmail (email fallback) · Google Sheets API · Cloudflare Tunnel

| Workflow | Role |
|---|---|
| `p34a-post-service.json` | Scheduler: picks who needs which message, fills the template, sends (WhatsApp or email fallback), logs |
| `p34b-rating.json` | Shared piece: saves the rating; 4–5 → review link, 1–3 → apology + case + owner alert |
| `../02-whatsapp-ai-agent-booking/p31b-whatsapp-inbound.json` | Updated: new `rate` action, "visit waiting for a rating" in the live state |
| `../02-whatsapp-ai-agent-booking/p31d-client-context.json` | Updated: also returns the visit waiting for a rating and her past ratings |

Reuses: `P31e Send WhatsApp`, `P32c Send Email`, `P31b WhatsApp Inbound`, `P31d Client Context`. All IDs and credentials in the JSON files are placeholders (`YOUR_...`).

## Key Technical Learnings

- **Fixed templates out, AI only in.** Thank-you, nudge and "we missed you" are templates: free, instant, and exactly what Meta approves. Claude only reads her answer, and the follow-up (review link or apology) is a fixed message too, so the link can never come out wrong.
- **Never guess the score.** "Me encantó" is not a 5. The assistant asks once for the number, and the parser only accepts a whole number from 1 to 5 when a visit is actually waiting for a rating.
- **A low score is not a normal escalation.** "2, they made me wait" is saved as a rating *and* opens a complaint case from the rating piece, so the owner gets the score, the comment and the context in one alert.
- **Reuse the "open case = silence" rule.** After a low score the assistant stops answering and forwards her messages to the team — the same mechanism built in P31 for escalations, no new logic.
- **Email fallback from the delivery status.** The decision reads Twilio's status callback (`failed / undelivered`) from the chat log; a failed WhatsApp turns into one email the next minute, and only once.
- **Sub-workflows must be published.** Calling an unpublished sub-workflow fails with "Workflow is not active and cannot be executed"; publish shared pieces even if they have no trigger of their own.
- **Old chat history can leak into replies.** A test that moved an appointment by hand left an old time in the history and the assistant "corrected" it unprompted; the prompt now says to answer only what her latest message is about.
