<script setup>
import { computed, onMounted, ref } from 'vue'
import { sendNitroSyncAiCommand, aiTaskTimeoutMs } from '../../composables/useNitroSyncAi'
import { getNitroSyncEmployees } from '../../composables/useNitroSyncEmployees'
import Dropdown from '../ui/Dropdown.vue'

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
  aiCommand: {
    type: String,
    default: '',
  },
})

const quickUser = ref('')
const employeesLoading = ref(false)
const employeesError = ref('')
const aiLoading = ref(false)
const aiMessage = ref('')
const aiError = ref('')
const aiAnswer = ref('')

const fallbackTeamOptions = ['Design Team', 'Product Team', 'Marketing Team', 'HR Team']
const fallbackRecruiterOptions = ['Manal Oraby', 'Tareq Ahmad', 'Lina Saleh', 'Omar Khaled']
const fallbackUserOptions = ['Manal Oraby', 'Tareq Ahmad', 'Lina Saleh', 'Omar Khaled', 'Dana Samir']

const baseTeamOptions = ref([...fallbackTeamOptions])
const baseRecruiterOptions = ref([...fallbackRecruiterOptions])
const baseUserOptions = ref([...fallbackUserOptions])

const companyId = 'b00af2a4-2d77-432b-bd93-4e7ea120d154'

const normalizeLabel = (value) => String(value || '').trim()

const uniqueLabels = (values) => [...new Set(values.map(normalizeLabel).filter(Boolean))]

const getEmployeeName = (employee) => {
  const firstName = normalizeLabel(employee?.first_name ?? employee?.firstName)
  const lastName = normalizeLabel(employee?.last_name ?? employee?.lastName)
  const fullName = normalizeLabel(
    employee?.full_name ?? employee?.fullName ?? employee?.employee_name ?? employee?.employeeName ?? employee?.name,
  )

  if (fullName) return fullName
  if (firstName || lastName) return `${firstName} ${lastName}`.trim()

  return ''
}

const getEmployeeTeam = (employee) =>
  normalizeLabel(
    employee?.team_name ??
      employee?.teamName ??
      employee?.team ??
      employee?.department_name ??
      employee?.departmentName ??
      employee?.department,
  )

const mergeOptions = (primaryOptions, extraOptions = []) =>
  uniqueLabels([...primaryOptions, ...extraOptions])

const teamOptions = computed(() =>
  mergeOptions(baseTeamOptions.value, [props.form.team]),
)

const recruiterOptions = computed(() =>
  mergeOptions(baseRecruiterOptions.value, [props.form.recruiter]),
)

const userOptions = computed(() =>
  mergeOptions(baseUserOptions.value, props.form.additionalUsers),
)

const availableUsers = computed(() =>
  userOptions.value.filter((item) => !props.form.additionalUsers.includes(item)),
)

const pickBestOption = (options, answerText) => {
  const normalizedAnswer = normalizeLabel(answerText).toLowerCase()

  if (!normalizedAnswer) return ''

  return options.find((option) => normalizedAnswer.includes(normalizeLabel(option).toLowerCase())) || ''
}

const getMatchedUsers = (options, answerText) => {
  const normalizedAnswer = normalizeLabel(answerText).toLowerCase()

  if (!normalizedAnswer) return []

  return options.filter((option) => normalizedAnswer.includes(normalizeLabel(option).toLowerCase()))
}

const addAdditionalUser = (name) => {
  const value = String(name || quickUser.value || '').trim()
  if (!value || props.form.additionalUsers.includes(value)) return
  props.form.additionalUsers = [...props.form.additionalUsers, value]
  quickUser.value = ''
}

const removeAdditionalUser = (name) => {
  props.form.additionalUsers = props.form.additionalUsers.filter((item) => item !== name)
}

const fetchEmployees = async () => {
  employeesLoading.value = true
  employeesError.value = ''

  try {
    const response = await getNitroSyncEmployees(companyId)
    const rows = Array.isArray(response?.data) ? response.data : []

    const employeeNames = uniqueLabels(rows.map(getEmployeeName))
    const teamNames = uniqueLabels(rows.map(getEmployeeTeam))

    if (teamNames.length) {
      baseTeamOptions.value = teamNames
    }

    if (employeeNames.length) {
      baseRecruiterOptions.value = employeeNames
      baseUserOptions.value = employeeNames
    }
  } catch (error) {
    console.error('Failed to fetch employees', error)
    employeesError.value = 'Could not load employees from API. Using saved options.'
  } finally {
    employeesLoading.value = false
  }
}

