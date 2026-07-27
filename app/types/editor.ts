export type ElementType = 'text' | 'rect' | 'ellipse' | 'triangle' | 'image' | 'divider'

export interface EditorElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  fill: string
  borderWidth: number
  borderColor: string
  radius: number
  name?: string // custom layer name (overrides the auto label)
  // text-only
  text?: string
  html?: string // rich-text (Tiptap) content; falls back to `text` when absent
  color?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: number
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  lineHeight?: number
  letterSpacing?: number
  underline?: boolean
  strikethrough?: boolean
  shadow?: boolean
  textBg?: string
  // transform
  flipH?: boolean
  flipV?: boolean
  // image-only
  src?: string
  objectFit?: 'cover' | 'contain' | 'fill'
  // flow-only
  marginTop?: number
}

export interface Artboard {
  width: number
  height: number
  background: string
  layout?: 'free' | 'flow' // free = absolute canvas, flow = stacked card
  padding?: number // flow only
  gap?: number // flow only — vertical gap between blocks
  minHeight?: number // flow only
}

export interface Design {
  name: string
  artboard: Artboard
  elements: EditorElement[]
}
