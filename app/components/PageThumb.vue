<script setup lang="ts">
import { computed } from 'vue'
import type { Page } from '~/stores/editor'

const props = defineProps<{ page: Page; w?: number; h?: number }>()
const W = computed(() => props.w ?? 104)
const H = computed(() => props.h ?? 68)
const isFlow = computed(() => props.page.artboard.layout === 'flow')
const scale = computed(() => {
  const ab = props.page.artboard
  return isFlow.value
    ? W.value / ab.width
    : Math.min(W.value / ab.width, H.value / ab.height)
})

const stageStyle = computed(() => {
  const ab = props.page.artboard
  if (isFlow.value) {
    return {
      position: 'absolute',
      top: '0',
      left: '0',
      width: ab.width + 'px',
      padding: (ab.padding ?? 44) + 'px',
      display: 'flex',
      flexDirection: 'column',
      gap: (ab.gap ?? 16) + 'px',
      transform: `scale(${scale.value})`,
      transformOrigin: 'top left',
    } as Record<string, string>
  }
  const sw = ab.width * scale.value
  const sh = ab.height * scale.value
  return {
    position: 'absolute',
    top: (H.value - sh) / 2 + 'px',
    left: (W.value - sw) / 2 + 'px',
    width: ab.width + 'px',
    height: ab.height + 'px',
    transform: `scale(${scale.value})`,
    transformOrigin: 'top left',
  } as Record<string, string>
})

function elStyle(el: any) {
  const base: Record<string, string> = {
    position: 'absolute',
    left: el.x + 'px',
    top: el.y + 'px',
    width: el.width + 'px',
    height: el.height + 'px',
  }
  if (el.rotation) base.transform = `rotate(${el.rotation}deg)`
  if (el.type === 'text') {
    return {
      ...base,
      color: el.color,
      fontSize: el.fontSize + 'px',
      fontFamily: el.fontFamily,
      fontWeight: el.fontWeight,
      textAlign: el.textAlign,
      lineHeight: String(el.lineHeight ?? 1.3),
      whiteSpace: 'pre-wrap',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      overflow: 'hidden',
    }
  }
  return {
    ...base,
    background: el.fill,
    border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : 'none',
    borderRadius: el.type === 'ellipse' ? '50%' : (el.radius || 0) + 'px',
  }
}
function flowText(el: any) {
  return {
    color: el.color,
    fontSize: el.fontSize + 'px',
    fontFamily: el.fontFamily,
    fontWeight: el.fontWeight,
    textAlign: el.textAlign,
    lineHeight: String(el.lineHeight ?? 1.6),
    whiteSpace: 'pre-wrap',
    width: '100%',
    overflow: 'hidden',
  } as Record<string, string>
}
</script>

<template>
  <div class="page-thumb" :style="{ width: W + 'px', height: H + 'px', background: page.artboard.background }">
    <div :style="stageStyle">
      <template v-if="isFlow">
        <template v-for="(el, i) in page.elements" :key="i">
          <div v-if="el.type === 'text'" :style="flowText(el)">{{ el.text }}</div>
          <hr
            v-else-if="el.type === 'divider'"
            :style="{ border: 0, borderTop: `${el.borderWidth || 1}px solid ${el.borderColor || '#ddd'}`, width: '100%', margin: '2px 0' }"
          />
        </template>
      </template>
      <template v-else>
        <div v-for="(el, i) in page.elements" :key="i" :style="elStyle(el)">
          <span v-if="el.type === 'text'" style="width: 100%">{{ el.text }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
