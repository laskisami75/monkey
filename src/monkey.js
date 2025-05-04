
const MONKEY_VERSION = 39
console.log(`Monkey version: ${MONKEY_VERSION}`)

//====== Shorthands ======
const GeneratorFunction = function*(){}.constructor
const Generator = function*(){}.constructor.prototype
const AsyncGeneratorFunction = async function*(){}.constructor
const AsyncGenerator = async function*(){}.constructor.prototype
const AsyncFunction = async function(){}.constructor
const ent = Object.entries
const obj = Object.fromEntries
const arr = Array.from
const has = Reflect.has
const get = Reflect.get
const set = Reflect.set
const del = Reflect.deleteProperty
const keys = Reflect.ownKeys
const call = Reflect.apply
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
// Math functions
// Iterator extensions

//====== Constants ======
const allTags = [
  'a',          'abbr',       'acronym',   'address', 
  'applet',     'area',       'article',   'aside',   
  'audio',      'b',          'base',      'basefont',
  'bdi',        'bdo',        'bgsound',   'big',     
  'blink',      'blockquote', 'body',      'br',      
  'button',     'canvas',     'caption',   'center',  
  'cite',       'code',       'col',       'colgroup',
  'content',    'data',       'datalist',  'dd',      
  'decorator',  'del',        'details',   'dfn',     
  'dir',        'div',        'dl',        'dt',      
  'element',    'em',         'embed',     'fieldset',
  'figcaption', 'figure',     'font',      'footer',  
  'form',       'frame',      'frameset',  'h1',      
  'h2',         'h3',         'h4',        'h5',      
  'h6',         'head',       'header',    'hgroup',  
  'hr',         'html',       'i',         'iframe',  
  'img',        'input',      'ins',       'isindex', 
  'kbd',        'keygen',     'label',     'legend',  
  'li',         'link',       'listing',   'main',    
  'map',        'mark',       'marquee',   'menu',    
  'menuitem',   'meta',       'meter',     'nav',     
  'nobr',       'noframes',   'noscript',  'object',  
  'ol',         'optgroup',   'option',    'output',  
  'p',          'param',      'plaintext', 'pre',     
  'progress',   'q',          'rp',        'rt',      
  'ruby',       's',          'samp',      'script',  
  'section',    'select',     'shadow',    'small',   
  'source',     'spacer',     'span',      'strike',  
  'strong',     'style',      'sub',       'summary', 
  'sup',        'table',      'tbody',     'td',      
  'template',   'textarea',   'tfoot',     'th',      
  'thead',      'time',       'title',     'tr',      
  'track',      'tt',         'u',         'ul',      
  'var',        'video',      'wbr',       'xmp',     
]
const voidTags = [
  'area',       'base',       'br',        'col',
  'embed',      'hr',         'img',       'input',
  'link',       'meta',       'param',     'source',
  'track',      'wbr',
]

//====== Type functions ======
function type(s) {
  if (s === null)
    return 'null'
  if (s === undefined)
    return 'undefined'
  if (Array.isArray(s))
    return 'array'
  if (typeof s == 'object' && is(s, RegExp))
    return 'regex'
  if (typeof s == 'object' && has(s, Symbol.iterator))
    return 'iterator'
  return typeof s
}
function whatis(s) {
  return call(Object.prototype.toString, s, []).slice(8, -1)
}
function is(s, t) {
  return s instanceof t
}
function isnull(s) { return s == null }
function isundef(s) { return s == undefined }
function isstr(s) { return type(s) == 'string' }
function isnum(s) { return type(s) == 'number' }
function isbool(s) { return type(s) == 'boolean' }
function issym(s) { return type(s) == 'symbol' }
function isobj(s) { return type(s) == 'object' }
function isfn(s) { return type(s) == 'function' }
function isarr(s) { return type(s) == 'array' }
function isiter(s) { return type(s) == 'iterator' }
function isregex(s) { return type(s) == 'regex' }
function isgen(s) { return is(s, Generator) }
function isprim(s) { return isnull(s) || isundef(s) || isstr(s) || isnum(s) || isbool(s) || issym(s) }

//====== Style management =======
function styled(style) {
  function hasStyles(el) {
    const comp = el.computedStyle
    return ent(style).every(([key, val]) => comp[key] == val)
  }
  return $$('*')
    .filter(el => hasStyles(el))
}
function styleDelta(el) {
  const div = elem('[style="display: none !important"]')
  const shadow = div.attachShadow({ mode: 'open' })
  const unstyled = elem(el.localName)
  
  body.append(div)
  shadow.append(unstyled)
  
  const defStyle = unstyled.computedStyle
  const elemStyle = el.computedStyle
  for (const key of keys(elemStyle)) {
    if (defStyle[key] == elemStyle[key])
      delete elemStyle[key]
  }
  
  div.remove()
  
  return elemStyle
}

