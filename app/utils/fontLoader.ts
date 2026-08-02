import { FONTS, findFont } from '~/data/fonts'

// Seeded with the UI typeface, which nuxt.config already loads in <head>.
const requested = new Set<string>(['Inter:wght@400;500;600;700;900'])

/**
 * Injects the Google Fonts stylesheet for a family, once.
 *
 * Only the stylesheet is fetched here — the browser then pulls whichever
 * unicode-range slices the rendered text actually needs, so this stays cheap
 * even for a CJK family.
 */
export function ensureFont(family?: string) {
  if (!import.meta.client || !family) return
  const font = findFont(family)
  if (!font?.google || requested.has(font.google)) return
  requested.add(font.google)

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`
  document.head.appendChild(link)
}

/** Every catalogue font — used when the picker opens so each row previews itself. */
export function ensureAllFonts() {
  FONTS.forEach((f) => ensureFont(f.family))
}

/** The fonts a document actually uses, so a restored design renders correctly. */
export function ensureDocumentFonts(pages: Array<{ elements: Array<{ fontFamily?: string }> }>) {
  const used = new Set<string>()
  for (const page of pages) for (const el of page.elements) if (el.fontFamily) used.add(el.fontFamily)
  used.forEach(ensureFont)
}
