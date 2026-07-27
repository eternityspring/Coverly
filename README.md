# Coverly — DOM-native Cover & Card Editor

A Canva-style visual editor for **social-media covers and text-image cards**, built
with **Nuxt 4 + Vue 3 + Pinia**.

Every element is a real **DOM/SVG node** (absolutely positioned `div` / `img` /
`clip-path`) driven by Pointer Events — there is **no HTML `<canvas>` element**
anywhere in the app. That means crisp text, real fonts, copy-pasteable content,
and inspectable, accessible output.

> This open-source build ships with a **single blank canvas** so you can start
> from scratch. Add your own presets in `app/data/templates.ts`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

## Features

- **Elements**: text, rectangle, ellipse, triangle, divider, image (upload as data URL)
- **Two layout modes**: free (absolute canvas, great for covers) and flow
  (stacked, content-driven height — great for text cards)
- **Direct manipulation**: drag to move, 8 resize handles, rotate handle
  (rotation-correct resize math, zoom-aware)
- **Rich inline text editing**: double-click any text element (Tiptap)
- **Properties panel**: position/size/rotation, opacity, fill, border, corner
  radius, font family/size/weight/italic/align/line-height/color, image fit
- **Pages**: multi-page designs with thumbnails
- **Layers**: bring forward / backward / to front / to back
- **History**: undo / redo with interaction-grouped snapshots
- **Zoom**: in / out / fit
- **Save & load**: export / import the whole design as JSON

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Del` / `Backspace` | delete selected |
| `⌘/Ctrl + D` | duplicate |
| `⌘/Ctrl + Z` | undo |
| `⌘/Ctrl + Shift + Z` / `Ctrl + Y` | redo |
| `↑ ↓ ← →` | nudge 1px (`Shift` = 10px) |
| `⌘/Ctrl + ] / [` | bring forward / send backward |
| `Esc` | deselect |

## Architecture

```
app/
  app.vue                    layout + global keyboard shortcuts
  stores/editor.ts           Pinia store: pages, elements, selection, history, z-order
  types/editor.ts            element + artboard types
  data/templates.ts          template list (ships with one blank canvas)
  components/
    TopBar.vue               title, undo/redo, zoom, import/export
    IconRail.vue             left tool rail
    LeftPanel.vue            contextual tool panel (templates/assets/text/image/background)
    EditorStage.vue          the scaled artboard surface
    EditorElement.vue        one element + drag/resize/rotate + inline text edit
    PropertiesPanel.vue      right rail — context-aware property controls
    PagesBar.vue             multi-page strip
    TemplatePicker.vue       first-load template picker
  assets/css/main.css        all styling
```

State lives in the Pinia store; the artboard is a plain `div` scaled with a CSS
`transform`, and each element renders itself and handles its own pointer
interactions (deltas divided by `zoom`, resize done in the element's local
rotated frame so it stays correct at any angle).

## License

[MIT](./LICENSE)
