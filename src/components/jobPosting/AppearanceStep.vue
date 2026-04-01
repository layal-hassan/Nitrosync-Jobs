<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  jobDetails: {
    type: Object,
    required: true,
  },
  additionalInfo: {
    type: Object,
    required: true,
  },
  recruiters: {
    type: Array,
    default: () => [],
  },
})

const previewTitle = computed(() => props.jobDetails.jobTitle || 'Job title will be show here...')
const previewMetaPrimary = computed(() => props.recruiters[0] || 'Company Name')
const previewMetaSecondary = computed(() => props.additionalInfo.contractType || 'Full-Time Job')
const previewDescription = computed(() =>
  props.jobDetails.description
  || 'As an Accountant in a Bank, you will be responsible for managing the financial records, ensuring compliance with regulations, and providing critical insights to support decision-making.'
)
const coverInputRef = ref(null)
const photoInputRef = ref(null)
const coverFileName = computed(() => props.form.coverPhoto?.name || '')
const photoFileName = computed(() => props.form.photo?.name || '')

const openCoverPicker = () => {
  coverInputRef.value?.click()
}

const openPhotoPicker = () => {
  photoInputRef.value?.click()
}

const updateFile = (field, event) => {
  props.form[field] = event.target.files?.[0] || null
}
</script>

<template>
  <div class="appearance-step">
    <p class="appearance-step__hint">
      Preview how your Job offer will appear to candidates and make sure its ready to stand out.
    </p>

    <button type="button" class="appearance-step__cover" @click="openCoverPicker">
      {{ coverFileName || '- Add Job cover photo' }}
    </button>
    <input ref="coverInputRef" class="appearance-step__file-input" type="file" accept="image/*" @change="updateFile('coverPhoto', $event)" />

    <div class="appearance-step__preview">
      <button type="button" class="appearance-step__avatar" @click="openPhotoPicker"></button>
      <input ref="photoInputRef" class="appearance-step__file-input" type="file" accept="image/*" @change="updateFile('photo', $event)" />
      <div class="appearance-step__title">{{ previewTitle }}</div>
      <div class="appearance-step__meta">
        <span>{{ previewMetaPrimary }}</span>
        <span>{{ previewMetaSecondary }}</span>
      </div>
      <p v-if="photoFileName" class="appearance-step__file-name">{{ photoFileName }}</p>
      <p class="appearance-step__description">
        {{ previewDescription }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.appearance-step__hint {
  margin: 0 0 14px;
  font-size: var(--font-small);
  color: #17111b;
}

.appearance-step__cover {
  width: 100%;
  height: 82px;
  border-radius: 12px;
  background: #f3f2f3;
  color: #eb9ebd;
  display: grid;
  place-items: center;
  font-size: var(--font-small);
  text-align: center;
}

.appearance-step__preview {
  position: relative;
  padding-top: 20px;
}

.appearance-step__avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: #f5dbe7;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 1px #ecbfd0;
  margin-top: -20px;
  margin-left: 18px;
  cursor: pointer;
}

.appearance-step__file-input {
  display: none;
}

.appearance-step__file-name {
  margin: 6px 0 0 18px;
  font-size: var(--font-small);
  color: #b98aa0;
}

.appearance-step__title {
  margin-top: 10px;
  font-size: var(--font-section-title);
  color: #1c161e;
}

.appearance-step__meta {
  display: flex;
  gap: 14px;
  margin-top: 6px;
  color: #ff6a9d;
  font-size: var(--font-small);
}

.appearance-step__description {
  max-width: 520px;
  margin: 8px 0 0;
  color: #d2c4cb;
  font-size: var(--font-small);
  line-height: 1.35;
}
</style>
