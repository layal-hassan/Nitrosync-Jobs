<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  createNitroSyncApplicationQuestion,
  fetchNitroSyncApplicationQuestions,
} from '../../composables/useNitroSyncApplicationForms'
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
  errors: {
    type: Object,
    default: () => ({}),
  },
})

const statusCycle = ['off', 'optional', 'mandatory']

const createQuestion = (text, status = 'off') => ({
  text,
  status,
})

const createSection = (title, icon, color, apiType = '', questions = [], headerOnly = false) => ({
  title,
  icon,
  color,
  apiType,
  headerOnly,
  expanded: false,
  addMode: false,
  customQuestion: '',
  questions,
})

const defaultSections = [
  createSection('Professional Information', 'user', '#d9d1d6', '', [], true),
  createSection('Experience', 'briefcase', '#ea4f8d', 'experience', [
    createQuestion('How many years of experience do you have in this or a similar role ?', 'off'),
    createQuestion('What type of environments have you worked in ?', 'mandatory'),
    createQuestion('When did you start working in your field ?', 'off'),
    createQuestion('Have you had experience doing this kind of work regularly ,occasionally ,or just once?', 'mandatory'),
  ]),
  createSection('Languages', 'language', '#ea4f8d', 'language', [
    createQuestion('Which languages do you speak ?', 'off'),
  ]),
  createSection('Education', 'book', '#52d66b', 'education', [
    createQuestion('Highest level of education ?', 'mandatory'),
    createQuestion('Name of your last school ?', 'off'),
  ]),
]

const cloneSections = (source) =>
  source.map((section) => createSection(
    section.title,
    section.icon,
    section.color,
    section.apiType,
    Array.isArray(section.questions)
      ? section.questions.map((question) => createQuestion(question.text, question.status))
      : [],
    section.headerOnly,
  ))

const sections = reactive(
  Array.isArray(props.form.applicationSections) && props.form.applicationSections.length
    ? cloneSections(props.form.applicationSections)
    : cloneSections(defaultSections),
)

const genderOptions = ['Select one of the list..', 'Male', 'Female']
const countryOptions = ['Select one of the list..', 'Jordan', 'Saudi Arabia', 'UAE']
const ethnicityOptions = ['Please select', 'Arab', 'Asian', 'European']
const disabilityOptions = ['Please select', 'No', 'Yes']
const cvInputRef = ref(null)
const coverLetterInputRef = ref(null)
const cvFileName = computed(() => props.form.cvFile?.name || '')
const coverLetterFileName = computed(() => props.form.coverLetterFile?.name || '')
const applicationQuestionsLoading = ref(false)
const applicationQuestionsError = ref('')
const createQuestionLoadingBySection = ref({})

const syncSectionsToForm = () => {
  props.form.applicationSections = sections.map((section) => ({
    title: section.title,
    icon: section.icon,
    color: section.color,
    apiType: section.apiType,
    headerOnly: section.headerOnly,
    questions: section.questions.map((question) => ({
      text: question.text,
      status: question.status,
    })),
  }))
}

const toggleSection = (section) => {
  if (section.headerOnly) return
  section.expanded = !section.expanded
}

const cycleStatus = (question) => {
  const currentIndex = statusCycle.indexOf(question.status)
  question.status = statusCycle[(currentIndex + 1) % statusCycle.length]
  syncSectionsToForm()
}

const cycleFieldStatus = (fieldKey) => {
  const currentStatus = props.form[fieldKey] || 'off'
  const currentIndex = statusCycle.indexOf(currentStatus)
  props.form[fieldKey] = statusCycle[(currentIndex + 1) % statusCycle.length]
}

const fieldClass = (fieldKey) => `app-field--${props.form[fieldKey] || 'off'}`

const openAddQuestion = (section) => {
  section.addMode = true
}

const addCustomQuestion = (section) => {
  const value = section.customQuestion.trim()
  if (!value) return

  saveCustomQuestion(section, value)
}

