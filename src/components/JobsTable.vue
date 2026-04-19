<script setup>
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  deleteNitroSyncApplicationForm,
  fetchNitroSyncApplicationForms,
} from '../composables/useNitroSyncApplicationForms'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from '../composables/nitroSyncApi'
import FilterModal from './FilterModal.vue'
import GetCandidateModal from './modals/GetCandidateModal.vue'
import ShareJobModal from './modals/ShareJobModal.vue'
import Dropdown from './ui/Dropdown.vue'

const props = defineProps({
  jobs: Array,
})

const openMenuIndex = ref(null)
const openStageTooltip = ref('')
const isFilterOpen = ref(false)
const isGetCandidateModalOpen = ref(false)
const isShareModalOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const selectedShareJob = ref(null)
const selectedCandidateJob = ref(null)
const selectedDeleteJob = ref(null)
const deleteDialogError = ref('')
const viewMode = ref('list')
const pageSize = ref(15)
const currentPage = ref(1)
const deletingJobUuid = ref('')
const deletedJobUuids = ref([])
const viewingJobUuid = ref('')
const router = useRouter()
const deleteJobEndpoint = buildNitroSyncEndpoint('/v1/jobs/delete')
const getOneJobEndpoint = buildNitroSyncEndpoint('/v1/jobs/get-one')

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
const stageDefinitions = [
  { key: 'new', label: 'New', color: '#ea4f8d', mutedColor: '#f8d4e3' },
  { key: 'screen', label: 'Screen', color: '#3f6fff', mutedColor: '#dbe4ff' },
  { key: 'testing', label: 'Testing', color: '#2fc98f', mutedColor: '#d9f5ea' },
  { key: 'interview', label: 'Interview', color: '#b58cff', mutedColor: '#eadfff' },
  { key: 'shortlisted', label: 'Shortlisted', color: '#f1d7e6', mutedColor: '#f1d7e6' },
]

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

const pageSizeOptions = [15, 25, 50]

const normalizeString = (value) => String(value ?? '').trim().toLowerCase()
const includesNormalized = (source, query) => normalizeString(source).includes(normalizeString(query))
const toArray = (value) => (Array.isArray(value) ? value : [])
const slugifyStage = (value) => normalizeString(value).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

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
    const tags = toArray(job.tags).map((tag) =>
      typeof tag === 'object'
        ? String(tag.name ?? tag.label ?? tag.value ?? '').trim()
        : String(tag).trim(),
    ).filter(Boolean)
    const address = job.address ?? job.location ?? job.city ?? ''
    const country = job.country?.name ?? job.country_name ?? job.country ?? ''
    const city = job.city?.name ?? job.city_name ?? job.city ?? ''
    const hiringStage = job.hiring_stage ?? job.status ?? job.current_stage ?? ''
    const rating = job.rating ?? job.score ?? ''
    const positions = [
      typeof job.job_title === 'string' ? job.job_title : '',
      job.position ?? '',
      job.role ?? '',
    ].filter(Boolean)

    const activeStageKey = slugifyStage(hiringStage)
    const stages = stageDefinitions.map((stage) => ({
      ...stage,
      isActive: stage.key === activeStageKey,
      displayColor: stage.key === activeStageKey ? stage.color : stage.mutedColor,
    }))

    return {
      id: job.id ?? '--',
      title: typeof job.job_title === 'string' ? job.job_title : '--',
      date: formatDate(job.created_at),
      stageColors: defaultStageColors,
      stages,
      tags,
      department: department.label,
      departmentClass: department.className,
      recruiter: recruiterName || '--',
      recruiterClass: recruiterUi.recruiterClass,
      avatar: getInitials(recruiterName),
      avatarClass: recruiterUi.avatarClass,
      address,
      country,
      city,
      hiringStage,
      rating: String(rating ?? ''),
      createdAt: job.created_at ?? '',
      positions,
      jobUuid: job.job_uuid ?? job.uuid ?? '',
      relatedCompany: job.related_company ?? job.company_uuid ?? '',
      jobCode: job.job_code ?? job.code ?? String(job.id ?? ''),
      description: job.description ?? '',
      industry: job.industry?.industry_name ?? job.industry_name ?? job.industry ?? '',
      contractType: job.contract_type?.contract_type_name ?? job.contract_type_name ?? job.contract_type ?? '',
      currency: job.currency?.currency_name ?? job.currency_name ?? job.currency ?? '',
      startFrom: String(job.start_from ?? ''),
      endTo: String(job.end_to ?? ''),
      careerLevel: job.career_level ?? '',
      degreeLevel: job.degree_level ?? '',
      jobTitleSeo: job.job_title_seo ?? '',
      jobDescriptionSeo: job.job_description_seo ?? '',
    }
  }),
)

