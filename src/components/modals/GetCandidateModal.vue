<script setup>
import { ref, watch } from 'vue'
import EmployeeReferralModal from './EmployeeReferralModal.vue'
import RecommendedChannelsModal from './RecommendedChannelsModal.vue'
import SendEmailModal from './SendEmailModal.vue'
import SocialShareModal from './SocialShareModal.vue'

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

const selectedOption = ref('Recommended channels')
const activeModal = ref('root')

const sourcingOptions = [
  {
    title: 'Recommended channels',
    description: 'Choose the right combination of channels to optimize your hiring strategy',
    accent: '#3d68ff',
  },
  {
    title: 'Free job boards',
    description: 'Reach a wide pool of qualified candidates without breaking the bank',
    accent: '#3b1cff',
  },
  {
    title: 'Employee Referral',
    description: 'Get your employees involved in the hiring process with our referral program',
    accent: '#e4a300',
  },
  {
    title: 'Talent Pools',
    description: 'Save time and resources by leveraging pre-screened candidates',
    accent: '#20bf6b',
  },
  {
    title: 'Social share',
    description: "Reach the perfect candidate, even if they aren't actively searching",
    accent: '#a6a0a6',
  },
]

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      selectedOption.value = 'Recommended channels'
      activeModal.value = 'root'
    }
  },
)

const handleOptionClick = (title) => {
  selectedOption.value = title

  if (title === 'Recommended channels') {
    activeModal.value = 'recommended'
  }

  if (title === 'Employee Referral') {
    activeModal.value = 'employeeReferral'
  }

  if (title === 'Social share') {
    activeModal.value = 'socialShare'
  }
}

const handleEmployeeReferralNext = () => {
  activeModal.value = 'sendEmail'
}
</script>

<template>
  <div v-if="props.open" class="candidate-modal">
    <button
      v-if="activeModal === 'root'"
      class="candidate-modal__overlay"
      aria-label="Close get candidate modal"
      @click="$emit('close')"
    ></button>

    <section
      v-if="activeModal === 'root'"
      class="candidate-modal__panel"
      role="dialog"
      aria-modal="true"
      aria-label="Get candidate"
    >
      <header class="candidate-modal__header">
        <h2 class="candidate-modal__title">Get Candidate</h2>
        <button class="candidate-modal__close" type="button" aria-label="Close get candidate modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="candidate-modal__body">
        <button
          v-for="option in sourcingOptions"
          :key="option.title"
          type="button"
          class="candidate-modal__card"
          :class="{ 'candidate-modal__card--selected': selectedOption === option.title }"
          @click="handleOptionClick(option.title)"
        >
          <span class="candidate-modal__avatar"></span>
          <span class="candidate-modal__meta">
            <span class="candidate-modal__card-title" :style="{ color: option.accent }">
              {{ option.title }}
            </span>
            <span class="candidate-modal__card-description">{{ option.description }}</span>
          </span>
        </button>
      </div>

      <footer class="candidate-modal__footer">
        <button type="button" class="candidate-modal__confirm" @click="$emit('close')">GOT IT</button>
      </footer>
    </section>

    <RecommendedChannelsModal
      :open="activeModal === 'recommended'"
      @close="activeModal = 'root'"
    />

    <EmployeeReferralModal
      :open="activeModal === 'employeeReferral'"
      @close="activeModal = 'root'"
      @next="handleEmployeeReferralNext"
    />

    <SocialShareModal
      :open="activeModal === 'socialShare'"
      :job="props.job"
      @close="activeModal = 'root'"
    />

    <SendEmailModal
      :open="activeModal === 'sendEmail'"
      @close="activeModal = 'root'"
    />
  </div>
</template>

<style scoped>
.candidate-modal {
  position: fixed;
  inset: 0;
  z-index: 95;
  display: grid;
  place-items: center;
  padding: 20px;
}

.candidate-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(33, 24, 29, 0.38);
}

.candidate-modal__panel {
  position: relative;
  width: min(420px, calc(100vw - 28px));
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 50px rgba(32, 19, 26, 0.22);
  overflow: hidden;
}

.candidate-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 14px;
  border-bottom: 1px solid #f0e9ed;
}

.candidate-modal__title {
  margin: 0;
  color: #f04f92;
  font-size: 16px;
  font-weight: 600;
}

.candidate-modal__close {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #f04f92;
  position: relative;
  flex: 0 0 auto;
}

.candidate-modal__close span {
  position: absolute;
  top: 8px;
  left: 4px;
  width: 10px;
  height: 1.5px;
  background: #ffffff;
}

.candidate-modal__close span:first-child {
  transform: rotate(45deg);
}

.candidate-modal__close span:last-child {
  transform: rotate(-45deg);
}

.candidate-modal__body {
  padding: 12px 14px 6px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.candidate-modal__card {
  width: 100%;
  padding: 12px 12px 12px 10px;
  border: 1px solid #f2ecef;
  border-radius: 8px;
  background: #f9f7f8;
  display: grid;
  grid-template-columns: 40px 1fr;
  align-items: center;
  gap: 12px;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.candidate-modal__card:hover {
  border-color: #ebd4df;
  box-shadow: 0 8px 18px rgba(47, 31, 39, 0.08);
}

.candidate-modal__card--selected {
  border-color: #f1c8d8;
  background: #fff7fa;
  box-shadow: 0 10px 20px rgba(234, 79, 141, 0.08);
}

.candidate-modal__avatar {
  width: 32px;
  height: 32px;
  border-radius: 14px;
  background: #d8ccd1;
}

.candidate-modal__meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.candidate-modal__card-title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
}

.candidate-modal__card-description {
  color: #9c9399;
  font-size: 11px;
  line-height: 1.3;
}

.candidate-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px 14px;
}

.candidate-modal__confirm {
  min-width: 82px;
  height: 29px;
  border-radius: 9px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  font-size: 12px;
  box-shadow: 0 10px 16px rgba(234, 79, 141, 0.18);
}

@media (max-width: 640px) {
  .candidate-modal {
    padding: 12px;
    align-items: end;
  }

  .candidate-modal__panel {
    width: 100%;
    max-height: calc(100vh - 24px);
    border-radius: 18px 18px 0 0;
  }

  .candidate-modal__header {
    padding: 16px 14px 12px;
  }

  .candidate-modal__title {
    font-size: 24px;
    line-height: 1.1;
  }

  .candidate-modal__body {
    padding: 12px;
    gap: 12px;
  }

  .candidate-modal__card {
    grid-template-columns: 36px 1fr;
    align-items: start;
    padding: 12px 10px;
    gap: 10px;
  }

  .candidate-modal__card-title {
    font-size: 14px;
  }

  .candidate-modal__card-description {
    font-size: 12px;
  }

  .candidate-modal__footer {
    padding: 10px 12px 14px;
  }

  .candidate-modal__confirm {
    width: 100%;
    min-height: 42px;
    border-radius: 12px;
    font-size: 13px;
  }
}
</style>
