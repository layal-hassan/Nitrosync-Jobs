<script setup>
import { computed, reactive, watch } from 'vue'
import Dropdown from '../ui/Dropdown.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['close', 'save'])

const accessLevelOptions = ['View only', 'Limited edit', 'Manager review']

const sections = [
  {
    key: 'personal',
    title: 'Personal Information',
    items: [
      'Phone number',
      'Email address',
      'Date of birth',
      'National ID / Social Security Number',
      'Address',
      'Gender / Ethnicity',
    ],
  },
  {
    key: 'employment',
    title: 'Employment Details',
    items: [
      'Job Title',
      'Department',
      'Employee ID',
      'Employment Type',
      'Location (Onsite/Remote)',
      'Manager/Supervisor',
      'Joining date / Exit date',
    ],
  },
  {
    key: 'compensation',
    title: 'Compensation & Payroll',
    items: [
      'Salary & bonuses',
      'Compensation breakdown',
      'Benefits & deductions',
      'Bank account info',
      'Payroll type / schedule',
    ],
  },
  {
    key: 'performance',
    title: 'Performance & Admin',
    items: [
      'Performance reviews / ratings',
      'Promotions or warnings',
      'Training & development progress',
      'Leave balances / sick days / vacation data',
      'Comments from HR or manager',
      'Contract type or status',
    ],
  },
  {
    key: 'documents',
    title: 'Documents & Files',
    items: [
      'Uploaded documents',
      'Visas / work permit info',
      'Emergency contacts',
      'Background check status',
    ],
  },
]

const createState = () => ({
  accessLevel: '',
  enabledSections: {
    personal: true,
    employment: true,
    compensation: true,
    performance: true,
    documents: true,
  },
  selectedFields: {},
})

const localState = reactive(createState())

const buildDefaultFields = () =>
  Object.fromEntries(
    sections.map((section) => [
      section.key,
      Object.fromEntries(section.items.map((item) => [item, true])),
    ]),
  )

const resetLocalState = () => {
  const incoming = props.modelValue || {}
  const defaultFields = buildDefaultFields()

  localState.accessLevel = incoming.accessLevel || ''
  localState.enabledSections = {
    personal: true,
    employment: true,
    compensation: true,
    performance: true,
    documents: true,
    ...(incoming.enabledSections || {}),
  }
  localState.selectedFields = Object.fromEntries(
    sections.map((section) => [
      section.key,
      {
        ...defaultFields[section.key],
        ...(incoming.selectedFields?.[section.key] || {}),
      },
    ]),
  )
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetLocalState()
    }
  },
)

const hasAnySelection = computed(() =>
  sections.some((section) =>
    Object.values(localState.selectedFields[section.key] || {}).some(Boolean),
  ),
)

const toggleSection = (sectionKey) => {
  localState.enabledSections[sectionKey] = !localState.enabledSections[sectionKey]
}

const save = () => {
  emit('save', {
    accessLevel: localState.accessLevel,
    enabledSections: { ...localState.enabledSections },
    selectedFields: Object.fromEntries(
      sections.map((section) => [
        section.key,
        { ...(localState.selectedFields[section.key] || {}) },
      ]),
    ),
  })
}
</script>

<template>
  <div v-if="open" class="restricted-access-modal">
    <button class="restricted-access-modal__overlay" type="button" aria-label="Close restricted access modal" @click="$emit('close')"></button>

    <section class="restricted-access-modal__panel" role="dialog" aria-modal="true" aria-label="Restricted access">
      <header class="restricted-access-modal__header">
        <div class="restricted-access-modal__title-wrap">
          <span class="restricted-access-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M8 10V7.8a4 4 0 1 1 8 0V10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <rect x="5" y="10" width="14" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </span>
          <h2 class="restricted-access-modal__title">Restricted access</h2>
        </div>

        <button class="restricted-access-modal__close" type="button" aria-label="Close restricted access modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="restricted-access-modal__body">
        <div class="restricted-access-modal__field">
          <span class="restricted-access-modal__label">Assign Access Level</span>
          <Dropdown v-model="localState.accessLevel" :options="accessLevelOptions" placeholder="Please Select" />
        </div>

        <div class="restricted-access-modal__helper">
          <strong>Restrict Fields</strong>
          <span>Choose which categories of information to hide in the employee profile.</span>
        </div>

        <section v-for="section in sections" :key="section.key" class="restricted-access-modal__section">
          <div class="restricted-access-modal__section-head">
            <span class="restricted-access-modal__section-title">{{ section.title }}</span>
            <button
              type="button"
              class="restricted-access-modal__section-toggle"
              :class="{ 'restricted-access-modal__section-toggle--active': localState.enabledSections[section.key] }"
              @click="toggleSection(section.key)"
            >
              <span></span>
            </button>
          </div>

          <div class="restricted-access-modal__grid" :class="{ 'restricted-access-modal__grid--disabled': !localState.enabledSections[section.key] }">
            <label v-for="item in section.items" :key="item" class="restricted-access-modal__checkbox">
              <input v-model="localState.selectedFields[section.key][item]" type="checkbox" :disabled="!localState.enabledSections[section.key]" />
              <span class="restricted-access-modal__fake-check"></span>
              <span>{{ item }}</span>
            </label>
          </div>
        </section>
      </div>

      <footer class="restricted-access-modal__footer">
        <button type="button" class="restricted-access-modal__save" :disabled="!hasAnySelection" @click="save">save</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.restricted-access-modal {
  position: fixed;
  inset: 0;
  z-index: 180;
  display: grid;
  place-items: center;
  padding: 20px;
}

