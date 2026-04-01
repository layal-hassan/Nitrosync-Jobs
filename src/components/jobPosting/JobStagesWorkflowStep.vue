<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import stageNotebookImage from '../../assets/jobPosting/stage-notebook.png'
import hiredConfettiImage from '../../assets/jobPosting/hired-confetti.png'
import hiredFigureImage from '../../assets/jobPosting/hired-figure.png'
import {
  changeNitroSyncCandidatesEvaluation,
  changeNitroSyncCandidatesJobStage,
} from '../../composables/useNitroSyncCandidatesActions'
import {
  createNitroSyncJobStage,
  deleteNitroSyncJobStage,
  fetchNitroSyncJobStage,
  fetchNitroSyncJobStageCandidates,
  fetchNitroSyncJobStages,
  updateNitroSyncJobStage,
} from '../../composables/useNitroSyncJobStages'
import { getNitroSyncErrorMessage } from '../../composables/nitroSyncApi'
import { createNitroSyncCandidatesAssign } from '../../composables/useNitroSyncCandidatesAssigns'
import { createNitroSyncCandidatesDisqualificant } from '../../composables/useNitroSyncCandidatesDisqualificants'
import { createNitroSyncCandidatesInterview } from '../../composables/useNitroSyncCandidatesInterviews'
import { createNitroSyncCandidatesNote } from '../../composables/useNitroSyncCandidatesNotes'
import { createNitroSyncCandidatesTag } from '../../composables/useNitroSyncCandidatesTags'
import { sendNitroSyncEmail, emailTimeoutMs } from '../../composables/useNitroSyncEmail'

const props = defineProps({
  relatedCompany: {
    type: String,
    default: 'b00af2a4-2d77-432b-bd93-4e7ea120d154',
  },
  stageRows: {
    type: Array,
    default: () => [],
  },
})
const emit = defineEmits(['stage-rows-updated'])

const showAddStageModal = ref(false)
const showAddStageSuccessModal = ref(false)
const showEditStageModal = ref(false)
const showDeleteStageModal = ref(false)
const showSendEmailModal = ref(false)
const showExpandedEmailEditor = ref(false)
const showExpandedAssignEditor = ref(false)
const showAddNotesModal = ref(false)
const showAddTagsModal = ref(false)
const showShareProfileModal = ref(false)
const showAddTeamMemberModal = ref(false)
const showSendTestModal = ref(false)
const showDisqualifyModal = ref(false)
const showDisqualifySavedEmailMenu = ref(false)
const showScheduleInterviewModal = ref(false)
const showScheduleSuccessModal = ref(false)
const showScheduleInterviewTypeMenu = ref(false)
const showAssignModal = ref(false)
const showAssignActionModal = ref(false)
const showAssignAiMenu = ref(true)
const activeAssignCandidateMenu = ref(null)
const assignMenuTop = ref(16)
const assignSubmenuTop = ref(98)
const newStageName = ref('')
const editStageName = ref('')
const selectedStageColumn = ref(null)
const showStatusMenu = ref(false)
const showJobTitleMenu = ref(true)
const activeCandidateMenu = ref(null)
const activeStageMenu = ref(null)
const createCandidateEmail = (name) =>
  `${String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '')}@example.com`

const selectedCandidate = ref({ name: 'Devon Lane', role: '5 Stars', email: createCandidateEmail('Devon Lane') })
const defaultTagColor = '#4f7dff'
const defaultCreatedTags = [
  {
    name: 'High Salary',
    color: '#35d06a',
  },
]
const tagInput = ref('')
const selectedTagColor = ref(defaultTagColor)
const tagCandidateUuid = ref('')
const tagSaving = ref(false)
const tagMessage = ref('')
const tagError = ref('')
const createdTags = ref([...defaultCreatedTags])
const shareProfilePermission = ref('candidate Profile')
const shareProfileUrl = ref('https://www.youtube.com/watch?v=8rdUZDcL_XM')
const teamMemberInput = ref('Member Name')
const noteAuthor = ref('Elias Diab')
const disqualifyReason = ref('')
const disqualifyPoolOption = ref('add')
const disqualifySavedEmail = ref('Please Select')
const disqualifyEmailBody = ref(
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.'
)
const disqualifyCandidateUuid = ref('')
const showNoteForm = ref(false)
const noteTitleInput = ref('')
const noteDescriptionInput = ref('')
const editingNoteIndex = ref(null)
const noteCandidateUuid = ref('')
const noteSaving = ref(false)
const noteMessage = ref('')
const noteError = ref('')
const emailTitle = ref('')
const emailBody = ref(
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.'
)
const assignEmployeeName = ref('')
const assignTitle = ref('')
const assignBackgroundInfo = ref(
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.'
)
const assignReminderEnabled = ref(true)
const assignDueDate = ref('Please Select')
const assignAlertTime = ref('01:00')
const assignCandidateUuid = ref('')
const assignActionLoading = ref(false)
const assignActionMessage = ref('')
const assignActionError = ref('')
const scheduleCandidateInfo = ref('')
const scheduleCandidateUuid = ref('')
const schedulePosition = ref('')
const scheduleEmail = ref('')
const scheduleInterviewDetails = ref('')
const scheduleDate = ref('')
const scheduleTime = ref('')
const scheduleDuration = ref(45)
const scheduleMeetingLink = ref('')
const schedulePhone = ref('')
const scheduleInterviewType = ref('')
const scheduleLocation = ref('')
const scheduleSendEmailToCandidate = ref(true)
const scheduleAddToCalendar = ref(true)
const sendEmailLoading = ref(false)
const sendEmailMessage = ref('')
const sendEmailError = ref('')
const disqualifyEmailLoading = ref(false)
const disqualifyEmailMessage = ref('')
const disqualifyEmailError = ref('')
const disqualifyEmailDebug = ref('')
const scheduleEmailLoading = ref(false)
const scheduleEmailMessage = ref('')
const scheduleEmailError = ref('')
const assignCandidates = [
  'Theresa Webb',
  'Darrell Steward',
  'Courtney Henry',
  'Brooklyn Simmons',
  'Cody Fisher',
]
const selectedAssignCandidates = ref([])
const candidateUuidByName = ref({})
const candidateStageUuid = ref('')
const candidateEvaluation = ref('')
const candidateActionLoading = ref(false)
const candidateActionMessage = ref('')
const candidateActionError = ref('')
const stageActionLoading = ref(false)
const stageActionMessage = ref('')
const stageActionError = ref('')
const teamMembers = [
  { name: 'Member Name', color: '#ff5c8a' },
  { name: 'Member Name', color: '#35d06a' },
  { name: 'Member Name', color: '#4f7dff' },
  { name: 'Member Name', color: '#ff5c8a' },
  { name: 'Member Name', color: '#6b21d8' },
  { name: 'Member Name', color: '#4f7dff' },
  { name: 'Member Name', color: '#f4b21b' },
  { name: 'Member Name', color: '#6b21d8' },
]
const notes = ref([
  {
    title: 'Note title will be shown here.',
    description:
      'Praesent auctor purus luctus nunc egestas, ac scelerisque ante pulvinar. Donec ut rhoncus ex.',
    author: 'Elias Diab',
  },
])
const listedTests = [
  { title: 'Human Resources Experience Test', questions: 12, minutes: 50, difficulty: 35 },
  { title: 'Human Resources Experience Test', questions: 12, minutes: 50, difficulty: 35 },
  { title: 'Human Resources Experience Test', questions: 12, minutes: 50, difficulty: 35 },
]

const statusOptions = [
  { label: 'Published', color: '#4f7dff' },
  { label: 'Archived', color: '#6b21d8' },
  { label: 'Closed', color: '#f4b21b' },
  { label: 'Un-Published', color: '#41c86a' },
]

const selectedStatus = ref(statusOptions[0])

const candidateMenuItems = [
  'Send welcome email',
  'Add Notes',
  'Edit Profile',
  'Add Tags',
  'Share Profile',
  'Send Email',
  'Send Test',
  'Assign',
  'Move Candidate',
  'Delete',
  'Add team member',
  'Add/ Change Evaluation',
  'Check evaluation',
  'Send NPS',
  'Disqualify',
  'Add to Pool',
  'Schedule an Interview',
  'Send Offer/Contract',
  'Onboarding Setup',
  'Mark as Hired',
  'Update HR System',
]

const fallbackStageColumns = [
  {
    title: 'new',
    isOpen: true,
    color: '#e94b8a',
    cards: [],
  },
  {
    title: 'screen',
    isOpen: true,
    color: '#4f7dff',
    cards: [],
  },
  {
    title: 'testing',
    isOpen: true,
    color: '#6b21d8',
    cards: [],
  },
  {
    title: 'interview',
    isOpen: true,
    color: '#f4b21b',
    cards: [],
  },
  {
    title: 'shortlisted',
    isOpen: true,
    color: '#41c86a',
    cards: [],
  },
  {
    title: 'hired',
    isOpen: true,
    color: '#e94b8a',
    cards: [],
  },
]

const stagePalette = ['#e94b8a', '#4f7dff', '#6b21d8', '#f4b21b', '#41c86a', '#ff8a4f']

const mapStageRowsToColumns = (rows = []) => {
  if (!Array.isArray(rows) || !rows.length) {
    return fallbackStageColumns
  }

  return rows.map((row, index) => ({
    title: String(row.label || `Stage ${index + 1}`).toLowerCase(),
    displayTitle: String(row.label || `Stage ${index + 1}`),
    jobStageUuid: row.jobStageUuid || '',
    isOpen: row.enabled ?? true,
    color: stagePalette[index % stagePalette.length],
    cards: Array.isArray(row.cards) ? row.cards : [],
  }))
}

const stageColumns = ref(mapStageRowsToColumns(props.stageRows))

const openAddStageModal = () => {
  showAddStageSuccessModal.value = false
  showAddStageModal.value = true
  stageActionMessage.value = ''
  stageActionError.value = ''
}

const closeAddStageModal = () => {
  showAddStageModal.value = false
  newStageName.value = ''
}

const closeEditStageModal = () => {
  showEditStageModal.value = false
  editStageName.value = ''
  selectedStageColumn.value = null
}

const closeDeleteStageModal = () => {
  showDeleteStageModal.value = false
  selectedStageColumn.value = null
}

const emitCurrentStages = () => {
  emit('stage-rows-updated', stageColumns.value.map((column) => ({
    jobStageUuid: column.jobStageUuid || '',
    label: column.displayTitle || column.title,
    enabled: column.isOpen,
  })))
}

const fetchWorkflowStages = async () => {
  stageActionLoading.value = true
  stageActionError.value = ''

  try {
    const rows = await fetchNitroSyncJobStages(props.relatedCompany)
    if (rows.length) {
      const hydratedRows = await Promise.all(
        rows.map(async (row) => {
          if (Array.isArray(row.cards) && row.cards.length) {
            return row
          }

          if (!row.jobStageUuid) {
            return {
              ...row,
              cards: Array.isArray(row.cards) ? row.cards : [],
            }
          }

          try {
            const cards = await fetchNitroSyncJobStageCandidates(row.jobStageUuid)
            return {
              ...row,
              cards,
            }
          } catch (error) {
            console.error('Failed to fetch stage candidates', {
              jobStageUuid: row.jobStageUuid,
              error,
            })

            return {
              ...row,
              cards: Array.isArray(row.cards) ? row.cards : [],
            }
          }
        }),
      )

      stageColumns.value = mapStageRowsToColumns(hydratedRows)
      emit('stage-rows-updated', hydratedRows)
      return
    }

    if (!stageColumns.value.length) {
      stageColumns.value = [...fallbackStageColumns]
    }
  } catch (error) {
    console.error('Failed to fetch workflow stages', error)
    if (!stageColumns.value.length) {
      stageColumns.value = [...fallbackStageColumns]
      stageActionError.value = getNitroSyncErrorMessage(error, 'Could not load workflow stages.')
    }
  } finally {
    stageActionLoading.value = false
  }
}

const submitAddStage = async () => {
  if (!newStageName.value.trim()) {
    stageActionError.value = 'Stage name is required.'
    stageActionMessage.value = ''
    return
  }

  stageActionLoading.value = true
  stageActionMessage.value = ''
  stageActionError.value = ''

  try {
    const result = await createNitroSyncJobStage({
      related_company: props.relatedCompany,
      stage_name: newStageName.value.trim(),
    })

    await fetchWorkflowStages()
    showAddStageModal.value = false
    showAddStageSuccessModal.value = true
    stageActionMessage.value = result.message || 'Stage created successfully.'
    newStageName.value = ''
  } catch (error) {
    console.error('Failed to create workflow stage', error)
    stageActionError.value = getNitroSyncErrorMessage(error, 'Failed to create stage.')
  } finally {
    stageActionLoading.value = false
  }
}

const closeAddStageSuccessModal = () => {
  showAddStageSuccessModal.value = false
}

const addAnotherStage = () => {
  showAddStageSuccessModal.value = false
  showAddStageModal.value = true
  newStageName.value = ''
}

const toggleStage = (column) => {
  column.isOpen = !column.isOpen
  emitCurrentStages()
}

const toggleStageMenu = (stageTitle) => {
  activeStageMenu.value = activeStageMenu.value === stageTitle ? null : stageTitle
}

const openStageCandidatesModal = () => {
  activeStageMenu.value = null
  showAssignModal.value = true
  showAssignAiMenu.value = false
}

const openDeleteStageModal = (column) => {
  if (!column?.jobStageUuid) {
    stageActionError.value = 'This stage does not have a job_stage_uuid yet.'
    stageActionMessage.value = ''
    return
  }

  activeStageMenu.value = null
  selectedStageColumn.value = column
  showDeleteStageModal.value = true
}

const deleteStage = async () => {
  const column = selectedStageColumn.value
  if (!column?.jobStageUuid) {
    stageActionError.value = 'This stage does not have a job_stage_uuid yet.'
    stageActionMessage.value = ''
    return
  }

  stageActionLoading.value = true
  stageActionMessage.value = ''
  stageActionError.value = ''
  activeStageMenu.value = null

  try {
    const result = await deleteNitroSyncJobStage({
      job_stage_uuid: column.jobStageUuid,
      related_company: props.relatedCompany,
    })

    await fetchWorkflowStages()
    stageActionMessage.value = result.message || 'Stage deleted successfully.'
    closeDeleteStageModal()
  } catch (error) {
    console.error('Failed to delete stage', error)
    stageActionError.value = getNitroSyncErrorMessage(error, 'Failed to delete stage.')
  } finally {
    stageActionLoading.value = false
  }
}

const openEditStageModal = async (column) => {
  if (!column?.jobStageUuid) {
    stageActionError.value = 'This stage does not have a job_stage_uuid yet.'
    stageActionMessage.value = ''
    return
  }

  stageActionLoading.value = true
  stageActionMessage.value = ''
  stageActionError.value = ''

  try {
    const current = await fetchNitroSyncJobStage({
      job_stage_uuid: column.jobStageUuid,
      related_company: props.relatedCompany,
    })
    const currentName =
      current?.data?.stage_name ||
      current?.data?.label ||
      column.displayTitle ||
      column.title
    activeStageMenu.value = null
    selectedStageColumn.value = column
    editStageName.value = String(currentName || '').trim()
    showEditStageModal.value = true
  } catch (error) {
    console.error('Failed to edit stage', error)
    stageActionError.value = getNitroSyncErrorMessage(error, 'Failed to edit stage.')
  } finally {
    stageActionLoading.value = false
  }
}

