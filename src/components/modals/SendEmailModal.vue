<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlock from '@tiptap/extension-code-block'
import Blockquote from '@tiptap/extension-blockquote'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Palette,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Code2,
  Quote,
  Minus,
  Maximize,
} from 'lucide-vue-next'
import Dropdown from '../ui/Dropdown.vue'
import ChooseCandidatesModal from './ChooseCandidatesModal.vue'
import FullscreenEmailEditor from './FullscreenEmailEditor.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const savedEmail = ref('Custom Email')
const showCandidateMenu = ref(false)
const isChooseCandidatesOpen = ref(false)
const isFullscreenOpen = ref(false)
const selectedCandidates = ref([])
const editorContent = ref('<p></p>')

const allCandidates = [
  { id: 1, name: 'Carlos Mahovia', accent: 'pink', tags: 'Finance', position: 'Accountant', country: 'Jordan', rating: '5' },
  { id: 2, name: 'Nora Salem', accent: 'blue', tags: 'Tech', position: 'Engineer', country: 'UAE', rating: '4' },
  { id: 3, name: 'Omar Hadi', accent: 'purple', tags: 'Backend', position: 'Developer', country: 'Saudi', rating: '5' },
  { id: 4, name: 'Lina Adib', accent: 'gold', tags: 'Design', position: 'Designer', country: 'Jordan', rating: '3' },
]

const emailTemplates = ['Custom Email', 'Referral Intro', 'Short Follow Up']

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      codeBlock: false,
      blockquote: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
    }),
    Image,
    CodeBlock,
    Blockquote,
  ],
  content: '<p></p>',
  editorProps: {
    attributes: {
      class: 'editor__content',
      'data-placeholder': 'Write your email message here...',
    },
  },
  onUpdate: ({ editor: currentEditor }) => {
    editorContent.value = currentEditor.getHTML()
  },
})

const suggestedCandidates = computed(() => allCandidates.slice(0, 2))
const availableCandidates = computed(() =>
  allCandidates.filter(
    (candidate) => !selectedCandidates.value.some((item) => item.id === candidate.id),
  ),
)
const canSend = computed(() => selectedCandidates.value.length > 0)

const addCandidate = (candidate) => {
  if (selectedCandidates.value.some((item) => item.id === candidate.id)) return
  selectedCandidates.value = [...selectedCandidates.value, candidate]
  showCandidateMenu.value = false
}

const removeCandidate = (id) => {
  selectedCandidates.value = selectedCandidates.value.filter((candidate) => candidate.id !== id)
}

const toggleCandidate = (candidate) => {
  if (selectedCandidates.value.some((item) => item.id === candidate.id)) {
    removeCandidate(candidate.id)
    return
  }

  addCandidate(candidate)
}

