# Lead Capture: Landing Page + Lead Registry (Lumière Aesthetics)

🇬🇧 English | [🇪🇸 Español](README.es.md)

> Part 1 of the **Lumière Aesthetics** system: one fictional med spa in Old Town Scottsdale, Arizona, built as if it were a paying client. This part captures the lead; part 2 writes to her on WhatsApp (or SMS) within seconds.
>
> 💬 **WhatsApp or SMS:** the demo runs on WhatsApp, but every message goes out through one shared sending block, so the same system works over SMS (Twilio) without changing the logic.

**Live:** https://lumiere-aesthetics.pages.dev

![Landing page, desktop](../docs/screenshots/landing-desktop.png)

---

## Problem

- **Leads get lost between the form and the follow-up.** A form that lands in an inbox waits until someone checks it, and a lead from 9 p.m. is cold by morning.
- **Duplicates and dirty data.** The same person fills the form twice, the phone number comes in five formats, and nobody knows which row is the real one.
- **No consent record.** Messaging a lead on WhatsApp or SMS in the US needs proof of what she accepted and when.

## Solution

A premium, bilingual (EN/ES), mobile-first landing page on Cloudflare Pages and one n8n workflow that validates every lead and saves it in one place.

```
Landing form (2 steps: service → name + WhatsApp)
  └─ POST → Lead Webhook (CORS: only the landing's domain)
       → Validate Lead (required fields, phone → E.164, consent text + channel)
       → Is Valid?
           ├─ yes → Respond 200 right away
           │        → Find Existing Lead (Leads tab, by WhatsApp number)
           │        → Is Returning Lead?
           │            ├─ yes → update the same row (submissions +1, treatment history) + alert the team
           │            └─ no  → append a new row (Sheets API values:append, atomic)
           └─ no  → Respond 400 with the list of errors

Error Workflow (shared monitor) → email + plain-words WhatsApp to the owner, throttled
```

- **One row per phone number.** A returning lead updates her row instead of creating a new one.
- **Consent saved with every lead**: the exact text she accepted, in her language, the channel and the date.
- **Honeypot field** against spam bots; the form only asks for name, WhatsApp and service (email and comments are optional).
- The landing page is static (HTML/CSS/JS, no framework). All settings live in one file, `landing/js/config.js`; with `WEBHOOK_URL: "PENDING"` the form simulates the submission.

## Business Result

Tested in production:

| Test | Result |
|---|---|
| Real lead from the form | New row in `Leads` with consent proof |
| Same person submits again | Same row, `submissions = 2`, treatment history updated, team alerted |
| Invalid data | 400 with the list of errors, nothing saved |
| 5 leads in the same second | 5 rows, none lost |
| Mobile conversion work | Page went from 16.9 to 7.4 screens long; the form moved from screen 13.6 to 1.6 |

## Business Value

> "Every lead that fills your form is saved in seconds, with no duplicates and with the consent proof you need to message her, and your assistant writes to her right away."

- **Who it's for:** any appointment-based business that gets leads from ads or a website.
- Works best together with the WhatsApp agent (part 2), since capture alone doesn't book anyone.

## Tech Stack

HTML/CSS/JS · Cloudflare Pages · n8n (self-hosted, Docker) · Google Sheets API · Twilio WhatsApp (team alerts)

| File | Role |
|---|---|
| `p30-lead-capture.json` | Webhook, validation, returning-lead logic, Sheets write |
| `p30-error-alert.json` | Shared error monitor for every workflow of the system |
| `landing/` | The published landing page (build output) |

All IDs, numbers and credentials in the JSON files are placeholders (`YOUR_...`).

## Key Technical Learnings

- **The n8n Google Sheets `append` node is not safe with simultaneous executions.** It calculates the next row itself, so two leads in the same second write to the same row (2 of 3 were lost in testing). Fix: HTTP Request with the Google credential to `values:append` with `INSERT_ROWS`, which is atomic (5 of 5).
- **CORS on the webhook.** The browser sends a preflight because of `Content-Type: application/json`; the webhook must allow the landing's origin or the POST is blocked.
- **Cache-busting on deploy.** If a visitor gets new HTML with old JS after a field is renamed, the form breaks. The build versions every script and stylesheet (`?v=timestamp`) and the JS accepts the old field name during the change.
- **Respond first, then work.** The webhook answers 200 right after validation, so the visitor never waits for Google Sheets.
