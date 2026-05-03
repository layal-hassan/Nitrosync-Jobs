<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['done'])
</script>

<template>
  <div v-if="open" class="update-success-modal">
    <button class="update-success-modal__overlay" type="button" aria-label="Close update successful modal" @click="$emit('done')"></button>

    <section class="update-success-modal__panel" role="dialog" aria-modal="true" aria-label="Update successful">
      <button class="update-success-modal__close" type="button" aria-label="Close update successful modal" @click="$emit('done')">
        <span></span>
        <span></span>
      </button>

      <div class="update-success-modal__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5.5 12.5 10 17l8.5-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <h2 class="update-success-modal__title">Update successful</h2>
      <p class="update-success-modal__copy">The selected fields have been updated for all selected employees.</p>

      <footer class="update-success-modal__footer">
        <button type="button" class="update-success-modal__done" @click="$emit('done')">Done</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.update-success-modal {
  position: fixed;
  inset: 0;
  z-index: 156;
  display: grid;
  place-items: center;
  padding: 24px;
}

.update-success-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(31, 22, 27, 0.62);
}

.update-success-modal__panel {
  position: relative;
  width: min(431px, calc(100vw - 32px));
  padding: 26px 28px 22px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 22px 48px rgba(43, 24, 34, 0.22);
  text-align: center;
}

.update-success-modal__close {
  position: absolute;
  top: 11px;
  right: 11px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ef5a96;
}

.update-success-modal__close span {
  position: absolute;
  top: 8px;
  left: 4px;
  width: 10px;
  height: 1.5px;
  background: #fff;
}

.update-success-modal__close span:first-child { transform: rotate(45deg); }
.update-success-modal__close span:last-child { transform: rotate(-45deg); }

.update-success-modal__icon {
  width: 68px;
  height: 68px;
  margin: 0 auto 14px;
  display: grid;
  place-items: center;
  color: #5ad146;
}

.update-success-modal__icon svg {
  width: 50px;
  height: 50px;
}

.update-success-modal__title {
  margin: 0 0 12px;
  color: #1f1820;
  font-size: 18px;
  font-weight: 600;
}

.update-success-modal__copy {
  margin: 0;
  color: #9e949a;
  font-size: 12px;
  line-height: 1.32;
  max-width: 286px;
  margin-inline: auto;
}

.update-success-modal__footer {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}

.update-success-modal__done {
  min-width: 126px;
  height: 32px;
  border-radius: 6px;
  padding: 0 18px;
  background: linear-gradient(180deg, #ef5a96 0%, #e74889 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
</style>
