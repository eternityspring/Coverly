import { nextTick } from 'vue'

/**
 * Scales the active page so it fills the canvas area.
 *
 * The store's fitZoom() can only guess — it runs before layout exists and works
 * off fixed bounds — so this measures the real thing, and unlike fitZoom() it is
 * free to scale a small page up.
 */
export function useFitToView() {
  const store = useEditorStore()

  function measure(): number | null {
    const stage = document.querySelector('.stage') as HTMLElement | null
    const board = document.querySelector(
      '.page-view.active .artboard, .page-view.active .flow-board',
    ) as HTMLElement | null
    if (!stage || !board) return null

    const cs = getComputedStyle(stage)
    const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
    if (availW <= 0 || availH <= 0) return null

    // What is on screen is already scaled by the current zoom — `transform` for a
    // free artboard, CSS `zoom` for a flow card — so divide it back out to get the
    // page's own size. That is what makes a flow card measure correctly: its height
    // comes from its content, and no stored value describes it.
    const rect = board.getBoundingClientRect()
    const z = store.zoom || 1
    const w = rect.width / z
    const h = rect.height / z
    if (!w || !h) return null

    return Math.min(availW / w, availH / h)
  }

  async function fitToView() {
    // Wait for the layout, then for fonts: a flow card's height is text metrics,
    // so measuring before the webfonts land would fit to the fallback font's
    // height and leave the card cropped or floating.
    await nextTick()
    await (document.fonts?.ready ?? Promise.resolve())
    await nextTick()
    const scale = measure()
    if (scale) store.setZoom(scale)
  }

  return { fitToView }
}
