import { onBeforeUnmount, onMounted } from 'vue'

type ImageFit = 'cover' | 'contain' | 'fill'

interface PendingImageImport {
  id: string
  name: string
  dataUrl: string
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

  async function addImageLayer(item: PendingImageImport) {
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

  async function poll() {
    if (polling) return
    polling = true
    try {
      const response = await $fetch<{ item: PendingImageImport | null }>('/api/agent/image-import')
      if (!response.item) return
      await addImageLayer(response.item)
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

  onMounted(() => {
    void poll()
    timer = setInterval(poll, 1000)
  })
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })
}
