<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  createNitroSyncScoreCard,
  deleteNitroSyncScoreCard,
  fetchNitroSyncScoreCards,
} from '../../composables/useNitroSyncScoreCards'
import { getNitroSyncErrorMessage } from '../../composables/nitroSyncApi'
import {
  createNitroSyncAutomatedAction,
  deleteNitroSyncAutomatedAction,
  fetchNitroSyncAutomatedAction,
  fetchNitroSyncAutomatedActions,
  updateNitroSyncAutomatedAction,
} from '../../composables/useNitroSyncAutomatedActions'
import {
  createNitroSyncJobStage,
  fetchNitroSyncJobStages,
} from '../../composables/useNitroSyncJobStages'
import JobStagesWorkflowStep from './JobStagesWorkflowStep.vue'
import Dropdown from '../ui/Dropdown.vue'

const emit = defineEmits(['complete'])
const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  relatedCompany: {
    type: String,
    default: 'b00af2a4-2d77-432b-bd93-4e7ea120d154',
  },
})

const screen = ref(props.form.screen)
const newStageName = ref(props.form.newStageName)
const selectedScoreCard = ref(props.form.selectedScoreCard || '')
const scoreCardDraft = ref(props.form.scoreCardDraft || {
  name: 'Graphic Designer Screening Scorecard',
  jobTitle: 'Graphic Designer',
  interviewer: 'Interviewer',
  tags: 'Screening, design, culture fit',
  instructionMessage: 'Please score each candidate against the required skills, leave concise evidence-based notes, and flag any follow-up needed before moving to the next stage.',
  evaluationCriteria: 'Assess ownership, communication clarity, collaboration, and how the candidate responds to feedback during the interview process.',
  commentsObservation: 'Use this section for final interviewer notes, decision context, and clear recommendations before the candidate advances.',
})
const scoreCardSubmitting = ref(false)
const deletingScoreCardUuid = ref('')
const scoreCardActionMessage = ref('')
const scoreCardActionError = ref('')
const automatedActionDraft = ref(props.form.automatedActionDraft || {
  automatedActionUuid: '',
  condition: '',
  primaryAction: '',
  assignedRecruiter: '',
  assignMessage: 'Send the candidate invitation automatically, assign the right owner, and add a short internal note for the next reviewer.',
  inviteAutomatically: false,
  moveCandidateTo: '',
  notifyCandidate: false,
  assignManager: true,
})
const savedAutomatedActions = ref(props.form.savedAutomatedActions || [])
const automatedActionsLoading = ref(false)
const automatedActionSubmitting = ref(false)
const deletingAutomatedActionUuid = ref('')
const automatedActionMessage = ref('')
const automatedActionError = ref('')
const showWorkflowDesigner = ref(Boolean(props.form.showWorkflowDesigner))
const stagesLoading = ref(false)
const stageActionMessage = ref('')
const stageActionError = ref('')

const stageRows = ref(props.form.stageRows)
const stageManagementByStage = ref(props.form.stageManagementByStage || {})
const currentStageKey = ref(props.form.currentStageKey || '')
const companyId = computed(() =>
  String(props.relatedCompany || 'b00af2a4-2d77-432b-bd93-4e7ea120d154').trim() || 'b00af2a4-2d77-432b-bd93-4e7ea120d154',
)

const scoreSummaryTags = ['High level', 'Mid level', 'High level', 'Mid level']
const fallbackScorecards = [
  { uuid: 'fallback-scorecard-1', title: 'Initial phone screening', owner: 'Talent acquisition', action: 'Edit card', isFallback: true },
  { uuid: 'fallback-scorecard-2', title: 'Design interview scorecard', owner: 'Graphic designer', action: 'Edit card', isFallback: true },
  { uuid: 'fallback-scorecard-3', title: 'Culture fit review', owner: 'People operations', action: 'Edit card', isFallback: true },
  { uuid: 'fallback-scorecard-4', title: 'Manager final evaluation', owner: 'Hiring manager', action: 'Edit card', isFallback: true },
  { uuid: 'fallback-scorecard-5', title: 'Executive approval card', owner: 'Leadership team', action: 'Edit card', isFallback: true },
]
const savedScorecards = ref([...fallbackScorecards])
const scoreCardsLoading = ref(false)
const scoreCardsError = ref('')

const assessmentOptions = [
  { title: 'English communication assessment', color: '#ea4f8d' },
  { title: 'Job knowledge test', color: '#4f7dff' },
  { title: 'Problem solving challenge', color: '#6b21d8' },
  { title: 'Culture fit survey', color: '#f1b32a' },
]

const questionInput = ref(props.form.questionInput)
const questionColors = ['#ea4f8d', '#4f7dff', '#6b21d8']
const selectedQuestions = ref(props.form.selectedQuestions)
const selectedCompetency = ref(props.form.selectedCompetency)
const selectedCompetencies = ref(props.form.selectedCompetencies)
const manualCompetencyMode = ref(props.form.manualCompetencyMode)
const manualCompetencyTitle = ref(props.form.manualCompetencyTitle)
const manualSkillMode = ref(props.form.manualSkillMode)
const manualSkillTitle = ref(props.form.manualSkillTitle)

const skillTags = [
  { label: 'active 1', color: '#ea4f8d' },
  { label: 'active 2', color: '#4f7dff' },
  { label: 'active 3', color: '#6b21d8' },
  { label: 'active 4', color: '#ffb84d' },
  { label: 'active 5', color: '#41d66b' },
]
const scoreCardJobTitleOptions = ['Please select', 'Graphic Designer', 'HR Manager']
const scoreCardInterviewerOptions = ['Please select', 'Interviewer', 'Hiring manager']

const automatedAssignOptions = ['Please select', 'Recruiter', 'Hiring manager', 'Team lead']
const automatedStageOptions = ['Please select', 'Screen', 'Interview', 'Shortlisted']
const automatedPrimaryActionOptions = ['Please select', 'Send email', 'Notify manager', 'Assign interviewer']

const overlayVisible = computed(() => screen.value >= 3)
const showExpandedStage = computed(() => screen.value >= 1)
const showInlineScoreBuilder = computed(() => screen.value <= 2)
const showSavedScoreCard = computed(() => screen.value >= 10)
const visibleStageRows = computed(() => Array.isArray(stageRows.value) ? stageRows.value : [])
const primaryStage = computed(() => visibleStageRows.value[0] || null)
const activeStageRows = computed(() => visibleStageRows.value.filter((item) => item.enabled))
const scoreCardOptions = computed(() => [
  { label: 'Please select', value: '' },
  ...savedScorecards.value.map((item) => ({
    label: item.title,
    value: item.uuid,
  })),
])
const selectedScoreCardSummary = computed(() =>
  savedScorecards.value.find((item) => item.uuid === selectedScoreCard.value) || null,
)
const currentStageLabel = computed(() =>
  visibleStageRows.value.find((item) => getStageKey(item) === currentStageKey.value)?.label || '',
)
const scoreCardQuestionsValue = computed(() =>
  selectedQuestions.value.map((item) => item.label).filter(Boolean).join('\n'),
)
const scoreCardCompetenciesValue = computed(() => {
  if (manualCompetencyMode.value && manualCompetencyTitle.value.trim()) {
    return manualCompetencyTitle.value.trim()
  }

  return selectedCompetencies.value.map((item) => item.label).filter(Boolean).join(', ')
})
const scoreCardSkillsValue = computed(() =>
  manualSkillTitle.value.trim() || skillTags.map((tag) => tag.label).join(', '),
)
const normalizedScoreCardQuestions = computed(() =>
  scoreCardQuestionsValue.value.trim() || 'General interview question',
)
const normalizedScoreCardCompetencies = computed(() =>
  scoreCardCompetenciesValue.value.trim() || 'General competency review',
)
const normalizedScoreCardSkills = computed(() =>
  scoreCardSkillsValue.value.trim() || 'General role skills',
)

