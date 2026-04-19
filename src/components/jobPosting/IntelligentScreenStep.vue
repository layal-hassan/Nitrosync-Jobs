<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { sendNitroSyncAiCommand, aiTaskTimeoutMs, aiTaskEndpoint } from '../../composables/useNitroSyncAi'
import { getNitroSyncIntelligentScreenQuestions } from '../../composables/useNitroSyncIntelligentScreenQuestions'
import { fetchNitroSyncJobStages } from '../../composables/useNitroSyncJobStages'
import Dropdown from '../ui/Dropdown.vue'

const props = defineProps({
  stage: {
    type: Number,
    required: true,
  },
  form: {
    type: Object,
    required: true,
  },
  selectedTypes: {
    type: Array,
    default: () => [],
  },
  aiCommand: {
    type: String,
    default: '',
  },
  relatedCompany: {
    type: String,
    default: '',
  },
  jobId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:selectedTypes', 'request-add-question', 'select-question-type'])

const classificationItems = [
  { label: 'Bonus', value: '0 - 5%', color: '#f25793' },
  { label: 'Advantagous', value: '6 - 10%', color: '#3f6fff' },
  { label: 'Significant', value: '11 - 20%', color: '#6b21d8' },
  { label: 'Essential', value: '21 - 30%', color: '#ffb84d' },
  { label: 'Deal Breaker', value: '31 - 100%', color: '#41d66b' },
]

const selectedType = ref('')
const typeOptions = ['Choose the type of questions', 'Checkboxes', 'Record Video', 'Multiple choice', 'Open Text', 'Data Range', 'Media Upload']
const questionTypes = [
  { id: 'checkboxes', label: 'Checkboxes' },
  { id: 'record_video', label: 'Record Video' },
  { id: 'multiple_choice', label: 'Multiple choice' },
  { id: 'open_text', label: 'Open Text' },
  { id: 'date_range', label: 'Data Range' },
  { id: 'media_upload', label: 'Media Upload' },
]
const scoreRangeOptions = [
  { id: 'less_than', label: 'If the score is totally less than', fields: ['upper'] },
  { id: 'less_than_or_equal', label: 'If the score is totally less than or equal', fields: ['upper'] },
  { id: 'less_than_and_greater_or_equal', label: 'If the score is totally less than range and more than or equal range', fields: ['upper', 'lower'] },
  { id: 'less_than_or_equal_and_greater_than', label: 'If the score is totally less than or equal range and more than range', fields: ['upper', 'lower'] },
  { id: 'greater_than_or_equal', label: 'If the score is totally more than or equal', fields: ['lower'] },
  { id: 'greater_than', label: 'If the score is totally more than', fields: ['lower'] },
]
const candidateMoveOptions = ref([{ label: 'Select Position', value: '' }])

const questionStageStart = 2
const questionStageEnd = computed(() => questionStageStart + props.selectedTypes.length - 1)
const activeQuestionType = computed(() => props.selectedTypes[props.stage - questionStageStart] ?? null)
const moveCriteriaStage = computed(() => questionStageEnd.value + 1)
const selectedQuestionTypeOptions = computed(() =>
  props.selectedTypes.map((typeId) => ({
    label: typeLabel(typeId),
    value: typeId,
  })),
)

const questionDrafts = reactive(props.form.questionDrafts)
const aiRequestLoading = ref(false)
const aiRequestMessage = ref('')
const aiRequestError = ref('')
const aiRequestStatus = ref('idle')
const lastSentCommand = ref('')
const lastResponseCode = ref('')
const aiAnswer = ref('')
const questionsLoading = ref(false)
const questionsMessage = ref('')
const questionsError = ref('')
const lastFetchedJobId = ref('')
const moveStagesLoading = ref(false)
const moveStagesError = ref('')

let nextCriteriaId = 2

const createCriteria = () => ({
  id: nextCriteriaId++,
  name: '',
  selectedConditionId: '',
  lowerValue: '',
  upperValue: '',
  moveTo: '',
  scoreMenuOpen: false,
})

const criteriaList = ref(props.form.criteriaList)
const questionTypeAliases = {
  checkboxes: 'checkboxes',
  checkbox: 'checkboxes',
  'multiple choice': 'multiple_choice',
  multiple_choice: 'multiple_choice',
  multiplechoice: 'multiple_choice',
  'record video': 'record_video',
  record_video: 'record_video',
  recordvideo: 'record_video',
  'open text': 'open_text',
  open_text: 'open_text',
  opentext: 'open_text',
  'data range': 'date_range',
  'date range': 'date_range',
  date_range: 'date_range',
  daterange: 'date_range',
  'media upload': 'media_upload',
  media_upload: 'media_upload',
  mediaupload: 'media_upload',
}

const updateSelectedTypes = (nextTypes) => {
  emit('update:selectedTypes', nextTypes)
}

const addType = (label) => {
  const type = questionTypes.find((item) => item.label === label)

  if (!type || props.selectedTypes.includes(type.id)) return

  updateSelectedTypes([...props.selectedTypes, type.id])
}

const removeType = (typeId) => {
  updateSelectedTypes(props.selectedTypes.filter((item) => item !== typeId))
}

const addSelectedType = () => {
  if (!selectedType.value || selectedType.value === typeOptions[0]) return

  addType(selectedType.value)
  selectedType.value = ''
}

const typeLabel = (typeId) => questionTypes.find((item) => item.id === typeId)?.label ?? typeId
const activeTypeLabel = computed(() => typeLabel(activeQuestionType.value))
const selectedConditionLabel = (conditionId) => scoreRangeOptions.find((option) => option.id === conditionId)?.label ?? 'Please select a conditional score range'
const defaultQuestionTitle = computed(() =>
  'Enter your question',
)
const defaultClassification = classificationItems[0]
const classificationLabelOptions = classificationItems.map((item) => item.label)

const createDefaultOptionClassification = () => ({
  label: defaultClassification.label,
  value: defaultClassification.value,
  color: defaultClassification.color,
})

const normalizeOptionClassifications = (classifications = [], options = []) =>
  options.map((_, index) => {
    const current = classifications[index]
    const matched = classificationItems.find((item) => item.label === current?.label)

    if (matched) {
      return {
        label: matched.label,
        value: current?.value || matched.value,
        color: current?.color || matched.color,
      }
    }

    return createDefaultOptionClassification()
  })

const ensureDraft = (typeId) => {
  if (!typeId) return null

  if (!questionDrafts[typeId]) {
    const options =
      typeId === 'record_video'
        ? ['']
        : typeId === 'multiple_choice' || typeId === 'checkboxes'
          ? ['', '']
          : []

    questionDrafts[typeId] = {
      title: '',
      options,
      optionClassifications: normalizeOptionClassifications([], options),
      startDate: '',
      endDate: '',
      classificationLabel: '',
      classificationValue: '',
      classificationColor: '',
    }
  }

  return questionDrafts[typeId]
}

const activeDraft = computed(() => ensureDraft(activeQuestionType.value))
const trimmedAiCommand = computed(() => String(props.aiCommand || '').trim())
const normalizeQuestionType = (value) => questionTypeAliases[String(value || '').trim().toLowerCase()] || ''
const normalizeQuestionOptions = (question) => {
  const rawOptions =
    question?.options_details ??
    question?.optionsDetails ??
    question?.options ??
    question?.answers ??
    question?.choices

  if (Array.isArray(rawOptions)) {
    return rawOptions.map((option) => String(option ?? '').trim()).filter(Boolean)
  }

  if (typeof rawOptions === 'string') {
    return rawOptions.split(',').map((option) => option.trim()).filter(Boolean)
  }

  return []
}

const updateDraftTitle = (value) => {
  if (!activeQuestionType.value) return
  ensureDraft(activeQuestionType.value).title = value
}

const updateDraftClassification = (typeId, label) => {
  if (!typeId) return

  const draft = ensureDraft(typeId)
  const selectedClassification = classificationItems.find((item) => item.label === label)

  draft.classificationLabel = selectedClassification?.label || ''
  draft.classificationValue = selectedClassification?.value || ''
  draft.classificationColor = selectedClassification?.color || ''
}

const jumpToQuestionType = (typeId) => {
  const nextIndex = props.selectedTypes.findIndex((item) => item === typeId)
  if (nextIndex < 0) return
  emit('select-question-type', questionStageStart + nextIndex)
}

const updateDraftOption = (index, value) => {
  if (!activeQuestionType.value) return
  ensureDraft(activeQuestionType.value).options[index] = value
}

const updateDraftOptionClassification = (index, label) => {
  if (!activeQuestionType.value) return

  const draft = ensureDraft(activeQuestionType.value)
  if (!draft) return

  const selectedClassification = classificationItems.find((item) => item.label === label) || defaultClassification
  draft.optionClassifications = normalizeOptionClassifications(draft.optionClassifications, draft.options)
  draft.optionClassifications[index] = {
    label: selectedClassification.label,
    value: selectedClassification.value,
    color: selectedClassification.color,
  }
}

const getDraftOptionClassification = (index) => {
  const draft = activeDraft.value
  if (!draft) return createDefaultOptionClassification()
  draft.optionClassifications = normalizeOptionClassifications(draft.optionClassifications, draft.options)
  return draft.optionClassifications[index] || createDefaultOptionClassification()
}

const addDraftOption = () => {
  if (!activeQuestionType.value) return
  const draft = ensureDraft(activeQuestionType.value)
  draft.options.push('')
  draft.optionClassifications = normalizeOptionClassifications(draft.optionClassifications, draft.options)
}

const removeDraftOption = (index) => {
  if (!activeQuestionType.value) return

  const draft = ensureDraft(activeQuestionType.value)
  if (!draft) return

  if (draft.options.length <= 1) {
    draft.options = ['']
    draft.optionClassifications = normalizeOptionClassifications([], draft.options)
    return
  }

  draft.options.splice(index, 1)
  draft.optionClassifications.splice(index, 1)
  draft.optionClassifications = normalizeOptionClassifications(draft.optionClassifications, draft.options)
}

const requestAddQuestion = () => {
  emit('request-add-question')
}

const removeActiveQuestion = () => {
  if (!activeQuestionType.value) return
  removeType(activeQuestionType.value)
}

const toggleScoreMenu = (criteriaId) => {
  criteriaList.value = criteriaList.value.map((criteria) => ({
    ...criteria,
    scoreMenuOpen: criteria.id === criteriaId ? !criteria.scoreMenuOpen : false,
  }))
  props.form.criteriaList = criteriaList.value
}

const selectCondition = (criteriaId, conditionId) => {
  criteriaList.value = criteriaList.value.map((criteria) =>
    criteria.id === criteriaId
      ? {
          ...criteria,
          selectedConditionId: conditionId,
          scoreMenuOpen: false,
        }
      : criteria,
  )
  props.form.criteriaList = criteriaList.value
}

const updateCriteria = (criteriaId, field, value) => {
  criteriaList.value = criteriaList.value.map((criteria) =>
    criteria.id === criteriaId ? { ...criteria, [field]: value } : criteria,
  )
  props.form.criteriaList = criteriaList.value
}

const duplicateCriteria = (criteriaId) => {
  const criteria = criteriaList.value.find((item) => item.id === criteriaId)

  if (!criteria) return

  criteriaList.value = [
    ...criteriaList.value,
    {
      ...criteria,
      id: nextCriteriaId++,
      scoreMenuOpen: false,
    },
  ]
  props.form.criteriaList = criteriaList.value
}

const removeCriteria = (criteriaId) => {
  if (criteriaList.value.length === 1) {
    criteriaList.value = [{
      id: 1,
      name: '',
      selectedConditionId: '',
      lowerValue: '',
      upperValue: '',
      moveTo: '',
      scoreMenuOpen: false,
    }]
    props.form.criteriaList = criteriaList.value
    nextCriteriaId = Math.max(nextCriteriaId, 2)
    return
  }

  criteriaList.value = criteriaList.value.filter((criteria) => criteria.id !== criteriaId)
  props.form.criteriaList = criteriaList.value
}

const addNewCriteria = () => {
  criteriaList.value = [...criteriaList.value, createCriteria()]
  props.form.criteriaList = criteriaList.value
}

const applyFetchedQuestions = (questions = []) => {
  const nextTypes = []
  const nextDrafts = {}

  questions.forEach((question, index) => {
    const typeId = normalizeQuestionType(
      question?.question_type ??
      question?.questionType ??
      question?.type,
    )

    if (!typeId) return

    const title = String(
      question?.question ??
      question?.title ??
      question?.question_title ??
      question?.questionTitle ??
      '',
    ).trim()

    const options = normalizeQuestionOptions(question)

    if (!nextTypes.includes(typeId)) {
      nextTypes.push(typeId)
    }

    nextDrafts[typeId] = {
      title: title || `${typeLabel(typeId)} ${index + 1}`,
      options,
      optionClassifications: normalizeOptionClassifications(
        question?.option_classifications ??
        question?.answer_classifications ??
        question?.options_meta ??
        [],
        options,
      ),
      startDate: String(question?.start_date ?? question?.startDate ?? '').trim(),
      endDate: String(question?.end_date ?? question?.endDate ?? '').trim(),
      classificationLabel: String(
        question?.classification_label ??
        question?.weight_label ??
        question?.question_color ??
        '',
      ).trim(),
      classificationValue: String(
        question?.classification_value ??
        question?.weight_range ??
        question?.weight ??
        '',
      ).trim(),
      classificationColor: String(
        question?.classification_color ??
        question?.color ??
        '',
      ).trim(),
    }

    if (nextDrafts[typeId].classificationLabel) {
      const matchingClassification = classificationItems.find((item) => item.label === nextDrafts[typeId].classificationLabel)

      if (matchingClassification) {
        nextDrafts[typeId].classificationValue = nextDrafts[typeId].classificationValue || matchingClassification.value
        nextDrafts[typeId].classificationColor = nextDrafts[typeId].classificationColor || matchingClassification.color
      }
    }
  })

  updateSelectedTypes(nextTypes)
  Object.keys(questionDrafts).forEach((key) => {
    delete questionDrafts[key]
  })
  Object.assign(questionDrafts, nextDrafts)
  props.form.questionDrafts = questionDrafts
}

const syncCandidateMoveOptions = (rows = []) => {
  const stageOptions = rows
    .map((item) => ({
      label: String(item?.label || '').trim(),
      value: String(item?.label || '').trim(),
    }))
    .filter((item) => item.label)

  const existingSelections = criteriaList.value
    .map((item) => String(item?.moveTo || '').trim())
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .filter((value) => !stageOptions.some((option) => option.value === value))
    .map((value) => ({ label: value, value }))

  candidateMoveOptions.value = [
    { label: 'Select Position', value: '' },
    ...stageOptions,
    ...existingSelections,
  ]
}

const fetchMoveStages = async () => {
  const relatedCompany = String(props.relatedCompany || '').trim()

  if (!relatedCompany) {
    syncCandidateMoveOptions()
    return
  }

  moveStagesLoading.value = true
  moveStagesError.value = ''

  try {
    const rows = await fetchNitroSyncJobStages(relatedCompany)
    syncCandidateMoveOptions(rows)
  } catch (error) {
    moveStagesError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to load job stages for move criteria.'
    syncCandidateMoveOptions()
  } finally {
    moveStagesLoading.value = false
  }
}

const fetchQuestions = async () => {
  const relatedCompany = String(props.relatedCompany || '').trim()
  const jobId = String(props.jobId || '').trim()

  if (!relatedCompany) return

  if (!jobId) {
    questionsLoading.value = false
    questionsError.value = ''
    questionsMessage.value = 'Create the intelligent screen questions here. They will be sent to the backend when you save or publish the job.'
    lastFetchedJobId.value = ''
    return
  }

  if (lastFetchedJobId.value === jobId) return

  questionsLoading.value = true
  questionsMessage.value = ''
  questionsError.value = ''

  try {
    const response = await getNitroSyncIntelligentScreenQuestions({
      relatedCompany,
      jobId,
    })

    const rows = Array.isArray(response?.data) ? response.data : []

    if (rows.length) {
      applyFetchedQuestions(rows)
      questionsMessage.value = response?.message || 'Intelligent screen questions loaded.'
    } else {
      questionsMessage.value = response?.message === 'No Data Found'
        ? 'No saved intelligent screen questions were found for this job yet. Create them here and save the job to send them to the backend.'
        : response?.message || 'No intelligent screen questions were returned for this job.'
    }

    lastFetchedJobId.value = jobId
  } catch (error) {
    questionsError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      'Failed to load intelligent screen questions.'
  } finally {
    questionsLoading.value = false
  }
}

watch(
  () => [props.relatedCompany, props.jobId],
  () => {
    fetchQuestions()
  },
  { immediate: true },
)

watch(
  () => props.relatedCompany,
  () => {
    fetchMoveStages()
  },
  { immediate: true },
)

const sendAiCommand = async () => {
  lastSentCommand.value = trimmedAiCommand.value

  if (!trimmedAiCommand.value) {
    aiRequestStatus.value = 'error'
    lastResponseCode.value = ''
    aiRequestMessage.value = ''
    aiRequestError.value = 'Add at least the job title or description before sending the AI command.'
    return
  }

  aiRequestLoading.value = true
  aiRequestStatus.value = 'sending'
  lastResponseCode.value = ''
  aiRequestMessage.value = ''
  aiRequestError.value = ''
  aiAnswer.value = ''

  try {
    const response = await sendNitroSyncAiCommand(trimmedAiCommand.value)

    aiRequestMessage.value =
      response?.message ||
      response?.code ||
      'AI command sent successfully.'
    lastResponseCode.value = response?.code || ''
    aiAnswer.value = response?.answer || ''
    aiRequestStatus.value = 'success'
  } catch (error) {
    const responseStatus = error?.response?.status
    const isTimeoutError = error?.code === 'ECONNABORTED' || String(error?.message || '').includes('timeout')
    aiRequestError.value =
      isTimeoutError
        ? `The AI request took longer than ${aiTaskTimeoutMs / 1000} seconds. Please try again.`
        :
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.code ||
      error?.message ||
      'Failed to send the AI command.'
    lastResponseCode.value =
      error?.response?.data?.code ||
      (responseStatus ? `HTTP ${responseStatus}` : '') ||
      error?.code ||
      ''
    aiRequestStatus.value = 'error'

    console.error('Failed to send AI command', {
      endpoint: aiTaskEndpoint,
      payload: {
        command: trimmedAiCommand.value,
      },
      error,
    })
  } finally {
    aiRequestLoading.value = false
  }
}
</script>

<template>
  <div class="intelligent-screen">
    <div class="intelligent-screen__intro">
      <h3 class="intelligent-screen__title">Step 3: Intelligent Screen</h3>
      <p class="intelligent-screen__text">
        Make smarter hiring decisions, our intelligent screening and advancement system automates evaluations based on your criteria, ensuring efficient and fair assessments for every candidate.
      </p>
      <p v-if="questionsLoading" class="intelligent-screen__helper">Loading intelligent screen questions...</p>
      <p v-else-if="questionsMessage" class="intelligent-screen__helper intelligent-screen__helper--success">{{ questionsMessage }}</p>
      <p v-if="questionsError" class="intelligent-screen__helper intelligent-screen__helper--error">{{ questionsError }}</p>
    </div>

    <div class="classification-bar">
      <span
        v-for="item in classificationItems"
        :key="item.label"
        class="classification-bar__item"
        :style="{ '--item-color': item.color }"
      >
        <i></i>
      </span>
    </div>

    <template v-if="stage === 0">
      <div class="classification-intro">
        <h4>Introducing Applicant classification System</h4>
        <p>
          Make smarter hiring decisions, our intelligent screening and Advancement system automates evaluations
          based on your criteria, ensuring efficient and fair assessments for every candidate.
        </p>
      </div>

      <div class="criteria-grid">
        <article v-for="item in classificationItems" :key="item.label" class="criteria-card" :style="{ '--item-color': item.color }">
          <div class="criteria-card__top">
            <strong>{{ item.label }}</strong>
            <span>{{ item.value }}</span>
          </div>
          <div class="criteria-card__bar" aria-hidden="true"></div>
          <p>
            Make smarter hiring decisions, our intelligent screening and advancement system automates evaluations based on your criteria, ensuring efficient and fair assessments for every candidate.
          </p>
        </article>
      </div>
    </template>

    <template v-else-if="stage === 1">
      <div class="type-chooser">
        <Dropdown v-model="selectedType" :options="typeOptions" placeholder="Choose the type of questions" />
        <div class="type-chooser__list">
          <div v-for="item in typeOptions.slice(1)" :key="item" class="type-row">
            <span>{{ item }}</span>
            <button type="button" @click="addType(item)">Add</button>
          </div>
        </div>
        <div v-if="props.selectedTypes.length" class="selected-types">
          <h4>Selected types</h4>
          <div class="selected-types__chips">
            <span v-for="type in props.selectedTypes" :key="type">
              {{ typeLabel(type) }} <i @click="removeType(type)">x</i>
            </span>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="activeQuestionType && stage >= questionStageStart && stage <= questionStageEnd">
      <div class="question-builder">
          <div class="question-builder__card">
          <div class="question-builder__header">
            <input
              class="question-builder__title-input"
              :value="activeDraft?.title || ''"
              type="text"
              :placeholder="defaultQuestionTitle"
              @input="updateDraftTitle($event.target.value)"
            />
            <div class="question-builder__type">
              <Dropdown
                :model-value="activeQuestionType"
                :options="selectedQuestionTypeOptions"
                :placeholder="typeOptions[0]"
                @update:model-value="jumpToQuestionType"
              />
            </div>
          </div>

          <div class="question-builder__meta">
            <div class="question-builder__meta-field question-builder__meta-field--weight">
              <label class="question-builder__meta-label">Question</label>
              <div class="question-builder__weight question-builder__weight--muted">
                Answer weights are set per answer below.
              </div>
            </div>
          </div>

          <div v-if="activeQuestionType === 'record_video'" class="question-builder__body">
            <p class="question-builder__desc">Add the question, then enter the answers you want to show to the candidate.</p>
            <div v-for="(option, index) in activeDraft?.options || []" :key="`record-${index}`" class="question-builder__option-card">
              <label class="question-builder__option">
                <input type="radio" :checked="index === 0" />
                <input
                  class="question-builder__option-input"
                  :value="option"
                  type="text"
                  placeholder="Enter answer"
                  @input="updateDraftOption(index, $event.target.value)"
                />
                <div class="question-builder__option-side">
                  <Dropdown
                    :model-value="getDraftOptionClassification(index).label"
                    :options="classificationLabelOptions"
                    placeholder="Select weight"
                    @update:model-value="updateDraftOptionClassification(index, $event)"
                  />
                  <button type="button" class="question-builder__option-remove" @click="removeDraftOption(index)">
                    Delete
                  </button>
                </div>
              </label>
              <div
                class="question-builder__answer-weight"
                :style="{ '--answer-color': getDraftOptionClassification(index).color }"
              >
                <span>{{ getDraftOptionClassification(index).label }}</span>
                <strong>{{ getDraftOptionClassification(index).value }}</strong>
              </div>
            </div>
            <button type="button" class="question-builder__link" @click="addDraftOption">+ Add answer</button>
          </div>

          <div v-else-if="activeQuestionType === 'multiple_choice' || activeQuestionType === 'checkboxes'" class="question-builder__body">
            <div
              v-for="(option, index) in activeDraft?.options || []"
              :key="`choice-${index}`"
              class="question-builder__option-card"
            >
              <label class="question-builder__option">
                <input :type="activeQuestionType === 'checkboxes' ? 'checkbox' : 'radio'" />
                <input
                  class="question-builder__option-input"
                  :value="option"
                  type="text"
                  placeholder="Enter answer"
                  @input="updateDraftOption(index, $event.target.value)"
                />
                <div class="question-builder__option-side">
                  <Dropdown
                    :model-value="getDraftOptionClassification(index).label"
                    :options="classificationLabelOptions"
                    placeholder="Select weight"
                    @update:model-value="updateDraftOptionClassification(index, $event)"
                  />
                  <button type="button" class="question-builder__option-remove" @click="removeDraftOption(index)">
                    Delete
                  </button>
                </div>
              </label>
              <div
                class="question-builder__answer-weight"
                :style="{ '--answer-color': getDraftOptionClassification(index).color }"
              >
                <span>{{ getDraftOptionClassification(index).label }}</span>
                <strong>{{ getDraftOptionClassification(index).value }}</strong>
              </div>
            </div>
            <button type="button" class="question-builder__link" @click="addDraftOption">+ Add answer</button>
          </div>

          <div v-else-if="activeQuestionType === 'open_text'" class="question-builder__body">
            <div class="upload-zone">Candidate writes the answer here</div>
          </div>

          <div v-else-if="activeQuestionType === 'date_range'" class="question-builder__body question-builder__body--range">
            <div class="range-grid">
              <div>
                <label>Start's in</label>
                <input :value="activeDraft?.startDate || ''" type="text" placeholder="Jun 2025, 2023" @input="ensureDraft(activeQuestionType).startDate = $event.target.value" />
              </div>
              <div>
                <label>Ends before</label>
                <input :value="activeDraft?.endDate || ''" type="text" placeholder="Jun 2025, 2023" @input="ensureDraft(activeQuestionType).endDate = $event.target.value" />
              </div>
            </div>
            <button type="button" class="question-builder__link">Add new date range</button>
          </div>

          <div v-else class="question-builder__body">
            <div class="upload-zone">Drag and drop files here<br />or browse files</div>
          </div>

          <div class="question-builder__footer">
            <div class="question-builder__badges">
              <span class="badge badge--green">Answered <small>85%</small></span>
              <span class="badge badge--violet">Not recorded <small>15%</small></span>
            </div>
            <div class="question-builder__actions">
              <button type="button" @click="removeActiveQuestion">Delete</button>
              <button type="button">Edit values</button>
            </div>
          </div>
        </div>

        <button type="button" class="question-builder__add" @click="requestAddQuestion">+ Add new Question</button>
      </div>
    </template>

    <template v-else>
      <div class="move-criteria">
        <h4>Move Criteria</h4>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum.</p>
        <p v-if="moveStagesLoading" class="move-criteria__feedback">Loading job stages...</p>
        <p v-else-if="moveStagesError" class="move-criteria__feedback move-criteria__feedback--error">{{ moveStagesError }}</p>

        <div
          v-for="criteria in criteriaList"
          :key="criteria.id"
          class="move-criteria__card"
        >
          <input
            :value="criteria.name"
            type="text"
            placeholder="criteria name will be shown here, and you can edit it"
            @input="updateCriteria(criteria.id, 'name', $event.target.value)"
          />
          <div class="move-criteria__field">
            <label>score range</label>
            <div class="criteria-select">
              <button type="button" class="criteria-select__trigger" @click="toggleScoreMenu(criteria.id)">
                <span>{{ selectedConditionLabel(criteria.selectedConditionId) }}</span>
                <span class="criteria-select__arrow" :class="{ 'criteria-select__arrow--open': criteria.scoreMenuOpen }"></span>
              </button>

              <div v-if="criteria.scoreMenuOpen" class="criteria-select__menu">
                <button
                  v-for="option in scoreRangeOptions"
                  :key="option.id"
                  type="button"
                  class="criteria-select__option"
                  @click="selectCondition(criteria.id, option.id)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="criteria.selectedConditionId" class="move-criteria__conditions">
            <div v-if="criteria.selectedConditionId === 'less_than'" class="condition-builder">
              <span>If the score is totally less than</span>
              <input :value="criteria.upperValue" type="text" inputmode="numeric" placeholder="000" @input="updateCriteria(criteria.id, 'upperValue', $event.target.value)" />
            </div>

            <div v-else-if="criteria.selectedConditionId === 'less_than_or_equal'" class="condition-builder">
              <span>If the score is totally less than or equal</span>
              <input :value="criteria.upperValue" type="text" inputmode="numeric" placeholder="000" @input="updateCriteria(criteria.id, 'upperValue', $event.target.value)" />
            </div>

            <div v-else-if="criteria.selectedConditionId === 'less_than_and_greater_or_equal'" class="condition-builder">
              <span>totally Less than</span>
              <input :value="criteria.upperValue" type="text" inputmode="numeric" placeholder="000" @input="updateCriteria(criteria.id, 'upperValue', $event.target.value)" />
              <span>,and more than or equal</span>
              <input :value="criteria.lowerValue" type="text" inputmode="numeric" placeholder="000" @input="updateCriteria(criteria.id, 'lowerValue', $event.target.value)" />
            </div>

            <div v-else-if="criteria.selectedConditionId === 'less_than_or_equal_and_greater_than'" class="condition-builder">
              <span>totally Less than or equal</span>
              <input :value="criteria.upperValue" type="text" inputmode="numeric" placeholder="000" @input="updateCriteria(criteria.id, 'upperValue', $event.target.value)" />
              <span>,and more than</span>
              <input :value="criteria.lowerValue" type="text" inputmode="numeric" placeholder="000" @input="updateCriteria(criteria.id, 'lowerValue', $event.target.value)" />
            </div>

            <div v-else-if="criteria.selectedConditionId === 'greater_than_or_equal'" class="condition-builder">
              <span>If the score is totally more than or equal</span>
              <input :value="criteria.lowerValue" type="text" inputmode="numeric" placeholder="000" @input="updateCriteria(criteria.id, 'lowerValue', $event.target.value)" />
            </div>

            <div v-else class="condition-builder">
              <span>If the score is totally more than</span>
              <input :value="criteria.lowerValue" type="text" inputmode="numeric" placeholder="000" @input="updateCriteria(criteria.id, 'lowerValue', $event.target.value)" />
            </div>
          </div>

          <div class="move-criteria__field">
            <label>move candidate to</label>
            <Dropdown
              :model-value="criteria.moveTo"
              :options="candidateMoveOptions"
              placeholder="Please select a response"
              @update:model-value="updateCriteria(criteria.id, 'moveTo', $event)"
            />
          </div>

          <div class="move-criteria__buttons">
            <button type="button" @click="duplicateCriteria(criteria.id)">Duplicate criteria</button>
            <button type="button" @click="removeCriteria(criteria.id)">Remove</button>
          </div>
        </div>

        <button type="button" class="move-criteria__add" @click="addNewCriteria">+ Add new criteria</button>
        <button
          v-if="stage === moveCriteriaStage"
          type="button"
          class="move-criteria__ai"
          :disabled="aiRequestLoading"
          @click="sendAiCommand"
        >
          {{ aiRequestLoading ? 'Sending AI command...' : 'Auto-generate screening rules with AI' }}
        </button>
        <div v-if="stage === moveCriteriaStage" class="move-criteria__debug">
          <p><strong>Status:</strong> {{ aiRequestStatus }}</p>
          <p v-if="lastResponseCode"><strong>Code:</strong> {{ lastResponseCode }}</p>
          <p v-if="lastSentCommand"><strong>Last command:</strong> {{ lastSentCommand }}</p>
          <p v-else><strong>Last command:</strong> no command sent yet</p>
        </div>
        <p v-if="aiRequestMessage" class="move-criteria__feedback move-criteria__feedback--success">{{ aiRequestMessage }}</p>
        <p v-if="aiRequestError" class="move-criteria__feedback move-criteria__feedback--error">{{ aiRequestError }}</p>
        <div v-if="aiAnswer" class="move-criteria__answer">
          <h5>AI Answer</h5>
          <pre>{{ aiAnswer }}</pre>
        </div>
      </div>
    </template>
  </div>
</template>

<style>
.intelligent-screen__intro {
  margin-bottom: 24px;
}

.intelligent-screen__title {
  margin: 0;
  font-size: var(--font-section-title);
  font-weight: 600;
  color: #17111b;
}

.intelligent-screen__text {
  margin: 8px 0 0;
  max-width: 760px;
  color: #d1c3ca;
  font-size: var(--font-small);
  line-height: 1.4;
}

.intelligent-screen__helper {
  margin: 10px 0 0;
  font-size: var(--font-small);
  line-height: 1.4;
  color: #b3a5ad;
}

.intelligent-screen__helper--success {
  color: #1d8f46;
}

.intelligent-screen__helper--error {
  color: #d13c6a;
}

.classification-bar {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 20px;
}

.classification-bar__item {
  display: block;
}

.classification-bar__item i {
  display: block;
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: var(--item-color);
}

.classification-intro {
  padding: 20px 0 16px;
  border-top: 1px solid #f2e8ec;
}

.classification-intro h4 {
  margin: 0;
  font-size: var(--font-label);
  font-weight: 600;
  color: #17111b;
}

.classification-intro p {
  margin: 10px 0 0;
  max-width: 760px;
  font-size: var(--font-small);
  line-height: 1.4;
  color: #d1c3ca;
}

.criteria-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.criteria-card {
  border: 1px solid #cfe6ff;
  border-radius: 18px;
  padding: 18px 18px 20px;
  background: #f7fbff;
  min-height: 196px;
}

.criteria-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
  font-size: var(--font-small);
  margin-bottom: 22px;
}

.criteria-card__top strong {
  font-size: var(--font-label);
  font-weight: 500;
  text-transform: capitalize;
}

.criteria-card__top span {
  color: var(--item-color);
  font-size: var(--font-small);
}

.criteria-card__bar {
  width: 100%;
  height: 22px;
  margin-bottom: 24px;
  background: var(--item-color);
}

.criteria-card p {
  margin: 0;
  max-width: 430px;
  font-size: var(--font-body);
  line-height: 1.25;
  color: #c3c8ce;
}

.type-chooser__list,
.selected-types {
  margin-top: 20px;
}

.type-row {
  min-height: 52px;
  padding: 0 16px;
  border: 1px solid #efe4e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-body);
  color: #17111b;
}

.type-row + .type-row {
  border-top: 0;
}

.type-row button,
.selected-types__chips span {
  font-size: var(--font-small);
  color: #ea4f8d;
}

.selected-types h4 {
  margin: 0 0 10px;
  font-size: var(--font-label);
  color: #17111b;
}

.selected-types__chips {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.selected-types__chips span {
  padding: 8px 12px;
  border-radius: 999px;
  background: #fff0f6;
}

.question-builder__card,
.move-criteria__card {
  border: 1px solid #efe4e8;
  border-radius: 12px;
  padding: 18px 20px;
  background: #fff;
}

.question-builder__header {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;
}

.question-builder__title-input {
  border: 0;
  border-bottom: 1px solid #ebd7e0;
  padding: 12px 0;
  font-size: var(--font-body);
  color: #17111b;
}

.question-builder__body {
  padding: 20px 0;
}

.question-builder__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 16px;
  padding-top: 18px;
}

.question-builder__meta-field {
  min-width: 0;
}

.question-builder__meta-label {
  display: block;
  margin-bottom: 10px;
  font-size: var(--ui-small-font);
  color: #17111b;
}

.question-builder__meta-field--weight {
  display: flex;
  flex-direction: column;
}

.question-builder__weight {
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid var(--weight-color);
  border-radius: 12px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  color: #5f555c;
  font-size: var(--font-small);
}

.question-builder__weight--muted {
  border-color: #efe4e8;
  color: #9f9097;
}

.question-builder__desc {
  margin: 0 0 16px;
  color: #b3a5ad;
  font-size: var(--ui-small-font);
  line-height: 1.4;
}

.question-builder__option-card {
  margin-bottom: 14px;
}

.question-builder__option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: var(--font-body);
  line-height: 1.35;
  color: #17111b;
}

