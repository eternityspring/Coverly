<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EditorElement } from '~/types/editor'
import { FONTS, FONT_GROUPS } from '~/data/fonts'
import { ensureFont, ensureAllFonts } from '~/utils/fontLoader'

const store = useEditorStore()
const shortcutsOpen = ref(false)
const REPO_URL = 'https://github.com/eternityspring/Coverly'
const el = computed(() => store.selected)
const isShape = computed(() => ['rect', 'ellipse', 'triangle'].includes(el.value?.type || ''))
const isFlow = computed(() => store.artboard.layout === 'flow')

// Grouped so the picker can show 中文 / 书法 / 西文 / 系统 separately.
const fontsByGroup = computed(() =>
  FONT_GROUPS.map((g) => ({ group: g, items: FONTS.filter((f) => f.group === g) })),
)

function pickFont(family: string) {
  ensureFont(family) // fetch it before it is applied, so the swap is immediate
  begin()
  set({ fontFamily: family })
  commit()
}
const WEIGHTS = [
  { v: 400, label: '常规' },
  { v: 500, label: '中等' },
  { v: 600, label: '半粗' },
  { v: 700, label: '加粗' },
  { v: 900, label: '特粗' },
]
// Panel heading for a non-text element — otherwise it shows the raw type name.
const TYPE_NAME: Record<string, string> = {
  text: '文字编辑',
  rect: '矩形',
  ellipse: '圆形',
  triangle: '三角形',
  image: '图片',
  divider: '分割线',
}
const SWATCHES = [
  '#111827', '#ffffff', '#e74c6f', '#f59e0b', '#22c55e', '#06b6d4',
  '#6c5ce7', '#8b7bf0', '#ec4899', '#0f172a', '#64748b', '#fde047',
]
// One click applies the size — the icon is drawn at the preset's real aspect ratio.
const PRESETS = [
  { ratio: '1:1', name: '方图', w: 1080, h: 1080 },
  { ratio: '3:4', name: '小红书', w: 1080, h: 1440 },
  { ratio: '9:16', name: '故事', w: 1080, h: 1920 },
  { ratio: '16:9', name: '横版', w: 1280, h: 720 },
  { ratio: '2.35:1', name: '公众号', w: 1200, h: 510 },
  { ratio: '5:2', name: 'X 文章', w: 1200, h: 480 },
]

// interaction helpers -> grouped into single undo steps
function set(patch: Partial<EditorElement>) {
  if (el.value) store.updateElement(el.value.id, patch)
}
const begin = () => store.beginInteraction()
const commit = () => store.commitInteraction()
function setOnce(patch: Partial<EditorElement>) {
  begin()
  set(patch)
  commit()
}
function num(e: Event) {
  return +(e.target as HTMLInputElement).value
}

type Preset = (typeof PRESETS)[number]

// A flow card's height is driven by its content, so `height` is never read when
// rendering one. Its width, on the other hand, is the width the template was
// designed at — type sizes are tuned to it — so a preset must not overwrite it.
// In flow a preset therefore only re-shapes the starting height, applying its
// ratio to the width already in place; the card still grows past it.
const flowMinHeight = (p: Preset) => Math.round((store.artboard.width * p.h) / p.w)

const isPreset = (p: Preset) => {
  if (!isFlow.value) return store.artboard.width === p.w && store.artboard.height === p.h
  const min = store.artboard.minHeight ?? 0
  return min > 0 && Math.abs(min / store.artboard.width - p.h / p.w) < 0.01
}

function applyPreset(p: Preset) {
  store.snapshot()
  store.setArtboard(isFlow.value ? { minHeight: flowMinHeight(p) } : { width: p.w, height: p.h })
  store.zoomToFit()
}
const presetTitle = (p: Preset) =>
  isFlow.value
    ? `${p.name} · ${store.artboard.width}×${flowMinHeight(p)} 起`
    : `${p.name} · ${p.w}×${p.h}`
// draw the swatch at the preset's true aspect ratio inside a fixed box
function ratioStyle(p: Preset) {
  const box = 34
  const s = Math.min(box / p.w, box / p.h)
  return { width: Math.round(p.w * s) + 'px', height: Math.round(p.h * s) + 'px' }
}
</script>

