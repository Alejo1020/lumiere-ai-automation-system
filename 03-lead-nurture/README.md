# Automated Nurturing for Leads Who Don't Book (Lumière Aesthetics)

🇬🇧 English | [🇪🇸 Español](README.es.md)

> Part of the **Lumière Aesthetics** portfolio (P30–P36): one fictional med spa in Old Town Scottsdale, Arizona, built as if it were a paying client.
> P30 captures the lead, P31 answers and books on WhatsApp. **P32 brings back the leads who went quiet without booking**: a short, personalized sequence on WhatsApp (or a branded email if WhatsApp failed) that stops by itself the moment she replies, books, opts out or a message bounces.
>
> 💬 **WhatsApp or SMS:** the demo runs on WhatsApp, but every message goes out through one shared sending block, so the same system works over SMS (Twilio) without changing the logic.

---

## Problem

Most med spa leads do not book in the first conversation. They ask a price, say "let me think about it" and disappear.

- **Nobody follows up.** The front desk is busy with the clients in front of them; following up with 60–70% of the leads by hand never happens consistently.
- **When someone does follow up, it is generic.** "Hi, just checking in!" ignores what the client asked, so it reads like spam.
- **Follow-up done wrong costs more than it brings.** Messaging someone who already booked, who said stop, or whose number does not work damages the brand and the sender's reputation.

Example numbers for a spa like Lumière (~120 leads/month, average ticket ~$450): if 60–70% do not book on day one and nurturing recovers 10–15% of them, that is **~10 extra appointments ≈ $4,500/month** that are lost today, plus ~5 hours/week the front desk would spend doing it by hand.

## Solution

Three n8n workflows. P32 reuses the shared pieces built in P31 (client context, WhatsApp channel, booking) and adds a shared email channel that P34 and P35 will reuse.

```
P32a Nurture Sequences (every minute)
  Read All Sheets (1 batchGet: Leads, Conversaciones, Citas, Escalamientos, Seguimientos, Negocio)
  → Pick Due Touches: who went quiet, which sequence, round and step, and who must stop (and why)
  → P31d Client Context (her chat, her treatment, spa data)
  → Claude Sonnet writes ONE personalized line {{3}} (or subject + body for email)
  → Parse Touch: invalid JSON, too long, a number or link not in the spa data → safe fallback text
  → WhatsApp → P31e Send WhatsApp (Meta-style template: fixed text + {{1}} name, {{2}} treatment, {{3}} Claude)
    email    → P32c Send Email (branded HTML, legal footer, unsubscribe link)
  → Log to Seguimientos (one row per touch)

P32b Email Unsubscribe   GET shows a button (scanners open links) · POST sets the lead to opt_out
She replies on WhatsApp → P31b (built in P31) answers with the full history, including the touches, and books.
```

**Sequences (4 touches each):** what to expect at the first visit → her doubt or objection → one frequent question with its answer → a last, no-pressure invitation.

| Sequence | Who | Timing (production) |
|---|---|---|
| `wa_sin_respuesta` | got the first WhatsApp and never replied | D+1, D+3, D+7, D+14 |
| `wa_sin_agendar` | chatted with the assistant but did not book | D+1, D+3, D+7, D+14 |
| `email_recuperacion` | WhatsApp could not be delivered, has an email | D+0, D+2, D+5, D+10 |

**It stops by itself when:** she replies (P31 takes over), books, is escalated to a person, opts out (WhatsApp or email), or a touch fails (Twilio status callback). If she replies and goes quiet again, a second round starts (max 2 rounds on WhatsApp, 1 on email). Production sends only 9 a.m.–7 p.m. spa time, never on Sunday, max 20 touches per run. A `DEMO_MODE` switch turns days into minutes for live demos.

**No sequence columns in the database.** The state of each sequence is *derived* from two sheets: the last real message in `Conversaciones` is the anchor, and the touches after it in `Seguimientos` are the current round. Nothing to keep in sync, nothing to reset.

