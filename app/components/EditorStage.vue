<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const store = useEditorStore()
const multi = computed(() => store.pages.length > 1)

/**
 * Rulers live on the canvas container, not on the page — they stay pinned to the
 * top and left edges while the page scrolls and zooms beneath them. Zero sits at
 * the active page's origin, so the numbers go negative to its left and above,
 * the way a drawing program's rulers do.
 */
const RULER = 20
const STEPS = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000]

const stageRef = ref<HTMLElement | null>(null)
// bumped whenever the geometry could have moved; the measurements read it so
// they recompute without watching the DOM itself
const bump = ref(0)
const box = ref({ w: 0, h: 0, originX: 0, originY: 0 })

function measure() {
  const stage = stageRef.value
  if (!stage) return
  const board = stage.querySelector('.page-view.active .artboard, .page-view.active .flow-board')
  const sr = stage.getBoundingClientRect()
  const br = board?.getBoundingClientRect()
  box.value = {
    w: sr.width,
    h: sr.height,
    originX: br ? br.left - sr.left : 0,
    originY: br ? br.top - sr.top : 0,
  }
}

const step = computed(() => STEPS.find((s) => s * store.zoom >= 60) ?? STEPS[STEPS.length - 1])

function ticks(span: number, origin: number) {
  void bump.value
  const s = step.value
  const z = store.zoom
  const first = Math.floor(-origin / z / s) * s
  const last = Math.ceil((span - origin) / z / s) * s
  const out: { v: number; at: number }[] = []
  // each ruler is inset by its own thickness to clear the corner block, so a
  // point measured against the stage sits RULER px earlier inside the ruler
  for (let v = first; v <= last; v += s) out.push({ v, at: origin + v * z - RULER })
  return out
}
const ticksX = computed(() => ticks(box.value.w, box.value.originX))
const ticksY = computed(() => ticks(box.value.h, box.value.originY))

const onGeometryChange = () => {
  bump.value++
  measure()
}

let ro: ResizeObserver | null = null
onMounted(() => {
  measure()
  stageRef.value?.addEventListener('scroll', onGeometryChange, { passive: true })
  window.addEventListener('resize', onGeometryChange)
  ro = new ResizeObserver(onGeometryChange)
  if (stageRef.value) ro.observe(stageRef.value)
})
onBeforeUnmount(() => {
  stageRef.value?.removeEventListener('scroll', onGeometryChange)
  window.removeEventListener('resize', onGeometryChange)
  ro?.disconnect()
})

// zoom, page switches and artboard resizes all move the origin
watch(
  () => [store.rulersOn, store.zoom, store.activeId, store.artboard.width, store.artboard.height, store.pages.length],
  () => nextTick(onGeometryChange),
)
</script>

<template>
  <div class="canvas-area" :class="{ rulers: store.rulersOn }">
    <div ref="stageRef" class="stage" :class="{ multi }" @pointerdown.self="store.deselectAll()">
      <PageView v-for="page in store.pages" :key="page.id" :page="page" />
    </div>

    <template v-if="store.rulersOn">
      <div class="ruler ruler-x">
        <span v-for="t in ticksX" :key="'x' + t.v" class="ruler-tick" :style="{ left: t.at + 'px' }">{{ t.v }}</span>
      </div>
      <div class="ruler ruler-y">
        <span v-for="t in ticksY" :key="'y' + t.v" class="ruler-tick" :style="{ top: t.at + 'px' }">{{ t.v }}</span>
      </div>
      <div class="ruler-corner" />
    </template>
  </div>
</template>
