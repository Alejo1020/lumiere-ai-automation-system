# Full System + Owner Reports + AI Office (Lumière Aesthetics) 🏆

🇬🇧 English | [🇪🇸 Español](README.es.md)

> Flagship of the **Lumière Aesthetics** portfolio (P30–P36): one fictional med spa in Old Town Scottsdale, Arizona, built as if it were a paying client.
> P30 captures the lead, P31 answers and books on WhatsApp, P32 brings back quiet leads, P33 makes sure booked clients show up, P34 asks for the rating and the review, P35 brings past clients back. **P36 turns the six into one system and proves its value in money every week and every month** — and adds a pixel-art "AI office" to show the whole thing working live in a sales call.
>
> 💬 **WhatsApp or SMS:** the demo runs on WhatsApp, but every message goes out through one shared sending block, so the same system works over SMS (Twilio) without changing the logic.

**Live demo:** https://lumiere-office.pages.dev (simulation of a full demo month) · `?mode=live` shows the real system's events.

---

## Problem

A med spa owner who buys automation ends up paying several monthly retainers — and has no way to know if they pay off.

- **No numbers.** Nobody tells her how many leads were answered at 11 p.m., how many appointments were booked without the front desk, or how many no-shows were avoided. She spends 1–2 hours a week reading the calendar and WhatsApp to "more or less know how we're doing".
- **Alerts arrive late or never.** A complaint, a medical question or a system failure should reach her in minutes — and only those, not 50 notifications a day.
- **The retainer is the first cost cut.** If the value isn't visible every month, the service gets cancelled at the first slow month.

## Solution

Five new n8n workflows on top of P30–P35, plus small changes to the existing ones. Every flow emits its milestones in one format; reports read the same Google Sheet the agents write; the owner edits the assumptions.

```
Every flow (P30, P31b, P31g, P32a, P33a, P34a, P34b, P35a, Error Alert)
  └─ milestone → P36a Office Event → Eventos sheet  (lead arrives, booking, touch sent, reminder confirmed,
                                                      review, client came back, escalation, error)

Owner, in the moment (WhatsApp, only when she must act)
  escalation (P31b) · low rating (P34b) · system failure (Error Alert: plain words, max 1 per flow every 30 min)

Owner, every Monday 8 AM (WhatsApp, 30 seconds)          Owner, day 1 of each month (branded email)
  P36b Weekly Summary                                      P36c Monthly ROI
    → P36d Metrics (one set of numbers)                      → P36d Metrics (month vs. previous calendar month)
    → fixed template, zero lines hidden                      → Sonnet writes a 3-sentence note; every number it
    → P31e WhatsApp                                            writes must exist in the data, else a fixed note
                                                             → 6 KPI tiles, month over month, "how we calculate it"
                                                             → P32c email (internal mode)

Live demo: AI office (Cloudflare Pages)
  simulation: replays a demo month in ~4 minutes, no n8n, no tokens, no messages
  live: polls P36e Office Feed (read-only webhook, first names only, numbers cached 5 min)
```

**How the value is calculated (`P36d`, visible to the owner in the email):**

| Item | Formula | Source |
|---|---|---|
| Hours saved | tasks the system did × minutes a person would take × $/hour | Sheets + `ROI` sheet |
| No-shows avoided | reminded visits × no-show rate without the system (20 %) − actual no-shows | `Citas`, `Seguimientos`, `ROI` |
| Recovered bookings | bookings made after a follow-up (P32) or touch-up message (P35), at the service's starting price | `Citas`, `Seguimientos`, `Servicios` |
| ROI | (hours + no-shows avoided + recovered) ÷ monthly retainer | all of the above |

All assumptions live in a `ROI` sheet the owner can edit ($22/h front desk, minutes per task, 20 % base no-show rate, $175 per consultation, retainer). The agents never read it.

**The AI office:** six rooms, one AI agent each (Reception P30, Client Care P31, Follow-up P32, Scheduling P33, Post-visit P34, Loyalty P35), the owner's office with live numbers, an escalation door with a bell and an event log. Only milestones animate: a client walks into Reception, an appointment card flies from Client Care to Scheduling, a star in Post-visit, a heart in Loyalty, the bell rings on an escalation. **Outside business hours the office goes dark but the screens stay on: "after hours — the AI keeps answering".**

## Business Result

Demo month (October, generated demo data with the same sheets) — the numbers the owner receives:

