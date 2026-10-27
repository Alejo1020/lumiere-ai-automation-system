# Lumière Aesthetics: AI Automation System for a Med Spa

🇬🇧 English | [🇪🇸 Español](README.es.md)

A complete, working automation system for a med spa, from the first message to the client coming back three months later. **Lumière Aesthetics is a demo business** (a fictional med spa in Old Town Scottsdale, Arizona), but every part was built and tested end to end as if it were a paying client: real WhatsApp messages, real Google Calendar bookings, real reports.

**Live demos**
- **AI office** (the whole system working, with a simulated demo month): https://lumiere-office.pages.dev
- **Landing page**: https://lumiere-aesthetics.pages.dev

![AI office: every agent of the system and its live events](docs/screenshots/ai-office.png)

---

## The problem

A med spa pays for every lead, then loses money in the same places:

- Leads that arrive at 9 p.m. or on a Sunday wait until the next day, and book somewhere else.
- Booking takes several messages of back-and-forth with the front desk.
- 15-20% of appointments are lost to clients who simply forget.
- Happy clients never leave a review; unhappy ones leave it in public.
- Past clients drift away and nobody reminds them it's time for their next treatment.
- The owner pays for automation but has no numbers to know if it pays off.

## The client journey (what the system does)

1. **She fills out the form** on the landing page, at any hour.
2. **She gets a WhatsApp (or SMS) in seconds.** An AI agent answers her questions with the spa's real prices and hours.
3. **She books in the same chat.** The agent checks Google Calendar and books, reschedules or cancels. If she goes quiet, a follow-up sequence brings her back.
4. **Reminders before the visit** (48h, 24h, 2h): confirm, reschedule or cancel in one reply.
5. **The spa team treats her.** The only fully human step.
6. **Thank-you + rating.** A high rating gets the Google review link; a low one alerts the owner first.
7. **She stays on the contact list.** Touch-up reminders (Botox every 3-4 months), offers and reactivation if she stops coming.

## The 7 parts

Each part works on its own and sells on its own. Together they run as one system and share the same building blocks.

| # | Part | What it saves |
|---|---|---|
| 1 | [Lead capture: landing + lead registry](01-lead-capture) | No lead is lost, whatever time it arrives |
| 2 | [WhatsApp AI agent that answers and books](02-whatsapp-ai-agent-booking) | Replies in ~3 s, 24/7, and books without a receptionist |
| 3 | [Follow-up for leads who don't book](03-lead-nurture) | Recovers leads that would go cold |
| 4 | [Appointment reminders and no-show prevention](04-appointment-reminders) | Fewer empty chairs |
| 5 | [Post-service follow-up and online reputation](05-post-service-reviews) | More good reviews, bad ones caught in time |
| 6 | [Client retention and reactivation](06-retention-reactivation) | Clients who come back without paying for ads |
| 7 | [Full system + owner reports + AI office](07-full-system-owner-reports) 🏆 | Proof in dollars of everything above |

## Results (demo month)

Generated demo data, run through the same sheets and the same reports the owner receives:

| | September | October |
|---|---|---|
| New leads (avg. response ~5 s, half after hours) | 95 | 122 |
| Bookings made by the assistant, no front desk | 48 | 74 |
| Recovered bookings (follow-up + clients who came back) | 16 | 29 |
| No-shows avoided | 8 | 15 |
| Front-desk hours saved | 38 | 57 |
| **Estimated value** | **$5,689** | **$10,761** |
| **ROI vs. a $1,800 monthly fee** | **3.2x** | **6.0x** |

<p>
  <img src="docs/screenshots/monthly-roi-report.png" alt="Monthly ROI report emailed to the owner" width="48%">
  <img src="docs/screenshots/landing-mobile.png" alt="Landing page on mobile" width="48%">
</p>

## How it's built

- **n8n (self-hosted)** runs every workflow. Shared sub-workflows (client context, send WhatsApp, availability, booking, send email) are reused by all parts, so nothing is duplicated.
- **Claude API**: Sonnet for everything that talks to clients and for the agents; prompt caching on long system prompts. n8n computes (free slots, metrics) and Claude decides; Claude never invents availability or numbers.
- **Twilio WhatsApp** as the channel in the demo. The sending block is decoupled, so the same system works over SMS: the business picks the channel its clients already use.
- **Google Calendar** for the spa's schedule and **Google Sheets** as the database: one tab per entity (Leads, Conversations, Appointments, Follow-ups, Ratings, Escalations), joined by `lead_id`. Ready to move to Postgres (each tab = a table).
- **Escalation to a human in exactly 5 cases**: asks for a person, medical topic, complaint, unusual money request, or the agent is stuck.
- **Cloudflare Pages** for the landing page and the AI office.

## Repository structure

```
01-lead-capture/                 README, workflows (lead capture + error alert) and the landing page
02-whatsapp-ai-agent-booking/    README and 7 workflows (agent + shared building blocks)
03-lead-nurture/                 README and 3 workflows (sequences, unsubscribe, shared email)
04-appointment-reminders/        README and workflow
05-post-service-reviews/         README and 2 workflows
06-retention-reactivation/       README and workflow
07-full-system-owner-reports/    README, 5 workflows and the AI office (static site)
docs/screenshots/
```

Each part has a `README.md` (English) and `README.es.md` (Spanish) with the problem, the solution, tested results and the technical learnings.

**Workflow names.** Inside n8n each workflow carries a short prefix (for example `P31b - Lumière WhatsApp Inbound`) so the workflows of each part sort together. The READMEs use the same prefixes when they refer to a specific workflow: P30 = part 1, P31 = part 2 … P36 = part 7.

**Importing a workflow.** n8n → *Import from file* → pick the `.json`. All IDs, phone numbers, emails and credentials are placeholders (`YOUR_...`): replace them and connect your own credentials (Twilio, Google, Anthropic).

## About

Built by **Alejandro Arroyave**, AI Automation Engineer. I build AI agents and automations with n8n, Claude, Twilio and Google Workspace for businesses that want the repetitive work off their team's plate.

- Upwork: https://www.upwork.com/freelancers/~013fd3979d1da5ff68
