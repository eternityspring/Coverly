import * as htmlToImage from 'html-to-image'

// Matches article-tools/cover.html: 2x the CSS pixels, so a 1080px artboard
// exports at 2160px and stays sharp on retina screens and after upscaling.
const PIXEL_RATIO = 2

function fileBase(name: string) {
  return (name || 'design').trim().replace(/[\\/:*?"<>|\s]+/g, '-').toLowerCase()
}

function download(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

/**
 * PNG export of the active page.
 *
 * The board on screen is scaled to the current zoom — `transform: scale()` for a
 * free artboard, CSS `zoom` for a flow card — so both are neutralised for the
 * duration of the capture and the pixel size comes from the artboard itself.
 * Otherwise the export would inherit whatever zoom the user happened to be at.
 */
export function useExport() {
  const store = useEditorStore()

  async function capture(render: typeof htmlToImage.toPng) {
    const view = document.querySelector('.page-view.active') as HTMLElement | null
    const board = view?.querySelector('.artboard, .flow-board') as HTMLElement | null
    if (!board) throw new Error('No page to export')

    const isFlow = board.classList.contains('flow-board')
    const prevTransform = board.style.transform
    const prevZoom = board.style.zoom
    if (isFlow) board.style.zoom = '1'
    else board.style.transform = 'none'

    const rect = board.getBoundingClientRect()
    const options = {
      pixelRatio: PIXEL_RATIO,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      // Keep html-to-image from fetching @font-face URLs, as article-tools does.
      skipFonts: true,
      fontEmbedCSS: '',
      filter: (node: HTMLElement) => {
        // Selection chrome lives inside the artboard — it must not be baked in.
        if (node.classList?.contains('handle')) return false
        if (node.classList?.contains('sel-outline')) return false
        if (node.classList?.contains('rotate-line')) return false
        if (node.classList?.contains('hover-ring')) return false
        // Only images already inlined as data URLs; anything remote would be
        // fetched during rasterising and fail.
        if (node.tagName === 'IMG') {
          const s = node.getAttribute('src')
          return !!(s && s.startsWith('data:image/'))
        }
        return true
      },
    }

    try {
      await (document.fonts?.ready ?? Promise.resolve())
      return await render(board, options)
    } finally {
      board.style.transform = prevTransform
      board.style.zoom = prevZoom
    }
  }

  async function exportPNG() {
    store.deselectAll() // drop handles before they can be captured
    await nextTick()
    const url = await capture(htmlToImage.toPng)
    const i = store.pages.findIndex((p) => p.id === store.activeId)
    const suffix = store.pages.length > 1 ? `-${i + 1}` : ''
    download(url, `${fileBase(store.name)}${suffix}.png`)
  }

  function exportJSON() {
    const blob = new Blob([store.toJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    download(url, `${fileBase(store.name)}.json`)
    URL.revokeObjectURL(url)
  }

  return { exportPNG, exportJSON }
}