const filteredJobs = computed(() =>
  normalizedJobs.value.filter((job) => {
    if (job.jobUuid && deletedJobUuids.value.includes(job.jobUuid)) {
      return false
    }

    if (filterForm.value.job_title && !includesNormalized(job.title, filterForm.value.job_title)) {
      return false
    }

    if (filterForm.value.address && !includesNormalized(job.address, filterForm.value.address)) {
      return false
    }

    if (filterForm.value.country && !includesNormalized(job.country, filterForm.value.country)) {
      return false
    }

    if (filterForm.value.job_id && !includesNormalized(job.id, filterForm.value.job_id)) {
      return false
    }

    if (filterForm.value.hiring_stage && !includesNormalized(job.hiringStage, filterForm.value.hiring_stage)) {
      return false
    }

    if (filterForm.value.rating && !includesNormalized(job.rating, filterForm.value.rating)) {
      return false
    }

    if (filterForm.value.created_date) {
      const jobDate = String(job.createdAt || '').slice(0, 10)
      if (jobDate !== filterForm.value.created_date) {
        return false
      }
    }

    if (filterForm.value.recruiter && !includesNormalized(job.recruiter, filterForm.value.recruiter)) {
      return false
    }

    if (filterForm.value.tags.length) {
      const hasMatchingTag = filterForm.value.tags.some((tag) =>
        job.tags.some((jobTag) => includesNormalized(jobTag, tag)),
      )

      if (!hasMatchingTag) {
        return false
      }
    }

    if (filterForm.value.positions.length) {
      const hasMatchingPosition = filterForm.value.positions.some((position) =>
        job.positions.some((jobPosition) => includesNormalized(jobPosition, position)),
      )

      if (!hasMatchingPosition) {
        return false
      }
    }

    return true
  }),
)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredJobs.value.length / pageSize.value)))

const visibleJobs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredJobs.value.slice(start, end)
})

const paginationItems = computed(() => {
  const total = totalPages.value
  const page = currentPage.value

  if (total <= 6) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (page <= 3) {
    return [1, 2, 3, '...', total - 1, total]
  }

  if (page >= total - 2) {
    return [1, 2, '...', total - 2, total - 1, total]
  }

  return [1, '...', page - 1, page, page + 1, '...', total]
})

const toggleMenu = (index) => {
  openMenuIndex.value = openMenuIndex.value === index ? null : index
}

const openJobStages = (job) => {
  const payload = {
    job_uuid: job.jobUuid,
    related_company: job.relatedCompany,
    job_title: job.title === '--' ? '' : job.title,
    job_code: job.jobCode,
    department: job.department,
    country: job.country,
    city: job.city,
    description: job.description,
    industry: job.industry,
    contract_type: job.contractType,
    currency: job.currency,
    start_from: job.startFrom,
    end_to: job.endTo,
    career_level: job.careerLevel,
    degree_level: job.degreeLevel,
    job_title_seo: job.jobTitleSeo,
    job_description_seo: job.jobDescriptionSeo,
    tags: [...job.tags],
    recruiter: job.recruiter === '--' ? '' : job.recruiter,
  }

  sessionStorage.setItem('nitrosync-edit-job', JSON.stringify(payload))
  openStageTooltip.value = ''
  openMenuIndex.value = null
  router.push({
    path: '/jobs/post',
    query: {
      mode: 'edit',
      job_uuid: job.jobUuid || '',
      step: 'job-stages',
    },
  })
}

const handleDocumentClick = (event) => {
  const target = event.target

  if (!(target instanceof Element)) return

  if (!target.closest('.jobs-action')) {
    openMenuIndex.value = null
  }

  if (!target.closest('.jobs-stages__dot')) {
    openStageTooltip.value = ''
  }
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
  currentPage.value = 1
}

const openShareModal = (job) => {
  selectedShareJob.value = job
  isShareModalOpen.value = true
  openMenuIndex.value = null
}

const closeShareModal = () => {
  isShareModalOpen.value = false
}

