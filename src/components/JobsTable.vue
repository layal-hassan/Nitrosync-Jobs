<script setup>
import { computed, ref } from 'vue'
import FilterModal from './FilterModal.vue'
import GetCandidateModal from './modals/GetCandidateModal.vue'
import ShareJobModal from './modals/ShareJobModal.vue'

const props = defineProps({
  jobs: Array,
})

const openMenuIndex = ref(0)
const isFilterOpen = ref(false)
const isGetCandidateModalOpen = ref(false)
const isShareModalOpen = ref(false)
const selectedShareJob = ref(null)
const selectedCandidateJob = ref(null)

const createDefaultFilters = () => ({
  job_title: '',
  address: '',
  country: '',
  job_id: '',
  hiring_stage: '',
  rating: '',
  created_date: '',
  recruiter: '',
  tags: [],
  positions: [],
})

const filterForm = ref(createDefaultFilters())
const defaultStageColors = ['#ea4f8d', '#f0d9e3', '#f0d9e3', '#f0d9e3', '#f0d9e3']

const headers = [
  { key: 'id', label: 'Job ID', width: 'jobs-col--id' },
  { key: 'title', label: 'Job Title', width: 'jobs-col--title' },
  { key: 'date', label: 'Create Date', width: 'jobs-col--date' },
  { key: 'stages', label: 'Stages', width: 'jobs-col--stages' },
  { key: 'tags', label: 'Tags', width: 'jobs-col--tags' },
  { key: 'department', label: 'Department', width: 'jobs-col--department' },
  { key: 'recruiter', label: 'Recruiter', width: 'jobs-col--recruiter' },
  { key: 'action', label: 'Action', width: 'jobs-col--action' },
]

const pages = ['1', '2', '3', '...', '7', '8']

const formatDate = (value) => {
  if (!value) return '--'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()

  return `${day} ${month},${year}`
}

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '--'

  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '--'
  )
}

const departmentPresentation = (value = '') => {
  const normalized = value.toLowerCase()

  if (normalized.includes('local')) {
    return { label: value || 'Local Department', className: 'department department--pink' }
  }

  if (normalized.includes('private')) {
    return { label: value || 'Private Department', className: 'department department--blue' }
  }

  return { label: value || '', className: 'department department--green' }
}

const recruiterPresentation = (index = 0) => {
  const variants = [
    { recruiterClass: 'recruiter recruiter--pink', avatarClass: 'avatar avatar--pink' },
    { recruiterClass: 'recruiter recruiter--blue', avatarClass: 'avatar avatar--blue' },
    { recruiterClass: 'recruiter recruiter--purple', avatarClass: 'avatar avatar--purple' },
    { recruiterClass: 'recruiter recruiter--gold', avatarClass: 'avatar avatar--gold' },
    { recruiterClass: 'recruiter recruiter--green', avatarClass: 'avatar avatar--green' },
    { recruiterClass: 'recruiter recruiter--cyan', avatarClass: 'avatar avatar--cyan' },
  ]

  return variants[index % variants.length]
}

const normalizedJobs = computed(() =>
  (props.jobs || []).map((job, index) => {
    const department = departmentPresentation(job.department?.department_name || '')
    const recruiterName = typeof job.recruiter_name === 'string' ? job.recruiter_name : ''
    const recruiterUi = recruiterPresentation(index)

    return {
      id: job.id ?? '--',
      title: typeof job.job_title === 'string' ? job.job_title : '--',
      date: formatDate(job.created_at),
      stageColors: defaultStageColors,
      tags: [],
      department: department.label,
      departmentClass: department.className,
      recruiter: recruiterName || '--',
      recruiterClass: recruiterUi.recruiterClass,
      avatar: getInitials(recruiterName),
      avatarClass: recruiterUi.avatarClass,
    }
  }),
)

const toggleMenu = (index) => {
  openMenuIndex.value = openMenuIndex.value === index ? null : index
}

