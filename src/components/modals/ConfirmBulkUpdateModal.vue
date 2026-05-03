<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  employeeCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <div v-if="open" class="confirm-bulk-modal">
    <button class="confirm-bulk-modal__overlay" type="button" aria-label="Close confirm bulk update modal" @click="$emit('close')"></button>

    <section class="confirm-bulk-modal__panel" role="dialog" aria-modal="true" aria-label="Confirm Bulk Update">
      <button class="confirm-bulk-modal__close" type="button" aria-label="Close confirm bulk update modal" @click="$emit('close')">
        <span></span>
        <span></span>
      </button>

      <div class="confirm-bulk-modal__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5.5 12.5 10 17l8.5-9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <h2 class="confirm-bulk-modal__title">Confirm Bulk Update</h2>
      <p class="confirm-bulk-modal__copy">
        You are about to apply these changes to the {{ employeeCount }} selected employees. This action cannot be undone.
        Do you want to proceed?
      </p>

      <footer class="confirm-bulk-modal__footer">
        <button type="button" class="confirm-bulk-modal__confirm" @click="$emit('confirm')">Yes, Apply Changes</button>
        <button type="button" class="confirm-bulk-modal__cancel" @click="$emit('close')">Cancel</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.confirm-bulk-modal {
  position: fixed;
  inset: 0;
  z-index: 155;
  display: grid;
  place-items: center;
  padding: 24px;
}

.confirm-bulk-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(31, 22, 27, 0.62);
}

.confirm-bulk-modal__panel {
  position: relative;
  width: min(431px, calc(100vw - 32px));
  padding: 26px 28px 22px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 22px 48px rgba(43, 24, 34, 0.22);
  text-align: center;
}

.confirm-bulk-modal__close {
  position: absolute;
  top: 11px;
  right: 11px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ef5a96;
}

.confirm-bulk-modal__close span {
  position: absolute;
  top: 8px;
  left: 4px;
  width: 10px;
  height: 1.5px;
  background: #fff;
}

.confirm-bulk-modal__close span:first-child { transform: rotate(45deg); }
.confirm-bulk-modal__close span:last-child { transform: rotate(-45deg); }

.confirm-bulk-modal__icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #ef5a96;
  color: #fff;
}

.confirm-bulk-modal__icon svg {
  width: 34px;
  height: 34px;
}

.confirm-bulk-modal__title {
  margin: 0 0 12px;
  color: #1f1820;
  font-size: 18px;
  font-weight: 600;
}

.confirm-bulk-modal__copy {
  margin: 0;
  color: #9e949a;
  font-size: 12px;
  line-height: 1.32;
  max-width: 300px;
  margin-inline: auto;
}

.confirm-bulk-modal__footer {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.confirm-bulk-modal__confirm,
.confirm-bulk-modal__cancel {
  min-width: 134px;
  height: 32px;
  border-radius: 6px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
}

.confirm-bulk-modal__confirm {
  background: linear-gradient(180deg, #ef5a96 0%, #e74889 100%);
  color: #fff;
}

.confirm-bulk-modal__cancel {
  border: 1px solid #f1dbe4;
  color: #f0a4bf;
  background: #fff;
}

@media (max-width: 480px) {
  .confirm-bulk-modal__panel {
    padding-inline: 18px;
  }

  .confirm-bulk-modal__footer {
    flex-direction: column;
  }

  .confirm-bulk-modal__confirm,
  .confirm-bulk-modal__cancel {
    width: 100%;
  }
}
</style>
