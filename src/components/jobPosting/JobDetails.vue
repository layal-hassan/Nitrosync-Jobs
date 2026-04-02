<script setup>
import { computed, ref, watch } from 'vue'
import { sendNitroSyncAiCommand, aiTaskTimeoutMs } from '../../composables/useNitroSyncAi'
import { countryCityOptions, countryOptions, departmentOptions } from '../../data/jobPostingOptions'
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

const aiLoading = ref(false)
const aiMessage = ref('')
const aiError = ref('')
const cityOptions = computed(() => countryCityOptions[props.form.country] || [])

watch(
  () => props.form.country,
  (country) => {
    const nextCityOptions = countryCityOptions[country] || []

    if (props.form.city && !nextCityOptions.includes(props.form.city)) {
      props.form.city = ''
    }
  },
  { immediate: true },
)

const generateDescriptionWithAi = async () => {
  if (!String(props.aiCommand || '').trim()) {
    aiMessage.value = ''
    aiError.value = 'Fill in the job basics first so AI can generate a description.'
    return
  }

  aiLoading.value = true
  aiMessage.value = ''
  aiError.value = ''

  try {
    const result = await sendNitroSyncAiCommand(props.aiCommand)
    props.form.description = result.answer || props.form.description
    aiMessage.value = result.message || 'Job description generated successfully.'
  } catch (error) {
    const isTimeoutError = error?.code === 'ECONNABORTED' || String(error?.message || '').includes('timeout')
    aiError.value = isTimeoutError
      ? `The AI request took longer than ${aiTaskTimeoutMs / 1000} seconds. Please try again.`
      : error?.response?.data?.message || error?.message || 'Failed to generate the job description.'
  } finally {
    aiLoading.value = false
  }
}
</script>

<template>
  <div class="step-form">
    <div class="step-form__field">
      <label class="step-form__label">Job Title</label>
      <input v-model="form.jobTitle" class="step-form__input" :class="{ 'step-form__input--error': errors.jobTitle }" type="text" placeholder="Ex Accountant in a Bank" />
      <p v-if="errors.jobTitle" class="step-form__error">{{ errors.jobTitle }}</p>
    </div>

    <div class="step-form__grid step-form__grid--two">
      <div class="step-form__field">
        <label class="step-form__label">Job Code</label>
        <input v-model="form.jobCode" class="step-form__input" :class="{ 'step-form__input--error': errors.jobCode }" type="text" placeholder="Ex 0F2144" />
        <p v-if="errors.jobCode" class="step-form__error">{{ errors.jobCode }}</p>
      </div>

      <div class="step-form__field">
        <label class="step-form__label">Department</label>
        <div class="step-form__dropdown" :class="{ 'step-form__dropdown--error': errors.department }">
          <Dropdown v-model="form.department" :options="departmentOptions" placeholder="select one of the list..." />
        </div>
        <p v-if="errors.department" class="step-form__error">{{ errors.department }}</p>
      </div>
    </div>

    <div class="step-form__grid step-form__grid--two">
      <div class="step-form__field">
        <label class="step-form__label">Country</label>
        <div class="step-form__dropdown" :class="{ 'step-form__dropdown--error': errors.country }">
          <Dropdown v-model="form.country" :options="countryOptions" placeholder="Select one of the list..." />
        </div>
        <p v-if="errors.country" class="step-form__error">{{ errors.country }}</p>
      </div>

      <div class="step-form__field">
        <label class="step-form__label">City</label>
        <div class="step-form__dropdown" :class="{ 'step-form__dropdown--error': errors.city }">
          <Dropdown
            v-model="form.city"
            :options="cityOptions"
            :placeholder="form.country ? 'Select one of the list...' : 'Select country first...'"
          />
        </div>
        <p v-if="errors.city" class="step-form__error">{{ errors.city }}</p>
      </div>
    </div>

    <div class="step-form__field">
      <div class="step-form__label-row">
        <label class="step-form__label">Job Description</label>
        <button type="button" class="step-form__ai-button" :disabled="aiLoading" @click="generateDescriptionWithAi">
          <span class="step-form__ai-icon">+</span>
          {{ aiLoading ? 'GENERATING...' : 'GENERATE WITH AI' }}
        </button>
      </div>
      <textarea
        v-model="form.description"
        class="step-form__textarea"
        :class="{ 'step-form__textarea--error': errors.description }"
        rows="5"
        placeholder="As an Accountant in a Bank, you will be responsible for managing the financial records, ensuring compliance with regulations, and providing critical insights to support decision-making."
      ></textarea>
      <p v-if="aiMessage" class="step-form__success">{{ aiMessage }}</p>
      <p v-if="aiError" class="step-form__error">{{ aiError }}</p>
      <p v-if="errors.description" class="step-form__error">{{ errors.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.step-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-fields);
}

.step-form__grid {
  display: grid;
  gap: var(--space-fields);
}

.step-form__grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.step-form__field {
  min-width: 0;
}

.step-form__label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--font-label);
  color: #1f1720;
}

.step-form__label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.step-form__input,
.step-form__textarea {
  width: 100%;
  border: 1px solid #e6dfe3;
  border-radius: var(--control-radius);
  background: #f8f8f8;
  color: #5f565c;
  min-height: var(--control-height);
  padding: 12px var(--control-padding-x);
  font: inherit;
  font-size: var(--font-body);
}

.step-form__input::placeholder,
.step-form__textarea::placeholder {
  color: #cfc3c9;
}

.step-form__textarea {
  min-height: var(--textarea-min-height);
  resize: none;
  line-height: 1.35;
}

.step-form__ai-button {
  height: 34px;
  padding: 0 14px;
  border: 1px solid #8fa8ff;
  border-radius: 999px;
  color: #4f7dff;
  font-size: 12px;
  font-weight: 600;
  background: linear-gradient(180deg, #ffffff, #f5f8ff);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(79, 125, 255, 0.08);
}

.step-form__ai-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.step-form__ai-icon {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #eef3ff;
  color: #4f7dff;
  font-size: 12px;
  line-height: 1;
}

.step-form__error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #e15b8f;
}

.step-form__success {
  margin: 6px 0 0;
  font-size: 12px;
  color: #1d8f46;
}

.step-form__input--error,
.step-form__textarea--error {
  border-color: #e15b8f;
  box-shadow: 0 0 0 3px rgba(225, 91, 143, 0.08);
}

.step-form__dropdown--error :deep(.dropdown__trigger) {
  border-color: #e15b8f;
  box-shadow: 0 0 0 3px rgba(225, 91, 143, 0.08);
}
</style>