const toolbarGroups = [
  [
    { id: 'bold', icon: Bold, label: 'Bold' },
    { id: 'italic', icon: Italic, label: 'Italic' },
    { id: 'underline', icon: UnderlineIcon, label: 'Underline' },
    { id: 'strike', icon: Strikethrough, label: 'Strikethrough' },
  ],
  [{ id: 'inlineCode', icon: Code, label: 'Inline code' }],
  [{ id: 'palette', icon: Palette, label: 'Text color' }],
  [
    { id: 'bullet', icon: List, label: 'Bullet list' },
    { id: 'ordered', icon: ListOrdered, label: 'Ordered list' },
  ],
  [
    { id: 'link', icon: LinkIcon, label: 'Link' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
  ],
  [{ id: 'code', icon: Code2, label: 'Code block' }],
  [{ id: 'quote', icon: Quote, label: 'Quote' }],
  [{ id: 'divider', icon: Minus, label: 'Divider' }],
  [{ id: 'expand', icon: Maximize, label: 'Expand editor' }],
]

const isActive = (type) => {
  if (!editor.value) return false

  if (type === 'ordered') return editor.value.isActive('orderedList')
  if (type === 'bullet') return editor.value.isActive('bulletList')
  if (type === 'link') return editor.value.isActive('link')
  if (type === 'inlineCode') return editor.value.isActive('code')
  if (type === 'strike') return editor.value.isActive('strike')
  if (type === 'image' || type === 'expand' || type === 'palette') return false
  if (type === 'quote') return editor.value.isActive('blockquote')
  if (type === 'code') return editor.value.isActive('codeBlock')
  if (type === 'divider') return false

  return editor.value.isActive(type)
}

const runToolbarAction = (type) => {
  if (!editor.value) return

  if (type === 'expand') {
    editorContent.value = editor.value.getHTML()
    isFullscreenOpen.value = true
    return
  }

  const chain = editor.value.chain().focus()

  if (type === 'bold') return chain.toggleBold().run()
  if (type === 'italic') return chain.toggleItalic().run()
  if (type === 'underline') return chain.toggleUnderline().run()
  if (type === 'strike') return chain.toggleStrike().run()
  if (type === 'inlineCode') return chain.toggleCode().run()
  if (type === 'bullet') return chain.toggleBulletList().run()
  if (type === 'ordered') return chain.toggleOrderedList().run()
  if (type === 'palette') return
  if (type === 'divider') return chain.setHorizontalRule().run()

  if (type === 'link') {
    const previousUrl = editor.value.getAttributes('link').href || ''
    const url = window.prompt('Enter link URL', previousUrl)

    if (url === null) return
    if (!url.trim()) return chain.unsetLink().run()

    return chain.setLink({ href: url.trim() }).run()
  }

  if (type === 'image') {
    const src = window.prompt('Enter image URL')
    if (!src?.trim()) return

    return chain.setImage({ src: src.trim() }).run()
  }

  if (type === 'quote') return chain.toggleBlockquote().run()
  if (type === 'code') return chain.toggleCodeBlock().run()
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      showCandidateMenu.value = false
      isChooseCandidatesOpen.value = false
      isFullscreenOpen.value = false
      savedEmail.value = 'Custom Email'
      selectedCandidates.value = []
      editor.value?.commands.clearContent()
      editorContent.value = '<p></p>'
      return
    }

    selectedCandidates.value = [allCandidates[0]]
  },
  { immediate: true },
)

