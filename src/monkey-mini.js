
define(globalThis, {
  VERSION: 11,
})
function info() {
  console.log(`monkey-mini.js (version: ${VERSION})`)
}

/*=============== helpers.js ===============*/
function arr(target, fn) {
  const array = Array.from(target, fn)
  if (!array.some(s => is(s, Promise)))
    return array
  return Array.fromAsync(target, fn)
}
function obj(entries) {
  return Object.fromEntries(entries)
}
function has(target, ...props) {
  return !isprim(target) && props.every(s => s in target)
}
function str(target) {
  if (target === null)
    return 'null'
  if (target === undefined)
    return 'undefined'
  if (isnullobj(target))
    return call(Object.prototype.toString, target)
  return call(Object.getPrototypeOf(target).toString, target)
}
function keys(target) {
  if (isprim(target))
    return []
  return Reflect.ownKeys(target)
}
function list(target) {
  const output = []
  for (const key of keys(target)) {
    if (isobj(target[key]))
      output.push(assign({ key, name: key }, target[key]))
    else
      output.push({ key, name: key, value: target[key] })
  }
  return output
}
function call(fn, thisArg, ...args) {
  return Reflect.apply(fn, thisArg, args)
}
function char(i) {
  if (isnum(i))
    return String.fromCharCode(i)
  return i.charCodeAt(0)
}
function desc(target, key) {
  return assign({ key }, Object.getOwnPropertyDescriptor(target, key))
}
function define(target, defines) {
  if (list(Object.getOwnPropertyDescriptors(defines)).every(s => isdesc(s.value)))
    return Object.defineProperties(target, defines)
  return Object.defineProperties(target, Object.getOwnPropertyDescriptors(defines))
}
function extend(target, defines) {
  defines = Object.getOwnPropertyDescriptors(defines)
  const preserve = {}
  const extensions = target[Symbol.extensions] ?? []
  for (const key of keys(defines)) {
    if (extensions.includes(key))
      continue
    if (issym(key))
      continue
    if (keys(target).includes(key))
      preserve[`_${key}`] = desc(target, key)
  }
  
  define(target, preserve)
  define(target, defines)
  define(target, { [Symbol.extensions]: keys(defines) })
  return target
}
function assign(target, ...args) {
  return Object.assign(target, ...args)
}
function wait(ms) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms)
  })
}
function raw(strings, ...args) {
  const raw = strings.raw.map(s => s.replaceAll(String.raw`\$`, '$'))
  return String.raw({ raw }, ...args)
}
function regex(flag, ...args) {
  if (!isstr(flag))
    return regex('')(flag, ...args)
  return (strings, ...args) => {
    return new RegExp(raw(strings, ...args), flag)
  }
}

/*=============== type.js ===============*/
const Generator = function*(){}.constructor.prototype

function type(s) {
  if (s === null)
    return 'null'
  if (s === undefined)
    return 'undefined'
  if (Array.isArray(s))
    return 'array'
  if (has(s, Symbol.iterator))
    return 'iterator'
  return typeof s
}
function is(s, t) {
  return s instanceof t
}

function isnull(s) { return s === null }
function isundef(s) { return s === undefined }
function isstr(s) { return typeof s == 'string' }
function isnum(s) { return typeof s == 'number' }
function isbool(s) { return typeof s == 'boolean' }
function issym(s) { return typeof s == 'symbol' }
function isfn(s) { return typeof s == 'function' }
function isbint(s) { return typeof s == 'bigint' }
function isobj(s) { return type(s) == 'object' }
function isarr(s) { return Array.isArray(s) }
function isiter(s) { return has(s, Symbol.iterator) }
function isprim(s) { return !((s && typeof s == 'object') || typeof s == 'function') }
function isgen(s) { return is(s, Generator) }
function isctor(s) { return isfn(s) && s.prototype?.constructor == s }
function isnullobj(s) { return s && typeof s == 'object' && !is(s, Object) }
function isdesc(s) { return has(s, 'configurable', 'enumerable') && (has(s, 'writable', 'value') || has(s, 'get', 'set')) }
function arrof(s, t) { return s.every(s => is(s, t)) }

