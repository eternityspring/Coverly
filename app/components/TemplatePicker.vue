<script setup lang="ts">
const store = useEditorStore()
const templateStore = useTemplateStore()

const THUMB_W = 260
function miniStage(width: number) {
  const scale = THUMB_W / width
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    width: width + 'px',
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  } as Record<string, string>
}
function miniEl(el: any) {
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

// flow (card) preview — blocks stacked vertically, scaled to fit the thumb
function miniFlowStage(t: any) {
  const s = THUMB_W / t.artboard.width
  return {
    position: 'absolute',
    top: '0',
    left: '0',
    width: t.artboard.width + 'px',
    padding: (t.artboard.padding ?? 44) + 'px',
    display: 'flex',
    flexDirection: 'column',
    gap: (t.artboard.gap ?? 16) + 'px',
    transform: `scale(${s})`,
    transformOrigin: 'top left',
  } as Record<string, string>
}
function miniFlowText(el: any) {
  return {
    color: el.color,
    fontSize: el.fontSize + 'px',
    fontFamily: el.fontFamily,
    fontWeight: el.fontWeight,
    textAlign: el.textAlign,
    lineHeight: String(el.lineHeight ?? 1.6),
    width: '100%',
    overflow: 'hidden',
  } as Record<string, string>
}
</script>

<template>
  <div v-if="store.pickerOpen" class="picker-overlay">
    <div class="picker">
      <header class="picker-head">
        <h1>新建文档</h1>
        <p>选一个模板开始 — 所有元素都能拖拽、缩放、旋转、双击改字。当前文档会自动保存在本地。</p>
      </header>

      <div class="tpl-grid">
        <button class="tpl-card" @click="store.startBlank()">
          <div class="tpl-thumb blank"><Icon name="lucide:plus" /></div>
          <div class="tpl-info">
            <strong>空白画布</strong>
            <em>1080 × 1080 · 从零开始</em>
          </div>
        </button>

        <button v-for="t in templateStore.all" :key="t.id" class="tpl-card" @click="store.loadTemplate(t)">
          <div class="tpl-thumb" :style="{ background: t.artboard.background }">
            <div v-if="t.artboard.layout === 'flow'" :style="miniFlowStage(t)">
              <template v-for="(el, i) in t.elements" :key="i">
                <div v-if="el.type === 'text'" :style="miniFlowText(el)">{{ el.text }}</div>
                <hr
                  v-else-if="el.type === 'divider'"
                  :style="{ border: 0, borderTop: `${el.borderWidth || 1}px solid ${el.borderColor || '#ddd'}`, width: '100%', margin: '2px 0' }"
                />
              </template>
            </div>
            <div v-else :style="miniStage(t.artboard.width)">
              <div v-for="(el, i) in t.elements" :key="i" :style="miniEl(el)">
                <span v-if="el.type === 'text'" style="width: 100%">{{ el.text }}</span>
              </div>
            </div>
          </div>
          <div class="tpl-info">
            <strong>{{ t.name }}</strong>
            <em>{{ t.desc }}</em>
          </div>
        </button>
      </div>

      <button v-if="store.docId" class="picker-close" @click="store.pickerOpen = false">
        返回当前文档
      </button>
    </div>
  </div>
</template>

<style scoped>
.picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(17, 19, 28, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.picker {
  width: 100%;
  max-width: 760px;
  max-height: 86vh;
  overflow: auto;
  background: #fff;
  border-radius: 18px;
  padding: 30px 32px 34px;
  box-shadow: 0 24px 80px rgba(10, 12, 30, 0.4);
}
.picker-head h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.picker-head p {
  margin: 0 0 22px;
  color: #6b7080;
  font-size: 14px;
}
.tpl-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
.tpl-card {
  border: 1px solid #e7e8ec;
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  text-align: left;
  transition: all 0.14s;
}
.tpl-card:hover {
  border-color: #6c5ce7;
  box-shadow: 0 8px 26px rgba(108, 92, 231, 0.18);
  transform: translateY(-2px);
}
.tpl-thumb {
  position: relative;
  width: 260px;
  max-width: 100%;
  height: 104px;
  border-radius: 9px;
  overflow: hidden;
  margin: 0 auto 12px;
}
.tpl-thumb.blank {
  display: grid;
  place-items: center;
  background: repeating-linear-gradient(45deg, #f3f3f6, #f3f3f6 10px, #ececf1 10px, #ececf1 20px);
  color: #9aa0b0;
  font-size: 34px;
  font-weight: 300;
}
.tpl-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0 2px;
}
.tpl-info strong {
  font-size: 15px;
  font-weight: 700;
}
.tpl-info em {
  font-style: normal;
  font-size: 12px;
  color: #8b90a0;
}
.picker-close {
  display: block;
  margin: 22px auto 0;
  border: 1px solid #d6d8df;
  background: #fafafb;
  color: #1f2330;
  height: 38px;
  padding: 0 20px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
}
.picker-close:hover {
  background: #f0f0f3;
}
</style>
