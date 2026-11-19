import { SendEmailCommand, type SESClient } from '@aws-sdk/client-ses'
import { buildTaskSummary, type SummaryTask } from './taskSummary.ts'

type SesSender = Pick<SESClient, 'send'>

export async function sendTaskSummaryEmail(
  client: SesSender,
  input: { from: string; to: string; tasks: SummaryTask[] },
): Promise<void> {
  const summary = buildTaskSummary(input.tasks)

  await client.send(
    new SendEmailCommand({
      Source: input.from,
      Destination: { ToAddresses: [input.to] },
      Message: {
        Subject: { Data: summary.subject, Charset: 'UTF-8' },
        Body: { Text: { Data: summary.text, Charset: 'UTF-8' } },
      },
    }),
  )
}
