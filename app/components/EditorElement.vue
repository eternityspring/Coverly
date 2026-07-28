<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EditorElement } from '~/types/editor'

const props = defineProps<{ el: EditorElement }>()
const store = useEditorStore()

const wrapRef = ref<HTMLElement | null>(null)
const editing = ref(false)

const isSelected = computed(() => store.selectedId === props.el.id)

// Handles are drawn inside the zoom-scaled artboard, so counter-scale by zoom
// to keep them a constant size on screen.
const hsize = computed(() => 12 / store.zoom)
const outline = computed(() => 1.5 / store.zoom)
const rotOffset = computed(() => 26 / store.zoom)

const HANDLES = [
  { pos: 'nw', x: 0, y: 0, hx: -1, hy: -1, cursor: 'nwse-resize' },
  { pos: 'n', x: 0.5, y: 0, hx: 0, hy: -1, cursor: 'ns-resize' },
  { pos: 'ne', x: 1, y: 0, hx: 1, hy: -1, cursor: 'nesw-resize' },
  { pos: 'e', x: 1, y: 0.5, hx: 1, hy: 0, cursor: 'ew-resize' },
  { pos: 'se', x: 1, y: 1, hx: 1, hy: 1, cursor: 'nwse-resize' },
  { pos: 's', x: 0.5, y: 1, hx: 0, hy: 1, cursor: 'ns-resize' },
  { pos: 'sw', x: 0, y: 1, hx: -1, hy: 1, cursor: 'nesw-resize' },
  { pos: 'w', x: 0, y: 0.5, hx: -1, hy: 0, cursor: 'ew-resize' },
] as const

const wrapStyle = computed(() => ({
  left: props.el.x + 'px',
  top: props.el.y + 'px',
  width: props.el.width + 'px',
  height: props.el.height + 'px',
  transform: `rotate(${props.el.rotation}deg) scale(${props.el.flipH ? -1 : 1}, ${props.el.flipV ? -1 : 1})`,
  opacity: props.el.opacity,
}))

const border = computed(() =>
  props.el.borderWidth ? `${props.el.borderWidth}px solid ${props.el.borderColor}` : 'none',
)
const shapeStyle = computed(() => ({
  background: props.el.fill,
  border: border.value,
  borderRadius: props.el.type === 'ellipse' ? '50%' : props.el.radius + 'px',
}))
// a horizontal rule, vertically centred so it stays visible when the box is taller
const dividerStyle = computed(() => ({
  borderTop: `${props.el.borderWidth || 1}px solid ${props.el.borderColor}`,
}))
const imgStyle = computed(() => ({
  objectFit: props.el.objectFit || 'cover',
  borderRadius: props.el.radius + 'px',
  border: border.value,
}))
const textStyle = computed(() => {
  const a = props.el.textAlign || 'center'
  const deco = [props.el.underline && 'underline', props.el.strikethrough && 'line-through'].filter(Boolean).join(' ')
  return {
    color: props.el.color,
    fontSize: props.el.fontSize + 'px',
    fontFamily: props.el.fontFamily,
    fontWeight: props.el.fontWeight,
    fontStyle: props.el.fontStyle,
    lineHeight: String(props.el.lineHeight ?? 1.25),
    letterSpacing: (props.el.letterSpacing ?? 0) + 'px',
    textAlign: a,
    textDecoration: deco || 'none',
    textShadow: props.el.shadow ? '2px 2px 6px rgba(0,0,0,0.35)' : 'none',
    background: props.el.textBg || 'transparent',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: a === 'left' ? 'flex-start' : a === 'right' ? 'flex-end' : a === 'justify' ? 'stretch' : 'center',
    padding: '4px 6px',
  }
})

function handleStyle(h: (typeof HANDLES)[number]) {
  return {
    left: h.x * 100 + '%',
    top: h.y * 100 + '%',
    width: hsize.value + 'px',
    height: hsize.value + 'px',
    marginLeft: -hsize.value / 2 + 'px',
    marginTop: -hsize.value / 2 + 'px',
    cursor: h.cursor,
  }
}
const rotateStyle = computed(() => ({
  left: '50%',
  top: -rotOffset.value + 'px',
  width: hsize.value + 'px',
  height: hsize.value + 'px',
  marginLeft: -hsize.value / 2 + 'px',
  marginTop: -hsize.value / 2 + 'px',
}))
const rotateLineStyle = computed(() => ({
  left: '50%',
  top: -rotOffset.value + 'px',
  height: rotOffset.value + 'px',
  width: outline.value + 'px',
  marginLeft: -outline.value / 2 + 'px',
}))

// ---- rich text (Tiptap) ----
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

// ---- pointer interactions ----
function onBodyDown(e: PointerEvent) {
  if (editing.value) return
  e.stopPropagation()
  store.select(props.el.id)
  if (e.button !== 0) return // right-click selects, then opens the menu
  startDrag(e)
}

