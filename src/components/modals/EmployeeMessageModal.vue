<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  employee: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'email',
  },
})

const emit = defineEmits(['close', 'send'])

const form = reactive({
  title: '',
  body: '',
})

const isResetMode = computed(() => props.mode === 'reset-password')

watch(
  () => [props.open, props.mode],
  ([isOpen]) => {
    if (!isOpen) return
    form.title = ''
    form.body = ''
  },
)
</script>

<template>
  <div v-if="open" class="employee-message-modal">
    <button class="employee-message-modal__overlay" type="button" aria-label="Close message modal" @click="$emit('close')"></button>

    <section class="employee-message-modal__panel" role="dialog" aria-modal="true" :aria-label="isResetMode ? 'Reset Password' : 'Send an Email'">
      <header class="employee-message-modal__header">
        <div class="employee-message-modal__title-wrap">
          <span class="employee-message-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="4" y="6" width="16" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path d="M6 8.2 12 13l6-4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <h2 class="employee-message-modal__title">{{ isResetMode ? 'Reset Password' : 'Send an Email' }}</h2>
        </div>

        <button class="employee-message-modal__close" type="button" aria-label="Close message modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="employee-message-modal__body">
        <div class="employee-message-modal__label">Name</div>
        <div v-if="employee" class="employee-message-modal__employee">
          <div class="employee-message-modal__avatar" :style="{ background: employee.avatarBg, color: employee.avatarAccent }">{{ employee.avatarText }}</div>
          <div>
            <div class="employee-message-modal__name">{{ employee.name }}</div>
            <div class="employee-message-modal__stars">5 Stars</div>
          </div>
        </div>

        <label class="employee-message-modal__field">
          <span>{{ isResetMode ? 'Password' : 'Email Title' }}</span>
          <input v-model="form.title" :type="isResetMode ? 'password' : 'text'" />
        </label>

        <label v-if="!isResetMode" class="employee-message-modal__field">
          <span>Email</span>
          <div class="employee-message-modal__editor-head">
            <span></span>
            <span></span>
          </div>
          <textarea
            v-model="form.body"
            placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu."
          ></textarea>
        </label>
      </div>

      <footer class="employee-message-modal__footer">
        <button type="button" class="employee-message-modal__send" @click="$emit('send', isResetMode ? { password: form.title } : { ...form })">
          {{ isResetMode ? 'Reset Password' : 'Send Email' }}
          <span aria-hidden="true">+</span>
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.employee-message-modal {
  position: fixed;
  inset: 0;
  z-index: 154;
  display: grid;
  place-items: center;
  padding: 20px;
}

.employee-message-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(35, 22, 29, 0.48);
}

.employee-message-modal__panel {
  position: relative;
  width: min(420px, calc(100vw - 28px));
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 24px 50px rgba(43, 24, 34, 0.2);
  overflow: hidden;
}

.employee-message-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f2e7eb;
}

.employee-message-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-message-modal__icon {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  background: #ef5a96;
  color: #fff;
  border-radius: 4px;
}

.employee-message-modal__icon svg {
  width: 12px;
  height: 12px;
}

.employee-message-modal__title {
  margin: 0;
  color: #221a20;
  font-size: 13px;
  font-weight: 700;
}

.employee-message-modal__close {
  position: relative;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ef5a96;
}

.employee-message-modal__close span {
  position: absolute;
  top: 7px;
  left: 3px;
  width: 10px;
  height: 1.4px;
  background: #fff;
}

.employee-message-modal__close span:first-child { transform: rotate(45deg); }
.employee-message-modal__close span:last-child { transform: rotate(-45deg); }

.employee-message-modal__body {
  padding: 14px 16px 12px;
}

.employee-message-modal__label,
.employee-message-modal__field span {
  display: block;
  margin-bottom: 8px;
  color: #b4aab0;
  font-size: 9px;
  font-weight: 600;
}

.employee-message-modal__employee {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.employee-message-modal__avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 9px;
  font-weight: 800;
}

.employee-message-modal__name {
  color: #4a7fff;
  font-size: 9px;
}

.employee-message-modal__stars {
  color: #b6aeb5;
  font-size: 8px;
}

.employee-message-modal__field {
  display: block;
  margin-bottom: 12px;
}

.employee-message-modal__field input,
.employee-message-modal__field textarea {
  width: 100%;
  border: 1px solid #ece3e7;
  border-radius: 6px;
  background: #fff;
  color: #6f656c;
  outline: none;
}

.employee-message-modal__field input {
  height: 40px;
  padding: 0 12px;
  font-size: 11px;
}

.employee-message-modal__editor-head {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: -2px;
  margin-bottom: 4px;
  color: #2a2328;
  font-size: 10px;
}

.employee-message-modal__field textarea {
  min-height: 132px;
  padding: 12px;
  font-size: 10px;
  resize: vertical;
}

.employee-message-modal__field textarea::placeholder {
  color: #bbb0b7;
}

.employee-message-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 0 16px 16px;
}

.employee-message-modal__send {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 86px;
  height: 24px;
  padding: 0 10px;
  border-radius: 8px;
  background: linear-gradient(180deg, #ef5a96 0%, #e74789 100%);
  color: #fff;
  font-size: 8px;
  font-weight: 700;
}
</style>
