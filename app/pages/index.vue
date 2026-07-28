<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'

const store = useEditorStore()
const templateStore = useTemplateStore()
const { user } = useUser()

function isTyping() {
  const a = document.activeElement as HTMLElement | null
  return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)
}

function onKey(e: KeyboardEvent) {
  if (isTyping()) return
  const meta = e.metaKey || e.ctrlKey
  const id = store.selectedId
  const k = e.key.toLowerCase()

  if (meta && k === 'z') {
    e.preventDefault()
    e.shiftKey ? store.redo() : store.undo()
    return
  }
  if (meta && k === 'y') {
    e.preventDefault()
    store.redo()
    return
  }
  if (meta && k === 'd') {
    e.preventDefault()
    if (id) store.duplicate(id)
    return
  }
  if (meta && k === 'c') {
    if (id) store.copyElement(id)
    return
  }
  if (meta && k === 'v') {
    e.preventDefault()
    store.pasteElement()
    return
  }
  if (meta && e.key === ']') {
    e.preventDefault()
    if (id) store.bringForward(id)
    return
  }
  if (meta && e.key === '[') {
    e.preventDefault()
    if (id) store.sendBackward(id)
    return
  }
  if (e.key === 'Escape') {
    store.deselectAll()
    return
  }
  if (id && (e.key === 'Delete' || e.key === 'Backspace')) {
    e.preventDefault()
    store.removeElement(id)
    return
  }
  if (id && e.key.startsWith('Arrow')) {
    e.preventDefault()
    const step = e.shiftKey ? 10 : 1
    if (!e.repeat) store.snapshot()
    const d: Record<string, [number, number]> = {
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
    }
    const [dx, dy] = d[e.key]
    store.nudge(id, dx, dy)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  templateStore.load()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// Signing in or out changes which templates are visible. Nothing waits on this —
// the picker already has the local ones.
watch(
  () => user.value?.id,
  (id, prev) => {
    if (id !== prev) templateStore.load()
  },
)
</script>

<template>
  <div class="editor">
    <TopBar />
    <div class="editor-body">
      <IconRail />
      <LeftPanel />
      <div class="center-col">
        <EditorStage />
        <BottomBar />
        <PagesBar />
      </div>
      <PropertiesPanel />
    </div>
    <TemplatePicker />
    <ContextMenu />
  </div>
</template>
