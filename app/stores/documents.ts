import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Page } from './editor'

const KEY = 'coverly:documents'
const MAX = 20

export interface StoredDoc {
  id: string
  name: string
  updatedAt: number
  pages: Page[]
}

/**
 * Local document shelf, kept in localStorage — one record per document, updated
 * in place as you edit. Holds the {MAX} most recently touched documents; the
 * least recently touched is dropped to make room.
 *
 * Storage is best-effort: a full or unavailable localStorage must never break
 * editing, so every access is guarded and failures are swallowed.
 */
export const useDocumentStore = defineStore('documents', () => {
  const docs = ref<StoredDoc[]>([]) // most recently updated first
  const latest = computed<StoredDoc | undefined>(() => docs.value[0])

  function read(): StoredDoc[] {
    if (!import.meta.client) return []
    try {
      const raw = localStorage.getItem(KEY)
      const list = raw ? JSON.parse(raw) : []
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }

  // Writes the newest MAX records, shedding the oldest until the quota accepts
  // it — a design with big inline images can be several megabytes on its own.
  function write(list: StoredDoc[]) {
    if (!import.meta.client) return list
    let out = list.slice(0, MAX)
    while (out.length) {
      try {
        localStorage.setItem(KEY, JSON.stringify(out))
        return out
      } catch {
        out = out.slice(0, out.length - 1)
      }
    }
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* storage unavailable — carry on without it */
    }
    return out
  }

  function load() {
    docs.value = read()
  }

  // Both writers start from what is actually on disk, not from the in-memory
  // copy: another tab may have saved since this one last read, and merging onto
  // stale state would silently drop its documents.
  function save(doc: StoredDoc) {
    const rest = read().filter((d) => d.id !== doc.id)
    docs.value = write([doc, ...rest].sort((a, b) => b.updatedAt - a.updatedAt))
  }

  function remove(id: string) {
    docs.value = write(read().filter((d) => d.id !== id))
  }

  const byId = (id: string) => docs.value.find((d) => d.id === id)

  return { docs, latest, load, save, remove, byId, MAX }
})