const editStage = async () => {
  const column = selectedStageColumn.value
  const nextName = String(editStageName.value || '').trim()

  if (!column?.jobStageUuid) {
    stageActionError.value = 'This stage does not have a job_stage_uuid yet.'
    stageActionMessage.value = ''
    return
  }

  if (!nextName) {
    stageActionError.value = 'Stage name is required.'
    stageActionMessage.value = ''
    return
  }

  stageActionLoading.value = true
  stageActionMessage.value = ''
  stageActionError.value = ''

  try {
    const result = await updateNitroSyncJobStage({
      job_stage_uuid: column.jobStageUuid,
      related_company: props.relatedCompany,
      stage_name: nextName,
    })

    await fetchWorkflowStages()
    stageActionMessage.value = result.message || 'Stage updated successfully.'
    closeEditStageModal()
  } catch (error) {
    console.error('Failed to edit stage', error)
    stageActionError.value = getNitroSyncErrorMessage(error, 'Failed to edit stage.')
  } finally {
    stageActionLoading.value = false
  }
}

const toggleStatusMenu = () => {
  showStatusMenu.value = !showStatusMenu.value
}

const selectStatus = (option) => {
  selectedStatus.value = option
  showStatusMenu.value = false
}

const toggleJobTitleMenu = () => {
  showJobTitleMenu.value = !showJobTitleMenu.value
}

const toggleCandidateMenu = (menuKey) => {
  activeCandidateMenu.value = activeCandidateMenu.value === menuKey ? null : menuKey
}

const getCandidateUuidFromCard = (card) =>
  String(card?.candidate_uuid ?? card?.candidateUuid ?? '').trim()

const handleCandidateMenuAction = (item, card) => {
  activeCandidateMenu.value = null

  if (item === 'Send Email') {
    selectedCandidate.value = { name: card.name, role: '5 Stars', email: card.email || createCandidateEmail(card.name) }
    emailTitle.value = ''
    sendEmailMessage.value = ''
    sendEmailError.value = ''
    showSendEmailModal.value = true
  }

  if (item === 'Add Tags') {
    selectedCandidate.value = {
      name: card.name,
      role: '5 Stars',
      candidateUuid: getCandidateUuidFromCard(card),
    }
    tagCandidateUuid.value = getCandidateUuidFromCard(card)
    tagInput.value = ''
    selectedTagColor.value = defaultTagColor
    createdTags.value = [...defaultCreatedTags]
    tagMessage.value = ''
    tagError.value = ''
    showAddTagsModal.value = true
  }

  if (item === 'Add Notes') {
    selectedCandidate.value = { name: card.name, role: '5 Stars' }
    showNoteForm.value = false
    editingNoteIndex.value = null
    noteCandidateUuid.value = ''
    noteMessage.value = ''
    noteError.value = ''
    showAddNotesModal.value = true
  }

  if (item === 'Share Profile') {
    selectedCandidate.value = { name: card.name, role: '5 Stars' }
    showShareProfileModal.value = true
  }

  if (item === 'Add team member') {
    selectedCandidate.value = { name: card.name, role: '5 Stars' }
    showAddTeamMemberModal.value = true
  }

  if (item === 'Send Test') {
    selectedCandidate.value = { name: card.name, role: '5 Stars' }
    showSendTestModal.value = true
  }

  if (item === 'Disqualify') {
    selectedCandidate.value = { name: card.name, role: '5 Stars', email: card.email || createCandidateEmail(card.name) }
    disqualifyCandidateUuid.value = ''
    disqualifyReason.value = ''
    disqualifyPoolOption.value = 'add'
    disqualifySavedEmail.value = 'Please Select'
    disqualifyEmailMessage.value = ''
    disqualifyEmailError.value = ''
    showDisqualifyModal.value = true
  }

  if (item === 'Schedule an Interview') {
    selectedCandidate.value = { name: card.name, role: '5 Stars', email: card.email || createCandidateEmail(card.name) }
    scheduleCandidateUuid.value = ''
    scheduleCandidateInfo.value = card.name
    schedulePosition.value = ''
    scheduleEmail.value = card.email || createCandidateEmail(card.name)
    scheduleInterviewDetails.value = ''
    scheduleDate.value = ''
    scheduleTime.value = ''
    scheduleDuration.value = 45
    scheduleMeetingLink.value = ''
    schedulePhone.value = ''
    scheduleInterviewType.value = ''
    scheduleLocation.value = ''
    scheduleSendEmailToCandidate.value = true
    scheduleAddToCalendar.value = true
    scheduleEmailMessage.value = ''
    scheduleEmailError.value = ''
    showScheduleInterviewModal.value = true
  }

  if (item === 'Assign') {
    selectedCandidate.value = { name: card.name, role: '5 Stars', email: card.email || createCandidateEmail(card.name) }
    assignEmployeeName.value = ''
    assignTitle.value = ''
    assignReminderEnabled.value = true
    assignDueDate.value = ''
    assignAlertTime.value = '01:00'
    assignCandidateUuid.value = ''
    assignActionMessage.value = ''
    assignActionError.value = ''
    showAssignActionModal.value = true
  }
}

const closeSendEmailModal = () => {
  showSendEmailModal.value = false
  showExpandedEmailEditor.value = false
}

const closeAddTagsModal = () => {
  showAddTagsModal.value = false
  tagCandidateUuid.value = ''
  tagInput.value = ''
  selectedTagColor.value = defaultTagColor
  createdTags.value = [...defaultCreatedTags]
  tagMessage.value = ''
  tagError.value = ''
}

const saveTag = async () => {
  const nextTagName = tagInput.value.trim()

  if (!tagCandidateUuid.value.trim()) {
    tagError.value = 'Candidate UUID is required.'
    tagMessage.value = ''
    return
  }

  if (!nextTagName) {
    tagError.value = 'Tag name is required.'
    tagMessage.value = ''
    return
  }

  tagSaving.value = true
  tagMessage.value = ''
  tagError.value = ''

  try {
    const result = await createNitroSyncCandidatesTag({
      related_company: props.relatedCompany,
      candidates: [
        {
          candidate_uuid: tagCandidateUuid.value.trim(),
        },
      ],
      tags: [
        {
          name: nextTagName,
          color: selectedTagColor.value,
        },
      ],
    })

    createdTags.value = [
      ...createdTags.value,
      {
        name: nextTagName,
        color: selectedTagColor.value,
      },
    ]
    tagMessage.value = result.message || 'Tag created successfully.'
    tagInput.value = ''
  } catch (error) {
    tagError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to create tag.'
  } finally {
    tagSaving.value = false
  }
}

const closeAddNotesModal = () => {
  showAddNotesModal.value = false
  showNoteForm.value = false
  noteTitleInput.value = ''
  noteDescriptionInput.value = ''
  editingNoteIndex.value = null
  noteCandidateUuid.value = ''
  noteMessage.value = ''
  noteError.value = ''
}

const openAddNoteForm = () => {
  showNoteForm.value = true
  editingNoteIndex.value = null
  noteTitleInput.value = ''
  noteDescriptionInput.value = ''
}

const editNote = (index) => {
  const note = notes.value[index]
  showNoteForm.value = true
  editingNoteIndex.value = index
  noteTitleInput.value = note.title
  noteDescriptionInput.value = note.description
}

const deleteNote = (index) => {
  notes.value = notes.value.filter((_, itemIndex) => itemIndex !== index)
}

const saveNote = async () => {
  const title = noteTitleInput.value.trim()
  const description = noteDescriptionInput.value.trim()

  if (!noteCandidateUuid.value.trim()) {
    noteError.value = 'Candidate UUID is required.'
    noteMessage.value = ''
    return
  }

  if (!title) {
    noteError.value = 'Note title is required.'
    noteMessage.value = ''
    return
  }

  if (!description) {
    noteError.value = 'Description is required.'
    noteMessage.value = ''
    return
  }

  noteSaving.value = true
  noteMessage.value = ''
  noteError.value = ''

  try {
    const result = await createNitroSyncCandidatesNote({
      candidate_uuid: noteCandidateUuid.value.trim(),
      related_company: props.relatedCompany,
      notes: [
        {
          title,
          description,
        },
      ],
    })

    if (editingNoteIndex.value !== null) {
      notes.value[editingNoteIndex.value] = {
        ...notes.value[editingNoteIndex.value],
        title,
        description,
        author: noteAuthor.value,
      }
    } else {
      notes.value.unshift({
        title,
        description,
        author: noteAuthor.value,
      })
    }

    noteMessage.value = result.message || 'Note created successfully.'
    showNoteForm.value = false
    editingNoteIndex.value = null
    noteTitleInput.value = ''
    noteDescriptionInput.value = ''
  } catch (error) {
    noteError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to create note.'
  } finally {
    noteSaving.value = false
  }
}

const closeShareProfileModal = () => {
  showShareProfileModal.value = false
}

const closeAddTeamMemberModal = () => {
  showAddTeamMemberModal.value = false
}

const closeSendTestModal = () => {
  showSendTestModal.value = false
}

const closeDisqualifyModal = () => {
  showDisqualifyModal.value = false
  showDisqualifySavedEmailMenu.value = false
  disqualifyCandidateUuid.value = ''
  disqualifyEmailDebug.value = ''
}

const closeScheduleInterviewModal = () => {
  showScheduleInterviewModal.value = false
  showScheduleInterviewTypeMenu.value = false
}

const submitScheduleInterview = async () => {
  if (!scheduleCandidateUuid.value.trim()) {
    scheduleEmailError.value = 'Candidate UUID is required.'
    scheduleEmailMessage.value = ''
    return
  }

  if (!scheduleCandidateInfo.value.trim()) {
    scheduleEmailError.value = 'Candidate name is required.'
    scheduleEmailMessage.value = ''
    return
  }

  if (!schedulePosition.value.trim()) {
    scheduleEmailError.value = 'Position is required.'
    scheduleEmailMessage.value = ''
    return
  }

  if (!scheduleEmail.value.trim()) {
    scheduleEmailError.value = 'Email is required.'
    scheduleEmailMessage.value = ''
    return
  }

  if (!scheduleInterviewDetails.value.trim()) {
    scheduleEmailError.value = 'Interview details are required.'
    scheduleEmailMessage.value = ''
    return
  }

  if (!scheduleDate.value.trim()) {
    scheduleEmailError.value = 'Date is required.'
    scheduleEmailMessage.value = ''
    return
  }

  if (!scheduleTime.value.trim()) {
    scheduleEmailError.value = 'Time is required.'
    scheduleEmailMessage.value = ''
    return
  }

  if (!String(scheduleDuration.value).trim()) {
    scheduleEmailError.value = 'Duration is required.'
    scheduleEmailMessage.value = ''
    return
  }

  if (!schedulePhone.value.trim()) {
    scheduleEmailError.value = 'Phone is required.'
    scheduleEmailMessage.value = ''
    return
  }

  if (!scheduleInterviewType.value.trim()) {
    scheduleEmailError.value = 'Interview type is required.'
    scheduleEmailMessage.value = ''
    return
  }

  if (!scheduleLocation.value.trim()) {
    scheduleEmailError.value = 'Location is required.'
    scheduleEmailMessage.value = ''
    return
  }

  scheduleEmailLoading.value = true
  scheduleEmailMessage.value = ''
  scheduleEmailError.value = ''

  try {
    const result = await createNitroSyncCandidatesInterview({
      candidate_uuid: scheduleCandidateUuid.value.trim(),
      related_company: props.relatedCompany,
      candidate_name: scheduleCandidateInfo.value.trim(),
      position: schedulePosition.value.trim(),
      email: scheduleEmail.value.trim(),
      interview_details: scheduleInterviewDetails.value.trim(),
      date: scheduleDate.value.trim(),
      time: scheduleTime.value.trim(),
      duration_minutes: String(scheduleDuration.value).trim(),
      phone: schedulePhone.value.trim(),
      interview_type: scheduleInterviewType.value.trim(),
      location: scheduleLocation.value.trim(),
      send_email: scheduleSendEmailToCandidate.value ? 'yes' : 'no',
      add_to_calendar: scheduleAddToCalendar.value ? 'yes' : 'no',
    })

    scheduleEmailMessage.value = result.message || 'Interview scheduled successfully.'
    showScheduleInterviewModal.value = false
    showScheduleInterviewTypeMenu.value = false
    showScheduleSuccessModal.value = true
  } catch (error) {
    scheduleEmailError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to create interview.'
  } finally {
    scheduleEmailLoading.value = false
  }
}

const closeScheduleSuccessModal = () => {
  showScheduleSuccessModal.value = false
}

const toggleScheduleInterviewTypeMenu = () => {
  showScheduleInterviewTypeMenu.value = !showScheduleInterviewTypeMenu.value
}

const selectScheduleInterviewType = (option) => {
  scheduleInterviewType.value = option
  showScheduleInterviewTypeMenu.value = false
}

const toggleDisqualifySavedEmailMenu = () => {
  showDisqualifySavedEmailMenu.value = !showDisqualifySavedEmailMenu.value
}

const selectDisqualifySavedEmail = (option) => {
  disqualifySavedEmail.value = option
  showDisqualifySavedEmailMenu.value = false
}

const openExpandedEmailEditor = () => {
  showExpandedEmailEditor.value = true
}

const closeExpandedEmailEditor = () => {
  showExpandedEmailEditor.value = false
}

const submitCandidateEmail = async () => {
  if (sendEmailLoading.value) return

  sendEmailLoading.value = true
  sendEmailMessage.value = ''
  sendEmailError.value = ''

  try {
    const result = await sendNitroSyncEmail({
      subject: emailTitle.value || `Message for ${selectedCandidate.value.name}`,
      body: emailBody.value,
      to: [selectedCandidate.value.email],
    })

    sendEmailMessage.value = result.message || 'Email sent successfully.'
    closeSendEmailModal()
  } catch (error) {
    const isTimeoutError = error?.code === 'ECONNABORTED' || String(error?.message || '').includes('timeout')
    sendEmailError.value = isTimeoutError
      ? `The email request took longer than ${emailTimeoutMs / 1000} seconds. Please try again.`
      : error?.response?.data?.message || error?.message || 'Failed to send email.'
  } finally {
    sendEmailLoading.value = false
  }
}

const submitDisqualifyEmail = async () => {
  if (disqualifyEmailLoading.value) return
  const candidateUuid = disqualifyCandidateUuid.value.trim()
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!candidateUuid) {
    disqualifyEmailError.value = 'Candidate UUID is required.'
    disqualifyEmailMessage.value = ''
    disqualifyEmailDebug.value = ''
    return
  }

  if (!uuidPattern.test(candidateUuid)) {
    disqualifyEmailError.value = 'Enter a valid candidate UUID.'
    disqualifyEmailMessage.value = ''
    disqualifyEmailDebug.value = ''
    return
  }

  if (!disqualifyReason.value.trim()) {
    disqualifyEmailError.value = 'Reason is required.'
    disqualifyEmailMessage.value = ''
    disqualifyEmailDebug.value = ''
    return
  }

  disqualifyEmailLoading.value = true
  disqualifyEmailMessage.value = ''
  disqualifyEmailError.value = ''
  disqualifyEmailDebug.value = ''

  try {
    const payload = {
      related_company: props.relatedCompany,
      reason: disqualifyReason.value.trim(),
      added_to_pool: disqualifyPoolOption.value === 'add' ? 'yes' : 'no',
      send_rejection_email: disqualifySavedEmail.value === 'Please Select' ? 'no' : 'yes',
      email_body: disqualifySavedEmail.value === 'Custom Email'
        ? disqualifyEmailBody.value.trim()
        : '',
      candidates: [
        {
          candidate_uuid: candidateUuid,
        },
      ],
    }
    const result = await createNitroSyncCandidatesDisqualificant(payload)

    disqualifyEmailMessage.value = result.message || 'Candidate disqualified successfully.'
  } catch (error) {
    const status = error?.response?.status
    const responseBody = error?.response?.data
    console.error('Failed to disqualify candidate', {
      status,
      responseBody,
      candidate_uuid: candidateUuid,
    })
    disqualifyEmailError.value =
      responseBody?.message ||
      responseBody?.detail ||
      (status ? `API error ${status}.` : '') ||
      error?.message ||
      'Failed to disqualify candidate.'
    disqualifyEmailDebug.value = [
      status ? `status: ${status}` : '',
      responseBody ? `response: ${JSON.stringify(responseBody, null, 2)}` : '',
    ].filter(Boolean).join('\n')
  } finally {
    disqualifyEmailLoading.value = false
  }
}

