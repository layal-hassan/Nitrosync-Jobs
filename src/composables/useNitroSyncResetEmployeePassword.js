import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  getNitroSyncErrorMessage,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const resetEmployeePasswordEndpoint = buildNitroSyncEndpoint('/v1/employees/reset-password')

const normalizeValue = (value, fallback = '') => {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

export const resetNitroSyncEmployeePassword = async (
  payload,
  {
    timeout = nitroSyncRequestTimeoutMs,
    relatedCompany,
  } = {},
) => {
  const requestBody = {
    related_company: normalizeValue(relatedCompany ?? payload?.relatedCompany),
    employee_uuid: normalizeValue(payload?.employeeUuid),
    password: normalizeValue(payload?.password),
  }

  if (!requestBody.related_company) {
    throw new Error('related_company is required.')
  }

  if (!requestBody.employee_uuid) {
    throw new Error('employee_uuid is required.')
  }

  if (!requestBody.password) {
    throw new Error('password is required.')
  }

  try {
    const response = await axios.post(resetEmployeePasswordEndpoint, requestBody, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout,
    })
    const responseCode = String(response?.data?.code ?? '').trim()
    const responseMessage = String(response?.data?.message ?? '').trim()

    if (responseCode === '0') {
      throw new Error(responseMessage || 'Failed to reset employee password.')
    }

    return {
      code: responseCode,
      message: responseMessage || 'Employee password reset successfully.',
      data: response?.data?.data ?? null,
    }
  } catch (error) {
    throw new Error(getNitroSyncErrorMessage(error, 'Failed to reset employee password.'))
  }
}

export { resetEmployeePasswordEndpoint }