const openDeleteDialog = (job) => {
  selectedDeleteJob.value = job
  deleteDialogError.value = ''
  isDeleteDialogOpen.value = true
  openMenuIndex.value = null
}

const closeDeleteDialog = () => {
  if (deletingJobUuid.value) return
  isDeleteDialogOpen.value = false
  selectedDeleteJob.value = null
  deleteDialogError.value = ''
}

const openGetCandidateModal = (job) => {
  selectedCandidateJob.value = job
  isGetCandidateModalOpen.value = true
  openMenuIndex.value = null
}

const closeGetCandidateModal = () => {
  isGetCandidateModalOpen.value = false
}

const goToPostJob = () => {
  router.push('/jobs/post')
}

const openEditJob = (job) => {
  const payload = {
    job_uuid: job.jobUuid,
    related_company: job.relatedCompany,
    job_title: job.title === '--' ? '' : job.title,
    job_code: job.jobCode,
    department: job.department,
    country: job.country,
    city: job.city,
    description: job.description,
    industry: job.industry,
    contract_type: job.contractType,
    currency: job.currency,
    start_from: job.startFrom,
    end_to: job.endTo,
    career_level: job.careerLevel,
    degree_level: job.degreeLevel,
    job_title_seo: job.jobTitleSeo,
    job_description_seo: job.jobDescriptionSeo,
    tags: [...job.tags],
    recruiter: job.recruiter === '--' ? '' : job.recruiter,
  }

  sessionStorage.setItem('nitrosync-edit-job', JSON.stringify(payload))
  openMenuIndex.value = null
  router.push({
    path: '/jobs/post',
    query: {
      mode: 'edit',
      job_uuid: job.jobUuid || '',
    },
  })
}

const buildStoredJobPayload = (job, details = {}) => ({
  job_uuid: details.job_uuid ?? details.uuid ?? job.jobUuid,
  related_company: details.related_company ?? details.company_uuid ?? job.relatedCompany,
  job_title: details.job_title ?? job.title,
  job_code: details.job_code ?? job.jobCode,
  department:
    details.department?.department_name
    ?? details.department_name
    ?? details.department
    ?? job.department,
  country: details.country?.name ?? details.country_name ?? details.country ?? job.country,
  city: details.city?.name ?? details.city_name ?? details.city ?? job.city,
  description: details.description ?? job.description,
  industry:
    details.industry?.industry_name
    ?? details.industry_name
    ?? details.industry
    ?? job.industry,
  contract_type:
    details.contract_type?.contract_type_name
    ?? details.contract_type_name
    ?? details.contract_type
    ?? job.contractType,
  currency:
    details.currency?.currency_name
    ?? details.currency_name
    ?? details.currency
    ?? job.currency,
  start_from: String(details.start_from ?? job.startFrom ?? ''),
  end_to: String(details.end_to ?? job.endTo ?? ''),
  career_level: details.career_level ?? job.careerLevel,
  degree_level: details.degree_level ?? job.degreeLevel,
  job_title_seo: details.job_title_seo ?? job.jobTitleSeo,
  job_description_seo: details.job_description_seo ?? job.jobDescriptionSeo,
  tags: Array.isArray(details.tags)
    ? details.tags.map((tag) =>
        typeof tag === 'object'
          ? String(tag.tag_name ?? tag.name ?? tag.label ?? tag.value ?? '').trim()
          : String(tag).trim(),
      ).filter(Boolean)
    : [...job.tags],
  recruiter: details.recruiter_name ?? details.recruiter ?? job.recruiter,
})

const openViewJob = async (job) => {
  if (!job.jobUuid) {
    window.alert('This job is missing job_uuid, so view cannot be loaded.')
    return
  }

  viewingJobUuid.value = job.jobUuid

  try {
    const response = await axios.post(
      getOneJobEndpoint,
      {
        job_uuid: job.jobUuid,
        related_company: job.relatedCompany || 'b00af2a4-2d77-432b-bd93-4e7ea120d154',
      },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: nitroSyncRequestTimeoutMs,
        },
      )

    const details =
      response?.data?.data?.job
      ?? response?.data?.data
      ?? response?.data?.job
      ?? {}

    const payload = buildStoredJobPayload(job, details)
    sessionStorage.setItem('nitrosync-view-job', JSON.stringify(payload))
    openMenuIndex.value = null
    router.push({
      path: '/jobs/post',
      query: {
        mode: 'view',
        job_uuid: payload.job_uuid || job.jobUuid || '',
      },
    })
  } catch (error) {
    console.error('Failed to get job details', {
      endpoint: getOneJobEndpoint,
      payload: {
        job_uuid: job.jobUuid,
        related_company: job.relatedCompany || 'b00af2a4-2d77-432b-bd93-4e7ea120d154',
      },
      error,
    })

    window.alert(
      error?.response?.data?.message
        || error?.response?.data?.detail
        || error?.response?.data?.msg
        || 'Failed to load job details.',
    )
  } finally {
    viewingJobUuid.value = ''
  }
}