const openExpandedAssignEditor = () => {
  showExpandedAssignEditor.value = true
}

const closeExpandedAssignEditor = () => {
  showExpandedAssignEditor.value = false
}

const closeAssignModal = () => {
  showAssignModal.value = false
  showAssignAiMenu.value = false
  activeAssignCandidateMenu.value = null
  selectedAssignCandidates.value = []
  candidateActionMessage.value = ''
  candidateActionError.value = ''
}

const closeAssignActionModal = () => {
  showAssignActionModal.value = false
  showExpandedAssignEditor.value = false
  assignActionMessage.value = ''
  assignActionError.value = ''
}

const submitAssignAction = async () => {
  if (!assignCandidateUuid.value.trim()) {
    assignActionError.value = 'Candidate UUID is required.'
    assignActionMessage.value = ''
    return
  }

  if (!assignEmployeeName.value.trim()) {
    assignActionError.value = 'Employee name is required.'
    assignActionMessage.value = ''
    return
  }

  if (!assignTitle.value.trim()) {
    assignActionError.value = 'Title is required.'
    assignActionMessage.value = ''
    return
  }

  if (!assignBackgroundInfo.value.trim()) {
    assignActionError.value = 'Candidate background information is required.'
    assignActionMessage.value = ''
    return
  }

  if (!assignDueDate.value.trim()) {
    assignActionError.value = 'Reminder duration is required.'
    assignActionMessage.value = ''
    return
  }

  if (!assignAlertTime.value.trim()) {
    assignActionError.value = 'Reminder time is required.'
    assignActionMessage.value = ''
    return
  }

  assignActionLoading.value = true
  assignActionMessage.value = ''
  assignActionError.value = ''

  try {
    const result = await createNitroSyncCandidatesAssign({
      related_company: props.relatedCompany,
      employee_name: assignEmployeeName.value.trim(),
      title: assignTitle.value.trim(),
      candidate_background_information: assignBackgroundInfo.value.trim(),
      reminder_duration: assignDueDate.value.trim(),
      reminder_time: assignAlertTime.value.trim(),
      candidates: [
        {
          candidate_uuid: assignCandidateUuid.value.trim(),
        },
      ],
    })

    assignActionMessage.value = result.message || 'Candidate assign created successfully.'
  } catch (error) {
    console.error('Failed to create candidate assign', error)
    assignActionError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.msg ||
      'Failed to create candidate assign.'
  } finally {
    assignActionLoading.value = false
  }
}

const toggleAssignCandidateMenu = (candidateName) => {
  activeAssignCandidateMenu.value =
    activeAssignCandidateMenu.value === candidateName ? null : candidateName
  showAssignAiMenu.value = activeAssignCandidateMenu.value !== null
}

const openAssignCandidateMenu = (candidateName, event) => {
  const triggerRect = event.currentTarget.getBoundingClientRect()
  const modalRect = event.currentTarget
    .closest('.workflow-assign__modal')
    .getBoundingClientRect()

  assignMenuTop.value = triggerRect.top - modalRect.top - 6
  assignSubmenuTop.value = assignMenuTop.value + 118
  toggleAssignCandidateMenu(candidateName)
}

const allAssignCandidatesSelected = computed(
  () =>
    assignCandidates.length > 0 &&
    selectedAssignCandidates.value.length === assignCandidates.length
)

const toggleAssignCandidateSelection = (candidateName) => {
  if (selectedAssignCandidates.value.includes(candidateName)) {
    selectedAssignCandidates.value = selectedAssignCandidates.value.filter((name) => name !== candidateName)
    return
  }

  selectedAssignCandidates.value = [...selectedAssignCandidates.value, candidateName]
}

const toggleSelectAllAssignCandidates = () => {
  if (allAssignCandidatesSelected.value) {
    selectedAssignCandidates.value = []
    return
  }

  selectedAssignCandidates.value = [...assignCandidates]
}

const buildSelectedCandidatesPayload = () =>
  selectedAssignCandidates.value
    .map((candidateName) => ({
      candidate_uuid: String(candidateUuidByName.value[candidateName] || '').trim(),
    }))
    .filter((candidate) => candidate.candidate_uuid)

const applyCandidateStageChange = async () => {
  const candidates = buildSelectedCandidatesPayload()

  if (!candidateStageUuid.value.trim()) {
    candidateActionError.value = 'Job stage UUID is required.'
    candidateActionMessage.value = ''
    return
  }

  if (!candidates.length) {
    candidateActionError.value = 'Select candidates and enter candidate UUID values first.'
    candidateActionMessage.value = ''
    return
  }

  candidateActionLoading.value = true
  candidateActionMessage.value = ''
  candidateActionError.value = ''

  try {
    const result = await changeNitroSyncCandidatesJobStage({
      related_company: props.relatedCompany,
      job_stage_uuid: candidateStageUuid.value.trim(),
      candidates,
    })

    candidateActionMessage.value = result.message || 'Candidate stage updated successfully.'
  } catch (error) {
    console.error('Failed to change candidate job stage', error)
    candidateActionError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.msg ||
      'Failed to change candidate job stage.'
  } finally {
    candidateActionLoading.value = false
  }
}

const applyCandidateEvaluationChange = async () => {
  const candidates = buildSelectedCandidatesPayload()

  if (!candidateEvaluation.value.trim()) {
    candidateActionError.value = 'Evaluation is required.'
    candidateActionMessage.value = ''
    return
  }

  if (!candidates.length) {
    candidateActionError.value = 'Select candidates and enter candidate UUID values first.'
    candidateActionMessage.value = ''
    return
  }

  candidateActionLoading.value = true
  candidateActionMessage.value = ''
  candidateActionError.value = ''

  try {
    const result = await changeNitroSyncCandidatesEvaluation({
      related_company: props.relatedCompany,
      evaluation: candidateEvaluation.value.trim(),
      candidates,
    })

    candidateActionMessage.value = result.message || 'Candidate evaluation updated successfully.'
  } catch (error) {
    console.error('Failed to change candidate evaluation', error)
    candidateActionError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.msg ||
      'Failed to change candidate evaluation.'
  } finally {
    candidateActionLoading.value = false
  }
}

const closeAllMenus = () => {
  activeCandidateMenu.value = null
  activeStageMenu.value = null
  showStatusMenu.value = false
  showJobTitleMenu.value = false
  showDisqualifySavedEmailMenu.value = false
  showScheduleInterviewTypeMenu.value = false
}

const handleDocumentClick = () => {
  closeAllMenus()
}

