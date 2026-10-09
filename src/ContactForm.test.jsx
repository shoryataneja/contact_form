import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ContactForm from './ContactForm'

const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT

function submitForm() {
  fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form'))
}

function jsonResponse(body, init = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
})

afterEach(cleanup)

describe('ContactForm', () => {
  it('renders the fields with field limits', () => {
    render(<ContactForm />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toHaveAttribute('maxlength', '5000')
    expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled()
  })

  it('posts the form to the configured endpoint and shows success', async () => {
    render(<ContactForm />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hello' } })
    submitForm()

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    const [url, options] = globalThis.fetch.mock.calls[0]
    expect(url).toBe(ENDPOINT)
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('name')).toBe('Jane')
    expect(options.mode).toBeUndefined()
  })

  it('treats a non-JSON 200 (a stale "OK" endpoint) as success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('not json')
      },
    })

    render(<ContactForm />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane' } })
    submitForm()

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument()
  })

  it('shows the server error message from the response body', async () => {    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: false, error: 'rate-limited' }))

    render(<ContactForm />)
    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many messages/i)
  })

  it('shows an error when the request fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'))

    render(<ContactForm />)
    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(/went wrong/i)
  })

  it('rejects an oversized submission before sending', async () => {
    render(<ContactForm />)

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'x'.repeat(11000) } })
    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(/too long/i)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