const openFilter = () => {
  isFilterOpen.value = true
  openMenuIndex.value = null
}

const closeFilter = () => {
  isFilterOpen.value = false
}

const updateFilters = (nextFilters) => {
  filterForm.value = nextFilters
}

const openShareModal = (job) => {
  selectedShareJob.value = job
  isShareModalOpen.value = true
  openMenuIndex.value = null
}

const closeShareModal = () => {
  isShareModalOpen.value = false
}

const openGetCandidateModal = (job) => {
  selectedCandidateJob.value = job
  isGetCandidateModalOpen.value = true
  openMenuIndex.value = null
}

const closeGetCandidateModal = () => {
  isGetCandidateModalOpen.value = false
}
</script>

<template>
  <section class="jobs-section">
    <div class="jobs-section__top">
      <h1 class="jobs-section__title">JOBS LIST</h1>
      <div class="jobs-controls">
        <div class="jobs-controls__show">
          <span>Show</span>
          <button class="jobs-controls__select">15 <span class="jobs-controls__caret"></span></button>
        </div>
        <div class="jobs-controls__view">
          <button class="jobs-controls__view-btn jobs-controls__view-btn--grid"></button>
          <button class="jobs-controls__view-btn jobs-controls__view-btn--list is-active"></button>
        </div>
        <button class="jobs-controls__filter" @click="openFilter">
          <span class="jobs-controls__filter-icon"></span>
          Filter
        </button>
        <button class="jobs-controls__post">+ Post a job</button>
      </div>
    </div>

    <div class="jobs-card">
      <div class="jobs-header jobs-row">
        <div class="jobs-col jobs-col--select">
          <span class="jobs-radio jobs-radio--filled"></span>
        </div>
        <div
          v-for="header in headers"
          :key="header.key"
          class="jobs-col jobs-header__cell"
          :class="header.width"
        >
          <span>{{ header.label }}</span>
          <span class="jobs-sort"></span>
        </div>
      </div>

      <div
        v-for="(job, index) in normalizedJobs"
        :key="`${job.id}-${job.title}-${index}`"
        class="jobs-row jobs-row--body"
      >
        <div class="jobs-col jobs-col--select">
          <span class="jobs-radio"></span>
        </div>

        <div class="jobs-col jobs-col--id">{{ job.id }}</div>
        <div class="jobs-col jobs-col--title jobs-text-soft">{{ job.title }}</div>
        <div class="jobs-col jobs-col--date">{{ job.date }}</div>

        <div class="jobs-col jobs-col--stages">
          <div class="jobs-stages">
            <span
              v-for="(color, stageIndex) in job.stageColors"
              :key="`${job.id}-${stageIndex}`"
              class="jobs-stages__dot"
              :style="{ backgroundColor: color }"
            ></span>
          </div>
        </div>

        <div class="jobs-col jobs-col--tags">
          <div class="jobs-tags">
            <span v-for="tag in job.tags" :key="tag" class="jobs-tag">{{ tag }}</span>
          </div>
        </div>

        <div class="jobs-col jobs-col--department">
          <span :class="job.departmentClass">{{ job.department }}</span>
        </div>

        <div class="jobs-col jobs-col--recruiter">
          <span :class="job.recruiterClass">
            <span :class="job.avatarClass">{{ job.avatar }}</span>
            {{ job.recruiter }}
          </span>
        </div>

        <div class="jobs-col jobs-col--action jobs-action">
          <button class="jobs-action__trigger" @click="toggleMenu(index)" aria-label="Open actions">
            <span></span><span></span><span></span>
          </button>

          <div v-if="openMenuIndex === index" class="jobs-action__menu">
            <button>View</button>
            <button>Edit</button>
            <button @click="openGetCandidateModal(job)">Get Candidates</button>
            <button @click="openShareModal(job)">Share</button>
          </div>
        </div>
      </div>
    </div>

    <div class="jobs-pagination">
      <button
        v-for="page in pages"
        :key="page"
        class="jobs-pagination__item"
        :class="{ 'is-active': page === '1', 'is-ghost': page === '...' }"
      >
        {{ page }}
      </button>
      <button class="jobs-pagination__next" aria-label="Next page"></button>
    </div>

    <FilterModal
      :open="isFilterOpen"
      :filters="filterForm"
      @close="closeFilter"
      @update:filters="updateFilters"
    />

    <GetCandidateModal
      :open="isGetCandidateModalOpen"
      :job="selectedCandidateJob"
      @close="closeGetCandidateModal"
    />

    <ShareJobModal
      :open="isShareModalOpen"
      :job="selectedShareJob"
      @close="closeShareModal"
    />
  </section>