.restricted-access-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(24, 17, 22, 0.54);
}

.restricted-access-modal__panel {
  position: relative;
  width: min(640px, calc(100vw - 32px));
  max-height: calc(100vh - 40px);
  background: #fff;
  border: 1px solid #f1dbe5;
  border-radius: 18px;
  box-shadow: 0 28px 60px rgba(32, 19, 26, 0.22);
  overflow: auto;
}

.restricted-access-modal__header,
.restricted-access-modal__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.restricted-access-modal__header {
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f6e5eb;
}

.restricted-access-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.restricted-access-modal__icon {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: #ef5a96;
  color: #fff;
}

.restricted-access-modal__icon svg {
  width: 15px;
  height: 15px;
}

.restricted-access-modal__title {
  margin: 0;
  color: #2c2329;
  font-size: 18px;
  font-weight: 600;
}

.restricted-access-modal__close {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ef5a96;
  position: relative;
}

.restricted-access-modal__close span {
  position: absolute;
  top: 9px;
  left: 4px;
  width: 12px;
  height: 1.5px;
  background: #fff;
}

.restricted-access-modal__close span:first-child { transform: rotate(45deg); }
.restricted-access-modal__close span:last-child { transform: rotate(-45deg); }

.restricted-access-modal__body {
  padding: 18px 20px 12px;
  display: grid;
  gap: 16px;
}

.restricted-access-modal__field,
.restricted-access-modal__helper,
.restricted-access-modal__section {
  display: grid;
  gap: 8px;
}

.restricted-access-modal__label,
.restricted-access-modal__section-title {
  color: #615760;
  font-size: 12px;
  font-weight: 600;
}

.restricted-access-modal__helper strong {
  color: #2c2329;
  font-size: 13px;
  font-weight: 600;
}

.restricted-access-modal__helper span {
  color: #9b8f97;
  font-size: 11px;
}

.restricted-access-modal__section {
  padding: 12px;
  border: 1px solid #f4e3ea;
  border-radius: 12px;
  background: #fff;
}

.restricted-access-modal__section-toggle {
  width: 34px;
  height: 18px;
  border-radius: 999px;
  background: #ddd8dc;
  padding: 2px;
  transition: background-color 0.18s ease;
}

.restricted-access-modal__section-toggle span {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.18s ease;
}

.restricted-access-modal__section-toggle--active {
  background: #ef5a96;
}

.restricted-access-modal__section-toggle--active span {
  transform: translateX(16px);
}

.restricted-access-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
}

.restricted-access-modal__grid--disabled {
  opacity: 0.42;
}

.restricted-access-modal__checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #5d535a;
  font-size: 11px;
}

.restricted-access-modal__checkbox input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.restricted-access-modal__fake-check {
  width: 13px;
  height: 13px;
  border: 1px solid #ef98ba;
  border-radius: 3px;
  background: #fff;
  position: relative;
  flex: 0 0 auto;
}

.restricted-access-modal__checkbox input:checked + .restricted-access-modal__fake-check {
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  border-color: transparent;
}

.restricted-access-modal__checkbox input:checked + .restricted-access-modal__fake-check::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 3px;
  height: 7px;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg);
}

.restricted-access-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 0 20px 18px;
}

.restricted-access-modal__save {
  min-width: 84px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.restricted-access-modal__save:disabled {
  opacity: 0.4;
  cursor: default;
}

@media (max-width: 760px) {
  .restricted-access-modal {
    padding: 12px;
  }

  .restricted-access-modal__panel {
    width: min(100vw - 24px, 640px);
    max-height: calc(100vh - 24px);
  }

  .restricted-access-modal__grid {
    grid-template-columns: 1fr;
  }
}
</style>
