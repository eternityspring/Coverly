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

// The open-source build ships with a single blank canvas.
const BASE_TEMPLATES: CoverTemplate[] = [
  {
    id: 'blank',
    name: '空白画布',
    desc: '封面 · 1080×1080 · 自由布局',
    kind: 'cover',
    artboard: {
      width: 1080,
      height: 1080,
      layout: 'free',
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