## Business Result

Tested end to end in real conditions (Twilio WhatsApp + Gmail + Google Calendar):

| What happened | Result |
|---|---|
| Lead never replied | 4 personalized touches, 5 min apart in demo mode, each with a different angle |
| She replied to a touch | The assistant answered with the touches in context; nurturing stopped |
| She went quiet again | Round 2 started on its own with a "picking up our chat" template |
| She booked | Appointment in Google Calendar; P32 never wrote to her again |
| Email lead unsubscribed | One click + confirm → `opt_out`; the next email was never sent |
| Touch not delivered (error 63015) | Sequence stopped on the next run |
| Claude output | 0 fallbacks in the tests; prices and facts always taken from the spa's Sheet |

Cost: ~2,000 input tokens per touch, most of it cached → **under $0.01 per touch**.

## Business Value

> "Most of the people who ask about a treatment don't book that day, and nobody on your team has time to chase them. This system does it for you: a few short, personal messages over the following two weeks, using what each person actually asked, and it stops the second she replies or books. If 10 of those leads come back each month, that is about $4,500 you are leaving on the table today."

- **Who it's for:** med spas, aesthetic and dental clinics, any appointment-based business that gets leads it does not convert on day one.
- Works alone or as part of the full system (part 7).

## Going to Production

- Messages outside WhatsApp's 24-hour window need Meta-approved templates. The workflow already builds each touch as template + variables, so going live means registering the templates and sending `ContentSid` + `ContentVariables`.
- For SMS instead of WhatsApp, only the sending block changes (P31e).

## Tech Stack

n8n (self-hosted, Docker) · Claude API (Sonnet, prompt caching, JSON output) · Twilio WhatsApp (sandbox) · Gmail API · Google Sheets API · Cloudflare Tunnel

| Workflow | Role |
|---|---|
| `p32a-nurture-sequences.json` | Scheduler: picks due touches, Claude writes, sends, logs |
| `p32b-email-unsubscribe.json` | Unsubscribe page (GET button / POST opt-out) |
| `p32c-send-email.json` | Shared: branded HTML email + legal footer (reused by P34/P35) |

Reuses from P31: `P31d Client Context`, `P31e Send WhatsApp`, `P31b WhatsApp Inbound` (replies). All IDs and credentials in the JSON files are placeholders (`YOUR_...`).

## Key Technical Learnings

- **Derive state, don't store it.** Instead of `nurture_step / next_date / status` columns that drift out of sync, the sequence state is computed on every run from `Conversaciones` (anchor = last non-nurture message) and `Seguimientos` (touches after the anchor). Replies, bookings and new rounds need no extra writes.
- **No bursts after downtime.** A touch is due when *anchor + step* has passed **and** the gap since the previous touch is respected, so if n8n was off for hours it does not fire three touches in a row.
- **Claude writes one variable, not the message.** WhatsApp touches are Meta-style templates; Claude only fills `{{3}}` (≤160 characters). Validation rejects any number not present in the spa's data, any link, invalid JSON or truncated output, and falls back to a safe text.
- **Previous touches go into the prompt.** Without them Claude repeated the same angle (a v1 lesson). Now each touch sees the earlier ones and the recent chat; a second-round touch picks up where the conversation stopped and never proposes times (availability may have changed).
- **Unsubscribe links must never act on GET.** Email security scanners open links automatically; the GET only shows a button and the POST does the opt-out.
- **IF v2 + missing field.** `boolean → is not true` on a field that does not exist sent the item to the *false* branch. Fix: coerce in the expression (`{{ $json.lead_id ? true : false }}`) and test `is true`.
- **Every new business setting is visible to the agent.** P31's agent turns any extra row of the `Negocio` sheet into a fact it can say; technical keys (like the WhatsApp number for email buttons) must be added to its internal list.