.question-builder__option-input {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 40px;
  border: 0;
  border-bottom: 1px solid #ecdbe3;
  background: transparent;
  color: #17111b;
  font-size: var(--font-body);
}

.question-builder__option-side {
  width: 220px;
  flex: 0 0 220px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.question-builder__option-side :deep(.dropdown) {
  width: 100%;
}

.question-builder__option-side :deep(.dropdown__trigger) {
  min-height: 40px;
  height: 40px;
  border-radius: 12px;
  background: #fff;
}

.question-builder__option-remove {
  flex: 0 0 auto;
  color: #ea6f9b;
  font-size: var(--ui-small-font);
  white-space: nowrap;
}

.question-builder__answer-weight {
  width: calc(100% - 38px);
  min-height: 42px;
  margin-top: 8px;
  margin-left: 38px;
  padding: 0 14px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--answer-color) 18%, #ffffff);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #3b2d35;
  font-size: var(--font-small);
}

.question-builder__answer-weight span {
  font-weight: 500;
}

.question-builder__answer-weight strong {
  color: var(--answer-color);
  font-weight: 600;
}

.question-builder__link,
.move-criteria__add,
.move-criteria__ai,
.question-builder__add {
  color: #ea4f8d;
  font-size: var(--font-button);
}

.question-builder__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid #f0e5ea;
}