</template>

<style scoped>
.jobs-section {
  width: 100%;
}

.jobs-section__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.jobs-section__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #111827;
  margin-top: 8px;
  margin-bottom: 16px;
}

.jobs-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.jobs-controls__show {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #8d6977;
  font-size: 14px;
}

.jobs-controls__select,
.jobs-controls__filter,
.jobs-controls__post,
.jobs-controls__view {
  border-radius: 12px;
}

.jobs-controls__select {
  min-width: 54px;
  height: 34px;
  padding: 0 12px;
  border: 0;
  background: #f5d9e4;
  color: #ea4f8d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.jobs-controls__caret {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
  margin-top: -3px;
}

.jobs-controls__view {
  background: #f5d9e4;
  padding: 5px;
  display: flex;
  gap: 6px;
}

.jobs-controls__view-btn {
  width: 28px;
  height: 24px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  position: relative;
}

.jobs-controls__view-btn.is-active {
  background: #ffffff;
}

.jobs-controls__view-btn--grid::before {
  content: '';
  position: absolute;
  inset: 6px;
  background:
    linear-gradient(#ea4f8d, #ea4f8d) left top/6px 6px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) right top/6px 6px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) left bottom/6px 6px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) right bottom/6px 6px no-repeat;
}

.jobs-controls__view-btn--list::before {
  content: '';
  position: absolute;
  left: 7px;
  right: 7px;
  top: 6px;
  height: 2px;
  background: #ea4f8d;
  box-shadow: 0 5px 0 #ea4f8d, 0 10px 0 #ea4f8d;
}

.jobs-controls__filter {
  height: 34px;
  padding: 0 16px;
  border: 0;
  background: #f5d9e4;
  color: #ea4f8d;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.jobs-controls__filter-icon {
  width: 8px;
  height: 8px;
  background: currentColor;
  clip-path: polygon(0 0, 100% 0, 64% 42%, 64% 100%, 36% 100%, 36% 42%);
}

.jobs-controls__post {
  height: 36px;
  padding: 0 18px;
  border: 1px solid #ea4f8d;
  background: transparent;
  color: #ea4f8d;
}

.jobs-card {
  background: #f6f7fb;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: visible;
}

.jobs-row {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.jobs-header {
  background: #f4f5f8;
  border-radius: 12px;
  padding: 16px 20px;
  font-weight: 500;
  margin-bottom: 6px;
}

.jobs-header__cell {
  color: #6b7280;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
}

.jobs-row--body {
  padding: 20px 20px;
  border-bottom: 1px solid #f1f1f4;
  background: #ffffff;
  transition: background-color 0.18s ease;
}

.jobs-row--body:hover {
  background: #fafafb;
}

.jobs-row--body:last-child {
  border-bottom: 0;
}

.jobs-col {
  flex: 0 0 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.jobs-col--select {
  width: 40px;
  display: flex;
  justify-content: center;
}

.jobs-col--id {
  width: 80px;
}

.jobs-col--title {
  width: 200px;
}

.jobs-col--date {
  width: 140px;
}

.jobs-col--stages {
  width: 120px;
}

.jobs-col--tags {
  width: 110px;
}

.jobs-col--department {
  width: 160px;
}

.jobs-col--recruiter {
  width: 160px;
}

.jobs-col--action {
  width: 70px;
}

.jobs-radio {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 1px solid #efadc4;
  display: inline-block;
}

.jobs-radio--filled {
  background: #ea6f9b;
  border-color: #ea6f9b;
}

.jobs-sort {
  width: 8px;
  height: 10px;
  position: relative;
  flex: 0 0 auto;
}

.jobs-sort::before,
.jobs-sort::after {
  content: '';
  position: absolute;
  left: 1px;
  width: 4px;
  height: 4px;
  border-right: 1px solid #d89ab6;
  border-bottom: 1px solid #d89ab6;
}

.jobs-sort::before {
  top: 0;
  transform: rotate(225deg);
}

.jobs-sort::after {
  bottom: 0;
  transform: rotate(45deg);
}

.jobs-text-soft {
  color: #9b6179;
}

.jobs-stages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.jobs-stages__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.jobs-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.jobs-tag {
  background: #f4e8ec;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: #7f6874;
}

:deep(.department) {
  font-size: 13px;
  white-space: nowrap;
}

:deep(.department--pink) { color: #f04f92; }
:deep(.department--blue) { color: #4264ff; }
:deep(.department--indigo) { color: #6d46ec; }
:deep(.department--gold) { color: #df9a00; }
:deep(.department--green) { color: #28b85d; }

:deep(.recruiter) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f7f7f9;
  border-radius: 20px;
  padding: 6px 12px 6px 6px;
  font-size: 13px;
  white-space: nowrap;
}

:deep(.recruiter--pink) { color: #ea5b93; background: #f8eaf0; }
:deep(.recruiter--blue) { color: #486eff; background: #ecf0ff; }
:deep(.recruiter--purple) { color: #6b49e8; background: #efeafd; }
:deep(.recruiter--gold) { color: #cd9200; background: #fff4d9; }
:deep(.recruiter--green) { color: #27a65b; background: #e8f7ed; }
:deep(.recruiter--cyan) { color: #06a8cb; background: #e7f8fb; }

:deep(.avatar) {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
}

:deep(.avatar--pink) { background: linear-gradient(135deg, #ffbdcb, #ec4b8d); }
:deep(.avatar--blue) { background: linear-gradient(135deg, #7fb2ff, #4460ff); }
:deep(.avatar--purple) { background: linear-gradient(135deg, #a08dfd, #754bf0); }
:deep(.avatar--gold) { background: linear-gradient(135deg, #ffd86d, #f0ad08); }
:deep(.avatar--green) { background: linear-gradient(135deg, #7dedb0, #1fbb60); }
:deep(.avatar--cyan) { background: linear-gradient(135deg, #7defff, #0bb0c8); }

.jobs-action {
  position: relative;
  display: flex;
  justify-content: center;
}

.jobs-action__trigger {
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.jobs-action__trigger span {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #ea4f8d;
}

.jobs-action__menu {
  position: absolute;
  top: 8px;
  right: 0;
  width: 164px;
  background: #ffffff;
  border: 1px solid #e8d7df;
  border-radius: 18px;
  box-shadow: 0 12px 24px rgba(137, 103, 119, 0.16);
  padding: 8px 0;
  z-index: 30;
}

.jobs-action__menu button {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 10px 16px;
  color: #8b596a;
  font-size: 14px;
}

.jobs-action__menu button:hover {
  background: #fcf7f9;
}

.jobs-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding-top: 18px;
}

.jobs-pagination__item,
.jobs-pagination__next {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  border: 0;
  background: transparent;
  color: #e78aad;
  font-size: 12px;
  display: grid;
  place-items: center;
}

.jobs-pagination__item.is-active {
  background: #ea4f8d;
  color: #ffffff;
}

.jobs-pagination__item.is-ghost {
  color: #cfb3bf;
}

.jobs-pagination__next::before {
  content: '';
  width: 6px;
  height: 6px;
  border-top: 1.5px solid currentColor;
  border-right: 1.5px solid currentColor;
  transform: rotate(45deg);
}
</style>