onMounted(() => {
  if (Array.isArray(props.stageRows) && props.stageRows.length) {
    stageColumns.value = mapStageRowsToColumns(props.stageRows)
  }
  fetchWorkflowStages()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

watch(
  () => props.stageRows,
  (rows) => {
    if (Array.isArray(rows) && rows.length) {
      stageColumns.value = mapStageRowsToColumns(rows)
    }
  },
  { deep: true },
)

watch(
  () => props.relatedCompany,
  (value, previousValue) => {
    if (!String(value || '').trim() || value === previousValue) return
    fetchWorkflowStages()
  },
)
</script>

<template>
  <div class="job-stages-workflow">
    <div class="workflow-toolbar">
      <div class="workflow-toolbar__left">
        <span class="workflow-toolbar__title">Job stages</span>
        <div class="workflow-toolbar__tags">
          <button
            type="button"
            class="workflow-toolbar__tag workflow-toolbar__tag--root"
            @click.stop="toggleJobTitleMenu"
          >
            <span class="workflow-toolbar__tag-icon"></span>
            <span>Job titles</span>
            <span class="workflow-toolbar__tag-chevron">⌄</span>
          </button>

          <div v-if="showJobTitleMenu" class="workflow-toolbar__tag-children" @click.stop>
            <button type="button" class="workflow-toolbar__tag workflow-toolbar__tag--child">
              <span class="workflow-toolbar__tag-icon"></span>
              <span>Accounting</span>
            </button>
            <button type="button" class="workflow-toolbar__tag workflow-toolbar__tag--child">
              <span class="workflow-toolbar__tag-icon"></span>
              <span>Software Engineer</span>
            </button>
          </div>
        </div>
      </div>

      <div class="workflow-toolbar__right">
        <button type="button" class="workflow-toolbar__search">
          <span class="workflow-toolbar__search-icon"></span>
          <span>Search</span>
        </button>

        <div class="workflow-toolbar__status-wrap">
          <button type="button" class="workflow-toolbar__status" @click.stop="toggleStatusMenu">
            <span
              class="workflow-toolbar__status-dot"
              :style="{ backgroundColor: selectedStatus.color }"
            ></span>
            <span>{{ selectedStatus.label }}</span>
            <span class="workflow-toolbar__chevron">⌄</span>
          </button>

          <div v-if="showStatusMenu" class="workflow-toolbar__status-menu" @click.stop>
            <button
              v-for="option in statusOptions"
              :key="option.label"
              type="button"
              class="workflow-toolbar__status-option"
              @click="selectStatus(option)"
            >
              <span
                class="workflow-toolbar__status-dot"
                :style="{ backgroundColor: option.color }"
              ></span>
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>

        <button type="button" class="workflow-toolbar__add" @click="openAddStageModal">
          + Add a stage
        </button>
      </div>
    </div>

    <p v-if="stageActionMessage" class="workflow-stage-feedback workflow-stage-feedback--success">{{ stageActionMessage }}</p>
    <p v-if="stageActionError" class="workflow-stage-feedback workflow-stage-feedback--error">{{ stageActionError }}</p>

    <div
      v-for="column in stageColumns"
      :key="column.jobStageUuid || column.title"
      class="workflow-stage"
      :class="{ 'workflow-stage--collapsed': !column.isOpen }"
    >
      <div class="workflow-stage__header">
        <div class="workflow-stage__title-wrap">
          <button
            type="button"
            class="workflow-stage__title-button"
            :style="{ color: column.color }"
            @click.stop="toggleStageMenu(column.title)"
          >
            <span class="workflow-stage__dot" :style="{ backgroundColor: column.color }"></span>
            <span>{{ column.displayTitle || column.title }}</span>
          </button>

          <div
            v-if="activeStageMenu === column.title"
            class="workflow-stage__menu"
            @click.stop
          >
            <button type="button" class="workflow-stage__menu-item workflow-stage__menu-item--delete" @click="openDeleteStageModal(column)">
              <span class="workflow-stage__menu-icon workflow-stage__menu-icon--trash">🗑</span>
              <span>Delete</span>
            </button>
            <button type="button" class="workflow-stage__menu-item" @click="openEditStageModal(column)">
              <span class="workflow-stage__menu-icon workflow-stage__menu-icon--edit">✎</span>
              <span>Edit Stage Name</span>
            </button>
            <button type="button" class="workflow-stage__menu-item" @click="openStageCandidatesModal">
              <span class="workflow-stage__menu-icon workflow-stage__menu-icon--view">👁</span>
              <span>Show candidate stage</span>
            </button>
          </div>
        </div>
        <button
          type="button"
          class="workflow-stage__action"
          :class="{ 'workflow-stage__action--collapsed': !column.isOpen }"
          @click="toggleStage(column)"
        >
          ⌃
        </button>
      </div>

      <div v-if="column.isOpen" class="workflow-stage__lane">
        <article
          v-for="(card, index) in column.cards"
          :key="`${column.title}-${card.name}-${index}`"
          class="workflow-card"
        >
          <span class="workflow-card__avatar"></span>
          <div class="workflow-card__body">
            <strong>{{ card.name }}</strong>
            <span>{{ card.role }}</span>
          </div>
          <div class="workflow-card__menu-wrap">
            <button
              type="button"
              class="workflow-card__more"
              @click.stop="toggleCandidateMenu(`${column.title}-${index}`)"
            >
              ⋯
            </button>

            <div
              v-if="activeCandidateMenu === `${column.title}-${index}`"
              class="workflow-card__menu"
              @click.stop
            >
              <button
                v-for="item in candidateMenuItems"
                :key="item"
                type="button"
                class="workflow-card__menu-item"
                @click="handleCandidateMenuAction(item, card)"
              >
                <span>{{ item }}</span>
                <span
                  v-if="item === 'Move Candidate' || item === 'Delete'"
                  class="workflow-card__menu-arrow"
                >
                  ›
                </span>
              </button>
            </div>
          </div>
        </article>

        <div v-if="!column.cards.length" class="workflow-stage__empty">
          No candidates loaded for this stage.
        </div>
      </div>

      <div v-if="column.isOpen && column.cards.length" class="workflow-stage__footer">
        <span class="workflow-stage__footer-text">VIEW 01 of 03</span>
        <div class="workflow-stage__pagination" aria-label="Stage pagination">
          <button type="button" class="workflow-stage__page-arrow workflow-stage__page-arrow--prev">
            ‹
          </button>
          <span class="workflow-stage__page-dot"></span>
          <button type="button" class="workflow-stage__page-arrow workflow-stage__page-arrow--next">
            ›
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAddStageModal" class="workflow-modal-overlay">
      <div class="workflow-modal">
        <button type="button" class="workflow-modal__close" @click="closeAddStageModal">×</button>
        <h4>Add stage</h4>
        <label>stage Name</label>
        <input v-model="newStageName" type="text" placeholder="Add a new stage" />
        <button type="button" class="workflow-modal__submit" :disabled="stageActionLoading" @click="submitAddStage">
          {{ stageActionLoading ? 'Saving...' : 'Done' }}
        </button>
      </div>
    </div>

    <div v-if="showAddStageSuccessModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--success">
        <button type="button" class="workflow-modal__close" @click="closeAddStageSuccessModal">
          ×
        </button>
        <h4>Add stage</h4>
        <img
          :src="stageNotebookImage"
          alt="Stage added successfully"
          class="workflow-modal__success-image"
        />
        <p class="workflow-modal__success-text">A new stage has been added successfully.</p>
        <button
          type="button"
          class="workflow-modal__submit workflow-modal__submit--success"
          @click="addAnotherStage"
        >
          Add Another one
        </button>
      </div>
    </div>

    <div v-if="showEditStageModal" class="workflow-modal-overlay">
      <div class="workflow-modal">
        <button type="button" class="workflow-modal__close" @click="closeEditStageModal">أ—</button>
        <h4>Edit stage name</h4>
        <label>Stage name</label>
        <input v-model="editStageName" type="text" placeholder="Update stage name" />
        <button type="button" class="workflow-modal__submit" :disabled="stageActionLoading" @click="editStage">
          {{ stageActionLoading ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <div v-if="showDeleteStageModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--compact">
        <button type="button" class="workflow-modal__close" @click="closeDeleteStageModal">أ—</button>
        <h4>Delete stage</h4>
        <p class="workflow-modal__success-text">
          Delete <strong>{{ selectedStageColumn?.displayTitle || selectedStageColumn?.title }}</strong> stage?
        </p>
        <button
          type="button"
          class="workflow-modal__submit workflow-modal__submit--danger"
          :disabled="stageActionLoading"
          @click="deleteStage"
        >
          {{ stageActionLoading ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>

    <div v-if="showSendEmailModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--email">
        <button type="button" class="workflow-modal__close" @click="closeSendEmailModal">×</button>
        <div class="workflow-email__title-row">
          <span class="workflow-email__icon">✉</span>
          <h4>Send an Email</h4>
        </div>

        <div class="workflow-email__section">
          <label>Name</label>
          <div class="workflow-email__candidate">
            <span class="workflow-email__avatar"></span>
            <div class="workflow-email__candidate-text">
              <strong>{{ selectedCandidate.name }}</strong>
              <span>{{ selectedCandidate.role }}</span>
              <span>{{ selectedCandidate.email }}</span>
            </div>
          </div>
        </div>

        <div class="workflow-email__section">
          <label>Email Title</label>
          <input v-model="emailTitle" type="text" />
        </div>

        <div class="workflow-email__section">
          <label>Email</label>
          <div class="workflow-email__editor">
            <div class="workflow-email__toolbar">
              <button type="button" class="workflow-email__tool">B</button>
              <button type="button" class="workflow-email__tool workflow-email__tool--italic">I</button>
              <button type="button" class="workflow-email__tool workflow-email__tool--underline">U</button>
              <button type="button" class="workflow-email__tool">S</button>
              <button type="button" class="workflow-email__tool">&lt;/&gt;</button>
              <button type="button" class="workflow-email__tool">🎨</button>
              <button type="button" class="workflow-email__tool">•</button>
              <button type="button" class="workflow-email__tool">1.</button>
              <button type="button" class="workflow-email__tool">🔗</button>
              <button type="button" class="workflow-email__tool">🖼</button>
              <button type="button" class="workflow-email__tool">&lt;/&gt;</button>
              <button type="button" class="workflow-email__tool">❞</button>
              <button type="button" class="workflow-email__tool">−</button>
              <button
                type="button"
                class="workflow-email__tool workflow-email__expand"
                @click="openExpandedEmailEditor"
              >
                ⤢
              </button>
            </div>
            <textarea v-model="emailBody"></textarea>
          </div>
        </div>

        <button
          type="button"
          class="workflow-modal__submit workflow-modal__submit--email"
          :disabled="sendEmailLoading"
          @click="submitCandidateEmail"
        >
          {{ sendEmailLoading ? 'Sending...' : 'Send Email' }}
        </button>
        <p v-if="sendEmailMessage" class="workflow-email__feedback workflow-email__feedback--success">{{ sendEmailMessage }}</p>
        <p v-if="sendEmailError" class="workflow-email__feedback workflow-email__feedback--error">{{ sendEmailError }}</p>
      </div>
    </div>

    <div v-if="showAddTagsModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--compact">
        <button type="button" class="workflow-modal__close" @click="closeAddTagsModal">×</button>
        <div class="workflow-simple__title-row workflow-disqualify__header-row" @click="closeDisqualifyModal">
          <span class="workflow-simple__icon">⊕</span>
          <h4>Add Tags</h4>
        </div>

        <div class="workflow-simple__section">
          <label>Candidate UUID</label>
          <input v-model="tagCandidateUuid" type="text" placeholder="Paste candidate UUID" />
        </div>

        <div class="workflow-simple__section">
          <label>Tags</label>
          <input v-model="tagInput" type="text" />
        </div>

        <div class="workflow-simple__section">
          <label>Tag color</label>
          <div class="workflow-tag-colors">
            <button type="button" class="workflow-tag-color" style="background:#ff5c8a" @click="selectedTagColor = '#ff5c8a'"></button>
            <button type="button" class="workflow-tag-color" style="background:#4f7dff" @click="selectedTagColor = '#4f7dff'"></button>
            <button type="button" class="workflow-tag-color" style="background:#6b21d8" @click="selectedTagColor = '#6b21d8'"></button>
            <button type="button" class="workflow-tag-color" style="background:#f4b21b" @click="selectedTagColor = '#f4b21b'"></button>
            <button type="button" class="workflow-tag-color" style="background:#35d06a" @click="selectedTagColor = '#35d06a'"></button>
            <button type="button" class="workflow-tag-color" style="background:#ff6f9f" @click="selectedTagColor = '#ff6f9f'"></button>
            <button type="button" class="workflow-tag-color" style="background:#4f7dff" @click="selectedTagColor = '#4f7dff'"></button>
            <button type="button" class="workflow-tag-color" style="background:#6b21d8" @click="selectedTagColor = '#6b21d8'"></button>
          </div>
        </div>

          <div v-if="createdTags.length || tagInput.trim()" class="workflow-tag-pills">
            <span
              v-for="tag in createdTags"
              :key="`${tag.name}-${tag.color}`"
              class="workflow-tag-pill"
              :style="{ backgroundColor: tag.color }"
            >
              {{ tag.name }} ×
            </span>
            <span
              v-if="tagInput.trim()"
              class="workflow-tag-pill workflow-tag-pill--draft"
              :style="{ backgroundColor: selectedTagColor }"
            >
              {{ tagInput.trim() }} ×
            </span>
          </div>

          <button
            type="button"
            class="workflow-modal__submit workflow-modal__submit--small"
            :disabled="tagSaving"
            @click="saveTag"
          >
            {{ tagSaving ? 'Saving...' : 'Submit' }}
          </button>
          <p v-if="tagMessage" class="workflow-email__feedback workflow-email__feedback--success">{{ tagMessage }}</p>
          <p v-if="tagError" class="workflow-email__feedback workflow-email__feedback--error">{{ tagError }}</p>
        </div>
      </div>

        <div v-if="showAddNotesModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--notes">
        <button type="button" class="workflow-modal__close" @click="closeAddNotesModal">×</button>
        <div class="workflow-simple__title-row">
          <span class="workflow-simple__icon">⊕</span>
          <h4>Add Notes</h4>
        </div>

        <div v-for="(note, index) in notes" :key="`${note.title}-${index}`" class="workflow-note-card">
          <strong>{{ note.title }}</strong>
          <p>{{ note.description }}</p>

          <div class="workflow-note-card__author">
            <span class="workflow-note-card__avatar"></span>
            <span>{{ note.author }}</span>
          </div>

          <div class="workflow-note-card__actions">
            <button type="button" @click="deleteNote(index)">Delete</button>
            <button type="button" @click="editNote(index)">Edit</button>
          </div>
        </div>

        <div v-if="showNoteForm" class="workflow-note-form">
          <div class="workflow-simple__section">
            <label>Candidate UUID</label>
            <input v-model="noteCandidateUuid" type="text" placeholder="Paste candidate UUID" />
          </div>

          <div class="workflow-simple__section">
            <label>Note title</label>
            <input v-model="noteTitleInput" type="text" />
          </div>

          <div class="workflow-simple__section">
            <label>Description</label>
            <textarea v-model="noteDescriptionInput" class="workflow-note-form__textarea"></textarea>
          </div>

          <button type="button" class="workflow-modal__submit workflow-modal__submit--small" :disabled="noteSaving" @click="saveNote">
            {{ noteSaving ? 'Saving...' : 'Done' }}
          </button>
          <p v-if="noteMessage" class="workflow-email__feedback workflow-email__feedback--success">{{ noteMessage }}</p>
          <p v-if="noteError" class="workflow-email__feedback workflow-email__feedback--error">{{ noteError }}</p>
        </div>

        <button v-else type="button" class="workflow-note-card__add" @click="openAddNoteForm">+ Add a new Note</button>
      </div>
    </div>
<div v-if="showShareProfileModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--compact">
        <button type="button" class="workflow-modal__close" @click="closeShareProfileModal">×</button>
        <div class="workflow-simple__title-row">
          <span class="workflow-simple__icon">↻</span>
          <h4>Share Profile</h4>
        </div>

        <div class="workflow-simple__section">
          <label>Candidate URL</label>
          <div class="workflow-share-field">
            <input v-model="shareProfileUrl" type="text" />
            <button type="button" class="workflow-share-copy">⧉</button>
          </div>
        </div>

        <div class="workflow-simple__section">
          <label>Anyone has link can view</label>
          <button v-if="false" type="button" class="workflow-share-select">
            <span>{{ shareProfilePermission }}</span>
            <span>⌄</span>
          </button>
        </div>

        <button type="button" class="workflow-modal__submit workflow-modal__submit--small" @click="closeShareProfileModal">
          GOT IT
        </button>
      </div>
    </div>

    <div v-if="showAddTeamMemberModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--team">
        <button type="button" class="workflow-modal__close" @click="closeAddTeamMemberModal">×</button>
        <div class="workflow-simple__title-row">
          <span class="workflow-simple__icon">⊕</span>
          <h4>Add Team Member</h4>
        </div>

        <div class="workflow-team-grid">
          <article
            v-for="(member, index) in teamMembers"
            :key="`${member.name}-${index}`"
            class="workflow-team-card"
          >
            <span class="workflow-team-card__avatar"></span>
            <span class="workflow-team-card__name" :style="{ color: member.color }">{{ member.name }}</span>
            <button type="button" class="workflow-team-card__add" :style="{ color: member.color, borderColor: member.color }">+</button>
          </article>
        </div>

        <div class="workflow-simple__section">
          <label>Name</label>
          <div class="workflow-team-input">
            <div class="workflow-team-input__pill">
              <span class="workflow-team-card__avatar"></span>
              <span>{{ teamMemberInput }}</span>
              <button type="button">×</button>
            </div>
            <button type="button" class="workflow-team-input__add">Add</button>
          </div>
        </div>

        <button type="button" class="workflow-modal__submit workflow-modal__submit--small" @click="closeAddTeamMemberModal">
          GOT IT
        </button>
      </div>
    </div>

    <div v-if="showSendTestModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--test">
        <button type="button" class="workflow-modal__close" @click="closeSendTestModal">×</button>
        <div class="workflow-simple__title-row">
          <span class="workflow-simple__icon">⊕</span>
          <h4>Send Test</h4>
        </div>

        <div class="workflow-test__header">
          <span>Listed Tests(4)</span>
          <button type="button" class="workflow-test__link">+Add Test</button>
        </div>

        <div class="workflow-test__grid">
          <article
            v-for="(test, index) in listedTests"
            :key="`${test.title}-${index}`"
            class="workflow-test-card"
          >
            <h5>{{ test.title }}</h5>
            <div class="workflow-test-card__meta">
              <span>{{ test.questions }} Questions</span>
              <span>{{ test.minutes }} minutes</span>
            </div>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et
              velit interdum, ac aliquet odio mattis.
            </p>
            <div class="workflow-test-card__footer">
              <span>Difficulty Level</span>
              <span>{{ test.difficulty }}%</span>
            </div>
            <div class="workflow-test-card__bar">
              <span :style="{ width: `${test.difficulty}%` }"></span>
            </div>
          </article>
        </div>

        <button type="button" class="workflow-modal__submit workflow-modal__submit--small" @click="closeSendTestModal">
          GOT IT
        </button>
      </div>
    </div>

    <div v-if="showDisqualifyModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--disqualify">
        <button type="button" class="workflow-modal__close" @click="closeDisqualifyModal">×</button>
        <div class="workflow-simple__title-row">
          <span class="workflow-simple__icon">⊖</span>
          <h4>Disqualify Applicant</h4>
        </div>

        <div class="workflow-simple__section">
          <label>Candidate Name</label>
          <div class="workflow-note-card__author">
            <span class="workflow-note-card__avatar"></span>
            <span>{{ selectedCandidate.name }}</span>
          </div>
        </div>

        <div class="workflow-simple__section">
          <label>Candidate UUID</label>
          <input v-model="disqualifyCandidateUuid" type="text" placeholder="Paste candidate UUID" />
        </div>

        <div class="workflow-simple__section">
          <label>Reason</label>
          <button v-if="false" type="button" class="workflow-share-select">
            <span>{{ disqualifyReason || 'Please Select' }}</span>
            <span>⌄</span>
          </button>
          <input v-model="disqualifyReason" type="text" placeholder="Why is the candidate being disqualified?" />
        </div>

        <div class="workflow-simple__section">
          <label>Add applicant to pool</label>
          <label class="workflow-disqualify__option">
            <input v-model="disqualifyPoolOption" type="radio" value="add" />
            <span class="workflow-disqualify__radio"></span>
            <span>Add to Pool</span>
          </label>
          <label class="workflow-disqualify__option">
            <input v-model="disqualifyPoolOption" type="radio" value="no" />
            <span class="workflow-disqualify__radio"></span>
            <span>No, dont add it to pool</span>
          </label>
        </div>

        <div class="workflow-simple__section">
          <label class="workflow-disqualify__title">Send a Rejection Email</label>
          <label>Saved Emails</label>
          <div class="workflow-disqualify__select-wrap">
          <button type="button" class="workflow-share-select" @click.stop="toggleDisqualifySavedEmailMenu">
            <span>{{ disqualifySavedEmail || 'Please Select' }}</span>
            <span>⌄</span>
          </button>
            <div v-if="showDisqualifySavedEmailMenu" class="workflow-disqualify__select-menu" @click.stop>
              <button type="button" @click="selectDisqualifySavedEmail('Please Select')">Please Select</button>
              <button type="button" @click="selectDisqualifySavedEmail('Custom Email')">Custom Email</button>
            </div>
          </div>
        </div>

        <div v-if="disqualifySavedEmail === 'Custom Email'" class="workflow-simple__section">
          <label>Email</label>
          <div class="workflow-email__editor">
            <div class="workflow-email__toolbar">
              <button type="button" class="workflow-email__tool">B</button>
              <button type="button" class="workflow-email__tool workflow-email__tool--italic">I</button>
              <button type="button" class="workflow-email__tool workflow-email__tool--underline">U</button>
              <button type="button" class="workflow-email__tool">S</button>
              <button type="button" class="workflow-email__tool">&lt;/&gt;</button>
              <button type="button" class="workflow-email__tool">🎨</button>
              <button type="button" class="workflow-email__tool">•</button>
              <button type="button" class="workflow-email__tool">1.</button>
              <button type="button" class="workflow-email__tool">🔗</button>
              <button type="button" class="workflow-email__tool">🖼</button>
              <button type="button" class="workflow-email__tool">&lt;/&gt;</button>
              <button type="button" class="workflow-email__tool">❞</button>
              <button type="button" class="workflow-email__tool">−</button>
              <button type="button" class="workflow-email__tool workflow-email__expand">⤢</button>
            </div>
            <textarea v-model="disqualifyEmailBody"></textarea>
          </div>
        </div>

        <button type="button" class="workflow-modal__submit workflow-modal__submit--small" :disabled="disqualifyEmailLoading" @click="submitDisqualifyEmail">
          {{ disqualifyEmailLoading ? 'Sending...' : 'GOT IT' }}
        </button>
        <p v-if="disqualifyEmailMessage" class="workflow-email__feedback workflow-email__feedback--success">{{ disqualifyEmailMessage }}</p>
        <p v-if="disqualifyEmailError" class="workflow-email__feedback workflow-email__feedback--error">{{ disqualifyEmailError }}</p>
        <pre v-if="disqualifyEmailDebug" class="workflow-email__debug">{{ disqualifyEmailDebug }}</pre>
      </div>
    </div>

    <div v-if="showScheduleInterviewModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--schedule">
        <button type="button" class="workflow-modal__close" @click="closeScheduleInterviewModal">×</button>
        <h4>Schedule an Interview</h4>

        <div class="workflow-simple__section">
          <label>Candidate UUID</label>
          <input v-model="scheduleCandidateUuid" type="text" placeholder="Paste candidate UUID" />
        </div>

        <div class="workflow-simple__section">
          <label>Candidate info</label>
          <input v-model="scheduleCandidateInfo" type="text" placeholder="Candidate name" />
        </div>

        <div class="workflow-simple__section">
          <label>Position</label>
          <input v-model="schedulePosition" type="text" placeholder="Ex: Software Engineer" />
        </div>

        <div class="workflow-simple__section">
          <label>Email</label>
          <input v-model="scheduleEmail" type="text" placeholder="name@example.com" />
        </div>

        <div class="workflow-simple__section">
          <label>Interview Details</label>
          <input v-model="scheduleInterviewDetails" type="text" placeholder="Ex: Technical interview" />
          <button v-if="false" type="button" class="workflow-share-select workflow-schedule__select">
            <span>{{ scheduleInterviewDetails }}</span>
            <span>✓</span>
          </button>
        </div>

        <div class="workflow-schedule__row">
          <div class="workflow-simple__section">
            <label>Date</label>
            <button v-if="false" type="button" class="workflow-share-select workflow-schedule__select workflow-schedule__select--icon">
              <span>{{ scheduleDate }}</span>
              <span>📅</span>
            </button>
            <input v-model="scheduleDate" type="date" />
          </div>

          <div class="workflow-simple__section">
            <label>Time</label>
            <div v-if="false" class="workflow-schedule__time-row">
              <button type="button" class="workflow-share-select workflow-schedule__select workflow-schedule__select--icon">
                <span>{{ scheduleTime }}</span>
                <span>⏲</span>
              </button>
              <button type="button" class="workflow-share-select workflow-schedule__time-unit">
                <span>00</span>
              </button>
            </div>
            <input v-model="scheduleTime" type="time" />
          </div>
        </div>

        <div class="workflow-simple__section">
          <label>Duration (minutes)</label>
          <div class="workflow-schedule__durations">
            <label class="workflow-schedule__duration">
              <input v-model="scheduleDuration" type="radio" :value="30" />
              <span class="workflow-schedule__duration-radio"></span>
              <span>30</span>
            </label>
            <label class="workflow-schedule__duration">
              <input v-model="scheduleDuration" type="radio" :value="45" />
              <span class="workflow-schedule__duration-radio"></span>
              <span>45</span>
            </label>
            <label class="workflow-schedule__duration">
              <input v-model="scheduleDuration" type="radio" :value="60" />
              <span class="workflow-schedule__duration-radio"></span>
              <span>60</span>
            </label>
          </div>
          <input v-model="scheduleMeetingLink" type="text" placeholder="URL/Phone Number" />
        </div>

        <div class="workflow-simple__section">
          <label>Phone</label>
          <input v-model="schedulePhone" type="text" placeholder="Phone number" />
        </div>

        <div class="workflow-simple__section workflow-schedule__type-wrap">
          <label>Interview Type</label>
          <button
            type="button"
            class="workflow-share-select workflow-schedule__select"
            @click.stop="toggleScheduleInterviewTypeMenu"
          >
            <span>{{ scheduleInterviewType || 'Select interview type' }}</span>
            <span>✓</span>
          </button>

          <div v-if="showScheduleInterviewTypeMenu" class="workflow-schedule__type-menu" @click.stop>
            <button type="button" @click="selectScheduleInterviewType('Phone')">Phone</button>
            <button type="button" @click="selectScheduleInterviewType('On-site')">On-site</button>
            <button type="button" @click="selectScheduleInterviewType('Video')">Video</button>
          </div>
        </div>

        <div class="workflow-simple__section">
          <label>Location</label>
          <button v-if="false" type="button" class="workflow-share-select workflow-schedule__select workflow-schedule__select--icon">
            <span>{{ scheduleLocation }}</span>
            <span>📍</span>
          </button>
          <input v-model="scheduleLocation" type="text" placeholder="Location" />
        </div>

        <div class="workflow-simple__section">
          <label>Notes</label>
          <div class="workflow-schedule__notes">
            <label class="workflow-schedule__note-check">
              <input v-model="scheduleSendEmailToCandidate" type="checkbox" />
              <span class="workflow-schedule__checkbox"></span>
              <span>Send email to the Candidate</span>
            </label>
            <label class="workflow-schedule__note-check">
              <input v-model="scheduleAddToCalendar" type="checkbox" />
              <span class="workflow-schedule__checkbox"></span>
              <span>Add to Calendar</span>
            </label>
          </div>
        </div>

        <div class="workflow-schedule__actions">
          <button type="button" class="workflow-modal__submit workflow-modal__submit--small" :disabled="scheduleEmailLoading" @click="submitScheduleInterview">
            {{ scheduleEmailLoading ? 'Sending...' : 'NEXT' }}
          </button>
          <p v-if="scheduleEmailMessage" class="workflow-email__feedback workflow-email__feedback--success">{{ scheduleEmailMessage }}</p>
          <p v-if="scheduleEmailError" class="workflow-email__feedback workflow-email__feedback--error">{{ scheduleEmailError }}</p>
        </div>
      </div>
    </div>

    <div v-if="showScheduleSuccessModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--hired-success">
        <button type="button" class="workflow-modal__close" @click="closeScheduleSuccessModal">×</button>
        <img :src="hiredConfettiImage" alt="" class="workflow-hired-success__confetti" />
        <p class="workflow-hired-success__eyebrow">You've found the one!</p>
        <img :src="hiredFigureImage" alt="Hired candidate celebration" class="workflow-hired-success__figure" />
        <h4>Congratulations</h4>
        <p class="workflow-hired-success__text">
          "{{ selectedCandidate.name }}" is officially hired.
          You've just added the perfect match to your team.
          Time to celebrate - and prepare for onboarding!
        </p>
        <button type="button" class="workflow-modal__submit workflow-modal__submit--hired" @click="closeScheduleSuccessModal">
          view Candidate Profile
        </button>
      </div>
    </div>

    <div v-if="showExpandedEmailEditor" class="workflow-modal-overlay">
      <div class="workflow-email__expanded">
        <div class="workflow-email__toolbar workflow-email__toolbar--expanded">
          <button type="button" class="workflow-email__tool">B</button>
          <button type="button" class="workflow-email__tool workflow-email__tool--italic">I</button>
          <button type="button" class="workflow-email__tool workflow-email__tool--underline">U</button>
          <button type="button" class="workflow-email__tool">S</button>
          <button type="button" class="workflow-email__tool">&lt;/&gt;</button>
          <button type="button" class="workflow-email__tool">🎨</button>
          <button type="button" class="workflow-email__tool">•</button>
          <button type="button" class="workflow-email__tool">1.</button>
          <button type="button" class="workflow-email__tool">🔗</button>
          <button type="button" class="workflow-email__tool">🖼</button>
          <button type="button" class="workflow-email__tool">&lt;/&gt;</button>
          <button type="button" class="workflow-email__tool">❞</button>
          <button type="button" class="workflow-email__tool">−</button>
          <button
            type="button"
            class="workflow-email__tool workflow-email__expand workflow-email__expand--close"
            @click="closeExpandedEmailEditor"
          >
            ⤡
          </button>
        </div>
        <textarea v-model="emailBody" class="workflow-email__expanded-textarea"></textarea>
      </div>
    </div>

    <div v-if="showAssignActionModal" class="workflow-modal-overlay">
      <div class="workflow-modal workflow-modal--assign-action">
        <button type="button" class="workflow-modal__close" @click="closeAssignActionModal">x</button>
        <div class="workflow-simple__title-row workflow-assign-action__header">
          <span class="workflow-simple__icon">+</span>
          <h4>Assign</h4>
        </div>

        <div class="workflow-simple__section workflow-assign-action__section">
          <label>Candidate</label>
          <input :value="selectedCandidate.name" type="text" readonly />
        </div>

        <div class="workflow-simple__section workflow-assign-action__section">
          <label>Candidate UUID</label>
          <input v-model="assignCandidateUuid" type="text" placeholder="Paste candidate UUID" />
        </div>

        <div class="workflow-simple__section workflow-assign-action__section">
          <label>Employee Name</label>
          <div class="workflow-assign-action__inline-field">
            <input v-model="assignEmployeeName" type="text" placeholder="Ex: Accountant in a Bank" />
            <button type="button" class="workflow-assign-action__inline-button">Add</button>
          </div>
        </div>

        <div class="workflow-simple__section workflow-assign-action__section">
          <label>Title</label>
          <input v-model="assignTitle" type="text" placeholder="Ex: Accountant in a Bank" />
        </div>

        <div class="workflow-simple__section workflow-assign-action__section">
          <label>Candidate Background Information</label>
          <div class="workflow-email__editor workflow-assign-action__editor">
            <div class="workflow-email__toolbar">
              <button type="button" class="workflow-email__tool">B</button>
              <button type="button" class="workflow-email__tool workflow-email__tool--italic">I</button>
              <button type="button" class="workflow-email__tool workflow-email__tool--underline">U</button>
              <button type="button" class="workflow-email__tool">S</button>
              <button type="button" class="workflow-email__tool">⌫</button>
              <button type="button" class="workflow-email__tool">🎨</button>
              <button type="button" class="workflow-email__tool">•</button>
              <button type="button" class="workflow-email__tool">1.</button>
              <button type="button" class="workflow-email__tool">🔗</button>
              <button type="button" class="workflow-email__tool">🖼</button>
              <button type="button" class="workflow-email__tool">&lt;/&gt;</button>
              <button type="button" class="workflow-email__tool">❝</button>
              <button type="button" class="workflow-email__tool">−</button>
              <button
                type="button"
                class="workflow-email__tool workflow-email__expand"
                @click="openExpandedAssignEditor"
              >
                ⤢
              </button>
            </div>
            <textarea v-model="assignBackgroundInfo"></textarea>
          </div>
        </div>

        <div class="workflow-simple__section workflow-assign-action__section">
          <div class="workflow-assign-action__reminder-row">
            <label>Get Reminder</label>
            <button
              type="button"
              class="workflow-assign-action__toggle"
              :class="{ 'workflow-assign-action__toggle--active': assignReminderEnabled }"
              @click="assignReminderEnabled = !assignReminderEnabled"
            >
              <span></span>
            </button>
          </div>

          <div v-if="false" class="workflow-assign-action__reminder-fields workflow-assign-action__reminder-fields--legacy">
            <div>
              <label>Due Date</label>
              <button type="button" class="workflow-share-select workflow-assign-action__select">
                <span>{{ assignDueDate }}</span>
                <span>⌄</span>
              </button>
            </div>
            <div>
              <label>Alert Time</label>
              <button type="button" class="workflow-share-select workflow-assign-action__select">
                <span>{{ assignAlertTime }}</span>
                <span>◌</span>
              </button>
            </div>
          </div>
        </div>

        <div class="workflow-assign-action__reminder-fields">
          <div>
            <label>Reminder Duration</label>
            <input v-model="assignDueDate" class="workflow-assign-action__input" type="text" placeholder="Ex: 1 day" />
          </div>
          <div>
            <label>Reminder Time</label>
            <input v-model="assignAlertTime" class="workflow-assign-action__input" type="text" placeholder="Ex: 01:00" />
          </div>
        </div>

        <p v-if="assignActionMessage" class="workflow-assign-action__feedback workflow-assign-action__feedback--success">{{ assignActionMessage }}</p>
        <p v-if="assignActionError" class="workflow-assign-action__feedback workflow-assign-action__feedback--error">{{ assignActionError }}</p>

        <button
          type="button"
          class="workflow-modal__submit workflow-modal__submit--small"
          :disabled="assignActionLoading"
          @click="submitAssignAction"
        >
          {{ assignActionLoading ? 'Saving...' : 'Save Assign' }}
        </button>

        <button v-if="false" type="button" class="workflow-modal__submit workflow-modal__submit--small" @click="closeAssignActionModal">
          GOT IT
        </button>
      </div>
    </div>

    <div v-if="showExpandedAssignEditor" class="workflow-modal-overlay">
      <div class="workflow-email__expanded">
        <div class="workflow-email__toolbar workflow-email__toolbar--expanded">
          <button type="button" class="workflow-email__tool">B</button>
          <button type="button" class="workflow-email__tool workflow-email__tool--italic">I</button>
          <button type="button" class="workflow-email__tool workflow-email__tool--underline">U</button>
          <button type="button" class="workflow-email__tool">S</button>
          <button type="button" class="workflow-email__tool">&lt;/&gt;</button>
          <button type="button" class="workflow-email__tool">🎨</button>
          <button type="button" class="workflow-email__tool">•</button>
          <button type="button" class="workflow-email__tool">1.</button>
          <button type="button" class="workflow-email__tool">🔗</button>
          <button type="button" class="workflow-email__tool">🖼</button>
          <button type="button" class="workflow-email__tool">&lt;/&gt;</button>
          <button type="button" class="workflow-email__tool">❞</button>
          <button type="button" class="workflow-email__tool">−</button>
          <button
            type="button"
            class="workflow-email__tool workflow-email__expand workflow-email__expand--close"
            @click="closeExpandedAssignEditor"
          >
            ⤡
          </button>
        </div>
        <textarea v-model="assignBackgroundInfo" class="workflow-email__expanded-textarea"></textarea>
      </div>
    </div>

    <div v-if="showAssignModal" class="workflow-modal-overlay">
      <div class="workflow-assign">
        <div class="workflow-assign__modal">
          <button type="button" class="workflow-modal__close" @click="closeAssignModal">x</button>
          <h4>Candidates in Stage</h4>
          <label class="workflow-assign__select-all" @click.stop="toggleSelectAllAssignCandidates">
            <input :checked="allAssignCandidatesSelected" type="checkbox" />
            <span>Select All Candidates</span>
          </label>

          <div class="workflow-assign__api-panel">
            <div class="workflow-assign__api-grid">
              <label class="workflow-assign__field" @click.stop>
                <span>Job Stage UUID</span>
                <input
                  v-model="candidateStageUuid"
                  type="text"
                  placeholder="Enter target stage UUID"
                  @click.stop
                />
              </label>

              <button
                type="button"
                class="workflow-assign__apply"
                :disabled="candidateActionLoading"
                @click.stop="applyCandidateStageChange"
              >
                {{ candidateActionLoading ? 'Saving...' : 'Change Stage' }}
              </button>
            </div>

            <div class="workflow-assign__api-grid">
              <label class="workflow-assign__field" @click.stop>
                <span>Evaluation</span>
                <input
                  v-model="candidateEvaluation"
                  type="text"
                  placeholder="Enter evaluation value"
                  @click.stop
                />
              </label>

              <button
                type="button"
                class="workflow-assign__apply workflow-assign__apply--secondary"
                :disabled="candidateActionLoading"
                @click.stop="applyCandidateEvaluationChange"
              >
                {{ candidateActionLoading ? 'Saving...' : 'Change Evaluation' }}
              </button>
            </div>

            <p v-if="candidateActionMessage" class="workflow-assign__feedback workflow-assign__feedback--success">
              {{ candidateActionMessage }}
            </p>
            <p v-if="candidateActionError" class="workflow-assign__feedback workflow-assign__feedback--error">
              {{ candidateActionError }}
            </p>
          </div>

          <div class="workflow-assign__list">
            <article
              v-for="candidate in assignCandidates"
              :key="candidate"
              class="workflow-assign__candidate"
              :class="{ 'workflow-assign__candidate--selected': selectedAssignCandidates.includes(candidate) }"
              @click="toggleAssignCandidateSelection(candidate)"
            >
              <label class="workflow-assign__candidate-check" @click.stop>
                <input
                  :checked="selectedAssignCandidates.includes(candidate)"
                  type="checkbox"
                  @change="toggleAssignCandidateSelection(candidate)"
                />
              </label>
              <span class="workflow-assign__candidate-avatar"></span>
              <div class="workflow-assign__candidate-body">
                <strong>{{ candidate }}</strong>
                <span>5 Stars</span>
                <label class="workflow-assign__candidate-field" @click.stop>
                  <span>Candidate UUID</span>
                  <input
                    v-model="candidateUuidByName[candidate]"
                    type="text"
                    placeholder="Paste candidate UUID"
                    @click.stop
                  />
                </label>
              </div>
              <button
                type="button"
                class="workflow-assign__candidate-more"
                @click.stop="openAssignCandidateMenu(candidate, $event)"
              >
                ...
              </button>
            </article>
          </div>

          <button type="button" class="workflow-assign__add">+ Add New Candidate</button>
        </div>

        <div
          v-if="activeAssignCandidateMenu"
          class="workflow-assign__menu"
          :style="{ top: `${assignMenuTop}px` }"
        >
          <button type="button" class="workflow-assign__menu-item">Send Bulk Email</button>
          <button type="button" class="workflow-assign__menu-item">Add Tags</button>
          <button type="button" class="workflow-assign__menu-item">Move to <span>&gt;</span></button>
          <button type="button" class="workflow-assign__menu-item">Disqualify</button>
          <button
            type="button"
            class="workflow-assign__menu-item"
            @mouseenter="showAssignAiMenu = true"
          >
            Use AI <span>&gt;</span>
          </button>
          <button type="button" class="workflow-assign__menu-item">Assign to</button>
          <button type="button" class="workflow-assign__menu-item">Delete</button>
          <button type="button" class="workflow-assign__menu-item">Send NPS</button>
          <button type="button" class="workflow-assign__menu-item">Delete <span>&gt;</span></button>
          <button type="button" class="workflow-assign__menu-item">Add/ Change Evaluation</button>
          <button type="button" class="workflow-assign__menu-item">Send NPS</button>
          <button type="button" class="workflow-assign__menu-item">Export data</button>
          <button type="button" class="workflow-assign__menu-item">Print profile</button>
          <button type="button" class="workflow-assign__menu-item">share profile</button>
        </div>

        <div
          v-if="showAssignAiMenu && activeAssignCandidateMenu"
          class="workflow-assign__submenu"
          :style="{ top: `${assignSubmenuTop}px` }"
        >
          <button type="button" class="workflow-assign__menu-item">AI screening</button>
          <button type="button" class="workflow-assign__menu-item">AI suggest Stages</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.job-stages-workflow {
  display: grid;
  gap: 18px;
  position: relative;
}

.workflow-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.workflow-toolbar__left {
  display: grid;
  gap: 8px;
}

.workflow-toolbar__title {
  font-size: 15px;
  font-weight: 500;
  color: #2f252b;
}

.workflow-toolbar__tags {
  position: relative;
  display: inline-flex;
  align-items: flex-start;
}

.workflow-toolbar__tag {
  min-height: 26px;
  padding: 0 10px;
  border-radius: 4px;
  border: 1px solid #f0dde5;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted-strong);
  font-size: var(--ui-meta-font);
  white-space: nowrap;
}

.workflow-toolbar__tag--root {
  background: #fff;
}

.workflow-toolbar__tag--child {
  background: #f8eef2;
}

.workflow-toolbar__tag-children {
  position: absolute;
  top: 0;
  left: calc(100% + 4px);
  display: grid;
  gap: 4px;
}

.workflow-toolbar__tag-icon {
  width: 7px;
  height: 7px;
  border-radius: 1px;
  background: #2b2327;
  flex: 0 0 auto;
}

.workflow-toolbar__tag-chevron {
  width: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--hint-soft);
  font-size: 0;
  line-height: 0;
}

.workflow-toolbar__tag-chevron::before {
  content: "";
  width: 6px;
  height: 6px;
  border-right: 1.6px solid currentColor;
  border-bottom: 1.6px solid currentColor;
  transform: rotate(45deg) translateY(-1px);
}

.workflow-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workflow-toolbar__status-wrap {
  position: relative;
}

.workflow-toolbar__search,
.workflow-toolbar__status {
  min-width: 96px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #f0e3e8;
  border-radius: 6px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--hint);
  font-size: var(--ui-meta-font);
}

.workflow-toolbar__search {
  min-width: 148px;
  justify-content: flex-start;
}

.workflow-toolbar__search-icon {
  width: 11px;
  height: 11px;
  border: 1.5px solid #dbc8d2;
  border-radius: 50%;
  position: relative;
  flex: 0 0 auto;
}

.workflow-toolbar__search-icon::after {
  content: '';
  position: absolute;
  right: -3px;
  bottom: -2px;
  width: 5px;
  height: 1.5px;
  border-radius: 999px;
  background: #dbc8d2;
  transform: rotate(45deg);
  transform-origin: center;
}

.workflow-toolbar__status-dot {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  flex: 0 0 auto;
}

.workflow-toolbar__chevron {
  width: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  color: var(--hint-soft);
  font-size: 0;
  line-height: 0;
}

.workflow-toolbar__chevron::before {
  content: "";
  width: 6px;
  height: 6px;
  border-right: 1.6px solid currentColor;
  border-bottom: 1.6px solid currentColor;
  transform: rotate(45deg) translateY(-1px);
}

.workflow-toolbar__status-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  min-width: 118px;
  padding: 4px 0;
  border: 1px solid #efe3e8;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(38, 27, 35, 0.12);
  z-index: 20;
}

.workflow-toolbar__status-option {
  width: 100%;
  min-height: 24px;
  padding: 0 10px;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--hint);
  font-size: var(--ui-tiny-font);
  text-align: left;
}

.workflow-toolbar__status-option:hover {
  background: #fbf7f9;
}

.workflow-toolbar__add {
  min-width: 116px;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  background: #ea4f8d;
  color: #fff;
  font-size: var(--ui-meta-font);
  font-weight: 600;
}

.workflow-stage {
  border-bottom: 1px solid #f1e6ea;
  padding-bottom: 14px;
}

.workflow-stage__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.workflow-stage__title-wrap {
  position: relative;
}

.workflow-stage__title-button {
  font-size: 16px;
  font-weight: 500;
  text-transform: lowercase;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  line-height: 1.1;
}

.workflow-stage__menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  width: 208px;
  padding: 12px 0;
  border: 1px solid #ece2e8;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 18px 32px rgba(33, 20, 30, 0.12);
  z-index: 30;
}

.workflow-stage__menu-item {
  width: 100%;
  min-height: 50px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5d4b55;
  font-size: 13px;
  text-align: left;
}

.workflow-stage__menu-item + .workflow-stage__menu-item {
  border-top: 1px solid #f3e8ed;
}

.workflow-stage__menu-item--delete {
  color: #ec4f89;
}

.workflow-stage-feedback {
  margin: 0;
  font-size: 12px;
}

.workflow-stage-feedback--success {
  color: #2f8f53;
}

.workflow-stage-feedback--error {
  color: #d33f70;
}

.workflow-stage__menu-icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
}