const iconPath = (type) => {
  switch (type) {
    case 'briefcase':
      return 'M8 7.5h8.5a1.8 1.8 0 0 1 1.8 1.8v6.9A1.8 1.8 0 0 1 16.5 18H8a1.8 1.8 0 0 1-1.8-1.8V9.3A1.8 1.8 0 0 1 8 7.5Zm2-2.8h4.5c.8 0 1.5.7 1.5 1.5v1.3H8.5V6.2c0-.8.7-1.5 1.5-1.5Z'
    case 'language':
      return 'M12.2 5.2c2.7 0 4.9 2.2 4.9 4.9 0 2.8-2.2 5-4.9 5a4.94 4.94 0 0 1-4.9-5c0-2.7 2.2-4.9 4.9-4.9Zm0 0c1.2 1.3 1.9 3.1 1.9 4.9s-.7 3.6-1.9 5m0-9.9c-1.2 1.3-1.9 3.1-1.9 4.9s.7 3.6 1.9 5m-4.7-5h9.4'
    case 'book':
      return 'M7.8 5.2h7.7a1.7 1.7 0 0 1 1.7 1.7v10.2H9.6A1.8 1.8 0 0 0 7.8 19V5.2Zm0 0H7a1.7 1.7 0 0 0-1.7 1.7v10.4A1.7 1.7 0 0 0 7 19h8.7'
    default:
      return 'M12 5.4a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Zm0 7c3 0 5.5 1.8 5.5 4v.4H6.5V16c0-2.2 2.5-4 5.5-4Z'
  }
}

const openCvPicker = () => {
  cvInputRef.value?.click()
}

const openCoverLetterPicker = () => {
  coverLetterInputRef.value?.click()
}

const updateFile = (field, event) => {
  props.form[field] = event.target.files?.[0] || null
}

const mergeApiQuestions = (rows) => {
  rows.forEach((item) => {
    const section = sections.find((entry) => entry.apiType === item.type)
    if (!section) return

    if (section.questions.some((question) => question.text === item.question)) return
    section.questions.push(createQuestion(item.question, 'off'))
  })
  syncSectionsToForm()
}

const loadApplicationQuestions = async () => {
  if (props.form.applicationQuestionsLoaded) return

  applicationQuestionsLoading.value = true
  applicationQuestionsError.value = ''

  try {
    const rows = await fetchNitroSyncApplicationQuestions()
    mergeApiQuestions(rows)
    props.form.applicationQuestionsLoaded = true
  } catch (error) {
    console.error('Failed to fetch application questions', error)
    applicationQuestionsError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.msg ||
      'Failed to load application questions.'
  } finally {
    applicationQuestionsLoading.value = false
  }
}

const saveCustomQuestion = async (section, value) => {
  if (value.length > 500) {
    applicationQuestionsError.value = 'Question must be 500 characters or less.'
    return
  }

  if (!section.apiType) {
    section.questions.push(createQuestion(value, 'off'))
    section.customQuestion = ''
    section.addMode = false
    section.expanded = true
    syncSectionsToForm()
    return
  }

  createQuestionLoadingBySection.value = {
    ...createQuestionLoadingBySection.value,
    [section.title]: true,
  }
  applicationQuestionsError.value = ''

  try {
    await createNitroSyncApplicationQuestion({
      type: section.apiType,
      question: value,
    })

    if (!section.questions.some((question) => question.text === value)) {
      section.questions.push(createQuestion(value, 'off'))
    }

    section.customQuestion = ''
    section.addMode = false
    section.expanded = true
    syncSectionsToForm()
  } catch (error) {
    console.error('Failed to create application question', {
      type: section.apiType,
      question: value,
      error,
    })
    const rawResponseData = error?.response?.data
    applicationQuestionsError.value =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.msg ||
      (typeof rawResponseData === 'string' || typeof rawResponseData === 'number'
        ? `API error: ${rawResponseData}`
        : '') ||
      (error?.response?.status ? `Request failed with HTTP ${error.response.status}.` : '') ||
      'Failed to create the application question.'
  } finally {
    createQuestionLoadingBySection.value = {
      ...createQuestionLoadingBySection.value,
      [section.title]: false,
    }
  }
}

watch(
  () => props.stage,
  (value) => {
    if (value === 1) {
      loadApplicationQuestions()
    }
  },
  { immediate: true },
)

syncSectionsToForm()
</script>

