<script setup lang="ts">
const store = useEditorStore()
</script>

<template>
  <div class="pages-bar">
    <div class="pages-scroll">
      <div
        v-for="(p, i) in store.pages"
        :key="p.id"
        class="page-item"
        :class="{ active: p.id === store.activeId }"
        @click="store.setActivePage(p.id)"
      >
        <span class="page-no">{{ i + 1 }}</span>
        <PageThumb :page="p" />
        <div class="page-actions">
          <button class="page-act" title="复制页" @click.stop="store.duplicatePage(p.id)">
            <Icon name="lucide:copy" />
          </button>
          <button
            v-if="store.pages.length > 1"
            class="page-act"
            title="删除页"
            @click.stop="store.removePage(p.id)"
          >
            <Icon name="lucide:trash-2" />
          </button>
        </div>
      </div>

      <button class="page-add" title="添加同尺寸空白页" @click="store.addPage()">
        <Icon name="lucide:plus" />
        <span>加页</span>
      </button>
    </div>
  </div>
</template>
