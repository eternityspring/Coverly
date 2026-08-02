<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Page } from '~/stores/editor'
import type { EditorElement, ElementType } from '~/types/editor'

const props = defineProps<{ page: Page }>()
const store = useEditorStore()

const boardRef = ref<HTMLElement | null>(null)
const dropping = ref(false)

const isFlow = computed(() => props.page.artboard.layout === 'flow')
const isActive = computed(() => props.page.id === store.activeId)

const wrapStyle = computed(() => ({
  width: props.page.artboard.width * store.zoom + 'px',
  height: props.page.artboard.height * store.zoom + 'px',
}))
const boardStyle = computed(() => ({
  width: props.page.artboard.width + 'px',
  height: props.page.artboard.height + 'px',
  transform: `scale(${store.zoom})`,
  background: props.page.artboard.background,
}))
const flowBoardStyle = computed(() => ({
  width: props.page.artboard.width + 'px',
  minHeight: (props.page.artboard.minHeight || 0) + 'px',
  padding: (props.page.artboard.padding ?? 44) + 'px',
  gap: (props.page.artboard.gap ?? 16) + 'px',
  background: props.page.artboard.background,
  zoom: String(store.zoom),
}))

// Rulers read the artboard's own coordinates. The tick step is chosen so labels
// stay ~60px apart on screen, which means it changes as you zoom.
const RULER = 20
const STEPS = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000]
const showRulers = computed(() => store.rulersOn && isActive.value && !isFlow.value)
const tickStep = computed(() => STEPS.find((s) => s * store.zoom >= 60) ?? STEPS[STEPS.length - 1])
const ticksX = computed(() => {
  const out: number[] = []
  for (let v = 0; v <= props.page.artboard.width; v += tickStep.value) out.push(v)
  return out
})
const ticksY = computed(() => {
  const out: number[] = []
  for (let v = 0; v <= props.page.artboard.height; v += tickStep.value) out.push(v)
  return out
})

function bgDown() {
  store.setActivePage(props.page.id) // selects this page's artboard
}

// ---- right-click on empty canvas ----
// artboard-local point (the board is scaled by zoom from its top-left corner)
function localPoint(e: MouseEvent | DragEvent) {
  const r = boardRef.value?.getBoundingClientRect()
  if (!r) return null
  return { x: (e.clientX - r.left) / store.zoom, y: (e.clientY - r.top) / store.zoom }
}
function onContextMenu(e: MouseEvent) {
  store.openMenu(e.clientX, e.clientY, null, props.page.id, isFlow.value ? null : localPoint(e))
}

// ---- drop: left-panel items (drag payload) or image files from the OS ----
function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  dropping.value = true
}
function onDragLeave(e: DragEvent) {
  if (e.target === e.currentTarget) dropping.value = false
}
function onDrop(e: DragEvent) {
  e.preventDefault()
  dropping.value = false
  const at = isFlow.value ? null : localPoint(e)
  const raw = e.dataTransfer?.getData('application/x-coverly')
  if (raw) {
    const item = JSON.parse(raw) as { type: ElementType; partial?: Partial<EditorElement> }
    store.dropElement(props.page.id, item.type, item.partial || {}, at)
    return
  }
  const file = Array.from(e.dataTransfer?.files || []).find((f) => f.type.startsWith('image/'))
  if (file) dropImage(file, at)
}
function dropImage(file: File, at: { x: number; y: number } | null) {
  const reader = new FileReader()
  reader.onload = () => {
    const src = reader.result as string
    const img = new Image()
    img.onload = () => {
      const ab = props.page.artboard
      const maxH = isFlow.value ? img.height : ab.height * 0.7
      const scale = Math.min((ab.width * 0.7) / img.width, maxH / img.height, 1)
      store.dropElement(
        props.page.id,
        'image',
        { src, width: Math.round(img.width * scale), height: Math.round(img.height * scale) },
        at,
      )
    }
    img.src = src
  }
  reader.readAsDataURL(file)
}

