
//=============================================================
const arr = s => Array.from(s)
const ent = s => Object.entries(s)
const obj = s => Object.fromEntries(s)

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

Object.assign(window, {
  arr, ent, obj,
  $, $$,
  html, serialize,
  selector, elem,
})