watch(editorContent, (value) => {
  if (!editor.value || editor.value.getHTML() === value) return
  editor.value.commands.setContent(value, false)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div v-if="open" class="send-email-modal">
    <button class="send-email-modal__overlay" aria-label="Close send email modal" @click="$emit('close')"></button>

    <section class="send-email-modal__panel" role="dialog" aria-modal="true" aria-label="Send an Email">
      <header class="send-email-modal__header">
        <div class="send-email-modal__title-wrap">
          <span class="send-email-modal__mail-icon" aria-hidden="true"></span>
          <h2 class="send-email-modal__title">Send an Email</h2>
        </div>
        <button class="send-email-modal__close" type="button" aria-label="Close send email modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="send-email-modal__body">
        <section class="send-email-modal__section">
          <div class="send-email-modal__candidate-strip">
            <button
              v-for="candidate in suggestedCandidates"
              :key="candidate.id"
              type="button"
              class="candidate-preview"
              :class="`candidate-preview--${candidate.accent}`"
              @click="addCandidate(candidate)"
            >
              <span class="candidate-preview__avatar"></span>
              <span class="candidate-preview__name">{{ candidate.name }}</span>
              <span class="candidate-preview__plus" @click.stop="addCandidate(candidate)">+</span>
            </button>
          </div>

          <button type="button" class="send-email-modal__see-more" @click="isChooseCandidatesOpen = true">
            See More
          </button>

          <div v-if="showCandidateMenu" class="send-email-modal__candidate-menu">
            <button
              v-for="candidate in availableCandidates"
              :key="candidate.id"
              type="button"
              class="send-email-modal__candidate-option"
              @click="addCandidate(candidate)"
            >
              <span class="send-email-modal__candidate-option-avatar"></span>
              <span>{{ candidate.name }}</span>
            </button>
          </div>

          <div class="send-email-modal__field">
            <label class="send-email-modal__label">Name</label>
            <div class="send-email-modal__candidate-input">
              <div class="send-email-modal__chips">
                <span
                  v-for="candidate in selectedCandidates"
                  :key="candidate.id"
                  class="send-email-modal__chip"
                >
                  <span class="send-email-modal__chip-avatar"></span>
                  <span>{{ candidate.name }}</span>
                  <button
                    type="button"
                    class="send-email-modal__chip-remove"
                    @click="removeCandidate(candidate.id)"
                  >
                    x
                  </button>
                </span>
              </div>
              <button type="button" class="send-email-modal__add-btn" @click="showCandidateMenu = !showCandidateMenu">
                Add
              </button>
            </div>
          </div>

          <div class="send-email-modal__field">
            <label class="send-email-modal__label">Saved Emails</label>
            <Dropdown v-model="savedEmail" :options="emailTemplates" placeholder="Custom Email" />
          </div>
        </section>

        <section class="send-email-modal__section">
          <label class="send-email-modal__label">Email</label>
          <div class="editor">
            <div class="editor__toolbar">
              <template v-for="(group, groupIndex) in toolbarGroups" :key="groupIndex">
                <div class="editor__group">
                  <button
                    v-for="item in group"
                    :key="item.id"
                    type="button"
                    class="editor__tool"
                    :class="{ 'editor__tool--active': isActive(item.id) }"
                    :title="item.label"
                    :aria-label="item.label"
                    @click="runToolbarAction(item.id)"
                  >
                    <component :is="item.icon" :size="16" :stroke-width="2" />
                  </button>
                </div>
                <span v-if="groupIndex < toolbarGroups.length - 1" class="editor__divider"></span>
              </template>
            </div>
            <EditorContent v-if="editor" :editor="editor" class="editor__input" />
          </div>
        </section>
      </div>

      <footer class="send-email-modal__footer">
        <button
          type="button"
          class="send-email-modal__send"
          :class="{ 'send-email-modal__send--disabled': !canSend }"
          :disabled="!canSend"
          @click="$emit('close')"
        >
          <span>Send Email</span>
          <span class="send-email-modal__send-caret"></span>
        </button>
      </footer>
    </section>

    <ChooseCandidatesModal
      :open="isChooseCandidatesOpen"
      :selected-candidates="selectedCandidates"
      :candidates="allCandidates"
      @close="isChooseCandidatesOpen = false"
      @toggle-candidate="toggleCandidate"
    />

    <FullscreenEmailEditor
      :open="isFullscreenOpen"
      v-model="editorContent"
      @close="isFullscreenOpen = false"
    />
  </div>
</template>

<style scoped>
.send-email-modal {
  position: fixed;
  inset: 0;
  z-index: 130;
  display: grid;
  place-items: center;
  padding: 20px;
}

.send-email-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(33, 24, 29, 0.42);
}

.send-email-modal__panel {
  position: relative;
  width: min(530px, calc(100vw - 28px));
  max-height: calc(100vh - 40px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 50px rgba(32, 19, 26, 0.24);
  overflow: auto;
}

.send-email-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid #f0e9ed;
}

.send-email-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.send-email-modal__mail-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  position: relative;
}

.send-email-modal__mail-icon::before {
  content: '';
  position: absolute;
  inset: 6px 5px;
  border: 2px solid #ffffff;
  border-radius: 4px;
}

.send-email-modal__mail-icon::after {
  content: '';
  position: absolute;
  left: 7px;
  right: 7px;
  top: 10px;
  height: 6px;
  border-left: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  border-right: 2px solid #ffffff;
  transform: skewY(-28deg);
}

.send-email-modal__title {
  margin: 0;
  color: #1c171b;
  font-size: 18px;
  font-weight: 600;
}

.send-email-modal__close {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: #f04f92;
  position: relative;
}

.send-email-modal__close span {
  position: absolute;
  top: 12px;
  left: 6px;
  width: 14px;
  height: 2px;
  background: #ffffff;
}

.send-email-modal__close span:first-child {
  transform: rotate(45deg);
}

.send-email-modal__close span:last-child {
  transform: rotate(-45deg);
}

.send-email-modal__body {
  padding: 18px 20px 10px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.send-email-modal__section {
  border: 1px solid #edf1f7;
  border-radius: 10px;
  padding: 12px 12px 14px;
}

.send-email-modal__candidate-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.candidate-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px 10px 8px;
  border: 1px solid #ebe5e8;
  border-radius: 999px;
  background: #ffffff;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.candidate-preview:hover {
  border-color: #ebd4df;
  box-shadow: 0 6px 12px rgba(47, 31, 39, 0.08);
}

