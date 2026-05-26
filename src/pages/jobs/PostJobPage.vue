<script setup>
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createNitroSyncApplicationForm,
  fetchNitroSyncApplicationForm,
  updateNitroSyncApplicationForm,
} from '../../composables/useNitroSyncApplicationForms'
import { fetchNitroSyncJobStages } from '../../composables/useNitroSyncJobStages'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from '../../composables/nitroSyncApi'
import { changeNitroSyncJobStatus } from '../../composables/useNitroSyncChangeJobStatus'
import { fetchNitroSyncCompany } from '../../composables/useNitroSyncCompanies'
import { getNitroSyncEmployees } from '../../composables/useNitroSyncEmployees'
import AdditionalInformation from '../../components/jobPosting/AdditionalInformation.vue'
import ApplicationFormStep from '../../components/jobPosting/ApplicationFormStep.vue'
import AppearanceStep from '../../components/jobPosting/AppearanceStep.vue'
import HiringTeamStep from '../../components/jobPosting/HiringTeamStep.vue'
import IntelligentScreenStep from '../../components/jobPosting/IntelligentScreenStep.vue'
import JobStagesStep from '../../components/jobPosting/JobStagesStep.vue'
import JobDetails from '../../components/jobPosting/JobDetails.vue'
import JobPreviewStep from '../../components/jobPosting/JobPreviewStep.vue'
import MetaDataStep from '../../components/jobPosting/MetaDataStep.vue'
import RecruiterStep from '../../components/jobPosting/RecruiterStep.vue'
import TagsStep from '../../components/jobPosting/TagsStep.vue'
import Dropdown from '../../components/ui/Dropdown.vue'

const showWizard = ref(false)
const route = useRoute()
const router = useRouter()
const mainStep = ref(0)
const currentStep = ref(0)
const furthestMainStep = ref(0)
const furthestPostingStep = ref(0)
const appFormStage = ref(0)
const intelligentStage = ref(0)
const intelligentQuestionTypes = ref([])
const selectedTemplate = ref('')
const templatesLoading = ref(false)
const validationMessage = ref('')
const submissionMessage = ref('')
const submittingJob = ref(false)
const jobDetailsErrors = ref({})
const additionalInfoErrors = ref({})
const appFormErrors = ref({})
const metaDataErrors = ref({})
const hiringTeamErrors = ref({})
const isEditMode = ref(false)
const isViewMode = ref(false)
const editingJobUuid = ref('')
const currentJobUuid = ref('')
const completionModal = ref({
  open: false,
  variant: 'save',
})
const currentJobMeta = ref({
  status: '',
  publishAt: '',
  closeAt: '',
  expiryDate: '',
  updatedAt: '',
  createdAt: '',
})
const applicationFormId = ref('')
const resolvedCompanyName = ref('')
const recruiterDirectory = ref([])
const jobStagesValidation = ref({
  message: '',
  stageErrors: {},
  details: [],
})

const jobDetailsForm = ref({
  jobTitle: '',
  jobCode: '',
  department: '',
  country: '',
  city: '',
  description: '',
})

const additionalInfoForm = ref({
  degreeLevel: '',
  careerLevel: '',
  industry: '',
  contractType: '',
  currency: '',
  salaryFrom: '',
  salaryTo: '',
})

const metaDataForm = ref({
  seoTitle: '',
  seoDescription: '',
  seoPhoto: null,
})

const tagsForm = ref({
  selectedTags: ['High Salary', 'Finance'],
})

const recruiterForm = ref({
  selectedRecruiters: ['Manal Oraby'],
})

const hiringTeamForm = ref({
  team: '',
  recruiter: '',
  additionalUsers: ['Manal Oraby'],
})

const previewForm = ref({
  publishAction: '',
  schedule: {
    publishDate: '',
    publishTime: '',
    closePublishDate: '',
    closePublishTime: '',
    scheduleEnabled: true,
    closePublishEnabled: true,
  },
})

const normalizeJobStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '_')

  if (['1', 'draft', 'pending', 'scheduled'].includes(normalized)) return 'draft'
  if (['2', 'active', 'published', 'open', 'live'].includes(normalized)) return 'active'
  if (['3', 'expired', 'expire'].includes(normalized)) return 'expired'
  if (['4', 'on_hold', 'hold', 'paused', 'pause'].includes(normalized)) return 'on_hold'
  if (['5', 'closed', 'close', 'filled'].includes(normalized)) return 'closed'
  if (['6', 'archived', 'archive'].includes(normalized)) return 'archived'

  return normalized
}
const formatJobDateTime = (value) => {
  const rawValue = String(value || '').trim()
  if (!rawValue) return ''

  const parsed = new Date(rawValue)
  if (Number.isNaN(parsed.getTime())) return rawValue

  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isPublishedJobState = computed(() =>
  ['published', 'active', 'open', 'live'].includes(normalizeJobStatus(currentJobMeta.value.status)),
)

const jobPublishSummary = computed(() => {
  const publishedAt = formatJobDateTime(currentJobMeta.value.publishAt || currentJobMeta.value.createdAt)
  const closeAt = formatJobDateTime(currentJobMeta.value.closeAt)
  const status = normalizeJobStatus(currentJobMeta.value.status)

  if (publishedAt && isPublishedJobState.value) {
    return closeAt
      ? `Published on ${publishedAt}. Closing on ${closeAt}.`
      : `Published on ${publishedAt}.`
  }

  if (publishedAt && status === 'scheduled') {
    return closeAt
      ? `Scheduled to publish on ${publishedAt}. Closing on ${closeAt}.`
      : `Scheduled to publish on ${publishedAt}.`
  }

  return ''
})

const appearanceForm = ref({
  coverPhoto: null,
  photo: null,
})

const intelligentScreenForm = ref({
  questionDrafts: {},
  criteriaList: [
    {
      id: 1,
      name: '',
      selectedConditionId: '',
      lowerValue: '',
      upperValue: '',
      moveTo: '',
      scoreMenuOpen: false,
    },
  ],
})

const jobStagesForm = ref({
  screen: 0,
  showWorkflowDesigner: false,
  openedFromStagesDots: false,
  targetedWorkflowStage: '',
  newStageName: '',
  selectedScoreCard: '',
  scoreCardDraft: {
    name: 'Graphic Designer Screening Scorecard',
    jobTitle: 'Graphic Designer',
    interviewer: 'Interviewer',
    tags: 'Screening, design, culture fit',
    instructionMessage: 'Please score each candidate against the required skills, leave concise evidence-based notes, and flag any follow-up needed before moving to the next stage.',
    evaluationCriteria: 'Assess ownership, communication clarity, collaboration, and how the candidate responds to feedback during the interview process.',
    commentsObservation: 'Use this section for final interviewer notes, decision context, and clear recommendations before the candidate advances.',
  },
  stageRows: [
    { jobStageUuid: '', label: 'Screen', enabled: true },
    { jobStageUuid: '', label: 'Testing', enabled: true },
    { jobStageUuid: '', label: 'Interview', enabled: false },
    { jobStageUuid: '', label: 'Hired', enabled: false },
  ],
  questionInput: '',
  selectedQuestions: [],
  selectedCompetency: '',
  selectedCompetencies: [],
  manualCompetencyMode: false,
  manualCompetencyTitle: '',
  manualSkillMode: false,
  manualSkillTitle: '',
      automatedActionDraft: {
        automatedActionUuid: '',
        condition: '',
    primaryAction: '',
    assignedRecruiter: '',
    assignMessage: 'Send the candidate invitation automatically, assign the right owner, and add a short internal note for the next reviewer.',
    inviteAutomatically: false,
    moveCandidateTo: '',
    notifyCandidate: false,
    assignManager: true,
  },
  savedAutomatedActions: [],
})

const appForm = ref({
  firstName: 'mandatory',
  lastName: 'optional',
  email: 'off',
  gender: 'mandatory',
  country: 'optional',
  address: 'mandatory',
  jobTitle: 'off',
  company: 'off',
  ethnicity: 'optional',
  disability: 'mandatory',
  cvStatus: 'mandatory',
  coverLetterStatus: 'mandatory',
  cvFile: null,
  coverLetterFile: null,
  applicationQuestionsLoaded: false,
})

const fallbackTemplateDrafts = [
  {
    label: 'Marketing template',
    value: 'marketing',
    draft: {
      job_title: 'Marketing Manager',
      job_code: 'MKT-204',
      department: 'Marketing',
      country: 'Saudi Arabia',
      city: 'Riyadh',
      description: 'Lead campaign planning, brand growth, and performance reporting across digital and offline channels.',
      degree_level: 'Bachelor',
      career_level: 'Mid-Senior level',
      industry: 'Technology',
      contract_type: 'Full time',
      currency: 'SAR',
      start_from: '$1000',
      end_to: '$2000',
      tags: ['Marketing', 'Leadership', 'Analytics'],
      recruiter: 'Manal Oraby',
      team: 'Marketing Team',
      job_title_seo: 'Marketing Manager Job Opening',
      job_description_seo: 'Marketing Manager role focused on campaigns, growth, and team leadership.',
    },
  },
  {
    label: 'Engineering template',
    value: 'engineering',
    draft: {
      job_title: 'Civil Engineer',
      job_code: 'ENG-112',
      department: 'Engineering',
      country: 'Jordan',
      city: 'Amman',
      description: 'Plan, review, and supervise civil engineering works with strong coordination across project teams.',
      degree_level: 'Bachelor',
      career_level: 'Senior level',
      industry: 'Technology',
      contract_type: 'Full time',
      currency: 'USD',
      start_from: '$1000',
      end_to: '$2000',
      tags: ['Engineering', 'Site', 'Projects'],
      recruiter: 'Tareq Ahmad',
      team: 'Product Team',
      job_title_seo: 'Civil Engineer Career Opportunity',
      job_description_seo: 'Civil Engineer opening for project delivery, design review, and site coordination.',
    },
  },
  {
    label: 'Sales template',
    value: 'sales',
    draft: {
      job_title: 'Sales Executive',
      job_code: 'SAL-318',
      department: 'Sales',
      country: 'UAE',
      city: 'Dubai',
      description: 'Drive pipeline growth, manage key accounts, and close new business opportunities.',
      degree_level: 'Bachelor',
      career_level: 'Mid level',
      industry: 'Banking',
      contract_type: 'Full time',
      currency: 'EUR',
      start_from: '$1000',
      end_to: '$2000',
      tags: ['Sales', 'B2B', 'Revenue'],
      recruiter: 'Lina Saleh',
      team: 'Marketing Team',
      job_title_seo: 'Sales Executive Hiring',
      job_description_seo: 'Sales Executive role focused on client acquisition, pipeline growth, and closing.',
    },
  },
]
const templates = ref([...fallbackTemplateDrafts])

const defaultCompanyId = 'b00af2a4-2d77-432b-bd93-4e7ea120d154'
let companyId = defaultCompanyId
const createJobEndpoint = buildNitroSyncEndpoint('/v1/jobs/create')
const editJobEndpoint = buildNitroSyncEndpoint('/v1/jobs/edit')
const schedulePublishEndpoint = buildNitroSyncEndpoint('/v1/jobs/schedule-publish')
const getJobTemplatesEndpoint = buildNitroSyncEndpoint('/v1/jobs/get-templates')

const wizardSteps = [
  { label: 'Job Posting', color: '#ea4f8d' },
  { label: 'App Form', color: '#3f6fff' },
  { label: 'Intelligent screen', color: '#6b21d8' },
  { label: 'Job stages', color: '#e5aa15' },
  { label: 'Hiring Team', color: '#41d66b' },
  { label: 'Preview', color: '#ea4f8d' },
]

const postingTabs = [
  { label: 'Job details', accent: '#ff5f9d' },
  { label: 'Additional information', accent: '#4f7dff' },
  { label: 'Tags', accent: '#7028e4' },
  { label: 'Recruiter', accent: '#f1b32a' },
  { label: 'Appearance', accent: '#48d873' },
  { label: 'Meta data', accent: '#ffcde0' },
]

const normalizeTemplateText = (value) => String(value ?? '').trim()
const normalizeTextInput = (value) => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeTextInput(item)).filter(Boolean).join('\n').trim()
  }

  if (value && typeof value === 'object') {
    return normalizeTextInput(
      value.text
      ?? value.value
      ?? value.answer
      ?? value.content
      ?? value.html
      ?? value.description
      ?? '',
    )
  }

  return ''
}
const recruiterStorageKey = 'nitrosync-job-recruiters'
const jobStagesStorageKeyPrefix = 'nitrosync-job-stages:'
const wizardDraftStorageKeyPrefix = 'nitrosync-post-job-draft:'
let wizardDraftPersistTimer = null

const getJobStagesStorageKey = (jobUuid) =>
  `${jobStagesStorageKeyPrefix}${String(jobUuid || '').trim()}`

