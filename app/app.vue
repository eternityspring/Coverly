<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

const store = useEditorStore()

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
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
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
  </div>
</template>
