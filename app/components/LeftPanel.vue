<script setup lang="ts">
import type { ElementType, EditorElement } from '~/types/editor'

const store = useEditorStore()
const templateStore = useTemplateStore()

const TEXT_PRESETS = {
  heading: { text: '主标题', fontSize: 64, fontWeight: 900, height: 100, width: 480 },
  subheading: { text: '副标题', fontSize: 36, fontWeight: 600, height: 64, width: 420 },
  body: { text: '正文内容', fontSize: 22, fontWeight: 400, height: 44, width: 360 },
} as const
type TextPreset = keyof typeof TEXT_PRESETS

function textPartial(preset: TextPreset): Partial<EditorElement> {
  return { ...TEXT_PRESETS[preset], fontFamily: 'Noto Serif SC', textAlign: 'left' }
}
function addText(preset: TextPreset) {
  store.addElement('text', textPartial(preset))
}

// drag an item onto the canvas to drop it at a chosen spot (click still centers it)
function onDragItem(e: DragEvent, type: ElementType, partial: Partial<EditorElement> = {}) {
  e.dataTransfer?.setData('application/x-coverly', JSON.stringify({ type, partial }))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}

function onUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const src = reader.result as string
    const img = new Image()
    img.onload = () => {
      const ab = store.artboard
      const scale = Math.min((ab.width * 0.7) / img.width, (ab.height * 0.7) / img.height, 1)
      store.addElement('image', {
        src,
        width: Math.round(img.width * scale),
        height: Math.round(img.height * scale),
      })
    }
    img.src = src
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const SWATCHES = [
  '#ffffff', '#111827', '#0f172a', '#1e3a8a', '#047857', '#6d28d9',
  '#be123c', '#d87757', '#faf7f2', '#f1f5f9', '#fde68a', '#0ea5e9',
]
const GRADIENTS = [
  'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
  'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
  'linear-gradient(135deg, #3b0764 0%, #6d28d9 50%, #7c3aed 100%)',
  'linear-gradient(135deg, #881337 0%, #be123c 50%, #e11d48 100%)',
  'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fbd38d 100%)',
  'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)',
]
</script>

<template>
  <aside v-if="store.leftPanelOpen" class="left-panel">
    <div class="lp-tools">
    <!-- 模板 -->
    <template v-if="store.activeTool === 'template'">
      <h2 class="lp-title">模板</h2>
      <p class="lp-hint">点击应用到当前页</p>
      <div class="lp-tpl-grid">
        <button v-for="t in templateStore.all" :key="t.id" class="lp-tpl" @click="store.applyTemplate(t)">
          <PageThumb :page="t" :w="96" :h="62" />
          <span>{{ t.name }}</span>
        </button>
      </div>
    </template>

    <!-- 素材（形状） -->
    <template v-else-if="store.activeTool === 'asset'">
      <h2 class="lp-title">素材</h2>
      <p class="lp-hint">点击添加到画布中央，或拖到画布上指定位置</p>
      <div class="lp-shape-grid">
        <button class="lp-shape" draggable="true" @dragstart="onDragItem($event, 'rect')" @click="store.addElement('rect')">
          <Icon name="lucide:square" /><span>矩形</span>
        </button>
        <button class="lp-shape" draggable="true" @dragstart="onDragItem($event, 'ellipse')" @click="store.addElement('ellipse')">
          <Icon name="lucide:circle" /><span>圆形</span>
        </button>
        <button class="lp-shape" draggable="true" @dragstart="onDragItem($event, 'triangle')" @click="store.addElement('triangle')">
          <Icon name="lucide:triangle" /><span>三角</span>
        </button>
        <button class="lp-shape" draggable="true" @dragstart="onDragItem($event, 'divider')" @click="store.addElement('divider')">
          <Icon name="lucide:minus" /><span>分割线</span>
        </button>
      </div>
    </template>

    <!-- 文字 -->
    <template v-else-if="store.activeTool === 'text'">
      <h2 class="lp-title">文字</h2>
      <p class="lp-hint">点击添加到画布中央，或拖到画布上指定位置</p>
      <button
        v-for="p in (['heading', 'subheading', 'body'] as const)"
        :key="p"
        class="lp-text-btn"
        :class="{ 'lp-text-h1': p === 'heading', 'lp-text-h2': p === 'subheading' }"
        draggable="true"
        @dragstart="onDragItem($event, 'text', textPartial(p))"
        @click="addText(p)"
      >
        添加{{ p === 'heading' ? '主标题' : p === 'subheading' ? '副标题' : '正文' }}
      </button>
    </template>

    <!-- 图片 -->
    <template v-else-if="store.activeTool === 'image'">
      <h2 class="lp-title">图片</h2>
      <label class="lp-upload">
        <Icon name="lucide:upload" />
        <span>上传图片</span>
        <input type="file" accept="image/*" hidden @change="onUpload" />
      </label>
      <p class="lp-hint">支持 PNG / JPG。也可以直接把图片文件拖到画布上，落点即位置。</p>
    </template>

    <!-- 背景 -->
    <template v-else-if="store.activeTool === 'background'">
      <h2 class="lp-title">背景</h2>
      <p class="lp-sub">纯色</p>
      <div class="lp-swatches">
        <button v-for="c in SWATCHES" :key="c" class="lp-swatch" :style="{ background: c }" @click="store.setArtboard({ background: c })" />
      </div>
      <p class="lp-sub">渐变</p>
      <div class="lp-grad-grid">
        <button v-for="g in GRADIENTS" :key="g" class="lp-grad" :style="{ background: g }" @click="store.setArtboard({ background: g })" />
      </div>
      <p class="lp-sub">自定义</p>
      <input type="color" class="lp-color" :value="/^#/.test(store.artboard.background) ? store.artboard.background : '#ffffff'" @input="store.setArtboard({ background: ($event.target as HTMLInputElement).value })" />
    </template>
    </div>

    <div class="lp-layers"><LayersPanel /></div>
  </aside>
</template>
