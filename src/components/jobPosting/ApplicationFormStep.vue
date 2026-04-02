<script setup>
import { reactive, ref, watch } from 'vue'
import {
  createNitroSyncApplicationQuestion,
  fetchNitroSyncApplicationQuestions,
} from '../../composables/useNitroSyncApplicationForms'

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
const fieldStatusOptions = [
  { value: 'off', label: 'Off' },
  { value: 'mandatory', label: 'Mandatory' },
  { value: 'optional', label: 'Optional' },
]
const fieldGroups = [
  [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
  ],
  [
    { key: 'email', label: 'Email Address' },
  ],
  [
    { key: 'gender', label: 'Gender' },
    { key: 'country', label: 'Country' },
  ],
  [
    { key: 'address', label: 'Full Address' },
  ],
  [
    { key: 'jobTitle', label: 'Current Job Title' },
    { key: 'company', label: 'Company' },
  ],
  [
    { key: 'ethnicity', label: 'Ethnicity' },
    { key: 'disability', label: 'Disability' },
  ],
  [
    { key: 'cvStatus', label: 'Upload Your CV' },
    { key: 'coverLetterStatus', label: 'Upload Your Cover Letter' },
  ],
]

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

const setFieldStatus = (fieldKey, status) => {
  props.form[fieldKey] = status
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
      <div
        v-for="(group, groupIndex) in fieldGroups"
        :key="`group-${groupIndex}`"
        class="app-form-fields__grid"
        :class="{ 'app-form-fields__grid--single': group.length === 1 }"
      >
        <div
          v-for="field in group"
          :key="field.key"
          class="app-field"
          :class="fieldClass(field.key)"
        >
          <div class="app-field__header">
            <div class="app-field__title">
              <span class="dot"></span>
              <span>{{ field.label }}</span>
            </div>
            <div class="app-field__status-group" role="radiogroup" :aria-label="`${field.label} status`">
              <label v-for="option in fieldStatusOptions" :key="`${field.key}-${option.value}`" class="app-field__status-option">
                <input
                  :checked="form[field.key] === option.value"
                  type="radio"
                  :name="`field-status-${field.key}`"
                  :value="option.value"
                  @change="setFieldStatus(field.key, option.value)"
                />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </div>
          <p v-if="errors[field.key]" class="app-field__error">{{ errors[field.key] }}</p>
        </div>
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
  gap: 18px;
}

.app-form-fields__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.app-form-fields__grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.app-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 20px 22px;
  border: 1px solid #eee1e7;
  border-radius: 20px;
  background: linear-gradient(180deg, #fffefe 0%, #fff9fb 100%);
}

.app-field__title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 176px;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.25;
  color: #17111b;
}

.app-field__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
}

.app-field__status-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  max-width: 360px;
}

.app-field__status-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 42px;
  padding: 9px 14px;
  border: 1px solid #e8dce2;
  border-radius: 999px;
  background: #fff;
  font-size: 13px;
  color: #5f5360;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.app-field__status-option input {
  margin: 0;
  accent-color: #ea4f8d;
}

.app-field__error {
  margin: 10px 0 0;
  font-size: var(--ui-small-font);
  color: #e15b8f;
}

.dot {
  width: 12px;
  height: 12px;
  display: inline-block;
  flex: 0 0 12px;
  border: 3px solid rgba(217, 209, 214, 0.28);
  border-radius: 50%;
  box-sizing: border-box;
  background: #d9d1d6;
}

.app-field--mandatory {
  border-color: #f4bfd3;
  background: linear-gradient(180deg, #fffefe 0%, #fff5f9 100%);
}

.app-field--mandatory .dot {
  background: #ea4f8d;
  border-color: rgba(234, 79, 141, 0.16);
}

.app-field--optional {
  border-color: #bdecc0;
  background: linear-gradient(180deg, #ffffff 0%, #f7fff8 100%);
}

.app-field--optional .dot {
  background: #67d766;
  border-color: rgba(103, 215, 102, 0.16);
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

@media (max-width: 900px) {
  .app-form-fields__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .app-field__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .app-field__title,
  .app-field__status-group {
    min-width: 0;
    max-width: none;
  }

  .app-field__status-group {
    justify-content: flex-start;
  }
}
</style>
