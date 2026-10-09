import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ContactForm from './ContactForm'

function submitForm() {
  fireEvent.submit(document.querySelector('form'))
}

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ContactForm', () => {
  it('renders the fields', () => {
    render(<ContactForm />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled()
  })

  it('sends the form and shows the success state', async () => {
    render(<ContactForm />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane' } })
    submitForm()

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('shows an error when the request fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'))

    render(<ContactForm />)
    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(/went wrong/i)
  })

  it('blocks an oversized payload without sending', () => {
    render(<ContactForm />)

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'x'.repeat(11000) },
    })
    submitForm()

    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
