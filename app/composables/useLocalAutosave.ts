import { watch, onMounted, onBeforeUnmount } from 'vue'

const DEBOUNCE_MS = 800

/**
 * Keeps the current document mirrored into the local shelf.
 *
 * On mount the most recently touched document is restored, so a refresh lands
 * back where you left off. After that every edit updates that same record,
 * debounced — a drag fires hundreds of mutations and only the settled result is
 * worth writing.
 *
 * Nothing is written until a document actually exists (`docId`), which keeps the
 * untouched first-load state off the shelf.
 */
export function useLocalAutosave() {
  const store = useEditorStore()
  const docs = useDocumentStore()

  let timer: ReturnType<typeof setTimeout> | null = null

  function flush() {
    if (!store.docId) return
    docs.save({
      id: store.docId,
      name: store.name,
      updatedAt: Date.now(),
      pages: JSON.parse(JSON.stringify(store.pages)),
    })
  }

  function scheduleSave() {
    if (!store.docId) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, DEBOUNCE_MS)
  }

  onMounted(() => {
    docs.load()
    const last = docs.latest
    if (last) store.loadDocument(last)

    watch(() => [store.docId, store.name, store.pages], scheduleSave, { deep: true })
    // A refresh or tab close should not lose the last few hundred milliseconds.
    window.addEventListener('beforeunload', flush)
  })

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
    window.removeEventListener('beforeunload', flush)
  })
}