<template>
  <div class="application-form">
    <div class="application-form__top">
      <div>
        <h3 class="application-form__title">Step 2: Application Form</h3>
        <p class="application-form__hint"><span>Recruiter:</span> Select your preferred tags from menu</p>
      </div>

      <div class="application-form__legend">
        <span><i class="is-off"></i>off</span>
        <span><i class="is-optional"></i>Optional</span>
        <span><i class="is-mandatory"></i>Mandatory</span>
      </div>
    </div>

    <div v-if="stage === 0" class="app-form-fields">
      <div class="app-form-fields__grid">
        <div class="app-field" :class="fieldClass('firstName')">
          <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('firstName')"><span class="dot"></span> First Name</button>
          <input class="app-field__control" :class="{ 'app-field__control--error': errors.firstName }" type="text" placeholder="Ex John" readonly />
          <p v-if="errors.firstName" class="app-field__error">{{ errors.firstName }}</p>
        </div>

        <div class="app-field" :class="fieldClass('lastName')">
          <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('lastName')"><span class="dot"></span> Last Name</button>
          <input class="app-field__control" :class="{ 'app-field__control--error': errors.lastName }" type="text" placeholder="Ex Smith" readonly />
          <p v-if="errors.lastName" class="app-field__error">{{ errors.lastName }}</p>
        </div>
      </div>

      <div class="app-field" :class="fieldClass('email')">
        <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('email')"><span class="dot"></span> Email Address</button>
        <input class="app-field__control" :class="{ 'app-field__control--error': errors.email }" type="email" placeholder="Ex johnsmith@nitrosync.com" readonly />
        <p v-if="errors.email" class="app-field__error">{{ errors.email }}</p>
      </div>

      <div class="app-form-fields__grid">
        <div class="app-field" :class="fieldClass('gender')">
          <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('gender')"><span class="dot"></span> gender</button>
          <div class="app-field__dropdown app-field__dropdown--static" :class="{ 'app-field__dropdown--error': errors.gender }">
            <Dropdown model-value="" :options="genderOptions" placeholder="select one of the list.." />
          </div>
          <p v-if="errors.gender" class="app-field__error">{{ errors.gender }}</p>
        </div>

        <div class="app-field" :class="fieldClass('country')">
          <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('country')"><span class="dot"></span> country</button>
          <div class="app-field__dropdown app-field__dropdown--static" :class="{ 'app-field__dropdown--error': errors.country }">
            <Dropdown model-value="" :options="countryOptions" placeholder="select one of the list.." />
          </div>
          <p v-if="errors.country" class="app-field__error">{{ errors.country }}</p>
        </div>
      </div>

      <div class="app-field" :class="fieldClass('address')">
        <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('address')"><span class="dot"></span> Full Address</button>
        <input class="app-field__control" :class="{ 'app-field__control--error': errors.address }" type="text" placeholder="Ex Accountant In he Bank" readonly />
        <p v-if="errors.address" class="app-field__error">{{ errors.address }}</p>
      </div>

      <div class="app-form-fields__grid">
        <div class="app-field" :class="fieldClass('jobTitle')">
          <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('jobTitle')"><span class="dot"></span> Current Job Title</button>
          <input class="app-field__control" :class="{ 'app-field__control--error': errors.jobTitle }" type="text" placeholder="Ex 0F2144" readonly />
          <p v-if="errors.jobTitle" class="app-field__error">{{ errors.jobTitle }}</p>
        </div>

        <div class="app-field" :class="fieldClass('company')">
          <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('company')"><span class="dot"></span> Company</button>
          <input class="app-field__control" :class="{ 'app-field__control--error': errors.company }" type="text" placeholder="Ex 0F2144" readonly />
          <p v-if="errors.company" class="app-field__error">{{ errors.company }}</p>
        </div>
      </div>

      <div class="app-form-fields__grid">
        <div class="app-field" :class="fieldClass('ethnicity')">
          <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('ethnicity')"><span class="dot"></span> Ethnicity</button>
          <div class="app-field__dropdown app-field__dropdown--static" :class="{ 'app-field__dropdown--error': errors.ethnicity }">
            <Dropdown model-value="" :options="ethnicityOptions" placeholder="Please select" />
          </div>
          <p v-if="errors.ethnicity" class="app-field__error">{{ errors.ethnicity }}</p>
        </div>

        <div class="app-field" :class="fieldClass('disability')">
          <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('disability')"><span class="dot"></span> Disability</button>
          <div class="app-field__dropdown app-field__dropdown--static" :class="{ 'app-field__dropdown--error': errors.disability }">
            <Dropdown model-value="" :options="disabilityOptions" placeholder="Please select" />
          </div>
          <p v-if="errors.disability" class="app-field__error">{{ errors.disability }}</p>
        </div>
      </div>

      <div class="app-upload">
        <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('cvStatus')"><span class="dot" :class="`dot--${form.cvStatus}`"></span> upload your CV</button>
        <div class="app-upload__row">
          <button type="button" class="app-upload__button" @click="openCvPicker">
            {{ cvFileName || 'Browse files' }}
          </button>
          <span class="app-upload__note">Maximum file size: 5MB</span>
        </div>
        <input ref="cvInputRef" class="app-upload__input" type="file" @change="updateFile('cvFile', $event)" />
      </div>

      <div class="app-upload">
        <button type="button" class="app-field__label app-field__label--toggle" @click="cycleFieldStatus('coverLetterStatus')"><span class="dot" :class="`dot--${form.coverLetterStatus}`"></span> upload your Cover Letter</button>
        <div class="app-upload__row">
          <button type="button" class="app-upload__button" @click="openCoverLetterPicker">
            {{ coverLetterFileName || 'Browse files' }}
          </button>
          <span class="app-upload__note">Maximum file size: 5MB</span>
        </div>
        <input ref="coverLetterInputRef" class="app-upload__input" type="file" @change="updateFile('coverLetterFile', $event)" />
      </div>
    </div>

    <div v-else class="application-form__sections">
      <p v-if="applicationQuestionsLoading" class="application-form__api-note">Loading application questions...</p>
      <p v-if="applicationQuestionsError" class="application-form__api-note application-form__api-note--error">{{ applicationQuestionsError }}</p>

      <section
        v-for="section in sections"
        :key="section.title"
        class="accordion-card"
        :class="{
          'accordion-card--expanded': section.expanded,
          'accordion-card--header-only': section.headerOnly,
        }"
      >
        <button type="button" class="accordion-card__header" @click="toggleSection(section)">
          <span class="accordion-card__header-left">
            <span class="accordion-card__icon" :style="{ '--section-color': section.color }">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path :d="iconPath(section.icon)" />
              </svg>
            </span>
            <span class="accordion-card__title">{{ section.title }}</span>
          </span>
          <span
            class="accordion-card__arrow"
            :class="{ 'accordion-card__arrow--open': section.expanded && !section.headerOnly }"
          ></span>
        </button>

        <div v-if="section.expanded && !section.headerOnly" class="accordion-card__body">
          <div
            v-for="(question, index) in section.questions"
            :key="`${section.title}-${index}-${question.text}`"
            class="accordion-question"
          >
            <button
              type="button"
              class="accordion-question__state"
              :class="`accordion-question__state--${question.status}`"
              @click.stop="cycleStatus(question)"
            ></button>
            <span class="accordion-question__text">{{ question.text }}</span>
          </div>

          <button type="button" class="accordion-card__add" @click="openAddQuestion(section)">
            <span>+</span>
            Add a custom question
          </button>

          <div v-if="section.addMode" class="accordion-card__custom">
            <input
              v-model="section.customQuestion"
              type="text"
              class="accordion-card__input"
              placeholder="Write your custom question"
              @keyup.enter="addCustomQuestion(section)"
            />
            <button type="button" class="accordion-card__save" :disabled="createQuestionLoadingBySection[section.title]" @click="addCustomQuestion(section)">
              {{ createQuestionLoadingBySection[section.title] ? 'Saving...' : 'Add' }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.application-form__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.application-form__title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #17111b;
}