.workflow-stage__menu-icon--trash {
  color: #ec4f89;
}

.workflow-stage__menu-icon--edit {
  color: #4f7dff;
}

.workflow-stage__menu-icon--view {
  color: #6b21d8;
}

.workflow-stage__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.workflow-stage__action {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #fff3f7;
  border: 1px solid #f8d6e4;
  color: #e97aa9;
  font-size: 0;
  line-height: 0;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, background-color 0.18s ease;
  box-shadow: 0 2px 6px rgba(235, 107, 159, 0.08);
}

.workflow-stage__action::before {
  content: "";
  width: 7px;
  height: 7px;
  border-right: 1.8px solid currentColor;
  border-bottom: 1.8px solid currentColor;
  transform: rotate(45deg) translateY(-1px);
}

.workflow-stage__action--collapsed {
  transform: rotate(180deg);
}

.workflow-stage__lane {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.workflow-stage__empty {
  grid-column: 1 / -1;
  min-height: 64px;
  padding: 18px 16px;
  border: 1px dashed #efd7e2;
  border-radius: 10px;
  background: #fff;
  color: var(--hint);
  font-size: var(--ui-small-font);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.workflow-card {
  min-height: 46px;
  padding: 8px 10px;
  border: 1px solid #f2e6eb;
  border-radius: 6px;
  background: #fff;
  display: grid;
  grid-template-columns: 22px 1fr 16px;
  align-items: center;
  gap: 8px;
  position: relative;
}

.workflow-card__avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f2b364, #e45893);
}

.workflow-card__body {
  min-width: 0;
  display: grid;
}

.workflow-card__body strong,
.workflow-card__body span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-card__body strong {
  font-size: var(--ui-meta-font);
  font-weight: 600;
  color: #58434d;
}

.workflow-card__body span {
  font-size: var(--ui-tiny-font);
  color: var(--hint-soft);
}

.workflow-card__menu-wrap {
  position: relative;
}

.workflow-card__more {
  color: var(--hint-soft);
  font-size: 16px;
  line-height: 1;
}

.workflow-card__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 176px;
  max-height: 430px;
  overflow-y: auto;
  padding: 8px 0;
  border: 1px solid #efdfe7;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 14px 30px rgba(39, 28, 35, 0.14);
  z-index: 30;
}