| | September | October |
|---|---|---|
| New leads (avg. response ~5 s, half after hours) | 95 | 122 |
| Bookings made by the assistant, no front desk | 48 | 74 |
| Recovered bookings (follow-up + clients who came back) | 16 | 29 |
| No-shows avoided | 8 | 15 |
| Front-desk hours saved | 38 | 57 |
| **Estimated value** | **$5,689** | **$10,761** |
| **ROI vs. a $1,800 retainer** | **3.2x** | **6.0x** |

Tested live end to end with Twilio WhatsApp on the real system: a returning client booked a HydraFacial in the chat (*booking* + *client came back*), got the reminder and answered "sí" (*reminder confirmed*, event painted green in Calendar), rated it 5 (*review requested*), then asked for a person (*escalation*: bell, team/owner alert, assistant silent). Every milestone appeared in the public office within seconds. The weekly WhatsApp and the monthly email were delivered; the error alert sent one WhatsApp and throttled the second.

Running cost: the monthly note is one Sonnet call (< $0.01); everything else is fixed templates and Sheets reads.

## Business Value

> "Every Monday you get one WhatsApp with last week in numbers: leads answered, appointments booked without your front desk, no-shows avoided in dollars. On the 1st, an email with the month's value against what the system costs you — this October it was 6 times. And you only hear from the system when you need to act: a complaint, a medical question, or if something fails. Want to see it working? This is your office right now."

- **Who it's for:** owners of med spas, aesthetic and dental clinics that run (or want) the automations of parts 1–6.
- The reports turn the automation into numbers the owner can check every month: what it booked, what it saved and what it returned.
- **Can be extended with:** an owner's assistant on WhatsApp ("how many appointments do I have tomorrow?", "how are we doing vs. last month?") built on the same Sheets and Calendar.

## Tech Stack

n8n (self-hosted, Docker) · Claude API (Sonnet: monthly note; the P31 assistant) · Twilio WhatsApp (sandbox) · Gmail · Google Sheets API · Google Calendar · Cloudflare Pages (office) · Cloudflare Tunnel · plain HTML/CSS/JS + Canvas (no frameworks)

| File | Role |
|---|---|
| `p36a-office-event.json` | Shared piece: one milestone → `Eventos` sheet (8 known types, never breaks the caller) |
| `p36b-weekly-summary.json` | Monday 8 AM WhatsApp to the owner (`DEMO_MODE` = demo sheet + fixed week) |
| `p36c-monthly-roi.json` | Day-1 branded ROI email; Sonnet note validated against the data |
| `p36d-metrics.json` | Shared piece: all report numbers for a range + the previous range |
| `p36e-office-feed.json` | Read-only GET webhook for the office in live mode |
| `../01-lead-capture/p30-error-alert.json` | Error monitor: email to the builder + plain-words WhatsApp to the owner (throttled) + event |
| `../01-lead-capture/p30-lead-capture.json` | Lead capture, now with its milestone node |
| `office/` | The AI office page (simulation + live) |

Updated in their own folders: `p31b` (escalation + "client came back" events, owner copy), `p31g` (booking + confirmation events), `p32a` · `p33a` · `p34a` · `p35a` (touch events), `p32c` (internal mode for owner reports: no unsubscribe link), `p34b` (review/escalation event, alert to owner + team). All IDs and credentials in the JSON files are placeholders (`YOUR_...`).

## Key Technical Learnings

- **A sub-workflow returns its LAST node's output.** Adding a parallel "emit event" branch to a booking sub-workflow could change what the caller receives. Fix: put the fire-and-forget Execute Workflow node *in line* — with "wait for sub-workflow" off it passes its input items through.
- **AI text in a numbers report must be checked, not trusted.** Claude only gets pre-formatted numbers and every number in its paragraph must exist in that data (normalizing $, commas, %, x); an invented "$12,500" falls back to a fixed note.
- **Alert without flooding.** The error monitor uses the `Eventos` sheet as its memory: max one owner WhatsApp per workflow every 30 minutes, excluding the event of its own execution (written in parallel).
- **Compare months as months.** "Same number of days before" compares Oct 1–31 with Aug 31–Sep 30; full months must compare with the previous calendar month, and cost a full retainer.
- **Demo data needs a real PRNG.** A simple LCG produced correlated draws: an 8 % no-show probability happened once in 148 visits. Mulberry32 fixed it — always check generated totals against the expected rates.
- **Simulated clocks vs. dropped frames.** If the clock uses the animation's capped delta, a background tab slows the whole month down; real elapsed time drives the clock, the capped delta drives the sprites.
- **The Error Workflow doesn't run for CLI executions** (`n8n execute`): to test it, use a temporary active webhook that fails on purpose.
