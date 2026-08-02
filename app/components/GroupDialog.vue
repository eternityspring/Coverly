<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Join entry for 烁皓 AI 交流群.
 *
 * The wording, price ladder and QR all come from group-config.json in the
 * article-tools repo, which is the single source of truth across projects — the
 * strings below mirror its `resolved.*` block. If the price changes there,
 * change it here too.
 */
const WECHAT_ID = 'hao_dev'
const QR_URL = 'https://cdn.jsdelivr.net/gh/eternityspring/article-tools@main/images/wechat-qr.png'

const emit = defineEmits<{ (e: 'close'): void }>()
const copied = ref(false)

async function copyId() {
  try {
    await navigator.clipboard.writeText(WECHAT_ID)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* clipboard blocked — the id is on screen to copy by hand */
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="gd-overlay" @click.self="emit('close')">
    <div class="gd">
      <header class="gd-head">
        <h2>烁皓 AI 交流群</h2>
        <button class="gd-close" title="关闭 (Esc)" @click="emit('close')">
          <Icon name="lucide:x" />
        </button>
      </header>

      <p>我是烁皓，一个天天用 AI 做产品、搞钱的独立开发者，建了一个「付费 AI 交流群」。</p>
      <p class="gd-price">
        💰 入群早鸟价 <strong>￥29</strong>，群每满 10 人涨 10 元：29 → 39 → 49…… 封顶 <strong>129</strong>，越早进越便宜。
      </p>
      <p>
        想进的 👉 加我微信
        <button class="gd-id" :title="`点击复制 ${WECHAT_ID}`" @click="copyId">{{ WECHAT_ID }}</button>
        （备注「入群」），我拉你进群。
        <span v-if="copied" class="gd-copied">复制成功 ✓</span>
      </p>

      <figure class="gd-qr">
        <img :src="QR_URL" alt="烁皓微信二维码" width="220" height="220" />
        <figcaption>微信：{{ WECHAT_ID }} · 备注「入群」</figcaption>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.gd-overlay {
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
.gd {
  width: 100%;
  max-width: 420px;
  max-height: 84vh;
  overflow: auto;
  background: #fff;
  border-radius: 18px;
  padding: 24px 26px 22px;
  box-shadow: 0 24px 80px rgba(10, 12, 30, 0.4);
}
.gd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.gd-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.gd-close {
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
.gd-close:hover {
  background: var(--panel-2);
  color: var(--text);
}
.gd p {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--text);
}
.gd-price {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--text);
}
.gd-price strong {
  color: var(--accent);
}
.gd-id {
  border: none;
  background: var(--panel-2);
  border-bottom: 1px dashed var(--border-strong);
  color: var(--accent);
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
  padding: 1px 6px;
  border-radius: 5px;
}
.gd-id:hover {
  background: var(--accent-soft);
}
.gd-copied {
  margin-left: 6px;
  font-size: 12px;
  color: #22c55e;
}
.gd-qr {
  margin: 14px 0 0;
  text-align: center;
}
.gd-qr img {
  width: 220px;
  height: 220px;
  max-width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
}
.gd-qr figcaption {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-dim);
}
</style>
