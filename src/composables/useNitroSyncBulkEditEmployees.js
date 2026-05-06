import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  getNitroSyncErrorMessage,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const bulkEditEmployeesEndpoint = buildNitroSyncEndpoint('/v1/employees/bulk-edit')

const normalizeValue = (value) => String(value ?? '').trim()

export const bulkEditNitroSyncEmployees = async (
  payload,
  { timeout = nitroSyncRequestTimeoutMs } = {},
) => {
  const requestBody = {
    related_company: normalizeValue(payload?.relatedCompany),
    employees_uuids: Array.isArray(payload?.employeeUuids)
      ? payload.employeeUuids.map(normalizeValue).filter(Boolean)
      : [],
    edit_fields: Array.isArray(payload?.editFields)
      ? payload.editFields.map(normalizeValue).filter(Boolean)
      : [],
  }

  if (!requestBody.related_company) {
    throw new Error('related_company is required.')
  }

  if (!requestBody.employees_uuids.length) {
    throw new Error('At least one employee_uuid is required.')
  }

  if (!requestBody.edit_fields.length) {
    throw new Error('At least one edit field is required.')
  }

  try {
    const response = await axios.post(bulkEditEmployeesEndpoint, requestBody, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout,
    })

    return {
      code: String(response?.data?.code ?? '').trim(),
      message: String(response?.data?.message ?? '').trim(),
      data: response?.data?.data ?? null,
    }
  } catch (error) {
    throw new Error(getNitroSyncErrorMessage(error, 'Failed to bulk edit employees.'))
  }
}

export { bulkEditEmployeesEndpoint }