//====== UI helpers ======
const dialogCss = `
:root {
  --text: #e3e9f1;
  --back: #1e2949;
  --dark: #0b1926;
  --actv: #2a3b7e;
  --high: #008dd5;
}
* {
  box-sizing: border-box;
  color: var(--text);
  margin: 0;
}

.dialog {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / .4);
  z-index: 9000;
}
.dialog > * {
  width: 50%;
  background: var(--back);
  border-radius: .4em;
}
.stack {
  display: grid;
}
.group {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
}

.p1 { padding:  .3rem; gap:  .3rem; }
.p2 { padding:  .6rem; gap:  .6rem; }
.p3 { padding:  .9rem; gap:  .9rem; }
.p4 { padding: 1.2rem; gap: 1.2rem; }

button {
  font-size: 1em;
  padding: .5em 1.25em;
  border-radius: .4em;
  background: var(--dark);
  user-select: none;
  outline: none;
  border: none;
  transition: background .15s linear;
}
button.active {
  background: var(--actv);
}
`
function dialog() {
  const root = elem('div')
  const shadow = root.attachShadow({ mode: 'open' })
  
  const style = elem('style', dialogCss)
  const dlg = elem('.dialog',
    elem('.stack.p2',
      elem('button#vp20', '2.0x viewport'),
      elem('button#vp15', '1.5x viewport'),
      elem('button#vp10', '1.0x viewport'),
      elem('button#edit', 'Open editor'),
    )
  )
  
  dlg.onclick = e => e.target == dlg && root.remove()
  
  shadow.append(style, dlg)
  return root
}

//====== Utility functions ======
function define(type, defs) {
  return defProps(type, getDescs(defs))
}
function char(i) {
  return String.fromCharCode(i)
}
function rewrite(css, js, html) {
  document.open()
  document.write(`<!DOCTYPE html>
  <html>
  <head>
  ${css}
  ${js}
  </head>
  <body>
  ${html}
  </body>
  </html>`)
  document.close()
}
function deentity(text) {
  const el = elem('textarea')
  el.innerHTML = text
  const str = el.value
  el.remove()
  return str
}
function entity(text) {
  return text
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
function range(a, b) {
  if (b == undefined)
    return range(0, a)
  return Array.from({ length: b - a }, (_, i) => a + i)
}
function html(text) {
  return new DOMParser().parseFromString(text, 'text/html')
}
function xml(text) {
  return new DOMParser().parseFromString(text, 'text/xml')
}
function serialize(node) {
  return new XMLSerializer().serializeToString(node)
}
function saveAs(blob, name) {
  const url = URL.createObjectURL(blob)
  GM_download(url, name)
  URL.revokeObjectURL(url)
}
function stopExecute(allowed = [location.origin]) {
  new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.localName == 'script') {
          if (!allowed.some(s => n.src.startsWith(s))) {
            n.textContent = ''
            n.remove()
          }
        }
      }
    }
  })
  .observe(document, { childList: true, subtree: true })
}
function animate() {
  //TODO
}

//====== Utility async functions ======
function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
function GM_fetch(url, opt = {}) {
  return new Promise(resolve => {
    GM_xmlhttpRequest({
      ...opt,
      url,
      onload(e) {
        resolve(e.response)
      }
    })
  })
}

//====== Observer helpers ======
function mutationObserver(root, sel, fn) {
  if (fn == undefined) {
    fn = sel
    sel = undefined
  }
  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (sel == undefined || n.matches(sel))
          fn(n)
      }
    }
  })
  const opt = { childList: true, subtree: true }
  obs.observe(root, opt)
  return obs
}
function attributeObserver(root, fn, ...names) {
  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      fn(m.target, m.attributeName)
    }
  })
  const opt = { attributes: true, subtree: true, attributeFilter: names || undefined }
  obs.observe(root, opt)
  return obs
}

//====== Utility tagged templates ======
function raw(strings, ...rest) {
  const raw = strings.raw.map(s => s.replaceAll(String.raw`\$`, '$'))
  return String.raw({ raw }, ...rest)
}
function regex(flag, ...rest) {
  if (!isstr(flag))
    return regex('')(flag, ...rest)
  return (strings, ...rest) => {
    return new RegExp(raw(strings, ...rest), flag)
  }
}
function imp(strings, ...rest) {
  return String.raw(strings, ...rest)
    .replaceAll('!important', '')
    .replaceAll(';', ' !important;')
    .replaceAll(' !unimportant !important;', ';')
}

