
/*=============== helpers.js ===============*/
function arr(target, fn) {
  const array = Array.from(target, fn)
  if (!array.some(s => s instanceof Promise))
    return array
  return Array.fromAsync(target, fn)
}
function obj(entries, value) {
  if (value === undefined)
    return Object.fromEntries(entries)
  return { [entries]: value }
}
function keys(target) {
  if (isprim(target))
    return []
  return Reflect.ownKeys(target)
}
function call(fn, thisArg, ...args) {
  return Reflect.apply(fn, thisArg, args)
}
function define(target, defines) {
  return Object.defineProperties(target, Object.getOwnPropertyDescriptors(defines))
}
function assign(target, ...args) {
  return Object.assign(target, ...args)
}

/*=============== type.js ===============*/
function type(s) {
  if (s === null)
    return 'null'
  if (s === undefined)
    return 'undefined'
  if (isarr(s))
    return 'array'
  if (isiter(s))
    return 'iterator'
  return typeof s
}

function isstr(s) { return typeof s == 'string' }
function isnum(s) { return typeof s == 'number' }
function isbool(s) { return typeof s == 'boolean' }
function issym(s) { return typeof s == 'symbol' }
function isfn(s) { return typeof s == 'function' }
function isobj(s) { return type(s) == 'object' }
function isarr(s) { return Array.isArray(s) }
function isiter(s) { return !isprim(s) && Symbol.iterator in s }
function isprim(s) { return !((s && typeof s == 'object') || typeof s == 'function') }
function isgen(s) { return s instanceof (function*(){}.constructor.prototype) }
function isctor(s) { return isfn(s) && s.prototype?.constructor == s }
function isnullobj(s) { return s && typeof s == 'object' && !(s instanceof Object) }

/*=============== dom.js ===============*/
function selector(sel = '') {
  const masked = mask(sel.trim(), /"[^"]*"|'[^']*'/g)
  const parts = masked.split(/(?=\#|\.|\[)/g).map(s => s.unmask())
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
      value: trim(trim(s.slice(i + 1), `"`), `'`)
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

/*=============== tools.js ===============*/
function store(id) {
  return new Proxy({ id }, {
    get(target, key) {
      return JSON.parse(call(Object.prototype.toString, localStorage.getItem(`@${id}/${key}`)))
    },
    set(target, key, value) {
      localStorage.setItem(`@${id}/${key}`, JSON.stringify(value))
      return true
    },
  })
}

/*=============== extend.js ===============*/
function toNumbers(text) {
  return arr(text.matchAll(/(-?\d*\.?\d+)/g)).map(s => parseFloat(s))
}
function trim(text, re) {
  if (text.startsWith(re))
    text = text.slice(re.length)
  if (text.endsWith(re))
    text = text.slice(0, -re.length)
  return text
}
function mask(text, re) {
  function char(i) {
    return String.fromCharCode(0xe000 + i)
  }
  function str(text, rep) {
    if (Array.isArray(text))
      return text.map(s => str(s, rep))
    
    return assign(text, {
      rep: text.rep ?? rep ?? [],
      unmask() {
        return this.rep.reduce((s, n, i) => s.replaceAll(char(i), n), String(this))
      },
      split() {
        return str(call(String.prototype.split, this, ...arguments), this.rep)
      },
      replace() {
        return str(call(String.prototype.replace, this, ...arguments), this.rep)
      },
      replaceAll() {
        return str(call(String.prototype.replaceAll, this, ...arguments), this.rep)
      },
    })
  }
  return arr(text.matchAll(re)).reverse().reduce((s, n, i) => str(s.slice(0, n.index) + char(i) + s.slice(n.index + n[0].length), [...s.rep, n[0]]), str(text))
}
function unique(array, fn = s => s) {
  const output = []
  const seen = new Set()
  for (const item of array) {
    const id = fn(item)
    if (!seen.has(id)) {
      output.push(item)
      seen.add(id)
    }
  }
  return output
}
function linked(array) {
  return array.map((s, i) => assign(s, {
    prev: i == 0 ? null : array[i - 1],
    next: i == array.length - 1 ? null : array[i + 1],
  }))
}
function reload(image) {
  if (image.complete && image.naturalWidth == 0) {
    return new Promise(resolve => {
      image.onload = e => resolve(image)
      image.src = `${image.src.split('?')[0]}?${Date.now()}`
    })
  }
}
function unlock() {
  define(Array.prototype, {
    get last() {
      return this[this.length-1]
    },
    set last(value) {
      this[this.length-1] = value
    },
  })
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
  })
  define(Element.prototype, {
    get rect() {
      return this.getBoundingClientRect()
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
    set(fn) {
      call(fn, this, this)
      return this
    },
  })
  define(Node.prototype, {
    get text() {
      return this.textContent
    },
    set text(value) {
      this.textContent = value
    },
    get parent() {
      return this.parentElement
    },
  })
}

/*=============== monkey.js ===============*/
function GM_fetch(url, opt = { responseType: 'document' }) {
  return new Promise(resolve => {
    GM_xmlhttpRequest({
      ...opt,
      url,
      onload(e) {
        resolve(e.response)
      },
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
  const css = `@import url('https://fonts.googleapis.com/css2?family=${name.replaceAll(' ', '+')}:wght@100..700&display=swap');
  body {
    font-family: "${name}", sans-serif;
  }
  `
  head.append(elem('style', css))
}

/*=============== node.js ===============*/
function* textnodes() {
  const it = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT)
  let node = it.nextNode()
  while (node) {
    if (/\S/.test(node.textContent))
      yield node
    node = it.nextNode()
  }
}
