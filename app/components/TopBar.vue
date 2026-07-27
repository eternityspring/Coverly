<script setup lang="ts">
const store = useEditorStore()

function exportJSON() {
  const blob = new Blob([store.toJSON()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = (store.name || 'design').replace(/\s+/g, '-').toLowerCase() + '.json'
  a.click()
  URL.revokeObjectURL(a.href)
}
function importJSON(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => store.loadJSON(reader.result as string)
  reader.readAsText(file)
  input.value = ''
}
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <span class="logo"><Icon name="lucide:palette" /></span>
      <span>Mini&nbsp;Canva</span>
    </div>
    <input v-model="store.name" class="title-input" spellcheck="false" />

    <div class="spacer" />

    <div class="toolgroup">
      <button class="icon-btn" :disabled="!store.canUndo" title="Undo (⌘Z)" @click="store.undo()"><Icon name="lucide:undo-2" /></button>
      <button class="icon-btn" :disabled="!store.canRedo" title="Redo (⌘⇧Z)" @click="store.redo()"><Icon name="lucide:redo-2" /></button>
    </div>

    <div class="spacer" />

    <button class="btn" title="新增一页（选择模板）" @click="store.openPicker('add')"><Icon name="lucide:layout-template" /> 模板</button>
    <label class="btn" title="Import design JSON">
      <Icon name="lucide:upload" /> Import
      <input type="file" accept="application/json,.json" hidden @change="importJSON" />
    </label>
    <button class="btn primary" title="Export design JSON" @click="exportJSON"><Icon name="lucide:download" /> Export</button>
  </header>
</template>
