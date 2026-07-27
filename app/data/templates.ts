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
}

// The open-source build ships with a single blank canvas.
// Add your own presets by pushing more entries onto this array.
export const COVER_TEMPLATES: CoverTemplate[] = [
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
