<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { authClient } from '~/utils/auth-client'

const store = useEditorStore()
const { user, isPending, authEnabled } = useUser()

const menuOpen = ref(false)
const initial = computed(() => (user.value?.name || user.value?.email || '?').charAt(0))

async function signOut() {
  menuOpen.value = false
  await authClient.signOut()
  window.location.reload() // drop the members-only templates from the picker
}

const closeMenu = () => (menuOpen.value = false)
onMounted(() => window.addEventListener('pointerdown', closeMenu))
onBeforeUnmount(() => window.removeEventListener('pointerdown', closeMenu))

function exportJSON() {
  const blob = new Blob([store.toJSON()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = (store.name || 'design').replace(/\s+/g, '-').toLowerCase() + '.json'
  a.click()
  URL.revokeObjectURL(a.href)
}
function importJSON(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => store.loadJSON(reader.result as string)
  reader.readAsText(file)
  input.value = ''
}
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <span class="logo"><Icon name="lucide:palette" /></span>
      <span>Coverly</span>
    </div>
    <input v-model="store.name" class="title-input" spellcheck="false" />

    <div class="spacer" />

    <div class="toolgroup">
      <button class="icon-btn" :disabled="!store.canUndo" title="Undo (⌘Z)" @click="store.undo()"><Icon name="lucide:undo-2" /></button>
      <button class="icon-btn" :disabled="!store.canRedo" title="Redo (⌘⇧Z)" @click="store.redo()"><Icon name="lucide:redo-2" /></button>
    </div>

    <div class="spacer" />

    <button class="btn" title="新增一页（选择模板）" @click="store.openPicker('add')"><Icon name="lucide:layout-template" /> 模板</button>
    <label class="btn" title="Import design JSON">
      <Icon name="lucide:upload" /> Import
      <input type="file" accept="application/json,.json" hidden @change="importJSON" />
    </label>
    <button class="btn primary" title="Export design JSON" @click="exportJSON"><Icon name="lucide:download" /> Export</button>

    <!-- Account — absent entirely when no database is configured -->
    <template v-if="authEnabled">
      <div v-if="user" class="account" @pointerdown.stop>
        <button class="account-btn" @click="menuOpen = !menuOpen">
          <img v-if="user.image" class="account-avatar" :src="user.image" alt="" />
          <span v-else class="account-avatar">{{ initial }}</span>
          <span class="account-name">{{ user.name || user.email }}</span>
        </button>
        <div v-if="menuOpen" class="account-menu">
          <div class="account-email">{{ user.email }}</div>
          <button class="ctx-item" @click="signOut"><Icon name="lucide:log-out" /> 退出登录</button>
        </div>
      </div>
      <NuxtLink v-else-if="!isPending" to="/login" class="btn"><Icon name="lucide:user" /> 登录</NuxtLink>
    </template>
  </header>
</template>
