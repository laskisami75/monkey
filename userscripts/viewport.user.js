// ==UserScript==
// @name        3 FINGER SLIDE
// @match       *://*/*
// @grant       none
// @require     https://raw.githubusercontent.com/laskisami75/monkey/refs/heads/main/src/monkey-safe.js?1
// @run-at      document-end
// @noframes
// ==/UserScript==

//================= Adjustments =================
//const VIEWPORT_WIDTH = 640 // 384 576 768
const state = {
  isOpen: false,
}
//setViewport(VIEWPORT_WIDTH)
//===============================================

function applyPageSettings() {
  const opt = localStorage.getItem('viewOpt')
  if (opt == null)
    return
  if (opt.startsWith('v'))
    setViewport(parseFloat(opt.match(/[\d\.]+/)))
}
applyPageSettings()

function setViewport(factor) {
  const view = [
    `width=${screen.width * factor}`,
    `initial-scale=1.0`,
    `maximum-scale=1.0`,
    `user-scalable=no`,
  ]
  //const meta = elem(`meta[name="viewport"][content="${view.join(',')}"]`)
  const meta = elem('meta')
  meta.setAttribute('name', 'viewport')
  meta.setAttribute('content', view.join(','))
  document.head.append(meta)
}
function setScaling(factor) {
  //const comp = getComputedStyle(docElem)
  //const docw = comp['width']
  //const doch = comp['height']
  //const zoomFactor = size / screen.width
  const styleText = imp`
  html {
    --zoom-factor: calc(1 / ${factor});
    scale: var(--zoom-factor);
    width: calc(100% / var(--zoom-factor));
    height: calc(100% / var(--zoom-factor));
    transform-origin: 0 0;
  }
  `
  $('style#zoom-factor')?.remove()
  document.head.append(elem('style#zoom-factor', styleText))
}
function makeDialog() {
  if (state.isOpen)
    return

  const root = elem('separated-element')
  const shadow = root.attachShadow({ mode: 'open' })

  const css = `
:host {
  --bg:    oklch(21% .032 265); /* #111827 */
  --dark:  oklch(18% .032 265); /* #0c1322 */
  --light: oklch(27% .032 265); /* #171e2d */
  --text:  oklch(94% .032 265); /* #eaeaf8 */
}
* {
  font-size: calc(100vmax * (16 / ${screen.height}));
  color: var(--text);
  box-sizing: border-box;
  margin: 0;
}
dialog {
  background: var(--bg);
  width: 60vmin;
  margin: auto;
  padding: .8em;
  border: none;
  border-radius: .4em;
}
dialog::backdrop {
  backdrop-filter: brightness(.4);
}
dialog:not([open]) {
  display: none;
}
button {
  background: var(--light);
  padding: .5em 1em;
  border: none;
  border-radius: .4em;
  outline: none;
}
button:hover {
  filter: brightness(1.3);
}
.stack {
  display: grid;
  grid-template-columns: 1fr;
  row-gap: .6em;
}
`
  const btnLarge = elem('button', '2.0x viewport')
  const btnMedium = elem('button', '1.5x viewport')
  const btnSmall = elem('button', '1.0x viewport')
  const btnClose = elem('button', 'Close')
  const dialog = elem('dialog',
    elem('.stack',
      btnLarge,
      btnMedium,
      btnSmall,
      btnClose,
    )
  )

  function openDialog() {
    document.documentElement.append(root)
    shadow.append(elem('style', css), dialog)
    dialog.showModal()
    state.isOpen = true
  }
  function closeDialog() {
    root.style.setProperty('display', 'none')
    dialog.close()
    root.remove()
    state.isOpen = false
  }

  btnLarge.onclick = e => {
    //setViewport(screen.width * 2.0)
    localStorage.setItem('viewOpt', 'v2.0')
    applyPageSettings()
    closeDialog()
  }
  btnMedium.onclick = e => {
    //setViewport(screen.width * 1.5)
    localStorage.setItem('viewOpt', 'v1.5')
    applyPageSettings()
    closeDialog()
  }
  btnSmall.onclick = e => {
    //setViewport(screen.width * 1.0)
    localStorage.setItem('viewOpt', 'v1.0')
    applyPageSettings()
    closeDialog()
  }
  btnClose.onclick = e => {
    closeDialog()
  }
  openDialog()
}

let touches = new Map()
document.addEventListener('touchstart', e => {
  for (const touch of e.changedTouches) {
    touches.set(touch.identifier, {
      x0: touch.clientX,
      y0: touch.clientY,
    })
  }
})
document.addEventListener('touchend', e => {
  for (const touch of e.changedTouches) {
    touches.set(touch.identifier, {
      ...touches.get(touch.identifier),
      x1: touch.clientX,
      y1: touch.clientY,
    })
  }

  const isSwipeRight = s => s.x0 < s.x1
  const isThreeSwipes =
    touches.size == 3 && Object.values(touches).every(isSwipeRight)
  if (isThreeSwipes) {
    makeDialog()
  }

  for (const touch of e.changedTouches) {
    touches.delete(touch.identifier)
  }
})










