import { SendEmailCommand } from '@aws-sdk/client-ses'
import { describe, expect, it, vi } from 'vitest'
import { sendTaskSummaryEmail } from './sendTaskSummaryEmail.ts'

vi.mock('@aws-sdk/client-ses', () => {
  class SendEmailCommand {
    readonly input: unknown

    constructor(input: unknown) {
      this.input = input
    }
  }

  class SESClient {
    send = vi.fn()
  }

  return { SendEmailCommand, SESClient }
})

const tasks = [
  { title: 'Comprar café', completed: true },
  { title: 'Estudiar', completed: false },
  { title: 'Cerrar el día', completed: false },
]

describe('sendTaskSummaryEmail', () => {
  it('arma el resumen y lo envía con el cliente de SES', async () => {
    const send = vi.fn().mockResolvedValue({})

    await sendTaskSummaryEmail({ send }, { from: 'noreply@matecode.test', to: 'ana@mail.com', tasks })

    expect(send).toHaveBeenCalledOnce()
    const command = send.mock.calls[0]?.[0]
    expect(command).toBeInstanceOf(SendEmailCommand)
    expect(command?.input.Source).toBe('noreply@matecode.test')
    expect(command?.input.Destination?.ToAddresses).toEqual(['ana@mail.com'])
    expect(command?.input.Message?.Subject?.Data).toBe('Resumen de tus tareas')

    const body = command?.input.Message?.Body?.Text?.Data ?? ''
    expect(body).toContain('Total: 3')
    expect(body).toContain('Completadas: 1')
    expect(body).toContain('Pendientes: 2')
    expect(body).toContain('- Comprar café')
    expect(body).toContain('- Estudiar')
    expect(body).toContain('- Cerrar el día')
  })

  it('informa cero tareas cuando la lista está vacía', async () => {
    const send = vi.fn().mockResolvedValue({})

    await sendTaskSummaryEmail(
      { send },
      { from: 'noreply@matecode.test', to: 'ana@mail.com', tasks: [] },
    )

    const command = send.mock.calls[0]?.[0]
    const body = command?.input.Message?.Body?.Text?.Data ?? ''
    expect(body).toContain('Total: 0')
    expect(body).toContain('Completadas: 0')
    expect(body).toContain('Pendientes: 0')
    expect(body).toContain('- Ninguna')
  })

  it('propaga el fallo del cliente de SES', async () => {
    const send = vi.fn().mockRejectedValue(new Error('SES no disponible'))

    await expect(
      sendTaskSummaryEmail({ send }, { from: 'noreply@matecode.test', to: 'ana@mail.com', tasks }),
    ).rejects.toThrow('SES no disponible')
  })
})
