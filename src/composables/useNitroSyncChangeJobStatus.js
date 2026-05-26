import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  getNitroSyncErrorMessage,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const pauseJobEndpoint = buildNitroSyncEndpoint('/v1/jobs/pause-job')
const closeJobEndpoint = buildNitroSyncEndpoint('/v1/jobs/close-job')
const reopenJobEndpoint = buildNitroSyncEndpoint('/v1/jobs/reopen-job')
const archiveJobEndpoint = buildNitroSyncEndpoint('/v1/jobs/archive-job')

const normalizeValue = (value, fallback = '') => {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

const normalizeStatusKey = (value) => {
  const normalized = normalizeValue(value).toLowerCase()

  if (['1', 'draft', 'pending', 'scheduled'].includes(normalized)) return 'draft'
  if (['2', 'active', 'published', 'open', 'live'].includes(normalized)) return 'active'
  if (['3', 'expired', 'expire'].includes(normalized)) return 'expired'
  if (['4', 'on_hold', 'on hold', 'hold', 'paused', 'pause'].includes(normalized)) return 'on_hold'
  if (['5', 'closed', 'close', 'filled'].includes(normalized)) return 'closed'
  if (['6', 'archived', 'archive'].includes(normalized)) return 'archived'

  return normalizeValue(value)
}

export const changeNitroSyncJobStatus = async (
  payload,
  {
    timeout = nitroSyncRequestTimeoutMs,
    relatedCompany,
  } = {},
) => {
  const nextStatusKey = normalizeStatusKey(payload?.status ?? payload?.jobStatus ?? payload?.activeStatus)
  const relatedCompanyValue = normalizeValue(relatedCompany ?? payload?.relatedCompany)
  const jobUuidValue = normalizeValue(payload?.jobUuid)

  if (!relatedCompanyValue) {
    throw new Error('related_company is required.')
  }

  if (!jobUuidValue) {
    throw new Error('job_uuid is required.')
  }

  if (!nextStatusKey) {
    throw new Error('status is required.')
  }

  let endpoint = ''
  let requestBody = {
    related_company: relatedCompanyValue,
    job_uuid: jobUuidValue,
  }

  if (nextStatusKey === 'on_hold') {
    endpoint = pauseJobEndpoint
  } else if (nextStatusKey === 'closed') {
    endpoint = closeJobEndpoint
  } else if (nextStatusKey === 'active') {
    endpoint = reopenJobEndpoint
  } else if (nextStatusKey === 'archived') {
    endpoint = archiveJobEndpoint
  } else {
    throw new Error(`Unsupported job status transition: ${nextStatusKey}. Use the dedicated publish/unpublish flow instead.`)
  }

  try {
    const response = await axios.post(endpoint, requestBody, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout,
    })
    const responseCode = String(response?.data?.code ?? '').trim()
    const responseMessage = String(response?.data?.message ?? '').trim()

    if (responseCode === '0') {
      throw new Error(responseMessage || 'Failed to change job status.')
    }

    return {
      code: responseCode,
      message: responseMessage || 'Job status updated successfully.',
      data: response?.data?.data ?? null,
    }
  } catch (error) {
    throw new Error(getNitroSyncErrorMessage(error, 'Failed to change job status.'))
  }
}

export {
  archiveJobEndpoint,
  closeJobEndpoint,
  pauseJobEndpoint,
  reopenJobEndpoint,
}
