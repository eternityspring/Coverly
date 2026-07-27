<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { shallowRef, watch, onBeforeUnmount, ref } from 'vue'

const props = defineProps<{ html: string; editable: boolean }>()
const emit = defineEmits<{
  (e: 'update', payload: { html: string; text: string }): void
  (e: 'blur'): void
}>()

const editor = shallowRef<Editor | null>(null)
const tick = ref(0) // bump to refresh toolbar active-states (Tiptap isActive isn't reactive)

watch(
  () => props.editable,
  (on) => {
    if (on && !editor.value) {
      editor.value = new Editor({
        content: props.html || '<p></p>',
        extensions: [StarterKit, TextStyle, Color],
        autofocus: 'end',
        onUpdate: ({ editor }) => emit('update', { html: editor.getHTML(), text: editor.getText() }),
        onSelectionUpdate: () => (tick.value += 1),
        onBlur: () => emit('blur'),
      })
    } else if (!on && editor.value) {
      editor.value.destroy()
      editor.value = null
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => editor.value?.destroy())

function run(fn: (c: any) => any) {
  if (editor.value) fn(editor.value.chain().focus()).run()
  tick.value += 1
}
function active(name: string) {
  void tick.value
  return editor.value?.isActive(name) || false
}
</script>

<template>
  <div class="tt-root">
    <div v-if="!editable" class="tt-view" v-html="html || '<p></p>'" />
    <template v-else>
      <editor-content class="tt-view" :editor="editor" />
      <Teleport to="body">
        <div class="tt-toolbar" @mousedown.prevent @pointerdown.stop>
          <button :class="{ on: active('bold') }" title="加粗" @click="run((c) => c.toggleBold())"><b>B</b></button>
          <button :class="{ on: active('italic') }" title="斜体" @click="run((c) => c.toggleItalic())"><i>I</i></button>
          <button :class="{ on: active('underline') }" title="下划线" @click="run((c) => c.toggleUnderline())"><u>U</u></button>
          <button :class="{ on: active('strike') }" title="删除线" @click="run((c) => c.toggleStrike())"><s>S</s></button>
          <span class="tt-sep" />
          <label class="tt-color" title="文字颜色">
            <span>A</span>
            <input type="color" @input="run((c) => c.setColor(($event.target as HTMLInputElement).value))" />
          </label>
        </div>
      </Teleport>
    </template>
  </div>
</template>
