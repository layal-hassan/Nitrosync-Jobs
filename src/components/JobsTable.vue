<script setup>
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Archive,
  BriefcaseBusiness,
  CalendarX,
  CircleCheckBig,
  CirclePause,
  FileText,
  LayoutGrid,
  LayoutList,
  ShieldCheck,
} from 'lucide-vue-next'
import {
  deleteNitroSyncApplicationForm,
  fetchNitroSyncApplicationForm,
  fetchNitroSyncApplicationForms,
} from '../composables/useNitroSyncApplicationForms'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from '../composables/nitroSyncApi'
import { changeNitroSyncJobStatus } from '../composables/useNitroSyncChangeJobStatus'
import FilterModal from './FilterModal.vue'
import GetCandidateModal from './modals/GetCandidateModal.vue'
import ShareJobModal from './modals/ShareJobModal.vue'
import Dropdown from './ui/Dropdown.vue'

const props = defineProps({
  jobs: Array,
})
const emit = defineEmits(['refresh-jobs'])

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
const searchQuery = ref('')
const viewMode = ref('list')
const pageSize = ref(15)
const currentPage = ref(1)
const activeStatusFilter = ref('all')
const selectedJobUuids = ref([])
const bulkStatusAction = ref('')
const bulkActionError = ref('')
const deletingJobUuid = ref('')
const duplicatingJobUuid = ref('')
const changingStatusJobUuid = ref('')
const bulkDeleting = ref(false)
const bulkUpdatingStatus = ref(false)
const deletedJobUuids = ref([])
const statusOverrides = ref({})
const viewingJobUuid = ref('')
const router = useRouter()
const deleteJobEndpoint = buildNitroSyncEndpoint('/v1/jobs/delete')
const duplicateJobEndpoint = buildNitroSyncEndpoint('/v1/jobs/duplicate-job')
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
const defaultStageColors = ['#8fa8ff', '#79ddb5', '#c08df7', '#7fe0c4']
const stageDefinitions = [
  { key: 'screen', label: 'Screen', color: '#6f86ff', mutedColor: '#8fa8ff' },
  { key: 'testing', label: 'Testing', color: '#4ccf8f', mutedColor: '#79ddb5' },
  { key: 'interview', label: 'Interview', color: '#a978ef', mutedColor: '#c08df7' },
  { key: 'hired', label: 'Hired', color: '#58d2bf', mutedColor: '#7fe0c4' },
]

const headers = [
  { key: 'id', label: 'Job ID', width: 'jobs-col--id' },
  { key: 'title', label: 'Job Title', width: 'jobs-col--title' },
  { key: 'department', label: 'Department', width: 'jobs-col--department' },
  { key: 'recruiter', label: 'Recruiter', width: 'jobs-col--recruiter' },
  { key: 'status', label: 'Status', width: 'jobs-col--status' },
  { key: 'date', label: 'Create Date', width: 'jobs-col--date' },
  { key: 'expiryDate', label: 'Expiry Date', width: 'jobs-col--expiry' },
  { key: 'stages', label: 'Stages', width: 'jobs-col--stages' },
  { key: 'tags', label: 'Tags', width: 'jobs-col--tags' },
  { key: 'action', label: 'Action', width: 'jobs-col--action' },
]

const pageSizeOptions = [15, 25, 50]
const statusOptions = [
  { key: 'active', label: 'Active' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'closed', label: 'Closed' },
  { key: 'draft', label: 'Draft' },
  { key: 'expired', label: 'Expired' },
  { key: 'archived', label: 'Archived' },
]
const bulkStatusOptions = [
  { key: 'active', label: 'Activate' },
  { key: 'on_hold', label: 'Deactivate' },
  { key: 'closed', label: 'Close' },
  { key: 'archived', label: 'Archive' },
]
const bulkStatusDropdownOptions = bulkStatusOptions.map((option) => ({
  label: option.label,
  value: option.key,
}))

const normalizeString = (value) => String(value ?? '').trim().toLowerCase()
const includesNormalized = (source, query) => normalizeString(source).includes(normalizeString(query))
const toArray = (value) => (Array.isArray(value) ? value : [])
const slugifyStage = (value) => normalizeString(value).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
const uniqueValues = (values) => [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))]

const tagTonePalette = [
  { bg: '#eadcff', color: '#8346ff', border: '#d9bfff', glow: 'rgba(131, 70, 255, 0.24)' },
  { bg: '#ffe8c2', color: '#d68800', border: '#ffd58a', glow: 'rgba(214, 136, 0, 0.22)' },
  { bg: '#dbe8ff', color: '#2f72ff', border: '#c2d8ff', glow: 'rgba(47, 114, 255, 0.24)' },
  { bg: '#d7f7e4', color: '#16b763', border: '#b5eccb', glow: 'rgba(22, 183, 99, 0.22)' },
  { bg: '#ffdceb', color: '#e33d87', border: '#ffc1d9', glow: 'rgba(227, 61, 135, 0.24)' },
  { bg: '#d8f5f2', color: '#129b92', border: '#b7e9e3', glow: 'rgba(18, 155, 146, 0.22)' },
]

const getTagTone = (tag) => {
  const normalizedTag = normalizeString(tag)

  if (['node.js', 'nodejs', 'backend', 'ui/ux', 'qa', 'aws', 'b2b', 'sales'].some((item) => normalizedTag.includes(item))) {
    return { bg: '#eadcff', color: '#8346ff', border: '#d9bfff', glow: 'rgba(131, 70, 255, 0.24)' }
  }

  if (['design', 'hr', 'site', 'management'].some((item) => normalizedTag.includes(item))) {
    return { bg: '#ffe8c2', color: '#d68800', border: '#ffd58a', glow: 'rgba(214, 136, 0, 0.22)' }
  }

  if (['testing', 'devops', 'recruitment', 'finance'].some((item) => normalizedTag.includes(item))) {
    return { bg: '#dbe8ff', color: '#2f72ff', border: '#c2d8ff', glow: 'rgba(47, 114, 255, 0.24)' }
  }

  if (['campaign', 'product', 'engineering'].some((item) => normalizedTag.includes(item))) {
    return { bg: '#d7f7e4', color: '#16b763', border: '#b5eccb', glow: 'rgba(22, 183, 99, 0.22)' }
  }

  if (['marketing', 'high salary'].some((item) => normalizedTag.includes(item))) {
    return { bg: '#ffdceb', color: '#e33d87', border: '#ffc1d9', glow: 'rgba(227, 61, 135, 0.24)' }
  }

  const hash = normalizedTag.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return tagTonePalette[hash % tagTonePalette.length]
}

const getTagStyle = (tag) => {
  const tone = getTagTone(tag)

  return {
    backgroundColor: tone.bg,
    color: tone.color,
    borderColor: tone.border,
    boxShadow: `0 8px 18px ${tone.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.96)`,
  }
}

const formatDate = (value) => {
  if (!value) return '--'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()

  return `${day} ${month},${year}`
}

const normalizeStatusKey = (value) => {
  const normalized = normalizeString(value)

  if (['1', 'draft', 'pending', 'scheduled'].includes(normalized)) return 'draft'
  if (['2', 'active', 'published', 'open', 'live'].includes(normalized)) return 'active'
  if (['3', 'expired', 'expire'].includes(normalized)) return 'expired'
  if (['4', 'on_hold', 'on hold', 'hold', 'paused', 'pause'].includes(normalized)) return 'on_hold'
  if (['5', 'closed', 'close', 'filled'].includes(normalized)) return 'closed'
  if (['6', 'archived', 'archive'].includes(normalized)) return 'archived'

  return normalized || 'unknown'
}

const extractJobStatusValue = (value) => {
  if (value && typeof value === 'object') {
    return String(
      value.key
      ?? value.label
      ?? value.status
      ?? value.name
      ?? value.value
      ?? '',
    ).trim()
  }

  return String(value ?? '').trim()
}

const statusPresentation = (value) => {
  const key = normalizeStatusKey(value)

  const map = {
    active: { key, label: 'Active', className: 'job-status job-status--active' },
    on_hold: { key, label: 'On Hold', className: 'job-status job-status--hold' },
    closed: { key, label: 'Closed', className: 'job-status job-status--closed' },
    draft: { key, label: 'Draft', className: 'job-status job-status--draft' },
    expired: { key, label: 'Expired', className: 'job-status job-status--expired' },
    archived: { key, label: 'Archived', className: 'job-status job-status--archived' },
    unknown: { key, label: 'Pending', className: 'job-status job-status--pending' },
  }

  return map[key] || { key, label: String(value || 'Pending'), className: 'job-status job-status--pending' }
}

const buildJobMeta = (job = {}) => {
  const segments = [
    job.contractType && job.contractType !== '--' ? job.contractType : '',
    job.city && job.city !== '--' ? job.city : '',
    job.country && job.country !== '--' ? job.country : '',
  ].filter(Boolean)

  return segments.join(' • ')
}