.workflow-card__menu-item {
  width: 100%;
  min-height: 32px;
  padding: 0 14px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #7e606d;
  font-size: 12px;
  text-align: left;
}

.workflow-card__menu-item:hover {
  background: #fbe8f0;
}

.workflow-card__menu-arrow {
  color: var(--hint-soft);
  font-size: var(--ui-small-font);
  line-height: 1;
}

.workflow-stage__footer {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.workflow-stage__footer-text {
  font-size: var(--ui-meta-font);
  color: var(--hint);
}

.workflow-stage__pagination {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.workflow-stage__page-arrow {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #fff7fa;
  color: #f0d4df;
  font-size: 0;
  line-height: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.workflow-stage__page-arrow::before {
  content: "";
  width: 6px;
  height: 6px;
  border-top: 1.8px solid currentColor;
  border-right: 1.8px solid currentColor;
}

.workflow-stage__page-arrow--prev::before {
  transform: rotate(-135deg);
}

.workflow-stage__page-arrow--next::before {
  transform: rotate(45deg);
}

.workflow-stage__page-arrow--next {
  color: #ea4f8d;
}

.workflow-stage__page-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ea4f8d;
}

.workflow-modal-overlay {
  position: fixed;
  inset: 0;
  padding: 16px;
  background: rgba(20, 16, 18, 0.56);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  z-index: 1000;
}

.workflow-modal {
  position: relative;
  width: min(calc(100vw - 48px), 350px);
  min-height: 124px;
  max-height: calc(100vh - 32px);
  padding: 18px 18px 20px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(23, 17, 27, 0.24);
  overflow-y: auto;
}

.workflow-modal--success {
  width: min(calc(100vw - 48px), 392px);
  min-height: 286px;
  padding: 18px 18px 24px;
  display: grid;
  justify-items: center;
}

.workflow-modal--email {
  width: min(calc(100vw - 48px), 515px);
  min-height: 676px;
  padding: 18px 18px 20px;
}

.workflow-modal--compact {
  width: min(calc(100vw - 48px), 408px);
  min-height: 260px;
  padding: 16px 18px 16px;
}

.workflow-modal--notes {
  width: min(calc(100vw - 48px), 326px);
  min-height: 340px;
  padding: 16px 18px 16px;
}

.workflow-modal--team {
  width: min(calc(100vw - 48px), 372px);
  min-height: 322px;
  padding: 16px 18px 16px;
}

.workflow-modal--test {
  width: min(calc(100vw - 48px), 338px);
  min-height: 468px;
  padding: 16px 18px 16px;
}

.workflow-modal--disqualify {
  width: min(calc(100vw - 48px), 408px);
  min-height: 370px;
  max-height: calc(100vh - 32px);
  padding: 14px 16px 18px;
  overflow-x: hidden;
  overflow-y: auto;
}

.workflow-modal--assign-action {
  width: min(calc(100vw - 48px), 420px);
  min-height: 424px;
  padding: 18px 18px 20px;
}

.workflow-modal--schedule {
  width: min(calc(100vw - 48px), 556px);
  min-height: 886px;
  padding: 18px 18px 24px;
  border-radius: 16px;
}

.workflow-modal--schedule h4 {
  margin: 0 0 16px;
  color: #ff5c93;
  font-size: 16px;
  font-weight: 500;
}

.workflow-modal--schedule .workflow-modal__close {
  top: 18px;
  right: 20px;
  color: #ff5c93;
  font-size: 22px;
}

.workflow-modal--schedule .workflow-simple__section {
  margin-bottom: 12px;
}

.workflow-modal--schedule label {
  margin-bottom: 6px;
  color: #4f4449;
  font-size: 13px;
  font-weight: 500;
}

.workflow-modal--schedule input {
  width: 100%;
  height: 58px;
  padding: 0 18px;
  border: 1px solid #f2dfe6;
  border-radius: 14px;
  background: #fff;
  color: #7d6d75;
  font-size: 16px;
}

.workflow-modal--schedule input::placeholder {
  color: #cabec4;
}

.workflow-schedule__select {
  height: 58px;
  padding: 0 14px;
  border: 1px solid #f2dfe6;
  border-radius: 14px;
  background: #fff;
  font-size: 16px;
  color: #988993;
}

.workflow-schedule__select--icon span:last-child {
  position: relative;
  width: 20px;
  height: 20px;
  color: transparent;
  font-size: 0;
  flex: 0 0 20px;
}

.workflow-schedule__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.workflow-schedule__time-row {
  display: grid;
  grid-template-columns: 1fr 68px;
  gap: 10px;
}

.workflow-schedule__time-unit {
  height: 44px;
  justify-content: center;
  border: 1px solid #f2dfe6;
  border-radius: 10px;
  background: #fff;
  color: #8b7d87;
  font-size: 16px;
}

.workflow-schedule__durations {
  display: flex;
  align-items: center;
  gap: 18px;
  margin: 6px 0 12px;
}

.workflow-schedule__duration {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #51454b;
  font-size: 16px;
}

.workflow-schedule__duration input,
.workflow-schedule__note-check input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.workflow-schedule__duration-radio {
  width: 16px;
  height: 16px;
  border: 1.5px solid #8e858a;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 16px;
}

.workflow-schedule__duration-radio::after {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
}

.workflow-schedule__duration input:checked + .workflow-schedule__duration-radio {
  border-color: #ea4f8d;
}

.workflow-schedule__duration input:checked + .workflow-schedule__duration-radio::after {
  background: #ea4f8d;
}

.workflow-schedule__type-wrap {
  position: relative;
}

.workflow-schedule__type-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 140px;
  padding: 8px 0;
  border: 1px solid #efe3e8;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 14px 30px rgba(32, 21, 28, 0.14);
  z-index: 12;
}

.workflow-schedule__type-menu button {
  width: 100%;
  min-height: 34px;
  padding: 0 14px;
  font-size: 13px;
  text-align: left;
}

.workflow-schedule__type-menu button:nth-child(1) {
  color: #ff5c93;
}

.workflow-schedule__type-menu button:nth-child(2) {
  color: #4f7dff;
}

.workflow-schedule__type-menu button:nth-child(3) {
  color: #6b21d8;
}

.workflow-schedule__notes {
  display: grid;
  gap: 18px;
  padding-top: 2px;
}

.workflow-schedule__note-check {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #17111b;
  font-size: 15px;
  line-height: 1.2;
}

.workflow-schedule__checkbox {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 2px;
  background: #ea4f8d;
  position: relative;
  flex: 0 0 18px;
}

.workflow-schedule__checkbox::before {
  content: "✓";
  color: #fff;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  line-height: 1;
}

.workflow-schedule__checkbox::before {
  content: "\2713";
  font-size: 13px;
}

.workflow-schedule__select span:last-child::before {
  content: "";
  position: absolute;
  inset: 0;
}

.workflow-schedule__select:not(.workflow-schedule__select--icon) span:last-child::before {
  width: 10px;
  height: 10px;
  margin: auto;
  border-right: 1.5px solid #e6d8a6;
  border-bottom: 1.5px solid #e6d8a6;
  transform: rotate(45deg);
}

.workflow-schedule__select--icon span:last-child::before {
  margin: auto;
}

.workflow-schedule__row .workflow-simple__section:first-child .workflow-schedule__select--icon span:last-child::before {
  width: 16px;
  height: 14px;
  border: 1.5px solid #f0dfa8;
  border-radius: 3px;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background:
    linear-gradient(#f0dfa8, #f0dfa8) center 4px / 10px 1.5px no-repeat,
    linear-gradient(#f0dfa8, #f0dfa8) center 8px / 8px 1px no-repeat;
}

.workflow-schedule__row .workflow-simple__section:first-child .workflow-schedule__select--icon span:last-child::after {
  content: "";
  position: absolute;
  top: -1px;
  left: 5px;
  width: 2px;
  height: 4px;
  border-radius: 999px;
  background: #f0dfa8;
  box-shadow: 6px 0 0 #f0dfa8;
}

.workflow-schedule__row .workflow-simple__section:last-child .workflow-schedule__select--icon span:last-child::before {
  width: 16px;
  height: 16px;
  border: 1.5px solid #f0dfa8;
  border-radius: 50%;
}

.workflow-schedule__row .workflow-simple__section:last-child .workflow-schedule__select--icon span:last-child::after {
  content: "";
  position: absolute;
  top: 4px;
  left: 9px;
  width: 1.5px;
  height: 5px;
  background: #f0dfa8;
  transform-origin: bottom center;
}

.workflow-modal--schedule > .workflow-simple__section:nth-of-type(7) .workflow-schedule__select--icon span:last-child::before {
  width: 14px;
  height: 14px;
  margin: auto;
  border: 1.5px solid #f0dfa8;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

.workflow-modal--schedule > .workflow-simple__section:nth-of-type(7) .workflow-schedule__select--icon span:last-child::after {
  content: "";
  position: absolute;
  inset: 6px;
  margin: auto;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #f0dfa8;
}

.workflow-modal__close {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #ea4f8d;
  font-size: 16px;
  line-height: 1;
}

.workflow-modal h4 {
  margin: 0 0 12px;
  color: #ea4f8d;
  font-size: var(--ui-small-font);
  font-weight: 500;
}

.workflow-modal label {
  display: block;
  margin-bottom: 6px;
  color: #58434d;
  font-size: var(--ui-tiny-font);
}

.workflow-modal input {
  width: 100%;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #efe3e8;
  border-radius: 6px;
  background: #faf8f9;
  color: var(--muted-strong);
  font-size: var(--ui-meta-font);
}

.workflow-modal__submit {
  display: block;
  width: 120px;
  height: 22px;
  margin: 22px auto 0;
  border-radius: 5px;
  background: #ea4f8d;
  color: #fff;
  font-size: var(--ui-tiny-font);
  font-weight: 600;
}

.workflow-modal__success-image {
  width: 98px;
  height: auto;
  margin-top: 8px;
  object-fit: contain;
}

.workflow-modal__success-text {
  margin: 6px 0 0;
  color: #2f252b;
  font-size: var(--ui-meta-font);
  font-weight: 500;
  text-align: center;
}

.workflow-modal__submit--success {
  width: 100px;
  margin-top: 12px;
}

.workflow-modal__submit--danger {
  background: #d94b72;
}

.workflow-modal__submit--email {
  width: 86px;
  height: 20px;
  margin: 14px 0 0 auto;
  font-size: 9px;
}

.workflow-modal__submit--small {
  width: 74px;
  height: 24px;
  margin: 16px 0 0 auto;
  font-size: 10px;
}

.workflow-simple__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.workflow-simple__title-row h4 {
  margin: 0;
}

.workflow-simple__icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #f1bfd2;
  color: #ea4f8d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.workflow-simple__section {
  margin-bottom: 12px;
}

.workflow-tag-colors {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.workflow-tag-color {
  width: 15px;
  height: 15px;
  border-radius: 50%;
}

.workflow-tag-pills {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.workflow-tag-pill {
  min-height: 24px;
  padding: 0 10px;
  border-radius: 8px;
  background: #4f7dff;
  color: #fff;
  display: inline-flex;
  align-items: center;
  font-size: var(--ui-tiny-font);
  font-weight: 500;
}

.workflow-tag-pill--green {
  background: #35d06a;
}

.workflow-share-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workflow-share-copy {
  width: 24px;
  height: 24px;
  color: #4f7dff;
  font-size: 14px;
}

.workflow-share-select {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #efe3e8;
  border-radius: 6px;
  background: #faf8f9;
  color: var(--hint);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--ui-meta-font);
}

.workflow-note-card {
  padding: 12px 10px;
  border: 1px solid #f0e3e8;
  border-radius: 6px;
  background: #fbfbfc;
}

.workflow-note-card strong {
  display: block;
  color: #c96f91;
  font-size: var(--ui-meta-font);
  font-weight: 500;
}

.workflow-note-card p {
  margin: 6px 0 10px;
  color: var(--hint-soft);
  font-size: var(--ui-tiny-font);
  line-height: 1.55;
}

.workflow-note-card__author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: #fde9f1;
  color: #9b6a7b;
  font-size: var(--ui-tiny-font);
}

.workflow-note-card__avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f2b364, #e45893);
}

.workflow-note-card__actions {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 12px;
}

.workflow-note-card__actions button {
  color: #ea4f8d;
  font-size: var(--ui-tiny-font);
}

.workflow-note-card__add {
  width: 100%;
  height: 34px;
  margin-top: 12px;
  border: 1px dashed #f0dde5;
  border-radius: 6px;
  color: #ea4f8d;
  font-size: var(--ui-meta-font);
}

.workflow-note-form {
  margin-top: 12px;
  padding: 12px 10px;
  border: 1px solid #f0e3e8;
  border-radius: 6px;
  background: #fbfbfc;
}

.workflow-note-form__textarea {
  width: 100%;
  min-height: 70px;
  padding: 10px 12px;
  border: 1px solid #efe3e8;
  border-radius: 4px;
  background: #fff;
  resize: none;
  outline: none;
  color: var(--muted-strong);
  font-size: var(--ui-meta-font);
}

.workflow-team-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  margin-bottom: 12px;
}

.workflow-team-card {
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid #f0e3e8;
  border-radius: 8px;
  background: #fbfbfc;
  display: grid;
  grid-template-columns: 20px 1fr 16px;
  align-items: center;
  gap: 8px;
}

.workflow-team-card__avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #dddddd;
}

