<script setup>
import { computed } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  employees: {
    type: Array,
    default: () => [],
  },
  fields: {
    type: Array,
    default: () => [],
  },
  previewValuesByEmployee: {
    type: Object,
    default: () => ({}),
  },
  applyMode: {
    type: String,
    default: 'for-all',
  },
})

const emit = defineEmits(['close', 'confirm', 'edit'])

const getOldValue = (employee, fieldKey) => {
  const directMap = {
    department: employee.department || employee.role || '-',
    jobTitle: employee.role || '-',
    position: employee.position || employee.role || '-',
    location: employee.address || '-',
    officeLocation: employee.address || '-',
    payFrequency: employee.customEdits?.payFrequency || '-',
    manager: employee.customEdits?.manager || '-',
    supervisor: employee.customEdits?.supervisor || '-',
    team: employee.customEdits?.team || '-',
    taxes: employee.customEdits?.taxes || '-',
    currency: employee.customEdits?.currency || '-',
    leaveType: employee.customEdits?.leaveType || '-',
  }

  return directMap[fieldKey] || employee.customEdits?.[fieldKey] || '-'
}

const summaryRows = computed(() =>
  props.employees.flatMap((employee) =>
    props.fields
      .filter((field) => props.previewValuesByEmployee[employee.id]?.[field.key] !== undefined)
      .map((field) => ({
        id: `${employee.id}-${field.key}`,
        employeeName: employee.name,
        fieldLabel: field.label,
        oldValue: getOldValue(employee, field.key),
        newValue: props.previewValuesByEmployee[employee.id]?.[field.key] || '-',
        editType: props.applyMode === 'for-all' ? 'Bulk' : 'Individual',
      })),
  ),
)
</script>

<template>
  <div v-if="open" class="edit-preview-modal">
    <button class="edit-preview-modal__overlay" type="button" aria-label="Close preview modal" @click="$emit('close')"></button>

    <section class="edit-preview-modal__panel" role="dialog" aria-modal="true" aria-label="Preview Edits">
      <div class="edit-preview-modal__breadcrumbs">
        <span>Employees</span>
        <span class="edit-preview-modal__crumb-sep">›</span>
        <span>Edited Employees</span>
      </div>

      <header class="edit-preview-modal__header">
        <h2 class="edit-preview-modal__title">Review Your Changes</h2>

        <button class="edit-preview-modal__close" type="button" aria-label="Close preview modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="edit-preview-modal__layout">
        <aside class="edit-preview-modal__employees-panel">
          <h3 class="edit-preview-modal__panel-title">{{ employees.length }} Employees will be updated</h3>

          <div class="edit-preview-modal__employees-list">
            <article v-for="employee in employees" :key="employee.id" class="edit-preview-modal__employee-card">
              <div class="edit-preview-modal__avatar" :style="{ background: employee.avatarBg, color: employee.avatarAccent }">
                {{ employee.avatarText }}
              </div>
              <div class="edit-preview-modal__employee-copy">
                <div class="edit-preview-modal__employee-name">{{ employee.name }}</div>
                <div class="edit-preview-modal__employee-role">{{ employee.role }}</div>
              </div>
            </article>
          </div>
        </aside>

        <section class="edit-preview-modal__summary-panel">
          <h3 class="edit-preview-modal__panel-title">Summary of Edits</h3>

          <div class="edit-preview-modal__summary-table">
            <div class="edit-preview-modal__summary-head">
              <div>Field</div>
              <div>Old Value</div>
              <div>New Value</div>
              <div>Edit Type</div>
            </div>

            <article v-for="row in summaryRows" :key="row.id" class="edit-preview-modal__summary-row">
              <div class="edit-preview-modal__summary-field">
                <div>{{ row.fieldLabel }}</div>
                <small>{{ row.employeeName }}</small>
              </div>
              <div class="edit-preview-modal__summary-old">{{ row.oldValue }}</div>
              <div class="edit-preview-modal__summary-new">{{ row.newValue }}</div>
              <div>
                <span class="edit-preview-modal__type-pill" :class="{ 'edit-preview-modal__type-pill--individual': row.editType === 'Individual' }">
                  {{ row.editType }}
                </span>
              </div>
            </article>
          </div>
        </section>
      </div>

      <footer class="edit-preview-modal__footer">
        <button type="button" class="edit-preview-modal__secondary" @click="$emit('close')">Cancel</button>
        <button type="button" class="edit-preview-modal__secondary" @click="$emit('edit')">Edit Again</button>
        <button type="button" class="edit-preview-modal__confirm" @click="$emit('confirm')">Confirm Changes →</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.edit-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 153;
  display: grid;
  place-items: center;
  padding: 20px;
}

