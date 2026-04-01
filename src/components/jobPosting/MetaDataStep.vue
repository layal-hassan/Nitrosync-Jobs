<script setup>
import { computed, ref } from 'vue'
import { sendNitroSyncAiCommand, aiTaskTimeoutMs } from '../../composables/useNitroSyncAi'

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

const photoInputRef = ref(null)
const seoPhotoName = computed(() => props.form.seoPhoto?.name || '')
const aiLoading = ref(false)
const aiMessage = ref('')
const aiError = ref('')

const openPhotoPicker = () => {
  photoInputRef.value?.click()
}

const updateSeoPhoto = (event) => {
  props.form.seoPhoto = event.target.files?.[0] || null
}

const generateSeoDescriptionWithAi = async () => {
  if (!String(props.aiCommand || '').trim()) {
    aiMessage.value = ''
    aiError.value = 'Fill in the job details first so AI can generate SEO content.'
    return
  }

  aiLoading.value = true
  aiMessage.value = ''
  aiError.value = ''

  try {
    const result = await sendNitroSyncAiCommand(props.aiCommand)
    props.form.seoDescription = result.answer || props.form.seoDescription
    aiMessage.value = result.message || 'SEO description generated successfully.'
  } catch (error) {
    const isTimeoutError = error?.code === 'ECONNABORTED' || String(error?.message || '').includes('timeout')
    aiError.value = isTimeoutError
      ? `The AI request took longer than ${aiTaskTimeoutMs / 1000} seconds. Please try again.`
      : error?.response?.data?.message || error?.message || 'Failed to generate SEO content.'
  } finally {
    aiLoading.value = false
  }
}
</script>

<template>
  <div class="metadata-step">
    <h3 class="metadata-step__title">Meta data for SEO</h3>
    <p class="metadata-step__hint">Add a photo that will show in Search Engine describing this job</p>

    <div class="metadata-step__upload">
      <span class="metadata-step__thumb"></span>
      <div class="metadata-step__upload-actions">
        <button type="button" class="metadata-step__upload-btn" @click="openPhotoPicker">
          {{ seoPhotoName || 'Upload Photo' }}
        </button>
        <span class="metadata-step__upload-note">max photo size 256KB</span>
      </div>
    </div>
    <input ref="photoInputRef" class="metadata-step__file-input" type="file" accept="image/*" @change="updateSeoPhoto" />

    <div class="metadata-step__field">
      <label class="metadata-step__label">Job Title for SEO</label>
      <input v-model="form.seoTitle" class="metadata-step__input" :class="{ 'metadata-step__input--error': errors.seoTitle }" type="text" placeholder="Ex: Accountant in a Bank" />
      <p v-if="errors.seoTitle" class="metadata-step__error">{{ errors.seoTitle }}</p>
    </div>

    <div class="metadata-step__field">
      <div class="metadata-step__label-row">
        <label class="metadata-step__label">Job Description for SEO</label>
        <button type="button" class="metadata-step__ai-btn" :disabled="aiLoading" @click="generateSeoDescriptionWithAi">
          <span class="metadata-step__ai-icon">+</span>
          {{ aiLoading ? 'GENERATING...' : 'GENERATE WITH AI' }}
        </button>
      </div>
      <textarea
        v-model="form.seoDescription"
        class="metadata-step__textarea"
        :class="{ 'metadata-step__textarea--error': errors.seoDescription }"
        rows="5"
        placeholder="As an Accountant in a Bank, you will be responsible for managing the financial records, ensuring compliance with regulations, and providing critical insights to support decision-making."
      ></textarea>
      <p v-if="aiMessage" class="metadata-step__success">{{ aiMessage }}</p>
      <p v-if="aiError" class="metadata-step__error">{{ aiError }}</p>
      <p v-if="errors.seoDescription" class="metadata-step__error">{{ errors.seoDescription }}</p>
    </div>
  </div>
</template>

<style scoped>
.metadata-step__title {
  margin: 0;
  font-size: var(--font-section-title);
  color: #ff5f9d;
}

.metadata-step__hint {
  margin: 8px 0 14px;
  font-size: var(--font-small);
  color: #1f1720;
}

.metadata-step__upload {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.metadata-step__thumb {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #f5dbe7;
  box-shadow: 0 0 0 1px #ecbfd0;
}

.metadata-step__upload-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metadata-step__upload-btn {
  width: 120px;
  height: 40px;
  border-radius: 8px;
  background: #f6f4f6;
  color: #2d2531;
  font-size: var(--font-small);
}

.metadata-step__upload-note {
  font-size: var(--font-small);
  color: #d2c4cb;
}

.metadata-step__file-input {
  display: none;
}

.metadata-step__field {
  margin-top: 10px;
}

.metadata-step__label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.metadata-step__label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--font-label);
  color: #1f1720;
}

.metadata-step__input,
.metadata-step__textarea {
  width: 100%;
  border: 1px solid #e9dfe4;
  border-radius: var(--control-radius);
  background: #f8f8f8;
  color: #5f565c;
  min-height: var(--control-height);
  padding: 12px var(--control-padding-x);
  font: inherit;
  font-size: var(--font-body);
}

.metadata-step__input::placeholder,
.metadata-step__textarea::placeholder {
  color: #cfc3c9;
}

.metadata-step__textarea {
  min-height: var(--textarea-min-height);
  resize: none;
  line-height: 1.35;
}

.metadata-step__ai-btn {
  height: 34px;
  padding: 0 14px;
  border: 1px solid #9ab0ff;
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

.metadata-step__ai-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.metadata-step__ai-icon {
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

.metadata-step__error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #e15b8f;
}

.metadata-step__success {
  margin: 6px 0 0;
  font-size: 12px;
  color: #1d8f46;
}

.metadata-step__input--error,
.metadata-step__textarea--error {
  border-color: #e15b8f;
  box-shadow: 0 0 0 3px rgba(225, 91, 143, 0.08);
}
</style>