const getStoredJobStagesForm = (jobUuid) => {
  const normalizedJobUuid = String(jobUuid || '').trim()
  if (!normalizedJobUuid) return null

  try {
    const rawValue = localStorage.getItem(getJobStagesStorageKey(normalizedJobUuid))
    const parsed = rawValue ? JSON.parse(rawValue) : null
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const storeJobStagesForm = (jobUuid, value) => {
  const normalizedJobUuid = String(jobUuid || '').trim()
  if (!normalizedJobUuid) return

  try {
    localStorage.setItem(
      getJobStagesStorageKey(normalizedJobUuid),
      JSON.stringify(sanitizeJobStagesForm(value)),
    )
  } catch {
    // Ignore local storage failures and keep submit flow working.
  }
}

const getWizardDraftStorageKey = ({ mode = 'create', jobUuid = '' } = {}) => {
  const normalizedMode = String(mode || 'create').trim().toLowerCase()
  const normalizedJobUuid = String(jobUuid || '').trim()
  return normalizedMode === 'edit' && normalizedJobUuid
    ? `${wizardDraftStorageKeyPrefix}edit:${normalizedJobUuid}`
    : `${wizardDraftStorageKeyPrefix}create`
}

const getStoredWizardDraft = ({ mode = 'create', jobUuid = '' } = {}) => {
  try {
    const rawValue = localStorage.getItem(getWizardDraftStorageKey({ mode, jobUuid }))
    const parsed = rawValue ? JSON.parse(rawValue) : null
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const sanitizeJobStageRows = (rows = []) =>
  Array.isArray(rows)
    ? rows.map((item) => ({
      jobStageUuid: String(item?.jobStageUuid || '').trim(),
      label: String(item?.label || '').trim(),
      enabled: Boolean(item?.enabled),
      cards: Array.isArray(item?.cards)
        ? item.cards.map((card) => ({
          candidate_uuid: String(card?.candidate_uuid || '').trim(),
          name: String(card?.name || '').trim(),
          role: String(card?.role || '').trim(),
          email: String(card?.email || '').trim(),
        }))
        : [],
    }))
    : []

const sanitizeJobStagesForm = (value = {}) => ({
  ...value,
  stageRows: sanitizeJobStageRows(value?.stageRows),
})

const buildWizardDraftSnapshot = () => ({
  companyId,
  showWizard: showWizard.value,
  mainStep: mainStep.value,
  currentStep: currentStep.value,
  furthestMainStep: furthestMainStep.value,
  furthestPostingStep: furthestPostingStep.value,
  appFormStage: appFormStage.value,
  intelligentStage: intelligentStage.value,
  intelligentQuestionTypes: [...intelligentQuestionTypes.value],
  jobDetailsForm: { ...jobDetailsForm.value },
  additionalInfoForm: { ...additionalInfoForm.value },
  metaDataForm: {
    ...metaDataForm.value,
    seoPhoto: null,
  },
  tagsForm: {
    selectedTags: [...tagsForm.value.selectedTags],
  },
  recruiterForm: {
    selectedRecruiters: [...recruiterForm.value.selectedRecruiters],
  },
  hiringTeamForm: {
    ...hiringTeamForm.value,
    additionalUsers: Array.isArray(hiringTeamForm.value.additionalUsers) ? [...hiringTeamForm.value.additionalUsers] : [],
  },
  previewForm: JSON.parse(JSON.stringify(previewForm.value)),
  appearanceForm: {
    coverPhoto: null,
    photo: null,
  },
  intelligentScreenForm: JSON.parse(JSON.stringify(intelligentScreenForm.value)),
  jobStagesForm: sanitizeJobStagesForm(JSON.parse(JSON.stringify(jobStagesForm.value))),
  appForm: {
    ...appForm.value,
    cvFile: null,
    coverLetterFile: null,
  },
})

const storeWizardDraft = () => {
  if (!showWizard.value || isViewMode.value) return

  const mode = isEditMode.value ? 'edit' : 'create'
  const jobUuid = isEditMode.value ? (editingJobUuid.value || route.query.job_uuid || '') : ''

  try {
    localStorage.setItem(
      getWizardDraftStorageKey({ mode, jobUuid }),
      JSON.stringify(buildWizardDraftSnapshot()),
    )
  } catch {
    // Ignore local storage failures and keep wizard usable.
  }
}

const scheduleWizardDraftStore = () => {
  if (wizardDraftPersistTimer) {
    clearTimeout(wizardDraftPersistTimer)
  }

  wizardDraftPersistTimer = setTimeout(() => {
    wizardDraftPersistTimer = null
    storeWizardDraft()
  }, 150)
}

const clearStoredWizardDraft = ({ mode = 'create', jobUuid = '' } = {}) => {
  try {
    localStorage.removeItem(getWizardDraftStorageKey({ mode, jobUuid }))
  } catch {
    // Ignore local storage failures and keep wizard usable.
  }
}

const applyStoredWizardDraft = (draft) => {
  if (!draft || typeof draft !== 'object') return

  companyId = String(draft.companyId || companyId || defaultCompanyId).trim() || defaultCompanyId
  showWizard.value = draft.showWizard ?? showWizard.value
  mainStep.value = Number.isFinite(Number(draft.mainStep)) ? Number(draft.mainStep) : mainStep.value
  currentStep.value = Number.isFinite(Number(draft.currentStep)) ? Number(draft.currentStep) : currentStep.value
  furthestMainStep.value = Number.isFinite(Number(draft.furthestMainStep)) ? Number(draft.furthestMainStep) : furthestMainStep.value
  furthestPostingStep.value = Number.isFinite(Number(draft.furthestPostingStep)) ? Number(draft.furthestPostingStep) : furthestPostingStep.value
  appFormStage.value = Number.isFinite(Number(draft.appFormStage)) ? Number(draft.appFormStage) : appFormStage.value
  intelligentStage.value = Number.isFinite(Number(draft.intelligentStage)) ? Number(draft.intelligentStage) : intelligentStage.value
  intelligentQuestionTypes.value = Array.isArray(draft.intelligentQuestionTypes) ? draft.intelligentQuestionTypes : intelligentQuestionTypes.value
  jobDetailsForm.value = draft.jobDetailsForm ? { ...jobDetailsForm.value, ...draft.jobDetailsForm } : jobDetailsForm.value
  additionalInfoForm.value = draft.additionalInfoForm ? { ...additionalInfoForm.value, ...draft.additionalInfoForm } : additionalInfoForm.value
  metaDataForm.value = draft.metaDataForm ? { ...metaDataForm.value, ...draft.metaDataForm, seoPhoto: null } : metaDataForm.value
  tagsForm.value = draft.tagsForm ? { selectedTags: Array.isArray(draft.tagsForm.selectedTags) ? draft.tagsForm.selectedTags : tagsForm.value.selectedTags } : tagsForm.value
  recruiterForm.value = draft.recruiterForm ? { selectedRecruiters: Array.isArray(draft.recruiterForm.selectedRecruiters) ? draft.recruiterForm.selectedRecruiters : recruiterForm.value.selectedRecruiters } : recruiterForm.value
  hiringTeamForm.value = draft.hiringTeamForm
    ? {
        ...hiringTeamForm.value,
        ...draft.hiringTeamForm,
        additionalUsers: Array.isArray(draft.hiringTeamForm.additionalUsers) ? draft.hiringTeamForm.additionalUsers : hiringTeamForm.value.additionalUsers,
      }
    : hiringTeamForm.value
  previewForm.value = draft.previewForm ? { ...previewForm.value, ...draft.previewForm } : previewForm.value
  intelligentScreenForm.value = draft.intelligentScreenForm ? draft.intelligentScreenForm : intelligentScreenForm.value
  jobStagesForm.value = draft.jobStagesForm ? sanitizeJobStagesForm(draft.jobStagesForm) : jobStagesForm.value
  appForm.value = draft.appForm ? { ...appForm.value, ...draft.appForm, cvFile: null, coverLetterFile: null } : appForm.value
}
const normalizeTemplateArray = (value) =>
  Array.isArray(value)
    ? value.map((item) =>
        typeof item === 'object'
          ? normalizeTemplateText(item?.name ?? item?.label ?? item?.value ?? item?.tag_name)
          : normalizeTemplateText(item),
      ).filter(Boolean)
    : []

const createTemplateDraft = (item = {}) => ({
  job_title: normalizeTemplateText(item?.job_title ?? item?.title),
  job_code: normalizeTemplateText(item?.job_code ?? item?.code),
  department: normalizeTemplateText(item?.department?.department_name ?? item?.department_name ?? item?.department),
  country: normalizeTemplateText(item?.country?.name ?? item?.country_name ?? item?.country),
  city: normalizeTemplateText(item?.city?.name ?? item?.city_name ?? item?.city),
  description: normalizeTextInput(item?.description),
  degree_level: normalizeTemplateText(item?.degree_level),
  career_level: normalizeTemplateText(item?.career_level),
  industry: normalizeTemplateText(item?.industry?.industry_name ?? item?.industry_name ?? item?.industry),
  contract_type: normalizeTemplateText(
    item?.contract_type?.contract_type_name ?? item?.contract_type_name ?? item?.contract_type,
  ),
  currency: normalizeTemplateText(item?.currency?.currency_name ?? item?.currency_name ?? item?.currency),
  start_from: normalizeTemplateText(item?.start_from),
  end_to: normalizeTemplateText(item?.end_to),
  tags: normalizeTemplateArray(item?.tags),
  recruiter: normalizeTemplateText(item?.recruiter_name ?? item?.recruiter),
  team: normalizeTemplateText(item?.team_name ?? item?.team ?? item?.department_name ?? item?.department),
  job_title_seo: normalizeTemplateText(item?.job_title_seo ?? item?.seo_title),
  job_description_seo: normalizeTextInput(item?.job_description_seo ?? item?.seo_description),
})

const normalizeRecruiterUuid = (employee = {}) =>
  normalizeTemplateText(
    employee?.employee_uuid
    ?? employee?.employeeUuid
    ?? employee?.uuid
    ?? employee?.id,
  )

const normalizeRecruiterName = (employee = {}) => {
  const fullName = normalizeTemplateText(
    employee?.full_name
    ?? employee?.fullName
    ?? employee?.employee_name
    ?? employee?.employeeName
    ?? employee?.name,
  )
  const firstName = normalizeTemplateText(employee?.first_name ?? employee?.firstName)
  const lastName = normalizeTemplateText(employee?.last_name ?? employee?.lastName)

  return fullName || [firstName, lastName].filter(Boolean).join(' ').trim()
}

const resolveRecruiterRecord = (value) => {
  const normalizedValue = normalizeTemplateText(value).toLowerCase()
  if (!normalizedValue) return null

  return recruiterDirectory.value.find((employee) => {
    const recruiterUuid = normalizeRecruiterUuid(employee).toLowerCase()
    const recruiterName = normalizeRecruiterName(employee).toLowerCase()
    return recruiterUuid === normalizedValue || recruiterName === normalizedValue
  }) || null
}

const getStoredRecruitersByJob = () => {
  try {
    const rawValue = localStorage.getItem(recruiterStorageKey)
    const parsed = rawValue ? JSON.parse(rawValue) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const storeRecruiterForJob = (jobUuid, recruiterName, recruiterUuid = '') => {
  const normalizedJobUuid = normalizeTemplateText(jobUuid)
  const normalizedRecruiterName = normalizeTemplateText(recruiterName)

  if (!normalizedJobUuid || !normalizedRecruiterName) return

  const nextValue = {
    ...getStoredRecruitersByJob(),
    [normalizedJobUuid]: {
      recruiter_name: normalizedRecruiterName,
      recruiter_uuid: normalizeTemplateText(recruiterUuid),
    },
  }

  try {
    localStorage.setItem(recruiterStorageKey, JSON.stringify(nextValue))
  } catch {
    // Ignore local storage failures and keep submit flow working.
  }
}

const getSelectedTemplateDraft = () => {
  const selectedValue = String(selectedTemplate.value || '').trim()
  if (!selectedValue) return null

  const selectedOption = templates.value.find((item) => String(item.value || '').trim() === selectedValue)
  return selectedOption?.draft || null
}

const getStoredRecruiterForJob = (jobUuid) => {
  const normalizedJobUuid = normalizeTemplateText(jobUuid)
  if (!normalizedJobUuid) return null

  const storedRecruiter = getStoredRecruitersByJob()[normalizedJobUuid]
  return storedRecruiter && typeof storedRecruiter === 'object' ? storedRecruiter : null
}

const normalizeCompanyLabel = (value) => String(value ?? '').trim()
const invalidCompanyLabels = new Set(['off', 'optional', 'mandatory', 'none', 'null', 'undefined'])
const normalizeMeaningfulCompanyLabel = (value) => {
  const normalized = normalizeCompanyLabel(value)
  return normalized && !invalidCompanyLabels.has(normalized.toLowerCase()) ? normalized : ''
}

const getStoredCompanyName = () => {
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
        const companyName = normalizeMeaningfulCompanyLabel(
          parsed?.company_name
          ?? parsed?.companyName
          ?? parsed?.company?.company_name
          ?? parsed?.company?.companyName
          ?? parsed?.company?.name
          ?? parsed?.organization_name
          ?? parsed?.organizationName
          ?? parsed?.organization?.name
          ?? parsed?.employer_name
          ?? parsed?.employerName
          ?? parsed?.related_company_name,
        )

        if (companyName) {
          return companyName
        }
      } catch {
        continue
      }
    }
  }

  return ''
}

const currentCompanyName = computed(() =>
  normalizeMeaningfulCompanyLabel(
    resolvedCompanyName.value
    || getStoredCompanyName()
    || appForm.value.company
    || '',
  ),
)
const recruiterOptions = computed(() => {
  const palette = ['#ff6a9d', '#f1b32a', '#4f7dff', '#48d873', '#7028e4']
  const baseOptions = recruiterDirectory.value
    .map((employee, index) => {
      const name = normalizeRecruiterName(employee)
      if (!name) return null

      const role = normalizeTemplateText(
        employee?.role_name
        ?? employee?.role?.role_name
        ?? employee?.role
        ?? employee?.job_title
        ?? employee?.position
        ?? 'Recruiter',
      )
      const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('')

      return {
        name,
        type: role || 'Recruiter',
        color: palette[index % palette.length],
        initials: initials || name.slice(0, 2).toUpperCase(),
      }
    })
    .filter(Boolean)

  const fallbackOptions = [
    { name: 'Manal Oraby', type: 'Lead Recruiter', color: '#ff6a9d', initials: 'MO' },
    { name: 'Tareq Ahmad', type: 'Technical Recruiter', color: '#f1b32a', initials: 'TA' },
    { name: 'Lina Saleh', type: 'Operations Recruiter', color: '#4f7dff', initials: 'LS' },
    { name: 'Omar Khaled', type: 'HR Recruiter', color: '#48d873', initials: 'OK' },
    { name: 'Dana Samir', type: 'Campus Recruiter', color: '#7028e4', initials: 'DS' },
  ]

  const merged = [...baseOptions]
  const existingNames = new Set(baseOptions.map((item) => item.name.toLowerCase()))

  fallbackOptions.forEach((item) => {
    if (!existingNames.has(item.name.toLowerCase())) {
      merged.push(item)
      existingNames.add(item.name.toLowerCase())
    }
  })

  recruiterForm.value.selectedRecruiters.forEach((name, index) => {
    const normalizedName = String(name || '').trim()
    if (!normalizedName || existingNames.has(normalizedName.toLowerCase())) return

    merged.push({
      name: normalizedName,
      type: 'Selected Recruiter',
      color: palette[index % palette.length],
      initials: normalizedName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || normalizedName.slice(0, 2).toUpperCase(),
    })
  })

  return merged
})

const pageModeLabel = computed(() => {
  if (isViewMode.value) return 'View Job'
  if (isEditMode.value) return 'Edit Job'
  return 'Post a Job'
})

const pageSubtitle = computed(() => {
  if (isViewMode.value) return 'Review the saved job details and workflow configuration.'
  if (isEditMode.value) return 'Update only the sections you need. Your existing job data is already loaded.'
  return 'Enter information to complete entering this job'
})

const starterPrimaryLabel = computed(() => (isEditMode.value ? 'Continue editing' : 'Next step'))
const starterScratchLabel = computed(() => (isEditMode.value ? 'Edit without template' : 'start from scratch'))
const wizardPrimaryLabel = computed(() => (isEditMode.value ? 'Save and continue' : 'Next step'))
const wizardSecondaryLabel = computed(() => (isEditMode.value ? 'Skip section' : 'Skip'))
const completionModalContent = computed(() => {
  if (completionModal.value.variant === 'publish') {
    return {
      title: 'Job Published',
      text: 'The job was published successfully. You can return to the jobs list and manage it from there.',
      button: 'Back to Jobs',
    }
  }

  if (completionModal.value.variant === 'schedule') {
    return {
      title: 'Schedule Saved',
      text: 'The publish schedule was saved successfully. You can return to the jobs list and manage it from there.',
      button: 'Back to Jobs',
    }
  }

  if (completionModal.value.variant === 'unpublish') {
    return {
      title: 'Job Unpublished',
      text: 'The job was moved back to draft successfully. You can return to the jobs list and edit or publish it later.',
      button: 'Back to Jobs',
    }
  }

  return {
    title: 'Draft Saved',
    text: 'The job was saved successfully as a draft. You can return to the jobs list and complete it later.',
    button: 'Back to Jobs',
  }
})
const hasWizardBack = computed(() =>
  showWizard.value && (
    mainStep.value > 0
    || currentStep.value > 0
    || appFormStage.value > 0
    || intelligentStage.value > 0
  ),
)
const jobPostingHeading = computed(() => (isEditMode.value ? 'Edit: Job Posting' : 'Step 1: Job Posting'))

const applyTemplateDraft = (draft) => {
  if (!draft) return

  jobDetailsForm.value = {
    ...jobDetailsForm.value,
    jobTitle: draft.job_title || '',
    jobCode: draft.job_code || '',
    department: draft.department || '',
    country: draft.country || '',
    city: draft.city || '',
    description: normalizeTextInput(draft.description),
  }

  additionalInfoForm.value = {
    ...additionalInfoForm.value,
    degreeLevel: draft.degree_level || '',
    careerLevel: draft.career_level || '',
    industry: draft.industry || '',
    contractType: draft.contract_type || '',
    currency: draft.currency || '',
    salaryFrom: draft.start_from || '',
    salaryTo: draft.end_to || '',
  }

  tagsForm.value = {
    selectedTags: Array.isArray(draft.tags) ? draft.tags : [],
  }

  recruiterForm.value = {
    selectedRecruiters: draft.recruiter ? [draft.recruiter] : [],
  }

  hiringTeamForm.value = {
    team: draft.team || draft.department || '',
    recruiter: draft.recruiter || '',
    additionalUsers: draft.recruiter ? [draft.recruiter] : [],
  }

  metaDataForm.value = {
    seoTitle: draft.job_title_seo || draft.job_title || '',
    seoDescription: normalizeTextInput(draft.job_description_seo || draft.description),
    seoPhoto: null,
  }
}

const loadCurrentCompanyName = async () => {
  const storedCompanyName = normalizeMeaningfulCompanyLabel(getStoredCompanyName())

  if (storedCompanyName) {
    resolvedCompanyName.value = storedCompanyName
    return
  }

  if (!String(companyId || '').trim()) {
    resolvedCompanyName.value = ''
    return
  }

  try {
    const response = await fetchNitroSyncCompany(companyId)
    resolvedCompanyName.value = normalizeMeaningfulCompanyLabel(response?.companyName)
  } catch (error) {
    console.error('Failed to load company name', {
      relatedCompany: companyId,
      error,
    })
    resolvedCompanyName.value = ''
  }
}

const loadRecruiterDirectory = async () => {
  if (!String(companyId || '').trim()) {
    recruiterDirectory.value = []
    return
  }

  try {
    const response = await getNitroSyncEmployees(companyId)
    recruiterDirectory.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    console.error('Failed to load recruiter directory', {
      relatedCompany: companyId,
      error,
    })
    recruiterDirectory.value = []
  }
}

const fetchTemplates = async () => {
  templatesLoading.value = true

  try {
    const response = await axios.post(
      getJobTemplatesEndpoint,
      {
        related_company: companyId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: nitroSyncRequestTimeoutMs,
      },
    )

    const rows = Array.isArray(response?.data?.data)
      ? response.data.data
      : Array.isArray(response?.data?.templates)
        ? response.data.templates
        : []

    const mappedTemplates = rows
      .map((item, index) => {
        const label = String(
          item?.template_name
          ?? item?.name
          ?? item?.title
          ?? item?.job_title
          ?? '',
        ).trim()
        const value = String(
          item?.template_uuid
          ?? item?.uuid
          ?? item?.id
          ?? label
          ?? `template-${index}`,
        ).trim()

        if (!label || !value) return null

        return {
          label,
          value,
          draft: createTemplateDraft(item),
        }
      })
      .filter(Boolean)

    templates.value = mappedTemplates.length ? mappedTemplates : [...fallbackTemplateDrafts]
  } catch (error) {
    console.error('Failed to fetch job templates', error)
    templates.value = [...fallbackTemplateDrafts]
  } finally {
    templatesLoading.value = false
  }
}

const startWizard = () => {
  companyId = defaultCompanyId
  resolvedCompanyName.value = ''
  isEditMode.value = false
  isViewMode.value = false
  editingJobUuid.value = ''
  currentJobMeta.value = {
    status: '',
    publishAt: '',
    closeAt: '',
    expiryDate: '',
    updatedAt: '',
    createdAt: '',
  }
  applicationFormId.value = ''
  currentJobUuid.value = createUuid()
  sessionStorage.removeItem('nitrosync-edit-job')
  sessionStorage.removeItem('nitrosync-view-job')
  showWizard.value = true
  mainStep.value = 0
  currentStep.value = 0
  furthestMainStep.value = 0
  furthestPostingStep.value = 0
  appFormStage.value = 0
  intelligentStage.value = 0
  intelligentQuestionTypes.value = []
  tagsForm.value = { selectedTags: ['High Salary', 'Finance'] }
  recruiterForm.value = { selectedRecruiters: ['Manal Oraby'] }
  hiringTeamForm.value = {
    team: '',
    recruiter: '',
    additionalUsers: ['Manal Oraby'],
  }
  previewForm.value = {
    publishAction: '',
    schedule: {
      publishDate: '',
      publishTime: '',
      closePublishDate: '',
      closePublishTime: '',
      scheduleEnabled: true,
      closePublishEnabled: true,
    },
  }
  appearanceForm.value = {
    coverPhoto: null,
    photo: null,
  }
  intelligentScreenForm.value = {
    questionDrafts: {},
    criteriaList: [
      {
        id: 1,
        name: '',
        selectedConditionId: '',
        lowerValue: '',
        upperValue: '',
        moveTo: '',
        scoreMenuOpen: false,
      },
    ],
  }
  jobStagesForm.value = {
    screen: 0,
    showWorkflowDesigner: false,
    openedFromStagesDots: false,
    targetedWorkflowStage: '',
    newStageName: '',
    selectedScoreCard: '',
    scoreCardDraft: {
      name: 'Graphic Designer Screening Scorecard',
      jobTitle: 'Graphic Designer',
      interviewer: 'Interviewer',
      tags: 'Screening, design, culture fit',
      instructionMessage: 'Please score each candidate against the required skills, leave concise evidence-based notes, and flag any follow-up needed before moving to the next stage.',
      evaluationCriteria: 'Assess ownership, communication clarity, collaboration, and how the candidate responds to feedback during the interview process.',
      commentsObservation: 'Use this section for final interviewer notes, decision context, and clear recommendations before the candidate advances.',
    },
    stageRows: [
      { jobStageUuid: '', label: 'Screen', enabled: true },
      { jobStageUuid: '', label: 'Testing', enabled: true },
      { jobStageUuid: '', label: 'Interview', enabled: false },
      { jobStageUuid: '', label: 'Hired', enabled: false },
    ],
    questionInput: '',
    selectedQuestions: [],
    selectedCompetency: '',
    selectedCompetencies: [],
    manualCompetencyMode: false,
    manualCompetencyTitle: '',
    manualSkillMode: false,
    manualSkillTitle: '',
    automatedActionDraft: {
      automatedActionUuid: '',
      condition: '',
      primaryAction: '',
      assignedRecruiter: '',
      assignMessage: 'Send the candidate invitation automatically, assign the right owner, and add a short internal note for the next reviewer.',
      inviteAutomatically: false,
      moveCandidateTo: '',
      notifyCandidate: false,
      assignManager: true,
      },
      savedAutomatedActions: [],
    }
  metaDataForm.value = {
    seoTitle: '',
    seoDescription: '',
    seoPhoto: null,
  }
  jobDetailsErrors.value = {}
  additionalInfoErrors.value = {}
  appFormErrors.value = {}
  metaDataErrors.value = {}
  hiringTeamErrors.value = {}
  validationMessage.value = ''
  submissionMessage.value = ''
  clearStoredWizardDraft({ mode: 'create' })
  applyTemplateDraft(getSelectedTemplateDraft())
  loadCurrentCompanyName()
  loadRecruiterDirectory()
}

const buildJobStagesFormFromDraft = (draft) => {
  const stageDraftRows = Array.isArray(draft.job_stages) && draft.job_stages.length
    ? draft.job_stages
    : Array.isArray(draft.jobs_stages) && draft.jobs_stages.length
      ? draft.jobs_stages
      : []

  const stageRows = stageDraftRows.length
    ? stageDraftRows.map((item, index) => ({
      jobStageUuid: String(item?.job_stage_uuid ?? item?.uuid ?? '').trim(),
      label: String(item?.stage_name ?? item?.job_stage_name ?? item?.name ?? item?.title ?? `Stage ${index + 1}`).trim(),
      enabled: true,
    }))
    : jobStagesForm.value.stageRows

  const managementByStage = {}
  const stageKeyByUuid = Object.fromEntries(
    stageRows.map((item) => [String(item.jobStageUuid || '').trim(), String(item.jobStageUuid || item.label || '').trim()]),
  )

  stageRows.forEach((item) => {
    const stageKey = String(item.jobStageUuid || item.label || '').trim()
    if (!stageKey) return

    managementByStage[stageKey] = {
      scoreCardUuids: [],
      assessmentTitles: [],
      automatedActionUuids: [],
    }
  })

  ;(Array.isArray(draft.score_cards) ? draft.score_cards : []).forEach((item) => {
    const stageKey = stageKeyByUuid[String(item?.job_stage_uuid ?? '').trim()]
    const scoreCardUuid = String(item?.score_card_uuid ?? item?.uuid ?? '').trim()
    if (!stageKey || !scoreCardUuid) return
    managementByStage[stageKey] ||= { scoreCardUuids: [], assessmentTitles: [], automatedActionUuids: [] }
    managementByStage[stageKey].scoreCardUuids = [...new Set([...managementByStage[stageKey].scoreCardUuids, scoreCardUuid])]
  })

  ;(Array.isArray(draft.automated_actions) ? draft.automated_actions : []).forEach((item) => {
    const stageKey = stageKeyByUuid[String(item?.job_stage_uuid ?? '').trim()]
    const automatedActionUuid = String(item?.automated_action_uuid ?? item?.uuid ?? '').trim()
    if (!stageKey || !automatedActionUuid) return
    managementByStage[stageKey] ||= { scoreCardUuids: [], assessmentTitles: [], automatedActionUuids: [] }
    managementByStage[stageKey].automatedActionUuids = [...new Set([...managementByStage[stageKey].automatedActionUuids, automatedActionUuid])]
  })

  ;(Array.isArray(draft.assessments) ? draft.assessments : []).forEach((item) => {
    const stageKey = stageKeyByUuid[String(item?.job_stage_uuid ?? '').trim()]
    const assessmentTitle = String(item?.title ?? item?.assessment_title ?? item?.name ?? item?.assessment_uuid ?? '').trim()
    if (!stageKey || !assessmentTitle) return
    managementByStage[stageKey] ||= { scoreCardUuids: [], assessmentTitles: [], automatedActionUuids: [] }
    managementByStage[stageKey].assessmentTitles = [...new Set([...managementByStage[stageKey].assessmentTitles, assessmentTitle])]
  })

  return {
    ...jobStagesForm.value,
    stageRows,
    stageManagementByStage: managementByStage,
    currentStageKey: stageRows[0]?.jobStageUuid || stageRows[0]?.label || '',
  }
}

const buildStageManagementFromApiRows = (stageRows = [], apiRows = []) => {
  const rowsByKey = new Map()

  apiRows.forEach((item) => {
    const raw = item?.raw && typeof item.raw === 'object' ? item.raw : item
    const stageUuid = String(raw?.job_stage_uuid ?? item?.jobStageUuid ?? '').trim()
    const stageLabel = String(raw?.stage_name ?? item?.label ?? '').trim()

    if (stageUuid) rowsByKey.set(stageUuid, raw)
    if (stageLabel) rowsByKey.set(stageLabel.toLowerCase(), raw)
  })

  const next = {}

  stageRows.forEach((stage) => {
    const stageUuid = String(stage?.jobStageUuid || '').trim()
    const stageLabel = String(stage?.label || '').trim()
    const raw = rowsByKey.get(stageUuid) || rowsByKey.get(stageLabel.toLowerCase())

    if (!raw) return

    const stageKey = stageUuid || stageLabel
    if (!stageKey) return

    next[stageKey] = {
      scoreCardUuids: Array.isArray(raw?.score_cards)
        ? raw.score_cards.map((item) => String(item?.score_card_uuid ?? item?.uuid ?? '').trim()).filter(Boolean)
        : [],
      assessmentTitles: Array.isArray(raw?.assessments)
        ? raw.assessments.map((item) => String(item?.title ?? item?.assessment_title ?? item?.name ?? item?.assessment_uuid ?? '').trim()).filter(Boolean)
        : [],
      automatedActionUuids: Array.isArray(raw?.automated_actions)
        ? raw.automated_actions.map((item) => String(item?.automated_action_uuid ?? item?.uuid ?? '').trim()).filter(Boolean)
        : [],
    }
  })

  return next
}

const fetchAndApplyJobStageRelations = async (jobUuid, stageRows = []) => {
  const normalizedJobUuid = String(jobUuid || '').trim()
  const normalizedCompanyId = String(companyId || '').trim()

  if (!normalizedJobUuid || !normalizedCompanyId || !Array.isArray(stageRows) || !stageRows.length) {
    return
  }

  try {
    const rows = await fetchNitroSyncJobStages(normalizedCompanyId)
    const matchingRows = rows.filter((item) =>
      Array.isArray(item?.raw?.jobs)
      && item.raw.jobs.some((job) => String(job?.job_uuid ?? '').trim() === normalizedJobUuid),
    )

    if (!matchingRows.length) return

    const apiManagementByStage = buildStageManagementFromApiRows(stageRows, matchingRows)
    if (!Object.keys(apiManagementByStage).length) return

    const currentManagementByStage = jobStagesForm.value.stageManagementByStage || {}
    const mergedManagementByStage = { ...currentManagementByStage }

    Object.entries(apiManagementByStage).forEach(([stageKey, incoming]) => {
      const existing = currentManagementByStage[stageKey]
      const hasExistingData = Boolean(
        existing
        && (
          (Array.isArray(existing.scoreCardUuids) && existing.scoreCardUuids.length)
          || (Array.isArray(existing.assessmentTitles) && existing.assessmentTitles.length)
          || (Array.isArray(existing.automatedActionUuids) && existing.automatedActionUuids.length)
        )
      )

      if (!hasExistingData) {
        mergedManagementByStage[stageKey] = incoming
      }
    })

    jobStagesForm.value = {
      ...jobStagesForm.value,
      stageRows,
      stageManagementByStage: mergedManagementByStage,
      currentStageKey: jobStagesForm.value.currentStageKey || stageRows[0]?.jobStageUuid || stageRows[0]?.label || '',
    }
  } catch (error) {
    console.error('Failed to load job stage relations for edit mode', {
      jobUuid: normalizedJobUuid,
      relatedCompany: normalizedCompanyId,
      error,
    })
  }
}

const applyJobDraft = (draft, { mode = 'edit' } = {}) => {
  const requestedStep = String(route.query.step || '').trim().toLowerCase()
  const openJobStagesStep = requestedStep === 'job-stages' || requestedStep === 'job_stages'
  const openedFromStagesDots = String(route.query.source || '').trim().toLowerCase() === 'table-stages'
  const targetedWorkflowStage = String(route.query.target_stage || '').trim()
  const allowStoredWizardUiState = mode !== 'view'
  const allowStoredJobStagesUiState = mode !== 'view'
  const initialMainStep = openJobStagesStep ? 3 : 0
  const jobUuid = String(draft.job_uuid || route.query.job_uuid || '').trim()
  companyId = String(draft.related_company || draft.company_uuid || companyId || defaultCompanyId).trim() || defaultCompanyId
  isEditMode.value = mode === 'edit'
  isViewMode.value = mode === 'view'
  editingJobUuid.value = jobUuid
  currentJobUuid.value = editingJobUuid.value || currentJobUuid.value
  showWizard.value = true
  mainStep.value = initialMainStep
  currentStep.value = 0
  furthestMainStep.value = mode === 'view' || mode === 'edit' ? wizardSteps.length - 1 : initialMainStep
  furthestPostingStep.value = postingTabs.length - 1
  appFormStage.value = 0
  intelligentStage.value = 0
  intelligentQuestionTypes.value = []
  validationMessage.value = ''
  submissionMessage.value = ''
  currentJobMeta.value = {
    status: String(draft.status ?? draft.job_status ?? draft.active_status ?? '').trim(),
    publishAt: String(draft.publish_at ?? draft.published_at ?? '').trim(),
    closeAt: String(draft.close_at ?? '').trim(),
    expiryDate: String(draft.expiry_date ?? '').trim(),
    updatedAt: String(draft.updated_at ?? '').trim(),
    createdAt: String(draft.created_at ?? '').trim(),
  }
  const storedRecruiter = getStoredRecruiterForJob(jobUuid)
  const recruiterName = String(
    draft.recruiter_name
    ?? draft.recruiter
    ?? storedRecruiter?.recruiter_name
    ?? '',
  ).trim()

  jobDetailsForm.value = {
    jobTitle: draft.job_title || '',
    jobCode: draft.job_code || '',
    department: draft.department || '',
    country: draft.country || '',
    city: draft.city || '',
    description: normalizeTextInput(draft.description),
  }

  additionalInfoForm.value = {
    degreeLevel: draft.degree_level || '',
    careerLevel: draft.career_level || '',
    industry: draft.industry || '',
    contractType: draft.contract_type || '',
    currency: draft.currency || '',
    salaryFrom: draft.start_from || '',
    salaryTo: draft.end_to || '',
  }

  tagsForm.value = {
    selectedTags: Array.isArray(draft.tags) ? draft.tags : [],
  }

  recruiterForm.value = {
    selectedRecruiters: recruiterName ? [recruiterName] : [],
  }

  hiringTeamForm.value = {
    team: draft.department || '',
    recruiter: recruiterName,
    additionalUsers: [],
  }

  metaDataForm.value = {
    seoTitle: draft.job_title_seo || '',
    seoDescription: normalizeTextInput(draft.job_description_seo),
    seoPhoto: null,
  }

  intelligentScreenForm.value = {
    ...intelligentScreenForm.value,
    criteriaList: Array.isArray(draft.intelligent_screen_move_criterias) && draft.intelligent_screen_move_criterias.length
      ? draft.intelligent_screen_move_criterias.map((item, index) => ({
        id: index + 1,
        name: String(item?.name || '').trim(),
        selectedConditionId: '',
        lowerValue: '',
        upperValue: '',
        moveTo: String(item?.action || '').trim(),
        scoreMenuOpen: false,
      }))
      : intelligentScreenForm.value.criteriaList,
  }

  if (
    (Array.isArray(draft.job_stages) && draft.job_stages.length)
    || (Array.isArray(draft.jobs_stages) && draft.jobs_stages.length)
    || (Array.isArray(draft.score_cards) && draft.score_cards.length)
    || (Array.isArray(draft.automated_actions) && draft.automated_actions.length)
    || (Array.isArray(draft.assessments) && draft.assessments.length)
  ) {
    jobStagesForm.value = buildJobStagesFormFromDraft(draft)
  }

  jobStagesForm.value = {
    ...jobStagesForm.value,
    screen: 0,
    showWorkflowDesigner: openJobStagesStep && mode !== 'view',
    openedFromStagesDots: mode !== 'view' && openedFromStagesDots,
    targetedWorkflowStage: mode !== 'view' ? targetedWorkflowStage : '',
  }

  const storedJobStagesForm = getStoredJobStagesForm(editingJobUuid.value || draft.job_uuid || route.query.job_uuid || '')
  if (storedJobStagesForm && allowStoredJobStagesUiState) {
    jobStagesForm.value = {
      ...jobStagesForm.value,
      ...sanitizeJobStagesForm(storedJobStagesForm),
      showWorkflowDesigner: openJobStagesStep,
      openedFromStagesDots,
      targetedWorkflowStage,
    }
  }

  const storedWizardDraft = getStoredWizardDraft({
    mode,
    jobUuid: editingJobUuid.value || draft.job_uuid || route.query.job_uuid || '',
  })
  if (storedWizardDraft && allowStoredWizardUiState) {
    applyStoredWizardDraft(storedWizardDraft)

    jobStagesForm.value = {
      ...jobStagesForm.value,
      showWorkflowDesigner: openJobStagesStep,
      openedFromStagesDots,
      targetedWorkflowStage,
    }
  }

  loadCurrentCompanyName()
  loadRecruiterDirectory()
  fetchAndApplyJobStageRelations(jobUuid, jobStagesForm.value.stageRows)
}

const applyApplicationFormDraft = (draft) => {
  if (!draft) return

  applicationFormId.value = String(draft.id || '').trim()
  appForm.value = {
    ...appForm.value,
    firstName: draft.first_name || appForm.value.firstName,
    lastName: draft.last_name || appForm.value.lastName,
    email: draft.email || appForm.value.email,
    gender: draft.gender || appForm.value.gender,
    country: draft.country || appForm.value.country,
    address: draft.full_address || appForm.value.address,
    jobTitle: draft.current_job_title || appForm.value.jobTitle,
    company: draft.company || appForm.value.company,
    ethnicity: draft.ethnicity || appForm.value.ethnicity,
    disability: draft.disability || appForm.value.disability,
    cvStatus: draft.upload_cv || appForm.value.cvStatus,
    coverLetterStatus: draft.upload_cover_letter || appForm.value.coverLetterStatus,
  }
}

const fetchAndApplyApplicationForm = async (jobUuid) => {
  const normalizedJobUuid = String(jobUuid || '').trim()
  if (!normalizedJobUuid) return

  try {
    const matchingForm = await fetchNitroSyncApplicationForm({
      related_company: companyId,
      job_uuid: normalizedJobUuid,
    })

    if (matchingForm) {
      applyApplicationFormDraft(matchingForm)
    }
  } catch (error) {
    console.error('Failed to fetch application forms', {
      jobUuid: normalizedJobUuid,
      error,
    })
  }
}

const storeEditWizardDraftForJob = (jobUuid) => {
  const normalizedJobUuid = String(jobUuid || '').trim()
  if (!normalizedJobUuid) return

  try {
    localStorage.setItem(
      getWizardDraftStorageKey({ mode: 'edit', jobUuid: normalizedJobUuid }),
      JSON.stringify(buildWizardDraftSnapshot()),
    )
  } catch {
    // Ignore local storage failures and keep submit flow working.
  }
}

const resetCreateEntryState = () => {
  showWizard.value = false
  mainStep.value = 0
  currentStep.value = 0
  furthestMainStep.value = 0
  furthestPostingStep.value = 0
  appFormStage.value = 0
  intelligentStage.value = 0
  validationMessage.value = ''
  submissionMessage.value = ''
  isEditMode.value = false
  isViewMode.value = false
  editingJobUuid.value = ''
  applicationFormId.value = ''
  currentJobUuid.value = ''
  selectedTemplate.value = ''
  clearStoredWizardDraft({ mode: 'create' })
}

const loadEditDraft = () => {
  if (route.query.mode !== 'edit') return

  const rawDraft = sessionStorage.getItem('nitrosync-edit-job')
  if (!rawDraft) return

  try {
    const draft = JSON.parse(rawDraft)
    applyJobDraft(draft, { mode: 'edit' })
    fetchAndApplyApplicationForm(draft.job_uuid || route.query.job_uuid || '')
  } catch (error) {
    console.error('Failed to load edit job draft', error)
  }
}

const loadViewDraft = () => {
  if (route.query.mode !== 'view') return

  const rawDraft = sessionStorage.getItem('nitrosync-view-job')
  if (!rawDraft) return

  try {
    const draft = JSON.parse(rawDraft)
    applyJobDraft(draft, { mode: 'view' })
    fetchAndApplyApplicationForm(draft.job_uuid || route.query.job_uuid || '')
  } catch (error) {
    console.error('Failed to load view job draft', error)
  }
}

const buildCurrentJobSessionDraft = () => ({
  job_uuid: editingJobUuid.value || currentJobUuid.value || route.query.job_uuid || '',
  related_company: companyId,
  job_title: jobDetailsForm.value.jobTitle,
  job_code: jobDetailsForm.value.jobCode,
  department: jobDetailsForm.value.department,
  country: jobDetailsForm.value.country,
  city: jobDetailsForm.value.city,
  description: normalizeTextInput(jobDetailsForm.value.description),
  industry: additionalInfoForm.value.industry,
  contract_type: additionalInfoForm.value.contractType,
  currency: additionalInfoForm.value.currency,
  start_from: String(additionalInfoForm.value.salaryFrom || ''),
  end_to: String(additionalInfoForm.value.salaryTo || ''),
  expiry_date: currentJobMeta.value.expiryDate,
  career_level: additionalInfoForm.value.careerLevel,
  degree_level: additionalInfoForm.value.degreeLevel,
  status: currentJobMeta.value.status,
  published_at: currentJobMeta.value.publishAt,
  publish_at: currentJobMeta.value.publishAt,
  close_at: currentJobMeta.value.closeAt,
  updated_at: currentJobMeta.value.updatedAt,
  created_at: currentJobMeta.value.createdAt,
  job_title_seo: metaDataForm.value.seoTitle,
  job_description_seo: normalizeTextInput(metaDataForm.value.seoDescription),
  tags: [...tagsForm.value.selectedTags],
  recruiter: hiringTeamForm.value.recruiter || recruiterForm.value.selectedRecruiters[0] || '',
  team: hiringTeamForm.value.team || '',
  additional_users: Array.isArray(hiringTeamForm.value.additionalUsers) ? [...hiringTeamForm.value.additionalUsers] : [],
  job_stages: Array.isArray(jobStagesForm.value.stageRows) ? [...jobStagesForm.value.stageRows] : [],
  jobs_stages: Array.isArray(jobStagesForm.value.stageRows) ? [...jobStagesForm.value.stageRows] : [],
})

const openViewedJobInEditMode = () => {
  const rawViewDraft = sessionStorage.getItem('nitrosync-view-job')
  const nextDraft = rawViewDraft ? JSON.parse(rawViewDraft) : buildCurrentJobSessionDraft()

  sessionStorage.setItem('nitrosync-edit-job', JSON.stringify(nextDraft))
  router.push({
    path: '/jobs/post',
    query: {
      mode: 'edit',
      job_uuid: nextDraft.job_uuid || editingJobUuid.value || route.query.job_uuid || '',
    },
  })
}

const unpublishViewedJob = async () => {
  const jobUuid = String(editingJobUuid.value || currentJobUuid.value || route.query.job_uuid || '').trim()
  if (!jobUuid) {
    validationMessage.value = 'This job is missing job_uuid, so it cannot be unpublished.'
    return
  }

  submittingJob.value = true
  validationMessage.value = ''
  submissionMessage.value = ''

  try {
    const requestPayload = buildUnpublishJobRequest()
    const requestBody = buildMultipartRequestBody(requestPayload)
    const response = await axios.post(editJobEndpoint, requestBody.data, {
      headers: requestBody.headers,
      timeout: nitroSyncRequestTimeoutMs,
    })
    assertNitroSyncRequestSucceeded(response, 'Failed to unpublish the job.')

    currentJobMeta.value = {
      ...currentJobMeta.value,
      status: '1',
    }
    openCompletionModal('unpublish')
  } catch (error) {
    validationMessage.value = error?.message || 'Failed to unpublish the job.'
  } finally {
    submittingJob.value = false
  }
}

if (route.query.mode !== 'edit' && route.query.mode !== 'view') {
  resetCreateEntryState()
}

loadEditDraft()
loadViewDraft()
onMounted(() => {
  fetchTemplates()
  loadCurrentCompanyName()
  loadRecruiterDirectory()
})

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
const parseSalaryValue = (value) => {
  const match = String(value || '').match(/\d+/g)
  return match ? Number(match.join('')) : NaN
}
const normalizeSalaryValue = (value) => {
  const parsed = parseSalaryValue(value)
  return Number.isNaN(parsed) ? '' : String(parsed)
}

const normalizeHiringTeamField = (value) => {
  if (value && typeof value === 'object') {
    return String(value.label ?? value.name ?? value.value ?? '').trim()
  }

  return String(value || '').trim()
}

const buildDateTime = (date, time) => {
  if (!date || !time) return null
  return new Date(`${date}T${time}`)
}

const toIsoDateTime = (date, time) => {
  const value = buildDateTime(date, time)
  if (!value) return null

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  const seconds = String(value.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const getJobDetailsErrors = () => {
  const errors = {}
  if (!jobDetailsForm.value.jobTitle.trim()) errors.jobTitle = 'Job title is required.'
  if (!jobDetailsForm.value.jobCode.trim()) errors.jobCode = 'Job code is required.'
  if (!jobDetailsForm.value.department.trim()) errors.department = 'Department is required.'
  if (!jobDetailsForm.value.country.trim()) errors.country = 'Country is required.'
  if (!jobDetailsForm.value.city.trim()) errors.city = 'City is required.'
  if (!jobDetailsForm.value.description.trim()) errors.description = 'Description is required.'
  return errors
}

const getAdditionalInfoErrors = () => {
  const errors = {}
  if (!additionalInfoForm.value.degreeLevel.trim()) errors.degreeLevel = 'Degree level is required.'
  if (!additionalInfoForm.value.careerLevel.trim()) errors.careerLevel = 'Career level is required.'
  if (!additionalInfoForm.value.industry.trim()) errors.industry = 'Industry is required.'
  if (!additionalInfoForm.value.contractType.trim()) errors.contractType = 'Contract type is required.'
  if (!additionalInfoForm.value.currency.trim()) errors.currency = 'Currency is required.'
  if (!additionalInfoForm.value.salaryFrom.trim()) errors.salaryFrom = 'Salary start is required.'
  if (!additionalInfoForm.value.salaryTo.trim()) errors.salaryTo = 'Salary end is required.'
  const start = parseSalaryValue(additionalInfoForm.value.salaryFrom)
  const end = parseSalaryValue(additionalInfoForm.value.salaryTo)
  if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
    errors.salaryFrom = 'Start salary must be less than or equal to end salary.'
    errors.salaryTo = 'End salary must be greater than or equal to start salary.'
  }
  return errors
}

const getAppFormErrors = () => {
  return {}
}

const getMetaDataErrors = () => {
  const errors = {}
  if (!metaDataForm.value.seoTitle.trim()) errors.seoTitle = 'SEO title is required.'
  if (!metaDataForm.value.seoDescription.trim()) errors.seoDescription = 'SEO description is required.'
  return errors
}

const getHiringTeamErrors = () => {
  const errors = {}
  if (!normalizeHiringTeamField(hiringTeamForm.value.team)) errors.team = 'Team is required.'
  if (!normalizeHiringTeamField(hiringTeamForm.value.recruiter)) errors.recruiter = 'Recruiter is required.'
  return errors
}

const goToNextTab = () => {
  if (currentStep.value < postingTabs.length - 1) {
    currentStep.value += 1
  }
}

const goToWizardStep = (index) => {
  if (index < 0 || index > furthestMainStep.value) return

  mainStep.value = index
}

const goToPostingTab = (index) => {
  if (mainStep.value !== 0) return
  if (index < 0 || index > furthestPostingStep.value) return

  currentStep.value = index
}

const skipToNextTab = () => {
  validationMessage.value = ''
  if (mainStep.value === 0) {
    if (currentStep.value < postingTabs.length - 1) {
      goToNextTab()
      return
    }

    mainStep.value = 1
    return
  }

  if (mainStep.value === 1) {
    if (appFormStage.value === 0) {
      appFormStage.value = 1
      return
    }

    if (mainStep.value < wizardSteps.length - 1) {
      mainStep.value += 1
    }
    return
  }

  if (mainStep.value === 2) {
    if (intelligentStage.value < maxIntelligentStage.value) {
      intelligentStage.value += 1
      return
    }

    if (mainStep.value < wizardSteps.length - 1) {
      mainStep.value += 1
    }
    return
  }

  if (mainStep.value < wizardSteps.length - 1) {
    mainStep.value += 1
  }
}

const goBackStep = () => {
  validationMessage.value = ''
  submissionMessage.value = ''

  if (mainStep.value === 0) {
    if (currentStep.value > 0) {
      currentStep.value -= 1
      return
    }

    showWizard.value = false
    return
  }

  if (mainStep.value === 1) {
    if (appFormStage.value > 0) {
      appFormStage.value -= 1
      return
    }

    mainStep.value = 0
    currentStep.value = postingTabs.length - 1
    return
  }

  if (mainStep.value === 2) {
    if (intelligentStage.value > 0) {
      intelligentStage.value -= 1
      return
    }

    mainStep.value = 1
    appFormStage.value = 1
    return
  }

  if (mainStep.value === 3) {
    mainStep.value = 2
    intelligentStage.value = maxIntelligentStage.value
    return
  }

  if (mainStep.value === 4) {
    mainStep.value = 3
    return
  }

  if (mainStep.value === 5) {
    mainStep.value = 4
  }
}

const isCurrentStepValid = computed(() => {
  if (mainStep.value === 0) return true

  switch (currentStep.value) {
    default:
      return true
  }
})

const isAppFormValid = computed(() =>
  Object.keys(getAppFormErrors()).length === 0,
)

const maxIntelligentStage = computed(() => intelligentQuestionTypes.value.length + 2)
const isHiringTeamValid = computed(() => true)
const createUuid = () =>
  globalThis.crypto?.randomUUID?.()
    ?? `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16)
      const value = char === 'x' ? random : (random & 0x3) | 0x8
      return value.toString(16)
    })

if (!currentJobUuid.value) {
  currentJobUuid.value = createUuid()
}

const createPlaceholderFile = (filename, mimeType = 'image/png') =>
  new File(['placeholder'], filename, { type: mimeType })

const buildStatusFromAction = () => {
  if (previewForm.value.publishAction === 'schedule_saved') return '1'
  if (previewForm.value.publishAction === 'save_only') return '1'
  return '2'
}

const buildWithPublishValue = () => {
  if (previewForm.value.publishAction === 'save_only') return 'no'
  if (previewForm.value.publishAction === 'save_and_publish' || previewForm.value.publishAction === 'publish') return 'yes'
  if (previewForm.value.publishAction === 'schedule_saved') return 'no'
  return isPublishedJobState.value ? 'yes' : 'no'
}

const buildExpiryDateValue = (closeAt = '') =>
  String(
    closeAt
    || previewForm.value.schedule.closePublishDate
    || currentJobMeta.value.expiryDate
    || currentJobMeta.value.closeAt,
  ).trim()

const validateExpiryDateBeforeSubmit = (requestPayload = {}) => {
  const expiryDate = String(requestPayload?.expiry_date ?? '').trim()

  if (expiryDate) {
    return true
  }

  validationMessage.value = 'Expiry date is required. Open Schedule Publish and set Publish Closing Date before saving or publishing.'
  submissionMessage.value = ''
  return false
}

const buildApplicationFormPayload = (jobUuid = currentJobUuid.value) => ({
  job_uuid: jobUuid,
  related_company: companyId,
  first_name: appForm.value.firstName,
  last_name: appForm.value.lastName,
  email: appForm.value.email,
  gender: appForm.value.gender,
  country: appForm.value.country,
  full_address: appForm.value.address,
  current_job_title: appForm.value.jobTitle,
  company: appForm.value.company,
  ethnicity: appForm.value.ethnicity,
  disability: appForm.value.disability,
  upload_cv: appForm.value.cvStatus,
  upload_cover_letter: appForm.value.coverLetterStatus,
})

const buildEmbeddedApplicationFormPayload = () => ({
  first_name: appForm.value.firstName,
  last_name: appForm.value.lastName,
  email: appForm.value.email,
  gender: appForm.value.gender,
  country: appForm.value.country,
  full_address: appForm.value.address,
  current_job_title: appForm.value.jobTitle,
  company: appForm.value.company,
  ethnicity: appForm.value.ethnicity,
  disability: appForm.value.disability,
  upload_cv: appForm.value.cvStatus,
  upload_cover_letter: appForm.value.coverLetterStatus,
})

const buildJobSubmissionPayload = ({
  jobUuid,
  withPublish,
  publishAt = '',
  closeAt = '',
  includePlaceholderImages = false,
  includeWithPublish = true,
  includeScheduleFields = false,
} = {}) => {
  const recruiterValue = normalizeHiringTeamField(
    hiringTeamForm.value.recruiter || recruiterForm.value.selectedRecruiters[0] || '',
  )
  const hiringTeamValue = normalizeHiringTeamField(hiringTeamForm.value.team)
  const recruiterRecord = resolveRecruiterRecord(recruiterValue)
  const recruiterUuid = normalizeRecruiterUuid(recruiterRecord)
  const recruiterName = normalizeRecruiterName(recruiterRecord) || recruiterValue
  const additionalHiringUsers = [
    ...new Set(
      (Array.isArray(hiringTeamForm.value.additionalUsers) ? hiringTeamForm.value.additionalUsers : [])
        .map((name) => String(name || '').trim())
        .filter(Boolean),
    ),
  ]
  const serializedAdditionalUsers = (additionalHiringUsers.length ? additionalHiringUsers : [recruiterName])
    .filter(Boolean)
    .map((name) => ({ name }))
  const stageDefinitions = buildStageDefinitions()
  const primaryStageUuid = stageDefinitions[0]?.job_stage_uuid || createUuid()
  const stageRelations = buildStageRelations(stageDefinitions)

  const payload = {
    job_title: jobDetailsForm.value.jobTitle,
    job_code: jobDetailsForm.value.jobCode,
    expiry_date: buildExpiryDateValue(closeAt),
    department: jobDetailsForm.value.department,
    country: jobDetailsForm.value.country,
    city: jobDetailsForm.value.city,
    description: normalizeTextInput(jobDetailsForm.value.description),
    related_company: companyId,
    job_uuid: jobUuid,
    degree_level: additionalInfoForm.value.degreeLevel,
    career_level: additionalInfoForm.value.careerLevel,
    industry: additionalInfoForm.value.industry,
    contract_type: additionalInfoForm.value.contractType,
    currency: additionalInfoForm.value.currency,
    start_from: normalizeSalaryValue(additionalInfoForm.value.salaryFrom),
    end_to: normalizeSalaryValue(additionalInfoForm.value.salaryTo),
    cover_photo: includePlaceholderImages
      ? appearanceForm.value.coverPhoto || createPlaceholderFile('cover-photo.png')
      : appearanceForm.value.coverPhoto,
    photo: includePlaceholderImages
      ? appearanceForm.value.photo || createPlaceholderFile('job-photo.png')
      : appearanceForm.value.photo,
    job_title_seo: metaDataForm.value.seoTitle,
    job_description_seo: normalizeTextInput(metaDataForm.value.seoDescription),
    job_photo_seo: includePlaceholderImages
      ? appearanceForm.value.photo || createPlaceholderFile('job-photo-seo.png')
      : null,
    recruiter_uuid: recruiterUuid || recruiterValue || '',
    tags: tagsForm.value.selectedTags.map((tag) => ({
      tag_name: tag,
    })),
    application_form: [
      buildEmbeddedApplicationFormPayload(),
    ],
    jobs_stages: stageDefinitions.length
      ? stageDefinitions.map((stage) => ({ job_stage_uuid: stage.job_stage_uuid }))
      : [{ job_stage_uuid: primaryStageUuid }],
    intelligent_screen_move_criterias: intelligentScreenForm.value.criteriaList
      .filter((item) => item.name || item.moveTo || item.selectedConditionId)
      .map((item) => ({
        name: item.name || 'Move criteria',
        score_range: formatScoreRange(item),
        action: item.moveTo || 'screen',
      })),
    job_hiring_team: [
      {
        team: hiringTeamValue,
        recruiter: recruiterName,
        additional_users: serializedAdditionalUsers,
      },
    ],
    automated_actions: stageRelations.automatedActions,
    score_cards: stageRelations.scoreCards,
    assessments: stageRelations.assessments.length
      ? stageRelations.assessments
      : [
        {
          assessment_uuid: `default-${primaryStageUuid}`,
          job_stage_uuid: primaryStageUuid,
        },
    ],
    intelligent_screen_job_questions: buildIntelligentScreenQuestionsPayload(),
  }

  if (includeWithPublish) {
    payload.with_publish = withPublish
  }

  if (includeScheduleFields) {
    payload.publish_at = publishAt
    payload.close_at = closeAt
  }

  return payload
}

const saveApplicationForm = async (jobUuid) => {
  const payload = buildApplicationFormPayload(jobUuid)

  if (applicationFormId.value) {
    const updatePayload = {
      id: applicationFormId.value,
      ...payload,
    }

    return updateNitroSyncApplicationForm(updatePayload)
  }

  return createNitroSyncApplicationForm(payload)
}

const formatScoreRange = (criteria) => {
  switch (criteria.selectedConditionId) {
    case 'less_than':
      return `< ${criteria.upperValue || 0}`
    case 'less_than_or_equal':
      return `<= ${criteria.upperValue || 0}`
    case 'less_than_and_greater_or_equal':
      return `${criteria.lowerValue || 0} <= score < ${criteria.upperValue || 0}`
    case 'less_than_or_equal_and_greater_than':
      return `${criteria.lowerValue || 0} < score <= ${criteria.upperValue || 0}`
    case 'greater_than_or_equal':
      return `>= ${criteria.lowerValue || 0}`
    case 'greater_than':
      return `> ${criteria.lowerValue || 0}`
    default:
      return String(criteria.upperValue || criteria.lowerValue || 0)
  }
}

const questionTypeLabelMap = {
  checkboxes: 'checkboxes',
  record_video: 'record_video',
  multiple_choice: 'multiple_choice',
  open_text: 'open_text',
  date_range: 'date_range',
  media_upload: 'media_upload',
}

const buildIntelligentScreenCommand = () => {
  const selectedQuestionTypes = intelligentQuestionTypes.value.length
    ? intelligentQuestionTypes.value.map((typeId) => questionTypeLabelMap[typeId] || typeId).join(', ')
    : 'none'

  const draftedQuestions = intelligentQuestionTypes.value.length
    ? intelligentQuestionTypes.value.map((typeId, index) => {
      const draft = intelligentScreenForm.value.questionDrafts[typeId] || {}
      const title = draft.title?.trim() || questionTypeLabelMap[typeId] || typeId
      const options = Array.isArray(draft.options) && draft.options.length
        ? ` | options: ${draft.options
          .map((option, optionIndex) => {
            const label = String(option || '').trim()
            if (!label) return ''
            const optionClassification = Array.isArray(draft.optionClassifications) ? draft.optionClassifications[optionIndex] : null
            const optionWeight = optionClassification?.label && optionClassification?.value
              ? ` [${optionClassification.label} ${optionClassification.value}]`
              : ''
            return `${label}${optionWeight}`
          })
          .filter(Boolean)
          .join(', ')}`
        : ''

      return `${index + 1}. ${title} (${questionTypeLabelMap[typeId] || typeId})${options}`
    }).join('\n')
    : 'none'

  const moveCriteria = intelligentScreenForm.value.criteriaList
    .filter((item) => item.name || item.moveTo || item.selectedConditionId)
    .map((item, index) => `${index + 1}. ${item.name || 'Move criteria'} | range: ${formatScoreRange(item)} | move to: ${item.moveTo || 'screen'}`)
    .join('\n') || 'none'

  const salaryRange = [additionalInfoForm.value.salaryFrom, additionalInfoForm.value.salaryTo]
    .filter(Boolean)
    .join(' - ') || 'not specified'

  return [
    'Generate intelligent screening guidance and automation suggestions for this job.',
    `Job title: ${jobDetailsForm.value.jobTitle || 'not specified'}`,
    `Job code: ${jobDetailsForm.value.jobCode || 'not specified'}`,
    `Department: ${jobDetailsForm.value.department || 'not specified'}`,
    `Location: ${[jobDetailsForm.value.city, jobDetailsForm.value.country].filter(Boolean).join(', ') || 'not specified'}`,
    `Job description: ${jobDetailsForm.value.description || 'not specified'}`,
    `Degree level: ${additionalInfoForm.value.degreeLevel || 'not specified'}`,
    `Career level: ${additionalInfoForm.value.careerLevel || 'not specified'}`,
    `Industry: ${additionalInfoForm.value.industry || 'not specified'}`,
    `Contract type: ${additionalInfoForm.value.contractType || 'not specified'}`,
    `Salary range: ${salaryRange}`,
    `Selected question types: ${selectedQuestionTypes}`,
    `Current screening questions:\n${draftedQuestions}`,
    `Current move criteria:\n${moveCriteria}`,
    'Focus on practical screening logic, high-signal questions, and candidate-routing recommendations.',
  ].join('\n')
}

const buildJobDescriptionAiCommand = () => [
  'Write a professional job description for this vacancy.',
  `Job title: ${jobDetailsForm.value.jobTitle || 'not specified'}`,
  `Job code: ${jobDetailsForm.value.jobCode || 'not specified'}`,
  `Department: ${jobDetailsForm.value.department || 'not specified'}`,
  `Country: ${jobDetailsForm.value.country || 'not specified'}`,
  `City: ${jobDetailsForm.value.city || 'not specified'}`,
  `Degree level: ${additionalInfoForm.value.degreeLevel || 'not specified'}`,
  `Career level: ${additionalInfoForm.value.careerLevel || 'not specified'}`,
  `Industry: ${additionalInfoForm.value.industry || 'not specified'}`,
  `Contract type: ${additionalInfoForm.value.contractType || 'not specified'}`,
  `Salary from: ${additionalInfoForm.value.salaryFrom || 'not specified'}`,
  `Salary to: ${additionalInfoForm.value.salaryTo || 'not specified'}`,
  'Return only the final job description text, ready to paste into a job posting.',
].join('\n')

const buildSeoDescriptionAiCommand = () => [
  'Write an SEO-friendly job description for this vacancy.',
  `SEO title: ${metaDataForm.value.seoTitle || jobDetailsForm.value.jobTitle || 'not specified'}`,
  `Job title: ${jobDetailsForm.value.jobTitle || 'not specified'}`,
  `Department: ${jobDetailsForm.value.department || 'not specified'}`,
  `Location: ${[jobDetailsForm.value.city, jobDetailsForm.value.country].filter(Boolean).join(', ') || 'not specified'}`,
  `Industry: ${additionalInfoForm.value.industry || 'not specified'}`,
  `Job description: ${jobDetailsForm.value.description || 'not specified'}`,
  'Return only the final SEO description text in plain text.',
].join('\n')

const buildHiringTeamAiCommand = () => [
  'Suggest the best hiring team setup for this job.',
  `Job title: ${jobDetailsForm.value.jobTitle || 'not specified'}`,
  `Job code: ${jobDetailsForm.value.jobCode || 'not specified'}`,
  `Department: ${jobDetailsForm.value.department || 'not specified'}`,
  `Location: ${[jobDetailsForm.value.city, jobDetailsForm.value.country].filter(Boolean).join(', ') || 'not specified'}`,
  `Job description: ${jobDetailsForm.value.description || 'not specified'}`,
  `Industry: ${additionalInfoForm.value.industry || 'not specified'}`,
  `Career level: ${additionalInfoForm.value.careerLevel || 'not specified'}`,
  `Current recruiter choices: ${recruiterForm.value.selectedRecruiters.join(', ') || 'none'}`,
  'Recommend the most suitable team, recruiter, and additional hiring participants.',
  'Use plain text and mention the suggested team and people by name.',
].join('\n')

const buildIntelligentScreenQuestionsPayload = () =>
  intelligentQuestionTypes.value
    .map((typeId) => {
    const draft = intelligentScreenForm.value.questionDrafts[typeId] || {}
    const questionLabel = draft.title?.trim() || questionTypeLabelMap[typeId] || typeId
    const questionType = questionTypeLabelMap[typeId] || typeId

    return {
      question: String(questionLabel || '').trim(),
      question_type: String(questionType || '').trim(),
      options_details: Array.isArray(draft.options) ? draft.options.filter(Boolean) : [],
      option_classifications: Array.isArray(draft.optionClassifications)
        ? draft.optionClassifications
          .slice(0, Array.isArray(draft.options) ? draft.options.length : 0)
          .map((item) => ({
            label: item?.label || '',
            value: item?.value || '',
            color: item?.color || '',
          }))
        : [],
      classification_label: '',
      classification_value: '',
      classification_color: '',
    }
  })
    .filter((item) => item.question && item.question_type)

const formatJobSubmissionError = (error) => {
  const rawMessage =
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.msg ||
    error?.message ||
    ''

  if (rawMessage.includes('intelligent_screen_job_questions')) {
    return 'One or more Intelligent Screen questions are incomplete. Review that step and make sure each selected question type has a valid question.'
  }

  return rawMessage || 'Failed to create the job. Check the API payload and try again.'
}

const getNitroSyncResponseMessage = (payload, fallbackMessage = '') =>
  String(
    payload?.message
    ?? payload?.detail
    ?? payload?.msg
    ?? payload?.error
    ?? fallbackMessage,
  ).trim()

const assertNitroSyncRequestSucceeded = (response, fallbackMessage) => {
  const payload = response?.data ?? {}
  const responseCode = String(payload?.code ?? '').trim()
  const responseStatus = payload?.status
  const responseSuccess = payload?.success
  const responseError = payload?.error
  const responseErrors = payload?.errors
  const responseMessage = getNitroSyncResponseMessage(payload, fallbackMessage)

  const hasStructuredErrors =
    Array.isArray(responseErrors)
      ? responseErrors.length > 0
      : responseErrors && typeof responseErrors === 'object'
        ? Object.keys(responseErrors).length > 0
        : Boolean(responseErrors)

  const isFailure =
    responseCode === '0'
    || responseStatus === false
    || String(responseStatus ?? '').trim().toLowerCase() === 'false'
    || responseSuccess === false
    || String(responseSuccess ?? '').trim().toLowerCase() === 'false'
    || Boolean(responseError)
    || hasStructuredErrors

  if (isFailure) {
    throw new Error(responseMessage || fallbackMessage)
  }

  return {
    payload,
    message: responseMessage || fallbackMessage,
  }
}

const buildStageDefinitions = () =>
  jobStagesForm.value.stageRows
    .filter((item) => item.enabled)
    .map((item) => ({
      label: item.label,
      job_stage_uuid: item.jobStageUuid || createUuid(),
    }))

const getStageManagementKeys = (stage = {}) => {
  const keys = [
    String(stage?.jobStageUuid || stage?.job_stage_uuid || '').trim(),
    String(stage?.label || stage?.stage_name || '').trim(),
  ].filter(Boolean)

  return [...new Set(keys)]
}

const resolveStageManagement = (stageManagementByStage = {}, stage = {}) => {
  const keys = getStageManagementKeys(stage)
  for (const key of keys) {
    if (stageManagementByStage[key] && typeof stageManagementByStage[key] === 'object') {
      return stageManagementByStage[key]
    }
  }
  return {}
}

const buildStageRelations = (stageDefinitions = buildStageDefinitions()) => {
  const stageUuidByKey = {}
  stageDefinitions.forEach((stage) => {
    getStageManagementKeys(stage).forEach((key) => {
      stageUuidByKey[key] = stage.job_stage_uuid
    })
  })

  const stageManagementByStage = jobStagesForm.value.stageManagementByStage || {}
  const automatedActions = []
  const scoreCards = []
  const assessments = []

  Object.entries(stageManagementByStage).forEach(([stageKey, management]) => {
    const jobStageUuid = stageUuidByKey[String(stageKey || '').trim()]
    if (!jobStageUuid || !management || typeof management !== 'object') return

    if (Array.isArray(management.automatedActionUuids)) {
      management.automatedActionUuids
        .filter(Boolean)
        .forEach((automatedActionUuid) => {
          automatedActions.push({
            automated_action_uuid: String(automatedActionUuid).trim(),
            job_stage_uuid: jobStageUuid,
          })
        })
    }

    if (Array.isArray(management.scoreCardUuids)) {
      management.scoreCardUuids
        .filter(Boolean)
        .forEach((scoreCardUuid) => {
          scoreCards.push({
            score_card_uuid: String(scoreCardUuid).trim(),
            job_stage_uuid: jobStageUuid,
          })
        })
    }

    if (Array.isArray(management.assessmentTitles)) {
      management.assessmentTitles
        .filter(Boolean)
        .forEach((assessmentTitle) => {
          assessments.push({
            assessment_uuid: String(assessmentTitle).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            job_stage_uuid: jobStageUuid,
          })
        })
    }
  })

  return {
    automatedActions,
    scoreCards,
    assessments,
  }
}

const clearJobStagesValidation = () => {
  jobStagesValidation.value = {
    message: '',
    stageErrors: {},
    details: [],
  }
}

const buildJobStagesValidation = () => {
  const activeStages = Array.isArray(jobStagesForm.value.stageRows)
    ? jobStagesForm.value.stageRows.filter((item) => item.enabled)
    : []
  const stageManagementByStage = jobStagesForm.value.stageManagementByStage || {}
  const stageErrors = {}
  const details = []
  let totalScoreCards = 0
  let totalAssessments = 0
  let totalAutomatedActions = 0

  activeStages.forEach((stage) => {
    const management = resolveStageManagement(stageManagementByStage, stage)
    const scoreCardsCount = Array.isArray(management.scoreCardUuids) ? management.scoreCardUuids.filter(Boolean).length : 0
    const assessmentsCount = Array.isArray(management.assessmentTitles) ? management.assessmentTitles.filter(Boolean).length : 0
    const automatedActionsCount = Array.isArray(management.automatedActionUuids) ? management.automatedActionUuids.filter(Boolean).length : 0

    totalScoreCards += scoreCardsCount
    totalAssessments += assessmentsCount
    totalAutomatedActions += automatedActionsCount
  })

  if (!activeStages.length) {
    return {
      isValid: false,
      message: 'Turn on at least one stage before continuing.',
      stageErrors: {},
      details: [],
    }
  }

  const missingSections = [
    !totalScoreCards ? 'Score Cards' : '',
    !totalAssessments ? 'Assessments' : '',
    !totalAutomatedActions ? 'Automated Actions' : '',
  ].filter(Boolean)

  if (missingSections.length) {
    const firstStageKey = String(activeStages[0]?.jobStageUuid || activeStages[0]?.label || '').trim()
    if (firstStageKey) {
      stageErrors[firstStageKey] = {
        scoreCards: !totalScoreCards,
        assessments: !totalAssessments,
        automatedActions: !totalAutomatedActions,
        missingSections,
      }
    }
    details.push(`Workflow: ${missingSections.join(', ')}`)

    return {
      isValid: false,
      message: `Complete the missing setup in: ${details.join(' | ')}`,
      stageErrors,
      details,
    }
  }

  return {
    isValid: true,
    message: '',
    stageErrors: {},
    details: [],
  }
}

const ensureJobStagesValid = () => {
  const validation = buildJobStagesValidation()

  jobStagesValidation.value = {
    message: validation.message,
    stageErrors: validation.stageErrors,
    details: validation.details,
  }

  return validation.isValid
}

const buildCreateJobRequest = () => {
  return buildJobSubmissionPayload({
    jobUuid: currentJobUuid.value,
    withPublish: buildWithPublishValue(),
    includePlaceholderImages: true,
    includeWithPublish: true,
  })
}

const buildEditJobRequest = () => {
  return buildJobSubmissionPayload({
    jobUuid: editingJobUuid.value || route.query.job_uuid || '',
    withPublish: buildWithPublishValue(),
    includePlaceholderImages: false,
    includeWithPublish: true,
  })
}

const buildUnpublishJobRequest = () =>
  buildJobSubmissionPayload({
    jobUuid: editingJobUuid.value || currentJobUuid.value || route.query.job_uuid || '',
    withPublish: 'no',
    includePlaceholderImages: false,
    includeWithPublish: true,
  })

const buildSchedulePublishRequest = () => {
  const publishAt = toIsoDateTime(
    previewForm.value.schedule.publishDate,
    previewForm.value.schedule.publishTime,
  )
  const closeAt = toIsoDateTime(
    previewForm.value.schedule.closePublishDate,
    previewForm.value.schedule.closePublishTime,
  )

  return buildJobSubmissionPayload({
    jobUuid: editingJobUuid.value || currentJobUuid.value || route.query.job_uuid || '',
    withPublish: 'no',
    publishAt,
    closeAt,
    includePlaceholderImages: !isEditMode.value,
    includeWithPublish: false,
    includeScheduleFields: true,
  })
}

const fileFieldKeys = new Set(['cover_photo', 'photo', 'job_photo_seo'])

const appendMultipartValue = (formData, key, value) => {
  if (value == null) {
    formData.append(key, '')
    return
  }

  if (value instanceof File || value instanceof Blob) {
    formData.append(key, value)
    return
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      if (key.endsWith('[additional_users]')) {
        // Preserve the field as an array for backends that validate multipart keys by shape.
        formData.append(`${key}[]`, '')
      }
      return
    }

    value.forEach((item, index) => {
      appendMultipartValue(formData, `${key}[${index}]`, item)
    })
    return
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      appendMultipartValue(formData, `${key}[${nestedKey}]`, nestedValue)
    })
    return
  }

  formData.append(key, String(value))
}

const buildCreateJobRequestBody = () => {
  const payload = buildCreateJobRequest()
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (fileFieldKeys.has(key)) {
      if (value instanceof File) {
        formData.append(key, value)
      }
      return
    }

    appendMultipartValue(formData, key, value)
  })

  return {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
}

const buildMultipartRequestBody = (payload) => {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (fileFieldKeys.has(key) && value instanceof File) {
      formData.append(key, value)
      return
    }

    if (fileFieldKeys.has(key)) {
      return
    }

    appendMultipartValue(formData, key, value)
  })

  return {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
}

const jobPayload = computed(() => buildCreateJobRequest())
const jobDescriptionAiCommand = computed(() => buildJobDescriptionAiCommand())
const seoDescriptionAiCommand = computed(() => buildSeoDescriptionAiCommand())
const hiringTeamAiCommand = computed(() => buildHiringTeamAiCommand())
const intelligentScreenAiCommand = computed(() => buildIntelligentScreenCommand())

watch(mainStep, (value) => {
  if (value > furthestMainStep.value) {
    furthestMainStep.value = value
  }
})

watch(currentStep, (value) => {
  if (value > furthestPostingStep.value) {
    furthestPostingStep.value = value
  }
})

watch(
  () => intelligentQuestionTypes.value.length,
  () => {
    if (intelligentStage.value > maxIntelligentStage.value) {
      intelligentStage.value = maxIntelligentStage.value
    }
  },
)

watch(jobStagesForm, (value) => {
  const jobUuid = editingJobUuid.value || currentJobUuid.value || route.query.job_uuid || ''
  storeJobStagesForm(jobUuid, value)
}, { deep: true })

watch(
  () => [
    jobStagesForm.value.stageRows,
    jobStagesForm.value.stageManagementByStage,
  ],
  () => {
    if (!jobStagesValidation.value.message && !Object.keys(jobStagesValidation.value.stageErrors || {}).length) return

    const validation = buildJobStagesValidation()
    if (validation.isValid) {
      clearJobStagesValidation()
      if (mainStep.value === 3) {
        validationMessage.value = ''
      }
      return
    }

    jobStagesValidation.value = {
      message: validation.message,
      stageErrors: validation.stageErrors,
      details: validation.details,
    }

    if (mainStep.value === 3) {
      validationMessage.value = validation.message
    }
  },
  { deep: true },
)

watch(
  [
    showWizard,
    mainStep,
    currentStep,
    furthestMainStep,
    furthestPostingStep,
    appFormStage,
    intelligentStage,
    intelligentQuestionTypes,
    jobDetailsForm,
    additionalInfoForm,
    metaDataForm,
    tagsForm,
    recruiterForm,
    hiringTeamForm,
    previewForm,
    appearanceForm,
    intelligentScreenForm,
    jobStagesForm,
    appForm,
    isEditMode,
    editingJobUuid,
    currentJobUuid,
  ],
  () => {
    scheduleWizardDraftStore()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (wizardDraftPersistTimer) {
    clearTimeout(wizardDraftPersistTimer)
    wizardDraftPersistTimer = null
  }
})

const submitCurrentStep = () => {
  if (isViewMode.value) {
    validationMessage.value = ''
    submissionMessage.value = ''

    if (mainStep.value < wizardSteps.length - 1) {
      mainStep.value += 1
    }

    return
  }

  if (mainStep.value === 1) {
    if (appFormStage.value === 0 && !isAppFormValid.value) {
      appFormErrors.value = getAppFormErrors()
      validationMessage.value = 'Please complete all required fields before continuing.'
      return
    }

    appFormErrors.value = {}
    validationMessage.value = ''

    if (appFormStage.value === 0) {
      appFormStage.value = 1
      return
    }

    if (mainStep.value < wizardSteps.length - 1) {
      mainStep.value += 1
    }
    return
  }

  if (mainStep.value === 2) {
    validationMessage.value = ''

    if (intelligentStage.value < maxIntelligentStage.value) {
      intelligentStage.value += 1
      return
    }

    if (mainStep.value < wizardSteps.length - 1) {
      mainStep.value += 1
    }
    return
  }

  if (!isCurrentStepValid.value) {
    return
  }

  validationMessage.value = ''
  jobDetailsErrors.value = {}
  additionalInfoErrors.value = {}
  metaDataErrors.value = {}

  if (mainStep.value === 0) {
    if (currentStep.value < postingTabs.length - 1) {
      goToNextTab()
      return
    }

    mainStep.value = 1
    return
  }

  if (mainStep.value < wizardSteps.length - 1) {
    hiringTeamErrors.value = {}
    mainStep.value += 1
  }
}

const completeJobStages = () => {
  if (!ensureJobStagesValid()) {
    validationMessage.value = jobStagesValidation.value.message || 'Complete the missing job stage setup before continuing.'
    submissionMessage.value = ''
    return
  }

  validationMessage.value = ''
  if (mainStep.value < wizardSteps.length - 1) {
    mainStep.value += 1
  }
}

const openCompletionModal = (variant) => {
  completionModal.value = {
    open: true,
    variant,
  }
}

const closeCompletionModal = () => {
  completionModal.value.open = false
}

const goToJobsPage = () => {
  closeCompletionModal()
  router.push('/jobs')
}

const validateScheduleBeforeSubmit = () => {
  const { scheduleEnabled, closePublishEnabled, publishDate, publishTime, closePublishDate, closePublishTime } = previewForm.value.schedule

  if (scheduleEnabled && (!publishDate || !publishTime)) {
    validationMessage.value = 'Please complete publish date and time before saving schedule.'
    submissionMessage.value = ''
    return false
  }

  if (closePublishEnabled && (!closePublishDate || !closePublishTime)) {
    validationMessage.value = 'Please complete closing date and time before saving schedule.'
    submissionMessage.value = ''
    return false
  }

  const publishAt = buildDateTime(publishDate, publishTime)
  const closeAt = buildDateTime(closePublishDate, closePublishTime)

  if (scheduleEnabled && closePublishEnabled && publishAt && closeAt && publishAt > closeAt) {
    validationMessage.value = 'Closing publish date/time must be after publish date/time.'
    submissionMessage.value = ''
    return false
  }

  return true
}

const submitJob = async (successMessage, successVariant) => {
  const requestPayload = isEditMode.value ? buildEditJobRequest() : buildCreateJobRequest()
  if (!validateExpiryDateBeforeSubmit(requestPayload)) {
    return false
  }
  const requestBody = isEditMode.value ? buildMultipartRequestBody(requestPayload) : buildCreateJobRequestBody()
  const endpoint = isEditMode.value ? editJobEndpoint : createJobEndpoint

  submittingJob.value = true
  validationMessage.value = ''
  submissionMessage.value = ''

  try {
    const response = await axios.post(endpoint, requestBody.data, {
      headers: requestBody.headers,
      timeout: nitroSyncRequestTimeoutMs,
    })
    const successfulResponse = assertNitroSyncRequestSucceeded(response, successMessage)

    if (isEditMode.value) {
      try {
        await saveApplicationForm(editingJobUuid.value || route.query.job_uuid || '')
      } catch (applicationFormError) {
        submissionMessage.value =
          successfulResponse.message

        validationMessage.value =
          applicationFormError?.response?.data?.message ||
          applicationFormError?.response?.data?.detail ||
          applicationFormError?.response?.data?.msg ||
          'The job was updated, but saving the application form failed.'

        console.error('Failed to save application form during job update', {
          mode: applicationFormId.value ? 'update' : 'create',
          payload: buildApplicationFormPayload(editingJobUuid.value || route.query.job_uuid || ''),
          error: applicationFormError,
        })

          return false
        }
      }

    submissionMessage.value =
      successfulResponse.message

      const recruiterValue = normalizeHiringTeamField(
        hiringTeamForm.value.recruiter || recruiterForm.value.selectedRecruiters[0] || '',
      )
    const recruiterRecord = resolveRecruiterRecord(recruiterValue)
    const persistedJobUuid = String(
      editingJobUuid.value
      || currentJobUuid.value
      || route.query.job_uuid
      || requestPayload.job_uuid
      || '',
    ).trim()
      storeRecruiterForJob(
        persistedJobUuid,
        normalizeRecruiterName(recruiterRecord) || recruiterValue,
        normalizeRecruiterUuid(recruiterRecord) || recruiterValue,
      )
      storeEditWizardDraftForJob(persistedJobUuid)
      openCompletionModal(successVariant)
      return true
    } catch (error) {
      validationMessage.value = formatJobSubmissionError(error)

    console.error('Failed to create job', {
      endpoint,
      payload: requestPayload,
        requestType: requestBody.data instanceof FormData ? 'multipart/form-data' : 'application/json',
        error,
      })
      return false
    } finally {
      submittingJob.value = false
    }
  }

const submitSchedulePublish = async () => {
  const requestPayload = buildSchedulePublishRequest()
  if (!validateExpiryDateBeforeSubmit(requestPayload)) {
    return false
  }
  const requestBody = buildMultipartRequestBody(requestPayload)

  submittingJob.value = true
  validationMessage.value = ''
  submissionMessage.value = ''

  try {
    const response = await axios.post(schedulePublishEndpoint, requestBody.data, {
      headers: requestBody.headers,
      timeout: nitroSyncRequestTimeoutMs,
    })
    const successfulResponse = assertNitroSyncRequestSucceeded(response, 'Job schedule saved successfully.')

    submissionMessage.value = ''
    openCompletionModal('schedule')
    return Boolean(successfulResponse.message)
  } catch (error) {
    validationMessage.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.msg ||
      'Failed to save publish schedule.'

    console.error('Failed to schedule publish', {
      endpoint: schedulePublishEndpoint,
      payload: requestPayload,
      error,
    })
    return false
  } finally {
    submittingJob.value = false
  }
}

const handlePreviewAction = async (action) => {
  if (submittingJob.value) return

  if (isViewMode.value) {
    if (action === 'edit_view') {
      openViewedJobInEditMode()
      return
    }

    if (action === 'unpublish_view') {
      await unpublishViewedJob()
    }

    return
  }

  if (action === 'unpublish_edit') {
    await unpublishViewedJob()
    return
  }

  if (action === 'save_changes') {
    await submitJob('Job updated successfully.', 'save')
    return
  }

  if ((action === 'save_only' || action === 'save_and_publish' || action === 'publish') && !ensureJobStagesValid()) {
    mainStep.value = 3
    validationMessage.value = jobStagesValidation.value.message || 'Complete the missing job stage setup before publishing.'
    submissionMessage.value = ''
    return
  }

  previewForm.value.publishAction = action

  if (action === 'schedule_saved') {
    if (!validateScheduleBeforeSubmit()) return
    await submitSchedulePublish()
    return
  }

    if (action === 'save_only') {
      await submitJob('Draft saved successfully.', 'save')
      return
    }
  
    if (action === 'save_and_publish' || action === 'publish') {
      await submitJob('Job published successfully.', 'publish')
    }
  }
</script>

<template>
  <div class="page-container page-container--post-job">
    <div class="breadcrumb-row">
      <span class="crumb-home"></span>
      <span class="breadcrumb-sep"></span>
      <RouterLink to="/jobs" class="breadcrumb-link">Jobs</RouterLink>
      <span class="breadcrumb-sep"></span>
      <span class="breadcrumb-text breadcrumb-text--active">{{ pageModeLabel }}</span>
    </div>

    <section class="post-job-page">
      <header class="post-job-page__header">
        <h1 class="post-job-page__title">{{ pageModeLabel }}</h1>
        <p class="post-job-page__subtitle">{{ pageSubtitle }}</p>
      </header>

      <section v-if="!showWizard" class="starter-card">
        <div class="starter-card__field">
          <label class="starter-card__label">Saved template</label>
          <Dropdown
            v-model="selectedTemplate"
            :options="templates"
            :placeholder="templatesLoading ? 'Loading templates...' : 'Select a template'"
          />
        </div>

        <div class="starter-card__divider">Or</div>

        <button type="button" class="starter-card__scratch" @click="startWizard">
          {{ starterScratchLabel }}
        </button>

        <div class="starter-card__actions">
          <button type="button" class="starter-card__next" @click="startWizard">{{ starterPrimaryLabel }}</button>
        </div>
      </section>

      <template v-else>
        <nav class="wizard-steps" aria-label="Job posting wizard">
          <button
            v-for="(step, index) in wizardSteps"
            :key="step.label"
            type="button"
            class="wizard-step-pill"
            :class="{
              'wizard-step-pill--active': index === mainStep,
              'wizard-step-pill--completed': index < mainStep,
              'wizard-step-pill--locked': index > furthestMainStep,
            }"
            :style="{ '--step-color': step.color }"
            :disabled="index > furthestMainStep"
            @click="goToWizardStep(index)"
          >
            <span class="wizard-step-pill__index">{{ index + 1 }}</span>
            <span>{{ step.label }}</span>
          </button>
        </nav>

        <section
          class="wizard-card"
          :class="{
            'wizard-card--app-form': mainStep === 1,
            'wizard-card--intelligent': mainStep === 2,
            'wizard-card--job-stages': mainStep === 3,
            'wizard-card--readonly': isViewMode && mainStep !== 5,
          }"
        >
          <h2 v-if="mainStep === 0" class="wizard-card__title">
            {{ jobPostingHeading }}
          </h2>

          <div
            v-if="mainStep === 0"
            class="posting-tabs"
            role="tablist"
            aria-label="Job posting tabs"
          >
            <button
              v-for="(tab, index) in postingTabs"
              :key="tab.label"
              type="button"
              class="posting-tab"
              :class="{
                'posting-tab--active': currentStep === index,
                'posting-tab--locked': index > furthestPostingStep,
              }"
              :style="{ '--tab-accent': tab.accent }"
              :disabled="index > furthestPostingStep"
              @click="goToPostingTab(index)"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="wizard-panel">
            <template v-if="mainStep === 0">
              <JobDetails
                v-if="currentStep === 0"
                :form="jobDetailsForm"
                :errors="jobDetailsErrors"
                :ai-command="jobDescriptionAiCommand"
              />
              <AdditionalInformation v-if="currentStep === 1" :form="additionalInfoForm" :errors="additionalInfoErrors" />
              <TagsStep
                v-if="currentStep === 2"
                v-model:selected-tags="tagsForm.selectedTags"
              />
              <RecruiterStep
                v-if="currentStep === 3"
                v-model:selected-recruiters="recruiterForm.selectedRecruiters"
                :recruiter-options="recruiterOptions"
              />
              <AppearanceStep
                v-if="currentStep === 4"
                :job-details="jobDetailsForm"
                :additional-info="additionalInfoForm"
                :recruiters="recruiterForm.selectedRecruiters"
                :company-name="currentCompanyName"
                :form="appearanceForm"
              />
              <MetaDataStep
                v-if="currentStep === 5"
                :form="metaDataForm"
                :errors="metaDataErrors"
                :ai-command="seoDescriptionAiCommand"
              />
            </template>

            <ApplicationFormStep
              v-else-if="mainStep === 1"
              :stage="appFormStage"
              :form="appForm"
              :errors="appFormErrors"
            />

            <IntelligentScreenStep
              v-else-if="mainStep === 2"
              :stage="intelligentStage"
              :form="intelligentScreenForm"
              :ai-command="intelligentScreenAiCommand"
              :related-company="companyId"
              :job-id="editingJobUuid || route.query.job_uuid || ''"
              v-model:selected-types="intelligentQuestionTypes"
              @request-add-question="intelligentStage = 1"
              @select-question-type="intelligentStage = $event"
            />

              <JobStagesStep
                v-else-if="mainStep === 3"
                :form="jobStagesForm"
                :validation="jobStagesValidation"
                :related-company="companyId"
                :is-view-mode="isViewMode"
                @back="goBackStep"
                @complete="completeJobStages"
              />

            <HiringTeamStep
              v-else-if="mainStep === 4"
              :form="hiringTeamForm"
              :errors="hiringTeamErrors"
              :ai-command="hiringTeamAiCommand"
            />

            <JobPreviewStep
              v-else-if="mainStep === 5"
              :job-details="jobDetailsForm"
              :additional-info="additionalInfoForm"
              :meta-data="metaDataForm"
              :selected-tags="tagsForm.selectedTags"
              :selected-recruiters="recruiterForm.selectedRecruiters"
              :hiring-team="hiringTeamForm"
              :preview-state="previewForm"
              :submitting="submittingJob"
              :is-view-mode="isViewMode"
              :is-edit-mode="isEditMode"
              :is-published-job="isPublishedJobState"
              :publish-summary="jobPublishSummary"
              @preview-action="handlePreviewAction"
            />

            <div v-else class="wizard-placeholder">
              <p class="wizard-placeholder__title">{{ wizardSteps[mainStep].label }}</p>
              <p class="wizard-placeholder__text">This step is ready for the next UI pass.</p>
            </div>
          </div>

          <p v-if="validationMessage" class="wizard-validation">{{ validationMessage }}</p>
          <p v-if="submissionMessage" class="wizard-submission">{{ submissionMessage }}</p>

          <div v-if="isViewMode && mainStep !== 5" class="wizard-actions">
            <button v-if="hasWizardBack" type="button" class="wizard-actions__back" @click="goBackStep">Back</button>

            <div class="wizard-actions__primary">
              <button type="button" class="wizard-actions__next" @click="submitCurrentStep">Next</button>
            </div>
          </div>

          <div v-else-if="!isViewMode && mainStep !== 3 && (hasWizardBack || (mainStep !== 3 && mainStep !== 5))" class="wizard-actions">
            <button v-if="hasWizardBack" type="button" class="wizard-actions__back" @click="goBackStep">Back</button>

            <div v-if="mainStep !== 3 && mainStep !== 5" class="wizard-actions__primary">
              <button type="button" class="wizard-actions__skip" @click="skipToNextTab">{{ wizardSecondaryLabel }}</button>
              <button type="button" class="wizard-actions__next" @click="submitCurrentStep">{{ wizardPrimaryLabel }}</button>
            </div>
          </div>
        </section>
        </template>

        <div v-if="completionModal.open" class="job-completion-modal">
          <div class="job-completion-modal__backdrop" @click="closeCompletionModal"></div>

          <div class="job-completion-modal__card">
            <button type="button" class="job-completion-modal__close" aria-label="Close success modal" @click="closeCompletionModal">
              <span></span>
              <span></span>
            </button>

            <div class="job-completion-modal__icon" :class="`job-completion-modal__icon--${completionModal.variant}`" aria-hidden="true">
              <svg v-if="completionModal.variant === 'publish'" viewBox="0 0 24 24">
                <path d="M5.2 12.4 18.8 5.7 14.5 18.4 10.9 13.8 5.2 12.4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                <path d="m10.9 13.8 7.9-8.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
              <svg v-else-if="completionModal.variant === 'schedule'" viewBox="0 0 24 24">
                <rect x="4.5" y="5.5" width="15" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="1.8" />
                <path d="M8 3.8v3.4M16 3.8v3.4M4.9 9.4h14.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="m9.2 14 2 2 4-4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <path d="M7.4 5.7h7.6l3.2 3.2v9.4a1.7 1.7 0 0 1-1.7 1.7H7.4a1.7 1.7 0 0 1-1.7-1.7V7.4a1.7 1.7 0 0 1 1.7-1.7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M9 5.9v4h5.1v-4M9.2 15.1h5.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>

            <h3 class="job-completion-modal__title">{{ completionModalContent.title }}</h3>
            <p class="job-completion-modal__text">{{ completionModalContent.text }}</p>

            <div class="job-completion-modal__actions">
              <button type="button" class="job-completion-modal__button" @click="goToJobsPage">{{ completionModalContent.button }}</button>
            </div>
          </div>
        </div>
      </section>
    </div>
</template>

<style scoped>
.page-container--post-job {
  max-width: 1280px;
  --wizard-shell-max: 700px;
  --job-stages-shell-max: 1120px;
  --job-form-title: 20px;
  --job-form-subtitle: 13px;
  --job-form-label: 12px;
  --job-form-body: 13px;
  --job-form-small: 12px;
  --job-form-border: #f2bfd2;
  --job-form-border-strong: #ec9fba;
  --job-form-bg: #ffffff;
  --job-form-muted: #b5a5ae;
  --job-form-ink: #17111b;
  --job-form-radius: 9px;
  --job-form-control-height: 44px;
  --job-form-textarea-min: 122px;
}

.breadcrumb-link {
  color: inherit;
}

.breadcrumb-text--active {
  color: #2d2531;
}

.post-job-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 18px;
  padding-bottom: 52px;
}

.post-job-page__header {
  text-align: center;
  margin-bottom: 10px;
}

.post-job-page__title {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #17111b;
}

.post-job-page__subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: #cfc1c8;
}

.starter-card {
  width: 100%;
  max-width: var(--wizard-shell-max);
  min-height: 148px;
  margin-top: 22px;
  padding: 18px;
  background: #ffffff;
  border: 1px solid #ece3e7;
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(83, 57, 69, 0.025);
}

.starter-card__field {
  min-width: 0;
  max-width: 430px;
  margin: 0 auto;
}

.starter-card__label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--font-label);
  color: #17111b;
}

.starter-card__divider {
  margin: var(--space-fields) 0;
  text-align: center;
  font-size: var(--font-small);
  color: #d3c5cb;
}

.starter-card__scratch {
  display: block;
  width: 100%;
  max-width: 430px;
  height: var(--button-height);
  margin: 0 auto;
  border: 1px solid #efdde4;
  border-radius: var(--button-radius);
  color: #ea4f8d;
  background: #ffffff;
  font-size: var(--font-button);
}

.starter-card__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
  padding-right: 12px;
}

.starter-card__next {
  min-width: 80px;
  height: var(--ui-button-sm-height);
  padding: 0 var(--button-padding-x);
  border-radius: var(--button-radius);
  background: #ea4f8d;
  color: #ffffff;
  font-size: var(--ui-small-font);
  font-weight: 600;
}

.wizard-steps {
  width: 100%;
  max-width: var(--wizard-shell-max);
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
  margin-bottom: 10px;
}

.wizard-step-pill {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid #d8ccd2;
  border-radius: 16px;
  background: #ffffff;
  color: #b9aab3;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
}

.wizard-step-pill--active,
.wizard-step-pill--completed {
  border-color: var(--step-color);
  background: var(--step-color);
  color: #ffffff;
}

.wizard-step-pill__index {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 10px;
  background: #ffffff;
  color: #b9aab3;
  font-weight: 700;
}

.wizard-step-pill--active .wizard-step-pill__index,
.wizard-step-pill--completed .wizard-step-pill__index {
  color: var(--step-color);
}

.wizard-step-pill--locked {
  opacity: 0.55;
  cursor: not-allowed;
}

.wizard-card {
  width: 100%;
  max-width: var(--wizard-shell-max);
  min-height: 400px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #efe4e8;
  border-radius: 18px;
  box-shadow: 0 2px 6px rgba(83, 57, 69, 0.025);
}

.wizard-card--app-form {
  max-width: 780px;
  padding: 22px;
}

.wizard-card--intelligent {
  max-width: var(--wizard-shell-max);
  padding: 20px;
}

.wizard-card--job-stages {
  max-width: var(--job-stages-shell-max);
  min-height: 400px;
  padding: 20px 22px 24px;
}

.wizard-card--readonly .wizard-panel,
.wizard-card--readonly .wizard-panel * {
  pointer-events: none !important;
}

.wizard-card__title {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 600;
  color: #17111b;
}

.posting-tabs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 18px;
}

.posting-tab {
  position: relative;
  padding: 6px 0 5px;
  border-bottom: 1px solid #f4eaee;
  color: #e6dbe0;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
}

.posting-tab::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: var(--tab-accent);
  opacity: 0.45;
}

.posting-tab--active {
  color: var(--tab-accent);
  font-weight: 600;
}

.posting-tab--active::after {
  opacity: 1;
}

.posting-tab--locked {
  opacity: 0.55;
  cursor: not-allowed;
}

.wizard-panel {
  min-height: 280px;
}

.wizard-validation {
  margin: 4px 0 0;
  color: #e15b8f;
  font-size: var(--font-small);
}

.wizard-submission {
  margin: 6px 0 0;
  color: #31a85c;
  font-size: var(--font-small);
}

.wizard-placeholder {
  min-height: 220px;
  border: 1px dashed #eddbe3;
  border-radius: 14px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #b9a6af;
}

.wizard-placeholder__title {
  margin: 0;
  font-size: var(--font-section-title);
  color: #17111b;
}

.wizard-placeholder__text {
  margin: 10px 0 0;
  font-size: var(--font-body);
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-top: 10px;
}

.wizard-actions__primary {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
}

.wizard-actions__back {
  min-width: 109px;
  height: var(--ui-button-sm-height);
  padding: 0 var(--button-padding-x);
  border: 1px solid #ecdde4;
  border-radius: var(--button-radius);
  background: #ffffff;
  color: #9f9098;
  font-size: var(--ui-small-font);
  font-weight: 600;
}

.wizard-actions__skip {
  color: #ea4f8d;
  font-size: var(--ui-small-font);
}

.wizard-actions__next {
  min-width: 109px;
  height: var(--ui-button-sm-height);
  padding: 0 var(--button-padding-x);
  border-radius: var(--button-radius);
  background: #ea4f8d;
  color: #ffffff;
  font-size: var(--ui-small-font);
  font-weight: 600;
}

.page-container--post-job :deep(h3),
.page-container--post-job :deep(.application-form__title),
.page-container--post-job :deep(.intelligent-screen__title),
.page-container--post-job :deep(.job-stages-step__title),
.page-container--post-job :deep(.hiring-team-step__title),
.page-container--post-job :deep(.job-preview-card__title),
.page-container--post-job :deep(.metadata-step__title) {
  font-size: var(--job-form-title);
  line-height: 1.2;
  color: var(--job-form-ink);
}

.page-container--post-job :deep(.application-form__hint),
.page-container--post-job :deep(.intelligent-screen__text),
.page-container--post-job :deep(.job-stages-step__text),
.page-container--post-job :deep(.hiring-team-step__text),
.page-container--post-job :deep(.job-preview-card__text),
.page-container--post-job :deep(.metadata-step__hint),
.page-container--post-job :deep(.appearance-step__hint),
.page-container--post-job :deep(.tags-step__hint),
.page-container--post-job :deep(.recruiter-step__hint) {
  font-size: var(--job-form-subtitle);
  line-height: 1.45;
  color: #c8b8c0;
}

.page-container--post-job :deep(label),
.page-container--post-job :deep(.step-form__label),
.page-container--post-job :deep(.metadata-step__label),
.page-container--post-job :deep(.job-preview-card__field label),
.page-container--post-job :deep(.move-criteria__field label),
.page-container--post-job :deep(.range-grid label),
.page-container--post-job :deep(.app-field__label) {
  font-size: var(--job-form-label);
  font-weight: 500;
  line-height: 1.3;
  color: var(--job-form-ink);
}

.page-container--post-job :deep(input:not([type='checkbox']):not([type='radio']):not([type='range'])),
.page-container--post-job :deep(textarea),
.page-container--post-job :deep(.dropdown__trigger),
.page-container--post-job :deep(.job-preview-card__value),
.page-container--post-job :deep(.job-preview-modal__input),
.page-container--post-job :deep(.criteria-select__trigger),
.page-container--post-job :deep(.upload-zone),
.page-container--post-job :deep(.recruiter-step__selected),
.page-container--post-job :deep(.tags-step__selected),
.page-container--post-job :deep(.hiring-team-step__selected),
.page-container--post-job :deep(.question-pick input),
.page-container--post-job :deep(.toggle-field),
.page-container--post-job :deep(.accordion-card__input) {
  border: 1px solid var(--job-form-border);
  border-radius: var(--job-form-radius);
  background: var(--job-form-bg);
  color: #6f626a;
  box-shadow: none;
}

.page-container--post-job :deep(input:not([type='checkbox']):not([type='radio']):not([type='range'])),
.page-container--post-job :deep(.dropdown__trigger),
.page-container--post-job :deep(.job-preview-card__value),
.page-container--post-job :deep(.job-preview-modal__input),
.page-container--post-job :deep(.criteria-select__trigger),
.page-container--post-job :deep(.toggle-field),
.page-container--post-job :deep(.accordion-card__input) {
  min-height: var(--job-form-control-height);
  height: var(--job-form-control-height);
  padding-top: 0;
  padding-bottom: 0;
  font-size: var(--job-form-body);
  line-height: calc(var(--job-form-control-height) - 2px);
  box-sizing: border-box;
}

.page-container--post-job :deep(textarea),
.page-container--post-job :deep(.step-form__textarea),
.page-container--post-job :deep(.metadata-step__textarea),
.page-container--post-job :deep(.workflow-note-form__textarea) {
  min-height: var(--job-form-textarea-min);
  padding: 12px 14px;
  font-size: var(--job-form-body);
  line-height: 1.5;
}

.page-container--post-job :deep(input::placeholder),
.page-container--post-job :deep(textarea::placeholder),
.page-container--post-job :deep(.dropdown__trigger--placeholder),
.page-container--post-job :deep(.dropdown__value),
.page-container--post-job :deep(.job-preview-card__value),
.page-container--post-job :deep(.job-preview-modal__input) {
  font-size: var(--job-form-body);
  color: var(--job-form-muted);
}

.page-container--post-job :deep(input::placeholder) {
  line-height: calc(var(--job-form-control-height) - 2px);
}

.page-container--post-job :deep(input:focus-visible),
.page-container--post-job :deep(textarea:focus-visible),
.page-container--post-job :deep(.dropdown__trigger:focus-visible),
.page-container--post-job :deep(.criteria-select__trigger:focus-visible) {
  outline: none;
  border-color: var(--job-form-border-strong);
  box-shadow: 0 0 0 3px rgba(234, 79, 141, 0.08);
}

.page-container--post-job :deep(.dropdown__menu),
.page-container--post-job :deep(.criteria-select__menu),
.page-container--post-job :deep(.job-preview-card__menu),
.page-container--post-job :deep(.job-preview-card__publish-menu) {
  border: 1px solid var(--job-form-border);
  border-radius: 10px;
  box-shadow: 0 12px 24px rgba(42, 24, 34, 0.08);
}

.page-container--post-job :deep(.question-builder__card),
.page-container--post-job :deep(.move-criteria__card),
.page-container--post-job :deep(.accordion-card),
.page-container--post-job :deep(.stage-shell),
.page-container--post-job :deep(.job-preview-card),
.page-container--post-job :deep(.hiring-team-step__selected),
.page-container--post-job :deep(.tags-step__selected),
.page-container--post-job :deep(.recruiter-step__selected) {
  border-color: var(--job-form-border);
  border-radius: 12px;
}

.page-container--post-job :deep(.dropdown__arrow),
.page-container--post-job :deep(.criteria-select__arrow),
.page-container--post-job :deep(.job-preview-card__value-arrow) {
  border-color: #cb98ad;
}

.job-completion-modal {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 24px;
}

.job-completion-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(16, 11, 16, 0.58);
  animation: job-completion-fade 180ms ease;
}

.job-completion-modal__card {
  position: relative;
  z-index: 1;
  width: min(100%, 416px);
  padding: 32px 28px 26px;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #fff8fb 100%);
  box-shadow: 0 24px 60px rgba(34, 18, 29, 0.24);
  text-align: center;
  animation: job-completion-pop 220ms ease;
}

.job-completion-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #ea4e91;
}

.job-completion-modal__close span {
  position: absolute;
  top: 11px;
  left: 6px;
  width: 12px;
  height: 1.8px;
  border-radius: 999px;
  background: #fff;
}

.job-completion-modal__close span:first-child {
  transform: rotate(45deg);
}

.job-completion-modal__close span:last-child {
  transform: rotate(-45deg);
}

.job-completion-modal__icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.job-completion-modal__icon::before {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.16);
}

.job-completion-modal__icon svg {
  position: relative;
  width: 30px;
  height: 30px;
  display: block;
}

.job-completion-modal__icon--save {
  background: linear-gradient(135deg, #f26aa5 0%, #ea4f8d 55%, #cf2f70 100%);
}

.job-completion-modal__icon--publish {
  background: linear-gradient(135deg, #7c5cff 0%, #ea4f8d 55%, #ff8b56 100%);
}

.job-completion-modal__icon--schedule {
  background: linear-gradient(135deg, #45c1ff 0%, #6c5cff 45%, #ea4f8d 100%);
}

.job-completion-modal__title {
  margin: 0 0 10px;
  color: #2e1f28;
  font-size: 26px;
  line-height: 1.15;
  font-weight: 800;
}

.job-completion-modal__text {
  margin: 0 auto;
  max-width: 308px;
  color: #8a7580;
  font-size: 14px;
  line-height: 1.6;
}

.job-completion-modal__actions {
  margin-top: 22px;
}

.job-completion-modal__button {
  min-width: 154px;
  min-height: 44px;
  padding: 0 22px;
  border-radius: 14px;
  background: #ea4f8d;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 14px 28px rgba(234, 79, 141, 0.24);
}

@keyframes job-completion-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes job-completion-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 1100px) {
  .page-container--post-job {
    --job-form-title: 24px;
    --job-form-label: 15px;
    --job-form-body: 14px;
    --job-form-subtitle: 13px;
  }

  .wizard-steps {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .wizard-step-pill {
    flex: 0 0 auto;
  }

  .wizard-card,
  .wizard-card--app-form,
  .wizard-card--intelligent,
  .wizard-card--job-stages {
    max-width: none;
    padding: 22px 20px 18px;
  }

  .posting-tabs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-container--post-job {
    --job-form-title: 20px;
    --job-form-label: 14px;
    --job-form-body: 13px;
    --job-form-subtitle: 12px;
    --job-form-control-height: 46px;
    --job-form-textarea-min: 140px;
  }

  .post-job-page__header {
    gap: 8px;
  }

  .post-job-page__title {
    font-size: 24px;
  }

  .starter-card,
  .wizard-card,
  .wizard-card--app-form,
  .wizard-card--intelligent,
  .wizard-card--job-stages {
    min-height: 0;
    padding: 18px 14px 16px;
    border-radius: 16px;
  }

  .posting-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .posting-tab {
    white-space: normal;
    line-height: 1.35;
  }

  .wizard-actions,
  .wizard-actions__primary {
    flex-wrap: wrap;
    justify-content: stretch;
    gap: 10px;
  }

  .wizard-actions__back,
  .wizard-actions__skip,
  .wizard-actions__next {
    width: 100%;
    min-width: 0;
    text-align: center;
  }

  .page-container--post-job :deep(.step-form__grid),
  .page-container--post-job :deep(.details-grid),
  .page-container--post-job :deep(.additional-grid),
  .page-container--post-job :deep(.recruiter-step__grid),
  .page-container--post-job :deep(.metadata-step__grid),
  .page-container--post-job :deep(.job-preview-card__grid--two),
  .page-container--post-job :deep(.job-preview-modal__grid),
  .page-container--post-job :deep(.application-form__grid),
  .page-container--post-job :deep(.app-stage-grid),
  .page-container--post-job :deep(.range-grid),
  .page-container--post-job :deep(.question-builder__header),
  .page-container--post-job :deep(.move-criteria__layout),
  .page-container--post-job :deep(.workflow-grid),
  .page-container--post-job :deep(.workflow-grid--two),
  .page-container--post-job :deep(.criteria-grid) {
    grid-template-columns: 1fr !important;
  }

  .page-container--post-job :deep(.question-builder__footer),
  .page-container--post-job :deep(.move-criteria__buttons),
  .page-container--post-job :deep(.job-preview-card__footer),
  .page-container--post-job :deep(.job-preview-card__header),
  .page-container--post-job :deep(.job-preview-card__actions),
  .page-container--post-job :deep(.question-builder__actions),
  .page-container--post-job :deep(.question-builder__badges) {
    flex-wrap: wrap;
  }

  .page-container--post-job :deep(.job-preview-card),
  .page-container--post-job :deep(.question-builder__card),
  .page-container--post-job :deep(.move-criteria__card),
  .page-container--post-job :deep(.stage-shell) {
    padding: 16px;
  }

  .page-container--post-job :deep(.classification-bar) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