.workflow-team-card__name {
  font-size: var(--ui-tiny-font);
  font-weight: 500;
}

.workflow-team-card__add {
  width: 14px;
  height: 14px;
  border: 1px solid currentColor;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  line-height: 1;
}

.workflow-team-input {
  min-height: 34px;
  padding: 0 6px 0 8px;
  border: 1px solid #efe3e8;
  border-radius: 8px;
  background: #faf8f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.workflow-team-input__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4f7dff;
  font-size: var(--ui-tiny-font);
}

.workflow-team-input__pill button {
  color: #9aa7ff;
  font-size: var(--ui-tiny-font);
}

.workflow-team-input__add {
  min-width: 32px;
  height: 18px;
  border-radius: 999px;
  background: #fde9f1;
  color: #ea4f8d;
  font-size: var(--ui-tiny-font);
}

.workflow-test__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #493f44;
  font-size: var(--ui-meta-font);
}

.workflow-test__link {
  color: #ea4f8d;
  font-size: var(--ui-tiny-font);
}

.workflow-test__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.workflow-test-card {
  min-height: 174px;
  padding: 10px 10px 8px;
  border: 1px solid #f0e3e8;
  border-radius: 6px;
  background: #fbfbfc;
}

.workflow-test-card h5 {
  margin: 0 0 8px;
  color: #ff5c8a;
  font-size: var(--ui-tiny-font);
  font-weight: 500;
}

.workflow-test-card__meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.workflow-test-card__meta span {
  min-height: 14px;
  padding: 0 4px;
  border-radius: 4px;
  background: #5a3df0;
  color: #fff;
  display: inline-flex;
  align-items: center;
  font-size: 7px;
}

.workflow-test-card p {
  margin: 0;
  color: #c4b6be;
  font-size: 9px;
  line-height: 1.35;
}

.workflow-test-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  color: #4b4046;
  font-size: 8px;
}

.workflow-test-card__bar {
  height: 4px;
  margin-top: 6px;
  border-radius: 999px;
  background: #f3dce5;
  overflow: hidden;
}

.workflow-test-card__bar span {
  display: block;
  height: 100%;
  background: #4dd076;
}

.workflow-disqualify__title {
  color: #ea4f8d;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 500;
}

.workflow-disqualify__option {
  display: grid;
  grid-template-columns: 14px 1fr;
  align-items: center;
  column-gap: 8px;
  margin-top: 8px;
  color: #4c4247;
  font-size: 10px;
  line-height: 1.2;
  cursor: pointer;
}

.workflow-modal--disqualify .workflow-simple__title-row {
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1e6ea;
}

.workflow-modal--disqualify .workflow-simple__title-row h4 {
  color: #ff5c93;
  font-size: 11px;
  font-weight: 500;
}

.workflow-modal--disqualify .workflow-simple__icon,
.workflow-modal--disqualify .workflow-modal__close,
.workflow-modal--disqualify .workflow-share-select span:last-child {
  color: transparent;
  position: relative;
}

.workflow-modal--disqualify .workflow-simple__icon::before {
  content: "⊖";
  color: #ff5c93;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.workflow-modal--disqualify .workflow-modal__close {
  top: 16px;
  right: 18px;
  width: 24px;
  height: 24px;
}

.workflow-modal--disqualify .workflow-modal__close::before {
  content: "×";
  color: #ff5c93;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
}

.workflow-modal--disqualify .workflow-simple__section {
  margin-bottom: 12px;
}

.workflow-modal--disqualify label {
  margin-bottom: 6px;
  color: #58434d;
  font-size: 10px;
  font-weight: 500;
}

.workflow-modal--disqualify .workflow-note-card__author {
  min-height: 28px;
  padding: 0 10px;
  gap: 8px;
  font-size: 10px;
  color: #9a6f80;
}

.workflow-modal--disqualify .workflow-note-card__avatar {
  width: 16px;
  height: 16px;
}

.workflow-modal--disqualify .workflow-share-select {
  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  background: #fcf9fb;
  color: #8b7982;
  font-size: 10px;
}

.workflow-modal--disqualify .workflow-share-select span:last-child {
  width: 16px;
  flex: 0 0 16px;
}

.workflow-modal--disqualify .workflow-share-select span:last-child::before {
  content: "⌄";
  color: #9a8a92;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.workflow-modal--disqualify input[type='radio'] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.workflow-modal--disqualify .workflow-disqualify__radio {
  width: 10px;
  height: 10px;
  border: 1px solid #d9c9d0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 10px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.workflow-modal--disqualify .workflow-disqualify__radio::after {
  content: "";
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: transparent;
}

.workflow-modal--disqualify .workflow-disqualify__option span:last-child {
  white-space: nowrap;
}

.workflow-modal--disqualify .workflow-disqualify__option input:checked + .workflow-disqualify__radio {
  border-color: #ff5c93;
  box-shadow: 0 0 0 2px rgba(255, 92, 147, 0.12);
}

.workflow-modal--disqualify
  .workflow-disqualify__option
  input:checked
  + .workflow-disqualify__radio::after {
  background: #ff5c93;
}

.workflow-modal--disqualify .workflow-email__editor {
  border-radius: 8px;
}

.workflow-modal--disqualify .workflow-email__toolbar {
  min-height: 52px;
  padding: 10px;
  gap: 10px;
}

.workflow-modal--disqualify .workflow-email__tool {
  min-width: 38px;
  height: 36px;
  border-radius: 10px;
  font-size: 13px;
}

.workflow-modal--disqualify .workflow-email__editor textarea {
  min-height: 178px;
  padding: 14px 16px;
  font-size: 12px;
  line-height: 1.55;
}

.workflow-modal--disqualify .workflow-modal__submit--small {
  width: 74px;
  height: 24px;
  margin: 14px auto 0 0;
  border-radius: 7px;
  font-size: 10px;
}

.workflow-modal--disqualify .workflow-email__feedback {
  margin: 12px 0 0;
  white-space: normal;
  overflow-wrap: anywhere;
}

.workflow-modal--disqualify .workflow-simple__icon::before {
  content: "⊖";
  font-size: 10px;
}

.workflow-modal--disqualify .workflow-modal__close {
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  z-index: 2;
}

.workflow-modal--disqualify .workflow-modal__close::before {
  content: "×";
  font-size: 15px;
}

.workflow-modal--disqualify .workflow-share-select span:last-child::before {
  content: "⌄";
  font-size: 11px;
}

.workflow-modal--disqualify {
  width: min(calc(100vw - 48px), 408px);
  min-height: 370px;
  padding: 14px 16px 18px;
}

.workflow-modal--disqualify .workflow-simple__title-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 2px 0 11px;
  border-bottom: 1px solid #f3e8ed;
}

.workflow-modal--disqualify .workflow-disqualify__header-row {
  cursor: pointer;
}

.workflow-modal--disqualify .workflow-simple__title-row h4 {
  color: #ff5c93;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.workflow-modal--disqualify .workflow-simple__icon {
  width: 16px;
  height: 16px;
  border: 1px solid #ff5c93;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.workflow-modal--disqualify .workflow-simple__icon::before {
  content: "←";
  color: #ff5c93;
  font-size: 10px;
  line-height: 1;
}

.workflow-modal--disqualify .workflow-modal__close {
  display: none;
}

.workflow-modal--disqualify .workflow-modal__close::before {
  content: "×";
  color: #ff5c93;
  font-size: 14px;
  line-height: 1;
}

.workflow-modal--disqualify .workflow-simple__section {
  margin-bottom: 12px;
}

.workflow-modal--disqualify label {
  margin-bottom: 6px;
  color: #71616a;
  font-size: 10px;
  font-weight: 500;
}

.workflow-modal--disqualify .workflow-note-card__author {
  min-height: 28px;
  padding: 0 10px;
  gap: 8px;
  font-size: 10px;
  background: #fde9f1;
  color: #d86a92;
}

.workflow-modal--disqualify .workflow-note-card__avatar {
  width: 16px;
  height: 16px;
}

.workflow-modal--disqualify .workflow-share-select {
  height: 30px;
  padding: 0 12px;
  border: 1px solid #efe3e8;
  border-radius: 6px;
  background: #fff;
  color: #9f8f97;
  font-size: 10px;
}

.workflow-modal--disqualify .workflow-share-select span:last-child::before {
  content: "⌄";
  color: #aea0a7;
  font-size: 11px;
}

.workflow-modal--disqualify .workflow-disqualify__title {
  color: #ff5c93;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 500;
}

.workflow-modal--disqualify .workflow-disqualify__select-wrap {
  position: relative;
}

.workflow-modal--disqualify .workflow-disqualify__select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  padding: 4px 0;
  border: 1px solid #efe3e8;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(32, 21, 28, 0.12);
  z-index: 10;
}

.workflow-modal--disqualify .workflow-disqualify__select-menu button {
  width: 100%;
  min-height: 28px;
  padding: 0 12px;
  color: #6d5d65;
  font-size: 10px;
  text-align: left;
}

.workflow-modal--disqualify .workflow-disqualify__select-menu button:hover {
  background: #fcf7f9;
}

.workflow-modal--disqualify .workflow-disqualify__option {
  display: grid;
  grid-template-columns: 10px 1fr;
  align-items: center;
  column-gap: 8px;
  margin-top: 8px;
  color: #3f3439;
  font-size: 10px;
  line-height: 1.2;
}

.workflow-modal--disqualify .workflow-disqualify__radio {
  width: 10px;
  height: 10px;
  border: 1px solid #ded4d9;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.workflow-modal--disqualify .workflow-disqualify__radio::after {
  content: "";
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: transparent;
}

.workflow-modal--disqualify .workflow-disqualify__option input:checked + .workflow-disqualify__radio {
  border-color: #ff5c93;
}

.workflow-modal--disqualify .workflow-disqualify__option input:checked + .workflow-disqualify__radio::after {
  background: #ff5c93;
}

.workflow-modal--disqualify .workflow-disqualify__option span:last-child {
  white-space: nowrap;
}

.workflow-modal--disqualify .workflow-email__editor {
  border-radius: 6px;
  overflow: hidden;
  max-width: 100%;
}

.workflow-modal--disqualify .workflow-email__toolbar {
  display: flex;
  flex-wrap: wrap;
  min-height: 42px;
  padding: 6px 8px;
  gap: 6px;
  max-width: 100%;
}

.workflow-modal--disqualify .workflow-email__tool {
  min-width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 13px;
}

.workflow-modal--disqualify .workflow-email__editor textarea {
  min-height: 126px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 12px;
  font-size: 11px;
  line-height: 1.45;
}

