import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const scoreCardsEndpoint = buildNitroSyncEndpoint('/v1/score-cards/get-all')
const createScoreCardEndpoint = buildNitroSyncEndpoint('/v1/score-cards/create')
const deleteScoreCardEndpoint = buildNitroSyncEndpoint('/v1/score-cards/delete')

const mapScoreCard = (item, index) => {
  const title = String(
    item?.score_card_name
    ?? item?.name
    ?? item?.title
    ?? item?.scorecard_name
    ?? '',
  ).trim()

  if (!title) return null

  const owner = String(
    item?.owner_name
    ?? item?.created_by_name
    ?? item?.interviewer_name
    ?? item?.owner
    ?? 'Team member',
  ).trim()

  return {
    uuid: String(
      item?.score_card_uuid
      ?? item?.uuid
      ?? item?.id
      ?? '',
    ).trim() || `score-card-${index + 1}`,
    title,
    owner: owner || `Owner ${index + 1}`,
    action: 'Edit card',
    raw: item,
  }
}

export const fetchNitroSyncScoreCards = async (relatedCompany, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(
    scoreCardsEndpoint,
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

  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : []

  return rows
    .map(mapScoreCard)
    .filter(Boolean)
}

export const createNitroSyncScoreCard = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(createScoreCardEndpoint, payload, {
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

export const deleteNitroSyncScoreCard = async (scoreCardUuid, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(
    deleteScoreCardEndpoint,
    {
      score_card_uuid: String(scoreCardUuid || '').trim(),
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

export { createScoreCardEndpoint, deleteScoreCardEndpoint, scoreCardsEndpoint }
