import axios from 'axios'
import { buildNitroSyncEndpoint } from './nitroSyncApi'

const emailEndpoint = buildNitroSyncEndpoint('/v1/emails/send-email')

const emailTimeoutMs = 90000

export const sendNitroSyncEmail = async ({ subject, body, to, attachments = [] }) => {
  const recipients = Array.isArray(to)
    ? to.map((value) => String(value || '').trim()).filter(Boolean)
    : []

  if (!String(subject || '').trim()) {
    throw new Error('Email subject is required.')
  }

  if (!String(body || '').trim()) {
    throw new Error('Email body is required.')
  }

  if (!recipients.length) {
    throw new Error('At least one recipient email is required.')
  }

  const formData = new FormData()
  formData.append('subject', String(subject).trim())
  formData.append('body', String(body).trim())

  recipients.forEach((email) => {
    formData.append('to[]', email)
  })

  attachments
    .filter((file) => file instanceof File || file instanceof Blob)
    .forEach((file) => {
      formData.append('attachments[]', file)
    })

  const response = await axios.post(emailEndpoint, formData, {
    timeout: emailTimeoutMs,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: Boolean(response?.data?.data),
  }
}

export { emailEndpoint, emailTimeoutMs }
