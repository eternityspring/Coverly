import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EditorElement, ElementType, Artboard } from '~/types/editor'
import { useTemplateStore } from './templates'

let counter = 0
function uid(prefix = 'el') {
  return prefix + '_' + Math.random().toString(36).slice(2, 8) + (counter++).toString(36)
}
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))
type Partial2 = Partial<EditorElement>

export interface Page {
  id: string
  artboard: Artboard
  elements: EditorElement[]
  templateId?: string // the template this page came from; page 0's is the document's
}

function defaultArtboard(): Artboard {
  return { width: 1080, height: 1080, background: '#ffffff', layout: 'free' }
}

export const useEditorStore = defineStore('editor', () => {
  // ---- state ----
  const name = ref('Untitled design')
  const pages = ref<Page[]>([{ id: uid('pg'), artboard: defaultArtboard(), elements: [] }])
  const activeId = ref<string>(pages.value[0].id)
  const selectedId = ref<string | null>(null)
  const pageSelected = ref(false) // is the active page's artboard selected (shows resize handles)
  const zoom = ref(0.5)
  const pickerOpen = ref(true) // template picker shown on first load
  // id of the document being edited — null until one is started or restored,
  // which is what keeps the untouched first-load state out of local storage
  const docId = ref<string | null>(null)
  const activeTool = ref<'template' | 'asset' | 'text' | 'image' | 'background' | 'documents'>('text')
  const leftPanelOpen = ref(true)
  // right-click menu — `at` is the artboard-local point the menu was opened at
  const menu = ref<{ open: boolean; x: number; y: number; targetId: string | null; at: { x: number; y: number } | null }>({
    open: false,
    x: 0,
    y: 0,
    targetId: null,
    at: null,
  })
  const clipboard = ref<EditorElement | null>(null)

  // active page view — keeps store.elements / store.artboard working everywhere
  const active = computed<Page>(() => pages.value.find((p) => p.id === activeId.value) || pages.value[0])
  const artboard = computed(() => active.value.artboard)
  const elements = computed(() => active.value.elements)

  // ---- history: snapshots the whole pages array ----
  const past = ref<Page[][]>([])
  const future = ref<Page[][]>([])
  let pending: Page[][] | null = null

  const selected = computed(() => active.value.elements.find((e) => e.id === selectedId.value) || null)
  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function snapshot() {
    past.value.push(clone(pages.value))
    if (past.value.length > 60) past.value.shift()
    future.value = []
  }
  function beginInteraction() {
    pending = clone(pages.value)
  }
  function commitInteraction() {
    if (!pending) return
    if (JSON.stringify(pending) !== JSON.stringify(pages.value)) {
      past.value.push(pending as Page[])
      if (past.value.length > 60) past.value.shift()
      future.value = []
    }
    pending = null
  }
  function resetHistory() {
    past.value = []
    future.value = []
    pending = null
  }
  function restore(arr: Page[]) {
    pages.value = arr
    if (!pages.value.some((p) => p.id === activeId.value)) activeId.value = pages.value[0]?.id
    if (!active.value?.elements.some((e) => e.id === selectedId.value)) selectedId.value = null
  }
  function undo() {
    if (!past.value.length) return
    future.value.push(clone(pages.value))
    restore(past.value.pop() as Page[])
  }
  function redo() {
    if (!future.value.length) return
    past.value.push(clone(pages.value))
    restore(future.value.pop() as Page[])
  }

  // ---- element factory ----
  function makeElement(type: ElementType, partial: Partial2 = {}): EditorElement {
    const base: EditorElement = {
      id: uid(),
      type,
      x: 0,
      y: 0,
      width: 220,
      height: 220,
      rotation: 0,
      opacity: 1,
      fill: '#6366f1',
      borderWidth: 0,
      borderColor: '#111827',
      radius: 0,
    }
    const presets: Record<ElementType, Partial2> = {
      text: {
        width: 420,
        height: 90,
        fill: 'transparent',
        text: 'Add your text',
        color: '#111827',
        fontSize: 48,
        fontFamily: 'Inter',
        fontWeight: 700,
        fontStyle: 'normal',
        textAlign: 'center',
        lineHeight: 1.25,
      },
      rect: { radius: 0 },
      ellipse: {},
      triangle: {},
      image: { fill: 'transparent', objectFit: 'cover' },
      divider: { width: 200, height: 1, fill: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
    }
    const el: EditorElement = { ...base, ...presets[type], ...partial }
    if (partial.x === undefined) el.x = Math.round((artboard.value.width - el.width) / 2)
    if (partial.y === undefined) el.y = Math.round((artboard.value.height - el.height) / 2)
    return el
  }

  // ---- element actions (operate on the active page) ----
  function addElement(type: ElementType, partial: Partial2 = {}) {
    snapshot()
    const el = makeElement(type, partial)
    active.value.elements.push(el)
    selectedId.value = el.id
    return el
  }
  function updateElement(id: string, patch: Partial2) {
    const el = active.value.elements.find((e) => e.id === id)
    if (el) Object.assign(el, patch)
  }
  function removeElement(id: string) {
    snapshot()
    active.value.elements = active.value.elements.filter((e) => e.id !== id)
    if (selectedId.value === id) selectedId.value = null
  }
  function duplicate(id: string) {
    const el = active.value.elements.find((e) => e.id === id)
    if (!el) return
    snapshot()
    const copy = clone(el)
    copy.id = uid()
    copy.x += 28
    copy.y += 28
    active.value.elements.push(copy)
    selectedId.value = copy.id
  }
  function nudge(id: string, dx: number, dy: number) {
    const el = active.value.elements.find((e) => e.id === id)
    if (el) {
      el.x += dx
      el.y += dy
    }
  }
  // align an element relative to its page (free layout)
  function alignToPage(id: string, how: 'left' | 'right' | 'centerH' | 'top' | 'bottom' | 'centerV') {
    const el = active.value.elements.find((e) => e.id === id)
    if (!el) return
    const ab = active.value.artboard
    snapshot()
    if (how === 'left') el.x = 0
    else if (how === 'right') el.x = Math.round(ab.width - el.width)
    else if (how === 'centerH') el.x = Math.round((ab.width - el.width) / 2)
    else if (how === 'top') el.y = 0
    else if (how === 'bottom') el.y = Math.round(ab.height - el.height)
    else if (how === 'centerV') el.y = Math.round((ab.height - el.height) / 2)
  }

  // ---- z-order (array order == paint order, last == front) ----
  function indexOf(id: string) {
    return active.value.elements.findIndex((e) => e.id === id)
  }
  function move(id: string, to: number) {
    const els = active.value.elements
    const i = indexOf(id)
    if (i < 0) return
    const t = Math.max(0, Math.min(els.length - 1, to))
    if (t === i) return
    snapshot()
    const [el] = els.splice(i, 1)
    els.splice(t, 0, el)
  }
  // live reorder during a flow drag (no snapshot; wrap with begin/commitInteraction)
  function reorderTo(id: string, index: number) {
    const els = active.value.elements
    const from = els.findIndex((e) => e.id === id)
    if (from < 0) return
    const to = Math.max(0, Math.min(els.length - 1, index))
    if (to === from) return
    const [el] = els.splice(from, 1)
    els.splice(to, 0, el)
  }
  // free layout: array order is paint order, last == front.
  // flow layout: array order is top-to-bottom on screen, so index 0 is "front".
  const flowOrder = () => active.value.artboard.layout === 'flow'
  const bringForward = (id: string) => move(id, indexOf(id) + (flowOrder() ? -1 : 1))
  const sendBackward = (id: string) => move(id, indexOf(id) + (flowOrder() ? 1 : -1))
  const bringToFront = (id: string) => move(id, flowOrder() ? 0 : active.value.elements.length - 1)
  const sendToBack = (id: string) => move(id, flowOrder() ? active.value.elements.length - 1 : 0)

  // ---- selection ----
  // selecting an element also activates the page it lives on (tiled canvas)
  function select(id: string | null) {
    if (id) {
      const pg = pages.value.find((p) => p.elements.some((e) => e.id === id))
      if (pg) activeId.value = pg.id
      pageSelected.value = false // selecting an element deselects the page
    }
    selectedId.value = id
  }
  const clearSelection = () => (selectedId.value = null)
  // clear both element + page selection (click on empty canvas)
  function deselectAll() {
    selectedId.value = null
    pageSelected.value = false
  }

  // ---- context menu ----
  // opened on an element (targetId) or on empty canvas (targetId = null)
  function openMenu(x: number, y: number, targetId: string | null, pageId?: string, at: { x: number; y: number } | null = null) {
    if (targetId) select(targetId) // also activates the page the element lives on
    else if (pageId) activeId.value = pageId
    menu.value = { open: true, x, y, targetId, at }
  }
  function closeMenu() {
    menu.value.open = false
  }

  // ---- clipboard ----
  function copyElement(id: string) {
    const el = active.value.elements.find((e) => e.id === id)
    if (el) clipboard.value = clone(el)
  }
  // paste at a canvas point, or offset from the original when no point is given
  function pasteElement(at?: { x: number; y: number } | null) {
    if (!clipboard.value) return
    snapshot()
    const copy = clone(clipboard.value)
    copy.id = uid()
    if (at) {
      copy.x = Math.round(at.x - copy.width / 2)
      copy.y = Math.round(at.y - copy.height / 2)
    } else {
      copy.x += 28
      copy.y += 28
    }
    active.value.elements.push(copy)
    selectedId.value = copy.id
    return copy
  }

  // ---- drag & drop onto a page ----
  // `at` is an artboard-local point (ignored by flow pages, which just append)
  function dropElement(pageId: string, type: ElementType, partial: Partial2 = {}, at?: { x: number; y: number } | null) {
    activeId.value = pageId
    pageSelected.value = false
    if (at && active.value.artboard.layout !== 'flow') {
      const probe = makeElement(type, partial)
      partial = { ...partial, x: Math.round(at.x - probe.width / 2), y: Math.round(at.y - probe.height / 2) }
    }
    return addElement(type, partial)
  }

  // ---- artboard / zoom ----
  function setArtboard(patch: Partial<Artboard>) {
    Object.assign(active.value.artboard, patch)
  }
  function setZoom(z: number) {
    zoom.value = Math.min(4, Math.max(0.1, z))
  }
  const zoomIn = () => setZoom(zoom.value * 1.2)
  const zoomOut = () => setZoom(zoom.value / 1.2)
  const zoomToFit = () => (zoom.value = fitZoom())
  function fitZoom() {
    const ab = active.value.artboard
    const maxW = 900
    const maxH = 560
    if (ab.layout === 'flow') return Math.min(maxW / ab.width, 1)
    return Math.min(maxW / ab.width, maxH / ab.height, 1)
  }

  // ---- pages ----
  function makePage(tpl?: { id?: string; artboard?: Artboard; elements?: Array<Partial2 & { type: ElementType }> }): Page {
    return {
      id: uid('pg'),
      templateId: tpl?.id,
      artboard: tpl?.artboard ? { ...tpl.artboard } : defaultArtboard(),
      elements: (tpl?.elements || []).map((e) => makeElement(e.type, e)),
    }
  }
  // Picking from the template picker always starts a NEW document — that is what
  // draws the boundary between documents on the local shelf. Applying a template
  // to a page within the current document is applyTemplate().
  function activate(page: Page) {
    docId.value = uid('doc')
    pages.value = [page]
    resetHistory()
    activeId.value = page.id
    selectedId.value = null
    pageSelected.value = false
    zoom.value = fitZoom()
    pickerOpen.value = false
  }
  function setActivePage(id: string) {
    if (!pages.value.some((p) => p.id === id)) return
    activeId.value = id
    selectedId.value = null
    pageSelected.value = true // activating a page selects its artboard
  }
  // add a page that inherits the current page's size & layout, seeded with the
  // document's template (page 0's) so a new page isn't blank — `pageSeed` when the
  // template defines one, otherwise the template's own elements.
  function addPage() {
    snapshot()
    const idx = pages.value.findIndex((p) => p.id === activeId.value)
    const templateId = pages.value[0]?.templateId
    const tpl = useTemplateStore().byId(templateId)
    const seed = tpl?.pageSeed ?? tpl?.elements ?? []
    const page: Page = {
      id: uid('pg'),
      templateId,
      artboard: clone(active.value.artboard),
      elements: seed.map((e) => makeElement(e.type, e)),
    }
    pages.value.splice(idx + 1, 0, page)
    activeId.value = page.id
    selectedId.value = null
  }
  function duplicatePage(id: string) {
    const idx = pages.value.findIndex((p) => p.id === id)
    if (idx < 0) return
    snapshot()
    const src = pages.value[idx]
    const copy: Page = {
      id: uid('pg'),
      templateId: src.templateId,
      artboard: clone(src.artboard),
      elements: src.elements.map((e) => ({ ...clone(e), id: uid() })),
    }
    pages.value.splice(idx + 1, 0, copy)
    activeId.value = copy.id
    selectedId.value = null
  }
  function removePage(id: string) {
    if (pages.value.length <= 1) return
    snapshot()
    const idx = pages.value.findIndex((p) => p.id === id)
    pages.value = pages.value.filter((p) => p.id !== id)
    if (activeId.value === id) {
      activeId.value = pages.value[Math.min(idx, pages.value.length - 1)].id
      zoom.value = fitZoom()
    }
    selectedId.value = null
  }
  function movePage(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return
    snapshot()
    const [p] = pages.value.splice(from, 1)
    pages.value.splice(to, 0, p)
  }

  // ---- templates / picker ----
  function loadTemplate(tpl: { id?: string; name?: string; artboard?: Artboard; elements?: Array<Partial2 & { type: ElementType }> }) {
    name.value = tpl.name || 'Untitled design'
    activate(makePage(tpl))
  }
  function startBlank() {
    name.value = 'Untitled design'
    activate(makePage())
  }
  function openPicker() {
    pickerOpen.value = true
  }
  function closePicker() {
    pickerOpen.value = false
  }

  // ---- left tool rail ----
  function setTool(t: 'template' | 'asset' | 'text' | 'image' | 'background' | 'documents') {
    if (activeTool.value === t && leftPanelOpen.value) {
      leftPanelOpen.value = false // click the active tool again -> collapse
    } else {
      activeTool.value = t
      leftPanelOpen.value = true
    }
  }
  // replace the CURRENT page's artboard + elements with a template
  function applyTemplate(tpl: { id?: string; artboard?: Artboard; elements?: Array<Partial2 & { type: ElementType }> }) {
    const i = pages.value.findIndex((p) => p.id === activeId.value)
    if (i < 0) return
    snapshot()
    const page = makePage(tpl)
    pages.value.splice(i, 1, page)
    activeId.value = page.id
    selectedId.value = null
    zoom.value = fitZoom()
  }

  // ---- serialize ----
  function toJSON() {
    return JSON.stringify({ name: name.value, pages: pages.value }, null, 2)
  }
  // Restore a document from the local shelf — same id, so editing keeps
  // updating that record instead of spawning a new one.
  function loadDocument(doc: { id: string; name: string; pages: Page[] }) {
    docId.value = doc.id
    name.value = doc.name
    pages.value = clone(doc.pages)
    activeId.value = pages.value[0]?.id
    selectedId.value = null
    pageSelected.value = false
    resetHistory()
    zoom.value = fitZoom()
    pickerOpen.value = false
  }

  function loadJSON(str: string) {
    const d = JSON.parse(str)
    snapshot()
    docId.value = uid('doc') // an imported file is a new document
    if (d.name) name.value = d.name
    if (Array.isArray(d.pages)) {
      pages.value = d.pages
    } else if (Array.isArray(d.elements)) {
      // backward-compat: single-page document
      pages.value = [{ id: uid('pg'), artboard: d.artboard || defaultArtboard(), elements: d.elements }]
    }
    activeId.value = pages.value[0]?.id
    selectedId.value = null
    zoom.value = fitZoom()
  }

  return {
    name,
    pages,
    activeId,
    active,
    artboard,
    elements,
    selectedId,
    zoom,
    past,
    future,
    selected,
    canUndo,
    canRedo,
    pickerOpen,
    docId,
    loadDocument,
    snapshot,
    beginInteraction,
    commitInteraction,
    resetHistory,
    undo,
    redo,
    addElement,
    updateElement,
    removeElement,
    duplicate,
    nudge,
    alignToPage,
    reorderTo,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    select,
    clearSelection,
    deselectAll,
    pageSelected,
    menu,
    openMenu,
    closeMenu,
    clipboard,
    copyElement,
    pasteElement,
    dropElement,
    setArtboard,
    setZoom,
    zoomIn,
    zoomOut,
    zoomToFit,
    setActivePage,
    addPage,
    duplicatePage,
    removePage,
    movePage,
    loadTemplate,
    startBlank,
    openPicker,
    closePicker,
    activeTool,
    leftPanelOpen,
    setTool,
    applyTemplate,
    toJSON,
    loadJSON,
  }
})
