<script setup>
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  createNitroSyncApplicationForm,
  fetchNitroSyncApplicationForm,
  updateNitroSyncApplicationForm,
} from '../../composables/useNitroSyncApplicationForms'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from '../../composables/nitroSyncApi'
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
const applicationFormId = ref('')

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
    { jobStageUuid: '', label: 'New', enabled: true },
    { jobStageUuid: '', label: 'Screen', enabled: true },
    { jobStageUuid: '', label: 'Testing', enabled: true },
    { jobStageUuid: '', label: 'Interview', enabled: false },
    { jobStageUuid: '', label: 'Shortlisted', enabled: true },
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

const fallbackTemplates = [
  { label: 'Marketing template', value: 'marketing' },
  { label: 'Engineering template', value: 'engineering' },
  { label: 'Sales template', value: 'sales' },
]
const templates = ref([...fallbackTemplates])

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

        return { label, value }
      })
      .filter(Boolean)

    templates.value = mappedTemplates.length ? mappedTemplates : [...fallbackTemplates]
  } catch (error) {
    console.error('Failed to fetch job templates', error)
    templates.value = [...fallbackTemplates]
  } finally {
    templatesLoading.value = false
  }
}

const startWizard = () => {
  companyId = defaultCompanyId
  isEditMode.value = false
  isViewMode.value = false
  editingJobUuid.value = ''
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
      { jobStageUuid: '', label: 'New', enabled: true },
      { jobStageUuid: '', label: 'Screen', enabled: true },
      { jobStageUuid: '', label: 'Testing', enabled: true },
      { jobStageUuid: '', label: 'Interview', enabled: false },
      { jobStageUuid: '', label: 'Shortlisted', enabled: true },
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
}