// ---- page (artboard) resize ----
// show handles when this page's artboard is selected
const showResize = computed(() => isActive.value && store.pageSelected)
const H = {
  e: { hx: 1, hy: 0 },
  w: { hx: -1, hy: 0 },
  s: { hx: 0, hy: 1 },
  n: { hx: 0, hy: -1 },
  se: { hx: 1, hy: 1 },
  sw: { hx: -1, hy: 1 },
  ne: { hx: 1, hy: -1 },
  nw: { hx: -1, hy: -1 },
} as const

function startPageResize(e: PointerEvent, h: { hx: number; hy: number }) {
  e.stopPropagation()
  store.setActivePage(props.page.id)
  store.beginInteraction()
  const sw = props.page.artboard.width
  const sh = props.page.artboard.height
  const mx = e.clientX
  const my = e.clientY
  const move = (ev: PointerEvent) => {
    const dx = (ev.clientX - mx) / store.zoom
    const dy = (ev.clientY - my) / store.zoom
    const patch: Record<string, number> = {}
    if (h.hx) patch.width = Math.max(60, Math.round(sw + h.hx * dx))
    if (h.hy && !isFlow.value) patch.height = Math.max(60, Math.round(sh + h.hy * dy))
    store.setArtboard(patch)
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    store.commitInteraction()
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}
</script>

<template>
  <div class="page-view" :class="{ active: isActive }">
    <template v-if="!isFlow">
      <div
        class="artboard-wrap"
        :class="{ dropping }"
        :style="wrapStyle"
        @pointerdown.self="bgDown"
        @contextmenu.prevent="onContextMenu"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <div ref="boardRef" class="artboard" :style="boardStyle" @pointerdown.self="bgDown">
          <EditorElement v-for="el in page.elements" :key="el.id" :el="el" />
          <!-- alignment guides: drawn inside the board so they share its
               coordinates, with the width counter-scaled to stay hairline -->
          <template v-if="isActive">
            <div
              v-for="(gx, i) in store.guides.v"
              :key="'gv' + i"
              class="guide guide-v"
              :style="{ left: gx + 'px', width: 1 / store.zoom + 'px' }"
            />
            <div
              v-for="(gy, i) in store.guides.h"
              :key="'gh' + i"
              class="guide guide-h"
              :style="{ top: gy + 'px', height: 1 / store.zoom + 'px' }"
            />
          </template>
        </div>
      </div>
    </template>

    <div
      v-else
      ref="boardRef"
      class="flow-board"
      :class="{ dropping }"
      :style="flowBoardStyle"
      @pointerdown.self="bgDown"
      @contextmenu.prevent="onContextMenu"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <FlowBlock v-for="el in page.elements" :key="el.id" :el="el" />
    </div>

    <!-- rulers, in artboard units (Shift+R) -->
    <template v-if="showRulers">
      <div class="ruler ruler-x">
        <span
          v-for="t in ticksX"
          :key="'rx' + t"
          class="ruler-tick"
          :style="{ left: t * store.zoom + 'px' }"
        >{{ t }}</span>
      </div>
      <div class="ruler ruler-y">
        <span
          v-for="t in ticksY"
          :key="'ry' + t"
          class="ruler-tick"
          :style="{ top: t * store.zoom + 'px' }"
        >{{ t }}</span>
      </div>
      <div class="ruler-corner" />
    </template>

    <!-- resize handles (drag to change page size) -->
    <template v-if="showResize">
      <div class="pg-sel" />
      <div class="pg-rs pg-rs-e" @pointerdown.stop="startPageResize($event, H.e)" />
      <div class="pg-rs pg-rs-w" @pointerdown.stop="startPageResize($event, H.w)" />
      <template v-if="!isFlow">
        <div class="pg-rs pg-rs-s" @pointerdown.stop="startPageResize($event, H.s)" />
        <div class="pg-rs pg-rs-n" @pointerdown.stop="startPageResize($event, H.n)" />
        <div class="pg-rs-c pg-rs-se" @pointerdown.stop="startPageResize($event, H.se)" />
        <div class="pg-rs-c pg-rs-sw" @pointerdown.stop="startPageResize($event, H.sw)" />
        <div class="pg-rs-c pg-rs-ne" @pointerdown.stop="startPageResize($event, H.ne)" />
        <div class="pg-rs-c pg-rs-nw" @pointerdown.stop="startPageResize($event, H.nw)" />
      </template>
    </template>

  </div>
</template>
