<script setup>
import { computed, ref, watch } from 'vue'
import { sendNitroSyncEmail } from '../../composables/useNitroSyncEmail'
import {
  fetchNitroSyncJobStageCandidates,
  fetchNitroSyncJobStages,
} from '../../composables/useNitroSyncJobStages'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  job: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

const specificCandidate = ref(false)
const copied = ref(false)
const candidateQuery = ref('')
const selectedCandidate = ref(null)
const availableCandidates = ref([])
const loadingCandidates = ref(false)
const sendingShare = ref(false)
const loadError = ref('')
const shareError = ref('')
const shareSuccess = ref('')

const jobUrl = computed(() => {
  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://example.com'

  return props.job?.id ? `${base}/jobs/${props.job.id}` : `${base}/jobs`
})

const normalizedQuery = computed(() => String(candidateQuery.value || '').trim().toLowerCase())

const filteredCandidates = computed(() => {
  if (!normalizedQuery.value) return availableCandidates.value

  return availableCandidates.value.filter((candidate) =>
    [candidate.name, candidate.role, candidate.email]
      .some((value) => String(value || '').toLowerCase().includes(normalizedQuery.value)),
  )
})

const selectedCandidateInitials = computed(() =>
  String(selectedCandidate.value?.name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'C',
)

const resetState = () => {
  copied.value = false
  specificCandidate.value = false
  candidateQuery.value = ''
  selectedCandidate.value = null
  availableCandidates.value = []
  loadingCandidates.value = false
  sendingShare.value = false
  loadError.value = ''
  shareError.value = ''
  shareSuccess.value = ''
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      resetState()
    }
  },
)

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(jobUrl.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}

const clearCandidate = () => {
  selectedCandidate.value = null
  candidateQuery.value = ''
  shareError.value = ''
  shareSuccess.value = ''
}