onMounted(() => {
  fetchEmployees()
})

const suggestTeamWithAi = async () => {
  if (!String(props.aiCommand || '').trim()) {
    aiMessage.value = ''
    aiError.value = 'Fill in the job information first so AI can suggest the hiring team.'
    return
  }

  aiLoading.value = true
  aiMessage.value = ''
  aiError.value = ''
  aiAnswer.value = ''

  try {
    const result = await sendNitroSyncAiCommand(props.aiCommand)
    const answer = result.answer || ''

    aiAnswer.value = answer

    const suggestedTeam = pickBestOption(teamOptions.value, answer)
    const suggestedRecruiter = pickBestOption(recruiterOptions.value, answer)
    const suggestedUsers = getMatchedUsers(userOptions.value, answer)

    if (suggestedTeam) {
      props.form.team = suggestedTeam
    }

    if (suggestedRecruiter) {
      props.form.recruiter = suggestedRecruiter
    }

    if (suggestedUsers.length) {
      props.form.additionalUsers = uniqueLabels([
        ...props.form.additionalUsers,
        ...suggestedUsers.filter((user) => user !== props.form.recruiter),
      ])
    }

    aiMessage.value = suggestedTeam || suggestedRecruiter || suggestedUsers.length
      ? result.message || 'Hiring team suggestions applied.'
      : 'AI returned suggestions, but no exact team or employee match was found in the current options.'
  } catch (error) {
    const isTimeoutError = error?.code === 'ECONNABORTED' || String(error?.message || '').includes('timeout')
    aiError.value = isTimeoutError
      ? `The AI request took longer than ${aiTaskTimeoutMs / 1000} seconds. Please try again.`
      : error?.response?.data?.message || error?.message || 'Failed to suggest a hiring team.'
  } finally {
    aiLoading.value = false
  }
}
</script>

<template>
  <div class="hiring-team-step">
    <div class="hiring-team-step__head">
      <div>
        <h3 class="hiring-team-step__title">Step 5: Hiring Team</h3>
        <p class="hiring-team-step__text">
          Make smarter hiring decisions, our intelligent screening and Advancement system automates evaluations based
          on your criteria, ensuring efficient and fair assessments for every candidate.
        </p>
      </div>

      <button type="button" class="hiring-team-step__ghost" :disabled="aiLoading" @click="suggestTeamWithAi">
        {{ aiLoading ? 'Suggesting...' : 'Suggest team using AI' }}
      </button>
    </div>

    <div class="hiring-team-step__form">
      <div class="hiring-team-step__field">
        <label>Team</label>
        <div class="hiring-team-step__dropdown" :class="{ 'hiring-team-step__dropdown--error': errors.team }">
          <Dropdown v-model="form.team" :options="teamOptions" placeholder="Select Team" />
        </div>
        <p v-if="errors.team" class="hiring-team-step__error">{{ errors.team }}</p>
      </div>

      <div class="hiring-team-step__field">
        <label>Recruiter</label>
        <div class="hiring-team-step__dropdown" :class="{ 'hiring-team-step__dropdown--error': errors.recruiter }">
          <Dropdown v-model="form.recruiter" :options="recruiterOptions" placeholder="Select Recruiter" />
        </div>
        <p v-if="errors.recruiter" class="hiring-team-step__error">{{ errors.recruiter }}</p>
      </div>

      <div class="hiring-team-step__field">
        <label>Additional Users</label>

        <div class="hiring-team-step__selected">
          <div class="hiring-team-step__chips">
            <span v-for="user in form.additionalUsers" :key="user" class="hiring-team-step__chip">
              <span class="hiring-team-step__chip-avatar"></span>
              <span>{{ user }}</span>
              <button type="button" class="hiring-team-step__chip-close" @click="removeAdditionalUser(user)">x</button>
            </span>
          </div>

          <button
            type="button"
            class="hiring-team-step__add"
            :disabled="!availableUsers.length"
            @click="addAdditionalUser(availableUsers[0])"
          >
            Add
          </button>
        </div>

        <div class="hiring-team-step__quick-users">
          <button
            v-for="user in availableUsers"
            :key="user"
            type="button"
            class="hiring-team-step__quick-user"
            @click="addAdditionalUser(user)"
          >
            {{ user }}
          </button>
        </div>

        <p v-if="employeesLoading" class="hiring-team-step__helper">Loading employees...</p>
        <p v-else-if="employeesError" class="hiring-team-step__helper hiring-team-step__helper--warning">
          {{ employeesError }}
        </p>
        <p v-if="aiMessage" class="hiring-team-step__helper hiring-team-step__helper--success">{{ aiMessage }}</p>
        <p v-if="aiError" class="hiring-team-step__helper hiring-team-step__helper--warning">{{ aiError }}</p>
        <div v-if="aiAnswer" class="hiring-team-step__ai-answer">
          <strong>AI suggestion</strong>
          <pre>{{ aiAnswer }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hiring-team-step {
  min-height: 420px;
}

.hiring-team-step__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.hiring-team-step__title {
  margin: 0;
  font-size: var(--font-section-title);
  font-weight: 600;
  color: #17111b;
}

.hiring-team-step__text {
  margin: 8px 0 0;
  max-width: 640px;
  font-size: var(--font-small);
  line-height: 1.45;
  color: #d1c3ca;
}

.hiring-team-step__ghost {
  min-width: 142px;
  height: var(--ui-button-sm-height);
  padding: 0 12px;
  border: 1px solid #cdddff;
  border-radius: 999px;
  background: #ffffff;
  color: #4f7dff;
  font-size: var(--ui-meta-font);
  white-space: nowrap;
}

.hiring-team-step__ghost:disabled {
  opacity: 0.7;
  cursor: wait;
}

.hiring-team-step__form {
  display: grid;
  gap: 18px;
  max-width: 100%;
}

.hiring-team-step__field label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--ui-small-font);
  color: #17111b;
}

