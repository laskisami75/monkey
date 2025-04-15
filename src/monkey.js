// Version 25

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
  if (isctor(s))
    return `${s.name}`
  return Object.prototype.toString.call(s).slice(8, -1)
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
function copy(text) {
  navigator.clipboard.writeText(text)
}
function saveAs(blob, name) {
  const a = elem('a[style="display: none;"]')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = name
  
  body.append(a)
  a.click()
  
  a.remove()
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
  const { tag, id, classes, attribs } = selector(sel ?? 'div')
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
    let fn = isfn(sel) ? sel : s => s.matches(sel)
    
    let n = this
    while (n) {
      if (fn(n))
        return n
      n = n.parentElement
    }
  },
})
define(Node.prototype, {
  serialize() {
    return new XMLSerializer().serializeToString(this)
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