const deleteJob = async (job) => {
  if (!job.jobUuid) {
    deleteDialogError.value = 'This job is missing job_uuid, so delete cannot be sent.'
    return
  }

  deletingJobUuid.value = job.jobUuid
  deleteDialogError.value = ''

  try {
    try {
      const applicationForms = await fetchNitroSyncApplicationForms()
      const matchingApplicationForm = applicationForms.find((item) => item.job_uuid === job.jobUuid)

      if (matchingApplicationForm?.id) {
        await deleteNitroSyncApplicationForm(matchingApplicationForm.id)
      }
    } catch (applicationFormError) {
      console.error('Failed to delete application form before deleting job', {
        jobUuid: job.jobUuid,
        error: applicationFormError,
      })
    }

    await axios.post(
      deleteJobEndpoint,
      { job_uuid: job.jobUuid },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: nitroSyncRequestTimeoutMs,
        },
      )

    deletedJobUuids.value = [...deletedJobUuids.value, job.jobUuid]
    openMenuIndex.value = null
    isDeleteDialogOpen.value = false
    selectedDeleteJob.value = null
  } catch (error) {
    console.error('Failed to delete job', {
      endpoint: deleteJobEndpoint,
      payload: { job_uuid: job.jobUuid },
      error,
    })

    deleteDialogError.value =
      error?.response?.data?.message
      || error?.response?.data?.detail
      || error?.response?.data?.msg
      || 'Failed to delete the job.'
  } finally {
    deletingJobUuid.value = ''
  }
}

const setViewMode = (mode) => {
  viewMode.value = mode
}

const changePage = (page) => {
  if (page === '...' || page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

watch(pageSize, () => {
  currentPage.value = 1
})

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})
</script>