function onContextMenu(e: MouseEvent) {
  store.openMenu(e.clientX, e.clientY, props.el.id)
}

function startDrag(e: PointerEvent) {
  store.beginInteraction()
  const sx = props.el.x
  const sy = props.el.y
  const mx = e.clientX
  const my = e.clientY
  const move = (ev: PointerEvent) => {
    const dx = (ev.clientX - mx) / store.zoom
    const dy = (ev.clientY - my) / store.zoom
    store.updateElement(props.el.id, { x: Math.round(sx + dx), y: Math.round(sy + dy) })
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    store.commitInteraction()
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

function startResize(e: PointerEvent, h: (typeof HANDLES)[number]) {
  e.stopPropagation()
  store.beginInteraction()
  const rad = (props.el.rotation * Math.PI) / 180
  const ux = [Math.cos(rad), Math.sin(rad)]
  const uy = [-Math.sin(rad), Math.cos(rad)]
  const s = {
    cx: props.el.x + props.el.width / 2,
    cy: props.el.y + props.el.height / 2,
    w: props.el.width,
    h: props.el.height,
    mx: e.clientX,
    my: e.clientY,
  }
  const MIN = 12
  const move = (ev: PointerEvent) => {
    const dx = (ev.clientX - s.mx) / store.zoom
    const dy = (ev.clientY - s.my) / store.zoom
    // project pointer delta onto the element's local axes
    const ldx = dx * ux[0] + dy * ux[1]
    const ldy = dx * uy[0] + dy * uy[1]
    const nw = Math.max(MIN, s.w + h.hx * ldx)
    const nh = Math.max(MIN, s.h + h.hy * ldy)
    // keep the opposite edge/corner fixed in world space
    const aLX = (-h.hx * s.w) / 2
    const aLY = (-h.hy * s.h) / 2
    const ax = s.cx + aLX * ux[0] + aLY * uy[0]
    const ay = s.cy + aLX * ux[1] + aLY * uy[1]
    const nLX = (-h.hx * nw) / 2
    const nLY = (-h.hy * nh) / 2
    const cx = ax - nLX * ux[0] - nLY * uy[0]
    const cy = ay - nLX * ux[1] - nLY * uy[1]
    store.updateElement(props.el.id, {
      width: Math.round(nw),
      height: Math.round(nh),
      x: Math.round(cx - nw / 2),
      y: Math.round(cy - nh / 2),
    })
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    store.commitInteraction()
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

function startRotate(e: PointerEvent) {
  e.stopPropagation()
  store.beginInteraction()
  const rect = wrapRef.value!.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const move = (ev: PointerEvent) => {
    let ang = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90
    if (ev.shiftKey) ang = Math.round(ang / 15) * 15
    store.updateElement(props.el.id, { rotation: Math.round(((ang % 360) + 360) % 360) })
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    store.commitInteraction()
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

// ---- text editing ----
function onTextDown(e: PointerEvent) {
  if (editing.value) e.stopPropagation()
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
    ref="wrapRef"
    class="el-wrap"
    :style="wrapStyle"
    @pointerdown="onBodyDown"
    @contextmenu.prevent.stop="onContextMenu"
  >
    <!-- content -->
    <div v-if="el.type === 'rect'" class="el-content" :style="shapeStyle" />
    <div v-else-if="el.type === 'ellipse'" class="el-content" :style="shapeStyle" />
    <div
      v-else-if="el.type === 'triangle'"
      class="el-content"
      :style="{ background: el.fill, clipPath: 'polygon(50% 0,100% 100%,0 100%)' }"
    />
    <div v-else-if="el.type === 'divider'" class="el-content el-divider">
      <i :style="dividerStyle" />
    </div>
    <img
      v-else-if="el.type === 'image'"
      class="el-content el-img"
      :src="el.src"
      :style="imgStyle"
      draggable="false"
    />
    <TiptapText
      v-else-if="el.type === 'text'"
      class="el-content el-text"
      :class="{ editing }"
      :style="textStyle"
      :html="contentHtml"
      :editable="editing"
      @update="onTtUpdate"
      @blur="endEdit"
      @dblclick="startEdit"
      @pointerdown="onTextDown"
    />

    <!-- hover ring (when not selected) -->
    <div v-if="!isSelected" class="hover-ring" />

    <!-- selection chrome -->
    <template v-if="isSelected">
      <div class="sel-outline" :style="{ outlineWidth: outline + 'px' }" />
      <div class="rotate-line" :style="rotateLineStyle" />
      <div
        class="handle rotate"
        :style="rotateStyle"
        title="Drag to rotate (hold Shift to snap)"
        @pointerdown="startRotate"
      />
      <div
        v-for="h in HANDLES"
        :key="h.pos"
        class="handle"
        :style="handleStyle(h)"
        @pointerdown="(e) => startResize(e, h)"
      />
    </template>
  </div>
</template>
