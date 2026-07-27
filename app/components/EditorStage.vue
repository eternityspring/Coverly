<script setup lang="ts">
import { computed } from 'vue'

const store = useEditorStore()
const multi = computed(() => store.pages.length > 1)
</script>

<template>
  <div class="stage" :class="{ multi }" @pointerdown.self="store.deselectAll()">
    <PageView v-for="page in store.pages" :key="page.id" :page="page" />
  </div>
</template>
