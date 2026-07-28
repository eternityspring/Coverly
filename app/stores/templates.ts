import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { COVER_TEMPLATES, type CoverTemplate } from '~/data/templates'

/**
 * The picker's template list.
 *
 * Local templates — the bundled blank canvas plus any git-ignored private ones —
 * are available synchronously, so the editor is usable before (and without) any
 * network call. Templates from the database are appended once they arrive; a
 * failed or empty response simply means "no extra templates" (see CLAUDE.md).
 */
export const useTemplateStore = defineStore('templates', () => {
  const remote = ref<CoverTemplate[]>([])
  const loading = ref(false)

  // Local wins on an id clash: during local development the same template can
  // exist both in templates.local.ts and in the database.
  const all = computed<CoverTemplate[]>(() => [
    ...COVER_TEMPLATES,
    ...remote.value.filter((r) => !COVER_TEMPLATES.some((l) => l.id === r.id)),
  ])

  const byId = (id?: string) => (id ? all.value.find((t) => t.id === id) : undefined)

  async function load() {
    loading.value = true
    try {
      remote.value = await $fetch<CoverTemplate[]>('/api/templates')
    } catch {
      remote.value = [] // no database, offline, or the endpoint is absent
    } finally {
      loading.value = false
    }
  }

  return { remote, loading, all, byId, load }
})
