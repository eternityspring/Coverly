<script setup lang="ts">
import { computed } from 'vue'
import type { Page } from '~/stores/editor'

const props = defineProps<{ page: Page }>()
const store = useEditorStore()

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

function bgDown() {
  store.setActivePage(props.page.id) // selects this page's artboard
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
      <div class="artboard-wrap" :style="wrapStyle" @pointerdown.self="bgDown">
        <div class="artboard" :style="boardStyle" @pointerdown.self="bgDown">
          <EditorElement v-for="el in page.elements" :key="el.id" :el="el" />
        </div>
      </div>
    </template>

    <div v-else class="flow-board" :style="flowBoardStyle" @pointerdown.self="bgDown">
      <FlowBlock v-for="el in page.elements" :key="el.id" :el="el" />
    </div>

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