.question-builder__badges {
  display: flex;
  gap: 10px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  color: #fff;
  font-size: var(--font-small);
}

.badge--green { background: #41d66b; }
.badge--violet { background: #6b21d8; }

.question-builder__actions {
  display: flex;
  gap: 16px;
}

.question-builder__actions button {
  color: #ea6f9b;
  font-size: var(--ui-small-font);
}

.question-builder__add,
.move-criteria__add {
  display: block;
  width: 100%;
  min-height: 48px;
  margin-top: 16px;
  border: 1px dashed #f0dfe6;
  border-radius: 10px;
  font-size: var(--ui-small-font);
}

.upload-zone {
  min-height: 140px;
  border: 1px dashed #eadbe3;
  border-radius: 10px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #9f9097;
  font-size: var(--ui-small-font);
  line-height: 1.4;
}

.range-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.range-grid label,
.move-criteria__field label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--ui-small-font);
  color: #17111b;
}

.move-criteria h4 {
  margin: 0 0 8px;
  font-size: var(--font-label);
  color: #17111b;
}

.move-criteria p {
  margin: 0 0 16px;
  color: #b3a5ad;
  font-size: var(--ui-small-font);
  line-height: 1.4;
}

.move-criteria__card > input {
  width: 100%;
  margin-bottom: 14px;
  font-size: var(--font-body);
}

