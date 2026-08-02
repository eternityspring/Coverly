import { onBeforeUnmount, onMounted } from 'vue'

type ImageFit = 'cover' | 'contain' | 'fill'

interface PendingImageImport {
  id: string
  kind: 'image' | 'document'
  name: string
  dataUrl?: string
  document?: Record<string, unknown>
  placement?: {
    x?: number
    y?: number
    width?: number
    height?: number
    objectFit?: ImageFit
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Coverly could not decode the imported image.'))
    image.src = src
  })
}

export function useAgentImageImport() {
  const store = useEditorStore()
  let timer: ReturnType<typeof setInterval> | undefined
  let polling = false
  let clientId = ''

  async function addImageLayer(item: PendingImageImport) {
    if (!item.dataUrl) throw new Error('The imported image payload is missing.')
    const image = await loadImage(item.dataUrl)
    const artboard = store.artboard
    const requested = item.placement || {}
    let width = requested.width
    let height = requested.height

    if (width && !height) height = width * (image.height / image.width)
    if (height && !width) width = height * (image.width / image.height)
    if (!width || !height) {
      const maxHeight = artboard.layout === 'flow' ? image.height : artboard.height * 0.7
      const scale = Math.min((artboard.width * 0.7) / image.width, maxHeight / image.height, 1)
      width = image.width * scale
      height = image.height * scale
    }

    store.closePicker()
    store.addElement('image', {
      src: item.dataUrl,
      name: item.name,
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
      x: requested.x,
      y: requested.y,
      objectFit: requested.objectFit || 'cover',
    })
  }

  function importLayeredDocument(item: PendingImageImport) {
    if (!item.document) throw new Error('The layered document payload is missing.')
    store.loadJSON(JSON.stringify(item.document))
    store.closePicker()
    const top = store.elements[store.elements.length - 1]
    store.select(top?.id || null)
  }

  async function heartbeat() {
    if (!clientId) return
    await $fetch('/api/agent/editor-session', {
      method: 'POST',
      body: {
        clientId,
        documentName: store.name,
        pageId: store.activeId,
        visible: document.visibilityState === 'visible',
        focused: document.hasFocus(),
      },
    })
  }

  async function poll() {
    if (polling || !clientId) return
    polling = true
    try {
      const response = await $fetch<{ item: PendingImageImport | null }>('/api/agent/image-import', {
        query: { clientId },
      })
      if (!response.item) return
      if (response.item.kind === 'document') importLayeredDocument(response.item)
      else await addImageLayer(response.item)
      await $fetch('/api/agent/image-import', {
        method: 'DELETE',
        body: { id: response.item.id },
      })
    } catch (error) {
      // The editor remains fully usable when the local bridge is unavailable.
      if (import.meta.dev) console.debug('[agent image import]', error)
    } finally {
      polling = false
    }
  }

  async function tick() {
    try {
      await heartbeat()
      await poll()
    } catch (error) {
      if (import.meta.dev) console.debug('[agent editor session]', error)
    }
  }

  onMounted(() => {
    clientId =
      sessionStorage.getItem('coverly:agent-client-id') ||
      `editor_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`
    sessionStorage.setItem('coverly:agent-client-id', clientId)
    void tick()
    timer = setInterval(tick, 1000)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
  })
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    window.removeEventListener('focus', tick)
    document.removeEventListener('visibilitychange', tick)
  })
}
