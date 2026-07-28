<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EditorElement } from '~/types/editor'

const props = defineProps<{ el: EditorElement }>()
const store = useEditorStore()

const editing = ref(false)
const reordering = ref(false)
const isSelected = computed(() => store.selectedId === props.el.id)

const blockStyle = computed(() => ({
  marginTop: (props.el.marginTop || 0) + 'px',
  opacity: props.el.opacity ?? 1,
}))
const textStyle = computed(() => {
  const deco = [props.el.underline && 'underline', props.el.strikethrough && 'line-through'].filter(Boolean).join(' ')
  return {
    color: props.el.color,
    fontSize: props.el.fontSize + 'px',
    fontFamily: props.el.fontFamily,
    fontWeight: props.el.fontWeight,
    fontStyle: props.el.fontStyle,
    textAlign: props.el.textAlign,
    lineHeight: String(props.el.lineHeight ?? 1.6),
    letterSpacing: (props.el.letterSpacing ?? 0) + 'px',
    textDecoration: deco || 'none',
    textShadow: props.el.shadow ? '2px 2px 6px rgba(0,0,0,0.35)' : 'none',
    background: props.el.textBg || 'transparent',
  }
})
const dividerStyle = computed(() => ({
  borderTopWidth: (props.el.borderWidth || 1) + 'px',
  borderTopColor: props.el.borderColor || 'rgba(0,0,0,0.12)',
}))

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)
}
function textToHtml(t: string) {
  return '<p>' + escapeHtml(t || '').replace(/\n/g, '<br>') + '</p>'
}
const contentHtml = computed(() => props.el.html || textToHtml(props.el.text ?? ''))
function onTtUpdate(p: { html: string; text: string }) {
  store.updateElement(props.el.id, { html: p.html, text: p.text })
}

function onDown(e: PointerEvent) {
  if (editing.value) return
  e.stopPropagation()
  store.select(props.el.id)
  if (e.button !== 0) return // right-click selects, then opens the menu
  // drag to reorder within the flow
  const board = (e.target as HTMLElement).closest('.flow-board') as HTMLElement | null
  if (!board) return
  const startY = e.clientY
  let dragging = false
  store.beginInteraction()
  const move = (ev: PointerEvent) => {
    if (!dragging) {
      if (Math.abs(ev.clientY - startY) < 6) return
      dragging = true
      reordering.value = true
    }
    const blocks = Array.from(board.querySelectorAll('.flow-block')) as HTMLElement[]
    let target = blocks.length - 1
    for (let i = 0; i < blocks.length; i++) {
      const r = blocks[i].getBoundingClientRect()
      if (ev.clientY < r.top + r.height / 2) {
        target = i
        break
      }
    }
    store.reorderTo(props.el.id, target)
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    reordering.value = false
    store.commitInteraction()
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}
function onContextMenu(e: MouseEvent) {
  store.openMenu(e.clientX, e.clientY, props.el.id)
}
function startEdit(e: MouseEvent) {
  if (editing.value) return
  e.stopPropagation()
  editing.value = true
  store.beginInteraction()
}
function endEdit() {
  if (!editing.value) return
  editing.value = false
  store.commitInteraction()
}
</script>

<template>
  <div
    class="flow-block"
    :class="{ selected: isSelected, dragging: reordering }"
    :style="blockStyle"
    @pointerdown="onDown"
    @contextmenu.prevent.stop="onContextMenu"
  >
    <TiptapText
      v-if="el.type === 'text'"
      class="flow-text"
      :class="{ editing }"
      :style="textStyle"
      :html="contentHtml"
      :editable="editing"
      @update="onTtUpdate"
      @blur="endEdit"
      @dblclick="startEdit"
    />
    <hr v-else-if="el.type === 'divider'" class="flow-divider" :style="dividerStyle" />
    <img v-else-if="el.type === 'image'" :src="el.src" class="flow-img" draggable="false" />
  </div>
</template>
