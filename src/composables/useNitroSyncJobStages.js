import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const getAllJobStagesEndpoint = buildNitroSyncEndpoint('/v1/jobs-stages/get-all')
const getOneJobStageEndpoint = buildNitroSyncEndpoint('/v1/jobs-stages/get-one')
const getStageCandidatesEndpoint = buildNitroSyncEndpoint('/v1/jobs-stages/get-stage-candidates')
const createJobStageEndpoint = buildNitroSyncEndpoint('/v1/jobs-stages/create')
const editJobStageEndpoint = buildNitroSyncEndpoint('/v1/jobs-stages/edit')
const deleteJobStageEndpoint = buildNitroSyncEndpoint('/v1/jobs-stages/delete')

const jsonHeaders = {
  'Content-Type': 'application/json',
}

const normalizeValue = (value) => String(value ?? '').trim()

const getStageLabel = (item, index = 0) =>
  normalizeValue(
    item?.stage_name
    ?? item?.job_stage_name
    ?? item?.job_stage?.stage_name
    ?? item?.job_stage?.job_stage_name
    ?? item?.job_stage?.name
    ?? item?.job_stage?.title
    ?? item?.stage?.stage_name
    ?? item?.stage?.job_stage_name
    ?? item?.stage?.name
    ?? item?.stage?.title
    ?? item?.name
    ?? item?.title
    ?? item?.label,
  ) || `Stage ${index + 1}`

const getStageUuid = (item) =>
  normalizeValue(
    item?.job_stage_uuid
    ?? item?.stage_uuid
    ?? item?.job_stage?.job_stage_uuid
    ?? item?.job_stage?.stage_uuid
    ?? item?.job_stage?.uuid
    ?? item?.stage?.job_stage_uuid
    ?? item?.stage?.stage_uuid
    ?? item?.stage?.uuid
    ?? item?.uuid
    ?? item?.id,
  )

const normalizeCandidateCard = (item) => {
  const candidateUuid = normalizeValue(
    item?.candidate_uuid
    ?? item?.uuid
    ?? item?.id
    ?? item?.candidate_id
    ?? item?.application_form_id
    ?? item?.candidate?.candidate_uuid
    ?? item?.candidate?.uuid
    ?? item?.candidate?.id,
  )

  if (!candidateUuid) return null

  const firstName = normalizeValue(item?.first_name ?? item?.candidate?.first_name)
  const lastName = normalizeValue(item?.last_name ?? item?.candidate?.last_name)
  const fullName = normalizeValue(
    item?.full_name
    ?? item?.candidate_name
    ?? item?.name
    ?? item?.candidate?.full_name
    ?? item?.candidate?.name
    ?? item?.candidate_details?.full_name
    ?? item?.candidate_details?.name,
  )

  return {
    candidate_uuid: candidateUuid,
    name: fullName || [firstName, lastName].filter(Boolean).join(' ').trim() || 'Candidate',
    role: normalizeValue(
      item?.current_position
      ?? item?.position
      ?? item?.title
      ?? item?.candidate?.current_position
      ?? item?.job_title
      ?? item?.candidate?.job_title,
    ) || 'Candidate',
    email: normalizeValue(
      item?.email
      ?? item?.candidate?.email
      ?? item?.candidate_details?.email,
    ),
    raw: item,
  }
}

const normalizeCandidateRows = (response) => {
  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data?.candidates)
      ? response.data.candidates
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.data?.rows)
          ? response.data.rows
    : Array.isArray(response?.data)
      ? response.data
      : []

  return rows
    .map(normalizeCandidateCard)
    .filter(Boolean)
}

const normalizeStageCandidateRows = (item) => {
  const rows = Array.isArray(item?.candidates)
    ? item.candidates
    : Array.isArray(item?.job_stage?.candidates)
      ? item.job_stage.candidates
      : Array.isArray(item?.stage?.candidates)
        ? item.stage.candidates
        : []

  return rows
    .map(normalizeCandidateCard)
    .filter(Boolean)
}

export const fetchNitroSyncJobStages = async (relatedCompany, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(
    getAllJobStagesEndpoint,
    { related_company: relatedCompany },
    { headers: jsonHeaders, timeout },
  )

  if (response?.data?.code && String(response.data.code) !== '1') {
    throw new Error(response?.data?.message || 'Failed to fetch job stages.')
  }

  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : []

  const groupedRows = new Map()

  rows.forEach((item, index) => {
    const label = getStageLabel(item, index)
    const jobStageUuid = getStageUuid(item)
    const key = jobStageUuid || label.toLowerCase()
    const stageCandidateCards = normalizeStageCandidateRows(item)

    if (!groupedRows.has(key)) {
      groupedRows.set(key, {
        jobStageUuid,
        label,
        enabled: item?.enabled ?? item?.is_enabled ?? item?.active ?? false,
        cards: [...stageCandidateCards],
        raw: item,
      })
    }

    const entry = groupedRows.get(key)

    if (!entry.jobStageUuid && jobStageUuid) {
      entry.jobStageUuid = jobStageUuid
    }

    if ((!entry.label || entry.label.startsWith('Stage ')) && label) {
      entry.label = label
    }

    if (stageCandidateCards.length && !entry.cards.length) {
      entry.cards = [...stageCandidateCards]
    }
  })

  return Array.from(groupedRows.values()).filter((item) => item.label || item.jobStageUuid)
}

export const fetchNitroSyncJobStage = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(getOneJobStageEndpoint, payload, {
    headers: jsonHeaders,
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export const fetchNitroSyncJobStageCandidates = async (jobStageUuid, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const normalizedJobStageUuid = normalizeValue(jobStageUuid)

  if (!normalizedJobStageUuid) return []

  const response = await axios.post(
    getStageCandidatesEndpoint,
    { job_stage_uuid: normalizedJobStageUuid },
    {
      headers: jsonHeaders,
      timeout,
    },
  )

  if (String(response?.data?.code) === '-15000') {
    return []
  }

  if (response?.data?.code && String(response.data.code) !== '1') {
    throw new Error(response?.data?.message || 'Failed to fetch stage candidates.')
  }

  return normalizeCandidateRows(response)
}

export const createNitroSyncJobStage = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(createJobStageEndpoint, payload, {
    headers: jsonHeaders,
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export const updateNitroSyncJobStage = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(editJobStageEndpoint, payload, {
    headers: jsonHeaders,
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export const deleteNitroSyncJobStage = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(deleteJobStageEndpoint, payload, {
    headers: jsonHeaders,
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export {
  createJobStageEndpoint,
  deleteJobStageEndpoint,
  editJobStageEndpoint,
  getAllJobStagesEndpoint,
  getOneJobStageEndpoint,
  getStageCandidatesEndpoint,
}
