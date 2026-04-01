<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  jobDetails: {
    type: Object,
    required: true,
  },
  additionalInfo: {
    type: Object,
    required: true,
  },
  metaData: {
    type: Object,
    required: true,
  },
  selectedTags: {
    type: Array,
    default: () => [],
  },
  selectedRecruiters: {
    type: Array,
    default: () => [],
  },
  hiringTeam: {
    type: Object,
    required: true,
  },
  previewState: {
    type: Object,
    required: true,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['preview-action'])

const actionMenuRef = ref(null)
const actionMenuOpen = ref(false)
const publishMenuRef = ref(null)
const publishMenuOpen = ref(false)
const scheduleModalOpen = ref(false)

const tagPalette = ['#ea4f8d', '#4f7dff', '#6b21d8', '#f1b32a', '#48d873', '#f08db2', '#8ea7ff', '#c4a1e8', '#f3d78f']

const previewTitle = computed(() => 'Preview Job')
const titleFieldValue = computed(() => props.jobDetails.jobTitle || 'Jobtitle will be shown here')
const previewDescription = computed(() =>
  props.jobDetails.description
  || props.metaData.seoDescription
  || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos...'
)
const previewSeoTitle = computed(() => props.metaData.seoTitle || 'Meta title')
const fullAddressValue = computed(() => props.jobDetails.jobTitle || 'Ex: Accountant in a Bank')
const salaryFromValue = computed(() => props.additionalInfo.salaryFrom || 'Ex: 0F2144')
const salaryToValue = computed(() => props.additionalInfo.salaryTo || 'Ex: 0F2144')
const previewTags = computed(() =>
  (props.selectedTags.length ? props.selectedTags : ['High Salary', 'Finance']).map((label, index) => ({
    label,
    color: tagPalette[index % tagPalette.length],
  })),
)
const previewRecruiter = computed(() => props.hiringTeam.recruiter || props.selectedRecruiters[0] || 'Manal Oraby')

const toggleActionMenu = () => {
  actionMenuOpen.value = !actionMenuOpen.value
}

const closeActionMenu = () => {
  actionMenuOpen.value = false
}

const togglePublishMenu = () => {
  if (props.submitting) return
  publishMenuOpen.value = !publishMenuOpen.value
}

const closePublishMenu = () => {
  publishMenuOpen.value = false
}

const openScheduleModal = () => {
  if (props.submitting) return
  closePublishMenu()
  scheduleModalOpen.value = true
}

const closeScheduleModal = () => {
  scheduleModalOpen.value = false
}

const handleDocumentClick = (event) => {
  if (!actionMenuRef.value?.contains(event.target)) {
    closeActionMenu()
  }

  if (!publishMenuRef.value?.contains(event.target)) {
    closePublishMenu()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})
</script>