<template>
  <section class="jobs-section">
    <div class="jobs-section__top">
      <h1 class="jobs-section__title">JOBS LIST</h1>
      <div class="jobs-controls">
        <div class="jobs-controls__show">
          <span>Show</span>
          <div class="jobs-controls__show-select">
            <Dropdown v-model="pageSize" :options="pageSizeOptions" placeholder="15" />
          </div>
        </div>
        <div class="jobs-controls__view">
          <button
            type="button"
            class="jobs-controls__view-btn jobs-controls__view-btn--grid"
            :class="{ 'is-active': viewMode === 'grid' }"
            aria-label="Grid view"
            @click="setViewMode('grid')"
          ></button>
          <button
            type="button"
            class="jobs-controls__view-btn jobs-controls__view-btn--list"
            :class="{ 'is-active': viewMode === 'list' }"
            aria-label="List view"
            @click="setViewMode('list')"
          ></button>
        </div>
        <button class="jobs-controls__filter" @click="openFilter">
          <span class="jobs-controls__filter-icon"></span>
          Filter
        </button>
        <button class="jobs-controls__post" @click="goToPostJob">+ Post a job</button>
      </div>
    </div>

    <div v-if="viewMode === 'list'" class="jobs-card">
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
        v-for="(job, index) in visibleJobs"
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
            <button
              v-for="stage in job.stages"
              :key="`${job.id}-${stage.key}`"
              type="button"
              class="jobs-stages__dot"
              :class="{ 'jobs-stages__dot--active': stage.isActive }"
              :style="{ backgroundColor: stage.displayColor }"
              @click.stop="openJobStages(job)"
            >
              <span
                v-if="openStageTooltip === `${job.jobUuid || job.id}-${stage.key}`"
                class="jobs-stages__tooltip"
              >
                {{ stage.label }}
              </span>
            </button>
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
          <button type="button" class="jobs-action__trigger" @click.stop="toggleMenu(index)" aria-label="Open actions">
            <span></span><span></span><span></span>
          </button>

          <div v-if="openMenuIndex === index" class="jobs-action__menu">
            <button type="button" :disabled="viewingJobUuid === job.jobUuid" @click.stop="openViewJob(job)">View</button>
            <button type="button" @click.stop="openEditJob(job)">Edit</button>
            <button type="button" :disabled="deletingJobUuid === job.jobUuid" @click.stop="openDeleteDialog(job)">Delete</button>
            <button type="button" @click.stop="openGetCandidateModal(job)">Get Candidates</button>
            <button type="button" @click.stop="openShareModal(job)">Share</button>
          </div>
        </div>
      </div>

      <div v-if="!filteredJobs.length" class="jobs-empty-state">
        No jobs match the selected filters.
      </div>
    </div>

    <div v-else class="jobs-grid">
      <article
        v-for="(job, index) in visibleJobs"
        :key="`grid-${job.id}-${job.title}-${index}`"
        class="jobs-grid-card"
      >
        <div class="jobs-grid-card__top">
          <span class="jobs-grid-card__id">#{{ job.id }}</span>
          <div class="jobs-action">
            <button type="button" class="jobs-action__trigger" @click.stop="toggleMenu(index)" aria-label="Open actions">
              <span></span><span></span><span></span>
            </button>

            <div v-if="openMenuIndex === index" class="jobs-action__menu">
              <button type="button" :disabled="viewingJobUuid === job.jobUuid" @click.stop="openViewJob(job)">View</button>
              <button type="button" @click.stop="openEditJob(job)">Edit</button>
              <button type="button" :disabled="deletingJobUuid === job.jobUuid" @click.stop="openDeleteDialog(job)">Delete</button>
              <button type="button" @click.stop="openGetCandidateModal(job)">Get Candidates</button>
              <button type="button" @click.stop="openShareModal(job)">Share</button>
            </div>
          </div>
        </div>

        <h3 class="jobs-grid-card__title">{{ job.title }}</h3>

        <div class="jobs-grid-card__meta">
          <div class="jobs-grid-card__meta-item">
            <span class="jobs-grid-card__label">Create Date</span>
            <span>{{ job.date }}</span>
          </div>
          <div class="jobs-grid-card__meta-item">
            <span class="jobs-grid-card__label">Department</span>
            <span :class="job.departmentClass">{{ job.department || '--' }}</span>
          </div>
        </div>

        <div class="jobs-grid-card__section">
          <span class="jobs-grid-card__label">Stages</span>
          <div class="jobs-stages jobs-stages--grid">
            <button
              v-for="stage in job.stages"
              :key="`grid-stage-${job.id}-${stage.key}`"
              type="button"
              class="jobs-stages__dot"
              :class="{ 'jobs-stages__dot--active': stage.isActive }"
              :style="{ backgroundColor: stage.displayColor }"
              @click.stop="openJobStages(job)"
            >
              <span
                v-if="openStageTooltip === `${job.jobUuid || job.id}-${stage.key}`"
                class="jobs-stages__tooltip"
              >
                {{ stage.label }}
              </span>
            </button>
          </div>
        </div>

        <div class="jobs-grid-card__section">
          <span class="jobs-grid-card__label">Recruiter</span>
          <span :class="job.recruiterClass">
            <span :class="job.avatarClass">{{ job.avatar }}</span>
            {{ job.recruiter }}
          </span>
        </div>
      </article>

      <div v-if="!filteredJobs.length" class="jobs-empty-state jobs-empty-state--grid">
        No jobs match the selected filters.
      </div>
    </div>

    <div class="jobs-pagination">
      <button
        v-for="page in paginationItems"
        :key="page"
        class="jobs-pagination__item"
        :class="{ 'is-active': page === currentPage, 'is-ghost': page === '...' }"
        :disabled="page === '...'"
        @click="changePage(page)"
      >
        {{ page }}
      </button>
      <button class="jobs-pagination__next" aria-label="Next page" :disabled="currentPage >= totalPages" @click="goToNextPage"></button>
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

    <div v-if="isDeleteDialogOpen" class="jobs-dialog">
      <button class="jobs-dialog__overlay" type="button" aria-label="Close delete dialog" @click="closeDeleteDialog"></button>
      <section class="jobs-dialog__panel" role="dialog" aria-modal="true" aria-label="Delete job confirmation">
        <div class="jobs-dialog__badge">!</div>
        <h3 class="jobs-dialog__title">Delete Job?</h3>
        <p class="jobs-dialog__text">
          You are about to delete
          <strong>{{ selectedDeleteJob?.title || 'this job' }}</strong>.
          This action cannot be undone.
        </p>
        <p v-if="deleteDialogError" class="jobs-dialog__error">{{ deleteDialogError }}</p>
        <div class="jobs-dialog__actions">
          <button type="button" class="jobs-dialog__button jobs-dialog__button--secondary" :disabled="Boolean(deletingJobUuid)" @click="closeDeleteDialog">
            Cancel
          </button>
          <button
            type="button"
            class="jobs-dialog__button jobs-dialog__button--danger"
            :disabled="Boolean(deletingJobUuid)"
            @click="deleteJob(selectedDeleteJob)"
          >
            {{ deletingJobUuid ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.jobs-section {
  width: 100%;
}

.jobs-dialog {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 24px;
}

.jobs-dialog__overlay {
  position: absolute;
  inset: 0;
  background: rgba(28, 20, 24, 0.22);
  backdrop-filter: blur(5px);
}

.jobs-dialog__panel {
  position: relative;
  width: min(460px, calc(100vw - 32px));
  padding: 28px 28px 24px;
  border: 1px solid #f0dde5;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 26px 54px rgba(61, 38, 48, 0.2);
}

.jobs-dialog__badge {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
  border-radius: 999px;
  background: #fff1f6;
  color: #ea4f8d;
  font-size: 24px;
  font-weight: 700;
}

.jobs-dialog__title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #17111b;
}

.jobs-dialog__text {
  margin: 12px 0 0;
  font-size: 15px;
  line-height: 1.6;
  color: #6a5c64;
}

.jobs-dialog__error {
  margin: 14px 0 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff3f6;
  color: #cf4f80;
  font-size: 14px;
  line-height: 1.5;
}

.jobs-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
}

