<script setup lang="ts">
const store = useEditorStore()

const TOOLS = [
  { key: 'template', icon: 'lucide:layout-template', label: '模板' },
  { key: 'asset', icon: 'lucide:shapes', label: '素材' },
  { key: 'text', icon: 'lucide:type', label: '文字' },
  { key: 'image', icon: 'lucide:image', label: '图片' },
  { key: 'background', icon: 'lucide:palette', label: '背景' },
] as const
</script>

<template>
  <nav class="icon-rail">
    <!-- only the tools scroll; the account entry below stays put -->
    <div class="rail-tools">
      <button
        v-for="t in TOOLS"
        :key="t.key"
        class="rail-item"
        :class="{ active: store.activeTool === t.key && store.leftPanelOpen }"
        @click="store.setTool(t.key)"
      >
        <Icon :name="t.icon" />
        <span>{{ t.label }}</span>
      </button>
    </div>

    <button
      class="rail-item rail-bottom"
      :class="{ active: store.activeTool === 'documents' && store.leftPanelOpen }"
      @click="store.setTool('documents')"
    >
      <Icon name="lucide:user" />
      <span>我的</span>
    </button>
  </nav>
</template>
