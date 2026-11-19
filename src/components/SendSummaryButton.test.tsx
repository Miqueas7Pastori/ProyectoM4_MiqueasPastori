import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SendSummaryButton } from './SendSummaryButton.tsx'

vi.mock('../services/auth.ts', () => ({
  getIdToken: vi.fn().mockResolvedValue('token-de-prueba'),
}))

describe('SendSummaryButton', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('muestra el error cuando SES no puede enviar el resumen', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'No se pudo enviar el resumen. Intentá de nuevo.' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(
      <SendSummaryButton tasks={[{ title: 'Estudiar', completed: false }]} disabled={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Enviar resumen por email' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo enviar el resumen. Intentá de nuevo.',
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/send-summary',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-de-prueba',
        }),
      }),
    )

    const options = fetchMock.mock.calls[0]?.[1] as { body?: string }
    expect(options.body).toBe(JSON.stringify({ tasks: [{ title: 'Estudiar', completed: false }] }))
    expect(options.body).not.toContain('AWS_SECRET_ACCESS_KEY')
  })
})
