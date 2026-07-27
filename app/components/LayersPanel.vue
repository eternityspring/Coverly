<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

const store = useEditorStore()
// front-most (last in array) shown on top of the list
const layers = computed(() => [...store.elements].reverse())

const ICON: Record<string, string> = {
  text: 'lucide:type',
  image: 'lucide:image',
  rect: 'lucide:square',
  ellipse: 'lucide:circle',
  triangle: 'lucide:triangle',
  divider: 'lucide:minus',
}
const TYPE_NAME: Record<string, string> = {
  image: '图片',
  rect: '矩形',
  ellipse: '圆形',
  triangle: '三角形',
  divider: '分割线',
}
function defaultName(el: any) {
  if (el.type === 'text') return (el.text || '').trim() || '文字'
  return TYPE_NAME[el.type] || '元素'
}
function displayName(el: any) {
  return el.name || defaultName(el)
}

// ---- inline rename ----
const editingId = ref<string | null>(null)
const draft = ref('')

function startRename(el: any) {
  editingId.value = el.id
  draft.value = el.name || defaultName(el)
  nextTick(() => {
    const input = document.querySelector('.l-name-input') as HTMLInputElement | null
    input?.focus()
    input?.select()
  })
}
function commitRename(el: any) {
  if (editingId.value !== el.id) return
  const v = draft.value.trim()
  store.snapshot()
  store.updateElement(el.id, { name: v || undefined }) // empty -> fall back to auto label
  editingId.value = null
}
function cancelRename() {
  editingId.value = null
}
</script>

<template>
  <div class="layers-panel">
    <div class="layers-head">图层</div>
    <div class="layers-list">
      <div
        v-for="el in layers"
        :key="el.id"
        class="layer-row"
        :class="{ active: store.selectedId === el.id }"
        @pointerdown="store.select(el.id)"
      >
        <span class="l-icon"><Icon :name="ICON[el.type]" /></span>
        <input
          v-if="editingId === el.id"
          v-model="draft"
          class="l-name-input"
          @pointerdown.stop
          @keydown.enter.prevent="commitRename(el)"
          @keydown.esc="cancelRename"
          @blur="commitRename(el)"
        />
        <span v-else class="l-name" title="双击重命名" @dblclick.stop="startRename(el)">{{ displayName(el) }}</span>
        <button class="l-del" title="删除" @pointerdown.stop @click.stop="store.removeElement(el.id)">
          <Icon name="lucide:trash-2" />
        </button>
      </div>
      <div v-if="!layers.length" class="layers-empty">当前页暂无元素</div>
    </div>
  </div>
</template>
