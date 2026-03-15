<script setup>
import { computed, ref, watch } from 'vue'

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

const copied = ref(false)

const jobUrl = computed(() => {
  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://example.com'

  return props.job?.id ? `${base}/jobs/${props.job.id}` : `${base}/jobs`
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) copied.value = false
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

const openShare = async (platform) => {
  const encodedUrl = encodeURIComponent(jobUrl.value)

  if (platform === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'noopener,noreferrer')
    return
  }

  if (platform === 'linkedin') {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank', 'noopener,noreferrer')
    return
  }

  if (platform === 'x') {
    window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}`, '_blank', 'noopener,noreferrer')
    return
  }

  if (platform === 'instagram') {
    await copyUrl()
  }
}
</script>

<template>
  <div v-if="open" class="social-modal">
    <button class="social-modal__overlay" aria-label="Close social share modal" @click="$emit('close')"></button>

    <section class="social-modal__panel" role="dialog" aria-modal="true" aria-label="Social Share">
      <header class="social-modal__header">
        <h2 class="social-modal__title">Social Share</h2>
        <button class="social-modal__close" type="button" aria-label="Close social share modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="social-modal__body">
        <div class="social-modal__field">
          <label class="social-modal__label">Your Job URL</label>
          <div class="social-modal__input-wrap">
            <input :value="jobUrl" class="social-modal__input" type="text" readonly />
            <button class="social-modal__copy" type="button" aria-label="Copy job URL" @click="copyUrl">
              <span class="social-modal__copy-icon"></span>
            </button>
          </div>
          <span v-if="copied" class="social-modal__copied">Link copied</span>
        </div>

        <div class="social-modal__share">
          <div class="social-modal__label">Quick share this job on</div>
          <div class="social-modal__buttons">
            <button type="button" class="share-btn share-btn--facebook" @click="openShare('facebook')">
              <span class="share-btn__icon">f</span>
              <span>Facebook</span>
            </button>
            <button type="button" class="share-btn share-btn--instagram" @click="openShare('instagram')">
              <span class="share-btn__icon">◎</span>
              <span>Instagram</span>
            </button>
            <button type="button" class="share-btn share-btn--linkedin" @click="openShare('linkedin')">
              <span class="share-btn__icon">in</span>
              <span>LinkedIn</span>
            </button>
            <button type="button" class="share-btn share-btn--x" @click="openShare('x')">
              <span class="share-btn__icon">X</span>
              <span>x</span>
            </button>
          </div>
        </div>
      </div>

      <footer class="social-modal__footer">
        <button type="button" class="social-modal__done" @click="$emit('close')">Done</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.social-modal {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 20px;
}

.social-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(33, 24, 29, 0.42);
}

.social-modal__panel {
  position: relative;
  width: min(438px, calc(100vw - 28px));
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 24px 50px rgba(32, 19, 26, 0.24);
  overflow: hidden;
}

.social-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px 14px;
  border-bottom: 1px solid #f0e9ed;
}

.social-modal__title {
  margin: 0;
  color: #f04f92;
  font-size: 16px;
  font-weight: 600;
}

.social-modal__close {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #f04f92;
  position: relative;
  flex: 0 0 auto;
}

.social-modal__close span {
  position: absolute;
  top: 8px;
  left: 4px;
  width: 10px;
  height: 1.5px;
  background: #ffffff;
}

.social-modal__close span:first-child {
  transform: rotate(45deg);
}

.social-modal__close span:last-child {
  transform: rotate(-45deg);
}

.social-modal__body {
  padding: 14px 14px 8px;
}

.social-modal__field {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.social-modal__label {
  color: #201a1f;
  font-size: 13px;
  line-height: 1.2;
}

.social-modal__input-wrap {
  position: relative;
}

.social-modal__input {
  width: 100%;
  height: 34px;
  padding: 0 42px 0 12px;
  border: 1px solid #ebe5e8;
  border-radius: 7px;
  background: #faf9fb;
  color: #2358ea;
  font-size: 12px;
  outline: none;
}

.social-modal__copy {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  color: #3e63ff;
}

.social-modal__copy-icon {
  width: 14px;
  height: 14px;
  position: relative;
  display: block;
}

.social-modal__copy-icon::before,
.social-modal__copy-icon::after {
  content: '';
  position: absolute;
  border: 1.5px solid currentColor;
  border-radius: 3px;
  background: #ffffff;
}

.social-modal__copy-icon::before {
  inset: 3px 0 0 4px;
}

.social-modal__copy-icon::after {
  inset: 0 4px 3px 0;
}

.social-modal__copied {
  color: #54a36a;
  font-size: 12px;
  line-height: 1;
}

.social-modal__share {
  margin-top: 14px;
}

.social-modal__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.share-btn {
  height: 24px;
  border-radius: 999px;
  padding: 0 12px 0 8px;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.share-btn__icon {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.18);
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.share-btn--facebook {
  background: #1f69ff;
}

.share-btn--instagram {
  background: linear-gradient(90deg, #ffb332 0%, #f04f92 55%, #7b5cff 100%);
}

.share-btn--linkedin {
  background: #55a1ff;
}

.share-btn--x {
  background: #111111;
}

.social-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 18px 16px 16px;
}

.social-modal__done {
  min-width: 80px;
  height: 31px;
  border-radius: 9px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  font-size: 12px;
  box-shadow: 0 10px 16px rgba(234, 79, 141, 0.18);
}
</style>
