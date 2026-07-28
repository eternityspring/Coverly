<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  try {
    const ch = new BroadcastChannel('auth')
    ch.postMessage({ type: 'success' })
    ch.close()
  } catch {
    // BroadcastChannel unsupported — the opener's session polling still recovers
  }
  // Delay the close so the broadcast actually flushes — some browsers drop
  // in-flight messages when the source window terminates in the same tick.
  setTimeout(() => window.close(), 200)
})
</script>

<template>
  <div class="auth-page"><p class="auth-sub">登录成功，正在跳转…</p></div>
</template>