/*=============== dom.js ===============*/
function selector(sel = '') {
  const masked = sel.trim().mask(/"[^"]+"|'[^']+'/g)
  const parts = masked.unmask(masked.str.split(/(?=\#|\.|\[)/g))
  const output = {
    tag: 'div',
    classes: [],
    attrs: [],
  }
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
function $(sel, root) {
  return (root ?? document).querySelector(sel)
}
function $$(sel, root) {
  return arr((root ?? document).querySelectorAll(sel))
}
function elem(sel, ...children) {
  const { tag, id, classes, attrs } = selector(sel)
  const el = document.createElement(tag)
  if (id)
    el.id = id
  if (classes.length > 0)
    el.classList.add(...classes)
  for (const attr of attrs)
    el.setAttribute(attr.name, attr.value)
  el.append(...children.filter(s => s))
  return el
}
function $$style(text) {
  const wanted = obj(text.split(';')
    .map(s => s.trim())
    .filter(s => s)
    .map(s => s.split(':').map(s => s.trim())))
  return $$('*')
    .filter(el => {
      const comp = el.compStyle
      return keys(wanted).every(s => comp[s] == wanted[s])
    })
}
function $await(sel, root) {
  return new Promise(resolve => {
    const obs = new MutationObserver((muts, obs) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          const el = $(sel, n)
          if (el) {
            obs.disconnect()
            resolve(el)
            return
          }
        }
      }
    })
    const opt = {
      childList: true,
      subtree: true,
    }
    obs.observe(root ?? body, opt)
  })
}

/*=============== tools.js ===============*/
function store(id) {
  return new Proxy({ id }, {
    get(target, key) {
      return JSON.parse(str(localStorage.getItem(`@${id}/${key}`)))
    },
    set(target, key, value) {
      localStorage.setItem(`@${id}/${key}`, JSON.stringify(value))
      return true
    },
  })
}

/*=============== extend.js ===============*/
define(Symbol, {
  extensions: Symbol.extensions ?? Symbol('extensions'),
})
extend(RegExp, {
  escape(text) {
    return text.replace(/[()\[\]{}|\\^$*+?.]/g, '\\$&')
  },
})
extend(String.prototype, {
  toInt() {
    return parseInt(this.match(/-?\d+/)[0])
  },
  toFloat() {
    return parseFloat(this.match(/-?\d*\.?\d+/)[0])
  },
  toNumbers() {
    return arr(this.matchAll(/(-?\d*\.?\d+)/g)).map(s => parseFloat(s))
  },
  test(re) {
    return re.test(this)
  },
  mask(re, opt = {}) {
    return this.matchAll(re)
      .reduce((s, n, i) => {
        s.str = s.str.replace(n[0], char(0xe000 + i))
        s.rep.push(assign(n, opt, { placeholder: char(0xe000 + i) }))
        return s
      },
      {
        str: this,
        rec: false,
        rep: [],
        unmask(str) {
          str ??= this.str
          if (this.rec)
            this.rep = this.rep.map(reps => assign(reps, { 0: this.rep.reduce((s, n) => s.replaceAll(n.placeholder, n[0]), reps[0]) }))
          if (isarr(str))
            return str.map(s => this.rep.reduce((s, n, i) => s.replaceAll(n.placeholder, n[0]), s))
          return this.rep.reduce((s, n, i) => s.replaceAll(n.placeholder, n[0]), str)
        },
        mask(re, opt = {}) {
          const parts = this.str.split(/\p{Co}/gu)
          parts.forEach(part => {
            part.matchAll(re)
            .forEach(s => {
              this.str = this.str.replace(s[0], char(0xe000 + this.rep.length))
              this.rep.push(assign(s, opt, { placeholder: char(0xe000 + this.rep.length) }))
            })
          })
          this.rep = [...this.rep].sort((a, b) => a.index - b.index)
          return this
        },
        recurse(re, opt = {}) {
          this.rec = true
          let ma = arr(this.str.matchAll(re))
          while (ma.length > 0) {
            ma.forEach(s => {
              this.str = this.str.replace(s[0], char(0xe000 + this.rep.length))
              this.rep.push(assign(s, opt, { placeholder: char(0xe000 + this.rep.length) }))
            })
            ma = arr(this.str.matchAll(re))
          }
          this.rep = [...this.rep].sort((a, b) => a.index - b.index)
          return this
        },
        simplify() {
          const keep = []
          const discard = []
          for (const s of this.rep) {
            if (this.str.indexOf(s.placeholder) == -1)
              discard.push(s)
            else
              keep.push(s)
          }
          this.rep = keep.map(reps => assign(reps, { 0: discard.reduce((s, n) => s.replaceAll(n.placeholder, n[0]), reps[0]) }))
        },
      })
  },
  maskParen(open) {
    const matching = {
      '(': ')',
      '[': ']',
      '{': '}',
    }
    const close = matching[open]
    
    const rep = []
    
    let i = 0
    while (i != -1) {
      const start = this.indexOf(open, i)
      if (start == -1)
        break
      
      let depth = 1
      i = start
      while (depth > 0) {
        const a = this.indexOf(open, i+1)
        const b = this.indexOf(close, i+1)
        if (a < b && a != -1) {
          depth++
          i = a
        }
        else {
          depth--
          i = b
        }
      }
      rep.push(this.slice(start, i+1))
    }
    return {
      str: rep.reduce((s, n, i) => s.replace(n, char(0xe000 + i)), this),
      rep,
      unmask(str) {
        str ??= this.str
        if (isarr(str))
          return str.map(s => this.rep.reduce((s, n, i) => s.replace(char(0xe000 + i), n), s))
        return this.rep.reduce((s, n, i) => s.replace(char(0xe000 + i), n), str)
      },
    }
  },
  trimStart(re = /\s+/) {
    if (isstr(re))
      re = regex`^(?:${RegExp.escape(re)})`
    else
      re = regex`^${re.source.replace(/^\^/, '')}`
    return this.replace(re, '')
  },
  trimEnd(re = /\s+/) {
    if (isstr(re))
      re = regex`(?:${RegExp.escape(re)})$`
    else
      re = regex`${re.source.replace(/\$$/, '')}$`
    return this.replace(re, '')
  },
  trim(a, b) {
    if (a === undefined)
      a = /\s+/
    if (b === undefined)
      b = a
    return this.trimStart(a).trimEnd(b)
  },
  dehyphenate() {
    return this.replaceAll(/-[^-]/g, m => m.slice(1).toUpperCase())
  },
})
extend(Array.prototype, {
  unique(fn = s => s) {
    const output = []
    const seen = new Set()
    for (const item of this) {
      const id = fn(item)
      if (!seen.has(id)) {
        output.push(item)
        seen.add(id)
      }
    }
    return output
  },
  indexed() {
    return this.map((s, i) => [s, i])
  },
  linked() {
    return this.map((s, i) => assign(s, {
      prev: i == 0 ? null : this[i - 1],
      next: i == this.length - 1 ? null : this[i + 1],
    }))
  },
  filter(fn = s => s) {
    return this._filter(fn)
  },
  get last() {
    return this[this.length-1]
  },
  set last(value) {
    this[this.length-1] = value
  },
})
extend(Iterator.prototype, {
  filter(fn = s => s) {
    return this._filter(fn)
  },
})
extend(Window.prototype, {
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
})
extend(Element.prototype, {
  get rect() {
    return this.getBoundingClientRect()
  },
  get compStyle() {
    const comp = this.computedStyleMap()
    return obj(arr(comp).map(([k, v]) => [k, v[0].toString()]))
  },
  get first() {
    return this.firstElementChild
  },
  get last() {
    return this.lastElementChild
  },
  get prev() {
    return this.previousElementSibling
  },
  get next() {
    return this.nextElementSibling
  },
  get parent() {
    return this.parentElement
  },
  append(...args) {
    args = args.filter(s => s)
    this._append(...args)
    
    return define(this, {
      get ids() {
        return $$('[id]', this).reduce((s, n) => assign(s, { [n.id.dehyphenate()]: n }), {})
      },
    })
  },
  prepend(...args) {
    args = args.filter(s => s)
    this._prepend(...args)
    
    return define(this, {
      get ids() {
        return $$('[id]', this).reduce((s, n) => assign(s, { [n.id.dehyphenate()]: n }), {})
      },
    })
  },
  replaceChildren(...args) {
    args = args.filter(s => s)
    this._replaceChildren(...args)
    
    return define(this, {
      get ids() {
        return $$('[id]', this).reduce((s, n) => assign(s, { [n.id.dehyphenate()]: n }), {})
      },
    })
  },
  set(fn) {
    fn(this)
    return this
  },
})
extend(Node.prototype, {
  get text() {
    return this.textContent
  },
  set text(value) {
    this.textContent = value
  },
})
extend(EventTarget.prototype, {
  dispatch(type, props = {}) {
    this.dispatchEvent(new (class extends Event {
      constructor() {
        super(type, props)
        define(this, props)
      }
    })())
  },
  listen(type, handler, options) {
    const target = this
    function unlisten() {
      return target.removeEventListener(type, delegate, options)
    }
    function delegate(e) {
      return handler(define(e, {
        unlisten,
      }))
    }
    this.addEventListener(type, delegate, options)
    return unlisten
  },
})
extend(Image, {
  reload() {
    if (this.complete && this.naturalWidth == 0) {
      const image = this
      return new Promise(resolve => {
        image.onload = e => resolve(image)
        image.src = `${image.src.replaceAll(/\?.+$/, '')}?${Date.now()}`
      })
    }
  },
})

/*=============== monkey.js ===============*/
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
function imp(strings, ...rest) {
  return String.raw(strings, ...rest)
    .replaceAll('!important', '')
    .replaceAll(';', ' !important;')
    .replaceAll(' !unimportant !important;', ';')
}

/*=============== other.js ===============*/
function gallery(sel, root) {
  const images = $$(sel, root ?? document)
  images.forEach((el, i) => {
    el.onclick = e => {
      if (images[0].rect.y > 0)
        images[0].scrollIntoView({ block: 'end' })
      else if (e.y < innerHeight * .7)
        images[i-1]?.scrollIntoView({ block: 'end' })
      else
        images[i+1]?.scrollIntoView({ block: 'end' })
    }
  })
}
function progress() {
  function scrollPercent() {
    const el = document.scrollingElement
    return el.scrollTop / (el.scrollHeight - el.clientHeight)
  }
  
  const css = `
  @property --fill {
    syntax: "<percentage>";
    inherits: false;
    initial-value: 0%;
  }
  #scroll-fill {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 90000;
    width: 12px;
    height: 100%;
    transition: --fill .1s ease-out;
    background: linear-gradient(180deg, oklch(0.3 0.2 212 / .6) var(--fill), transparent var(--fill));
  }
  `
  head.append(elem('style', css))
  
  const bar = elem('#scroll-fill')
  body.append(bar)
  
  bar.style.setProperty('--fill', `${scrollPercent() * 100}%`)
  document.addEventListener('scroll', e => {
    bar.style.setProperty('--fill', `${scrollPercent() * 100}%`)
  })
  
  return bar
}

/*=============== font.js ===============*/
// Common inputs:
//   'Noto Sans SC'
//   'Inter'
function font(name) {
  const css = `@import url('https://fonts.googleapis.com/css2?family=${s.replaceAll(' ', '+')}:wght@100..900&display=swap');
  body {
    font-family: "${name}", sans-serif;
  }
  `
  head.append(elem('style', css))
}

/*=============== extend-more.js ===============*/
extend(globalThis, {
  info,
  arr,
  obj,
  has,
  str,
  keys,
  list,
  call,
  char,
  desc,
  define,
  extend,
  assign,
  wait,
  raw,
  regex,
  type,
  is,
  isnull,
  isundef,
  isstr,
  isnum,
  isbool,
  issym,
  isfn,
  isbint,
  isobj,
  isarr,
  isiter,
  isprim,
  isgen,
  isctor,
  isnullobj,
  isdesc,
  arrof,
  $,
  $$,
  elem,
  $$style,
  $await,
  store,
  imp,
  gallery,
  progress,
  font,
})