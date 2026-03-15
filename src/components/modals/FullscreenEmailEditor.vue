<script setup>
import { onBeforeUnmount, watch } from 'vue'
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
} from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: '<p></p>',
  },
})

const emit = defineEmits(['close', 'update:modelValue'])

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
]

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
  content: props.modelValue,
  editorProps: {
    attributes: {
      class: 'fullscreen-editor__content',
      'data-placeholder': 'Write your email message here...',
    },
  },
  onUpdate: ({ editor: currentEditor }) => {
    emit('update:modelValue', currentEditor.getHTML())
  },
})

const isActive = (type) => {
  if (!editor.value) return false

  if (type === 'ordered') return editor.value.isActive('orderedList')
  if (type === 'bullet') return editor.value.isActive('bulletList')
  if (type === 'link') return editor.value.isActive('link')
  if (type === 'inlineCode') return editor.value.isActive('code')
  if (type === 'strike') return editor.value.isActive('strike')
  if (type === 'image' || type === 'palette') return false
  if (type === 'quote') return editor.value.isActive('blockquote')
  if (type === 'code') return editor.value.isActive('codeBlock')
  if (type === 'divider') return false

  return editor.value.isActive(type)
}

const runToolbarAction = (type) => {
  if (!editor.value) return

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
  () => props.modelValue,
  (value) => {
    if (!editor.value || editor.value.getHTML() === value) return
    editor.value.commands.setContent(value, false)
  },
)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen || !editor.value) return
    editor.value.commands.setContent(props.modelValue || '<p></p>', false)
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div v-if="open" class="fullscreen-editor">
    <button class="fullscreen-editor__overlay" aria-label="Close fullscreen editor" @click="$emit('close')"></button>

    <section class="fullscreen-editor__panel" role="dialog" aria-modal="true" aria-label="Fullscreen Email Editor">
      <div class="fullscreen-editor__toolbar">
        <template v-for="(group, groupIndex) in toolbarGroups" :key="groupIndex">
          <div class="fullscreen-editor__group">
            <button
              v-for="item in group"
              :key="item.id"
              type="button"
              class="fullscreen-editor__tool"
              :class="{ 'fullscreen-editor__tool--active': isActive(item.id) }"
              :title="item.label"
              :aria-label="item.label"
              @click="runToolbarAction(item.id)"
            >
              <component :is="item.icon" :size="16" :stroke-width="2" />
            </button>
          </div>
          <span v-if="groupIndex < toolbarGroups.length - 1" class="fullscreen-editor__divider"></span>
        </template>

        <button class="fullscreen-editor__close" type="button" aria-label="Close fullscreen editor" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </div>

      <div class="fullscreen-editor__body">
        <EditorContent v-if="editor" :editor="editor" class="fullscreen-editor__input" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.fullscreen-editor {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 20px;
}

.fullscreen-editor__overlay {
  position: absolute;
  inset: 0;
  background: rgba(33, 24, 29, 0.42);
}

.fullscreen-editor__panel {
  position: relative;
  width: 70vw;
  height: 80vh;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 28px 60px rgba(25, 18, 22, 0.28);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.fullscreen-editor__toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #eaeaea;
  background: #ffffff;
}

.fullscreen-editor__group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fullscreen-editor__divider {
  width: 1px;
  height: 20px;
  background: #e5e5e5;
}

.fullscreen-editor__tool {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
  background: transparent;
  color: #2a252a;
  display: inline-grid;
  place-items: center;
}

.fullscreen-editor__tool:hover {
  background: #f2f2f2;
}

.fullscreen-editor__tool--active {
  background: #fff0f6;
  color: #e34789;
  border-color: #f2c2d4;
}

.fullscreen-editor__close {
  margin-left: auto;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e5e5e5;
  background: #f7f7f7;
  position: relative;
}

.fullscreen-editor__close span {
  position: absolute;
  top: 15px;
  left: 8px;
  width: 14px;
  height: 1.5px;
  background: #2a252a;
}

.fullscreen-editor__close span:first-child {
  transform: rotate(45deg);
}

.fullscreen-editor__close span:last-child {
  transform: rotate(-45deg);
}

.fullscreen-editor__body {
  flex: 1 1 auto;
  overflow: auto;
}

.fullscreen-editor__input {
  min-height: 100%;
}

:deep(.fullscreen-editor__content) {
  min-height: 100%;
  padding: 16px 14px 28px;
  outline: none;
  color: #4a4248;
  line-height: 1.5;
}

:deep(.fullscreen-editor__content p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: #c7bdc3;
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.fullscreen-editor__content p) {
  margin: 0 0 12px;
}

:deep(.fullscreen-editor__content ul),
:deep(.fullscreen-editor__content ol) {
  padding-left: 18px;
}

:deep(.fullscreen-editor__content blockquote) {
  margin: 0;
  padding-left: 12px;
  border-left: 3px solid #f2c2d4;
  color: #6a6167;
}

:deep(.fullscreen-editor__content pre) {
  background: #f7f7f7;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 12px;
  overflow: auto;
}

:deep(.fullscreen-editor__content img) {
  max-width: 100%;
  border-radius: 8px;
  display: block;
}

@media (max-width: 900px) {
  .fullscreen-editor__panel {
    width: calc(100vw - 24px);
    height: calc(100vh - 24px);
  }
}
</style>
