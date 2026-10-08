import { useState } from 'react'
import './ContactForm.css'

const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT

if (!ENDPOINT) {
  throw new Error('VITE_CONTACT_ENDPOINT is not set. Add it to .env or your host\'s environment variables.')
}

export default function ContactForm() {
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  async function handleSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
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
          <div className="cf-field">
            <label>Date <span>*</span></label>
            <input type="date" name="date" required />
          </div>

          <div className="cf-row">
            <div className="cf-field">
              <label>Name <span>*</span></label>
              <input type="text" name="name" placeholder="John Smith" required />
            </div>
            <div className="cf-field">
              <label>Email <span>*</span></label>
              <input type="email" name="email" placeholder="john@example.com" required />
            </div>
          </div>

          <div className="cf-field">
            <label>Phone</label>
            <input type="tel" name="phone" placeholder="+1 000 000 0000" />
          </div>

          <div className="cf-field">
            <label>Message <span>*</span></label>
            <textarea name="message" placeholder="Your message..." rows={6} required />
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
        </form>
      </div>
    </div>
  )
}
