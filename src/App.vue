<script setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'
import logoImage from './assets/logo.png'
import JobsTable from './components/JobsTable.vue'

const navItems = ['Job', 'Employee', 'Reports', 'Payroll', 'Adbuilder', 'Survey', 'Support']

const jobs = ref([])

const fetchJobs = async () => {
  try {
    const response = await axios.post('https://www.nitrosync.cloud/api/v1/jobs/getAll', {
      related_company: 'b00af2a4-2d77-432b-bd93-4e7ea120d154',
    })

    jobs.value = Array.isArray(response.data.data) ? response.data.data : []
    console.log('Jobs loaded:', jobs.value)
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
  <div class="page-bg">
    <div class="page-canvas">
      <header class="topbar">
        <div class="brand">
          <img :src="logoImage" alt="Nitrosync logo" class="brand__mark" />
          <div class="brand__text">
            <div class="brand__title">NitroSync</div>
            <div class="brand__subtitle">Recruitment in another perspective</div>
          </div>
        </div>

        <nav class="nav-tabs">
          <a
            v-for="item in navItems"
            :key="item"
            href="#"
            class="nav-tabs__item"
            :class="{ 'nav-tabs__item--active': item === 'Job' }"
          >
            {{ item }}
          </a>
        </nav>

        <div class="topbar-actions">
          <button class="icon-btn" aria-label="Search">
            <svg class="icon-svg icon-svg--search" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="7.25" fill="none" stroke="currentColor" stroke-width="2" />
              <path d="M16.2 16.2 21 21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
          <div class="quick-icons">
            <button class="icon-btn icon-btn--chip" aria-label="Settings">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3.8 13.2 5l1.8-.1 1 1.5-.8 1.6 1 1.4 1.7.5v1.8l-1.7.5-1 1.4.8 1.6-1 1.5-1.8-.1L12 20.2l-1.2-1.2-1.8.1-1-1.5.8-1.6-1-1.4-1.7-.5v-1.8l1.7-.5 1-1.4-.8-1.6 1-1.5 1.8.1L12 3.8Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.6" />
              </svg>
            </button>
            <button class="icon-btn icon-btn--chip" aria-label="Notifications">
              <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7.5 16.5h9.1c-.86-1.02-1.29-2.29-1.29-3.8v-1.4a3.31 3.31 0 0 0-6.62 0v1.4c0 1.51-.43 2.78-1.19 3.8Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                <path d="M10.2 18.2a2.02 2.02 0 0 0 3.6 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="profile-chip">
            <div class="profile-chip__avatar">TA</div>
            <div>
              <div class="profile-chip__name">Tareq Ahmad</div>
              <div class="profile-chip__mail">elias@nitrosync.com</div>
            </div>
            <span class="profile-chip__caret"></span>
          </div>
        </div>
      </header>

      <main class="content">
        <div class="page-container">
          <div class="breadcrumb-row">
            <span class="crumb-home"></span>
            <span class="breadcrumb-sep"></span>
            <span class="breadcrumb-text">Jobs</span>
          </div>

          <JobsTable :jobs="jobs" />
        </div>
      </main>
    </div>
  </div>
</template>
