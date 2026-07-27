<script setup lang="ts">
import { COVER_TEMPLATES } from '~/data/templates'

const store = useEditorStore()

function addText(preset: 'heading' | 'subheading' | 'body') {
  const map = {
    heading: { text: '主标题', fontSize: 64, fontWeight: 900, height: 100, width: 480 },
    subheading: { text: '副标题', fontSize: 36, fontWeight: 600, height: 64, width: 420 },
    body: { text: '正文内容', fontSize: 22, fontWeight: 400, height: 44, width: 360 },
  } as const
  store.addElement('text', { ...map[preset], fontFamily: 'Noto Serif SC', textAlign: 'left' })
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
        <button v-for="t in COVER_TEMPLATES" :key="t.id" class="lp-tpl" @click="store.applyTemplate(t)">
          <PageThumb :page="t" :w="96" :h="62" />
          <span>{{ t.name }}</span>
        </button>
      </div>
    </template>

    <!-- 素材（形状） -->
    <template v-else-if="store.activeTool === 'asset'">
      <h2 class="lp-title">素材</h2>
      <div class="lp-shape-grid">
        <button class="lp-shape" @click="store.addElement('rect')">
          <Icon name="lucide:square" /><span>矩形</span>
        </button>
        <button class="lp-shape" @click="store.addElement('ellipse')">
          <Icon name="lucide:circle" /><span>圆形</span>
        </button>
        <button class="lp-shape" @click="store.addElement('triangle')">
          <Icon name="lucide:triangle" /><span>三角</span>
        </button>
        <button class="lp-shape" @click="store.addElement('divider')">
          <Icon name="lucide:minus" /><span>分割线</span>
        </button>
      </div>
    </template>

    <!-- 文字 -->
    <template v-else-if="store.activeTool === 'text'">
      <h2 class="lp-title">文字</h2>
      <button class="lp-text-btn lp-text-h1" @click="addText('heading')">添加主标题</button>
      <button class="lp-text-btn lp-text-h2" @click="addText('subheading')">添加副标题</button>
      <button class="lp-text-btn" @click="addText('body')">添加正文</button>
    </template>

    <!-- 图片 -->
    <template v-else-if="store.activeTool === 'image'">
      <h2 class="lp-title">图片</h2>
      <label class="lp-upload">
        <Icon name="lucide:upload" />
        <span>上传图片</span>
        <input type="file" accept="image/*" hidden @change="onUpload" />
      </label>
      <p class="lp-hint">支持 PNG / JPG，拖入画布后可自由缩放。</p>
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
