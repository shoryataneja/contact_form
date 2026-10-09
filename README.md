# Contact Form

A small React + Vite contact form that posts submissions to a Google Apps Script
web app, which appends the row to a Google Sheet and emails a notification via Gmail.

## Setup

1. Copy `.env.example` to `.env` and set the deployed Apps Script `/exec` URL:

   ```
   VITE_CONTACT_ENDPOINT=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
   ```

   The URL must use `https://`; the build fails otherwise.

2. Deploy the backend in `apps-script/Code.gs` (see the setup notes at the top of
   that file). It is git-ignored because it holds the sheet ID and notification address.

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – production build
- `npm run preview` — preview the production build
- `npm run lint` — ESLint
- `npm test` — Vitest

## Security notes

- Client and server validate and size-limit every field (limits are mirrored in
  `ContactForm.jsx` and `apps-script/Code.gs`).
- The endpoint applies a honeypot, a fill-time gate, per-email and global rate
  limits, duplicate suppression, and a formula-injection guard before writing rows.
- The form posts a `FormData` body directly to the Apps Script endpoint. Because
  that is a "simple" request it needs no CORS preflight (which Apps Script cannot
  answer), and Apps Script's redirect target allows the response to be read. The
  endpoint always replies with JSON, so validation, rate-limit, and other errors
  surface to the visitor.
