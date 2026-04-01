import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const applicationFormsCreateEndpoint = buildNitroSyncEndpoint('/v1/application-forms/create')
const applicationFormsUpdateEndpoint = buildNitroSyncEndpoint('/v1/application-forms/update')
const applicationFormsDeleteEndpoint = buildNitroSyncEndpoint('/v1/application-forms/delete')
const applicationFormsGetAllEndpoint = buildNitroSyncEndpoint('/v1/application-forms/get-all')
const applicationFormsGetOneEndpoint = buildNitroSyncEndpoint('/v1/application-forms/get-one')
const applicationFormQuestionsEndpoint = buildNitroSyncEndpoint('/v1/application-forms/get-application-questions')
const createApplicationQuestionEndpoint = buildNitroSyncEndpoint('/v1/application-forms/create-application-question')

const normalizeRows = (response) => {
  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : []

  return rows
    .map((item) => ({
      id: String(item?.id ?? item?.application_form_id ?? item?.uuid ?? '').trim(),
      job_uuid: String(item?.job_uuid ?? item?.jobId ?? '').trim(),
      related_company: String(item?.related_company ?? item?.company_uuid ?? '').trim(),
      first_name: String(item?.first_name ?? '').trim(),
      last_name: String(item?.last_name ?? '').trim(),
      email: String(item?.email ?? '').trim(),
      gender: String(item?.gender ?? '').trim(),
      country: String(item?.country ?? '').trim(),
      full_address: String(item?.full_address ?? '').trim(),
      current_job_title: String(item?.current_job_title ?? '').trim(),
      company: String(item?.company ?? '').trim(),
      ethnicity: String(item?.ethnicity ?? '').trim(),
      disability: String(item?.disability ?? '').trim(),
      upload_cv: String(item?.upload_cv ?? '').trim(),
      upload_cover_letter: String(item?.upload_cover_letter ?? '').trim(),
      raw: item,
    }))
    .filter((item) => item.id || item.job_uuid)
}

export const fetchNitroSyncApplicationForms = async ({ timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(
    applicationFormsGetAllEndpoint,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    },
  )

  return normalizeRows(response)
}

export const fetchNitroSyncApplicationForm = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(applicationFormsGetOneEndpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  })

  const rows = normalizeRows(response)
  return rows[0] || null
}

export const createNitroSyncApplicationForm = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(applicationFormsCreateEndpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export const updateNitroSyncApplicationForm = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(applicationFormsUpdateEndpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export const deleteNitroSyncApplicationForm = async (id, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(
    applicationFormsDeleteEndpoint,
    {
      id: String(id || '').trim(),
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    },
  )

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export const fetchNitroSyncApplicationQuestions = async ({ timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.get(applicationFormQuestionsEndpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  })

  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : []

  return rows
    .map((item) => ({
      id: String(item?.id ?? item?.application_question_id ?? item?.uuid ?? '').trim(),
      type: String(item?.type ?? '').trim().toLowerCase(),
      question: String(item?.question ?? item?.name ?? item?.title ?? '').trim(),
    }))
    .filter((item) => item.question)
}

export const createNitroSyncApplicationQuestion = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(createApplicationQuestionEndpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export {
  applicationFormQuestionsEndpoint,
  applicationFormsCreateEndpoint,
  applicationFormsDeleteEndpoint,
  applicationFormsGetAllEndpoint,
  applicationFormsGetOneEndpoint,
  applicationFormsUpdateEndpoint,
  createApplicationQuestionEndpoint,
}