.jobs-dialog__button {
  min-width: 112px;
  height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.jobs-dialog__button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.jobs-dialog__button--secondary {
  border: 1px solid #e7d8df;
  background: #ffffff;
  color: #6f5c66;
}

.jobs-dialog__button--danger {
  border: 1px solid #ea4f8d;
  background: #ea4f8d;
  color: #ffffff;
  box-shadow: 0 14px 24px rgba(234, 79, 141, 0.18);
}

.jobs-section__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.jobs-section__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  color: #111827;
  margin-top: 2px;
  margin-bottom: 6px;
}

.jobs-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.jobs-controls__show {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8d6977;
  font-size: 14px;
  line-height: 1;
}

.jobs-controls__show-select {
  width: 68px;
}

.jobs-controls__select,
.jobs-controls__filter,
.jobs-controls__post,
.jobs-controls__view {
  border-radius: 12px;
}

.jobs-controls__select {
  min-width: 72px;
  height: var(--control-height);
  padding: 0 var(--control-padding-x);
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

.jobs-controls__show-select :deep(.dropdown__trigger) {
  min-width: 68px;
  height: 36px;
  padding: 0 26px 0 12px;
  border: 0;
  background: #f8d8e7;
  color: #ee5a96;
  border-radius: 11px;
  box-shadow: none;
}

.jobs-controls__show-select :deep(.dropdown__value) {
  font-size: 13px;
  line-height: 1;
}

.jobs-controls__show-select :deep(.dropdown__arrow) {
  right: 12px;
  width: 6px;
  height: 6px;
  border-color: #ee5a96;
}

.jobs-controls__show-select :deep(.dropdown__menu) {
  border-radius: 12px;
}

.jobs-controls__view {
  min-width: 92px;
  height: 36px;
  padding: 5px;
  background: #f8d8e7;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.jobs-controls__view-btn {
  width: 38px;
  height: 26px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  position: relative;
  display: grid;
  place-items: center;
  transition: background-color 0.18s ease, box-shadow 0.18s ease;
}

.jobs-controls__view-btn.is-active {
  background: #f4b8cc;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.jobs-controls__view-btn--grid::before {
  content: '';
  position: absolute;
  width: 15px;
  height: 15px;
  border-radius: 4px;
  background:
    linear-gradient(#ea4f8d, #ea4f8d) left top/6px 6px no-repeat,
    linear-gradient(#f7a7c3, #f7a7c3) right top/6px 6px no-repeat,
    linear-gradient(#f7a7c3, #f7a7c3) left bottom/6px 6px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) right bottom/6px 6px no-repeat;
}

.jobs-controls__view-btn--list::before {
  content: '';
  position: absolute;
  left: 9px;
  right: 9px;
  top: 7px;
  height: 5px;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 8px 0 #ffffff;
}

.jobs-controls__view-btn--list::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 9px;
  width: 6px;
  height: 2px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
}

.jobs-controls__filter {
  height: 36px;
  padding: 0 18px;
  border: 0;
  background: #f3bfd2;
  color: #ea4f8d;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  border-radius: 11px;
}

.jobs-controls__filter-icon {
  width: 10px;
  height: 10px;
  background: currentColor;
  clip-path: polygon(0 0, 100% 0, 64% 42%, 64% 100%, 36% 100%, 36% 42%);
}

.jobs-controls__post {
  height: 36px;
  padding: 0 18px;
  border: 1px solid #ee6a9c;
  background: transparent;
  color: #ee5a96;
  font-size: 14px;
  border-radius: 11px;
  line-height: 1;
}

.jobs-card {
  background: #f6f7fb;
  border-radius: 16px;
  padding: 12px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: visible;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.jobs-grid-card {
  position: relative;
  min-height: 220px;
  padding: 20px;
  border: 1px solid #f0e5ea;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(50, 33, 41, 0.05);
}

.jobs-grid-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.jobs-grid-card__id {
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff1f6;
  color: #ea4f8d;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
}

.jobs-grid-card__title {
  margin: 0 0 18px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.25;
  color: #9b6179;
}

.jobs-grid-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--surface-gap);
  margin-bottom: var(--surface-gap);
}

.jobs-grid-card__meta-item,
.jobs-grid-card__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.jobs-grid-card__section + .jobs-grid-card__section {
  margin-top: 14px;
}

.jobs-grid-card__label {
  font-size: 12px;
  color: #b19ca6;
}

.jobs-stages--grid {
  justify-content: flex-start;
}

.jobs-row {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.jobs-header {
  background: #f4f5f8;
  border-radius: var(--surface-radius);
  padding: 14px 18px;
  font-weight: 500;
  margin-bottom: 6px;
}

.jobs-header__cell {
  color: #6b7280;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.jobs-row--body {
  padding: 14px 18px;
  border-bottom: 1px solid #f1f1f4;
  background: #ffffff;
  transition: background-color 0.18s ease;
  font-size: 10px;
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
  width: 34px;
  display: flex;
  justify-content: center;
}

.jobs-col--id {
  width: 84px;
}

.jobs-col--title {
  width: 182px;
}

.jobs-col--date {
  width: 132px;
}

.jobs-col--stages {
  width: 118px;
}

.jobs-col--tags {
  width: 112px;
}

.jobs-col--department {
  width: 170px;
}

.jobs-col--recruiter {
  width: 154px;
}

.jobs-col--action {
  width: 76px;
}

.jobs-radio {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 1px solid #efadc4;
  display: inline-block;
}

.jobs-radio--filled {
  background: #ea6f9b;
  border-color: #ea6f9b;
}

.jobs-sort {
  width: 7px;
  height: 8px;
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
  gap: 5px;
}

.jobs-stages__dot {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  position: relative;
  flex: 0 0 auto;
}

.jobs-stages__dot--active {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95);
}

.jobs-stages__tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  min-width: max-content;
  padding: 6px 10px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #eddbe3;
  box-shadow: 0 12px 24px rgba(63, 37, 49, 0.12);
  color: #7d5f6d;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  z-index: 12;
}

.jobs-stages__tooltip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-right: 1px solid #eddbe3;
  border-bottom: 1px solid #eddbe3;
  transform: translateX(-50%) rotate(45deg);
}