.hiring-team-step__selected {
  min-height: 48px;
  padding: 8px 12px;
  border: 1px solid #e4dbe0;
  border-radius: 10px;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.hiring-team-step__chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.hiring-team-step__chip {
  min-height: var(--ui-button-xs-height);
  padding: 0 10px;
  border-radius: 999px;
  background: #ffe5ee;
  color: #f06a9a;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--ui-meta-font);
}

.hiring-team-step__chip-avatar {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffd98e, #ff7b8f);
  flex: 0 0 auto;
}

.hiring-team-step__chip-close {
  color: #d4a8b8;
  line-height: 1;
}

.hiring-team-step__add {
  min-width: 54px;
  height: var(--ui-button-xs-height);
  border-radius: 999px;
  background: #ffd8e7;
  color: #f06a9a;
  font-size: var(--ui-meta-font);
  flex: 0 0 auto;
}

.hiring-team-step__add:disabled {
  opacity: 0.45;
}

.hiring-team-step__quick-users {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.hiring-team-step__quick-user {
  min-height: var(--ui-button-xs-height);
  padding: 0 12px;
  border-radius: 999px;
  background: #fff1f6;
  color: #ea4f8d;
  font-size: var(--ui-small-font);
}

.hiring-team-step__error {
  margin: 6px 0 0;
  font-size: var(--ui-small-font);
  color: #e15b8f;
}

.hiring-team-step__helper {
  margin: 10px 0 0;
  font-size: var(--ui-small-font);
  color: #b6a5ae;
}

.hiring-team-step__helper--warning {
  color: #d38aa6;
}

.hiring-team-step__helper--success {
  color: #1d8f46;
}

.hiring-team-step__ai-answer {
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px solid #efe4e8;
  border-radius: 12px;
  background: #fff7fa;
}

.hiring-team-step__ai-answer strong {
  display: block;
  margin-bottom: 8px;
  font-size: var(--ui-small-font);
  color: #17111b;
}

.hiring-team-step__ai-answer pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: var(--ui-small-font);
  line-height: 1.55;
  color: #5b4a52;
}

.hiring-team-step__dropdown--error :deep(.dropdown__trigger) {
  border-color: #e15b8f;
  box-shadow: 0 0 0 3px rgba(225, 91, 143, 0.08);
}
</style>
