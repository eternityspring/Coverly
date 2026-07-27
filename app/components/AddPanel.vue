<script setup lang="ts">
const store = useEditorStore()

function addText(preset: 'heading' | 'subheading' | 'body') {
  const map = {
    heading: { text: 'Heading', fontSize: 72, fontWeight: 900, height: 110, width: 480 },
    subheading: { text: 'Subheading', fontSize: 40, fontWeight: 600, height: 70, width: 420 },
    body: { text: 'A line of body text', fontSize: 24, fontWeight: 400, height: 50, width: 360 },
  } as const
  store.addElement('text', { ...map[preset], textAlign: 'left' })
}

function onUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const src = reader.result as string
    const img = new Image()
    img.onload = () => {
      const ab = store.artboard
      const scale = Math.min((ab.width * 0.7) / img.width, (ab.height * 0.7) / img.height, 1)
      store.addElement('image', {
        src,
        width: Math.round(img.width * scale),
        height: Math.round(img.height * scale),
      })
    }
    img.src = src
  }
  reader.readAsDataURL(file)
  input.value = ''
}
</script>

<template>
  <aside class="add-panel">
    <div class="panel-tag">Text</div>
    <button class="add-item" title="Heading" @click="addText('heading')">
      <span class="glyph"><Icon name="lucide:heading" /></span>
      <span>Heading</span>
    </button>
    <button class="add-item" title="Body text" @click="addText('body')">
      <span class="glyph"><Icon name="lucide:type" /></span>
      <span>Body</span>
    </button>

    <div class="add-divider" />
    <div class="panel-tag">Shapes</div>

    <button class="add-item" title="Rectangle" @click="store.addElement('rect')">
      <span class="glyph"><Icon name="lucide:square" /></span>
      <span>Rect</span>
    </button>
    <button class="add-item" title="Ellipse" @click="store.addElement('ellipse')">
      <span class="glyph"><Icon name="lucide:circle" /></span>
      <span>Circle</span>
    </button>
    <button class="add-item" title="Triangle" @click="store.addElement('triangle')">
      <span class="glyph"><Icon name="lucide:triangle" /></span>
      <span>Triangle</span>
    </button>

    <div class="add-divider" />
    <div class="panel-tag">Media</div>

    <label class="add-item" title="Upload image">
      <span class="glyph"><Icon name="lucide:image" /></span>
      <span>Image</span>
      <input type="file" accept="image/*" hidden @change="onUpload" />
    </label>
  </aside>
</template>
