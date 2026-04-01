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

const fetchJobs = async () => {
  try {
    const response = await axios.post(
      jobsGetAllEndpoint,
      {
        related_company: 'b00af2a4-2d77-432b-bd93-4e7ea120d154',
      },
      {
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
  <div class="page-container">
    <div class="breadcrumb-row">
      <span class="crumb-home"></span>
      <span class="breadcrumb-sep"></span>
      <span class="breadcrumb-text">Jobs</span>
    </div>

    <JobsTable :jobs="jobs" />
  </div>
</template>
