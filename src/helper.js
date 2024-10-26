
function arr(s) {
  return Array.from(s)
}
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
  return new XMLSerializer().serializeToString(s)
}
function deentity(input) {
  const el = elem('textarea')
  el.textContent = input
  const s = el.value
  el.remove()
  return s
}

function imp(raw, ...rest) {
  const s = String.raw({ raw }, ...rest)
  return important(s)
}
function important(s) {
  return s.replace(/\s*(?:!important)?\s*;/g, ' !important;')
}

function elem(name, props = {}, ...children) {
  const el = document.createElement(name)
  for (const [key, val] of Object.entries(props))
    el[key] = val
  const textelem = s => typeof s == 'string' ? new Text(s) : s
  for (const c of children)
    el.append(textelem(c))
  return el
}
function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

Object.defineProperties(this, {
  head: {
    get() { return document.head }
  },
  body: {
    get() { return document.body }
  },
  docElem: {
    get() { return document.documentElement }
  },
})

function allowImageReload() {
  $$('img')
  .forEach(s => {
    s.onclick = e => {
      if (e.target.complete && e.target.naturalWidth == 0)
        e.target.src = `${e.target.src}?${Date.now()}`
    }
  })
}





