.application-form__hint {
  margin: 8px 0 0;
  font-size: var(--ui-small-font);
  color: var(--hint-soft);
}

.application-form__hint span {
  color: #ea4f8d;
}

.application-form__legend {
  display: flex;
  align-items: center;
  gap: 18px;
  color: #2d2531;
  font-size: var(--ui-small-font);
}

.application-form__legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.application-form__legend i {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
}

.application-form__api-note {
  margin: 0 0 14px;
  font-size: var(--ui-small-font);
  color: var(--hint);
}

.application-form__api-note--error {
  color: #e15b8f;
}

.is-off { background: #d9d1d6; }
.is-optional { background: #67d766; }
.is-mandatory { background: #ea4f8d; }

.app-form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-form-fields__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.app-field__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: var(--ui-small-font);
  color: #17111b;
}

.app-field__label--toggle {
  width: fit-content;
  text-align: left;
}

.app-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-field__error {
  margin: 6px 0 0;
  font-size: var(--ui-small-font);
  color: #e15b8f;
}

.app-field__control--error {
  border-color: #e15b8f !important;
  box-shadow: 0 0 0 3px rgba(225, 91, 143, 0.08);
}

.app-field__dropdown--error :deep(.dropdown__trigger) {
  border-color: #e15b8f !important;
  box-shadow: 0 0 0 3px rgba(225, 91, 143, 0.08);
}

.app-field__dropdown--static {
  pointer-events: none;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #d9d1d6;
}

.app-field--mandatory .dot,
.dot--mandatory {
  background: #ea4f8d;
}

.app-field--optional .dot {
  background: #67d766;
}

.dot--optional {
  background: #67d766;
}

.dot--off {
  background: #d9d1d6;
}

.app-field__control {
  display: block;
  width: 100%;
  background: #f8f8f8;
  border: 1px solid #ece1e6;
}

.app-field--mandatory .app-field__control {
  border-color: #f39dbf;
}

.app-field--optional .app-field__control {
  border-color: #9ae59d;
}

.app-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.app-upload__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-upload__button {
  min-width: 136px;
  height: var(--ui-control-sm-height);
  padding: 0 18px;
  border: 1px solid #f39dbf;
  border-radius: 10px;
  color: #ea4f8d;
  background: #ffffff;
  font-size: var(--ui-small-font);
}

.app-upload__note {
  font-size: var(--ui-small-font);
  color: #d3c5cb;
}

.app-upload__input {
  display: none;
}

.accordion-card {
  border-radius: 12px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #eee;
  margin-bottom: 16px;
}

.accordion-card--header-only {
  padding: 0;
  border-color: #f3d7e3;
  background: #fffdfd;
}

.accordion-card__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.accordion-card--header-only .accordion-card__header {
  min-height: 46px;
  padding: 0 18px;
}

.accordion-card--header-only .accordion-card__icon {
  background: #faf5f7;
  color: #dfd2d8;
}

.accordion-card--header-only .accordion-card__title {
  color: #94858e;
  font-weight: 500;
}

.accordion-card__header-left {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.accordion-card__icon {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--section-color) 16%, white);
  color: var(--section-color);
}

.accordion-card__icon svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.accordion-card__title {
  font-size: 16px;
  color: #17111b;
}

.accordion-card__arrow {
  width: 10px;
  height: 10px;
  border-right: 1.5px solid #d8cbd3;
  border-bottom: 1.5px solid #d8cbd3;
  transform: rotate(45deg);
  transition: transform 0.18s ease;
}

.accordion-card__arrow--open {
  transform: rotate(-135deg);
}

.accordion-card--header-only .accordion-card__arrow {
  opacity: 0.55;
  border-color: #e6d9df;
}

.accordion-card__body {
  padding-top: 18px;
}

.accordion-question {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.accordion-question__state {
  width: 14px;
  height: 14px;
  margin-top: 2px;
  border-radius: 999px;
  border: 1.5px solid #d9d1d6;
  background: #ffffff;
  flex: 0 0 auto;
}

.accordion-question__state--off {
  border-color: #d9d1d6;
  background: #ffffff;
}

.accordion-question__state--optional {
  border-color: #67d766;
  background: #67d766;
}

.accordion-question__state--mandatory {
  border-color: #ea4f8d;
  background: #ea4f8d;
}

.accordion-question__text {
  font-size: 16px;
  color: #17111b;
  line-height: 1.35;
}

.accordion-card__add {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #ea4f8d;
  font-size: 16px;
  font-weight: 500;
}

.accordion-card__add span {
  font-size: 22px;
  line-height: 1;
}

.accordion-card__custom {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.accordion-card__input {
  flex: 1;
}

.accordion-card__save {
  min-width: 96px;
  height: 48px;
  padding: 0 24px;
  border-radius: 10px;
  background: #ea4f8d;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

.accordion-card__save:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>