const dedupeCandidates = (rows) => {
  const seen = new Set()

  return rows.filter((candidate) => {
    const key =
      String(candidate.candidate_uuid || '').trim()
      || String(candidate.email || '').trim().toLowerCase()
      || String(candidate.name || '').trim().toLowerCase()

    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const getStageJobUuid = (row) =>
  String(
    row?.raw?.job_uuid
    ?? row?.raw?.job?.job_uuid
    ?? row?.raw?.job?.uuid
    ?? row?.raw?.related_job_uuid
    ?? '',
  ).trim()

const loadCandidates = async () => {
  if (!props.job?.relatedCompany) {
    loadError.value = 'This job is missing related company, so candidates cannot be loaded.'
    return
  }

  loadingCandidates.value = true
  loadError.value = ''

  try {
    const stages = await fetchNitroSyncJobStages(props.job.relatedCompany)
    const matchingStages = stages.filter((stage) => {
      if (!props.job?.jobUuid) return Boolean(stage.jobStageUuid)
      const stageJobUuid = getStageJobUuid(stage)
      return !stageJobUuid || stageJobUuid === String(props.job.jobUuid).trim()
    })

    const stageCandidates = await Promise.all(
      matchingStages
        .filter((stage) => stage.jobStageUuid)
        .map((stage) => fetchNitroSyncJobStageCandidates(stage.jobStageUuid)),
    )

    availableCandidates.value = dedupeCandidates(stageCandidates.flat())

    if (!availableCandidates.value.length) {
      loadError.value = 'No candidates were found for this job yet.'
    }
  } catch (error) {
    console.error('Failed to load candidates for share modal', error)
    loadError.value =
      error?.response?.data?.message
      || error?.response?.data?.detail
      || error?.response?.data?.msg
      || error?.message
      || 'Failed to load candidates.'
  } finally {
    loadingCandidates.value = false
  }
}

watch(specificCandidate, async (enabled) => {
  shareError.value = ''
  shareSuccess.value = ''

  if (!enabled) return
  if (availableCandidates.value.length || loadingCandidates.value) return

  await loadCandidates()
})

const selectCandidate = (candidate) => {
  selectedCandidate.value = candidate
  candidateQuery.value = candidate.name || ''
  shareError.value = ''
  shareSuccess.value = ''
}

const shareJobWithCandidate = async () => {
  if (!selectedCandidate.value) {
    shareError.value = 'Select a candidate first.'
    return
  }

  if (!String(selectedCandidate.value.email || '').trim()) {
    shareError.value = 'The selected candidate does not have an email address.'
    return
  }

  sendingShare.value = true
  shareError.value = ''
  shareSuccess.value = ''

  try {
    await sendNitroSyncEmail({
      subject: `Job opportunity: ${props.job?.title || 'Open role'}`,
      body: `
        <p>Hello ${selectedCandidate.value.name || 'Candidate'},</p>
        <p>We would like to share this job opportunity with you:</p>
        <p><strong>${props.job?.title || 'Open role'}</strong></p>
        <p><a href="${jobUrl.value}">${jobUrl.value}</a></p>
      `.trim(),
      to: [selectedCandidate.value.email],
    })

    shareSuccess.value = 'Job shared successfully.'
  } catch (error) {
    console.error('Failed to share job with candidate', error)
    shareError.value =
      error?.response?.data?.message
      || error?.response?.data?.detail
      || error?.response?.data?.msg
      || error?.message
      || 'Failed to share the job.'
  } finally {
    sendingShare.value = false
  }
}
</script>

<template>
  <div v-if="open" class="share-modal">
    <button class="share-modal__overlay" aria-label="Close share modal" @click="$emit('close')"></button>

    <section class="share-modal__panel" role="dialog" aria-modal="true" aria-label="Share a job">
      <header class="share-modal__header">
        <h2 class="share-modal__title">Share a job</h2>
        <button class="share-modal__close" type="button" aria-label="Close share modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="share-modal__body">
        <div class="share-modal__field">
          <label class="share-modal__label">Your Job URL</label>
          <div class="share-modal__input-wrap">
            <input :value="jobUrl" class="share-modal__input" type="text" readonly />
            <button class="share-modal__copy" type="button" aria-label="Copy job URL" @click="copyUrl">
              <span class="share-modal__copy-icon"></span>
            </button>
          </div>
          <span v-if="copied" class="share-modal__copied">Link copied</span>
        </div>

        <div class="share-modal__toggle-row">
          <span class="share-modal__toggle-label">Specific Candidate</span>
          <button
            type="button"
            class="share-modal__toggle"
            :class="{ 'share-modal__toggle--active': specificCandidate }"
            :aria-pressed="specificCandidate"
            @click="specificCandidate = !specificCandidate"
          >
            <span class="share-modal__toggle-thumb"></span>
          </button>
        </div>

        <transition name="share-modal-fade">
          <div v-if="specificCandidate" class="share-modal__candidate-section">
            <label class="share-modal__label">Candidate Name</label>

            <div class="share-modal__candidate-input-wrap">
              <input
                v-model="candidateQuery"
                class="share-modal__candidate-input"
                type="text"
                placeholder="Search candidate"
              />
              <button
                v-if="selectedCandidate"
                type="button"
                class="share-modal__clear"
                @click="clearCandidate"
              >
                clear
              </button>
            </div>

            <p v-if="loadingCandidates" class="share-modal__info">Loading candidates...</p>
            <p v-else-if="loadError" class="share-modal__info share-modal__info--error">{{ loadError }}</p>

            <div v-else-if="filteredCandidates.length" class="share-modal__candidate-list">
              <button
                v-for="candidate in filteredCandidates"
                :key="candidate.candidate_uuid || candidate.email || candidate.name"
                type="button"
                class="share-modal__candidate-option"
                :class="{ 'is-active': selectedCandidate?.candidate_uuid === candidate.candidate_uuid }"
                @click="selectCandidate(candidate)"
              >
                <span class="share-modal__candidate-option-avatar">
                  {{ String(candidate.name || 'C').slice(0, 1).toUpperCase() }}
                </span>
                <span class="share-modal__candidate-option-meta">
                  <span class="share-modal__candidate-name">{{ candidate.name }}</span>
                  <span class="share-modal__candidate-role">{{ candidate.role }}</span>
                  <span class="share-modal__candidate-email">{{ candidate.email || 'No email' }}</span>
                </span>
              </button>
            </div>

            <p v-else class="share-modal__info">No candidates match your search.</p>

            <div v-if="selectedCandidate" class="share-modal__candidate-card">
              <div class="share-modal__candidate-avatar">{{ selectedCandidateInitials }}</div>
              <div class="share-modal__candidate-meta">
                <div class="share-modal__candidate-name">{{ selectedCandidate.name }}</div>
                <div class="share-modal__candidate-role">{{ selectedCandidate.role }}</div>
                <div class="share-modal__candidate-email">{{ selectedCandidate.email || 'No email address' }}</div>
              </div>
            </div>

            <p v-if="shareError" class="share-modal__info share-modal__info--error">{{ shareError }}</p>
            <p v-if="shareSuccess" class="share-modal__info share-modal__info--success">{{ shareSuccess }}</p>
          </div>
        </transition>
      </div>

      <footer class="share-modal__footer">
        <button
          v-if="specificCandidate"
          type="button"
          class="share-modal__confirm"
          :disabled="sendingShare || loadingCandidates"
          @click="shareJobWithCandidate"
        >
          {{ sendingShare ? 'Sharing...' : 'Share Job' }}
        </button>
        <button v-else type="button" class="share-modal__confirm" @click="$emit('close')">GOT IT</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.share-modal {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 20px;
}

.share-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(33, 24, 29, 0.38);
}

.share-modal__panel {
  position: relative;
  width: min(460px, calc(100vw - 32px));
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 50px rgba(32, 19, 26, 0.22);
  overflow: hidden;
}

.share-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 14px;
  border-bottom: 1px solid #f0e9ed;
}

.share-modal__title {
  margin: 0;
  color: #f04f92;
  font-size: 16px;
  font-weight: 600;
}

.share-modal__close {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #f04f92;
  position: relative;
  flex: 0 0 auto;
}

.share-modal__close span {
  position: absolute;
  top: 8px;
  left: 4px;
  width: 10px;
  height: 1.5px;
  background: #ffffff;
}

.share-modal__close span:first-child {
  transform: rotate(45deg);
}

.share-modal__close span:last-child {
  transform: rotate(-45deg);
}

.share-modal__body {
  padding: 16px 16px 8px;
}

.share-modal__field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-modal__label {
  color: #211b20;
  font-size: 14px;
  line-height: 1.2;
}

.share-modal__input-wrap {
  position: relative;
}

.share-modal__input {
  width: 100%;
  height: 40px;
  padding: 0 46px 0 12px;
  border: 1px solid #ebe5e8;
  border-radius: 9px;
  background: #faf9fb;
  color: #2358ea;
  font-size: 13px;
  outline: none;
}

.share-modal__copy {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  color: #8c7f87;
}

.share-modal__copy-icon {
  width: 14px;
  height: 14px;
  position: relative;
  display: block;
}

.share-modal__copy-icon::before,
.share-modal__copy-icon::after {
  content: '';
  position: absolute;
  border: 1.5px solid currentColor;
  border-radius: 3px;
  background: #ffffff;
}

.share-modal__copy-icon::before {
  inset: 3px 0 0 4px;
}

.share-modal__copy-icon::after {
  inset: 0 4px 3px 0;
}

.share-modal__copied,
.share-modal__info {
  color: #54a36a;
  font-size: 12px;
  line-height: 1.45;
}

.share-modal__info {
  margin: 10px 0 0;
}

.share-modal__info--error {
  color: #d25585;
}

.share-modal__info--success {
  color: #37905d;
}

.share-modal__toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
}

