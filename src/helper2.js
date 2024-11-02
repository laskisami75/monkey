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
  el.innerHTML = input
  const s = el.value
  el.remove()
  return s
}
function imp(raw, ...rest) {
  const s = String.raw({ raw }, ...rest)
  return s.replace(/\s*(?:!important)?\s*;/g, ' !important;')
}
​function elem(sel, props = {}, ...children) {
  const na = sel.match(/^[^#\.]+/g)?.at(0) ?? 'div'
  const id = sel.match(/(?<=#)[^#\.]+/g) ?? []
  const cl = sel.match(/(?<=\.)[^#\.]+/g) ?? []
  const el = document.createElement(na)
  
  for (const val of id.slice(0, 1))
    el.id = val
  for (const c of cl)
    el.classList.add(c)
  for (const [key, val] of Object.entries(props))
    el[key] = val

  const isstr = s => typeof s == 'string'
  const textelem = s => isstr(s) ? new Text(s) : s
  for (const c of children)
    el.append(textelem(c))
  return el
}

