import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const getOneCompanyEndpoint = buildNitroSyncEndpoint('/v1/companies/getOne')

const normalizeCompanyName = (payload = {}) =>
  String(
    payload?.company_name
    ?? payload?.companyName
    ?? payload?.name
    ?? payload?.data?.company_name
    ?? payload?.data?.companyName
    ?? payload?.data?.name
    ?? '',
  ).trim()

export const fetchNitroSyncCompany = async (relatedCompany, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(
    getOneCompanyEndpoint,
    {
      related_company: String(relatedCompany || '').trim(),
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    },
  )

  const responseData = response?.data
  const companyData =
    responseData?.data?.company
    ?? responseData?.data
    ?? responseData?.company
    ?? responseData

  return {
    raw: companyData,
    companyName: normalizeCompanyName(companyData),
  }
}

export { getOneCompanyEndpoint }
