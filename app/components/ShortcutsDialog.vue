<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits<{ (e: 'close'): void }>()

// Mirrors the handlers in pages/index.vue and the canvas interactions.
const GROUPS = [
  {
    title: '编辑',
    items: [
      { keys: ['⌘', 'Z'], label: '撤销' },
      { keys: ['⌘', '⇧', 'Z'], label: '重做' },
      { keys: ['⌘', 'D'], label: '创建副本' },
      { keys: ['⌘', 'C'], label: '复制' },
      { keys: ['⌘', 'V'], label: '粘贴' },
      { keys: ['⌫'], label: '删除所选' },
    ],
  },
  {
    title: '图层与位置',
    items: [
      { keys: ['⌘', ']'], label: '上移一层' },
      { keys: ['⌘', '['], label: '下移一层' },
      { keys: ['↑', '↓', '←', '→'], label: '微移 1px' },
      { keys: ['⇧', '+', '方向键'], label: '移动 10px' },
    ],
  },
  {
    title: '画布',
    items: [
      { keys: ['⇧', 'R'], label: '显示 / 隐藏标尺' },
      { keys: ['Esc'], label: '取消选择' },
      { keys: ['双击'], label: '编辑文字' },
      { keys: ['右键'], label: '打开菜单（元素 / 空白处）' },
      { keys: ['拖顶部圆点'], label: '旋转元素' },
      { keys: ['⇧', '+', '拖动'], label: '旋转按 15° 吸附' },
      { keys: ['从左栏拖入'], label: '放到画布上的指定位置' },
      { keys: ['拖动元素'], label: '自动吸附对齐，显示参考线' },
      { keys: ['⌥', '+', '拖动'], label: '临时关闭吸附' },
    ],
  },
]

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="sc-overlay" @click.self="emit('close')">
    <div class="sc">
      <header class="sc-head">
        <h2>快捷键</h2>
        <button class="sc-close" title="关闭 (Esc)" @click="emit('close')">
          <Icon name="lucide:x" />
        </button>
      </header>

      <div class="sc-groups">
        <section v-for="g in GROUPS" :key="g.title">
          <h3>{{ g.title }}</h3>
          <div v-for="it in g.items" :key="it.label" class="sc-row">
            <span class="sc-label">{{ it.label }}</span>
            <span class="sc-keys">
              <kbd v-for="k in it.keys" :key="k">{{ k }}</kbd>
            </span>
          </div>
        </section>
      </div>

      <p class="sc-foot">Windows / Linux 上把 <kbd>⌘</kbd> 换成 <kbd>Ctrl</kbd>。</p>
    </div>
  </div>
</template>

<style scoped>
.sc-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(17, 19, 28, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.sc {
  width: 100%;
  max-width: 560px;
  max-height: 84vh;
  overflow: auto;
  background: #fff;
  border-radius: 18px;
  padding: 24px 26px 20px;
  box-shadow: 0 24px 80px rgba(10, 12, 30, 0.4);
}
.sc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.sc-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.sc-close {
  border: none;
  background: transparent;
  color: var(--text-dim);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 17px;
}
.sc-close:hover {
  background: var(--panel-2);
  color: var(--text);
}
.sc-groups {
  display: grid;
  gap: 20px;
}
.sc-groups h3 {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.sc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.sc-row:last-child {
  border-bottom: none;
}
.sc-label {
  color: var(--text);
}
.sc-keys {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}
kbd {
  background: var(--panel-2);
  border: 1px solid var(--border-strong);
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 2px 7px;
  font-size: 11px;
  font-family: 'Roboto Mono', monospace;
  color: var(--text);
  white-space: nowrap;
}
.sc-foot {
  margin: 20px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-dim);
}
</style>