.share-modal__toggle-label {
  color: #211b20;
  font-size: 14px;
}

.share-modal__toggle {
  width: 32px;
  height: 20px;
  border-radius: 999px;
  background: #dddddf;
  padding: 2px;
  transition: background-color 0.18s ease;
}

.share-modal__toggle--active {
  background: #f3a5c4;
}

.share-modal__toggle-thumb {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
  transition: transform 0.18s ease;
}

.share-modal__toggle--active .share-modal__toggle-thumb {
  transform: translateX(12px);
}

.share-modal__candidate-section {
  margin-top: 14px;
}

.share-modal__candidate-input-wrap {
  position: relative;
  margin-top: 8px;
}

.share-modal__candidate-input {
  width: 100%;
  height: 40px;
  padding: 0 52px 0 12px;
  border: 1px solid #ebe5e8;
  border-radius: 9px;
  background: #faf9fb;
  color: #6a6167;
  font-size: 13px;
  outline: none;
}

.share-modal__candidate-input::placeholder {
  color: #b9adb4;
}

.share-modal__clear {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  color: #f04f92;
  font-size: 12px;
  text-transform: lowercase;
}

.share-modal__candidate-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  margin-top: 10px;
  overflow-y: auto;
}

.share-modal__candidate-option,
.share-modal__candidate-card {
  display: grid;
  grid-template-columns: 32px 1fr;
  align-items: center;
  gap: 10px;
  padding: 12px 10px;
  border: 1px solid #eee7ea;
  border-radius: 10px;
  background: #faf9fb;
}

.share-modal__candidate-option {
  text-align: left;
}

.share-modal__candidate-option.is-active {
  border-color: #f3a5c4;
  background: #fff4f8;
}

.share-modal__candidate-avatar,
.share-modal__candidate-option-avatar {
  width: 32px;
  height: 32px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: #f1d9e3;
  color: #f04f92;
  font-size: 12px;
  font-weight: 700;
}

.share-modal__candidate-meta,
.share-modal__candidate-option-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.share-modal__candidate-name {
  color: #201a1f;
  font-size: 13px;
  line-height: 1.2;
}

.share-modal__candidate-role {
  color: #8d858a;
  font-size: 12px;
  line-height: 1.2;
}

.share-modal__candidate-email {
  color: #f04f92;
  font-size: 12px;
  line-height: 1.2;
  word-break: break-word;
}

.share-modal__candidate-card {
  margin-top: 12px;
}

.share-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px 18px;
}

.share-modal__confirm {
  min-width: 96px;
  height: 32px;
  padding: 0 16px;
  border-radius: 9px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  font-size: 12px;
  box-shadow: 0 10px 16px rgba(234, 79, 141, 0.18);
}

.share-modal__confirm:disabled {
  cursor: wait;
  opacity: 0.7;
}

.share-modal-fade-enter-active,
.share-modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.share-modal-fade-enter-from,
.share-modal-fade-leave-to {
  opacity: 0;
}
</style>