const applyJobDraft = (draft, { mode = 'edit' } = {}) => {
  companyId = String(draft.related_company || draft.company_uuid || companyId || defaultCompanyId).trim() || defaultCompanyId
  isEditMode.value = mode === 'edit'
  isViewMode.value = mode === 'view'
  editingJobUuid.value = String(draft.job_uuid || route.query.job_uuid || '').trim()
  currentJobUuid.value = editingJobUuid.value || currentJobUuid.value
  showWizard.value = true
  mainStep.value = mode === 'view' ? 5 : 0
  currentStep.value = 0
  furthestMainStep.value = mode === 'view' ? 5 : 0
  furthestPostingStep.value = postingTabs.length - 1
  appFormStage.value = 0
  intelligentStage.value = 0
  intelligentQuestionTypes.value = []
  validationMessage.value = ''
  submissionMessage.value = ''

  jobDetailsForm.value = {
    jobTitle: draft.job_title || '',
    jobCode: draft.job_code || '',
    department: draft.department || '',
    country: draft.country || '',
    city: draft.city || '',
    description: draft.description || '',
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
    selectedRecruiters: draft.recruiter ? [draft.recruiter] : [],
  }

  hiringTeamForm.value = {
    team: draft.department || '',
    recruiter: draft.recruiter || '',
    additionalUsers: [],
  }

  metaDataForm.value = {
    seoTitle: draft.job_title_seo || '',
    seoDescription: draft.job_description_seo || '',
    seoPhoto: null,
  }
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

loadEditDraft()
loadViewDraft()
onMounted(() => {
  fetchTemplates()
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
const buildDateTime = (date, time) => {
  if (!date || !time) return null
  return new Date(`${date}T${time}`)
}

const toIsoDateTime = (date, time) => {
  const value = buildDateTime(date, time)
  return value ? value.toISOString() : null
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
  if (!hiringTeamForm.value.team.trim()) errors.team = 'Team is required.'
  if (!hiringTeamForm.value.recruiter.trim()) errors.recruiter = 'Recruiter is required.'
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

const isCurrentStepValid = computed(() => {
  switch (currentStep.value) {
    case 0:
      return Object.keys(getJobDetailsErrors()).length === 0
    case 1:
      return Object.keys(getAdditionalInfoErrors()).length === 0
    case 5:
      return Object.keys(getMetaDataErrors()).length === 0
    case 2:
      return tagsForm.value.selectedTags.length > 0
    case 3:
      return recruiterForm.value.selectedRecruiters.length > 0
    default:
      return true
  }
})

const isAppFormValid = computed(() =>
  Object.keys(getAppFormErrors()).length === 0,
)

const maxIntelligentStage = computed(() => intelligentQuestionTypes.value.length + 4)
const isHiringTeamValid = computed(() =>
  Object.keys(getHiringTeamErrors()).length === 0,
)
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
  if (previewForm.value.publishAction === 'schedule_saved') return 'scheduled'
  if (previewForm.value.publishAction === 'save_only') return 'draft'
  return 'published'
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
        ? ` | options: ${draft.options.filter(Boolean).join(', ')}`
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
  intelligentQuestionTypes.value.map((typeId) => {
    const draft = intelligentScreenForm.value.questionDrafts[typeId] || {}
    const questionLabel = draft.title?.trim() || questionTypeLabelMap[typeId] || typeId

    return {
      question: questionLabel,
      question_type: questionTypeLabelMap[typeId] || typeId,
      options_details: Array.isArray(draft.options) ? draft.options.filter(Boolean) : [],
    }
  })

const buildStageDefinitions = () =>
  jobStagesForm.value.stageRows
    .filter((item) => item.enabled)
    .map((item) => ({
      label: item.label,
      job_stage_uuid: item.jobStageUuid || createUuid(),
    }))

const buildCreateJobRequest = () => {
  const recruiterValue = String(
    hiringTeamForm.value.recruiter || recruiterForm.value.selectedRecruiters[0] || '',
  ).trim()
  const stageDefinitions = buildStageDefinitions()
  const primaryStageUuid = stageDefinitions[0]?.job_stage_uuid || createUuid()

  return {
    job_title: jobDetailsForm.value.jobTitle,
    job_code: jobDetailsForm.value.jobCode,
    department: jobDetailsForm.value.department,
    country: jobDetailsForm.value.country,
    city: jobDetailsForm.value.city,
    description: jobDetailsForm.value.description,
    degree_level: additionalInfoForm.value.degreeLevel,
    career_level: additionalInfoForm.value.careerLevel,
    industry: additionalInfoForm.value.industry,
    contract_type: additionalInfoForm.value.contractType,
    currency: additionalInfoForm.value.currency,
    start_from: normalizeSalaryValue(additionalInfoForm.value.salaryFrom),
    end_to: normalizeSalaryValue(additionalInfoForm.value.salaryTo),
    cover_photo: appearanceForm.value.coverPhoto || createPlaceholderFile('cover-photo.png'),
    photo: appearanceForm.value.photo || createPlaceholderFile('job-photo.png'),
    job_title_seo: metaDataForm.value.seoTitle,
    job_description_seo: metaDataForm.value.seoDescription,
    job_photo_seo: metaDataForm.value.seoPhoto || createPlaceholderFile('job-photo-seo.png'),
    related_company: companyId,
    status: buildStatusFromAction(),
    job_uuid: currentJobUuid.value,
    recruiter_uuid: recruiterValue || createUuid(),
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
        team: hiringTeamForm.value.team,
        recruiter: hiringTeamForm.value.recruiter,
        additional_users: hiringTeamForm.value.additionalUsers.map((name) => ({ name })),
      },
    ],
    automated_actions: [
      {
        automated_action_uuid: createUuid(),
        job_stage_uuid: primaryStageUuid,
      },
    ],
    score_cards: [
      {
        score_card_uuid: createUuid(),
        job_stage_uuid: primaryStageUuid,
      },
    ],
    assessments: [
      {
        assessment_uuid: createUuid(),
        job_stage_uuid: primaryStageUuid,
      },
    ],
    intelligent_screen_job_questions: buildIntelligentScreenQuestionsPayload(),
  }
}

const buildEditJobRequest = () => ({
  job_uuid: editingJobUuid.value || route.query.job_uuid || '',
  related_company: companyId,
  job_title: jobDetailsForm.value.jobTitle,
  description: jobDetailsForm.value.description,
  industry: additionalInfoForm.value.industry,
  contract_type: additionalInfoForm.value.contractType,
  currency: additionalInfoForm.value.currency,
  start_from: normalizeSalaryValue(additionalInfoForm.value.salaryFrom),
  end_to: normalizeSalaryValue(additionalInfoForm.value.salaryTo),
  career_level: additionalInfoForm.value.careerLevel,
  degree_level: additionalInfoForm.value.degreeLevel,
  job_title_seo: metaDataForm.value.seoTitle,
  job_description_seo: metaDataForm.value.seoDescription,
  tags: [...tagsForm.value.selectedTags],
  recruiter: hiringTeamForm.value.recruiter || recruiterForm.value.selectedRecruiters[0] || '',
  intelligent_screen_move_criterias: intelligentScreenForm.value.criteriaList
    .filter((item) => item.name || item.moveTo || item.selectedConditionId)
    .map((item) => ({
      name: item.name || 'Move criteria',
      score_range: formatScoreRange(item),
      action: item.moveTo || 'screen',
    })),
  intelligent_screen_job_questions: buildIntelligentScreenQuestionsPayload(),
})

const buildSchedulePublishRequest = () => ({
  related_company: companyId,
  job_uuid: editingJobUuid.value || currentJobUuid.value || route.query.job_uuid || '',
  publish_at: toIsoDateTime(
    previewForm.value.schedule.publishDate,
    previewForm.value.schedule.publishTime,
  ),
  close_at: toIsoDateTime(
    previewForm.value.schedule.closePublishDate,
    previewForm.value.schedule.closePublishTime,
  ),
})

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
      formData.append(`${key}[]`, '')
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
    if (fileFieldKeys.has(key) && value instanceof File) {
      formData.append(key, value)
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

const submitCurrentStep = () => {
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
    if (intelligentStage.value === 1 && !intelligentQuestionTypes.value.length) {
      validationMessage.value = 'Please select at least one question type before continuing.'
      return
    }

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
    if (currentStep.value === 0) jobDetailsErrors.value = getJobDetailsErrors()
    if (currentStep.value === 1) additionalInfoErrors.value = getAdditionalInfoErrors()
    if (currentStep.value === 5) metaDataErrors.value = getMetaDataErrors()
    validationMessage.value =
      currentStep.value === 2
        ? 'Please select at least one tag before continuing.'
        : currentStep.value === 3
          ? 'Please select at least one recruiter before continuing.'
          : 'Please complete all required fields before continuing.'
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
    if (mainStep.value === 4 && !isHiringTeamValid.value) {
      hiringTeamErrors.value = getHiringTeamErrors()
      validationMessage.value = 'Please select a hiring team and recruiter before continuing.'
      return
    }

    hiringTeamErrors.value = {}
    mainStep.value += 1
  }
}

const completeJobStages = () => {
  if (mainStep.value < wizardSteps.length - 1) {
    mainStep.value += 1
  }
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

const submitJob = async (successMessage) => {
  const requestPayload = isEditMode.value ? buildEditJobRequest() : buildCreateJobRequest()
  const requestBody = isEditMode.value
    ? {
        data: requestPayload,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    : buildCreateJobRequestBody()
  const endpoint = isEditMode.value ? editJobEndpoint : createJobEndpoint

  submittingJob.value = true
  validationMessage.value = ''
  submissionMessage.value = ''

  try {
    const response = await axios.post(endpoint, requestBody.data, {
      headers: requestBody.headers,
      timeout: nitroSyncRequestTimeoutMs,
    })

    if (isEditMode.value) {
      try {
        await saveApplicationForm(editingJobUuid.value || route.query.job_uuid || '')
      } catch (applicationFormError) {
        submissionMessage.value =
          response?.data?.message ||
          response?.data?.detail ||
          response?.data?.msg ||
          successMessage

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

        return
      }
    }

    submissionMessage.value =
      response?.data?.message ||
      response?.data?.detail ||
      response?.data?.msg ||
      successMessage
  } catch (error) {
    validationMessage.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.msg ||
      'Failed to create the job. Check the API payload and try again.'

    console.error('Failed to create job', {
      endpoint,
      payload: requestPayload,
      requestType: requestBody.data instanceof FormData ? 'multipart/form-data' : 'application/json',
      error,
    })
  } finally {
    submittingJob.value = false
  }
}

const submitSchedulePublish = async () => {
  const requestPayload = buildSchedulePublishRequest()

  submittingJob.value = true
  validationMessage.value = ''
  submissionMessage.value = ''

  try {
    const response = await axios.post(schedulePublishEndpoint, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: nitroSyncRequestTimeoutMs,
    })

    submissionMessage.value =
      response?.data?.message ||
      response?.data?.detail ||
      response?.data?.msg ||
      'Job schedule saved successfully.'
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
  } finally {
    submittingJob.value = false
  }
}

const handlePreviewAction = async (action) => {
  if (isViewMode.value) return
  if (submittingJob.value) return

  previewForm.value.publishAction = action

  if (action === 'schedule_saved') {
    if (!validateScheduleBeforeSubmit()) return
    await submitSchedulePublish()
    return
  }

  if (action === 'save_only') {
    await submitJob('Draft saved successfully.')
    return
  }

  if (action === 'save_and_publish' || action === 'publish') {
    await submitJob('Job published successfully.')
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
      <span class="breadcrumb-text breadcrumb-text--active">Post a Job</span>
    </div>

    <section class="post-job-page">
      <header class="post-job-page__header">
        <h1 class="post-job-page__title">POST A JOB</h1>
        <p class="post-job-page__subtitle">Enter information to complete entering this job</p>
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
          start from scratch
        </button>

        <div class="starter-card__actions">
          <button type="button" class="starter-card__next" @click="startWizard">NEXT STEP</button>
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
          }"
        >
          <h2 v-if="mainStep === 0" class="wizard-card__title">
            {{ mainStep === 0 ? 'Step 1: Job Posting' : mainStep === 1 ? 'Step 2: Application Form' : `Step ${mainStep + 1}: ${wizardSteps[mainStep].label}` }}
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
              />
              <AppearanceStep
                v-if="currentStep === 4"
                :job-details="jobDetailsForm"
                :additional-info="additionalInfoForm"
                :recruiters="recruiterForm.selectedRecruiters"
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
            />

            <JobStagesStep
              v-else-if="mainStep === 3"
              :form="jobStagesForm"
              :related-company="companyId"
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
              :submitting="submittingJob || isViewMode"
              @preview-action="handlePreviewAction"
            />

            <div v-else class="wizard-placeholder">
              <p class="wizard-placeholder__title">{{ wizardSteps[mainStep].label }}</p>
              <p class="wizard-placeholder__text">This step is ready for the next UI pass.</p>
            </div>
          </div>

          <p v-if="validationMessage" class="wizard-validation">{{ validationMessage }}</p>
          <p v-if="submissionMessage" class="wizard-submission">{{ submissionMessage }}</p>

          <div v-if="mainStep !== 3 && mainStep !== 5 && !isViewMode" class="wizard-actions">
            <button type="button" class="wizard-actions__skip" @click="skipToNextTab">Skip</button>
            <button type="button" class="wizard-actions__next" @click="submitCurrentStep">NEXT STEP</button>
          </div>
        </section>
      </template>
    </section>
  </div>
</template>

<style scoped>
.page-container--post-job {
  max-width: var(--container-max);
  --wizard-shell-max: 760px;
  --job-form-title: 22px;
  --job-form-subtitle: 14px;
  --job-form-label: 14px;
  --job-form-body: 15px;
  --job-form-small: 13px;
  --job-form-border: #f2bfd2;
  --job-form-border-strong: #ec9fba;
  --job-form-bg: #ffffff;
  --job-form-muted: #b5a5ae;
  --job-form-ink: #17111b;
  --job-form-radius: 12px;
  --job-form-control-height: 56px;
  --job-form-textarea-min: 152px;
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
  padding-top: var(--space-blocks);
  padding-bottom: 72px;
}

.post-job-page__header {
  text-align: center;
  margin-bottom: 14px;
}

.post-job-page__title {
  margin: 0;
  font-size: var(--font-page-title);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #17111b;
}

.post-job-page__subtitle {
  margin: 10px 0 0;
  font-size: var(--font-body);
  color: #cfc1c8;
}

.starter-card {
  width: 100%;
  max-width: var(--wizard-shell-max);
  min-height: 176px;
  margin-top: 32px;
  padding: var(--surface-pad);
  background: #ffffff;
  border: 1px solid #ece3e7;
  border-radius: var(--surface-radius-lg);
  box-shadow: 0 6px 14px rgba(83, 57, 69, 0.03);
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
  margin-top: var(--space-sections);
  padding-right: 34px;
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
  gap: 12px;
  flex-wrap: nowrap;
  margin-bottom: 14px;
}

.wizard-step-pill {
  min-height: var(--ui-button-sm-height);
  padding: 0 14px;
  border: 1px solid #d8ccd2;
  border-radius: 20px;
  background: #ffffff;
  color: #b9aab3;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--ui-small-font);
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
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 11px;
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
  min-height: 468px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #efe4e8;
  border-radius: var(--surface-radius-lg);
  box-shadow: 0 2px 8px rgba(83, 57, 69, 0.03);
}

.wizard-card--app-form,
.wizard-card--intelligent {
  max-width: var(--wizard-shell-max);
  padding: 24px;
}

.wizard-card--job-stages {
  max-width: var(--wizard-shell-max);
  min-height: 468px;
  padding: 24px;
}

.wizard-card__title {
  margin: 0 0 18px;
  font-size: var(--font-section-title);
  font-weight: 600;
  color: #17111b;
}

.posting-tabs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: var(--space-sections);
}

.posting-tab {
  position: relative;
  padding: 8px 0 6px;
  border-bottom: 1px solid #f4eaee;
  color: #e6dbe0;
  font-size: var(--font-small);
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
  min-height: 322px;
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
  min-height: 260px;
  border: 1px dashed #eddbe3;
  border-radius: 16px;
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
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
  margin-top: 12px;
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
  padding: 16px 18px;
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
  border-radius: 12px;
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
  border-radius: 14px;
}

.page-container--post-job :deep(.dropdown__arrow),
.page-container--post-job :deep(.criteria-select__arrow),
.page-container--post-job :deep(.job-preview-card__value-arrow) {
  border-color: #cb98ad;
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

  .wizard-actions {
    flex-wrap: wrap;
    justify-content: stretch;
    gap: 10px;
  }

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
