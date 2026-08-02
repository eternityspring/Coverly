<script setup lang="ts">
import { computed } from 'vue'

const store = useEditorStore()
const pct = computed(() => Math.round(store.zoom * 100) + '%')

const { fitToView } = useFitToView()

const STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3]
function onPick(e: Event) {
  const v = +(e.target as HTMLSelectElement).value
  if (v) store.setZoom(v)
}
</script>

<template>
  <div class="bottom-bar">
    <button v-if="store.pages.length > 1" class="bb-btn bb-danger" title="删除当前页" @click="store.removePage(store.activeId)">
      <Icon name="lucide:trash-2" />
    </button>
    <div v-if="store.pages.length > 1" class="bb-sep" />
    <div class="bb-zoom">
      <button class="bb-btn" title="缩小" @click="store.zoomOut()"><Icon name="lucide:minus" /></button>

      <select class="bb-pct" :value="''" @change="onPick">
        <option value="" disabled selected>{{ pct }}</option>
        <option v-for="s in STEPS" :key="s" :value="s">{{ Math.round(s * 100) }}%</option>
      </select>

      <button class="bb-btn" title="放大" @click="store.zoomIn()"><Icon name="lucide:plus" /></button>
      <div class="bb-sep" />
      <button class="bb-btn" title="当前页自适应铺满画布区域" @click="fitToView">
        <Icon name="lucide:scan" />
      </button>
      <button class="bb-btn bb-wide" title="实际大小" @click="store.setZoom(1)">100%</button>
    </div>
  </div>
</template>
