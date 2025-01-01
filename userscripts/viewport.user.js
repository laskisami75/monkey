// ==UserScript==
// @name        3 FINGER SLIDE
// @match       http*://*/*
// @grant       none
// @run-at      document-end
// ==/UserScript==

//=============================================================
const arr = s => Array.from(s)
const ent = s => Object.entries(s)
const obj = s => Object.fromEntries(s)
const keys = s => Object.keys(s)
const vals = s => Object.values(s)
const own = (s, p) => Object.hasOwn(s, p)

const json = s => JSON.stringify(s)
const mutate = (s, fn) => (fn(s), s)
const assign = (...rest) => Object.assign(...rest)

const defProps = (s, p) => Object.defineProperties(s, p)
const getDescs = s => Object.getOwnPropertyDescriptors(s)
const getProto = s => Object.getPrototypeOf(s)

const GeneratorFunction = (function*(){}).constructor

function $(sel, root = document) {
  return root.querySelector(sel)
}
function $$(sel, root = document) {
  return arr(root.querySelectorAll(sel))
}
function html(s) {
  return new DOMParser().parseFromString(s, 'text/html')
}
function serialize(s) {
  const helper = document.createElement('textarea')
  helper.innerHTML = new XMLSerializer().serializeToString(s)
  return helper.value
}

function imp(s, ...rest) {
  const re = /(?:\s*!important)*\s*;\s*$/gm
  return String.raw({ raw: s }, ...rest)
    .replace(re, ' !important;')
    .replace('!unimportant !important;', ';')
}
function selector(sel) {
  const re = [
    /(?<tag>[\w\d-_]+)/,
    /#(?<id>[\w\d-_]+)/,
    /\.(?<cl>[\w\d-_]+)/,
    /\[(?<key>[\w\d-_]+)(?<value>)\]/,
    /\[(?<key>[\w\d-_]+)=(?<value>[\w\d-_]+)\]/,
    /\[(?<key>[\w\d-_]+)="(?<value>[^"]+)"\]/,
    /\[(?<key>[\w\d-_]+)='(?<value>[^']+)'\]/,
  ]
  function* consecutively(sel, ...regexes) {
    let index = 0
    while (index < sel.length) {
      const sticky = s => {
        const re = RegExp(s.source, 'y')
        re.lastIndex = index
        return re
      }
      const regex = regexes
        .map(s => sticky(s))
        .map(s => s.exec(sel))
        .find(s => s)

      if (regex == null)
        throw new Error('could not chain matcher')

      index += regex[0].length
      yield regex.groups
    }
  }
  const seq = arr(consecutively(sel, ...re))

  return {
    tag: seq.find(s => s.tag)?.tag ?? 'div',
    id: seq.find(s => s.id)?.id,
    classes: seq.filter(s => s.cl).map(s => s.cl),
    attrs: seq.filter(s => s.key).map(s => [s.key, s.value]),
  }
}
function elem(sel, ...children) {
  const { tag, id, classes, attrs } = selector(sel)
  const el = document.createElement(tag)

  if (id != undefined)
    el.id = id
  for (const cl of classes)
    el.classList.add(cl)
  for (const [key, val] of attrs)
    el.setAttribute(key, val)

  const isstr = s => typeof s == 'string'
  const textelem = s => isstr(s) ? new Text(s) : s
  for (const child of children)
    el.append(textelem(child))
  return el
}
//=============================================================

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
    `width=${384 * factor}`,
    `initial-scale=1.0`,
    `maximum-scale=1.0`,
    `user-scalable=no`,
  ]
  const meta = elem(`meta[name="viewport"][content="${view.join(',')}"]`)
  document.head.append(meta)
}
function setScaling(factor) {
  const comp = getComputedStyle(document.documentElement)
  const docw = comp['width']
  const doch = comp['height']
  //const zoomFactor = size / 384
  const styleText = imp`
  html {
    --zoom-factor: calc(1 / ${factor});
    scale: var(--zoom-factor);
    width: calc(${docw} / var(--zoom-factor));
    /*height: calc(${doch} / var(--zoom-factor));*/
    transform-origin: 0 0;
  }
  `
  $('style#zoom-factor')?.remove()
  document.head.append(
    elem('style#zoom-factor', styleText)
  )
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
  const btnCustom = elem('button', 'Custom viewport scale')
  const btnClose = elem('button', 'Close')
  const dialog = elem('dialog',
    elem('.stack',
      btnLarge,
      btnMedium,
      btnSmall,
      //btnCustom,
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
    //setViewport(384 * 2.0)
    localStorage.setItem('viewOpt', 'v2.0')
    applyPageSettings()
    closeDialog()
  }
  btnMedium.onclick = e => {
    //setViewport(384 * 1.5)
    localStorage.setItem('viewOpt', 'v1.5')
    applyPageSettings()
    closeDialog()
  }
  btnSmall.onclick = e => {
    //setViewport(384 * 1.0)
    localStorage.setItem('viewOpt', 'v1.0')
    applyPageSettings()
    closeDialog()
  }
  btnCustom.onclick = e => {
    const factor = prompt()
    setViewport(384 * factor)
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
    touches.size == 3 && vals(touches).every(isSwipeRight)
  if (isThreeSwipes) {
    makeDialog()
  }

  for (const touch of e.changedTouches) {
    touches.delete(touch.identifier)
  }
})