<template>
  <aside v-if="store.rightPanelOpen" class="props">
    <!-- ============ element selected ============ -->
    <template v-if="el">
      <div class="props-head">
        <h2>{{ TYPE_NAME[el.type] || '元素' }}</h2>
        <div style="display: flex; gap: 6px">
          <button class="icon-btn" title="复制 (⌘D)" @click="store.duplicate(el.id)"><Icon name="lucide:copy" /></button>
          <button class="icon-btn" title="删除 (⌫)" @click="store.removeElement(el.id)"><Icon name="lucide:trash-2" /></button>
          <button class="icon-btn props-close" title="收起面板" @click="store.rightPanelOpen = false">
            <Icon name="lucide:chevrons-right" />
          </button>
        </div>
      </div>

      <!-- ============ TEXT — chuangkit-style ============ -->
      <template v-if="el.type === 'text'">
        <!-- 基础调整 -->
        <div class="section">
          <div class="field">
            <label>字体</label>
            <!-- opening the list loads every catalogue font, so each row can preview
                 itself — only the slices covering these few characters get fetched -->
            <select
              :value="el.fontFamily"
              @focus="ensureAllFonts()"
              @change="pickFont(($event.target as HTMLSelectElement).value)"
            >
              <optgroup v-for="g in fontsByGroup" :key="g.group" :label="g.group">
                <option v-for="f in g.items" :key="f.family" :value="f.family" :style="{ fontFamily: f.family }">
                  {{ f.label }}
                </option>
              </optgroup>
            </select>
          </div>
          <div class="field-row">
            <div class="field">
              <label>字号</label>
              <input type="number" :value="el.fontSize" @focus="begin" @blur="commit" @input="set({ fontSize: Math.max(1, num($event)) })" />
            </div>
            <div class="field">
              <label>字重</label>
              <select :value="el.fontWeight" @focus="begin" @change="set({ fontWeight: +($event.target as HTMLSelectElement).value }); commit()">
                <option v-for="w in WEIGHTS" :key="w.v" :value="w.v">{{ w.label }}</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label>样式</label>
            <div class="seg">
              <button :class="{ active: (el.fontWeight || 400) >= 600 }" title="加粗" @click="setOnce({ fontWeight: (el.fontWeight || 400) >= 600 ? 400 : 700 })"><Icon name="lucide:bold" /></button>
              <button :class="{ active: el.fontStyle === 'italic' }" title="斜体" @click="setOnce({ fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' })"><Icon name="lucide:italic" /></button>
              <button :class="{ active: el.underline }" title="下划线" @click="setOnce({ underline: !el.underline })"><Icon name="lucide:underline" /></button>
              <button :class="{ active: el.strikethrough }" title="删除线" @click="setOnce({ strikethrough: !el.strikethrough })"><Icon name="lucide:strikethrough" /></button>
            </div>
          </div>
          <div class="field">
            <label>对齐</label>
            <div class="seg">
              <button :class="{ active: el.textAlign === 'left' }" @click="setOnce({ textAlign: 'left' })"><Icon name="lucide:align-left" /></button>
              <button :class="{ active: el.textAlign === 'center' }" @click="setOnce({ textAlign: 'center' })"><Icon name="lucide:align-center" /></button>
              <button :class="{ active: el.textAlign === 'right' }" @click="setOnce({ textAlign: 'right' })"><Icon name="lucide:align-right" /></button>
              <button :class="{ active: el.textAlign === 'justify' }" @click="setOnce({ textAlign: 'justify' })"><Icon name="lucide:align-justify" /></button>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>行高</label>
              <input type="number" step="0.05" :value="el.lineHeight" @focus="begin" @blur="commit" @input="set({ lineHeight: num($event) })" />
            </div>
            <div class="field">
              <label>字间距</label>
              <input type="number" :value="el.letterSpacing || 0" @focus="begin" @blur="commit" @input="set({ letterSpacing: num($event) })" />
            </div>
          </div>
          <div class="field">
            <label>颜色</label>
            <div class="color-row">
              <input type="color" :value="el.color" @focus="begin" @change="commit" @input="set({ color: ($event.target as HTMLInputElement).value })" />
              <input class="hex" type="text" :value="el.color" @focus="begin" @blur="commit" @input="set({ color: ($event.target as HTMLInputElement).value })" />
            </div>
            <div class="swatches">
              <span v-for="c in SWATCHES" :key="c" class="swatch" :style="{ background: c }" @click="setOnce({ color: c })" />
            </div>
          </div>
          <div class="field">
            <label>文字内容</label>
            <textarea :value="el.text" @focus="begin" @blur="commit" @input="set({ text: ($event.target as HTMLTextAreaElement).value })" />
          </div>
        </div>

        <!-- 特效 -->
        <div class="section">
          <h3>特效</h3>
          <label class="toggle-row">
            <span>投影</span>
            <input type="checkbox" :checked="el.shadow" @change="setOnce({ shadow: ($event.target as HTMLInputElement).checked })" />
          </label>
          <div class="field">
            <label>文字背景</label>
            <div class="color-row">
              <input type="color" :value="/^#/.test(el.textBg || '') ? el.textBg : '#ffffff'" @focus="begin" @change="commit" @input="set({ textBg: ($event.target as HTMLInputElement).value })" />
              <button class="mini-btn" @click="setOnce({ textBg: '' })">清除</button>
            </div>
          </div>
          <div class="effect-row disabled">变形 <span class="tag">即将支持</span></div>
          <div class="effect-row disabled">动画 <span class="tag">即将支持</span></div>
        </div>

        <!-- 图层编辑 -->
        <div class="section">
          <h3>图层编辑</h3>
          <div class="field">
            <label>透明度 · {{ Math.round(el.opacity * 100) }}%</label>
            <input type="range" min="0" max="1" step="0.01" :value="el.opacity" @pointerdown="begin" @input="set({ opacity: num($event) })" @change="commit" />
          </div>
          <div class="seg">
            <button v-if="!isFlow" :class="{ active: el.flipH }" title="水平翻转" @click="setOnce({ flipH: !el.flipH })"><Icon name="lucide:flip-horizontal-2" /></button>
            <button v-if="!isFlow" :class="{ active: el.flipV }" title="垂直翻转" @click="setOnce({ flipV: !el.flipV })"><Icon name="lucide:flip-vertical-2" /></button>
            <button title="复制" @click="store.duplicate(el.id)"><Icon name="lucide:copy" /></button>
            <button title="删除" @click="store.removeElement(el.id)"><Icon name="lucide:trash-2" /></button>
          </div>
        </div>

        <!-- 图层顺序 -->
        <div class="section">
          <h3>图层顺序</h3>
          <div class="grid-btns">
            <button class="mini-btn" @click="store.bringToFront(el.id)"><Icon name="lucide:bring-to-front" /> 置顶</button>
            <button class="mini-btn" @click="store.sendToBack(el.id)"><Icon name="lucide:send-to-back" /> 置底</button>
            <button class="mini-btn" @click="store.bringForward(el.id)"><Icon name="lucide:arrow-up" /> 上移</button>
            <button class="mini-btn" @click="store.sendBackward(el.id)"><Icon name="lucide:arrow-down" /> 下移</button>
          </div>
        </div>

        <!-- 页面对齐 (free only) -->
        <div v-if="!isFlow" class="section">
          <h3>页面对齐</h3>
          <div class="seg">
            <button title="左对齐" @click="store.alignToPage(el.id, 'left')"><Icon name="lucide:align-start-vertical" /></button>
            <button title="水平居中" @click="store.alignToPage(el.id, 'centerH')"><Icon name="lucide:align-center-vertical" /></button>
            <button title="右对齐" @click="store.alignToPage(el.id, 'right')"><Icon name="lucide:align-end-vertical" /></button>
            <button title="顶对齐" @click="store.alignToPage(el.id, 'top')"><Icon name="lucide:align-start-horizontal" /></button>
            <button title="垂直居中" @click="store.alignToPage(el.id, 'centerV')"><Icon name="lucide:align-center-horizontal" /></button>
            <button title="底对齐" @click="store.alignToPage(el.id, 'bottom')"><Icon name="lucide:align-end-horizontal" /></button>
          </div>
        </div>
      </template>

      <!-- ============ SHAPE / IMAGE ============ -->
      <template v-else>
        <div class="section">
          <h3>图层顺序</h3>
          <div class="grid-btns">
            <button class="mini-btn" @click="store.bringToFront(el.id)"><Icon name="lucide:bring-to-front" /> 置顶</button>
            <button class="mini-btn" @click="store.sendToBack(el.id)"><Icon name="lucide:send-to-back" /> 置底</button>
            <button class="mini-btn" @click="store.bringForward(el.id)"><Icon name="lucide:arrow-up" /> 上移</button>
            <button class="mini-btn" @click="store.sendBackward(el.id)"><Icon name="lucide:arrow-down" /> 下移</button>
          </div>
        </div>

        <div v-if="el.type === 'divider'" class="section">
          <h3>分割线</h3>
          <div class="field">
            <label>颜色</label>
            <div class="color-row">
              <input type="color" :value="/^#/.test(el.borderColor || '') ? el.borderColor : '#111827'" @focus="begin" @change="commit" @input="set({ borderColor: ($event.target as HTMLInputElement).value })" />
              <input class="hex" type="text" :value="el.borderColor" @focus="begin" @blur="commit" @input="set({ borderColor: ($event.target as HTMLInputElement).value })" />
            </div>
            <div class="swatches">
              <span v-for="c in SWATCHES" :key="c" class="swatch" :style="{ background: c }" @click="setOnce({ borderColor: c })" />
            </div>
          </div>
          <div class="field">
            <label>粗细</label>
            <input type="number" min="1" :value="el.borderWidth" @focus="begin" @blur="commit" @input="set({ borderWidth: Math.max(1, num($event)) })" />
          </div>
        </div>

        <div v-if="!isFlow" class="section">
          <h3>位置与尺寸</h3>
          <div class="field-row">
            <div class="field">
              <label>X</label>
              <input type="number" :value="Math.round(el.x)" @focus="begin" @blur="commit" @input="set({ x: num($event) })" />
            </div>
            <div class="field">
              <label>Y</label>
              <input type="number" :value="Math.round(el.y)" @focus="begin" @blur="commit" @input="set({ y: num($event) })" />
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>W</label>
              <input type="number" :value="Math.round(el.width)" @focus="begin" @blur="commit" @input="set({ width: Math.max(1, num($event)) })" />
            </div>
            <div class="field">
              <label>H</label>
              <input type="number" :value="Math.round(el.height)" @focus="begin" @blur="commit" @input="set({ height: Math.max(1, num($event)) })" />
            </div>
            <div class="field">
              <label>旋转</label>
              <input type="number" :value="Math.round(el.rotation)" @focus="begin" @blur="commit" @input="set({ rotation: num($event) })" />
            </div>
          </div>
          <div class="field">
            <label>透明度 · {{ Math.round(el.opacity * 100) }}%</label>
            <input type="range" min="0" max="1" step="0.01" :value="el.opacity" @pointerdown="begin" @input="set({ opacity: num($event) })" @change="commit" />
          </div>
          <div class="field">
            <label>页面对齐</label>
            <div class="seg">
              <button title="左对齐" @click="store.alignToPage(el.id, 'left')"><Icon name="lucide:align-start-vertical" /></button>
              <button title="水平居中" @click="store.alignToPage(el.id, 'centerH')"><Icon name="lucide:align-center-vertical" /></button>
              <button title="右对齐" @click="store.alignToPage(el.id, 'right')"><Icon name="lucide:align-end-vertical" /></button>
              <button title="顶对齐" @click="store.alignToPage(el.id, 'top')"><Icon name="lucide:align-start-horizontal" /></button>
              <button title="垂直居中" @click="store.alignToPage(el.id, 'centerV')"><Icon name="lucide:align-center-horizontal" /></button>
              <button title="底对齐" @click="store.alignToPage(el.id, 'bottom')"><Icon name="lucide:align-end-horizontal" /></button>
            </div>
          </div>
        </div>

        <div v-if="isShape" class="section">
          <h3>填充</h3>
          <div class="color-row">
            <input type="color" :value="el.fill" @focus="begin" @change="commit" @input="set({ fill: ($event.target as HTMLInputElement).value })" />
            <input class="hex" type="text" :value="el.fill" @focus="begin" @blur="commit" @input="set({ fill: ($event.target as HTMLInputElement).value })" />
          </div>
          <div class="swatches">
            <span v-for="c in SWATCHES" :key="c" class="swatch" :style="{ background: c }" @click="setOnce({ fill: c })" />
          </div>
        </div>

        <div v-if="el.type === 'image'" class="section">
          <h3>图片</h3>
          <div class="field">
            <label>填充方式</label>
            <select :value="el.objectFit" @focus="begin" @change="set({ objectFit: ($event.target as HTMLSelectElement).value as any }); commit()">
              <option value="cover">裁剪填满</option>
              <option value="contain">完整显示</option>
              <option value="fill">拉伸变形</option>
            </select>
          </div>
        </div>

        <div v-if="isShape || el.type === 'image'" class="section">
          <h3>描边与圆角</h3>
          <div class="field-row">
            <div class="field">
              <label>描边粗细</label>
              <input type="number" min="0" :value="el.borderWidth" @focus="begin" @blur="commit" @input="set({ borderWidth: Math.max(0, num($event)) })" />
            </div>
            <div class="field" style="max-width: 56px">
              <label>颜色</label>
              <input type="color" :value="el.borderColor" @focus="begin" @change="commit" @input="set({ borderColor: ($event.target as HTMLInputElement).value })" />
            </div>
          </div>
          <div v-if="el.type !== 'ellipse'" class="field">
            <label>圆角 · {{ el.radius }}px</label>
            <input type="range" min="0" max="200" step="1" :value="el.radius" @pointerdown="begin" @input="set({ radius: num($event) })" @change="commit" />
          </div>
        </div>
      </template>
    </template>

    <!-- ============ nothing selected: artboard ============ -->
    <template v-else>
      <div class="props-head">
        <h2>画布</h2>
        <button class="icon-btn props-close" title="收起面板" @click="store.rightPanelOpen = false">
          <Icon name="lucide:chevrons-right" />
        </button>
      </div>
      <div class="section">
        <h3>布局模式</h3>
        <div class="layout-badge" :class="store.artboard.layout === 'flow' ? 'is-flow' : 'is-free'">
          <Icon :name="store.artboard.layout === 'flow' ? 'lucide:rows-3' : 'lucide:move'" />
          {{ store.artboard.layout === 'flow' ? '流式布局' : '自由布局（绝对定位）' }}
        </div>
        <p class="layout-desc">
          {{ store.artboard.layout === 'flow' ? '内容垂直堆叠，高度随内容自适应。' : '元素绝对定位，可任意拖拽、缩放、旋转。' }}
        </p>
      </div>
      <div class="section">
        <h3>画布尺寸</h3>
        <div class="ratio-grid">
          <button
            v-for="p in PRESETS"
            :key="p.ratio"
            class="ratio"
            :class="{ active: isPreset(p) }"
            :title="presetTitle(p)"
            @click="applyPreset(p)"
          >
            <span class="ratio-box"><i :style="ratioStyle(p)" /></span>
            <span class="ratio-ratio">{{ p.ratio }}</span>
            <span class="ratio-name">{{ p.name }}</span>
          </button>
        </div>
        <p v-if="isFlow" class="layout-desc">宽度保持模板的设计宽度不变，比例只决定起始高度，内容多了继续往下长。</p>
        <div class="field-row">
          <div class="field">
            <label>宽度</label>
            <input type="number" :value="store.artboard.width" @input="store.setArtboard({ width: Math.max(1, num($event)) })" />
          </div>
          <div class="field">
            <label>{{ isFlow ? '最小高度' : '高度' }}</label>
            <input
              v-if="isFlow"
              type="number"
              :value="store.artboard.minHeight ?? 0"
              @input="store.setArtboard({ minHeight: Math.max(0, num($event)) })"
            />
            <input v-else type="number" :value="store.artboard.height" @input="store.setArtboard({ height: Math.max(1, num($event)) })" />
          </div>
        </div>
        <!-- flow-only spacing: what actually shapes a card besides its width -->
        <div v-if="isFlow" class="field-row">
          <div class="field">
            <label>内边距</label>
            <input type="number" :value="store.artboard.padding ?? 44" @input="store.setArtboard({ padding: Math.max(0, num($event)) })" />
          </div>
          <div class="field">
            <label>块间距</label>
            <input type="number" :value="store.artboard.gap ?? 16" @input="store.setArtboard({ gap: Math.max(0, num($event)) })" />
          </div>
        </div>
      </div>
      <div class="section">
        <h3>背景</h3>
        <div class="color-row">
          <input type="color" :value="store.artboard.background" @input="store.setArtboard({ background: ($event.target as HTMLInputElement).value })" />
          <input class="hex" type="text" :value="store.artboard.background" @input="store.setArtboard({ background: ($event.target as HTMLInputElement).value })" />
        </div>
        <div class="swatches">
          <span v-for="c in SWATCHES" :key="c" class="swatch" :style="{ background: c }" @click="store.setArtboard({ background: c })" />
        </div>
      </div>
      <div class="empty-hint">选中一个元素即可编辑它。</div>
    </template>

    <!-- pinned to the bottom of the panel, whatever is selected -->
    <footer class="props-footer">
      <button class="pf-btn" title="快捷键" @click="shortcutsOpen = true">
        <Icon name="lucide:keyboard" />
      </button>
      <a class="pf-btn" :href="REPO_URL" target="_blank" rel="noopener noreferrer" title="GitHub 项目主页">
        <Icon name="lucide:github" />
      </a>
    </footer>

    <ShortcutsDialog v-if="shortcutsOpen" @close="shortcutsOpen = false" />
  </aside>

  <!-- collapsed: a tab on the right edge, vertically centred, to bring it back -->
  <button v-else class="props-reopen" title="展开属性面板" @click="store.rightPanelOpen = true">
    <Icon name="lucide:chevrons-left" />
  </button>
</template>
