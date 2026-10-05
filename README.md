# Selar Anniversary Exhibition: digital invitation

Personalised invitation + RSVP for invited guests, and a small admin for the Selar team.
Built with Next.js 14. Out-of-scope items from the PRD (tickets, payments, check-in, SMS/WhatsApp) are intentionally not built.

## Run

```bash
npm install
ADMIN_PASSWORD=choose-one npm run dev   # http://localhost:3000/admin
npm test
```

## Environment variables

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | **Required** to use `/admin`. Admin is disabled without it. |
| `SESSION_SECRET` | Optional. Signs the admin cookie (defaults to the password). |
| `SITE_URL` | Public origin used in emails and calendar files, e.g. `https://selar.com`. |
| `RESEND_API_KEY`, `MAIL_FROM` | Send real email via Resend. Without a key, emails are only logged to the server console. |
| `ADMIN_NOTIFY_EMAIL` | Optional. Gets an email on every RSVP / decline. |
| `WEBHOOK_SECRET` | Optional. Point a Resend `email.delivered` webhook at `/api/webhooks/resend?secret=…` to populate the Delivered count. |
| `DATA_FILE` | Optional. Path of the JSON data file (default `.data/selar-invitations.json`). |

## Before launch

- **Storage:** data lives in a JSON file (`lib/store.js`). That works locally but is **ephemeral on Vercel**. Replace `snapshot`/`mutate` with a real database before inviting guests.
- Set the event date, venue and address in `/admin → Event details` (they ship as placeholders).
- Swap `--accent` and fonts in `app/globals.css` for the Selar anniversary identity.

## How it works

- Each guest gets an unguessable link (`/invite/<name>-<random>`). RSVPs attach to that guest record, so a forwarded link can't create or transfer an invitation.
- "Opened" is recorded when the guest taps *Open invitation*.
- Import CSV columns: `Name, Email, Phone, Guest Type` (+ optional `Company, Role, Plus One Allowed`). Blank *Plus One Allowed* means allowed.
- Reminders (RSVP, 24 hours before, event day) and updates are sent manually from the admin; there is no scheduler yet.
