import axios from 'axios'
import { buildNitroSyncEndpoint } from './nitroSyncApi'

const aiTaskEndpoint = buildNitroSyncEndpoint('/v1/ai-tasks/send-command')

const aiTaskTimeoutMs = 90000

export const sendNitroSyncAiCommand = async (command) => {
  const trimmedCommand = String(command || '').trim()

  if (!trimmedCommand) {
    throw new Error('AI command is empty.')
  }

  const response = await axios.post(
    aiTaskEndpoint,
    {
      command: trimmedCommand,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: aiTaskTimeoutMs,
    },
  )

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    answer: String(response?.data?.data?.answer || '').trim(),
  }
}

export { aiTaskEndpoint, aiTaskTimeoutMs }