.jobs-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.jobs-tag {
  background: #f4e8ec;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 9px;
  color: #7f6874;
}

:deep(.department) {
  font-size: 10px;
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
  gap: 6px;
  background: #f7f7f9;
  border-radius: 20px;
  padding: 4px 10px 4px 4px;
  font-size: 10px;
  white-space: nowrap;
}

:deep(.recruiter--pink) { color: #ea5b93; background: #f8eaf0; }
:deep(.recruiter--blue) { color: #486eff; background: #ecf0ff; }
:deep(.recruiter--purple) { color: #6b49e8; background: #efeafd; }
:deep(.recruiter--gold) { color: #cd9200; background: #fff4d9; }
:deep(.recruiter--green) { color: #27a65b; background: #e8f7ed; }
:deep(.recruiter--cyan) { color: #06a8cb; background: #e7f8fb; }

:deep(.avatar) {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  color: #ffffff;
  font-size: 9px;
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
  padding: 2px 0;
}

.jobs-action__trigger span {
  width: 3px;
  height: 3px;
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
  border-radius: var(--surface-radius-lg);
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
  font-size: var(--font-small);
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

.jobs-pagination__item:disabled,
.jobs-pagination__next:disabled {
  opacity: 0.45;
  cursor: default;
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

.jobs-empty-state {
  min-height: 120px;
  display: grid;
  place-items: center;
  color: #b59eaa;
  font-size: 15px;
}

.jobs-empty-state--grid {
  grid-column: 1 / -1;
  min-height: 180px;
  border: 1px dashed #ecdfe6;
  border-radius: var(--surface-radius-lg);
  background: #fff;
}

@media (max-width: 1180px) {
  .jobs-section__top {
    align-items: flex-start;
    flex-direction: column;
  }

  .jobs-controls {
    width: 100%;
    flex-wrap: wrap;
  }

  .jobs-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 840px) {
  .jobs-section__title {
    font-size: 42px;
    line-height: 1;
    margin-bottom: 10px;
  }

  .jobs-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .jobs-controls__show,
  .jobs-controls__filter,
  .jobs-controls__post,
  .jobs-controls__view {
    width: 100%;
  }

  .jobs-controls__show {
    justify-content: space-between;
    padding: 0 12px;
    min-height: 48px;
    border-radius: 12px;
    background: #f5d9e4;
  }

  .jobs-controls__show-select {
    width: 82px;
    flex: 0 0 auto;
  }

  .jobs-controls__view {
    justify-content: center;
  }

  .jobs-controls__filter,
  .jobs-controls__post {
    justify-content: center;
  }

  .jobs-card {
    padding: 14px;
    border-radius: 18px;
  }

  .jobs-header {
    display: none;
  }

  .jobs-row--body {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 10px;
    padding: 16px 14px;
    margin-bottom: 10px;
    border: 1px solid #f1e6eb;
    border-radius: 16px;
    background: #fff;
  }

  .jobs-row--body:last-child {
    margin-bottom: 0;
  }

  .jobs-col {
    width: 100%;
    justify-content: flex-start;
    text-align: left;
    min-height: 0;
  }

  .jobs-col--select {
    display: none;
  }

  .jobs-col--id,
  .jobs-col--date,
  .jobs-col--stages,
  .jobs-col--tags,
  .jobs-col--department,
  .jobs-col--recruiter,
  .jobs-col--action,
  .jobs-col--title {
    width: 100%;
  }

  .jobs-col--id::before,
  .jobs-col--date::before,
  .jobs-col--stages::before,
  .jobs-col--tags::before,
  .jobs-col--department::before,
  .jobs-col--recruiter::before,
  .jobs-col--title::before {
    display: block;
    margin-bottom: 4px;
    color: #b09ba5;
    font-size: 11px;
    line-height: 1.2;
  }

  .jobs-col--id::before { content: 'Job ID'; }
  .jobs-col--title::before { content: 'Job Title'; }
  .jobs-col--date::before { content: 'Create Date'; }
  .jobs-col--stages::before { content: 'Stages'; }
  .jobs-col--tags::before { content: 'Tags'; }
  .jobs-col--department::before { content: 'Department'; }
  .jobs-col--recruiter::before { content: 'Recruiter'; }

  .jobs-col--title {
    grid-column: 1 / -1;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
  }

  .jobs-col--action {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }

  .jobs-stages,
  .jobs-tags {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .jobs-action__menu {
    top: calc(100% + 6px);
    right: 0;
    left: auto;
  }

  .jobs-pagination {
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .jobs-grid {
    grid-template-columns: 1fr;
  }

  .jobs-grid-card__meta {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .jobs-section__title {
    font-size: 34px;
  }

  .jobs-controls {
    grid-template-columns: 1fr;
  }

  .jobs-row--body {
    grid-template-columns: 1fr;
  }

  .jobs-col--title,
  .jobs-col--action {
    grid-column: auto;
  }

  :deep(.recruiter) {
    max-width: 100%;
    white-space: normal;
  }
}
</style>