.move-criteria__field + .move-criteria__field {
  margin-top: 14px;
}

.move-criteria__conditions {
  margin-top: 5px;
  padding: 2px 16px;
  border-radius: 14px;
  background: #faf8fa;
}

.criteria-select {
  position: relative;
}

.criteria-select__trigger {
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid #e4dbe0;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #85757d;
  font-size: var(--font-body);
  text-align: left;
}

.criteria-select__arrow {
  width: 10px;
  height: 10px;
  border-right: 2px solid #9f9097;
  border-bottom: 2px solid #9f9097;
  transform: rotate(45deg);
  transition: transform 0.18s ease;
  flex: 0 0 auto;
}

.criteria-select__arrow--open {
  transform: rotate(-135deg);
}

.criteria-select__menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 5;
  background: #fff;
  border: 1px solid #efe4e8;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(31, 22, 36, 0.08);
  overflow: hidden;
}

.criteria-select__option {
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid #f4eaee;
  text-align: left;
  color: #17111b;
  font-size: var(--font-body);
}

.criteria-select__option:last-child {
  border-bottom: 0;
}

.condition-builder {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.condition-builder span {
  font-size: 17px;
  line-height: 1.2;
  color: #17111b;
}

.condition-builder input {
  width: 62px;
  min-height: 58px;
  padding: 0 10px;
  border: 1px solid #f0dfe6;
  border-radius: 14px;
  background: #f3f3f3;
  color: #17111b;
  font-size: 18px;
  text-align: center;
}

.condition-builder input::placeholder {
  color: #c4b8be;
}

.condition-row {
  font-size: var(--font-small);
  line-height: 1.45;
  color: #17111b;
}

.condition-row span {
  color: #ea4f8d;
}

.move-criteria__buttons {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}

.move-criteria__buttons button {
  color: #ea6f9b;
  font-size: var(--ui-small-font);
}

.move-criteria__ai {
  display: block;
  margin: 12px auto 0;
}

.move-criteria__ai:disabled {
  opacity: 0.65;
  cursor: wait;
}

.move-criteria__feedback {
  margin: 12px 0 0;
  text-align: center;
  font-size: var(--font-small);
  line-height: 1.4;
}

.move-criteria__debug {
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid #efe4e8;
  border-radius: 12px;
  background: #fff7fa;
  font-size: var(--font-small);
  line-height: 1.5;
  color: #5b4a52;
  word-break: break-word;
}

.move-criteria__debug p {
  margin: 0;
}

.move-criteria__debug p + p {
  margin-top: 6px;
}

.move-criteria__feedback--success {
  color: #1d8f46;
}

.move-criteria__feedback--error {
  color: #d13c6a;
}

.move-criteria__answer {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #efe4e8;
  border-radius: 12px;
  background: #fff;
}

.move-criteria__answer h5 {
  margin: 0 0 10px;
  font-size: var(--font-label);
  color: #17111b;
}

.move-criteria__answer pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: var(--font-small);
  line-height: 1.6;
  color: #5b4a52;
}

@media (max-width: 900px) {
  .classification-bar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .criteria-grid,
  .range-grid {
    grid-template-columns: 1fr;
  }

  .question-builder__header {
    grid-template-columns: 1fr;
  }

  .question-builder__meta {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .classification-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .question-builder__footer,
  .question-builder__actions,
  .question-builder__badges,
  .move-criteria__buttons {
    flex-wrap: wrap;
  }

  .question-builder__actions button,
  .move-criteria__buttons button {
    width: 100%;
    text-align: left;
  }

  .condition-builder input {
    width: 54px;
    min-height: 50px;
  }
}
</style>