<template>
  <div class="job-preview-step">
    <section class="job-preview-card">
      <div class="job-preview-card__header">
        <div>
          <h3 class="job-preview-card__title">{{ previewTitle }}</h3>
          <p class="job-preview-card__text">
            Make smarter hiring decisions. Our Intelligent Screening and Advancement system automates evaluations
            based on your criteria, ensuring efficient and fair assessments for every candidate.
          </p>
        </div>

        <div class="job-preview-card__header-side">
          <div ref="actionMenuRef" class="job-preview-card__menu-wrap">
            <button
              type="button"
              class="job-preview-card__menu-trigger"
              :class="{ 'job-preview-card__menu-trigger--open': actionMenuOpen }"
              :disabled="submitting"
              @click="toggleActionMenu"
            >
              ...
            </button>

            <div v-if="actionMenuOpen" class="job-preview-card__menu">
              <button type="button" @click="closeActionMenu">View</button>
              <button type="button" @click="closeActionMenu">Edit</button>
              <button type="button" class="job-preview-card__menu-item" @click="closeActionMenu">
                <span>Export</span>
                <span class="job-preview-card__menu-arrow"></span>
              </button>
              <button type="button" class="job-preview-card__menu-item--publish" :disabled="submitting" @click="closeActionMenu(); emit('preview-action', 'publish')">Publish</button>
            </div>
          </div>
        </div>
      </div>

      <div class="job-preview-card__body">
        <div class="job-preview-card__field">
          <label>Job Title</label>
          <div class="job-preview-card__value">{{ titleFieldValue }}</div>
        </div>

        <div class="job-preview-card__field">
          <label>Description</label>
          <div class="job-preview-card__editor">
            <div class="job-preview-card__toolbar">
              <button type="button" class="tool-btn is-strong">B</button>
              <button type="button" class="tool-btn is-italic">I</button>
              <button type="button" class="tool-btn is-underlined">U</button>
              <button type="button" class="tool-btn is-strike">S</button>
              <button type="button" class="tool-btn">&lt;&gt;</button>
              <span class="tool-sep"></span>
              <button type="button" class="tool-btn">C</button>
              <span class="tool-sep"></span>
              <button type="button" class="tool-btn">L1</button>
              <button type="button" class="tool-btn">L2</button>
              <span class="tool-sep"></span>
              <button type="button" class="tool-btn">@</button>
              <button type="button" class="tool-btn">P</button>
              <span class="tool-sep"></span>
              <button type="button" class="tool-btn">&lt;/&gt;</button>
              <button type="button" class="tool-btn">"</button>
              <span class="tool-sep"></span>
              <button type="button" class="tool-btn">-</button>
              <button type="button" class="tool-btn">[]</button>
            </div>
            <p>{{ previewDescription }}</p>
          </div>
        </div>

        <div class="job-preview-card__section">
          <h4>Additional Info</h4>

          <div class="job-preview-card__grid job-preview-card__grid--two">
            <div class="job-preview-card__field job-preview-card__field--select">
              <label>Industry</label>
              <div class="job-preview-card__value job-preview-card__value--select">
                <span>{{ additionalInfo.industry || 'Select one of the list...' }}</span>
                <span class="job-preview-card__value-arrow"></span>
              </div>
            </div>

            <div class="job-preview-card__field job-preview-card__field--select">
              <label>Career Level</label>
              <div class="job-preview-card__value job-preview-card__value--select">
                <span>{{ additionalInfo.careerLevel || 'Select one of the list...' }}</span>
                <span class="job-preview-card__value-arrow"></span>
              </div>
            </div>
          </div>

          <div class="job-preview-card__field">
            <label>Full Address</label>
            <div class="job-preview-card__value">{{ fullAddressValue }}</div>
          </div>

          <div class="job-preview-card__grid job-preview-card__grid--two">
            <div class="job-preview-card__field">
              <label>Degree Level</label>
              <div class="job-preview-card__value">{{ additionalInfo.degreeLevel || 'Ex: 0F2144' }}</div>
            </div>

            <div class="job-preview-card__field">
              <label>Contract Type</label>
              <div class="job-preview-card__value">{{ additionalInfo.contractType || 'Ex: 0F2144' }}</div>
            </div>
          </div>

          <div class="job-preview-card__field job-preview-card__field--select">
            <label>Currency</label>
            <div class="job-preview-card__value job-preview-card__value--select">
              <span>{{ additionalInfo.currency || 'Select Currency...' }}</span>
              <span class="job-preview-card__value-arrow"></span>
            </div>
          </div>

          <div class="job-preview-card__salary">
            <h5>Salary Negotiation</h5>

            <div class="job-preview-card__grid job-preview-card__grid--two">
              <div class="job-preview-card__field">
                <label>From</label>
                <div class="job-preview-card__value">{{ salaryFromValue }}</div>
              </div>

              <div class="job-preview-card__field">
                <label>to</label>
                <div class="job-preview-card__value">{{ salaryToValue }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="job-preview-card__section">
          <h4>Tags</h4>
          <p class="job-preview-card__section-copy"><span>Tags:</span> Select your prefered tags from menu</p>
          <div class="job-preview-card__tags-box">
            <div class="job-preview-card__tags">
              <span v-for="(tag, index) in previewTags" :key="`${tag.label}-${index}`" :style="{ '--tag-color': tag.color }">
                <span>{{ tag.label }}</span>
                <i>+</i>
              </span>
            </div>
          </div>
        </div>

        <div class="job-preview-card__section">
          <h4>Recruiter</h4>
          <div class="job-preview-card__recruiter">
            <span class="job-preview-card__avatar"></span>
            <span>{{ previewRecruiter }}</span>
            <button type="button">Add</button>
          </div>
        </div>

        <div class="job-preview-card__section">
          <h4>AI Builder Template</h4>
          <div class="job-preview-card__value">{{ hiringTeam.team || 'Default Job' }}</div>
        </div>

        <div class="job-preview-card__section">
          <h4>Meta Data</h4>
          <div class="job-preview-card__field">
            <label>Title</label>
            <div class="job-preview-card__value">{{ previewSeoTitle }}</div>
          </div>

          <div class="job-preview-card__field">
            <label>Description</label>
            <div class="job-preview-card__editor job-preview-card__editor--meta">
              <div class="job-preview-card__toolbar">
                <button type="button" class="tool-btn is-strong">B</button>
                <button type="button" class="tool-btn is-italic">I</button>
                <button type="button" class="tool-btn is-underlined">U</button>
                <button type="button" class="tool-btn is-strike">S</button>
                <button type="button" class="tool-btn">&lt;&gt;</button>
                <span class="tool-sep"></span>
                <button type="button" class="tool-btn">C</button>
                <span class="tool-sep"></span>
                <button type="button" class="tool-btn">L1</button>
                <button type="button" class="tool-btn">L2</button>
                <span class="tool-sep"></span>
                <button type="button" class="tool-btn">@</button>
                <button type="button" class="tool-btn">P</button>
                <span class="tool-sep"></span>
                <button type="button" class="tool-btn">&lt;/&gt;</button>
                <button type="button" class="tool-btn">"</button>
                <span class="tool-sep"></span>
                <button type="button" class="tool-btn">-</button>
                <button type="button" class="tool-btn">[]</button>
              </div>
              <p>{{ metaData.seoDescription || 'Meta description will be shown here.' }}</p>
            </div>
          </div>
        </div>

        <div class="job-preview-card__actions">
          <div ref="publishMenuRef" class="job-preview-card__publish-wrap">
            <button type="button" class="job-preview-card__primary job-preview-card__primary--menu" :disabled="submitting" @click="togglePublishMenu">
              <span>{{ submitting ? 'Publishing...' : 'Publish Job' }}</span>
              <span class="job-preview-card__primary-arrow"></span>
            </button>

            <div v-if="publishMenuOpen" class="job-preview-card__publish-menu">
              <button type="button" :disabled="submitting" @click="closePublishMenu(); emit('preview-action', 'save_and_publish')">save and publish</button>
              <button type="button" :disabled="submitting" @click="closePublishMenu(); emit('preview-action', 'save_only')">save only</button>
            </div>
          </div>

          <button type="button" class="job-preview-card__ghost" :disabled="submitting" @click="openScheduleModal">
            {{ submitting ? 'Saving...' : 'Schedule Publish' }}
          </button>
        </div>
      </div>
    </section>

    <div v-if="scheduleModalOpen" class="job-preview-modal">
      <div class="job-preview-modal__backdrop" @click="closeScheduleModal"></div>

      <div class="job-preview-modal__card">
        <div class="job-preview-modal__header">
          <div class="job-preview-modal__title-wrap">
            <span class="job-preview-modal__title-icon"></span>
            <h4>Schedule Publish</h4>
          </div>
        </div>

        <div class="job-preview-modal__section">
          <div class="job-preview-modal__section-head">
            <span>Schedule Publish</span>
            <button
              type="button"
              class="job-preview-modal__switch"
              :class="{ 'job-preview-modal__switch--on': previewState.schedule.scheduleEnabled }"
              :disabled="submitting"
              @click="previewState.schedule.scheduleEnabled = !previewState.schedule.scheduleEnabled"
            ></button>
          </div>

          <div class="job-preview-modal__grid">
            <label class="job-preview-modal__field">
              <span>Publish Date</span>
              <input v-model="previewState.schedule.publishDate" class="job-preview-modal__input-control" type="date" :disabled="submitting" />
            </label>

            <label class="job-preview-modal__field">
              <span>Publish Time</span>
              <input v-model="previewState.schedule.publishTime" class="job-preview-modal__input-control" type="time" :disabled="submitting" />
            </label>
          </div>
        </div>

        <div class="job-preview-modal__section">
          <div class="job-preview-modal__section-head">
            <span>Close Publish</span>
            <button
              type="button"
              class="job-preview-modal__switch"
              :class="{ 'job-preview-modal__switch--on': previewState.schedule.closePublishEnabled }"
              :disabled="submitting"
              @click="previewState.schedule.closePublishEnabled = !previewState.schedule.closePublishEnabled"
            ></button>
          </div>

          <div class="job-preview-modal__grid">
            <label class="job-preview-modal__field">
              <span>Publish Closing Date</span>
              <input v-model="previewState.schedule.closePublishDate" class="job-preview-modal__input-control" type="date" :disabled="submitting" />
            </label>

            <label class="job-preview-modal__field">
              <span>Publish Closing Time</span>
              <input v-model="previewState.schedule.closePublishTime" class="job-preview-modal__input-control" type="time" :disabled="submitting" />
            </label>
          </div>
        </div>

        <div class="job-preview-modal__actions">
          <button type="button" class="job-preview-modal__button" :disabled="submitting" @click="closeScheduleModal(); emit('preview-action', 'schedule_saved')">
            {{ submitting ? 'Saving...' : 'GOT IT' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.job-preview-step { display: flex; justify-content: center; }
.job-preview-card { width: 100%; max-width: 760px; border: 1px solid #efe4e8; border-radius: 14px; background: #fff; padding: 22px; }
.job-preview-card__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.job-preview-card__header-side { display: flex; align-items: flex-start; gap: 10px; }
.job-preview-card__title { margin: 0; font-size: 16px; font-weight: 600; color: #17111b; }
.job-preview-card__text { margin: 8px 0 0; max-width: 620px; font-size: var(--ui-small-font); line-height: 1.6; color: var(--hint-soft); }
.job-preview-card__menu-wrap { position: relative; flex: 0 0 auto; }
.job-preview-card__menu-trigger { min-width: 28px; height: 28px; border-radius: 999px; color: #a98a97; font-size: 18px; line-height: 1; }
.job-preview-card__menu-trigger--open { background: #fff3f7; color: #ea4f8d; }
.job-preview-card__menu { position: absolute; top: calc(100% + 8px); right: 0; z-index: 10; width: 124px; padding: 8px 0; border: 1px solid #e9dfe4; border-radius: 14px; background: #fff; box-shadow: 0 10px 24px rgba(31, 22, 36, 0.12); }
.job-preview-card__menu button { width: 100%; min-height: var(--ui-button-xs-height); padding: 0 12px; color: #ea4f8d; font-size: var(--ui-small-font); text-align: left; }
.job-preview-card__menu button:hover { background: #fff4f8; }
.job-preview-card__menu-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.job-preview-card__menu-item--publish { color: #f1b32a; }
.job-preview-card__menu-arrow { width: 6px; height: 6px; border-top: 1px solid currentColor; border-right: 1px solid currentColor; transform: rotate(45deg); flex: 0 0 auto; }
.job-preview-card__body { display: grid; gap: 22px; }
.job-preview-card__section h4 { margin: 0 0 22px; font-size: var(--ui-small-font); color: #ff5f9d; }
.job-preview-card__section-copy { margin: -4px 0 18px; font-size: var(--ui-meta-font); color: var(--hint-soft); }
.job-preview-card__section-copy span { color: #ff5f9d; text-decoration: underline; }
.job-preview-card__grid { display: grid; gap: 22px 16px; }
.job-preview-card__grid--two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 16px; row-gap: 28px; }
.job-preview-card__field label { display: block; margin-bottom: 20px; font-size: var(--ui-meta-font); color: #17111b; line-height: 1.2; }
.job-preview-card__value { min-height: 54px; padding: 16px 18px; border: 1px solid #e9dfe4; border-radius: 10px; background: #f8f8f8; color: var(--muted-strong); font-size: var(--font-small); }
.job-preview-card__value--select { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.job-preview-card__value-arrow { width: 10px; height: 10px; border-right: 2px solid #9d9498; border-bottom: 2px solid #9d9498; transform: rotate(45deg); flex: 0 0 auto; margin-right: 6px; }
.job-preview-card__editor { border: 1px solid #e9dfe4; border-radius: 10px; background: #f8f8f8; overflow: hidden; }
.job-preview-card__editor p { margin: 0; min-height: 200px; padding: 18px 16px; color: #c2b8be; font-size: 13px; line-height: 1.45; }
.job-preview-card__editor--meta p { min-height: 148px; }
.job-preview-card__toolbar { min-height: 52px; padding: 10px 12px; border-bottom: 1px solid #eee5e9; background: #fcfbfc; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; color: #2f2931; font-size: 14px; }
.tool-btn { min-width: 38px; height: 38px; padding: 0 10px; border: 1px solid #e4dbe0; border-radius: 8px; background: #fff; color: #2f2931; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1; }
.tool-sep { width: 1px; height: 22px; background: #ece2e7; }
.is-strong { font-weight: 700; }
.is-italic { font-style: italic; }
.is-underlined { text-decoration: underline; }
.is-strike { text-decoration: line-through; }
.job-preview-card__salary { padding-top: 10px; margin-top: 4px; }
.job-preview-card__salary h5 { margin: 0 0 18px; font-size: 16px; font-weight: 600; color: #7b434d; }
.job-preview-card__section > .job-preview-card__field + .job-preview-card__grid,
.job-preview-card__section > .job-preview-card__grid + .job-preview-card__field,
.job-preview-card__section > .job-preview-card__field + .job-preview-card__field,
.job-preview-card__section > .job-preview-card__grid + .job-preview-card__salary,
.job-preview-card__section > .job-preview-card__field + .job-preview-card__salary { margin-top: 12px; }
.job-preview-card__tags { display: flex; gap: 8px; flex-wrap: wrap; }
.job-preview-card__tags-box { border: 1px solid #ddd6da; border-radius: 8px; background: #fff; padding: 16px; }
.job-preview-card__tags span { min-height: 30px; padding: 0 10px; border-radius: 10px; background: color-mix(in srgb, var(--tag-color) 45%, white); color: #17111b; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; }
.job-preview-card__tags i { width: 16px; height: 16px; border-radius: 999px; background: #fff; color: var(--tag-color); display: inline-grid; place-items: center; font-style: normal; font-size: 13px; line-height: 1; font-weight: 700; }
.job-preview-card__recruiter { min-height: 44px; padding: 8px 12px; border: 1px solid #e9dfe4; border-radius: 8px; background: #f8f8f8; display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #f06a9a; font-size: var(--ui-small-font); }
.job-preview-card__avatar { width: 16px; height: 16px; border-radius: 999px; margin-right: 6px; background: linear-gradient(135deg, #ffd98e, #ff7b8f); }
.job-preview-card__recruiter > span:nth-child(2) { flex: 1 1 auto; }
.job-preview-card__recruiter button { min-width: 48px; height: var(--ui-button-xs-height); border-radius: 999px; background: #ffd8e7; color: #f06a9a; font-size: var(--ui-tiny-font); }
.job-preview-card__actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
.job-preview-card__publish-wrap { position: relative; }
.job-preview-card__ghost, .job-preview-card__primary { min-width: 120px; height: var(--ui-button-sm-height); padding: 0 14px; border-radius: 10px; font-size: var(--ui-meta-font); font-weight: 600; }
.job-preview-card__ghost { background: #ea4f8d; color: #fff; }
.job-preview-card__primary { background: #ea4f8d; color: #fff; }
.job-preview-card__primary--menu { display: inline-flex; align-items: center; justify-content: space-between; gap: 8px; }
.job-preview-card__primary-arrow { width: 7px; height: 7px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(45deg) translateY(-1px); flex: 0 0 auto; }
.job-preview-card__publish-menu { position: absolute; top: calc(100% + 8px); left: 0; z-index: 10; min-width: 120px; padding: 6px 0; border: 1px solid #e9dfe4; border-radius: 10px; background: #fff; box-shadow: 0 10px 24px rgba(31, 22, 36, 0.12); }
.job-preview-card__publish-menu button { width: 100%; min-height: var(--ui-button-xs-height); padding: 0 10px; color: #ea4f8d; font-size: var(--ui-tiny-font); text-align: left; }
.job-preview-card__publish-menu button:hover { background: #fff4f8; }
.job-preview-modal { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 24px; }
.job-preview-modal__backdrop { position: absolute; inset: 0; background: rgba(17, 12, 18, 0.58); }
.job-preview-modal__card { position: relative; z-index: 1; width: min(100%, 360px); border-radius: 8px; background: #fff; box-shadow: 0 18px 50px rgba(22, 15, 24, 0.24); overflow: hidden; }
.job-preview-modal__header { padding: 12px 16px; border-bottom: 1px solid #f0e6ea; }
.job-preview-modal__title-wrap { display: flex; align-items: center; gap: 10px; }
.job-preview-modal__title-wrap h4 { margin: 0; font-size: 14px; font-weight: 600; color: #ea4f8d; }
.job-preview-modal__title-icon { width: 14px; height: 14px; border: 1px solid #f3a8c4; border-radius: 999px; position: relative; }
.job-preview-modal__title-icon::before, .job-preview-modal__title-icon::after { content: ''; position: absolute; top: 50%; left: 50%; background: #ea4f8d; transform: translate(-50%, -50%); }
.job-preview-modal__title-icon::before { width: 6px; height: 1px; }
.job-preview-modal__title-icon::after { width: 1px; height: 6px; }
.job-preview-modal__section { padding: 16px; }
.job-preview-modal__section + .job-preview-modal__section { padding-top: 8px; }
.job-preview-modal__section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; color: #17111b; font-size: 11px; font-weight: 500; }
.job-preview-modal__switch { width: 26px; height: 16px; border-radius: 999px; background: #f1dfe6; position: relative; }
.job-preview-modal__switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12); }
.job-preview-modal__switch--on { background: #d9f2de; }
.job-preview-modal__switch--on::after { left: 12px; background: #48bf67; }
.job-preview-modal__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.job-preview-modal__field span:first-child { display: block; margin-bottom: 8px; color: var(--hint); font-size: var(--ui-tiny-font); }
.job-preview-modal__input-control { width: 100%; min-height: 34px; padding: 0 10px; border: 1px solid #f0e6ea; border-radius: 4px; background: #fff; color: var(--muted-strong); font-size: var(--ui-tiny-font); }
.job-preview-modal__actions { padding: 4px 16px 16px; }
.job-preview-modal__button { min-width: 66px; height: 24px; padding: 0 14px; border-radius: 8px; background: #ea4f8d; color: #fff; font-size: var(--ui-tiny-font); font-weight: 700; }
</style>