.edit-preview-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(36, 23, 30, 0.54);
}

.edit-preview-modal__panel {
  position: relative;
  width: min(980px, calc(100vw - 34px));
  max-height: calc(100vh - 34px);
  padding: 28px 48px 36px;
  border-radius: 0;
  background: #fff;
  box-shadow: 0 24px 50px rgba(43, 24, 34, 0.18);
  overflow: auto;
}

.edit-preview-modal__header,
.edit-preview-modal__employee-card {
  display: flex;
  align-items: center;
}

.edit-preview-modal__breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 22px;
  color: #a5969e;
  font-size: 12px;
}

.edit-preview-modal__crumb-sep {
  color: #ef5a96;
}

.edit-preview-modal__header {
  justify-content: space-between;
  margin-bottom: 28px;
}

.edit-preview-modal__title {
  margin: 0;
  color: #181317;
  font-size: 22px;
  font-weight: 700;
}

.edit-preview-modal__close {
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef5a96;
}

.edit-preview-modal__close span {
  position: absolute;
  top: 9px;
  left: 4px;
  width: 12px;
  height: 1.6px;
  background: #fff;
}

.edit-preview-modal__close span:first-child { transform: rotate(45deg); }
.edit-preview-modal__close span:last-child { transform: rotate(-45deg); }

.edit-preview-modal__layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 26px;
}

.edit-preview-modal__employees-panel,
.edit-preview-modal__summary-panel {
  border: 1px solid #eee1e7;
  border-radius: 12px;
  background: #fff;
}

.edit-preview-modal__employees-panel {
  padding: 14px;
}

.edit-preview-modal__summary-panel {
  padding: 14px 18px;
}

.edit-preview-modal__panel-title {
  margin: 0 0 14px;
  color: #2a2328;
  font-size: 14px;
  font-weight: 700;
}

.edit-preview-modal__employees-list {
  display: grid;
  gap: 12px;
}

.edit-preview-modal__employee-card {
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #faf8fa;
}

.edit-preview-modal__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
}

.edit-preview-modal__employee-copy {
  min-width: 0;
}

.edit-preview-modal__employee-name {
  color: #2b2228;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-preview-modal__employee-role {
  color: #aaa0a6;
  font-size: 10px;
}

.edit-preview-modal__summary-table {
  display: grid;
  gap: 0;
}

.edit-preview-modal__summary-head,
.edit-preview-modal__summary-row {
  display: grid;
  grid-template-columns: 1.05fr 1fr 1fr 0.72fr;
  gap: 18px;
  align-items: center;
  padding: 16px 18px;
}

.edit-preview-modal__summary-head {
  background: #faf8fa;
  color: #6f6570;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
}

.edit-preview-modal__summary-row {
  border-bottom: 1px solid #f2e7eb;
  color: #2a2328;
  font-size: 13px;
}

.edit-preview-modal__summary-row:last-child {
  border-bottom: 0;
}

.edit-preview-modal__summary-field small {
  display: block;
  margin-top: 3px;
  color: #aaa0a6;
  font-size: 10px;
}

.edit-preview-modal__summary-old {
  color: #f0b12d;
}

.edit-preview-modal__summary-new {
  color: #2b2228;
}

.edit-preview-modal__type-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 28px;
  padding: 0 10px;
  border-radius: 10px;
  background: #ffe9f1;
  color: #ef5a96;
  font-size: 11px;
  font-weight: 700;
}

.edit-preview-modal__type-pill--individual {
  background: #efb01f;
  color: #fff;
}

.edit-preview-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 28px;
}

.edit-preview-modal__secondary,
.edit-preview-modal__confirm {
  height: 38px;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 700;
}

.edit-preview-modal__secondary {
  border: 1px solid #eee4e8;
  background: #f7f5f6;
  color: #b0a5ac;
}

.edit-preview-modal__confirm {
  background: linear-gradient(180deg, #ef5a96 0%, #e74889 100%);
  color: #fff;
}

@media (max-width: 900px) {
  .edit-preview-modal__panel {
    padding: 18px;
  }

  .edit-preview-modal__layout {
    grid-template-columns: 1fr;
  }

  .edit-preview-modal__summary-head,
  .edit-preview-modal__summary-row {
    min-width: 640px;
  }

  .edit-preview-modal__summary-panel {
    overflow-x: auto;
  }
}
</style>
