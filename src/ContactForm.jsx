import { useState } from 'react'
import './ContactForm.css'

const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT
const ENDPOINT_VALID = /^https:\/\//i.test(ENDPOINT || '')

if (!ENDPOINT_VALID) {
  // vite.config.js already fails the build; this only guards a misconfigured dev/prod host.
  console.error(
    "VITE_CONTACT_ENDPOINT must be set and use https://. Add it to .env or your host's environment variables.",
  )
}

// Keep in sync with LIMITS in apps-script/Code.gs.
const MAX = { name: 100, email: 200, phone: 30, message: 5000 }

// Total payload ceiling across all fields (matches MAX_TOTAL_CHARS in Code.gs).
const MAX_TOTAL_CHARS = 10000

const GENERIC_ERROR = 'Something went wrong. Please try again.'

// Error codes the Apps Script endpoint can return, mapped to user-facing copy.
const ERROR_MESSAGES = {
  'payload-too-large': 'Your message is too long. Please shorten it and try again.',
  'rate-limited': 'Too many messages in a short time. Please try again in a few minutes.',
  invalid: 'Please check your name, email and message, then try again.',
}

export default function ContactForm() {
  if (!ENDPOINT_VALID) {
    return (
      <div className="cf-wrapper">
        <div className="cf-card">
          <h2>Form unavailable</h2>
          <p>This form isn't configured yet. Please email us directly.</p>
        </div>
      </div>
    )
  }
  return <ContactFormFields />
}

function ContactFormFields() {
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState(GENERIC_ERROR)
  const [ts] = useState(() => Date.now()) // anti-spam: form load time

  function payloadTooLarge(form) {
    let chars = 0
    for (const [key, value] of new FormData(form)) {
      if (typeof value === 'string') chars += key.length + value.length
    }
    return chars > MAX_TOTAL_CHARS
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget

    if (payloadTooLarge(form)) {
      setErrorMsg(ERROR_MESSAGES['payload-too-large'])
      setStatus('error')
      return
    }

    setStatus('sending')

    try {
      // A FormData body is a "simple" request, so the browser sends it without a
      // CORS preflight, and Apps Script's redirect target allows reading the response.
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
      })
      const data = await res.json().catch(() => null)
      // A JSON error from the endpoint is authoritative. A non-JSON 200 (an older
      // deployment that returns plain "OK") is treated as success so a stale
      // backend degrades gracefully instead of showing a false error.
      if (!res.ok || data?.ok === false) {
        setErrorMsg(ERROR_MESSAGES[data?.error] || GENERIC_ERROR)
        setStatus('error')
        return
      }
      form.reset()
      setStatus('success')
    } catch {
      setErrorMsg(GENERIC_ERROR)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="cf-wrapper">
        <div className="cf-card">
          <h2>Message sent!</h2>
          <p>We'll be in touch within one business day.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="cf-wrapper">
      <div className="cf-card">
        <h1>Send us a message</h1>
        <p className="cf-subtitle">Fill in the form and we'll be in touch within one business day.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="leave_this_empty"
            className="cf-hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <input type="hidden" name="_ts" value={ts} readOnly />

          <div className="cf-field">
            <label htmlFor="cf-date">Date <span>*</span></label>
            <input id="cf-date" type="date" name="date" required />
          </div>

          <div className="cf-row">
            <div className="cf-field">
              <label htmlFor="cf-name">Name <span>*</span></label>
              <input
                id="cf-name"
                type="text"
                name="name"
                placeholder="John Smith"
                maxLength={MAX.name}
                required
              />
            </div>
            <div className="cf-field">
              <label htmlFor="cf-email">Email <span>*</span></label>
              <input
                id="cf-email"
                type="email"
                name="email"
                placeholder="john@example.com"
                maxLength={MAX.email}
                required
              />
            </div>
          </div>

          <div className="cf-field">
            <label htmlFor="cf-phone">Phone</label>
            <input
              id="cf-phone"
              type="tel"
              name="phone"
              placeholder="+1 000 000 0000"
              maxLength={MAX.phone}
            />
          </div>

          <div className="cf-field">
            <label htmlFor="cf-message">Message <span>*</span></label>
            <textarea
              id="cf-message"
              name="message"
              placeholder="Your message..."
              rows={6}
              maxLength={MAX.message}
              required
            />
          </div>

          {status === 'error' && (
            <p role="alert" className="cf-error">
              {errorMsg}
            </p>
          )}

          <button type="submit" className="cf-submit" disabled={status === 'sending'}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {status === 'sending' ? 'Sending…' : 'Send Message'}
          </button>

          <p className="cf-privacy">
            Your details are sent to us and stored in a private Google Sheet, and emailed to our
            inbox via Gmail, only so we can reply to your enquiry. We keep them for up to 12 months
            and then delete them. To have your details removed sooner, email{' '}
            <a href="mailto:shoryataneja5@gmail.com">shoryataneja5@gmail.com</a>.
          </p>
        </form>
      </div>
    </div>
  )
}
