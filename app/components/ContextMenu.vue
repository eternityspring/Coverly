<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { ElementType, EditorElement } from '~/types/editor'

const store = useEditorStore()
const m = computed(() => store.menu)
// the menu targets an element, or empty canvas when targetId is null
const el = computed(() => (m.value.targetId ? store.selected : null))

const rootRef = ref<HTMLElement | null>(null)
const pos = ref({ x: 0, y: 0 })

// keep the menu inside the viewport
watch(m, async () => {
  if (!m.value.open) return
  pos.value = { x: m.value.x, y: m.value.y }
  await nextTick()
  const r = rootRef.value?.getBoundingClientRect()
  if (!r) return
  pos.value = {
    x: Math.max(8, Math.min(m.value.x, window.innerWidth - r.width - 8)),
    y: Math.max(8, Math.min(m.value.y, window.innerHeight - r.height - 8)),
  }
})

function run(fn: () => void) {
  fn()
  store.closeMenu()
}
function addHere(type: ElementType, partial: Partial<EditorElement> = {}) {
  store.dropElement(store.activeId, type, partial, m.value.at)
}

function onWinDown() {
  store.closeMenu()
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') store.closeMenu()
}
onMounted(() => {
  window.addEventListener('pointerdown', onWinDown)
  window.addEventListener('wheel', onWinDown, { passive: true })
  window.addEventListener('resize', onWinDown)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onWinDown)
  window.removeEventListener('wheel', onWinDown)
  window.removeEventListener('resize', onWinDown)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div
    v-if="m.open"
    ref="rootRef"
    class="ctx-menu"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    @pointerdown.stop
    @contextmenu.prevent
  >
    <!-- ---- right-clicked an element ---- -->
    <template v-if="el">
      <button class="ctx-item" @click="run(() => store.copyElement(el.id))">
        <Icon name="lucide:copy" /> 复制 <span class="ctx-key">⌘C</span>
      </button>
      <button class="ctx-item" @click="run(() => store.duplicate(el.id))">
        <Icon name="lucide:copy-plus" /> 创建副本 <span class="ctx-key">⌘D</span>
      </button>
      <button class="ctx-item" :disabled="!store.clipboard" @click="run(() => store.pasteElement())">
        <Icon name="lucide:clipboard" /> 粘贴 <span class="ctx-key">⌘V</span>
      </button>
      <div class="ctx-sep" />
      <button class="ctx-item" @click="run(() => store.bringToFront(el.id))">
        <Icon name="lucide:bring-to-front" /> 置顶
      </button>
      <button class="ctx-item" @click="run(() => store.bringForward(el.id))">
        <Icon name="lucide:arrow-up" /> 上移一层 <span class="ctx-key">⌘]</span>
      </button>
      <button class="ctx-item" @click="run(() => store.sendBackward(el.id))">
        <Icon name="lucide:arrow-down" /> 下移一层 <span class="ctx-key">⌘[</span>
      </button>
      <button class="ctx-item" @click="run(() => store.sendToBack(el.id))">
        <Icon name="lucide:send-to-back" /> 置底
      </button>
      <div class="ctx-sep" />
      <button class="ctx-item danger" @click="run(() => store.removeElement(el.id))">
        <Icon name="lucide:trash-2" /> 删除 <span class="ctx-key">⌫</span>
      </button>
    </template>

    <!-- ---- right-clicked empty canvas ---- -->
    <template v-else>
      <button class="ctx-item" :disabled="!store.clipboard" @click="run(() => store.pasteElement(m.at))">
        <Icon name="lucide:clipboard" /> 粘贴 <span class="ctx-key">⌘V</span>
      </button>
      <div class="ctx-sep" />
      <button class="ctx-item" @click="run(() => addHere('text', { text: '双击编辑文字', fontFamily: 'Noto Serif SC' }))">
        <Icon name="lucide:type" /> 在此添加文字
      </button>
      <button class="ctx-item" @click="run(() => addHere('rect'))">
        <Icon name="lucide:square" /> 在此添加矩形
      </button>
      <button class="ctx-item" @click="run(() => addHere('ellipse'))">
        <Icon name="lucide:circle" /> 在此添加圆形
      </button>
      <div class="ctx-sep" />
      <button class="ctx-item" @click="run(() => store.setTool('background'))">
        <Icon name="lucide:paint-bucket" /> 更换背景
      </button>
      <button class="ctx-item" @click="run(() => store.setTool('template'))">
        <Icon name="lucide:layout-template" /> 更换模板
      </button>
    </template>
  </div>
</template>