.workflow-modal--disqualify input,
.workflow-modal--disqualify textarea,
.workflow-modal--disqualify .workflow-share-select,
.workflow-modal--disqualify .workflow-email__editor {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.workflow-modal--disqualify .workflow-modal__submit--small {
  width: 74px;
  height: 24px;
  margin: 14px auto 0 0;
  border-radius: 7px;
  font-size: 10px;
}

.workflow-assign-action__header {
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1e6ea;
}

.workflow-assign-action__header h4 {
  margin: 0;
  color: #ea4f8d;
  font-size: 13px;
  font-weight: 500;
}

.workflow-modal--assign-action .workflow-modal__close {
  top: 14px;
  right: 14px;
}

.workflow-assign-action__section {
  margin-bottom: 12px;
}

.workflow-assign-action__section label {
  margin-bottom: 6px;
  color: #58434d;
  font-size: 10px;
  font-weight: 500;
}

.workflow-assign-action__inline-field {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.workflow-assign-action__inline-field input {
  min-width: 0;
}

.workflow-assign-action__section input,
.workflow-assign-action__input {
  width: 100%;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #eddbe3;
  border-radius: 8px;
  background: #fff;
  color: #2d2328;
  font-size: 10px;
}

.workflow-assign-action__section input[readonly] {
  background: #fbf6f8;
  color: #8e7783;
}

.workflow-assign-action__inline-button {
  width: 52px;
  height: 24px;
  align-self: center;
  border-radius: 999px;
  background: #ffe7f0;
  color: #ea4f8d;
  font-size: 10px;
  font-weight: 600;
}

.workflow-assign-action__editor .workflow-email__toolbar {
  min-height: 42px;
  padding: 6px 8px;
  gap: 6px;
}

.workflow-assign-action__editor .workflow-email__tool {
  min-width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 12px;
}

.workflow-assign-action__editor textarea {
  min-height: 98px;
  padding: 10px 12px;
  font-size: 10px;
  line-height: 1.45;
}

.workflow-assign-action__reminder-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.workflow-assign-action__toggle {
  width: 26px;
  height: 14px;
  border-radius: 999px;
  background: #f1dce6;
  position: relative;
  transition: background-color 0.18s ease;
}

.workflow-assign-action__toggle span {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(39, 28, 35, 0.18);
  transition: transform 0.18s ease;
}

.workflow-assign-action__toggle--active {
  background: #f6d7e5;
}

.workflow-assign-action__toggle--active span {
  transform: translateX(12px);
  background: #41c86a;
}

.workflow-assign-action__reminder-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.workflow-assign-action__select {
  height: 32px;
  padding: 0 10px;
  font-size: 10px;
}

.workflow-assign-action__feedback {
  margin: 12px 0 0;
  font-size: 10px;
}

.workflow-assign-action__feedback--success {
  color: #2f8f53;
}

.workflow-assign-action__feedback--error {
  color: #d33f70;
}

.workflow-modal--assign-action .workflow-modal__submit--small {
  margin-top: 14px;
}

.workflow-email__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.workflow-email__title-row h4 {
  margin: 0;
  color: #2f252b;
}

.workflow-email__icon {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: #ea4f8d;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.workflow-email__section {
  margin-bottom: 14px;
}

.workflow-email__candidate {
  display: flex;
  align-items: center;
  gap: 10px;
}

.workflow-email__avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f2b364, #e45893);
}

.workflow-email__candidate-text {
  display: grid;
}

.workflow-email__candidate-text strong {
  font-size: 10px;
  color: #4a3a42;
}

.workflow-email__candidate-text span {
  font-size: 9px;
  color: #6b88ff;
}

.workflow-email__feedback {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.45;
}

.workflow-email__feedback--success {
  color: #1d8f46;
}

.workflow-email__feedback--error {
  color: #d1497b;
}

.workflow-email__debug {
  margin: 10px 0 0;
  padding: 10px 12px;
  border: 1px solid #f0dde5;
  border-radius: 8px;
  background: #fff7fa;
  color: #6b4d58;
  font-size: 10px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.workflow-email__editor {
  border: 1px solid #efe3e8;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.workflow-email__toolbar {
  min-height: 46px;
  padding: 8px;
  border-bottom: 1px solid #efe3e8;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: #4d4348;
  font-size: 11px;
}

.workflow-email__tool {
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border: 1px solid #dfdfe6;
  border-radius: 8px;
  background: #fff;
  color: #34343c;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
}

.workflow-email__tool--italic {
  font-style: italic;
}

.workflow-email__tool--underline {
  text-decoration: underline;
}

.workflow-email__expand {
  margin-left: auto;
}

.workflow-email__editor textarea {
  width: 100%;
  min-height: 140px;
  padding: 10px 12px;
  border: 0;
  resize: none;
  outline: none;
  color: #8b7982;
  font-size: 11px;
  line-height: 1.45;
}

.workflow-email__expanded {
  width: min(calc(100vw - 48px), 322px);
  min-height: 394px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(23, 17, 27, 0.24);
  overflow: hidden;
}

.workflow-email__toolbar--expanded {
  border-bottom: 1px solid #efe3e8;
}

.workflow-email__expand--close {
  font-size: 12px;
}

.workflow-email__expanded-textarea {
  width: 100%;
  min-height: 350px;
  padding: 10px 12px;
  border: 0;
  resize: none;
  outline: none;
  color: #8b7982;
  font-size: 11px;
  line-height: 1.45;
}

.workflow-assign {
  position: relative;
  width: 398px;
}

.workflow-assign__modal,
.workflow-assign__menu,
.workflow-assign__submenu {
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(26, 18, 23, 0.16);
}

.workflow-assign__modal {
  position: relative;
  width: 398px;
  padding: 18px 18px 16px;
}

.workflow-assign__modal h4 {
  margin: 0 0 12px;
  color: #ea4f8d;
  font-size: 16px;
  font-weight: 500;
}

.workflow-assign__select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #4d4047;
  font-size: 13px;
}

.workflow-assign__api-panel {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #f0e3e8;
  border-radius: 10px;
  background: #fff8fb;
}

.workflow-assign__api-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: end;
}

.workflow-assign__field,
.workflow-assign__candidate-field {
  display: grid;
  gap: 5px;
}

.workflow-assign__field span,
.workflow-assign__candidate-field span {
  color: #8e7783;
  font-size: 10px;
  font-weight: 500;
}

.workflow-assign__field input,
.workflow-assign__candidate-field input {
  width: 100%;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #ecd8e1;
  border-radius: 8px;
  background: #fff;
  color: #342a30;
  font-size: 11px;
}

.workflow-assign__field input::placeholder,
.workflow-assign__candidate-field input::placeholder {
  color: #c4b0b9;
}

.workflow-assign__apply {
  min-width: 120px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  background: #ea4f8d;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

.workflow-assign__apply:disabled {
  opacity: 0.6;
  cursor: wait;
}

.workflow-assign__apply--secondary {
  background: #4f7dff;
}

.workflow-assign__feedback {
  margin: 0;
  font-size: 11px;
}

.workflow-assign__feedback--success {
  color: #2f8f53;
}

.workflow-assign__feedback--error {
  color: #d33f70;
}

.workflow-assign__list {
  display: grid;
  gap: 10px;
}

.workflow-assign__candidate {
  min-height: 40px;
  padding: 10px 12px;
  border: 1px solid #f0e3e8;
  border-radius: 8px;
  background: #fff;
  display: grid;
  grid-template-columns: 16px 22px 1fr 18px;
  align-items: start;
  gap: 10px;
  cursor: pointer;
}

.workflow-assign__candidate--selected {
  background: #fff7fa;
  border-color: #ebb8cc;
}

.workflow-assign__candidate-check,
.workflow-assign__candidate-check input {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.workflow-assign__candidate-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f2b364, #e45893);
}

.workflow-assign__candidate-body {
  display: grid;
  gap: 4px;
}

.workflow-assign__candidate-body strong {
  font-size: 12px;
  color: #ea4f8d;
  font-weight: 500;
}

.workflow-assign__candidate-body span {
  font-size: 10px;
  color: #b8a9b1;
}

.workflow-assign__candidate-more {
  color: #cbb8c2;
  font-size: 16px;
  line-height: 1;
  align-self: start;
}

.workflow-assign__add {
  width: 100%;
  height: 28px;
  margin-top: 12px;
  border-radius: 6px;
  background: #ea4f8d;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.workflow-assign__menu,
.workflow-assign__submenu {
  width: 132px;
  padding: 8px 0;
  position: absolute;
  left: calc(100% + 4px);
}

.workflow-assign__submenu {
  width: 144px;
  left: calc(100% + 140px);
}

.workflow-assign__menu-item {
  width: 100%;
  min-height: 30px;
  padding: 0 12px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #7f616d;
  font-size: 11px;
  text-align: left;
}

.workflow-assign__menu-item:hover {
  background: #fbe8f0;
}

/* Final schedule modal override */
.workflow-modal.workflow-modal--schedule {
  width: min(calc(100vw - 28px), 402px);
  max-height: calc(100vh - 36px);
  min-height: auto;
  padding: 14px 10px 18px;
  border-radius: 12px;
  overflow-y: auto;
  animation: workflowScheduleModalIn 0.22s ease-out;
}

.workflow-modal.workflow-modal--schedule h4 {
  margin: 0 0 18px;
  color: #ff5c93;
  font-size: 12px;
  font-weight: 500;
}

.workflow-modal.workflow-modal--schedule .workflow-modal__close {
  top: 12px;
  right: 14px;
  width: 18px;
  height: 18px;
  color: transparent;
  font-size: 0;
}

.workflow-modal.workflow-modal--schedule .workflow-modal__close::before,
.workflow-modal.workflow-modal--schedule .workflow-modal__close::after {
  content: "";
  position: absolute;
  top: 8px;
  left: 4px;
  width: 10px;
  height: 1.5px;
  background: #ff5c93;
}

.workflow-modal.workflow-modal--schedule .workflow-modal__close::before {
  transform: rotate(45deg);
}

.workflow-modal.workflow-modal--schedule .workflow-modal__close::after {
  transform: rotate(-45deg);
}

.workflow-modal.workflow-modal--schedule .workflow-simple__section {
  margin-bottom: 10px;
}

.workflow-modal.workflow-modal--schedule label {
  margin-bottom: 6px;
  color: #4f4449;
  font-size: 10px;
  font-weight: 500;
}

.workflow-modal.workflow-modal--schedule input {
  width: 100%;
  height: 33px;
  padding: 0 12px;
  border: 1px solid #efe3e8;
  border-radius: 7px;
  background: #fff;
  color: #7d6d75;
  font-size: 10px;
}

.workflow-modal.workflow-modal--schedule input::placeholder {
  color: #cabec4;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__select {
  height: 33px;
  padding: 0 12px;
  border: 1px solid #efe3e8;
  border-radius: 7px;
  background: #fff;
  color: #988993;
  font-size: 10px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__select span:last-child {
  position: relative;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  color: transparent;
  font-size: 0;
}

.workflow-modal.workflow-modal--schedule .workflow-simple__section:nth-of-type(4) .workflow-schedule__select span:last-child::before,
.workflow-modal.workflow-modal--schedule .workflow-schedule__type-wrap .workflow-schedule__select span:last-child::before {
  content: "";
  position: absolute;
  inset: 0;
  width: 8px;
  height: 8px;
  margin: auto;
  border-right: 1px solid #f0dfa8;
  border-bottom: 1px solid #f0dfa8;
  transform: rotate(45deg);
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__time-row {
  display: grid;
  grid-template-columns: 1fr 58px;
  gap: 8px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__time-unit {
  height: 33px;
  justify-content: center;
  border: 1px solid #efe3e8;
  border-radius: 7px;
  background: #fff;
  color: #8b7d87;
  font-size: 10px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__row .workflow-simple__section:first-child .workflow-schedule__select span:last-child::before {
  content: "";
  position: absolute;
  inset: 0;
  width: 13px;
  height: 11px;
  margin: auto;
  border: 1px solid #f0dfa8;
  border-radius: 2px;
  background:
    linear-gradient(#f0dfa8, #f0dfa8) center 3px / 8px 1px no-repeat,
    linear-gradient(#f0dfa8, #f0dfa8) center 6px / 7px 1px no-repeat;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__row .workflow-simple__section:first-child .workflow-schedule__select span:last-child::after {
  content: "";
  position: absolute;
  top: 1px;
  left: 4px;
  width: 1.5px;
  height: 3px;
  border-radius: 999px;
  background: #f0dfa8;
  box-shadow: 5px 0 0 #f0dfa8;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__row .workflow-simple__section:last-child .workflow-schedule__select span:last-child::before {
  content: "";
  position: absolute;
  inset: 0;
  width: 13px;
  height: 13px;
  margin: auto;
  border: 1px solid #f0dfa8;
  border-radius: 50%;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__row .workflow-simple__section:last-child .workflow-schedule__select span:last-child::after {
  content: "";
  position: absolute;
  top: 4px;
  left: 8px;
  width: 1px;
  height: 4px;
  background: #f0dfa8;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__durations {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 4px 0 8px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__duration {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #51454b;
  font-size: 10px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__duration input,
.workflow-modal.workflow-modal--schedule .workflow-schedule__note-check input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__duration-radio {
  width: 12px;
  height: 12px;
  border: 1px solid #8e858a;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 12px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__duration-radio::after {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__duration input:checked + .workflow-schedule__duration-radio {
  border-color: #ea4f8d;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__duration input:checked + .workflow-schedule__duration-radio::after {
  background: #ea4f8d;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__type-wrap {
  position: relative;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__type-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 120px;
  padding: 6px 0;
  border: 1px solid #efe3e8;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 14px 30px rgba(32, 21, 28, 0.14);
  z-index: 12;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__type-menu button {
  width: 100%;
  min-height: 28px;
  padding: 0 12px;
  font-size: 10px;
  text-align: left;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__type-menu button:nth-child(1) {
  color: #ff5c93;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__type-menu button:nth-child(2) {
  color: #4f7dff;
}

.workflow-modal.workflow-modal--schedule > .workflow-simple__section:not(.workflow-schedule__type-wrap):nth-last-of-type(2) .workflow-schedule__select span:last-child::before {
  content: "";
  position: absolute;
  inset: 0;
  width: 12px;
  height: 12px;
  margin: auto;
  border: 1px solid #f0dfa8;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

.workflow-modal.workflow-modal--schedule > .workflow-simple__section:not(.workflow-schedule__type-wrap):nth-last-of-type(2) .workflow-schedule__select span:last-child::after {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #f0dfa8;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__notes {
  display: grid;
  gap: 16px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__actions .workflow-modal__submit--small {
  min-width: 86px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__note-check {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #17111b;
  font-size: 10px;
  line-height: 1.2;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__checkbox {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  background: #ea4f8d;
  position: relative;
  flex: 0 0 16px;
}

.workflow-modal.workflow-modal--schedule .workflow-schedule__checkbox::before {
  content: "\2713";
  color: #fff;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
}

@keyframes workflowScheduleModalIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.workflow-modal.workflow-modal--hired-success {
  width: min(calc(100vw - 28px), 612px);
  min-height: 412px;
  padding: 18px 22px 18px;
  border-radius: 16px;
  text-align: center;
  overflow: hidden;
  animation: workflowScheduleModalIn 0.22s ease-out;
}

.workflow-modal.workflow-modal--hired-success .workflow-modal__close {
  top: 16px;
  right: 16px;
  color: #2f2730;
  font-size: 20px;
}

.workflow-hired-success__confetti {
  display: block;
  width: calc(100% + 36px);
  max-width: none;
  margin: -6px 0 2px -18px;
  pointer-events: none;
}

.workflow-hired-success__eyebrow {
  margin: -8px 0 6px;
  color: #151018;
  font-size: 18px;
  font-weight: 500;
}

.workflow-hired-success__figure {
  display: block;
  width: 154px;
  margin: 0 auto 10px;
}

.workflow-modal.workflow-modal--hired-success h4 {
  margin: 0 0 10px;
  color: #ff5c93;
  font-size: 18px;
  font-weight: 500;
}

.workflow-hired-success__text {
  max-width: 360px;
  margin: 0 auto 24px;
  color: #8e8a8d;
  font-size: 12px;
  line-height: 1.2;
  white-space: pre-line;
}

.workflow-modal__submit--hired {
  min-width: 238px;
  height: 42px;
  border-radius: 10px;
  background: #ea4f8d;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}
</style>
