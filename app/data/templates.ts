import type { EditorElement, ElementType, Artboard } from '~/types/editor'

// A template = a named artboard + a set of seed elements.
// Elements are partials; the store's makeElement() fills in defaults and a fresh id.
export interface CoverTemplate {
  id: string
  name: string
  desc: string
  kind: 'cover' | 'card' // grouping in the picker
  artboard: Artboard
  elements: Array<Partial<EditorElement> & { type: ElementType }>
  // Seed elements for a page added AFTER the first one ("+ 加页"). Falls back to
  // `elements` when absent, so a new page is never empty.
  pageSeed?: Array<Partial<EditorElement> & { type: ElementType }>
}

// The open-source build ships with one blank start per layout, so a fresh clone
// can begin either kind of design without a database or any private templates.
const BASE_TEMPLATES: CoverTemplate[] = [
  {
    id: 'blank',
    name: '空白画布',
    desc: '公众号封面 · 1200×510 · 自由布局',
    kind: 'cover',
    artboard: {
      // 2.35:1 — matches the 公众号 preset in the canvas-size panel
      width: 1200,
      height: 510,
      layout: 'free',
      background: '#ffffff',
    },
    elements: [],
  },
  {
    id: 'blank-card',
    name: '空白卡片',
    desc: '小红书 · 480 宽 · 3:4 起，高度自适应',
    kind: 'card',
    artboard: {
      width: 480,
      height: 0, // ignored in flow — height comes from the content
      layout: 'flow',
      padding: 44,
      gap: 16,
      minHeight: 640, // 3:4 of the width; the card grows past it as content is added
      background: '#ffffff',
    },
    elements: [],
  },
]

// Optional private templates for LOCAL DEVELOPMENT only.
// Put them in a git-ignored `app/data/templates.local.ts` that exports
// `LOCAL_TEMPLATES: CoverTemplate[]`. `import.meta.glob` resolves to an empty
// object when that file is absent, so a fresh clone still builds without it and
// the private templates never end up in the open-source repo.
const localModules = import.meta.glob('./templates.local.ts', { eager: true }) as Record<
  string,
  { LOCAL_TEMPLATES?: CoverTemplate[] }
>
const LOCAL_TEMPLATES = Object.values(localModules).flatMap((m) => m.LOCAL_TEMPLATES ?? [])

export const COVER_TEMPLATES: CoverTemplate[] = [...BASE_TEMPLATES, ...LOCAL_TEMPLATES]