const buildExpiryMeta = (value) => {
  if (!value) return ''

  const expiry = new Date(value)
  if (Number.isNaN(expiry.getTime())) return ''

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)

  const diffDays = Math.round((expiry.getTime() - today.getTime()) / 86400000)
  if (diffDays < 0) return '(Expired)'
  if (diffDays === 0) return '(Today)'
  if (diffDays === 1) return '(in 1 day)'

  return `(in ${diffDays} days)`
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

const departmentPresentation = (value = '', index = 0) => {
  const variants = [
    'department department--green',
    'department department--blue',
    'department department--indigo',
    'department department--pink',
    'department department--gold',
  ]

  return {
    label: value || '',
    className: variants[index % variants.length],
  }
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

const getJobStageRows = (job = {}) =>
  Array.isArray(job?.jobs_stages)
    ? job.jobs_stages
    : Array.isArray(job?.job_stages)
      ? job.job_stages
      : Array.isArray(job?.stages)
        ? job.stages
        : []

const getStageCandidateCount = (stageRow = {}) => {
  const directCount = Number(
    stageRow?.candidates_count
    ?? stageRow?.candidate_count
    ?? stageRow?.count
    ?? stageRow?.total_candidates,
  )

  if (Number.isFinite(directCount)) {
    return directCount
  }

  if (Array.isArray(stageRow?.cards)) {
    return stageRow.cards.length
  }

  if (Array.isArray(stageRow?.candidates)) {
    return stageRow.candidates.length
  }

  return 0
}

const getRecruiterAvatar = (job = {}) =>
  String(
    job?.recruiter_avatar
    ?? job?.avatar
    ?? job?.recruiter_image
    ?? job?.recruiter_photo
    ?? job?.recruiter?.avatar
    ?? job?.recruiter?.image
    ?? job?.recruiter?.photo
    ?? '',
  ).trim()

const normalizeText = (value) => String(value ?? '').trim()

const getObjectCandidate = (value) => {
  if (Array.isArray(value)) {
    return value.find((entry) => entry && typeof entry === 'object') || null
  }

  return value && typeof value === 'object' ? value : null
}

const getNestedDepartmentObject = (source = {}) => {
  const candidates = [
    source?.department,
    source?.job?.department,
    source?.model?.department,
    source?.job_model?.department,
    source?.raw?.department,
    source?.details?.department,
  ]

  for (const candidate of candidates) {
    const resolved = getObjectCandidate(candidate)
    if (resolved) return resolved
  }

  return null
}

const getFirstHiringTeamEntry = (source = {}) => {
  const hiringTeam =
    Array.isArray(source?.job_hiring_team) ? source.job_hiring_team
      : source?.job_hiring_team && typeof source.job_hiring_team === 'object' ? [source.job_hiring_team]
        : Array.isArray(source?.hiring_team) ? source.hiring_team
          : source?.hiring_team && typeof source.hiring_team === 'object' ? [source.hiring_team]
            : []

  return hiringTeam[0] && typeof hiringTeam[0] === 'object' ? hiringTeam[0] : {}
}

const getRecruiterDisplayName = (value) => {
  if (!value || typeof value !== 'object') return ''

  const additionalInfo =
    value?.employee_additional_information
    ?? value?.employeeAdditionalInformation
    ?? {}
  const fullName = normalizeText(
    value?.full_name
    ?? value?.fullName
    ?? value?.employee_name
    ?? value?.employeeName
    ?? value?.name,
  )
  const firstName = normalizeText(
    value?.first_name
    ?? value?.firstName
    ?? additionalInfo?.first_name
    ?? additionalInfo?.firstName,
  )
  const lastName = normalizeText(
    value?.last_name
    ?? value?.lastName
    ?? additionalInfo?.last_name
    ?? additionalInfo?.lastName,
  )

  return fullName || [firstName, lastName].filter(Boolean).join(' ').trim()
}

const extractDepartmentValue = (source = {}) =>
  normalizeText(
    typeof source?.department === 'string'
      ? source.department
      : getNestedDepartmentObject(source)?.department_name
        ?? getNestedDepartmentObject(source)?.name
        ?? source?.department_name
        ?? source?.job_details?.department
        ?? source?.job_posting?.department
        ?? source?.details?.department
        ?? '',
  )

const extractRecruiterValue = (source = {}) => {
  const recruiter = source?.recruiter
  const hiringTeam = getFirstHiringTeamEntry(source)
  const recruiterValue = typeof recruiter === 'string' ? recruiter : ''
  const hiringTeamRecruiterValue = typeof hiringTeam?.recruiter === 'string' ? hiringTeam.recruiter : ''

  return normalizeText(
    source?.recruiter_name
    || recruiterValue
    || getRecruiterDisplayName(recruiter)
    || hiringTeam?.recruiter_name
    || hiringTeamRecruiterValue
    || getRecruiterDisplayName(hiringTeam?.recruiter)
    || getRecruiterDisplayName(hiringTeam?.assigned_recruiter)
    || source?.assigned_recruiter_name
    || (typeof source?.assigned_recruiter === 'string' ? source.assigned_recruiter : '')
    || getRecruiterDisplayName(source?.assigned_recruiter)
    || hiringTeam?.name
    || '',
  )
}

const normalizedJobs = computed(() =>
  (props.jobs || [])
    .map((job, index) => {
    const department = departmentPresentation(extractDepartmentValue(job), index)
    const recruiterName = extractRecruiterValue(job)
    const recruiterUi = recruiterPresentation(index)
    const tags = toArray(job.tags).map((tag) =>
      typeof tag === 'object'
        ? String(tag.tag_name ?? tag.name ?? tag.label ?? tag.value ?? '').trim()
        : String(tag).trim(),
    ).filter(Boolean)
    const address = job.address ?? job.location ?? job.city ?? ''
    const country = job.country?.name ?? job.country_name ?? job.country ?? ''
    const city = job.city?.name ?? job.city_name ?? job.city ?? ''
    const explicitHiringStage = job.hiring_stage ?? job.current_stage ?? ''
    const statusOverride = String(
      statusOverrides.value[String(job.job_uuid ?? job.uuid ?? job.id ?? '')] ?? '',
    ).trim()
    const sourceStatus = statusOverride || (job.status ?? job.job_status ?? job.active_status ?? explicitHiringStage)
    const status = statusPresentation(sourceStatus)
    const rating = job.rating ?? job.score ?? ''
    const positions = [
      typeof job.job_title === 'string' ? job.job_title : '',
      job.position ?? '',
      job.role ?? '',
    ].filter(Boolean)

    const activeStageKey = slugifyStage(explicitHiringStage)
    const hiringStage = String(explicitHiringStage || status.label).trim()
    const stageRows = getJobStageRows(job)
    const stages = stageDefinitions.map((stage) => ({
      ...stage,
      isActive: stage.key === activeStageKey,
      displayColor: stage.key === activeStageKey ? stage.color : stage.mutedColor,
      candidateCount: getStageCandidateCount(
        stageRows.find((item) => slugifyStage(item?.label ?? item?.stage_name ?? item?.job_stage_name ?? item?.name ?? item?.title) === stage.key),
      ),
    }))

      return {
      id: job.id ?? '--',
      title: typeof job.job_title === 'string' ? job.job_title : '--',
      titleMeta: buildJobMeta({
        contractType: job.contract_type?.contract_type_name ?? job.contract_type_name ?? job.contract_type ?? '',
        city,
        country,
      }),
      date: formatDate(job.created_at),
      expiryDate: formatDate(job.expiry_date),
      expiryMeta: buildExpiryMeta(job.expiry_date),
      stageColors: defaultStageColors,
      stages,
      tags,
      department: department.label || '--',
      departmentClass: department.className,
      recruiter: recruiterName || '--',
      hasRecruiter: Boolean(recruiterName),
      recruiterAvatar: getRecruiterAvatar(job),
      recruiterClass: recruiterUi.recruiterClass,
      avatar: getInitials(recruiterName),
      avatarClass: recruiterUi.avatarClass,
      status,
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
    })
    .sort((left, right) => {
      const leftCreatedAt = new Date(left.createdAt || 0).getTime()
      const rightCreatedAt = new Date(right.createdAt || 0).getTime()

      if (leftCreatedAt !== rightCreatedAt) {
        return rightCreatedAt - leftCreatedAt
      }

      const leftId = Number(left.id) || 0
      const rightId = Number(right.id) || 0
      return rightId - leftId
    }),
)

const filterFieldOptions = computed(() => ({
  job_title: uniqueValues(normalizedJobs.value.map((job) => job.title)).sort((a, b) => a.localeCompare(b)),
  country: uniqueValues(normalizedJobs.value.map((job) => job.country)).sort((a, b) => a.localeCompare(b)),
  hiring_stage: uniqueValues(normalizedJobs.value.map((job) => job.hiringStage)).sort((a, b) => a.localeCompare(b)),
}))

const filterPositionOptions = computed(() =>
  uniqueValues(
    normalizedJobs.value.flatMap((job) => job.positions),
  ).sort((a, b) => a.localeCompare(b)),
)

const statusCards = computed(() => {
  const totals = normalizedJobs.value
    .filter((job) => !(job.jobUuid && deletedJobUuids.value.includes(job.jobUuid)))
    .reduce((accumulator, job) => {
    const key = job.status.key || 'unknown'
    accumulator.total += 1
    accumulator[key] = (accumulator[key] || 0) + 1
    return accumulator
  }, {
    total: 0,
    active: 0,
    on_hold: 0,
    closed: 0,
    expired: 0,
    draft: 0,
    archived: 0,
    unknown: 0,
  })

  return [
    { key: 'all', label: 'All Jobs', count: totals.total, iconClass: 'jobs-stat__icon jobs-stat__icon--all', icon: BriefcaseBusiness },
    { key: 'active', label: 'Active', count: totals.active, iconClass: 'jobs-stat__icon jobs-stat__icon--active', icon: ShieldCheck },
    { key: 'on_hold', label: 'On Hold', count: totals.on_hold, iconClass: 'jobs-stat__icon jobs-stat__icon--hold', icon: CirclePause },
    { key: 'closed', label: 'Closed', count: totals.closed, iconClass: 'jobs-stat__icon jobs-stat__icon--closed', icon: CircleCheckBig },
    { key: 'expired', label: 'Expired', count: totals.expired, iconClass: 'jobs-stat__icon jobs-stat__icon--expired', icon: CalendarX },
    { key: 'archived', label: 'Archived', count: totals.archived, iconClass: 'jobs-stat__icon jobs-stat__icon--archived', icon: Archive },
  ]
})

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

    if (activeStatusFilter.value !== 'all' && job.status.key !== activeStatusFilter.value) {
      return false
    }

    if (searchQuery.value) {
      const haystack = [
        job.id,
        job.title,
        job.department,
        job.recruiter,
        job.status.label,
        job.country,
        job.city,
        job.jobCode,
        ...job.tags,
      ]

      if (!haystack.some((value) => includesNormalized(value, searchQuery.value))) {
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

const selectedJobs = computed(() => {
  const selectedSet = new Set(selectedJobUuids.value)
  return normalizedJobs.value.filter((job) =>
    job.jobUuid
    && selectedSet.has(job.jobUuid)
    && !deletedJobUuids.value.includes(job.jobUuid),
  )
})

const allVisibleJobsSelected = computed(() =>
  visibleJobs.value.length > 0
  && visibleJobs.value.every((job) => job.jobUuid && selectedJobUuids.value.includes(job.jobUuid)),
)

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

const isJobSelected = (job) => Boolean(job?.jobUuid) && selectedJobUuids.value.includes(job.jobUuid)

const toggleJobSelection = (job) => {
  if (!job?.jobUuid) return

  bulkActionError.value = ''

  if (isJobSelected(job)) {
    selectedJobUuids.value = selectedJobUuids.value.filter((jobUuid) => jobUuid !== job.jobUuid)
    return
  }

  selectedJobUuids.value = [...selectedJobUuids.value, job.jobUuid]
}

const toggleVisibleJobsSelection = () => {
  const visibleJobUuids = visibleJobs.value.map((job) => job.jobUuid).filter(Boolean)

  if (!visibleJobUuids.length) return

  bulkActionError.value = ''

  if (allVisibleJobsSelected.value) {
    selectedJobUuids.value = selectedJobUuids.value.filter((jobUuid) => !visibleJobUuids.includes(jobUuid))
    return
  }

  selectedJobUuids.value = [...new Set([...selectedJobUuids.value, ...visibleJobUuids])]
}

const clearSelection = () => {
  selectedJobUuids.value = []
  bulkStatusAction.value = ''
  bulkActionError.value = ''
}

const changeJobStatus = async (job, nextStatus) => {
  if (!job?.jobUuid) {
    window.alert('This job is missing job_uuid, so status cannot be changed.')
    return
  }

  if (!job?.relatedCompany) {
    window.alert('This job is missing related_company, so status cannot be changed.')
    return
  }

  if (changingStatusJobUuid.value === job.jobUuid || job.status.key === nextStatus) {
    return
  }

  const previousStatus = statusOverrides.value[job.jobUuid] || job.status.key
  statusOverrides.value = {
    ...statusOverrides.value,
    [job.jobUuid]: nextStatus,
  }
  changingStatusJobUuid.value = job.jobUuid

  try {
    await changeNitroSyncJobStatus({
      jobUuid: job.jobUuid,
      relatedCompany: job.relatedCompany,
      status: nextStatus,
    })
    openMenuIndex.value = null
  } catch (error) {
    const nextOverrides = { ...statusOverrides.value }

    if (previousStatus) {
      nextOverrides[job.jobUuid] = previousStatus
    } else {
      delete nextOverrides[job.jobUuid]
    }

    statusOverrides.value = nextOverrides

    window.alert(
      error?.message || 'Failed to change job status.',
    )
  } finally {
    changingStatusJobUuid.value = ''
  }
}

const openJobStages = async (job, selectedStage = null) => {
  if (!job?.jobUuid) {
    window.alert('This job is missing job_uuid, so job stages cannot be loaded.')
    return
  }

  if (!job?.relatedCompany) {
    window.alert('This job is missing related_company, so job stages cannot be loaded.')
    return
  }

  try {
    const response = await axios.post(
      getOneJobEndpoint,
      {
        job_uuid: job.jobUuid,
        related_company: job.relatedCompany,
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
    sessionStorage.setItem('nitrosync-edit-job', JSON.stringify(payload))
    openStageTooltip.value = ''
    openMenuIndex.value = null
    router.push({
      path: '/jobs/post',
      query: {
        mode: 'edit',
        job_uuid: payload.job_uuid || job.jobUuid || '',
        step: 'job-stages',
        source: 'table-stages',
        target_stage: selectedStage?.label || selectedStage?.key || '',
      },
    })
  } catch (error) {
    console.error('Failed to get job details for job stages', {
      endpoint: getOneJobEndpoint,
      payload: {
        job_uuid: job.jobUuid,
        related_company: job.relatedCompany,
      },
      error,
    })

    window.alert(
      error?.response?.data?.message
      || error?.response?.data?.detail
      || error?.response?.data?.msg
      || 'Failed to load job details.',
    )
  }
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

const showStageTooltip = (job, stage) => {
  openStageTooltip.value = `${job.jobUuid || job.id}-${stage.key}`
}

const hideStageTooltip = () => {
  openStageTooltip.value = ''
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

const duplicateJob = async (job) => {
  if (!job?.jobUuid) {
    window.alert('This job is missing job_uuid, so duplicate cannot be sent.')
    return
  }

  if (!job?.relatedCompany) {
    window.alert('This job is missing related_company, so duplicate cannot be sent.')
    return
  }

  if (duplicatingJobUuid.value === job.jobUuid) {
    return
  }

  duplicatingJobUuid.value = job.jobUuid

  try {
    const response = await axios.post(
      duplicateJobEndpoint,
      {
        job_uuid: job.jobUuid,
        related_company: job.relatedCompany,
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: nitroSyncRequestTimeoutMs,
      },
    )

    const responseCode = String(response?.data?.code ?? '').trim()
    const responseMessage = String(
      response?.data?.message
      ?? response?.data?.detail
      ?? response?.data?.msg
      ?? '',
    ).trim()

    if (responseCode === '0' || response?.data?.data === false) {
      throw new Error(responseMessage || 'Failed to duplicate the job.')
    }

    openMenuIndex.value = null
    emit('refresh-jobs')
    window.alert(responseMessage || 'Job duplicated successfully.')
  } catch (error) {
    console.error('Failed to duplicate job', {
      endpoint: duplicateJobEndpoint,
      payload: {
        job_uuid: job.jobUuid,
        related_company: job.relatedCompany,
      },
      error,
    })

    window.alert(
      error?.response?.data?.message
      || error?.response?.data?.detail
      || error?.response?.data?.msg
      || error?.message
      || 'Failed to duplicate the job.',
    )
  } finally {
    duplicatingJobUuid.value = ''
  }
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

const openEditJob = async (job) => {
  if (!job.jobUuid) {
    window.alert('This job is missing job_uuid, so edit cannot be loaded.')
    return
  }

  if (!job.relatedCompany) {
    window.alert('This job is missing related_company, so edit cannot be loaded.')
    return
  }

  try {
    const response = await axios.post(
      getOneJobEndpoint,
      {
        job_uuid: job.jobUuid,
        related_company: job.relatedCompany,
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
    sessionStorage.setItem('nitrosync-edit-job', JSON.stringify(payload))
    openMenuIndex.value = null
    router.push({
      path: '/jobs/post',
      query: {
        mode: 'edit',
        job_uuid: payload.job_uuid || job.jobUuid || '',
      },
    })
  } catch (error) {
    console.error('Failed to get job details for edit', {
      endpoint: getOneJobEndpoint,
      payload: {
        job_uuid: job.jobUuid,
        related_company: job.relatedCompany,
      },
      error,
    })

    window.alert(
      error?.response?.data?.message
        || error?.response?.data?.detail
        || error?.response?.data?.msg
        || 'Failed to load job details.',
    )
  }
}

const buildStoredJobPayload = (job, details = {}) => ({
  job_uuid: details.job_uuid ?? details.uuid ?? job.jobUuid,
  related_company: details.related_company ?? details.company_uuid ?? job.relatedCompany,
  job_title: details.job_title ?? job.title,
  job_code: details.job_code ?? job.jobCode,
  department: extractDepartmentValue(details) || job.department,
  department_id:
    details.department_id
    ?? getNestedDepartmentObject(details)?.id
    ?? getNestedDepartmentObject(details)?.department_id
    ?? '',
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
  expiry_date: details.expiry_date ?? job.expiryDate ?? '',
  start_from: String(details.start_from ?? job.startFrom ?? ''),
  end_to: String(details.end_to ?? job.endTo ?? ''),
  career_level: details.career_level ?? job.careerLevel,
  degree_level: details.degree_level ?? job.degreeLevel,
  job_title_seo: details.job_title_seo ?? job.jobTitleSeo,
  job_description_seo: details.job_description_seo ?? job.jobDescriptionSeo,
  status: extractJobStatusValue(
    details.status
    ?? details.job_status
    ?? details.active_status
    ?? job.status?.key
    ?? job.status?.label
    ?? job.status,
  ),
  published_at: details.published_at ?? details.publish_at ?? '',
  publish_at: details.publish_at ?? details.published_at ?? '',
  close_at: details.close_at ?? '',
  updated_at: details.updated_at ?? '',
  created_at: details.created_at ?? job.createdAt ?? '',
  tags: Array.isArray(details.tags)
    ? details.tags.map((tag) =>
        typeof tag === 'object'
          ? String(tag.tag_name ?? tag.name ?? tag.label ?? tag.value ?? '').trim()
          : String(tag).trim(),
      ).filter(Boolean)
    : [...job.tags],
  recruiter: extractRecruiterValue(details) || job.recruiter,
  recruiter_uuid:
    details.recruiter_uuid
    ?? details.recruiter?.employee_uuid
    ?? details.recruiter?.uuid
    ?? '',
  job_stages: Array.isArray(details.job_stages)
    ? details.job_stages
    : Array.isArray(details.jobs_stages)
      ? details.jobs_stages
      : [],
  jobs_stages: Array.isArray(details.jobs_stages)
    ? details.jobs_stages
    : Array.isArray(details.job_stages)
      ? details.job_stages
      : [],
  score_cards: Array.isArray(details.score_cards) ? details.score_cards : [],
  automated_actions: Array.isArray(details.automated_actions) ? details.automated_actions : [],
  assessments: Array.isArray(details.assessments) ? details.assessments : [],
  intelligent_screen_move_criterias: Array.isArray(details.intelligent_screen_move_criterias) ? details.intelligent_screen_move_criterias : [],
  intelligent_screen_job_questions: Array.isArray(details.intelligent_screen_job_questions) ? details.intelligent_screen_job_questions : [],
})

const openViewJob = async (job) => {
  if (!job.jobUuid) {
    window.alert('This job is missing job_uuid, so view cannot be loaded.')
    return
  }

  if (!job.relatedCompany) {
    window.alert('This job is missing related_company, so view cannot be loaded.')
    return
  }

  viewingJobUuid.value = job.jobUuid

  try {
    const response = await axios.post(
      getOneJobEndpoint,
      {
        job_uuid: job.jobUuid,
        related_company: job.relatedCompany,
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
        related_company: job.relatedCompany,
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

const deleteJobs = async (jobs) => {
  const jobsList = toArray(jobs).filter(Boolean)

  if (!jobsList.length) {
    return
  }

  const invalidJob = jobsList.find((job) => !job?.jobUuid || !job?.relatedCompany)

  if (invalidJob) {
    const message = !invalidJob?.jobUuid
      ? 'One of the selected jobs is missing job_uuid, so delete cannot be sent.'
      : 'One of the selected jobs is missing related_company, so delete cannot be sent.'

    if (jobsList.length === 1) {
      deleteDialogError.value = message
    } else {
      bulkActionError.value = message
    }
    return
  }

  const firstJobUuid = jobsList[0]?.jobUuid ?? ''

  if (jobsList.length === 1) {
    deletingJobUuid.value = firstJobUuid
    deleteDialogError.value = ''
  } else {
    bulkDeleting.value = true
    bulkActionError.value = ''
  }

  try {
    for (const job of jobsList) {
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
        {
          job_uuid: job.jobUuid,
          related_company: job.relatedCompany,
        },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: nitroSyncRequestTimeoutMs,
          },
        )
    }

    deletedJobUuids.value = [...new Set([
      ...deletedJobUuids.value,
      ...jobsList.map((job) => job.jobUuid).filter(Boolean),
    ])]
    openMenuIndex.value = null
    isDeleteDialogOpen.value = false
    selectedDeleteJob.value = null
    selectedJobUuids.value = selectedJobUuids.value.filter(
      (jobUuid) => !jobsList.some((job) => job.jobUuid === jobUuid),
    )
  } catch (error) {
    console.error('Failed to delete job', {
      endpoint: deleteJobEndpoint,
      payload: jobsList.map((job) => ({
        job_uuid: job.jobUuid,
        related_company: job.relatedCompany,
      })),
      error,
    })

    const message =
      error?.response?.data?.message
      || error?.response?.data?.detail
      || error?.response?.data?.msg
      || 'Failed to delete the job.'

    if (jobsList.length === 1) {
      deleteDialogError.value = message
    } else {
      bulkActionError.value = message
    }
  } finally {
    deletingJobUuid.value = ''
    bulkDeleting.value = false
  }
}

const applyBulkStatusChange = async () => {
  const nextStatus = String(bulkStatusAction.value || '').trim()

  if (!selectedJobs.value.length) {
    bulkActionError.value = 'Select at least one job first.'
    return
  }

  if (!nextStatus) {
    bulkActionError.value = 'Choose a bulk action first.'
    return
  }

  const invalidJob = selectedJobs.value.find((job) => !job?.jobUuid || !job?.relatedCompany)
  if (invalidJob) {
    bulkActionError.value = 'One of the selected jobs is missing required identifiers.'
    return
  }

  bulkUpdatingStatus.value = true
  bulkActionError.value = ''

  const failedJobs = []

  for (const job of selectedJobs.value) {
    if (job.status.key === nextStatus) {
      continue
    }

    const previousStatus = statusOverrides.value[job.jobUuid] || job.status.key

    statusOverrides.value = {
      ...statusOverrides.value,
      [job.jobUuid]: nextStatus,
    }

    try {
      await changeNitroSyncJobStatus({
        jobUuid: job.jobUuid,
        relatedCompany: job.relatedCompany,
        status: nextStatus,
      })
    } catch (error) {
      const nextOverrides = { ...statusOverrides.value }

      if (previousStatus) {
        nextOverrides[job.jobUuid] = previousStatus
      } else {
        delete nextOverrides[job.jobUuid]
      }

      statusOverrides.value = nextOverrides
      failedJobs.push(job.title || `#${job.id}`)
    }
  }

  bulkUpdatingStatus.value = false

  if (failedJobs.length) {
    bulkActionError.value = `Failed to update ${failedJobs.length} job(s).`
    return
  }

  clearSelection()
}

const deleteSelectedJobs = async () => {
  if (!selectedJobs.value.length) {
    bulkActionError.value = 'Select at least one job first.'
    return
  }

  const confirmed = window.confirm(`Delete ${selectedJobs.value.length} selected job(s)?`)

  if (!confirmed) {
    return
  }

  await deleteJobs(selectedJobs.value)
}

const onBulkStatusChange = async () => {
  if (!bulkStatusAction.value) return
  await applyBulkStatusChange()
  bulkStatusAction.value = ''
}

const deleteJob = async (job) => {
  if (!job.jobUuid) {
    deleteDialogError.value = 'This job is missing job_uuid, so delete cannot be sent.'
    return
  }

  if (!job.relatedCompany) {
    deleteDialogError.value = 'This job is missing related_company, so delete cannot be sent.'
    return
  }

  await deleteJobs([job])
}

const setViewMode = (mode) => {
  viewMode.value = mode
}

const setStatusFilter = (value) => {
  activeStatusFilter.value = value
  currentPage.value = 1
}

const clearQuickFilters = () => {
  activeStatusFilter.value = 'all'
  searchQuery.value = ''
  filterForm.value = createDefaultFilters()
  currentPage.value = 1
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

watch([normalizedJobs, deletedJobUuids], () => {
  const availableJobUuids = new Set(
    normalizedJobs.value
      .map((job) => job.jobUuid)
      .filter((jobUuid) => jobUuid && !deletedJobUuids.value.includes(jobUuid)),
  )

  selectedJobUuids.value = selectedJobUuids.value.filter((jobUuid) => availableJobUuids.has(jobUuid))
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
    <div class="jobs-overview">
      <article
        v-for="card in statusCards"
        :key="card.key"
        class="jobs-stat"
      >
        <span :class="card.iconClass">
          <component :is="card.icon" />
        </span>
        <div class="jobs-stat__content">
          <span class="jobs-stat__label">{{ card.label }}</span>
          <strong class="jobs-stat__value">{{ card.count }}</strong>
        </div>
      </article>
    </div>

    <div class="jobs-section__top">
      <div class="jobs-section__heading">
        <h1 class="jobs-section__title">JOBS LIST</h1>
        <div class="jobs-status-tabs">
          <button
            v-for="card in statusCards"
            :key="`tab-${card.key}`"
            type="button"
            class="jobs-status-tabs__item"
            :class="{ 'is-active': activeStatusFilter === card.key }"
            @click="setStatusFilter(card.key)"
          >
            {{ card.label }} ({{ card.count }})
          </button>
        </div>
      </div>

      <div class="jobs-controls">
          <label class="jobs-search">
            <span class="jobs-search__icon"></span>
            <input
              v-model.trim="searchQuery"
              type="search"
              placeholder="Search by job title, ID, department..."
            />
          </label>
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
            >
              <LayoutGrid class="jobs-controls__view-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="jobs-controls__view-btn jobs-controls__view-btn--list"
              :class="{ 'is-active': viewMode === 'list' }"
              aria-label="List view"
              @click="setViewMode('list')"
            >
              <LayoutList class="jobs-controls__view-icon" aria-hidden="true" />
            </button>
          </div>
          <button class="jobs-controls__filter" @click="openFilter">
            <span class="jobs-controls__filter-icon"></span>
            Filter
          </button>
          <button class="jobs-controls__clear" type="button" @click="clearQuickFilters">Clear all</button>
          <button class="jobs-controls__post" @click="goToPostJob">+ Post a job</button>
      </div>
    </div>

    <div v-if="selectedJobs.length" class="jobs-bulk">
      <div class="jobs-bulk__summary">
        <span class="jobs-bulk__count">{{ selectedJobs.length }} selected</span>
        <button type="button" class="jobs-bulk__link" @click="toggleVisibleJobsSelection">
          {{ allVisibleJobsSelected ? 'Unselect visible' : 'Select visible' }}
        </button>
        <button type="button" class="jobs-bulk__link" @click="clearSelection">Clear</button>
      </div>

      <div class="jobs-bulk__actions">
        <div class="jobs-bulk__select-wrap">
          <span>Bulk action</span>
          <div class="jobs-bulk__select">
            <Dropdown
              v-model="bulkStatusAction"
              :options="bulkStatusDropdownOptions"
              placeholder="Choose action"
              teleport
              menu-size="small"
              @update:model-value="onBulkStatusChange"
            />
          </div>
        </div>

        <button
          type="button"
          class="jobs-bulk__delete"
          :disabled="bulkDeleting || bulkUpdatingStatus"
          @click="deleteSelectedJobs"
        >
          {{ bulkDeleting ? 'Deleting...' : 'Delete selected' }}
        </button>
      </div>

      <p v-if="bulkActionError" class="jobs-bulk__error">{{ bulkActionError }}</p>
    </div>

    <div v-if="viewMode === 'list'" class="jobs-card">
      <div class="jobs-header jobs-row">
        <div class="jobs-col jobs-col--select">
          <button
            type="button"
            class="jobs-check"
            :class="{ 'jobs-check--selected': allVisibleJobsSelected }"
            :aria-pressed="allVisibleJobsSelected"
            @click="toggleVisibleJobsSelection"
          >
            <span class="jobs-check__mark"></span>
          </button>
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
          <button
            type="button"
            class="jobs-check"
            :class="{ 'jobs-check--selected': isJobSelected(job) }"
            :aria-pressed="isJobSelected(job)"
            @click="toggleJobSelection(job)"
          >
            <span class="jobs-check__mark"></span>
          </button>
        </div>

        <div class="jobs-col jobs-col--id">{{ job.id }}</div>
        <div class="jobs-col jobs-col--title jobs-col--title-wrap">
          <div class="jobs-title-cell">
            <strong class="jobs-title-cell__title jobs-text-soft">{{ job.title }}</strong>
            <span v-if="job.titleMeta" class="jobs-title-cell__meta">{{ job.titleMeta }}</span>
          </div>
        </div>

        <div class="jobs-col jobs-col--department">
          <span :class="job.departmentClass">{{ job.department }}</span>
        </div>

        <div class="jobs-col jobs-col--recruiter">
          <span v-if="job.hasRecruiter" :class="job.recruiterClass">
            <img
              v-if="job.recruiterAvatar"
              :src="job.recruiterAvatar"
              alt=""
              class="avatar-image"
            />
            <span
              v-else
              class="avatar"
              :class="job.avatarClass"
            >
              {{ job.avatar }}
            </span>
            {{ job.recruiter }}
          </span>
          <span v-else class="jobs-recruiter-empty">--</span>
        </div>

        <div class="jobs-col jobs-col--status">
          <span :class="job.status.className">{{ job.status.label }}</span>
        </div>

        <div class="jobs-col jobs-col--date">{{ job.date }}</div>

        <div class="jobs-col jobs-col--expiry jobs-col--expiry-wrap">
          <div class="jobs-expiry-cell">
            <strong>{{ job.expiryDate }}</strong>
            <span
              v-if="job.expiryMeta"
              :class="{ 'jobs-expiry-cell__meta--danger': job.expiryMeta === '(Expired)' }"
            >
              {{ job.expiryMeta }}
            </span>
          </div>
        </div>

        <div class="jobs-col jobs-col--stages">
          <div class="jobs-stages">
            <button
              v-for="stage in job.stages"
              :key="`${job.id}-${stage.key}`"
              type="button"
              class="jobs-stages__dot"
              :class="{ 'jobs-stages__dot--active': stage.isActive }"
              :style="{ backgroundColor: stage.displayColor }"
              @mouseenter="showStageTooltip(job, stage)"
              @mouseleave="hideStageTooltip"
              @click.stop="openJobStages(job, stage)"
            >
              <span
                v-if="openStageTooltip === `${job.jobUuid || job.id}-${stage.key}`"
                class="jobs-stages__tooltip"
              >
                <strong>{{ stage.label }}</strong>
                <span>{{ stage.candidateCount }} candidates</span>
              </span>
            </button>
          </div>
        </div>

        <div class="jobs-col jobs-col--tags">
          <div class="jobs-tags">
            <template v-if="job.tags.length">
              <span
                v-for="tag in job.tags.slice(0, 2)"
                :key="tag"
                class="jobs-tag"
                :style="getTagStyle(tag)"
              >
                {{ tag }}
              </span>
              <span v-if="job.tags.length > 2" class="jobs-tag jobs-tag--count">+{{ job.tags.length - 2 }}</span>
            </template>
            <span v-else class="jobs-tag jobs-tag--empty">No tags</span>
          </div>
        </div>

        <div class="jobs-col jobs-col--action jobs-action">
          <button type="button" class="jobs-action__trigger" @click.stop="toggleMenu(index)" aria-label="Open actions">
            <span></span><span></span><span></span>
          </button>

          <div v-if="openMenuIndex === index" class="jobs-action__menu">
            <button type="button" :disabled="viewingJobUuid === job.jobUuid" @click.stop="openViewJob(job)">View</button>
            <button type="button" @click.stop="openEditJob(job)">Edit</button>
            <button type="button" :disabled="duplicatingJobUuid === job.jobUuid" @click.stop="duplicateJob(job)">{{ duplicatingJobUuid === job.jobUuid ? 'Duplicating...' : 'Duplicate' }}</button>
            <button type="button" :disabled="deletingJobUuid === job.jobUuid" @click.stop="openDeleteDialog(job)">Delete</button>
            <button type="button" @click.stop="openGetCandidateModal(job)">Get Candidates</button>
            <div class="jobs-action__status">
              <span class="jobs-action__status-label">Change Status</span>
              <div class="jobs-action__status-options">
                <button
                  v-for="option in statusOptions"
                  :key="`${job.jobUuid || job.id}-${option.key}`"
                  type="button"
                  class="jobs-action__status-option"
                  :class="[`jobs-action__status-option--${option.key}`, { 'is-active': job.status.key === option.key }]"
                  :disabled="changingStatusJobUuid === job.jobUuid"
                  @click.stop="changeJobStatus(job, option.key)"
                >
                  {{ changingStatusJobUuid === job.jobUuid && job.status.key === option.key ? 'Saving...' : option.label }}
                </button>
              </div>
            </div>
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
          <div class="jobs-grid-card__top-left">
            <button
              type="button"
              class="jobs-check"
              :class="{ 'jobs-check--selected': isJobSelected(job) }"
              :aria-pressed="isJobSelected(job)"
              @click="toggleJobSelection(job)"
            >
              <span class="jobs-check__mark"></span>
            </button>
            <span class="jobs-grid-card__id">#{{ job.id }}</span>
          </div>
          <div class="jobs-action">
            <button type="button" class="jobs-action__trigger" @click.stop="toggleMenu(index)" aria-label="Open actions">
              <span></span><span></span><span></span>
            </button>

            <div v-if="openMenuIndex === index" class="jobs-action__menu">
              <button type="button" :disabled="viewingJobUuid === job.jobUuid" @click.stop="openViewJob(job)">View</button>
              <button type="button" @click.stop="openEditJob(job)">Edit</button>
              <button type="button" :disabled="duplicatingJobUuid === job.jobUuid" @click.stop="duplicateJob(job)">{{ duplicatingJobUuid === job.jobUuid ? 'Duplicating...' : 'Duplicate' }}</button>
              <button type="button" :disabled="deletingJobUuid === job.jobUuid" @click.stop="openDeleteDialog(job)">Delete</button>
              <button type="button" @click.stop="openGetCandidateModal(job)">Get Candidates</button>
              <div class="jobs-action__status">
                <span class="jobs-action__status-label">Change Status</span>
                <div class="jobs-action__status-options">
                  <button
                    v-for="option in statusOptions"
                    :key="`grid-${job.jobUuid || job.id}-${option.key}`"
                    type="button"
                    class="jobs-action__status-option"
                    :class="[`jobs-action__status-option--${option.key}`, { 'is-active': job.status.key === option.key }]"
                    :disabled="changingStatusJobUuid === job.jobUuid"
                    @click.stop="changeJobStatus(job, option.key)"
                  >
                    {{ changingStatusJobUuid === job.jobUuid && job.status.key === option.key ? 'Saving...' : option.label }}
                  </button>
                </div>
              </div>
              <button type="button" @click.stop="openShareModal(job)">Share</button>
            </div>
          </div>
        </div>

        <h3 class="jobs-grid-card__title">{{ job.title }}</h3>
        <p v-if="job.titleMeta" class="jobs-grid-card__subtitle">{{ job.titleMeta }}</p>

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
          <span class="jobs-grid-card__label">Status</span>
          <span :class="job.status.className">{{ job.status.label }}</span>
        </div>

        <div class="jobs-grid-card__section">
          <span class="jobs-grid-card__label">Expiry Date</span>
          <div class="jobs-expiry-cell jobs-expiry-cell--grid">
            <strong>{{ job.expiryDate }}</strong>
            <span
              v-if="job.expiryMeta"
              :class="{ 'jobs-expiry-cell__meta--danger': job.expiryMeta === '(Expired)' }"
            >
              {{ job.expiryMeta }}
            </span>
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
              @mouseenter="showStageTooltip(job, stage)"
              @mouseleave="hideStageTooltip"
              @click.stop="openJobStages(job, stage)"
            >
              <span
                v-if="openStageTooltip === `${job.jobUuid || job.id}-${stage.key}`"
                class="jobs-stages__tooltip"
              >
                <strong>{{ stage.label }}</strong>
                <span>{{ stage.candidateCount }} candidates</span>
              </span>
            </button>
          </div>
        </div>

        <div class="jobs-grid-card__section">
          <span class="jobs-grid-card__label">Recruiter</span>
          <span v-if="job.hasRecruiter" :class="job.recruiterClass">
            <img
              v-if="job.recruiterAvatar"
              :src="job.recruiterAvatar"
              alt=""
              class="avatar-image"
            />
            <span
              v-else
              class="avatar"
              :class="job.avatarClass"
            >
              {{ job.avatar }}
            </span>
            {{ job.recruiter }}
          </span>
          <span v-else class="jobs-recruiter-empty">--</span>
        </div>

        <div class="jobs-grid-card__section">
          <span class="jobs-grid-card__label">Tags</span>
          <div class="jobs-tags jobs-tags--grid">
            <template v-if="job.tags.length">
              <span
                v-for="tag in job.tags.slice(0, 3)"
                :key="`grid-tag-${job.id}-${tag}`"
                class="jobs-tag"
                :style="getTagStyle(tag)"
              >
                {{ tag }}
              </span>
              <span v-if="job.tags.length > 3" class="jobs-tag jobs-tag--count">+{{ job.tags.length - 3 }}</span>
            </template>
            <span v-else class="jobs-tag jobs-tag--empty">No tags</span>
          </div>
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
      :field-options="filterFieldOptions"
      :position-options="filterPositionOptions"
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
  position: relative;
  z-index: 1;
}

.jobs-overview {
  display: grid;
  grid-template-columns: repeat(7, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  max-width: 1590px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 96px;
}

.jobs-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #f1e5ea;
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 42%),
    linear-gradient(180deg, #ffffff 0%, #fffafb 100%);
  box-shadow: 0 10px 24px rgba(66, 39, 51, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.jobs-stat:hover {
  transform: translateY(-1px);
  border-color: #efc7d7;
  box-shadow: 0 16px 30px rgba(255, 95, 150, 0.1);
}

.jobs-stat__icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  flex: 0 0 auto;
  position: relative;
  display: grid;
  place-items: center;
}

.jobs-stat__icon :deep(svg) {
  width: 15px;
  height: 15px;
  stroke-width: 2;
}

.jobs-stat__icon--all {
  background: radial-gradient(circle at 30% 28%, #fff7fb 0%, #ffd6e7 38%, #ffbfd7 100%);
  color: #ff4f93;
  box-shadow: 0 10px 18px rgba(255, 79, 147, 0.18);
}

.jobs-stat__icon--active {
  background: radial-gradient(circle at 30% 28%, #f4fff8 0%, #cff3dd 38%, #b8eccd 100%);
  color: #1ebc65;
  box-shadow: 0 10px 18px rgba(30, 188, 101, 0.16);
}

.jobs-stat__icon--hold {
  background: radial-gradient(circle at 30% 28%, #fffaf0 0%, #ffe8b7 38%, #ffd98f 100%);
  color: #dd9300;
  box-shadow: 0 10px 18px rgba(221, 147, 0, 0.14);
}

.jobs-stat__icon--closed {
  background: radial-gradient(circle at 30% 28%, #f8fbff 0%, #dde7f5 38%, #cfdbef 100%);
  color: #6b7a96;
  box-shadow: 0 10px 18px rgba(107, 122, 150, 0.14);
}

.jobs-stat__icon--expired {
  background: radial-gradient(circle at 30% 28%, #fff8fa 0%, #ffd5df 38%, #ffc0ce 100%);
  color: #f25467;
  box-shadow: 0 10px 18px rgba(242, 84, 103, 0.14);
}

.jobs-stat__icon--draft {
  background: radial-gradient(circle at 30% 28%, #faf7ff 0%, #e5d8ff 40%, #d7c3ff 100%);
  color: #8c5bf3;
  box-shadow: 0 10px 18px rgba(140, 91, 243, 0.14);
}

.jobs-stat__icon--archived {
  background: radial-gradient(circle at 30% 28%, #fafcff 0%, #dfe7f1 38%, #d1dae7 100%);
  color: #5f697b;
  box-shadow: 0 10px 18px rgba(95, 105, 123, 0.14);
}

.jobs-stat__content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.jobs-stat__label {
  font-size: 12px;
  color: #614855;
  font-weight: 700;
}

.jobs-stat__value {
  font-size: 20px;
  line-height: 1;
  color: #21131d;
  font-weight: 800;
  letter-spacing: -0.02em;
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
  gap: 10px;
  margin-bottom: 14px;
}

.jobs-section__heading {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1 1 auto;
}

.jobs-section__title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0;
  color: #1f1720;
  flex: 0 0 auto;
  white-space: nowrap;
}

.jobs-status-tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
  min-width: 0;
  flex: 1 1 auto;
}

.jobs-status-tabs::-webkit-scrollbar {
  display: none;
}

.jobs-status-tabs__item {
  min-height: 30px;
  padding: 0 14px;
  border: 1px solid #f0e3e9;
  border-radius: 999px;
  background: #ffffff;
  color: #6a5662;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  flex: 0 0 auto;
  box-shadow: 0 8px 20px rgba(255, 95, 150, 0.05);
}

.jobs-status-tabs__item.is-active {
  border-color: #ff4f93;
  background: linear-gradient(135deg, #ff74a9 0%, #ff4f93 58%, #f03a83 100%);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(255, 79, 147, 0.24);
}

.jobs-controls {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
  flex: 0 0 auto;
}

.jobs-search {
  min-width: 0;
  width: 154px;
  max-width: 100%;
  height: 34px;
  padding: 0 9px;
  border: 1px solid #efe3e8;
  border-radius: 14px;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 10px 22px rgba(255, 95, 150, 0.07);
}

.jobs-search input {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #57464f;
  font-size: 10.5px;
  line-height: 1;
  padding: 0;
}

.jobs-search input::placeholder {
  font-size: 10.5px;
  color: #b08c9f;
}

.jobs-search__icon {
  width: 11px;
  height: 11px;
  border: 1.6px solid #9ca3af;
  border-radius: 999px;
  position: relative;
  flex: 0 0 auto;
  margin-left: 1px;
}

.jobs-search__icon::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 2px;
  background: #9ca3af;
  border-radius: 999px;
  right: -3px;
  bottom: -2px;
  transform: rotate(45deg);
}

.jobs-controls__show {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #8d6977;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
}

.jobs-controls__show-select {
  width: 68px;
}

.jobs-controls__select,
.jobs-controls__filter,
.jobs-controls__clear,
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
  min-width: 54px;
  height: 32px;
  padding: 0 22px 0 9px;
  border: 1px solid #f0d9e3;
  background: #ffffff;
  color: #ff4f93;
  border-radius: 10px;
  box-shadow: none;
}

.jobs-controls__show-select :deep(.dropdown__value) {
  font-size: 11px;
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
  min-width: 72px;
  height: 32px;
  padding: 3px;
  background: #ffffff;
  border: 1px solid #f0d9e3;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.jobs-controls__view-btn {
  width: 29px;
  height: 20px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  display: grid;
  place-items: center;
  color: #ff4f93;
  transition: background-color 0.18s ease, box-shadow 0.18s ease;
}

.jobs-controls__view-btn.is-active {
  background: linear-gradient(135deg, #ff72a8 0%, #ff4f93 100%);
  box-shadow: 0 10px 18px rgba(255, 79, 147, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.35);
  color: #fff;
}

.jobs-controls__view-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2.2;
}

.jobs-controls__filter {
  height: 32px;
  padding: 0 11px;
  border: 1px solid #eeb1c7;
  background: #ffffff;
  color: #ff4f93;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  border-radius: 10px;
  white-space: nowrap;
}

.jobs-controls__clear {
  height: 32px;
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: #ff4f93;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.jobs-controls__filter-icon {
  width: 10px;
  height: 10px;
  background: currentColor;
  clip-path: polygon(0 0, 100% 0, 64% 42%, 64% 100%, 36% 100%, 36% 42%);
}

.jobs-controls__post {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #ee78a6;
  background: #ffffff;
  color: #ff4f93;
  font-size: 11px;
  border-radius: 11px;
  line-height: 1;
  white-space: nowrap;
  box-shadow: none;
}

.jobs-bulk {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
  padding: 12px 14px;
  border: 1px solid #f1dbe5;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 10px 22px rgba(66, 39, 51, 0.04);
}

.jobs-bulk__summary,
.jobs-bulk__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.jobs-bulk__count {
  color: #3d2c34;
  font-size: 12px;
  font-weight: 700;
}

.jobs-bulk__link {
  border: 0;
  background: transparent;
  color: #ea4f8d;
  font-size: 11px;
  font-weight: 600;
  padding: 0;
}

.jobs-bulk__select-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8d6977;
  font-size: 11px;
  font-weight: 600;
}

.jobs-bulk__select {
  width: 170px;
  min-width: 170px;
}

.jobs-bulk__select :deep(.dropdown) {
  width: 100%;
  --control-height: 40px;
  --control-padding-x: 12px;
  --control-radius: 14px;
  --font-body: 11px;
}

.jobs-bulk__select :deep(.dropdown__trigger) {
  border-color: #ecd8e1;
  color: #5f5360;
  background: #ffffff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.jobs-bulk__select :deep(.dropdown__trigger:hover) {
  border-color: #e4c7d5;
}

.jobs-bulk__select :deep(.dropdown__menu) {
  border: 1px solid #ecd8e1;
  border-radius: 14px;
  box-shadow: 0 18px 32px rgba(83, 52, 67, 0.14);
  padding: 8px;
}

.jobs-bulk__select :deep(.dropdown__option) {
  min-height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  font-size: 11px;
}

.jobs-bulk__select :deep(.dropdown__option--selected) {
  background: linear-gradient(135deg, #fff0f6, #ffe6ef);
  color: #df4e87;
}

.jobs-bulk__delete {
  height: 34px;
  padding: 0 14px;
  border: 1px solid #f2b7ca;
  border-radius: 12px;
  background: #fff1f5;
  color: #d94a82;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.jobs-bulk__error {
  margin: 0;
  color: #cf4f80;
  font-size: 11px;
  font-weight: 600;
}

.jobs-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 10px 10px 4px;
  box-shadow: 0 18px 34px rgba(56, 36, 47, 0.06);
  overflow-x: auto;
  overflow-y: visible;
  border: 1px solid #f1e3ea;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.jobs-grid-card {
  position: relative;
  min-height: 220px;
  padding: 22px 24px 20px;
  border: 1px solid #f2e6eb;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 16px 36px rgba(73, 46, 58, 0.06);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.jobs-grid-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 2px;
}

.jobs-grid-card__top-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.jobs-grid-card__id {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: linear-gradient(180deg, #fff3f8 0%, #ffe8f1 100%);
  color: #e84b8a;
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.jobs-grid-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: #935d75;
  letter-spacing: -0.02em;
}

.jobs-grid-card__subtitle {
  margin: -8px 0 2px;
  color: #8e8190;
  font-size: 12px;
  line-height: 1.55;
}

.jobs-grid-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 2px;
}

.jobs-grid-card__meta-item,
.jobs-grid-card__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.jobs-grid-card__meta-item {
  min-height: 72px;
  padding: 12px 14px;
  border: 1px solid #f5e9ee;
  border-radius: 16px;
  background: #fffafb;
}

.jobs-grid-card__section {
  padding-top: 14px;
  border-top: 1px solid #f4eaee;
}

.jobs-grid-card__section + .jobs-grid-card__section {
  margin-top: -2px;
}

.jobs-grid-card__label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b59eaa;
}

.jobs-grid-card__meta-item > span:last-child {
  color: #33252d;
  font-size: 15px;
  font-weight: 700;
}

.jobs-grid-card :deep(.job-status) {
  align-self: flex-start;
  min-height: 36px;
  padding: 0 18px;
  font-size: 13px;
}

.jobs-grid-card .jobs-expiry-cell--grid {
  align-items: flex-start;
  gap: 3px;
}

.jobs-grid-card .jobs-expiry-cell--grid strong {
  font-size: 14px;
}

.jobs-grid-card .jobs-expiry-cell--grid span {
  font-size: 11px;
}

.jobs-grid-card .jobs-stages--grid {
  gap: 8px;
}

.jobs-stages--grid {
  justify-content: flex-start;
}

.jobs-tags--grid {
  justify-content: flex-start;
  gap: 8px;
}

.jobs-grid-card .jobs-tag {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.jobs-grid-card :deep(.recruiter) {
  align-self: flex-start;
  min-height: 34px;
  padding: 6px 12px;
  font-size: 12px;
}

.jobs-grid-card .jobs-recruiter-empty {
  font-size: 13px;
}

.jobs-row {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  min-width: 1210px;
}

.jobs-header {
  background: #ffffff;
  border-radius: var(--surface-radius);
  padding: 14px 18px;
  font-weight: 500;
  margin-bottom: 6px;
  position: relative;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.jobs-header__cell {
  color: #756471;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.jobs-row--body {
  padding: 14px 18px;
  border-bottom: 1px solid #f3dde6;
  background: #ffffff;
  transition: background-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  font-size: 11px;
  position: relative;
}

.jobs-row--body:hover {
  background: #ffffff;
  box-shadow: inset 4px 0 0 #ff4f93;
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
  width: 210px;
}

.jobs-col--date {
  width: 112px;
}

.jobs-col--status {
  width: 102px;
}

.jobs-col--expiry {
  width: 118px;
}

.jobs-col--stages {
  width: 86px;
}

.jobs-col--tags {
  width: 104px;
  justify-content: flex-start;
  padding-left: 10px;
}

.jobs-col--department {
  width: 148px;
}

.jobs-col--recruiter {
  width: 138px;
}

.jobs-col--action {
  width: 72px;
}

.jobs-check {
  width: 16px;
  height: 16px;
  border: 1px solid #efadc4;
  border-radius: 5px;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.jobs-check__mark {
  width: 8px;
  height: 5px;
  border-left: 1.6px solid transparent;
  border-bottom: 1.6px solid transparent;
  transform: rotate(-45deg) translateY(-1px);
}

.jobs-check--selected {
  background: #ea4f8d;
  border-color: #ea4f8d;
  box-shadow: 0 8px 18px rgba(234, 79, 141, 0.18);
}

.jobs-check--selected .jobs-check__mark {
  border-color: #ffffff;
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

.jobs-col--title-wrap,
.jobs-col--expiry-wrap {
  text-align: left;
}

.jobs-col--title-wrap {
  justify-content: center;
  text-align: center;
}

.jobs-col--expiry-wrap {
  justify-content: center;
}

.jobs-title-cell,
.jobs-expiry-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.jobs-title-cell {
  align-items: center;
}

.jobs-expiry-cell {
  align-items: center;
}

.jobs-title-cell__title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
}

.jobs-title-cell__meta,
.jobs-expiry-cell span {
  font-size: 11px;
  color: #8f8590;
}

.jobs-expiry-cell strong {
  color: #4b5563;
  font-size: 12px;
  font-weight: 700;
}

.jobs-expiry-cell__meta--danger {
  color: #f25f6d !important;
}

.jobs-stages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.jobs-stages__dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  position: relative;
  flex: 0 0 auto;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
}

.jobs-stages__dot--active {
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.98),
    0 0 0 1px rgba(123, 96, 112, 0.12),
    0 0 12px rgba(239, 91, 150, 0.28);
}

.jobs-stages__tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  min-width: max-content;
  padding: 7px 10px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #eddbe3;
  box-shadow: 0 12px 24px rgba(63, 37, 49, 0.12);
  color: #7d5f6d;
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
  display: grid;
  gap: 3px;
  text-align: center;
  z-index: 12;
}

.jobs-stages__tooltip strong {
  color: #4e3e47;
  font-weight: 700;
}

.jobs-stages__tooltip span {
  color: #9a8791;
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
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 6px;
}

.jobs-tag {
  background: #ffffff;
  padding: 6px 11px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  color: #654b59;
  border: 1px solid transparent;
  letter-spacing: 0.01em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.jobs-tag--count {
  background: #f2e8ff;
  color: #7e4eff;
  border-color: #dfccff;
  box-shadow: 0 8px 18px rgba(126, 78, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.jobs-tag--empty {
  background: #f2f5fb;
  color: #71809b;
  border-color: #e0e7f2;
}

:deep(.department) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #eef1f5;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.01em;
  box-shadow: 0 8px 18px rgba(76, 59, 69, 0.06);
}

:deep(.department)::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  flex: 0 0 auto;
  box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 12%, white);
}

:deep(.department--pink) { color: #ff4f93; }
:deep(.department--blue) { color: #2f72ff; }
:deep(.department--indigo) { color: #8a4dff; }
:deep(.department--gold) { color: #d68800; }
:deep(.department--green) { color: #16b763; }

:deep(.recruiter) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border-radius: 20px;
  padding: 5px 10px;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
  border: 1px solid transparent;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.jobs-recruiter-empty {
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
}

:deep(.job-status) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  border: 1px solid transparent;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
}

:deep(.job-status--active) { color: #009f55; background: #d7f7e4 !important; border-color: #b6eccb; box-shadow: 0 8px 18px rgba(0, 159, 85, 0.12); }
:deep(.job-status--hold) { color: #d68800; background: #ffe8c2 !important; border-color: #ffd58a; box-shadow: 0 8px 18px rgba(214, 136, 0, 0.12); }
:deep(.job-status--closed) { color: #587096; background: #dfe8f7 !important; border-color: #c6d3e7; box-shadow: 0 8px 18px rgba(88, 112, 150, 0.12); }
:deep(.job-status--draft) { color: #6a2cff; background: #eadcff !important; border-color: #d9bfff; box-shadow: 0 8px 18px rgba(106, 44, 255, 0.12); }
:deep(.job-status--expired) { color: #ef3f63; background: #ffdbe4 !important; border-color: #ffc0cd; box-shadow: 0 8px 18px rgba(239, 63, 99, 0.12); }
:deep(.job-status--archived) { color: #4e6789; background: #dee7f3 !important; border-color: #c8d4e4; box-shadow: 0 8px 18px rgba(78, 103, 137, 0.12); }
:deep(.job-status--pending) { color: #3258e6; background: #dbe8ff !important; border-color: #c2d8ff; box-shadow: 0 8px 18px rgba(50, 88, 230, 0.12); }

:deep(.recruiter--pink) { color: #ff2f86; background: #ffdceb; border-color: #ffc1d9; box-shadow: 0 8px 18px rgba(255, 47, 134, 0.1); }
:deep(.recruiter--blue) { color: #175cff; background: #dbe8ff; border-color: #c2d8ff; box-shadow: 0 8px 18px rgba(23, 92, 255, 0.1); }
:deep(.recruiter--purple) { color: #6a2cff; background: #eadcff; border-color: #d9bfff; box-shadow: 0 8px 18px rgba(106, 44, 255, 0.1); }
:deep(.recruiter--gold) { color: #d98a00; background: #ffe8c2; border-color: #ffd58a; box-shadow: 0 8px 18px rgba(217, 138, 0, 0.1); }
:deep(.recruiter--green) { color: #00a85a; background: #d7f7e4; border-color: #b5eccb; box-shadow: 0 8px 18px rgba(0, 168, 90, 0.1); }
:deep(.recruiter--cyan) { color: #0098b8; background: #d8f5f2; border-color: #b7e9e3; box-shadow: 0 8px 18px rgba(0, 152, 184, 0.1); }

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

.avatar-image {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  object-fit: cover;
  flex: 0 0 auto;
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

.jobs-action__status {
  padding: 10px 16px 12px;
  border-top: 1px solid #f2e7ec;
  border-bottom: 1px solid #f2e7ec;
}

.jobs-action__status-label {
  display: block;
  margin-bottom: 8px;
  color: #9e8590;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.jobs-action__status-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.jobs-action__menu .jobs-action__status-option {
  width: auto;
  min-height: 26px;
  padding: 6px 10px;
  border: 1px solid #edd8e2;
  border-radius: 999px;
  background: #fff7fa;
  color: #8b596a;
  font-size: 11px;
  line-height: 1;
  font-weight: 600;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.jobs-action__menu .jobs-action__status-option.is-active {
  border-color: #ee76a9;
  background: #ffe8f1;
  color: #d74284;
}

.jobs-action__menu .jobs-action__status-option:disabled {
  cursor: wait;
  opacity: 0.75;
}

.jobs-action__menu .jobs-action__status-option--active {
  border-color: #bfe7d0;
  background: #e0f7ea;
  color: #0d8a57;
}

.jobs-action__menu .jobs-action__status-option--on_hold {
  border-color: #f4d292;
  background: #fff0c8;
  color: #ae6c00;
}

.jobs-action__menu .jobs-action__status-option--closed {
  border-color: #cfd8e6;
  background: #e9eff8;
  color: #4d5c72;
}

.jobs-action__menu .jobs-action__status-option--draft {
  border-color: #d4c6ff;
  background: #eee7ff;
  color: #6338dc;
}

.jobs-action__menu .jobs-action__status-option--expired {
  border-color: #f2b9c5;
  background: #ffe0e6;
  color: #dd3954;
}

.jobs-action__menu .jobs-action__status-option--archived {
  border-color: #ccd5e3;
  background: #e7edf6;
  color: #41536c;
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

@media (max-width: 1280px) {
  .jobs-section__top {
    gap: 8px;
  }

  .jobs-search {
    width: 160px;
  }

  .jobs-controls {
    gap: 6px;
  }

  .jobs-status-tabs__item {
    padding: 0 12px;
    font-size: 10px;
  }
}

@media (max-width: 1180px) {
  .jobs-overview {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .jobs-section__top {
    align-items: flex-start;
    flex-direction: column;
  }

  .jobs-section__heading {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .jobs-controls {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .jobs-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 840px) {
  .jobs-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .jobs-section__title {
    font-size: 42px;
    line-height: 1;
    margin-bottom: 10px;
  }

  .jobs-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 12px;
  }

  .jobs-search {
    min-width: 0;
    width: 100%;
    grid-column: 1 / -1;
  }

  .jobs-controls__show,
  .jobs-controls__clear,
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

  .jobs-bulk {
    flex-direction: column;
    align-items: stretch;
  }

  .jobs-bulk__summary,
  .jobs-bulk__actions {
    justify-content: space-between;
  }

  .jobs-bulk__select-wrap {
    width: 100%;
    justify-content: space-between;
  }

  .jobs-bulk__select {
    flex: 1 1 auto;
    min-width: 0;
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
    display: flex;
    grid-column: 1 / -1;
    justify-content: flex-end;
  }

  .jobs-col--id,
  .jobs-col--date,
  .jobs-col--status,
  .jobs-col--expiry,
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
  .jobs-col--status::before,
  .jobs-col--expiry::before,
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
  .jobs-col--status::before { content: 'Status'; }
  .jobs-col--expiry::before { content: 'Expiry Date'; }
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

  .jobs-col--expiry-wrap {
    justify-content: flex-start;
    text-align: left;
  }

  .jobs-expiry-cell {
    align-items: flex-start;
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
  .jobs-overview {
    grid-template-columns: 1fr;
  }

  .jobs-section__title {
    font-size: 34px;
  }

  .jobs-controls {
    grid-template-columns: 1fr;
  }

  .jobs-bulk__summary,
  .jobs-bulk__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .jobs-bulk__delete {
    width: 100%;
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
