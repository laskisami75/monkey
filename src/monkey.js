
const ent = Object.entries
const obj = Object.fromEntries
const arr = Array.from
const has = Reflect.has
const get = Reflect.get
const set = Reflect.set
const del = Reflect.deleteProperty
const keys = Reflect.ownKeys
const values = Object.values
const assign = Object.assign
const create = Object.create
const getProto = Object.getPrototypeOf
const setProto = Object.setPrototypeOf
const getDescs = Object.getOwnPropertyDescriptors
const getDesc = Object.getOwnPropertyDescriptor
const defProps = Object.defineProperties
const defProp = Object.defineProperty

// === Missing ===
// Type functions
// Math functions
// Iterator extensions

//====== Utility functions ======
function define(type, defs) {
  return defProps(type, getDescs(defs))
}
function style(css) {
  head.append(elem('style', css))
}

//====== Utility async functions ======
function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
function GM_fetch(url) {
  return new Promise(resolve => {
    GM_xmlhttpRequest({
      url,
      onload(e) {
        resolve(html(e.responseText))
      }
    })
  })
}

//====== Utility tagged templates ======
function raw(strings, ...rest) {
  const raw = strings.raw.map(s => s.replaceAll(String.raw`\$`, '$'))
  return String.raw({ raw }, ...rest)
}
function imp(strings, ...rest) {
  return String.raw(strings, ...rest)
    .replaceAll('!important', '')
    .replaceAll(';', '!important;')
}

//====== Utility extensions ======
define(RegExp, {
  escape(str) {
    return str.replace(/[()\[\]{}|\\^$*+?.]/g, '\\$&')
  },
})
define(String.prototype, {
  toInt() {
    return parseInt(this)
  },
  toFloat() {
    return parseFloat(this)
  },
  toNumbers() {
    return this.match(/(-?\.\d+)|(-?\d+\.\d+)|(-?\d+)/g)
      .map(s => parseFloat(s))
  },
  test(re) {
    return re.test(this)
  },
  parseHTML() {
    return new DOMParser().parseFromString(this, 'text/html')
  },
  *seqMatch(...rest) {
    let i = 0
    while (i < this.length) {
      const m = rest.map(s => this.slice(i).match(s)).find(s => s)
      if (!m)
        throw new Error('None of the regexes matched the current sequence', { cause: { sequence: this.slice(i) }})
      yield m
      
      i += m[0].length + m.index
    }
  },
  trimStart(re = /\s+/) {
    if (isstr(re))
      re = new RegExp(`^${RegExp.escape(re)}+`)
    else
      re = new RegExp(`^${re.source.replace(/^\^/, '')}`)
    return this.replace(re, '')
  },
  trimEnd(re = /\s+/) {
    if (isstr(re))
      re = new RegExp(`${RegExp.escape(re)}+$`)
    else
      re = new RegExp(`${re.source.replace(/\$$/, '')}\$`)
    return this.replace(re, '')
  },
  trim(re = /\s+/) {
    return this.trimStart(re).trimEnd(re)
  },
})
define(Number.prototype, {
  clamp(min, max) {
    return max(min, min(max, this))
  },
  fixed(digits) {
    return this.toFixed(digits)
      .replace(/(?<=\..*?)0+$/, '')
      .replace(/\.$/, '')
      .replace(/(?<=^-)0\.|^0\./, '.')
  },
})
define(Storage.prototype, {
  list() {
    return range(this.length)
      .map(s => this.key(s))
      .map(s => [s, this.getItem(s)])
  },
  get(key) {
    const str = this.getItem(key)
    if (str)
      return JSON.parse(str)
  },
  set(key, value) {
    const str = JSON.stringify(value)
    this.setItem(key, str)
  },
})

//====== DOM functions ======
function $(sel, root) {
  return (root ?? document).querySelector(sel)
}
function $$(sel, root) {
  return arr((root ?? document).querySelectorAll(sel))
}
function selector(sel) {
  return sel.seqMatch(
      /^\[(?<name>[^=]+)="(?<value>[^"]+)"\]/,
      /^\[(?<name>[^=]+)='(?<value>[^']+)'\]/,
      /^\[(?<name>[^=]+)=(?<value>\S+)\]/,
      /^\[(?<name>[^=]+)(?<value>)\]/,
      /^\.(?<class>[^\.\#\[\]]+)/,
      /^\#(?<id>[^\.\#\[\]]+)/,
      /^(?<tag>[^\.\#\[\]]+)/,
    )
    .map(s => s.groups)
    .reduce((s, n, i) => {
      if (n.tag && i == 0)
        s.tag = n.tag
      if (n.id)
        s.id = n.id
      if (n['class'])
        s.classes.push(n['class'])
      if (n._name)
        s.attribs.push(n)
      return s
    },
    {
      tag: 'div',
      classes: [],
      attribs: [],
    })
}
function elem(sel, ...children) {
  const { tag, id, classes, attribs } = selector(sel)
  const el = document.createElement(tag)
  if (id)
    el.id = id
  if (classes.length > 0)
    el.classList.add(...classes)
  attribs.forEach(s => el.setAttribute(s.name, s.value))
  el.append(...children.filter(s => s))
  return el
}

//====== DOM extensions ======
define(Window.prototype, {
  get doc() {
    return this.document
  },
  get docElem() {
    return this.document.documentElement
  },
  get head() {
    return this.document.head
  },
  get body() {
    return this.document.body
  },
  get html() {
    return new XMLSerializer().serializeToString(this.document)
  },
  get scrollableElements() {
    return $$('*')
      .filter(s => s.scrollable)
  },
  getClassCounts() {
    return $$('[class]')
      .flatMap(s => arr(s.classList))
      .reduce((s, n) => {
        if (!has(s, n))
          s[n] = 0
        s[n] += 1
        return s
      }, {})
  },
  elemFrom(x, y) {
    return document.elementFromPoint(x, y)
  },
})
define(Element.prototype, {
  get parent() {
    return this.parentElement
  },
  get next() {
    return this.nextElementSibling
  },
  get prev() {
    return this.previousElementSibling
  },
  get rect() {
    return this.getBoundingClientRect()
  },
  get mark() {
    return this.outerHTML.replace(this.innerHTML, '…')
  },
  get scrollable() {
    return this.scrollHeight > this.clientHeight
  },
  get scrollAmount() {
    return this.scrollTop / (this.scrollHeight - innerHeight)
  },
  get scrolledToEnd() {
    return n.scrollHeight - n.scrollTop <= n.rect.height
  },
  *chain() {
    let node = this
    while (node) {
      yield node
      node = node.parentElement
    }
  },
  swap(other) {
    const temp = this.nextElementSibling
    this.parentElement.insertBefore(this, other.nextElementSibling)
    this.parentElement.insertBefore(other, temp)
  },
  closest(sel) {
    if (isstr(sel))
      sel = s => s.matches(sel)
    
    let n = this
    while (n) {
      if (sel(n))
        return n
      n = n.parentElement
    }
  },
})
define(Node.prototype, {
  
})
define(EventTarget.prototype, {
  dispatch(type, props = {}) {
    this.dispatchEvent(new (class extends Event {
      constructor() {
        super(type, props)
        define(this, props)
      }
    })())
  },
})