//====== Utility extensions ======
define(RegExp, {
  escape(str) {
    return str.replace(/[()\[\]{}|\\^$*+?.]/g, '\\$&')
  },
})
define(String.prototype, {
  toInt() {
    return parseInt(this.match(/(-?\d+)/)[0])
  },
  toFloat() {
    return parseFloat(this.match(/(-?\.\d+)|(-?\d+\.\d+)|(-?\d+)/)[0])
  },
  toNumbers() {
    return this.match(/(-?\.\d+)|(-?\d+\.\d+)|(-?\d+)/g)
      .map(s => parseFloat(s))
  },
  test(re) {
    return re.test(this)
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
  mask(re) {
    return this.matchAll(re)
      .reduce((s, n, i) => {
        s.str = s.str.replace(n[0], `\0${char(i+1)}`)
        s.rep.push(n[0])
        return s
      },
      {
        str: this.replaceAll('\0', '\0\0'),
        rep: [],
        replaceMask(re, repl) {
          for (let i = 0; i < this.rep.length; i++)
            this.rep[i] = this.rep[i].replace(re, repl)
        },
        unmask(str) {
          const rep = this.rep
          function _unmask(str) {
            for (let i = 0; i < rep.length; i++)
              str = str.replace(regex`(?<!\0)\0${char(i+1)}`, rep[i])
            str = str.replaceAll('\0\0', '\0')
            return str
          }
          
          str ??= this.str
          if (isstr(str))
            return _unmask(str)
          else if (isarr(str))
            return str.map(s => _unmask(s))
        },
      })
  },
  trimStart(re = /\s+/) {
    if (isstr(re))
      re = regex`^(?:${RegExp.escape(re)})+`
    else
      re = regex`^${re.source.replace(/^\^/, '')}`
    return this.replace(re, '')
  },
  trimEnd(re = /\s+/) {
    if (isstr(re))
      re = regex`(?:${RegExp.escape(re)})+$`
    else
      re = regex`${re.source.replace(/\$$/, '')}$`
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

//====== Location ======
define(Location.prototype, {
  get params() {
    const location = this
    const params = new URLSearchParams(this.search)
    
    return define(obj(params.entries()), {
      set(key, value) {
        this[key] = value
        params.set(key, value)
        location.search = params.toString()
      },
      get(key) {
        return params.get(key)
      },
    })
  }
})

//====== DOM functions ======
function $(sel, root) {
  return (root ?? document).querySelector(sel)
}
function $$(sel, root) {
  return arr((root ?? document).querySelectorAll(sel))
}
function selector(sel = '') {
  const masked = sel.trim().mask(/"[^"]+"|'[^']+'/g)
  const parts = masked.unmask(masked.str.split(/(?=\#|\.|\[)/g))
  const output = {
    tag: 'div',
    classes: [],
    attrs: [],
  }
  /*function attr(s) {
    const [name, value] = [...s.split('='), '']
    return { name, value: value.trim('"').trim('\'') }
  }*/
  function attr(s) {
    const i = s.indexOf('=')
    if (i == -1)
      return { name: s, value: '' }
    return {
      name: s.slice(0, i),
      value: s.slice(i + 1).trim('"').trim('\'')
    }
  }
  for (const part of parts) {
    if (part.startsWith('#'))
      output.id = part.slice(1)
    else if (part.startsWith('.'))
      output.classes.push(part.slice(1))
    else if (part.startsWith('['))
      output.attrs.push(attr(part.slice(1, -1)))
    else
      output.tag = part
  }
  return output
}
function elem(sel, ...children) {
  const { tag, id, classes, attrs } = selector(sel)
  const el = document.createElement(tag)
  if (id) {
    el.id = id
    elem[id] = el
  }
  if (classes.length > 0)
    el.classList.add(...classes)
  for (const attr of attrs)
    el.setAttribute(attr.name, attr.value)
  el.append(...children.filter(s => s))
  return el
}
function frag(...children) {
  const el = new DocumentFragment()
  el.append(...children.filter(s => s))
  return el
}

//====== Collections ======
define(Window.prototype, {
  get classCounts() {
    return arr($$('[class]')
        .flatMap(s => arr(s.classList))
        .reduce((s, n) => s.set(n, (s.get(n) ?? 0) + 1), new Map())
        .entries())
        .sort((a, b) => b[1] - a[1])
  },
  get allFixedPos() {
    return $$('*')
      .filter(s => s.computedStyle.position == 'fixed' || s.computedStyle.position == 'sticky')
  },
})

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
  fromPoint(x, y) {
    return this.elementFromPoint(x, y)
  },
})
define(Element.prototype, {
  get rect() {
    return this.getBoundingClientRect()
  },
  get mark() {
    if (this.innerHTML == '')
      return this.outerHTML
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
  get computedStyle() {
    return arr(this.getComputedStyleMap())
      .reduce((s, n) => assign(s, { [n[0]]: n[1][0].toString() }), {})
  },
  *chain() {
    let node = this
    while (node) {
      yield node
      node = node.parentElement
    }
  },
  closest(sel) {
    let fn = isfn(sel) ? sel : s => s.matches(sel)
    
    let n = this
    while (n) {
      if (fn(n))
        return n
      n = n.parentElement
    }
  },
  fromPoint(x, y) {
    return document.elementsFromPoint(x, y)
      .filter(s => this.contains(s))
  },
})
define(Node.prototype, {
  get parent() {
    return this.parentElement
  },
  get next() {
    return this.nextElementSibling
  },
  get prev() {
    return this.previousElementSibling
  },
  get text() {
    return this.textContent
  },
  set text(value) {
    this.textContent = value
  },
  swap(node) {
    const temp = this.nextSibling
    this.parent.insertBefore(this, node.nextSibling)
    this.parent.insertBefore(node, temp)
  },
  remove() {
    this.parent.removeChild(this)
  },
  replaceWith(node) {
    this.parent.replaceChild(node, this)
    return node
  },
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