const createUuid = () =>
  globalThis.crypto?.randomUUID?.()
    ?? `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16)
      const value = char === 'x' ? random : (random & 0x3) | 0x8
      return value.toString(16)
    })

const createEmptyStageManagement = () => ({
  scoreCardUuids: [],
  assessmentTitles: [],
  automatedActionUuids: [],
})

const getStageKey = (item) =>
  String(item?.jobStageUuid || item?.label || '').trim()

const normalizeStageManagement = (item) => ({
  scoreCardUuids: Array.isArray(item?.scoreCardUuids) ? [...new Set(item.scoreCardUuids.filter(Boolean))] : [],
  assessmentTitles: Array.isArray(item?.assessmentTitles) ? [...new Set(item.assessmentTitles.filter(Boolean))] : [],
  automatedActionUuids: Array.isArray(item?.automatedActionUuids) ? [...new Set(item.automatedActionUuids.filter(Boolean))] : [],
})

const syncStageManagement = (rows = visibleStageRows.value) => {
  const next = {}

  rows.forEach((item) => {
    const key = getStageKey(item)
    if (!key) return
    next[key] = normalizeStageManagement(stageManagementByStage.value[key] || createEmptyStageManagement())
  })

  stageManagementByStage.value = next
  props.form.stageManagementByStage = next

  if (!next[currentStageKey.value]) {
    currentStageKey.value = activeStageRows.value[0] ? getStageKey(activeStageRows.value[0]) : ''
    props.form.currentStageKey = currentStageKey.value
  }
}

const getStageManagement = (stageOrKey) => {
  const key = typeof stageOrKey === 'string' ? stageOrKey : getStageKey(stageOrKey)
  return stageManagementByStage.value[key] || createEmptyStageManagement()
}

const updateStageManagement = (stageOrKey, updater) => {
  const key = typeof stageOrKey === 'string' ? stageOrKey : getStageKey(stageOrKey)
  if (!key) return

  const current = normalizeStageManagement(getStageManagement(key))
  const next = normalizeStageManagement(updater(current))

  stageManagementByStage.value = {
    ...stageManagementByStage.value,
    [key]: next,
  }
  props.form.stageManagementByStage = stageManagementByStage.value
}

const setCurrentStage = (stageOrKey) => {
  currentStageKey.value = typeof stageOrKey === 'string' ? stageOrKey : getStageKey(stageOrKey)
  props.form.currentStageKey = currentStageKey.value
}

const getStageScoreCards = (stage) => {
  const management = getStageManagement(stage)
  return management.scoreCardUuids
    .map((uuid) => savedScorecards.value.find((item) => item.uuid === uuid))
    .filter(Boolean)
}

const getStageAssessments = (stage) => {
  const management = getStageManagement(stage)
  return management.assessmentTitles
    .map((title) => assessmentOptions.find((item) => item.title === title))
    .filter(Boolean)
}

const getStageAutomatedActions = (stage) => {
  const management = getStageManagement(stage)
  return management.automatedActionUuids
    .map((uuid) => savedAutomatedActions.value.find((item) => item.automatedActionUuid === uuid))
    .filter(Boolean)
}

const hasStageScoreCard = (stageOrKey, uuid) =>
  getStageManagement(stageOrKey).scoreCardUuids.includes(uuid)

const hasStageAssessment = (stageOrKey, title) =>
  getStageManagement(stageOrKey).assessmentTitles.includes(title)

const hasStageAutomatedAction = (stageOrKey, uuid) =>
  getStageManagement(stageOrKey).automatedActionUuids.includes(uuid)

const toggleStageScoreCard = (stageOrKey, uuid) => {
  if (!uuid) return

  updateStageManagement(stageOrKey, (management) => ({
    ...management,
    scoreCardUuids: hasStageScoreCard(stageOrKey, uuid)
      ? management.scoreCardUuids.filter((item) => item !== uuid)
      : [...management.scoreCardUuids, uuid],
  }))
  selectedScoreCard.value = uuid
  props.form.selectedScoreCard = selectedScoreCard.value
}

const toggleStageAssessment = (stageOrKey, title) => {
  if (!title) return

  updateStageManagement(stageOrKey, (management) => ({
    ...management,
    assessmentTitles: hasStageAssessment(stageOrKey, title)
      ? management.assessmentTitles.filter((item) => item !== title)
      : [...management.assessmentTitles, title],
  }))
}

const toggleStageAutomatedAction = (stageOrKey, uuid) => {
  if (!uuid) return

  updateStageManagement(stageOrKey, (management) => ({
    ...management,
    automatedActionUuids: hasStageAutomatedAction(stageOrKey, uuid)
      ? management.automatedActionUuids.filter((item) => item !== uuid)
      : [...management.automatedActionUuids, uuid],
  }))
}

const removeScoreCardAssignments = (uuid) => {
  Object.keys(stageManagementByStage.value).forEach((key) => {
    updateStageManagement(key, (management) => ({
      ...management,
      scoreCardUuids: management.scoreCardUuids.filter((item) => item !== uuid),
    }))
  })
}

const removeAutomatedActionAssignments = (uuid) => {
  Object.keys(stageManagementByStage.value).forEach((key) => {
    updateStageManagement(key, (management) => ({
      ...management,
      automatedActionUuids: management.automatedActionUuids.filter((item) => item !== uuid),
    }))
  })
}

const openStageScoreCardManager = (stage) => {
  setCurrentStage(stage)
  resetScoreCardFeedback()
  screen.value = 3
}

const openStageScoreCardBuilder = (stage) => {
  setCurrentStage(stage)
  resetScoreCardFeedback()
  screen.value = 4
}

const openStageAssessments = (stage) => {
  setCurrentStage(stage)
  screen.value = 12
}

const openStageAutomatedActions = (stage) => {
  setCurrentStage(stage)
  resetAutomatedActionFeedback()
  screen.value = 13
}

const fetchScoreCards = async () => {
  scoreCardsLoading.value = true
  scoreCardsError.value = ''

  try {
    const mappedRows = await fetchNitroSyncScoreCards(companyId.value)
    savedScorecards.value = mappedRows.length ? mappedRows : [...fallbackScorecards]

    if (!selectedScoreCard.value && savedScorecards.value.length) {
      selectedScoreCard.value = savedScorecards.value[0].uuid
      props.form.selectedScoreCard = selectedScoreCard.value
    }
  } catch (error) {
    console.error('Failed to fetch score cards', error)
    scoreCardsError.value = getNitroSyncErrorMessage(error, 'Could not load score cards from API. Using saved options.')
    savedScorecards.value = [...fallbackScorecards]

    if (!selectedScoreCard.value && savedScorecards.value.length) {
      selectedScoreCard.value = savedScorecards.value[0].uuid
      props.form.selectedScoreCard = selectedScoreCard.value
    }
  } finally {
    scoreCardsLoading.value = false
  }
}

const openWorkflowDesigner = () => {
  showWorkflowDesigner.value = true
  props.form.showWorkflowDesigner = true
}

const closeWorkflowDesigner = () => {
  showWorkflowDesigner.value = false
  props.form.showWorkflowDesigner = false
}

onMounted(() => {
  fetchStages()
  fetchScoreCards()
  fetchAutomatedActions()
})

const fetchStages = async () => {
  stagesLoading.value = true
  stageActionError.value = ''

  try {
    const rows = await fetchNitroSyncJobStages(companyId.value)
    if (rows.length) {
      stageRows.value = rows
      props.form.stageRows = rows
      return
    }

    if (!visibleStageRows.value.length) {
      stageActionError.value = 'No job stages were returned from API.'
    }
  } catch (error) {
    console.error('Failed to fetch job stages', error)
    if (!visibleStageRows.value.length) {
      stageActionError.value = getNitroSyncErrorMessage(error, 'Could not load job stages.')
    }
  } finally {
    stagesLoading.value = false
  }
}

const nextFromSuccess = () => {
  screen.value = 11
  props.form.screen = screen.value
}

const finishFlow = () => {
  emit('complete')
}

const closeOverlayToBoard = () => {
  screen.value = activeStageRows.value.length ? 1 : 0
  props.form.screen = screen.value
}

const openBuilder = async () => {
  if (!newStageName.value.trim()) {
    stageActionError.value = 'Enter a stage name before adding a new stage.'
    return
  }

  stageActionMessage.value = ''
  stageActionError.value = ''
  stagesLoading.value = true

  try {
    const result = await createNitroSyncJobStage({
      related_company: companyId.value,
      stage_name: newStageName.value.trim(),
    })

    await fetchStages()
    stageActionMessage.value = result.message || 'Stage created successfully.'
    newStageName.value = ''
    screen.value = 0
    props.form.newStageName = newStageName.value
    props.form.screen = screen.value
  } catch (error) {
    console.error('Failed to create job stage', error)
    stageActionError.value = getNitroSyncErrorMessage(error, 'Failed to create job stage.')
  } finally {
    stagesLoading.value = false
  }
}

const toggleStage = (jobStageUuid, label) => {
  const nextRows = stageRows.value.map((item) =>
    (item.jobStageUuid && item.jobStageUuid === jobStageUuid) || (!item.jobStageUuid && item.label === label)
      ? { ...item, enabled: !item.enabled }
      : item,
  )
  stageRows.value = nextRows
  props.form.stageRows = stageRows.value
  const nextActiveStage = nextRows.find((item) => item.enabled)
  if (!nextRows.some((item) => getStageKey(item) === currentStageKey.value && item.enabled)) {
    setCurrentStage(nextActiveStage || '')
  }
}

const syncStageRowsFromWorkflow = (rows) => {
  stageRows.value = rows
  props.form.stageRows = rows
}

const goToNewStage = () => {
  screen.value = 1
  props.form.screen = screen.value
}

const addSelectedQuestion = () => {
  const label = questionInput.value.trim()

  if (!label) return

  selectedQuestions.value = [
    ...selectedQuestions.value,
    {
      label,
      color: questionColors[selectedQuestions.value.length % questionColors.length],
    },
  ]

  questionInput.value = ''
  props.form.selectedQuestions = selectedQuestions.value
  props.form.questionInput = questionInput.value
}

const addSelectedCompetency = (value) => {
  if (!value || value === 'Please Select') return

  manualCompetencyMode.value = false

  if (selectedCompetencies.value.some((item) => item.label === value)) {
    selectedCompetency.value = ''
    return
  }

  selectedCompetencies.value = [
    ...selectedCompetencies.value,
    {
      label: value,
      color: questionColors[selectedCompetencies.value.length % questionColors.length],
    },
  ]

  selectedCompetency.value = ''
  props.form.selectedCompetencies = selectedCompetencies.value
  props.form.selectedCompetency = selectedCompetency.value
}

const openManualCompetency = () => {
  manualCompetencyMode.value = true
  selectedCompetency.value = ''
  selectedCompetencies.value = []
  props.form.manualCompetencyMode = manualCompetencyMode.value
  props.form.selectedCompetency = selectedCompetency.value
  props.form.selectedCompetencies = selectedCompetencies.value
}

const openManualSkill = () => {
  manualSkillMode.value = true
  props.form.manualSkillMode = manualSkillMode.value
}

const resetScoreCardFeedback = () => {
  scoreCardActionMessage.value = ''
  scoreCardActionError.value = ''
}

const resetAutomatedActionFeedback = () => {
  automatedActionMessage.value = ''
  automatedActionError.value = ''
}

const createAutomatedActionSummary = (item) => ({
  automatedActionUuid: item.automated_action_uuid,
  condition: item.condition,
  assignedRecruiter: item.assigned_recruiter,
  assignMessage: item.assign_message,
  actions: item.actions,
})

const fetchAutomatedActions = async () => {
  automatedActionsLoading.value = true
  resetAutomatedActionFeedback()

  try {
    const rows = await fetchNitroSyncAutomatedActions(companyId.value)
    savedAutomatedActions.value = rows.map(createAutomatedActionSummary)
    props.form.savedAutomatedActions = savedAutomatedActions.value
  } catch (error) {
    console.error('Failed to fetch automated actions', error)
    automatedActionError.value = getNitroSyncErrorMessage(error, 'Could not load automated actions.')
  } finally {
    automatedActionsLoading.value = false
  }
}

const buildAutomatedActionsArray = () => {
  const actions = [
    automatedActionDraft.value.primaryAction,
    automatedActionDraft.value.inviteAutomatically ? 'Invite automatically' : '',
    automatedActionDraft.value.moveCandidateTo ? `Move candidate to ${automatedActionDraft.value.moveCandidateTo}` : '',
    automatedActionDraft.value.notifyCandidate ? 'Notify candidate' : '',
    automatedActionDraft.value.assignManager ? 'Assign manager' : '',
  ].filter(Boolean)

  return [...new Set(actions)]
}

const buildAutomatedActionPayload = (uuid = automatedActionDraft.value.automatedActionUuid || createUuid()) => ({
  condition: automatedActionDraft.value.condition,
  automated_action_uuid: uuid,
  related_company: companyId.value,
  assigned_recruiter: automatedActionDraft.value.assignedRecruiter,
  assign_message: automatedActionDraft.value.assignMessage.trim(),
  actions: buildAutomatedActionsArray(),
})

const getAutomatedActionValidationError = (payload) => {
  if (!payload.condition || payload.condition === 'Please select') return 'Condition is required.'
  if (!payload.automated_action_uuid) return 'Automated action UUID is required.'
  if (!payload.related_company) return 'Related company is required.'
  if (!payload.assigned_recruiter || payload.assigned_recruiter === 'Please select') return 'Assigned recruiter is required.'
  if (!payload.assign_message) return 'Assign message is required.'
  if (!payload.actions.length) return 'Select at least one action.'
  return ''
}

const resetAutomatedActionDraft = () => {
  automatedActionDraft.value = {
    automatedActionUuid: '',
    condition: '',
    primaryAction: '',
    assignedRecruiter: '',
    assignMessage: 'Send the candidate invitation automatically, assign the right owner, and add a short internal note for the next reviewer.',
    inviteAutomatically: false,
    moveCandidateTo: '',
    notifyCandidate: false,
    assignManager: true,
  }
  props.form.automatedActionDraft = automatedActionDraft.value
}

const editAutomatedAction = async (item) => {
  resetAutomatedActionFeedback()

  try {
    const row = await fetchNitroSyncAutomatedAction({
      automated_action_uuid: item.automatedActionUuid,
      related_company: companyId.value,
    })

    if (!row) {
      automatedActionError.value = 'Automated action details were not found.'
      return
    }

    automatedActionDraft.value = {
      automatedActionUuid: row.automated_action_uuid,
      condition: row.condition,
      primaryAction: row.actions[0] || '',
      assignedRecruiter: row.assigned_recruiter,
      assignMessage: row.assign_message,
      inviteAutomatically: row.actions.includes('Invite automatically'),
      moveCandidateTo: row.actions.find((action) => action.startsWith('Move candidate to '))?.replace('Move candidate to ', '') || '',
      notifyCandidate: row.actions.includes('Notify candidate'),
      assignManager: row.actions.includes('Assign manager'),
    }
    props.form.automatedActionDraft = automatedActionDraft.value
    screen.value = 14
  } catch (error) {
    console.error('Failed to fetch automated action details', error)
    automatedActionError.value = getNitroSyncErrorMessage(error, 'Failed to load automated action details.')
  }
}

const saveAutomatedAction = async () => {
  const payload = buildAutomatedActionPayload()
  const validationError = getAutomatedActionValidationError(payload)

  if (validationError) {
    automatedActionError.value = validationError
    automatedActionMessage.value = ''
    return
  }

  automatedActionSubmitting.value = true
  resetAutomatedActionFeedback()

  try {
    const isUpdate = Boolean(automatedActionDraft.value.automatedActionUuid)
    const result = isUpdate
      ? await updateNitroSyncAutomatedAction(payload)
      : await createNitroSyncAutomatedAction(payload)

    automatedActionMessage.value =
      result.message ||
      (isUpdate ? 'Automated action updated successfully.' : 'Automated action created successfully.')
    automatedActionError.value = ''
    await fetchAutomatedActions()
    automatedActionDraft.value.automatedActionUuid = payload.automated_action_uuid
    if (currentStageKey.value) {
      updateStageManagement(currentStageKey.value, (management) => ({
        ...management,
        automatedActionUuids: [...management.automatedActionUuids.filter((item) => item !== payload.automated_action_uuid), payload.automated_action_uuid],
      }))
    }
    props.form.automatedActionDraft = automatedActionDraft.value
    screen.value = 1
  } catch (error) {
    console.error('Failed to save automated action', {
      payload,
      error,
    })
    automatedActionError.value = getNitroSyncErrorMessage(error, 'Failed to save automated action.')
  } finally {
    automatedActionSubmitting.value = false
  }
}

const removeAutomatedAction = async (item) => {
  if (!item?.automatedActionUuid || deletingAutomatedActionUuid.value) return

  const confirmed = window.confirm(`Delete automated action "${item.condition}"?`)
  if (!confirmed) return

  deletingAutomatedActionUuid.value = item.automatedActionUuid
  resetAutomatedActionFeedback()

  try {
    const result = await deleteNitroSyncAutomatedAction({
      automated_action_uuid: item.automatedActionUuid,
      related_company: companyId.value,
    })

    automatedActionMessage.value = result.message || 'Automated action deleted successfully.'
    automatedActionError.value = ''
    savedAutomatedActions.value = savedAutomatedActions.value.filter((entry) => entry.automatedActionUuid !== item.automatedActionUuid)
    removeAutomatedActionAssignments(item.automatedActionUuid)
    props.form.savedAutomatedActions = savedAutomatedActions.value
  } catch (error) {
    console.error('Failed to delete automated action', error)
    automatedActionError.value = getNitroSyncErrorMessage(error, 'Failed to delete automated action.')
  } finally {
    deletingAutomatedActionUuid.value = ''
  }
}

const buildScoreCardPayload = () => {
  const scoreCardUuid = createUuid()

  return {
    name: scoreCardDraft.value.name.trim(),
    job_title: scoreCardDraft.value.jobTitle.trim(),
    interviewer: scoreCardDraft.value.interviewer.trim(),
    tags: scoreCardDraft.value.tags.trim(),
    instruction_message: scoreCardDraft.value.instructionMessage.trim(),
    questions: normalizedScoreCardQuestions.value,
    competencies_traits: normalizedScoreCardCompetencies.value,
    skills: normalizedScoreCardSkills.value,
    evaluation_criteria: scoreCardDraft.value.evaluationCriteria.trim(),
    comments_observation: scoreCardDraft.value.commentsObservation.trim(),
    score_card_uuid: scoreCardUuid,
    related_company: companyId.value,
  }
}

const getScoreCardValidationError = (payload) => {
  if (!payload.name) return 'Score card name is required.'
  if (!payload.job_title || payload.job_title === 'Please select') return 'Job title is required.'
  if (!payload.interviewer || payload.interviewer === 'Please select') return 'Interviewer is required.'
  if (!payload.tags) return 'Tags are required.'
  if (!payload.instruction_message) return 'Instruction message is required.'
  if (!payload.questions) return 'At least one question is required.'
  if (!payload.competencies_traits) return 'Competencies and traits are required.'
  if (!payload.skills) return 'Skills are required.'
  if (!payload.evaluation_criteria) return 'Evaluation criteria is required.'
  if (!payload.comments_observation) return 'Comments and observation are required.'
  if (!payload.related_company) return 'Related company is required.'
  return ''
}

const saveScoreCard = async () => {
  if (scoreCardSubmitting.value) return

  const payload = buildScoreCardPayload()
  const validationError = getScoreCardValidationError(payload)

  if (validationError) {
    scoreCardActionError.value = validationError
    scoreCardActionMessage.value = ''
    return
  }

  scoreCardSubmitting.value = true
  resetScoreCardFeedback()

  try {
    const result = await createNitroSyncScoreCard(payload)
    scoreCardActionMessage.value = result.message || 'Score card created successfully.'
    scoreCardActionError.value = ''
    await fetchScoreCards()
    selectedScoreCard.value = payload.score_card_uuid
    props.form.selectedScoreCard = selectedScoreCard.value
    savedScorecards.value = [
      {
        uuid: payload.score_card_uuid,
        title: payload.name,
        owner: payload.interviewer,
        action: 'Edit card',
      },
      ...savedScorecards.value.filter((item) => item.uuid !== payload.score_card_uuid),
    ]
    if (currentStageKey.value) {
      updateStageManagement(currentStageKey.value, (management) => ({
        ...management,
        scoreCardUuids: [...management.scoreCardUuids.filter((item) => item !== payload.score_card_uuid), payload.score_card_uuid],
      }))
    }
    screen.value = 10
  } catch (error) {
    console.error('Failed to create score card', {
      payload,
      error,
    })
    scoreCardActionError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.msg ||
      error?.response?.data?.code ||
      (error?.response?.status ? `Create request failed with HTTP ${error.response.status}.` : '') ||
      'Failed to create the score card.'
  } finally {
    scoreCardSubmitting.value = false
  }
}

const deleteScoreCard = async (item) => {
  if (!item?.uuid || deletingScoreCardUuid.value) return

  const confirmed = window.confirm(`Delete "${item.title}"?`)
  if (!confirmed) return

  if (item.isFallback) {
    savedScorecards.value = savedScorecards.value.filter((card) => card.uuid !== item.uuid)
    removeScoreCardAssignments(item.uuid)
    if (selectedScoreCard.value === item.uuid) {
      selectedScoreCard.value = savedScorecards.value[0]?.uuid || ''
      props.form.selectedScoreCard = selectedScoreCard.value
    }
    scoreCardActionMessage.value = 'Score card removed from the local fallback list.'
    scoreCardActionError.value = ''
    return
  }

  deletingScoreCardUuid.value = item.uuid
  resetScoreCardFeedback()

  try {
    const result = await deleteNitroSyncScoreCard(item.uuid)
    scoreCardActionMessage.value = result.message || 'Score card deleted successfully.'
    scoreCardActionError.value = ''
    savedScorecards.value = savedScorecards.value.filter((card) => card.uuid !== item.uuid)
    removeScoreCardAssignments(item.uuid)

    if (selectedScoreCard.value === item.uuid) {
      selectedScoreCard.value = savedScorecards.value[0]?.uuid || ''
      props.form.selectedScoreCard = selectedScoreCard.value
    }
  } catch (error) {
    console.error('Failed to delete score card', error)
    scoreCardActionError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.msg ||
      'Failed to delete the score card.'
  } finally {
    deletingScoreCardUuid.value = ''
  }
}

const handleScoreCardStep = () => {
  if (screen.value === 9) {
    saveScoreCard()
    return
  }

  resetScoreCardFeedback()
  screen.value += 1
}

watch(screen, (value) => {
  props.form.screen = value
})

watch(selectedScoreCard, (value) => {
  props.form.selectedScoreCard = value
})

watch(automatedActionDraft, (value) => {
  props.form.automatedActionDraft = value
}, { deep: true })

watch(scoreCardDraft, (value) => {
  props.form.scoreCardDraft = value
}, { deep: true })

watch(newStageName, (value) => {
  props.form.newStageName = value
})

watch(stageRows, (value) => {
  syncStageManagement(value)
  props.form.stageRows = value
}, { deep: true })

watch(stageManagementByStage, (value) => {
  props.form.stageManagementByStage = value
}, { deep: true })

watch(currentStageKey, (value) => {
  props.form.currentStageKey = value
})

watch(questionInput, (value) => {
  props.form.questionInput = value
})

watch(selectedQuestions, (value) => {
  props.form.selectedQuestions = value
}, { deep: true })

watch(selectedCompetency, (value) => {
  props.form.selectedCompetency = value
})

watch(selectedCompetencies, (value) => {
  props.form.selectedCompetencies = value
}, { deep: true })

watch(manualCompetencyMode, (value) => {
  props.form.manualCompetencyMode = value
})

watch(manualCompetencyTitle, (value) => {
  props.form.manualCompetencyTitle = value
})

watch(manualSkillMode, (value) => {
  props.form.manualSkillMode = value
})

watch(manualSkillTitle, (value) => {
  props.form.manualSkillTitle = value
})

watch(
  () => props.relatedCompany,
  (value, previousValue) => {
    if (!String(value || '').trim() || value === previousValue) return
    fetchStages()
    fetchScoreCards()
    fetchAutomatedActions()
  },
)

syncStageManagement(visibleStageRows.value)
</script>

<template>
  <div class="job-stages-step">
    <div class="job-stages-step__head">
      <div>
        <h3 class="job-stages-step__title">Step 4: Job Stages</h3>
        <p class="job-stages-step__text">
          Make smarter hiring decisions, our intelligent screening and advancement system automates evaluations
          based on your criteria, ensuring efficient and fair assessments for every candidate.
        </p>
      </div>

      <button
        type="button"
        class="job-stages-step__ghost"
        @click="showWorkflowDesigner ? closeWorkflowDesigner() : openWorkflowDesigner()"
      >
        {{ showWorkflowDesigner ? 'Back to stages' : 'Configure workflow' }}
      </button>
    </div>

    <div v-if="showWorkflowDesigner" class="job-stages-step__workflow-shell">
      <JobStagesWorkflowStep
        :related-company="companyId"
        :stage-rows="stageRows"
        @stage-rows-updated="syncStageRowsFromWorkflow"
      />
    </div>

    <div v-else class="job-stages-step__canvas" :class="{ 'job-stages-step__canvas--dimmed': overlayVisible }">
      <section class="stage-shell">
        <div v-if="primaryStage" class="stage-shell__stage-name">
          <span class="stage-shell__handle" aria-hidden="true"></span>
          <span class="stage-shell__label stage-shell__label--current">
            <span class="stage-shell__dot"></span>
            <span>{{ primaryStage.label }}</span>
          </span>
          <button
            type="button"
            class="stage-switch"
            :class="{ 'stage-switch--on': primaryStage.enabled }"
            @click="toggleStage(primaryStage.jobStageUuid, primaryStage.label)"
          ></button>
        </div>

        <template v-if="!showExpandedStage">
          <div
            v-for="item in visibleStageRows.slice(1)"
            :key="item.jobStageUuid || item.label"
            class="stage-shell__row"
          >
            <span class="stage-shell__handle" aria-hidden="true"></span>
            <span class="stage-shell__label">
              <span class="stage-shell__dot stage-shell__dot--ghost"></span>
              <span>{{ item.label }}</span>
            </span>
            <button
              type="button"
              class="stage-switch"
              :class="{ 'stage-switch--on': item.enabled }"
              @click="toggleStage(item.jobStageUuid, item.label)"
            ></button>
          </div>
          <p v-if="!visibleStageRows.length" class="job-stages-step__api-feedback">
            No job stages found yet.
          </p>
        </template>

        <template v-else>
          <div v-if="activeStageRows.length" class="active-stage-stack">
            <article
              v-for="stage in activeStageRows"
              :key="stage.jobStageUuid || stage.label"
              class="active-stage-card"
            >
              <div class="active-stage-card__head">
                <div class="active-stage-card__identity">
                  <span class="stage-shell__handle" aria-hidden="true"></span>
                  <span class="active-stage-card__pill">{{ stage.label }}</span>
                </div>
                <span class="active-stage-card__meta">
                  {{ getStageScoreCards(stage).length }} score cards, {{ getStageAssessments(stage).length }} assessments, {{ getStageAutomatedActions(stage).length }} actions
                </span>
              </div>

              <div class="stage-module">
                <div class="stage-module__header">
                  <span class="stage-module__bullet stage-module__bullet--pink"></span>
                  <div>
                    <strong>Score Cards</strong>
                    <p>
                      Build a reusable scorecard for this stage so interviewers evaluate candidates against the same
                      criteria, scoring rules, and feedback areas.
                    </p>
                  </div>
                </div>

                <div v-if="getStageScoreCards(stage).length" class="scorecard-summary-list">
                  <div
                    v-for="item in getStageScoreCards(stage)"
                    :key="item.uuid"
                    class="scorecard-summary-card"
                  >
                    <div class="scorecard-summary-card__top">
                      <div>
                        <strong>{{ item.title }}</strong>
                        <p v-if="item.owner" class="scorecard-summary-card__owner">{{ item.owner }}</p>
                      </div>
                    </div>

                    <div class="scorecard-summary-card__tags">
                      <span v-for="(tag, index) in scoreSummaryTags" :key="`${item.uuid}-${tag}-${index}`">{{ tag }}</span>
                    </div>
                  </div>
                </div>

                <p v-else class="stage-module__empty">No score cards assigned to this stage yet.</p>

                <button type="button" class="stage-module__add" @click="openStageScoreCardManager(stage)">
                  Manage Score Cards
                </button>
              </div>

              <div class="stage-module">
                <div class="stage-module__header">
                  <span class="stage-module__bullet stage-module__bullet--slate"></span>
                  <div>
                    <strong>Assessments</strong>
                    <p>
                      Add assessments that help you verify candidate skills with structured tests, practical tasks,
                      and stage-based evaluation requirements.
                    </p>
                  </div>
                </div>

                <div v-if="getStageAssessments(stage).length" class="assessment-summary-list">
                  <div
                    v-for="item in getStageAssessments(stage)"
                    :key="item.title"
                    class="assessment-summary-card"
                  >
                    <span class="assessment-summary-card__icon" :style="{ '--assessment-color': item.color }"></span>
                    <div>
                      <strong>{{ item.title }}</strong>
                      <p>Assessment is active for this stage.</p>
                    </div>
                  </div>
                </div>

                <p v-else class="stage-module__empty">No assessments assigned to this stage yet.</p>

                <button type="button" class="stage-module__add" @click="openStageAssessments(stage)">Manage Assessments</button>
              </div>

              <div class="stage-module">
                <div class="stage-module__header">
                  <span class="stage-module__bullet stage-module__bullet--pink"></span>
                  <div>
                    <strong>Automated Actions</strong>
                    <p>
                      Define actions that move candidates automatically, assign owners, and trigger communication at the
                      right moment in the workflow.
                    </p>
                  </div>
                </div>

                <div v-if="getStageAutomatedActions(stage).length" class="automated-summary-list">
                  <div
                    v-for="item in getStageAutomatedActions(stage)"
                    :key="item.automatedActionUuid"
                    class="automated-summary-card"
                  >
                    <strong>{{ item.condition }}</strong>
                    <p>{{ item.assignedRecruiter || 'No recruiter assigned' }}</p>
                  </div>
                </div>

                <p v-else class="stage-module__empty">No automated actions assigned to this stage yet.</p>

                <button type="button" class="stage-module__add" @click="openStageAutomatedActions(stage)">Manage Automated Actions</button>
              </div>
            </article>
          </div>

          <p v-else class="stage-module__empty stage-module__empty--board">
            Turn on at least one stage to manage score cards, assessments, and automated actions.
          </p>
        </template>

        <div class="stage-shell__append-row">
          <input
            v-model="newStageName"
            class="stage-shell__append-input"
            type="text"
            placeholder="Type a new stage name"
            @keyup.enter="openBuilder"
          />
          <button type="button" class="stage-shell__append" :disabled="stagesLoading" @click="openBuilder">
            {{ stagesLoading ? 'Saving...' : '+ Add new stage' }}
          </button>
        </div>
        <p v-if="stageActionMessage" class="job-stages-step__api-feedback job-stages-step__api-feedback--success">{{ stageActionMessage }}</p>
        <p v-if="stageActionError" class="job-stages-step__api-feedback job-stages-step__api-feedback--error">{{ stageActionError }}</p>
      </section>

        <div class="job-stages-step__footer">
          <button
            v-if="screen === 0"
            type="button"
            class="job-stages-step__next"
            @click="goToNewStage"
          >
            NEXT STEP
          </button>

          <button
            v-else
            type="button"
          class="job-stages-step__next"
          @click="finishFlow"
        >
          NEXT STEP
        </button>
      </div>
    </div>

    <div v-if="overlayVisible" class="job-stages-overlay">
      <div
        class="job-stages-modal"
        :class="{
          'job-stages-modal--wide': screen === 11,
          'job-stages-modal--scorecard': screen >= 4 && screen <= 9,
          'job-stages-modal--questions': screen === 5,
        }"
      >
        <button type="button" class="job-stages-modal__close" @click="closeOverlayToBoard">×</button>

        <template v-if="screen === 3">
          <div class="job-stages-modal__title-wrap">
            <div class="job-stages-modal__icon"></div>
            <div>
              <h4>Manage Score Cards</h4>
              <p v-if="currentStageLabel" class="job-stages-modal__context">{{ currentStageLabel }}</p>
            </div>
          </div>

          <div class="saved-scorecards">
            <div class="saved-scorecards__head">
              <span class="saved-scorecards__dot"></span>
              <span>Scorecard name</span>
              <span>Owned by</span>
            </div>

            <div v-for="item in savedScorecards" :key="item.uuid" class="saved-scorecards__row">
              <button type="button" class="saved-scorecards__select" @click="toggleStageScoreCard(currentStageKey, item.uuid)">
                <span class="saved-scorecards__radio" :class="{ 'saved-scorecards__radio--active': hasStageScoreCard(currentStageKey, item.uuid) }"></span>
              </button>
              <span>{{ item.title }}</span>
              <span>{{ item.owner }}</span>
              <div class="saved-scorecards__actions">
                <button type="button" @click="toggleStageScoreCard(currentStageKey, item.uuid)">
                  {{ hasStageScoreCard(currentStageKey, item.uuid) ? 'Remove' : 'Add' }}
                </button>
                <button
                  type="button"
                  :disabled="deletingScoreCardUuid === item.uuid"
                  @click="deleteScoreCard(item)"
                >
                  {{ deletingScoreCardUuid === item.uuid ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>

          <p v-if="scoreCardActionMessage" class="scorecard-api-feedback scorecard-api-feedback--success">{{ scoreCardActionMessage }}</p>
          <p v-if="scoreCardActionError" class="scorecard-api-feedback scorecard-api-feedback--error">{{ scoreCardActionError }}</p>

          <button type="button" class="modal-primary" @click="openStageScoreCardBuilder(currentStageKey)">Create New Score Card</button>
        </template>

        <template v-else-if="screen >= 4 && screen <= 9">
          <div class="job-stages-modal__title-wrap">
            <div class="job-stages-modal__icon"></div>
            <div>
              <h4>Add New Score Card</h4>
              <p v-if="currentStageLabel" class="job-stages-modal__context">{{ currentStageLabel }}</p>
            </div>
          </div>

          <div class="wizard-mini-tabs wizard-mini-tabs--scorecard">
            <button type="button" :class="{ 'is-current': screen === 4 }">Score Card Information</button>
            <button type="button" :class="{ 'is-current': screen === 5 }">Questions</button>
            <button type="button" :class="{ 'is-current': screen === 6 }">Competencies and Traits</button>
            <button type="button" :class="{ 'is-current': screen === 7 }">skills</button>
            <button type="button" :class="{ 'is-current': screen === 8 }">Evaluation Criteria</button>
            <button type="button" :class="{ 'is-current': screen === 9 }">Comments and Observation</button>
          </div>

          <div v-if="screen === 4" class="modal-form modal-form--scorecard">
            <label>Pre-Saved Template</label>
            <Dropdown model-value="" :options="['Please select', 'Manager interview template', 'Recruiter screening template']" placeholder="Please select" />

            <label>Score Card Name</label>
            <input v-model="scoreCardDraft.name" type="text" />

            <div class="modal-form__grid">
              <div>
                <label>Job Title</label>
                <Dropdown v-model="scoreCardDraft.jobTitle" :options="scoreCardJobTitleOptions" placeholder="Please select" />
              </div>
              <div>
                <label>Interviewer</label>
                <Dropdown v-model="scoreCardDraft.interviewer" :options="scoreCardInterviewerOptions" placeholder="Please select" />
              </div>
            </div>

            <label>Tags</label>
            <input v-model="scoreCardDraft.tags" type="text" />

            <label>Instruction message to the team</label>
            <textarea v-model="scoreCardDraft.instructionMessage"></textarea>
          </div>

          <div v-else-if="screen === 5" class="modal-form">
            <label>Select Question</label>
            <div class="question-pick">
              <input
                v-model="questionInput"
                type="text"
                placeholder="Write the question to choose."
                @keyup.enter="addSelectedQuestion"
              />
              <button type="button" class="question-pick__add" @click="addSelectedQuestion">+</button>
            </div>

            <label>Selected Questions</label>
            <div class="modal-options modal-options--questions">
              <button
                v-for="(answer, index) in selectedQuestions"
                :key="`${answer.label}-${index}`"
                type="button"
                class="modal-option"
                :style="{ '--option-color': answer.color }"
              >
                <span class="modal-option__check"></span>
                <span>{{ answer.label }}</span>
              </button>
              <p v-if="!selectedQuestions.length" class="modal-empty">No questions added yet.</p>
            </div>
          </div>

          <div v-else-if="screen === 6" class="modal-form">
            <label>Select competencies and traits</label>
            <Dropdown
              v-model="selectedCompetency"
              :options="['Please Select', 'Technical Skills', 'Experience', 'Problem-Solving Ability', 'Communication Skills']"
              placeholder="Please Select"
              @update:model-value="addSelectedCompetency"
            />

            <div v-if="selectedCompetencies.length && !manualCompetencyMode" class="modal-options modal-options--questions">
              <button
                v-for="(item, index) in selectedCompetencies"
                :key="`${item.label}-${index}`"
                type="button"
                class="modal-option"
                :style="{ '--option-color': item.color }"
              >
                <span class="modal-option__check"></span>
                <span>{{ item.label }}</span>
              </button>
            </div>

            <div class="modal-separator">Or</div>
            <template v-if="manualCompetencyMode">
              <label>Competency title</label>
              <input v-model="manualCompetencyTitle" type="text" placeholder="Enter competency title" />
            </template>
            <button v-else type="button" class="modal-helper-link" @click="openManualCompetency">
              Enter a competency manually
            </button>
          </div>

          <div v-else-if="screen === 7" class="modal-form">
            <label>Please select</label>
            <Dropdown model-value="" :options="['Please select', 'Figma', 'Adobe Illustrator', 'Presentation skills']" placeholder="Please select" />

            <div v-if="!manualSkillMode" class="skill-tag-grid">
              <span
                v-for="tag in skillTags"
                :key="tag.label"
                class="skill-tag-grid__item"
                :style="{ '--tag-color': tag.color }"
              >
                {{ tag.label }}
              </span>
            </div>

            <div class="modal-separator">Or</div>
            <template v-if="manualSkillMode">
              <label>Skill Title</label>
              <input v-model="manualSkillTitle" type="text" placeholder="Enter skill title" />
            </template>
            <button v-else type="button" class="modal-helper-link" @click="openManualSkill">
              Enter a skill manually
            </button>
          </div>

          <div v-else-if="screen === 8" class="modal-form">
            <label>Behavioral criteria</label>
            <textarea v-model="scoreCardDraft.evaluationCriteria"></textarea>
          </div>

          <div v-else class="modal-form">
            <label>Comments and evaluation</label>
            <textarea v-model="scoreCardDraft.commentsObservation"></textarea>
          </div>

          <p v-if="scoreCardActionMessage" class="scorecard-api-feedback scorecard-api-feedback--success">{{ scoreCardActionMessage }}</p>
          <p v-if="scoreCardActionError" class="scorecard-api-feedback scorecard-api-feedback--error">{{ scoreCardActionError }}</p>

          <button
            type="button"
            class="modal-primary"
            :disabled="scoreCardSubmitting"
            @click="handleScoreCardStep"
          >
            {{ screen === 9 ? (scoreCardSubmitting ? 'Saving...' : 'Finish and Save') : 'Next' }}
          </button>
        </template>

        <template v-else-if="screen === 10">
          <div class="success-card">
            <div class="success-card__mark">?</div>
            <p>Score Card has create successfully.</p>
            <div class="success-card__actions">
              <button type="button" class="modal-primary modal-primary--small" @click="nextFromSuccess">Preview it</button>
              <button type="button" class="stage-link" @click="screen = 1">add another</button>
            </div>
          </div>
        </template>

        <template v-else-if="screen === 11">
          <div class="job-stages-modal__title-wrap">
            <div class="job-stages-modal__icon"></div>
            <h4>preview score card</h4>
          </div>

          <div class="preview-card">
            <div class="preview-card__section">
              <div class="preview-card__label">{{ scoreCardDraft.jobTitle || 'Leadership review' }}</div>
              <div class="preview-card__row">
                <span>{{ scoreCardDraft.interviewer || 'Interviewer Name' }}</span>
                <span>{{ scoreCardDraft.name || 'Score title' }}</span>
              </div>
            </div>

            <div class="preview-strip preview-strip--pink">{{ scoreCardDraft.name || 'Graphic Designer Screening Scorecard' }} <span class="preview-stars">☆☆☆☆☆</span></div>
            <div class="preview-strip preview-strip--blue">{{ scoreCardCompetenciesValue || 'experience' }} <span class="preview-stars">☆☆☆☆☆</span></div>

            <div class="preview-note">
              your question while the interview,<br />
              {{ scoreCardDraft.instructionMessage || 'Please score the candidate consistently, add brief evidence for each rating, and highlight any blockers before the final interview stage.' }}
            </div>

            <div class="preview-strip preview-strip--pink">{{ scoreCardQuestionsValue || 'your question while the interview' }} <span class="preview-stars">☆☆☆☆☆</span></div>
            <div class="preview-strip preview-strip--pink">{{ scoreCardSkillsValue || 'active 4' }} <span class="preview-stars">☆☆☆☆☆</span></div>
            <div class="preview-strip preview-strip--blue">{{ scoreCardDraft.tags || 'active 2' }} <span class="preview-stars">☆☆☆☆☆</span></div>

            <div class="preview-card__section">
              <div class="preview-card__label">Behavioral criteria</div>
              <textarea>{{ scoreCardDraft.evaluationCriteria }}</textarea>
            </div>

            <div class="preview-card__section">
              <div class="preview-card__label">Comments and evaluation</div>
              <textarea>{{ scoreCardDraft.commentsObservation }}</textarea>
            </div>
          </div>

          <button type="button" class="modal-primary" @click="screen = 12">Finish</button>
        </template>

        <template v-else-if="screen === 12">
          <div class="job-stages-modal__title-wrap">
            <div class="job-stages-modal__icon"></div>
            <div>
              <h4>Manage Assessments</h4>
              <p v-if="currentStageLabel" class="job-stages-modal__context">{{ currentStageLabel }}</p>
            </div>
          </div>

          <div class="assessment-list">
            <div v-for="item in assessmentOptions" :key="item.color" class="assessment-list__item">
              <span class="assessment-list__icon" :style="{ '--assessment-color': item.color }">Q</span>
              <div>
                <strong>{{ item.title }}</strong>
                <p>A short description about the assessment and the purpose it serves for the hiring process.</p>
              </div>
              <button
                type="button"
                class="assessment-list__action"
                :class="{ 'assessment-list__action--active': hasStageAssessment(currentStageKey, item.title) }"
                :style="{ color: item.color }"
                @click="toggleStageAssessment(currentStageKey, item.title)"
              >
                {{ hasStageAssessment(currentStageKey, item.title) ? 'Remove' : 'Add' }}
              </button>
            </div>
          </div>

          <button type="button" class="modal-primary" @click="screen = 13">Next</button>
        </template>

        <template v-else-if="screen === 13 || screen === 14">
          <div class="job-stages-modal__title-wrap">
            <div class="job-stages-modal__icon"></div>
            <div>
              <h4>{{ screen === 13 ? 'Manage Automated Actions' : 'New Automated Action' }}</h4>
              <p v-if="currentStageLabel" class="job-stages-modal__context">{{ currentStageLabel }}</p>
            </div>
          </div>

          <div class="modal-form modal-form--automated">
            <div v-if="savedAutomatedActions.length" class="automated-saved-list">
              <div
                v-for="item in savedAutomatedActions"
                :key="item.automatedActionUuid"
                class="automated-saved-list__row"
              >
                <div>
                  <strong>{{ item.condition }}</strong>
                  <p>{{ item.actions.join(', ') || 'No actions selected' }}</p>
                </div>
                <div class="automated-saved-list__actions">
                  <button type="button" @click="toggleStageAutomatedAction(currentStageKey, item.automatedActionUuid)">
                    {{ hasStageAutomatedAction(currentStageKey, item.automatedActionUuid) ? 'Remove' : 'Attach' }}
                  </button>
                  <button type="button" @click="editAutomatedAction(item)">Edit</button>
                  <button
                    type="button"
                    :disabled="deletingAutomatedActionUuid === item.automatedActionUuid"
                    @click="removeAutomatedAction(item)"
                  >
                    {{ deletingAutomatedActionUuid === item.automatedActionUuid ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </div>
            </div>

            <template v-if="screen === 13">
              <h5 class="automated-title">Automated Actions</h5>
              <p class="automated-copy">
                Praesent auctor purus luctus enim egestas, ac scelerisque ante pulvinar. Donec ut rhoncus ex.
              </p>

              <label>when moving a candidate to</label>
              <Dropdown v-model="automatedActionDraft.condition" :options="automatedStageOptions" placeholder="Please select" />

              <label>Do this action</label>
              <Dropdown v-model="automatedActionDraft.primaryAction" :options="automatedPrimaryActionOptions" placeholder="Please select" />

              <div class="modal-separator modal-separator--automated">Or</div>
              <button type="button" class="automated-add" @click="screen = 14">
                <span>+</span>
                <span>Add new Automated Action</span>
              </button>
            </template>

            <template v-if="screen === 14">
              <label>Invite candidate</label>
              <div class="toggle-field">
                <span>Invite automatically</span>
                <button type="button" class="stage-switch" :class="{ 'stage-switch--on': automatedActionDraft.inviteAutomatically }" @click="automatedActionDraft.inviteAutomatically = !automatedActionDraft.inviteAutomatically"></button>
              </div>

              <label>Move candidate to</label>
              <Dropdown v-model="automatedActionDraft.moveCandidateTo" :options="automatedStageOptions" placeholder="Please select" />

              <label>Invite candidate</label>
              <div class="toggle-field">
                <span>Notify candidate</span>
                <button type="button" class="stage-switch" :class="{ 'stage-switch--on': automatedActionDraft.notifyCandidate }" @click="automatedActionDraft.notifyCandidate = !automatedActionDraft.notifyCandidate"></button>
              </div>

              <label>Assign</label>
              <div class="toggle-field">
                <span>Assign manager</span>
                <button type="button" class="stage-switch" :class="{ 'stage-switch--on': automatedActionDraft.assignManager }" @click="automatedActionDraft.assignManager = !automatedActionDraft.assignManager"></button>
              </div>

              <label>Assign to</label>
              <Dropdown v-model="automatedActionDraft.assignedRecruiter" :options="automatedAssignOptions" placeholder="Please select" />

              <label>Notes</label>
              <textarea v-model="automatedActionDraft.assignMessage"></textarea>
            </template>
          </div>

          <p v-if="automatedActionsLoading" class="scorecard-api-feedback">Loading automated actions...</p>
          <p v-if="automatedActionMessage" class="scorecard-api-feedback scorecard-api-feedback--success">{{ automatedActionMessage }}</p>
          <p v-if="automatedActionError" class="scorecard-api-feedback scorecard-api-feedback--error">{{ automatedActionError }}</p>

          <button
            type="button"
            class="modal-primary"
            :disabled="automatedActionSubmitting"
            @click="screen === 13 ? screen = 14 : saveAutomatedAction()"
          >
            {{ screen === 13 ? 'Next' : automatedActionSubmitting ? 'Saving...' : 'Save Automated Action' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.job-stages-step {
  position: relative;
  isolation: isolate;
  max-width: 100%;
  margin: 0 auto;
}

.job-stages-step__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--surface-gap);
  margin-bottom: var(--surface-gap);
}

.job-stages-step__title {
  margin: 0;
  font-size: var(--font-section-title);
  font-weight: 600;
  color: #17111b;
}

.job-stages-step__text {
  margin: 8px 0 0;
  max-width: 620px;
  font-size: var(--font-small);
  line-height: 1.4;
  color: #d1c3ca;
}

.job-stages-step__ghost {
  min-width: 148px;
  height: var(--ui-button-sm-height);
  padding: 0 14px;
  border: 1px solid #cdd8ff;
  border-radius: var(--ui-radius-sm);
  color: #4f7dff;
  font-size: var(--ui-small-font);
  background: #ffffff;
  flex: 0 0 auto;
}

.job-stages-step__canvas {
  position: relative;
}

.job-stages-step__workflow-shell {
  padding: var(--surface-pad);
  border: 1px solid #f1d8e3;
  border-radius: var(--surface-radius-lg);
  background: linear-gradient(180deg, #fff7fa 0%, #ffffff 100%);
}

.job-stages-step__canvas--dimmed .stage-shell,
.job-stages-step__canvas--dimmed .job-stages-step__footer {
  opacity: 0.3;
}

.stage-shell {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  border: 1px solid #efe4e8;
  border-radius: var(--surface-radius);
  background: #ffffff;
  padding: var(--surface-pad);
}

.stage-shell__stage-name,
.stage-shell__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding: 0 14px 0 10px;
  border-radius: var(--ui-radius-sm);
  background: #fcfbfb;
  color: #8b6675;
  font-size: var(--ui-small-font);
  line-height: 1.2;
}

.stage-shell__stage-name {
  margin-bottom: 12px;
  color: #ea4f8d;
  font-weight: 600;
}

.stage-shell__row + .stage-shell__row,
.stage-module + .stage-module {
  margin-top: 12px;
}

.stage-shell__handle {
  width: 12px;
  height: 16px;
  flex: 0 0 auto;
  opacity: 0.5;
  background-image:
    radial-gradient(circle, #e5dde1 1px, transparent 1.2px),
    radial-gradient(circle, #e5dde1 1px, transparent 1.2px);
  background-size: 6px 6px;
  background-position: 0 0, 3px 3px;
}

.stage-shell__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
  margin-right: 10px;
  flex: 0 0 auto;
}

.stage-shell__dot--ghost {
  opacity: 0;
}

.stage-shell__label {
  min-width: 0;
  flex: 1 1 auto;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  padding-left: 14px;
}

.stage-shell__label--current {
  color: #ea4f8d;
}

.stage-switch {
  width: 22px;
  height: 14px;
  border-radius: 999px;
  background: #e6e0e3;
  position: relative;
  flex: 0 0 auto;
  margin-left: 12px;
}

.stage-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #c7c7c7;
}

.stage-switch--on {
  background: #f4d8e1;
}

.stage-switch--on::after {
  left: 10px;
  background: #49bf61;
}

.stage-module {
  border: 1px solid #f6eff2;
  border-radius: 12px;
  padding: 16px;
  background: #fcfbfc;
}

.active-stage-stack {
  display: grid;
  gap: 16px;
}

.active-stage-card {
  padding: 16px;
  border: 1px solid #f2e7ec;
  border-radius: 16px;
  background: #fff;
}

.active-stage-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.active-stage-card__identity {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.active-stage-card__pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff1f6;
  color: #d93f80;
  font-size: var(--ui-small-font);
  font-weight: 600;
}

.active-stage-card__meta {
  font-size: var(--ui-meta-font);
  color: #aa96a1;
}

.stage-module__header {
  display: flex;
  gap: 8px;
}

.stage-module__bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 5px;
  flex: 0 0 auto;
}

.stage-module__bullet--pink {
  background: #ea4f8d;
}

.stage-module__bullet--slate {
  background: #cfcfcf;
}

.stage-module__header strong {
  display: block;
  margin-bottom: 3px;
  font-size: var(--ui-small-font);
  color: #3b2d35;
}

.stage-module__header p {
  margin: 0;
  font-size: var(--ui-small-font);
  line-height: 1.35;
  color: #c7bcc1;
}

.stage-module__empty {
  margin: 12px 0 0;
  font-size: var(--ui-meta-font);
  line-height: 1.4;
  color: #ad9aa3;
}

.stage-module__empty--board {
  padding: 18px;
  border: 1px dashed #eadde3;
  border-radius: 12px;
  background: #fdfbfc;
}

.automated-summary-list,
.automated-saved-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.assessment-summary-list,
.scorecard-summary-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.automated-summary-card,
.automated-saved-list__row,
.assessment-summary-card {
  padding: 10px 12px;
  border: 1px solid #efe4e8;
  border-radius: 8px;
  background: #fff;
}

.automated-summary-card strong,
.automated-saved-list__row strong {
  display: block;
  font-size: var(--ui-meta-font);
  color: #3b2d35;
}

.automated-summary-card p,
.automated-saved-list__row p {
  margin: 4px 0 0;
  font-size: var(--ui-tiny-font);
  color: #a4939d;
}

.assessment-summary-card {
  display: flex;
  align-items: center;
  gap: 10px;
}

.assessment-summary-card strong {
  display: block;
  font-size: var(--ui-meta-font);
  color: #3b2d35;
}

.assessment-summary-card p {
  margin: 4px 0 0;
  font-size: var(--ui-tiny-font);
  color: #a4939d;
}

.assessment-summary-card__icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  flex: 0 0 auto;
  background: color-mix(in srgb, var(--assessment-color) 14%, #ffffff);
  position: relative;
}

.assessment-summary-card__icon::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 6px;
  background: var(--assessment-color);
}

.automated-saved-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.automated-saved-list__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.automated-saved-list__actions button {
  color: #ea4f8d;
  font-size: var(--ui-meta-font);
}

.scorecard-summary-card {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid #e9dfe4;
  border-radius: 12px;
  background: #ffffff;
}

.scorecard-summary-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.scorecard-summary-card__top strong {
  font-size: var(--ui-tiny-font);
  font-weight: 500;
  color: #3b2d35;
}

.scorecard-summary-card__owner {
  margin: 4px 0 0;
  font-size: var(--ui-tiny-font);
  color: #a09198;
}

.scorecard-summary-card__menu {
  color: #ea4f8d;
  font-size: 16px;
  line-height: 1;
}

.scorecard-summary-card__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.scorecard-summary-card__tags span {
  padding: 2px 6px;
  border-radius: 3px;
  background: #f7eff2;
  color: #8f7e87;
  font-size: 8px;
  line-height: 1.2;
}

.inline-score-builder {
  margin: 14px 0 10px;
}

.inline-score-builder label,
.modal-form label {
  display: block;
  margin: 10px 0 6px;
  font-size: var(--ui-small-font);
  color: #9e8d96;
}

.inline-score-builder__check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--ui-small-font);
  color: #563844;
  justify-content: flex-start;
  line-height: 1;
  cursor: pointer;
}

.inline-score-builder__check-icon {
  width: 12px;
  height: 12px;
  border: 1px solid #e58cab;
  border-radius: 999px;
  position: relative;
  flex: 0 0 auto;
  display: inline-block;
  vertical-align: middle;
}

.inline-score-builder__check-icon::before,
.inline-score-builder__check-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: #e45893;
  transform: translate(-50%, -50%);
}

.inline-score-builder__check-icon::before {
  width: 6px;
  height: 1px;
}

.inline-score-builder__check-icon::after {
  width: 1px;
  height: 6px;
}

.inline-score-builder input,
.modal-form input,
.modal-form textarea {
  width: 100%;
  border: 1px solid #eee4e8;
  border-radius: var(--ui-radius-sm);
  background: #faf8f9;
  padding: 10px 12px;
  color: #6e6168;
  font-size: var(--ui-meta-font);
  font-family: inherit;
}

.inline-score-builder :deep(.dropdown__trigger) {
  height: var(--ui-control-sm-height);
  min-height: var(--ui-control-sm-height);
  padding: 0 36px 0 12px;
  border-radius: var(--ui-radius-sm);
  background: #fff;
  font-size: var(--ui-small-font);
}

.inline-score-builder :deep(.dropdown__value) {
  font-size: var(--ui-small-font);
}

.inline-score-builder :deep(.dropdown__arrow) {
  right: 12px;
  width: 6px;
  height: 6px;
}

.inline-score-builder__helper {
  margin: 8px 0 0;
  font-size: var(--ui-meta-font);
  line-height: 1.4;
}

.inline-score-builder__helper--warning {
  color: #d38aa6;
}

.modal-form textarea {
  min-height: 88px;
  resize: none;
}

.modal-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stage-module__add {
  display: block;
  width: 100%;
  min-height: var(--ui-button-xs-height);
  margin-top: 10px;
  border-radius: var(--ui-radius-xs);
  background: #ea4f8d;
  color: #ffffff;
  font-size: var(--ui-meta-font);
  font-weight: 600;
}

.stage-shell__append-row {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: var(--surface-gap);
  margin-top: 16px;
}

.stage-shell__append-input {
  width: 100%;
  min-height: var(--ui-control-sm-height);
  padding: 0 14px;
  border: 1px solid #f2e4ea;
  border-radius: var(--ui-radius-sm);
  background: #fff;
  color: #6e6168;
  font-size: var(--ui-small-font);
}

.stage-shell__append {
  display: block;
  width: 100%;
  min-height: var(--ui-control-sm-height);
  border: 1px dashed #f2e4ea;
  border-radius: var(--ui-radius-sm);
  color: #ea4f8d;
  font-size: var(--ui-small-font);
  text-align: center;
}

.job-stages-step__api-feedback {
  margin: 10px 4px 0;
  font-size: var(--ui-small-font);
}

.job-stages-step__api-feedback--success {
  color: #2f8f53;
}

.job-stages-step__api-feedback--error {
  color: #d33f70;
}

.job-stages-step__footer {
  width: 100%;
  max-width: 100%;
  margin: 16px auto 0;
  display: flex;
  justify-content: flex-end;
}

.job-stages-step__next,
.modal-primary {
  min-width: 78px;
  height: var(--ui-button-sm-height);
  padding: 0 14px;
  border-radius: var(--ui-radius-sm);
  background: #ea4f8d;
  color: #ffffff;
  font-size: var(--ui-small-font);
  font-weight: 600;
}

.modal-primary--small {
  min-width: 64px;
}

.job-stages-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(23, 17, 27, 0.28);
  backdrop-filter: blur(5px);
  padding: 28px;
  z-index: 1000;
}

.job-stages-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(calc(100vw - 48px), 620px);
  max-height: calc(100vh - 80px);
  padding: 18px 18px 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #f1e1e8;
  box-shadow: 0 30px 70px rgba(24, 17, 22, 0.24);
  overflow-y: auto;
  z-index: 1001;
}

.job-stages-modal--wide {
  width: min(calc(100vw - 48px), 700px);
}

.job-stages-modal--scorecard {
  width: min(calc(100vw - 48px), 780px);
  padding: 18px 22px 20px;
}

.job-stages-modal--questions {
  width: min(calc(100vw - 48px), 780px);
  min-height: 420px;
  padding-bottom: 72px;
}

.job-stages-modal:has(.wizard-mini-tabs--scorecard) {
  width: min(calc(100vw - 48px), 780px);
}

.job-stages-modal__close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #fff3f7;
  color: #f08db2;
  font-size: 20px;
  font-weight: 600;
  line-height: 0.9;
}

.job-stages-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f4e8ed;
}

.job-stages-modal__title-wrap h4 {
  margin: 0;
  font-size: 13px;
  color: #3b2d35;
  text-transform: capitalize;
}

.job-stages-modal__context {
  margin: 4px 0 0;
  font-size: var(--ui-meta-font);
  color: #c18aa0;
}

.job-stages-modal__icon {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  background: #fff0f6;
  color: #ea4f8d;
  position: relative;
}

.job-stages-modal__icon::before {
  content: '';
  width: 8px;
  height: 8px;
  border: 1.5px solid #ea4f8d;
  border-radius: 2px;
  box-sizing: border-box;
}

.job-stages-modal--scorecard .job-stages-modal__title-wrap {
  margin-bottom: 16px;
}

.job-stages-modal--scorecard .job-stages-modal__title-wrap h4 {
  font-size: 16px;
  font-weight: 600;
  text-transform: none;
}

.saved-scorecards__head,
.saved-scorecards__row {
  display: grid;
  grid-template-columns: 14px 1fr 1fr auto;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 0 10px;
  font-size: 10px;
}

.saved-scorecards__head {
  border-radius: 8px;
  background: #fdeaf1;
  color: #8f7080;
  margin-bottom: 8px;
}

.saved-scorecards__row {
  color: #8b7983;
  border-bottom: 1px solid #f6edf1;
}

.saved-scorecards__row button {
  color: #ea4f8d;
  font-size: 10px;
}

.saved-scorecards__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.saved-scorecards__select {
  display: inline-grid;
  place-items: center;
}

.saved-scorecards__dot,
.saved-scorecards__radio {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ea4f8d;
}

.saved-scorecards__radio {
  background: #ffffff;
  border: 1px solid #f1cad8;
}

.saved-scorecards__radio--active {
  background: #ea4f8d;
}

.assessment-list__action {
  font-size: var(--ui-meta-font);
  font-weight: 600;
}

.assessment-list__action--active {
  opacity: 0.7;
 }

.scorecard-api-feedback {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.4;
}

.scorecard-api-feedback--success {
  color: #1d8f46;
}

.scorecard-api-feedback--error {
  color: #d13c6a;
}

.wizard-mini-tabs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 10px;
}

.wizard-mini-tabs button {
  position: relative;
  padding-top: 12px;
  padding-bottom: 0;
  border-bottom: 2px solid transparent;
  color: #ccb8c2;
  font-size: 11px;
  line-height: 1.25;
  text-align: left;
}

.wizard-mini-tabs button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  border-radius: 999px;
  background: #f0dbe4;
}

.wizard-mini-tabs--scorecard button:nth-child(1)::before { background: #ff5a93; }
.wizard-mini-tabs--scorecard button:nth-child(2)::before { background: #8ea7ff; }
.wizard-mini-tabs--scorecard button:nth-child(3)::before { background: #cab2f5; }
.wizard-mini-tabs--scorecard button:nth-child(4)::before { background: #f6d48d; }
.wizard-mini-tabs--scorecard button:nth-child(5)::before { background: #9be4cf; }
.wizard-mini-tabs--scorecard button:nth-child(6)::before { background: #f1b4ce; }

.wizard-mini-tabs .is-current {
  color: #ea4f8d;
  font-weight: 600;
}

.wizard-mini-tabs .is-current::before {
  height: 3px;
}

.job-stages-modal--questions .wizard-mini-tabs button {
  font-size: 10px;
}

.job-stages-modal--questions .modal-form label {
  margin: 0 0 8px;
  font-size: 12px;
  color: #958790;
}

.job-stages-modal--questions .modal-primary {
  position: absolute;
  left: 22px;
  bottom: 18px;
}

.modal-form--scorecard label {
  margin: 0 0 8px;
  font-size: 12px;
  color: #9b9097;
}

.modal-form--scorecard > label + .dropdown,
.modal-form--scorecard > label + input,
.modal-form--scorecard > label + textarea,
.modal-form--scorecard .modal-form__grid,
.modal-form--scorecard .modal-form__grid + label {
  margin-bottom: 12px;
}

.modal-form--scorecard .modal-form__grid {
  gap: 18px;
}

.modal-form--scorecard input,
.modal-form--scorecard textarea {
  border: 1px solid #ebdfe5;
  border-radius: 6px;
  background: #fcfbfc;
  padding: 11px 12px;
  color: #7c6f77;
  font-size: 13px;
}

.modal-form--scorecard textarea {
  min-height: 126px;
  line-height: 1.45;
}

.modal-options {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.modal-options--questions {
  margin-top: 10px;
}

.modal-empty {
  margin: 0;
  color: #b9a8b1;
  font-size: 13px;
}

.modal-option {
  min-height: 46px;
  padding: 0 14px;
  border-radius: 6px;
  background: var(--option-color);
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  justify-content: flex-start;
}

.modal-option__check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  position: relative;
  flex: 0 0 auto;
}

.modal-option__check::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 5px;
  width: 5px;
  height: 9px;
  border-right: 2px solid var(--option-color);
  border-bottom: 2px solid var(--option-color);
  transform: rotate(45deg);
}

.question-pick {
  position: relative;
  margin-bottom: 14px;
}

.question-pick input {
  height: 62px;
  padding: 0 58px 0 20px;
  font-size: 17px;
  border-radius: 14px;
  background: #fcfbfc;
}

.question-pick__add {
  position: absolute;
  top: 50%;
  right: 14px;
  width: 28px;
  height: 28px;
  border: 1px solid #cfc2c8;
  border-radius: 999px;
  color: #8f8189;
  display: grid;
  place-items: center;
  font-size: 22px;
  line-height: 1;
  transform: translateY(-50%);
}

.modal-pills,
.skill-tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.modal-pill,
.skill-tag-grid__item {
  min-height: 24px;
  padding: 0 10px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  color: #ffffff;
  font-size: 10px;
}

.modal-pill--pink {
  background: #ea4f8d;
}

.modal-pill--blue {
  background: #4f7dff;
}

.skill-tag-grid__item {
  background: var(--tag-color);
}

.modal-separator {
  margin: 14px 0;
  text-align: center;
  color: #cab8c2;
  font-size: 10px;
}

.modal-helper {
  margin: 10px 0 0;
  color: #ea4f8d;
  font-size: 10px;
}

.modal-helper-link {
  color: #ea4f8d;
  font-size: 11px;
  text-align: left;
}

.modal-form--automated {
  padding-top: 2px;
}

.automated-title {
  margin: 0 0 6px;
  color: #ea4f8d;
  font-size: 12px;
  font-weight: 600;
}

.automated-copy {
  margin: 0 0 14px;
  color: #c1b2ba;
  font-size: 11px;
  line-height: 1.35;
}

.modal-separator--automated {
  margin: 18px 0;
}

.automated-add {
  width: 100%;
  min-height: 42px;
  border: 1px dashed #f1e4ea;
  border-radius: 8px;
  background: #fff;
  color: #ff5a93;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 12px;
}


.success-card {
  min-height: 280px;
  display: grid;
  place-items: center;
  text-align: center;
}

.success-card__mark {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #ffd6e5, #ea4f8d);
  color: #ffffff;
  font-size: 34px;
  box-shadow: 0 16px 28px rgba(234, 79, 141, 0.24);
}

.success-card p {
  margin: 12px 0;
  color: #9c8791;
  font-size: 11px;
}

.success-card__actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.preview-card {
  display: grid;
  gap: 12px;
}

.preview-card__section {
  border: 1px solid #f2e3ea;
  border-radius: 14px;
  padding: 12px;
  background: #fffafc;
}

.preview-card__label {
  margin-bottom: 8px;
  font-size: 11px;
  color: #ab8898;
}

.preview-card__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #61545c;
  font-size: 11px;
}

.preview-strip {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 500;
  box-shadow: 0 10px 20px rgba(78, 51, 64, 0.08);
}

.preview-stars {
  letter-spacing: 1px;
  font-size: 14px;
  line-height: 1;
}

.preview-strip--pink {
  background: #ea4f8d;
}

.preview-strip--blue {
  background: #4f7dff;
}

.preview-note {
  padding: 14px 12px;
  border-radius: 12px;
  color: #ffffff;
  background: linear-gradient(135deg, #f05c9a 0%, #e5488c 100%);
  font-size: 11px;
  line-height: 1.45;
  box-shadow: 0 12px 24px rgba(234, 79, 141, 0.16);
}

.preview-card textarea {
  width: 100%;
  min-height: 90px;
  border: 1px solid #eddce5;
  border-radius: 10px;
  background: #fff;
  padding: 12px;
  color: #9c8791;
  font-size: 11px;
  line-height: 1.4;
  resize: none;
}

.assessment-list {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.assessment-list__item {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid #f2e7ec;
  border-radius: 8px;
}

.assessment-list__icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--assessment-color) 16%, white);
  color: var(--assessment-color);
  font-size: 10px;
  font-weight: 700;
}

.assessment-list__item strong {
  display: block;
  font-size: 10px;
  color: #594d54;
}

.assessment-list__item p {
  margin: 4px 0 0;
  font-size: 9px;
  line-height: 1.35;
  color: #b5a6ae;
}

.assessment-list__item button {
  font-size: 10px;
}

.toggle-field {
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid #eee4e8;
  border-radius: 8px;
  background: #faf8f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #85757d;
  font-size: 10px;
}

@media (max-width: 900px) {
  .competency-grid,
  .question-grid,
  .workflow-grid,
  .workflow-grid--split,
  .preview-grid {
    grid-template-columns: 1fr !important;
  }

  .stage-builder__row,
  .workflow-card__row,
  .preview-card__row,
  .success-card__actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .stage-shell,
  .accordion-card,
  .preview-card__section {
    padding: 14px;
  }

  .assessment-list__item {
    grid-template-columns: 24px 1fr;
  }

  .assessment-list__item button {
    grid-column: 1 / -1;
    justify-self: stretch;
  }

  .preview-strip,
  .success-card__actions {
    flex-wrap: wrap;
  }
}
</style>