.candidate-preview__avatar {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #dadada;
  flex: 0 0 auto;
}

.candidate-preview__name {
  flex: 1 1 auto;
  font-size: 12px;
}

.candidate-preview__plus {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid currentColor;
  display: grid;
  place-items: center;
  font-size: 13px;
  line-height: 1;
}

.candidate-preview--pink {
  color: #f04f92;
}

.candidate-preview--blue {
  color: #4a6cff;
}

.send-email-modal__see-more {
  display: block;
  margin: 12px auto 14px;
  color: #1c171b;
  font-size: 14px;
  text-decoration: underline;
}

.send-email-modal__candidate-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: -4px 0 14px;
  padding: 10px;
  border: 1px solid #ebe5e8;
  border-radius: 12px;
  background: #faf9fb;
}

.send-email-modal__candidate-option {
  min-height: 38px;
  padding: 0 10px;
  border-radius: 10px;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #494148;
  text-align: left;
}

.send-email-modal__candidate-option:hover {
  background: #fff3f8;
}

.send-email-modal__candidate-option-avatar {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #dedede;
}

.send-email-modal__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.send-email-modal__field + .send-email-modal__field {
  margin-top: 8px;
}

.send-email-modal__label {
  color: #1f171b;
  font-size: 14px;
}

.send-email-modal__candidate-input {
  min-height: 44px;
  border: 1px solid #ebe5e8;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 8px;
  background: #ffffff;
}

.send-email-modal__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.send-email-modal__chip {
  min-height: 28px;
  border-radius: 999px;
  background: #fff1f6;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #f04f92;
  font-size: 12px;
  padding-right: 6px;
}

.send-email-modal__chip-avatar {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: #dedede;
}

.send-email-modal__chip-remove {
  color: #f04f92;
  font-size: 12px;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
}

.send-email-modal__add-btn {
  min-width: 58px;
  height: 28px;
  border-radius: 12px;
  background: #fde8f0;
  color: #f04f92;
  font-size: 12px;
}

.editor {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
}

.editor__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #eaeaea;
}

.editor__group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor__divider {
  width: 1px;
  height: 20px;
  background: #e5e5e5;
}

.editor__tool {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
  background: transparent;
  color: #2a252a;
  display: inline-grid;
  place-items: center;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.editor__tool:hover {
  background: #f2f2f2;
  cursor: pointer;
}

.editor__tool--active {
  background: #fff0f6;
  color: #e34789;
  border-color: #f2c2d4;
  box-shadow: inset 0 0 0 1px rgba(227, 71, 137, 0.06);
}

.editor__input {
  min-height: 190px;
}

:deep(.editor__content) {
  min-height: 190px;
  padding: 16px 14px;
  outline: none;
  color: #4a4248;
  line-height: 1.5;
}

:deep(.editor__content p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: #c7bdc3;
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.editor__content p) {
  margin: 0 0 12px;
}

:deep(.editor__content ul),
:deep(.editor__content ol) {
  padding-left: 18px;
}

:deep(.editor__content blockquote) {
  margin: 0;
  padding-left: 12px;
  border-left: 3px solid #f2c2d4;
  color: #6a6167;
}

:deep(.editor__content pre) {
  background: #f7f7f7;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 12px;
  overflow: auto;
}

:deep(.editor__content img) {
  max-width: 100%;
  border-radius: 8px;
  display: block;
}

.send-email-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 20px 18px;
}

.send-email-modal__send {
  min-width: 110px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 10px 16px rgba(234, 79, 141, 0.18);
}

.send-email-modal__send:disabled,
.send-email-modal__send--disabled {
  background: #e7dfe3;
  color: #9d9499;
  box-shadow: none;
  cursor: not-allowed;
}

.send-email-modal__send-caret {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
  margin-top: -3px;
}

@media (max-width: 640px) {
  .send-email-modal {
    padding: 12px;
  }

  .send-email-modal__panel {
    width: 100%;
    max-height: calc(100vh - 24px);
  }

  .send-email-modal__body,
  .send-email-modal__footer {
    padding-left: 14px;
    padding-right: 14px;
  }

  .send-email-modal__candidate-strip {
    grid-template-columns: 1fr;
  }

  .send-email-modal__footer {
    padding-bottom: 14px;
  }
}
</style>
