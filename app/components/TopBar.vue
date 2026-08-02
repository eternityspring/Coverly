<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { authClient } from '~/utils/auth-client'

const store = useEditorStore()
const { user, isPending, authEnabled } = useUser()

const menuOpen = ref(false)
const exportOpen = ref(false)
const exporting = ref(false)
const exportError = ref('')
const initial = computed(() => (user.value?.name || user.value?.email || '?').charAt(0))

const { exportPNG, exportJSON } = useExport()

// Everything up to this point is open — browsing templates, editing, saving
// locally. Export is where an account is asked for, and only where the user
// system exists at all: with no database configured there is nobody to sign in
// as, so export stays open (see CLAUDE.md).
const needsSignIn = computed(() => authEnabled && !isPending.value && !user.value)

function goSignIn() {
  exportOpen.value = false
  navigateTo({ path: '/login', query: { redirect: '/' } })
}

async function onExportPNG() {
  if (needsSignIn.value) return goSignIn()
  exportOpen.value = false
  exporting.value = true
  exportError.value = ''
  try {
    await exportPNG()
  } catch (err) {
    console.error('[export] PNG failed', err)
    exportError.value = '导出图片失败，请重试'
  } finally {
    exporting.value = false
  }
}
function onExportJSON() {
  if (needsSignIn.value) return goSignIn()
  exportOpen.value = false
  exportJSON()
}

async function signOut() {
  menuOpen.value = false
  await authClient.signOut()
  window.location.reload()
}

function closeMenus() {
  menuOpen.value = false
  exportOpen.value = false
}
onMounted(() => window.addEventListener('pointerdown', closeMenus))
onBeforeUnmount(() => window.removeEventListener('pointerdown', closeMenus))

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

    <button class="btn" title="选择模板，新建一个文档" @click="store.openPicker()"><Icon name="lucide:file-plus" /> 新建文档</button>
    <label class="btn" title="从 JSON 配置导入文档">
      <Icon name="lucide:upload" /> 导入
      <input type="file" accept="application/json,.json" hidden @change="importJSON" />
    </label>
    <div class="export" @pointerdown.stop>
      <button class="btn primary" :disabled="exporting" @click="exportOpen = !exportOpen">
        <Icon name="lucide:download" /> {{ exporting ? '导出中…' : '导出' }}
        <Icon name="lucide:chevron-down" class="btn-caret" />
      </button>
      <div v-if="exportOpen" class="export-menu">
        <button class="ctx-item" @click="onExportPNG">
          <Icon name="lucide:image" /> 导出图片
          <span class="ctx-key">{{ needsSignIn ? '需登录' : 'PNG 2x' }}</span>
        </button>
        <button class="ctx-item" @click="onExportJSON">
          <Icon name="lucide:file-json" /> 导出配置
          <span class="ctx-key">{{ needsSignIn ? '需登录' : 'JSON' }}</span>
        </button>
        <template v-if="needsSignIn">
          <div class="ctx-sep" />
          <p class="export-note">登录后即可导出，编辑不受影响。</p>
        </template>
      </div>
      <p v-if="exportError" class="export-error">{{ exportError }}</p>
    </div>

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
