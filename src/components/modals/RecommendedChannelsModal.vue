<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const channels = [
  {
    title: 'Linkedin Premium',
    description: 'Choose the right combination of channels to optimize your hiring strategy',
    accent: '#3d68ff',
  },
  {
    title: 'Indeed',
    description: 'Reach a wide pool of qualified candidates without breaking the bank',
    accent: '#431dff',
  },
  {
    title: 'Job Rapido',
    description: 'Get your employees involved in the hiring process with our referral program',
    accent: '#eea800',
  },
  {
    title: 'Glass Door',
    description: 'Save time and resources by leveraging pre-screened candidates',
    accent: '#20bf6b',
  },
  {
    title: 'Career Jet',
    description: "Reach the perfect candidate, even if they aren't actively searching",
    accent: '#355dff',
  },
]
</script>

<template>
  <div v-if="open" class="channels-modal">
    <button class="channels-modal__overlay" aria-label="Close recommended channels modal" @click="$emit('close')"></button>

    <section class="channels-modal__panel" role="dialog" aria-modal="true" aria-label="Recommended Channels">
      <header class="channels-modal__header">
        <h2 class="channels-modal__title">Recommended Channels</h2>
        <button
          class="channels-modal__close"
          type="button"
          aria-label="Close recommended channels modal"
          @click="$emit('close')"
        >
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="channels-modal__body">
        <div
          v-for="channel in channels"
          :key="channel.title"
          class="channels-modal__card"
        >
          <span class="channels-modal__avatar"></span>
          <span class="channels-modal__meta">
            <span class="channels-modal__card-title" :style="{ color: channel.accent }">
              {{ channel.title }}
            </span>
            <span class="channels-modal__card-description">{{ channel.description }}</span>
          </span>
        </div>
      </div>

      <footer class="channels-modal__footer">
        <button type="button" class="channels-modal__confirm" @click="$emit('close')">GOT IT</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.channels-modal {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: grid;
  place-items: center;
  padding: 20px;
}

.channels-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(33, 24, 29, 0.42);
}

.channels-modal__panel {
  position: relative;
  width: min(540px, calc(100vw - 28px));
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 50px rgba(32, 19, 26, 0.24);
  overflow: hidden;
}

.channels-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 18px;
  border-bottom: 1px solid #f0e9ed;
}

.channels-modal__title {
  margin: 0;
  color: #f04f92;
  font-size: 16px;
  font-weight: 600;
}

.channels-modal__close {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #f04f92;
  position: relative;
  flex: 0 0 auto;
}

.channels-modal__close span {
  position: absolute;
  top: 10px;
  left: 5px;
  width: 12px;
  height: 1.5px;
  background: #ffffff;
}

.channels-modal__close span:first-child {
  transform: rotate(45deg);
}

.channels-modal__close span:last-child {
  transform: rotate(-45deg);
}

.channels-modal__body {
  padding: 12px 22px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.channels-modal__card {
  width: 100%;
  padding: 14px 14px 14px 12px;
  border: 1px solid #f2ecef;
  border-radius: 8px;
  background: #f9f7f8;
  display: grid;
  grid-template-columns: 50px 1fr;
  align-items: center;
  gap: 14px;
}

.channels-modal__avatar {
  width: 38px;
  height: 38px;
  border-radius: 16px;
  background: #d8ccd1;
}

.channels-modal__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.channels-modal__card-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
}

.channels-modal__card-description {
  color: #9c9399;
  font-size: 11px;
  line-height: 1.35;
}

.channels-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 22px 18px;
}

.channels-modal__confirm {
  min-width: 82px;
  height: 31px;
  border-radius: 9px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  font-size: 12px;
  box-shadow: 0 10px 16px rgba(234, 79, 141, 0.18);
}
</style>
