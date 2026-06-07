<script setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'
import JobsTable from '../../components/JobsTable.vue'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from '../../composables/nitroSyncApi'

const jobs = ref([])
const jobsGetAllEndpoint = buildNitroSyncEndpoint('/v1/jobs/get-all')
const defaultCompanyId = 'b00af2a4-2d77-432b-bd93-4e7ea120d154'

const normalizeValue = (value) => String(value ?? '').trim()

const getStoredCompanyId = () => {
  const storageKeys = [
    'nitrosync-user',
    'nitrosync-profile',
    'user',
    'profile',
    'auth-user',
    'currentUser',
  ]

  for (const key of storageKeys) {
    for (const storage of [globalThis.localStorage, globalThis.sessionStorage]) {
      try {
        const rawValue = storage?.getItem?.(key)
        if (!rawValue) continue

        const parsed = JSON.parse(rawValue)
        const companyId = normalizeValue(
          parsed?.related_company
          ?? parsed?.company_uuid
          ?? parsed?.company?.uuid
          ?? parsed?.company?.company_uuid
          ?? parsed?.organization_uuid
          ?? parsed?.organization?.uuid,
        )

        if (companyId) {
          return companyId
        }
      } catch {
        continue
      }
    }
  }

  return defaultCompanyId
}

const fetchJobs = async () => {
  const relatedCompany = getStoredCompanyId()

  if (!relatedCompany) {
    jobs.value = []
    return
  }

  try {
    const response = await axios.post(
      jobsGetAllEndpoint,
      {
        related_company: relatedCompany,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: nitroSyncRequestTimeoutMs,
      },
    )

    jobs.value = Array.isArray(response.data.data) ? response.data.data : []
  } catch (error) {
    console.error(error)
    jobs.value = []
  }
}

onMounted(() => {
  fetchJobs()
})
</script>

<template>
  <div class="page-container jobs-page-container">
    <div class="breadcrumb-row">
      <span class="crumb-home"></span>
      <span class="breadcrumb-sep"></span>
      <span class="breadcrumb-text">Jobs</span>
    </div>

    <JobsTable :jobs="jobs" @refresh-jobs="fetchJobs" />
  </div>
</template>
