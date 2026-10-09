import { useState } from 'react'
import './ContactForm.css'

const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT

// Reject oversized submissions before they leave the browser (the server re-checks).
const MAX_PAYLOAD_BYTES = 10 * 1024

if (!ENDPOINT || !/^https:\/\//i.test(ENDPOINT)) {
  throw new Error(
    "VITE_CONTACT_ENDPOINT must be set and use https://. Add it to .env or your host's environment variables.",
  )
}

export default function ContactForm() {
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [ts] = useState(() => Date.now()) // anti-spam: form load time

  function payloadTooLarge(form) {
    let bytes = 0
    for (const [key, value] of new FormData(form)) {
      if (typeof value === 'string') bytes += key.length + value.length
    }
    return bytes > MAX_PAYLOAD_BYTES
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget

    if (payloadTooLarge(form)) {
      setStatus('error')
      return
    }

    setStatus('sending')

    try {
      await fetch(ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        mode: 'no-cors',
      })
      form.reset()
      setStatus('success')
    } catch {
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
              <input id="cf-name" type="text" name="name" placeholder="John Smith" required />
            </div>
            <div className="cf-field">
              <label htmlFor="cf-email">Email <span>*</span></label>
              <input id="cf-email" type="email" name="email" placeholder="john@example.com" required />
            </div>
          </div>

          <div className="cf-field">
            <label htmlFor="cf-phone">Phone</label>
            <input id="cf-phone" type="tel" name="phone" placeholder="+1 000 000 0000" />
          </div>

          <div className="cf-field">
            <label htmlFor="cf-message">Message <span>*</span></label>
            <textarea id="cf-message" name="message" placeholder="Your message..." rows={6} required />
          </div>

          {status === 'error' && (
            <p role="alert" className="cf-error">
              Something went wrong. Please try again.
            </p>
          )}

          <button type="submit" className="cf-submit" disabled={status === 'sending'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
