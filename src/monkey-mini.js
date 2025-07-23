
//===================== TODO =====================
// - loadPages
//   - Add option to parse max page link + link format (solves cases where the full pagination isn't shown)
// - gallery
//   - Use smooth scroll to progress beyond images
//================================================
define(globalThis, {
  MONKEY_VERSION: 41
})

/*=============== helpers.js ===============*/
function arr(target, fn) {
  const array = Array.from(target, fn)
  if (!array.some(s => is(s, Promise)))
    return array
  return Array.fromAsync(target, fn)
}
function obj(entries, value) {
  if (value === undefined)
    return Object.fromEntries(entries)
  return { [entries]: value }
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
function range(a, b) {
  if (b === undefined)
    return range(0, a)
  return arr({ length: b - a }, (_, i) => a + i)
}
function equals(a, b) {
  if (isprim(a) || isprim(b))
    return a === b
  if (isfn(a) || isfn(b))
    return a === b

  const abKeys = [...keys(a), ...keys(b)].unique()
  for (const key of abKeys) {
    if (!equals(a[key], b[key]))
      return false
  }
  return true
}
function frag(strings, ...rest) {
  const fragment = new DocumentFragment()

  if (istagged(strings, rest)) {
    fragment.innerHTML = String.raw(strings, ...rest)
  }
  else {
    for (const child of [strings, ...rest].filter()) {
      if (isstr(child) && child.startsWith('\ue000') && child.endsWith('\ue000'))
        fragment.insertAdjacentHTML('beforeend', child.slice(1, -1))
      else
        fragment.append(child)
    }
  }
  return fragment
}
function html(strings, ...rest) {
  if (isstr(strings))
    return new DOMParser().parseFromString(strings, 'text/html')
  return `\ue000${String.raw(strings, ...rest)}\ue000`
  //return elem('div').set(el => el.outerHTML = String.raw(strings, ...rest))
}
function serialize(node) {
  return new XMLSerializer().serializeToString(node)
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
  console.log('target', target, 'defines', defines)
  if (defines === undefined)
    return target
  if (list(Object.getOwnPropertyDescriptors(defines)).every(s => isdesc(s.value)))
    return Object.defineProperties(target, defines)
  return Object.defineProperties(target, Object.getOwnPropertyDescriptors(defines))
}
function undefine(target, keys) {
  for (const key of keys)
    delete target[key]
  return target
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

/*=============== type.js ===============*/
const Generator = function*(){}.constructor.prototype

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
function is(s, t) {
  if (s === null)
    return false
  if (typeof s == 'object')
    return s instanceof t
  if (t == String)
    return isstr(s)
  if (t == Number)
    return isnum(s)
  if (t == Boolean)
    return isbool(s)
  if (t == Symbol)
    return issym(s)
  if (t == Function)
    return isfn(s)
  if (t == BigInt)
    return isbigint(s)
  if (t == Iterator)
    return isiter(s)
  console.error(`is(s, t): Call arguments (${s} and ${t.name}) did not match any of the expected cases. Returning false as a precaution.`)
  return false
}

function isnull(s) { return s === null }
function isundef(s) { return s === undefined }
function isstr(s) { return typeof s == 'string' }
function isnum(s) { return typeof s == 'number' }
function isbool(s) { return typeof s == 'boolean' }
function issym(s) { return typeof s == 'symbol' }
function isfn(s) { return typeof s == 'function' }
function isbigint(s) { return typeof s == 'bigint' }
function isobj(s) { return type(s) == 'object' }
function isarr(s) { return Array.isArray(s) }
function isiter(s) { return has(s, Symbol.iterator) }
function isprim(s) { return !((s && typeof s == 'object') || typeof s == 'function') }
function isgen(s) { return is(s, Generator) }
function isctor(s) { return isfn(s) && s.prototype?.constructor == s }
function isnullobj(s) { return s && typeof s == 'object' && !is(s, Object) }
function isstrobj(s) { return s && typeof s == 'object' && is(s, String) }
function isnumobj(s) { return s && typeof s == 'object' && is(s, Number) }
function isboolobj(s) { return s && typeof s == 'object' && is(s, Boolean) }
function isdesc(s) { return has(s, 'configurable', 'enumerable') && (has(s, 'writable', 'value') || has(s, 'get', 'set')) }
function isregex(s) { return is(s, RegExp) }
function istagged(s, t) { return isarr(s) && s.every(isstr) && isarr(t) && t.every(isstr) && s.length == t.length + 1 }
function arrof(s, t) { return s.every(s => is(s, t)) }

/*=============== dom.js ===============*/
function selector(sel = '') {
  const masked = sel.trim().mask(/"[^"]*"|'[^']*'/g)
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
      value: s.slice(i + 1).trim(`"`).trim(`'`)
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
function domInsert(fn, args) {
  args = args.filter(s => s).map(s => isstr(s) ? new Text(s) : s)
  
  //const notMounted = args.flatMap(s => !s.isMounted ? s.recurseChildren() : [])
  const notMounted = args.flatMap(s => {
    if (!s.isMounted) {
      console.log('s', s, 's.recurseChildren', s.recurseChildren)
      return s.recurseChildren()
    }
    return []
  })
  call(fn, this, ...args)
  
  if (this.isMounted) {
    notMounted.forEach(s => {
      //console.log('%O', s, is(s, EventTarget))
      if (s.dispatch)
        s.dispatch('mounted')
    })
  }
  
  return define(this, {
    get ids() {
      return $$('[id]', this).reduce((s, n) => assign(s, obj(n.id.dehyphenate(), n)), {})
    },
  })
}
function singleObserver() {
  const stackMap = new Map()
  const eventMap = new Map()
  const observer = new MutationObserver(muts => {
    for (const [sel, value] of eventMap) {
      const stack = $$(sel, value.root)
      if (!value.single) {
        if (stack.length > 0)
          value.fn(stack)
      }
      else {
        if (stack.length > 0) {
          stackMap.set(sel, stack.slice(1))
          value.fn(stack[0])
        }
      }
    }
  })
  return {
    add(sel, single, fn, root = body) {
      if (single) {
        if (!stackMap.has(sel) || stackMap.get(sel).length == 0) {
          stackMap.set(sel, [])
          eventMap.set(sel, { fn, single, root })
          observer.observe(root, { childList: true, subtree: true })
        }
        else {
          const stack = stackMap.get(sel)
          stackMap.set(sel, stack.slice(1))
          fn(stack[0])
        }
      }
      else {
        eventMap.set(sel, { fn, single, root })
        observer.observe(root, { childList: true, subtree: true })
      }
    },
    remove(sel) {
      eventMap.delete(sel)
      if (eventMap.size == 0)
        observer.disconnect()
    },
  }
}
let observer = null
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
  for (const child of children.filter()) {
    if (isstr(child) && child.startsWith('\ue000') && child.endsWith('\ue000'))
      el.insertAdjacentHTML('beforeend', child.slice(1, -1))
    else
      el.append(child)
  }
  return el
}
function $$style(...cssSets) {
  const wanted = cssSets.map(s => obj(s.split(';')
    .map(s => s.trim())
    .filter(s => s)
    .map(s => s.split(':').map(s => s.trim()))))
  return $$('*')
    .filter(el => {
      const comp = el.compStyle
      return wanted.some(s => keys(s).every(k => comp[k] == s[k]))
    })
}
function $a(sel, root) {
  observer ??= singleObserver()
  return new Promise(resolve => {
    observer.add(sel, true, el => {
      observer.remove(sel)
      resolve(el)
    }, root)
  })
}
async function* $$a(sel, root) {
  while (true)
    yield* await $aa(sel, root)
}
async function $aa(sel, root) {
  observer ??= singleObserver()
  return new Promise(resolve => {
    observer.add(sel, false, el => {
      resolve(el)
    }, root)
  })
}
async function* $$aa(sel, root) {
  while (true)
    yield await $aa(sel, root)
}

/*=============== tools.js ===============*/
function openStore(id) {
  return new Proxy({ id }, {
    get(target, key) {
      return JSON.parse(str(localStorage.getItem(`@${id}/${key}`)))
    },
    set(target, key, value) {
      localStorage.setItem(`@${id}/${key}`, JSON.stringify(value))
      return true
    },
    has(target, key) {
      return localStorage.getItem(`@${id}/${key}`) != null
    },
    deleteProperty(target, key) {
      localStorage.removeItem(`@${id}/${key}`)
      return true
    },
  })
}

/*=============== extend.js ===============*/
define(Symbol, {
  extensions: Symbol.extensions ?? Symbol('extensions'),
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
  min(fn = s => s) {
    return this.reduce((s, n) => fn(s) < fn(n) ? s : n)
  },
  max(fn = s => s) {
    return this.reduce((s, n) => fn(s) > fn(n) ? s : n)
  },
  minIndex(fn = s => s) {
    return this.reduce((s, n, i) => fn(this[s]) < fn(n) ? s : i, 0)
  },
  maxIndex(fn = s => s) {
    return this.reduce((s, n, i) => fn(this[s]) > fn(n) ? s : i, 0)
  },
  clear() {
    this.splice(0, this.length)
    return this
  },
  remove(items) {
    if (isarr(items)) {
      for (const item of items)
        this.remove(item)
    }
    else {
      const index = this.indexOf(items)
      if (index == -1)
        return this

      this.splice(index, 1)
      return this
    }
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
extend(Document.prototype, {
  append(...args) {
    return call(domInsert, this, this._append, args)
  },
  prepend(...args) {
    return call(domInsert, this, this._prepend, args)
  },
  replaceChildren(...args) {
    return call(domInsert, this, this._replaceChildren, args)
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
  show() {
    this.scrollIntoView({ behavior: 'instant', block: 'end' })
  },
  append(...args) {
    return call(domInsert, this, this._append, args)
  },
  prepend(...args) {
    return call(domInsert, this, this._prepend, args)
  },
  replaceChildren(...args) {
    return call(domInsert, this, this._replaceChildren, args)
  },
  set(fn) {
    call(fn, this, this)
    return this
  },
})
extend(DocumentFragment.prototype, {
  get innerHTML() {
    return serialize(this)
      .replaceAll(' xmlns="http://www.w3.org/1999/xhtml"', '')
  },
  set innerHTML(value) {
    const el = elem('template')
    el.innerHTML = value
    this.replaceChildren(el.content)
  },
  append(...args) {
    return call(domInsert, this, this._append, args)
  },
  prepend(...args) {
    return call(domInsert, this, this._prepend, args)
  },
  replaceChildren(...args) {
    return call(domInsert, this, this._replaceChildren, args)
  },
  insertAdjacentHTML(where, text) {
    if (where == 'beforebegin')
      this.parent.prepend(document.createRange().createContextualFragment(text))
    if (where == 'afterbegin')
      this.prepend(document.createRange().createContextualFragment(text))
    if (where == 'beforeend')
      this.append(document.createRange().createContextualFragment(text))
    if (where == 'afterend')
      this.parent.append(document.createRange().createContextualFragment(text))
  },
})
extend(Node.prototype, {
  get text() {
    return this.textContent
  },
  set text(value) {
    this.textContent = value
  },
  get parent() {
    return this.parentElement
  },
  get isMounted() {
    let node = this
    while (node.parentNode)
      node = node.parentNode
    return node == document
  },
  get leafNodes() {
    return this.recurseChildren().filter(s => s.childNodes.length == 0)
  },
  recurseChildren() {
    const output = []
    function traverse(node) {
      output.push(node)
      for (const child of node.childNodes)
        traverse(child)
    }
    traverse(this)
    return output
  },
})
extend(NodeIterator.prototype, {
  *[Symbol.iterator]() {
    let n = this.nextNode()
    while (n) {
      yield n
      n = this.nextNode()
    }
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
extend(EventTarget, {
  targets: new Map(),
})
extend(EventTarget.prototype, {
  addEventListener(type, handler, options) {
    const events = EventTarget.targets.get(this) ?? EventTarget.targets.set(this, []).get(this)
    events.push({ type, handler, options, method: 'add' })

    this._addEventListener(type, handler, options)
  },
  removeEventListener(type, handler, options) {
    const events = EventTarget.targets.get(this)
    if (events) {
      const params = events.filter(s => s.type == type && s.handler == handler && equals(s.options, options))
      events.remove(params)

      for (const param of params)
        this._removeEventListener(param.type, param.handler, param.options)
    }
  },
  dispatch(type, props = {}) {
    this.dispatchEvent(new (class extends Event {
      constructor() {
        super(type, props)
        define(this, props)
      }
    })())
  },
  listen(type, handler, options) {
    const unlisten = () => this._removeEventListener(type, handler, options)
    function delegate(e) {
      return handler(define(e, { unlisten }))
    }

    const events = EventTarget.targets.get(this) ?? EventTarget.targets.set(this, []).get(this)
    events.push({ type, handler: delegate, options, method: 'listen' })

    this._addEventListener(type, delegate, options)
  },
  unlisten(type) {
    const events = EventTarget.targets.get(this)
    if (events) {
      const params = isstr(type) ? events.filter(s => s.type == type) : (isfn(type) ? events.filter(s => s.handler == type) : [])
      events.remove(params)

      for (const param of params)
        this._removeEventListener(param.type, param.handler, param.options)
    }
  },
})

/*=============== events.js ===============*/
const eventNames = [EventTarget.prototype, Node.prototype, Element.prototype, HTMLElement.prototype, Document.prototype, Window.prototype]
  .flatMap(s => keys(s).filter(key => isstr(key) && key.startsWith('on')))
  .unique()
undefine(EventTarget.prototype, eventNames)
undefine(Node.prototype, eventNames)
undefine(Element.prototype, eventNames)
undefine(HTMLElement.prototype, eventNames)
undefine(Document.prototype, eventNames)
undefine(Window.prototype, eventNames)
eventNames.forEach(name => {
  const type = name.slice(2)
  define(EventTarget.prototype, {
    get [name]() {
      const events = EventTarget.targets.get(this)
      if (events)
        return events.find(s => s.type == type && s.method == 'inline')
      return null
    },
    set [name](handler) {
      const eventsBefore = EventTarget.targets.get(this)
      if (eventsBefore) {
        const event = eventsBefore.find(s => s.type == type && s.method == 'inline')
        if (event)
          this._removeEventListener(event.type, event.handler, event.options)
      }

      if (handler) {
        const events = EventTarget.targets.get(this) ?? []
        events.push({ type, handler, options: undefined, method: 'inline' })
        EventTarget.targets.set(this, events)

        this._addEventListener(type, handler)
      }
    },
  })
})
function events(type) {
  return arr(EventTarget.targets)
    .flatMap(([el, ev]) => ev.map(s => ({ element: el, ...s })))
    .filter(s => {
      if (isstr(type))
        return s.type == type
      return s.handler == type
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
      }
    })
  })
}

/*=============== other.js ===============*/
async function loadPages(selTarget, selImages, selPagination, fnUrl, fnNum) {
  const target = $(selTarget)
  const urls = fnUrl === undefined || fnNum === undefined ? $$(selPagination).map(s => s.href).unique() : range(2, fnNum($(selPagination).href)).map(fnUrl)
  const count = $$(selImages).length
  function isNewImage(el) {
    return !$$(selImages).map(s => s.dataset?.src ?? s.src).includes(el.dataset?.src ?? el.src)
  }
  for (const url of urls) {
    const dom = await GM_fetch(url)
    const images = $$(selImages, dom).filter(isNewImage)
    target.append(...images)
  }
  //console.log(`${urls.length} pages, ${count} => ${$$(selImages).length} images`)
  toast('Loading complete', `${urls.length} pages, ${count} => ${$$(selImages).length} images`)
  gallery(selImages)
  progress()
}
function gallery(sel, root) {
  const images = $$(sel, root ?? document)
  if (isMobile()) {
    images.forEach((el, i) => {
      el.onclick = e => {
        if (images[0].rect.y > 0)
          images[0].show()
        else if (e.y < innerHeight * .7)
          images[i-1]?.show()
        else
          images[i+1]?.show()
      }
    })
  }
  else {
    const image = {
      get current() {
        return images.find(s => s.rect.y >= 0 && s.rect.y < 1)
      },
      get next() {
        return images.find(s => s.rect.y >= 1)
      },
      get prev() {
        return images.toReversed().find(s => s.rect.y < 0)
      },
    }
    document.onkeydown = e => {
      if (e.key == 'ArrowRight')
        image.next?.show()
      else if (e.key == 'ArrowLeft')
        image.prev?.show()
    }
  }
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
function stopExecute(sel) {
  sel ??= `script:not([src^="${location.origin}"])`
  
  const obs = new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.matches?.(sel)) {
          n.text = ''
          n.remove()
        }
      }
    }
  })
  obs.observe(document, { childList: true, subtree: true })
}

/*=============== font.js ===============*/
// Common inputs:
//   'Noto Sans SC'
//   'Inter'
function font(name) {
  const css = `@import url('https://fonts.googleapis.com/css2?family=${name.replaceAll(' ', '+')}:wght@100..900&display=swap');
  body {
    font-family: "${name}", sans-serif;
  }
  `
  head.append(elem('style', css))
}
function isMobile() {
  return /\bAndroid\b|\biPhone\b|\biPad\b/.test(navigator.userAgent)
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

/*=============== ui.js ===============*/
function toast(title, text, duration) {
  if (text === undefined)
    [title, text] = [undefined, title]
  else if (isnum(text))
    [title, text, duration] = [undefined, title, text]
  if (duration === undefined)
    duration = 4000

  const css = imp`
#monkey {
  width: 100%;
  position: fixed;
  left: 0;
  bottom: 2rem;
  display: flex;
  justify-content: center;
  z-index: 900000;
}
#monkey #toast {
  max-width: 66.667vw;
  display: grid;
  padding: .5rem 1rem;
  background: #10191c;
  border-radius: .5rem;
  border: 2px solid #1a2326;
  cursor: pointer;
  box-shadow: #00000060 0px 3px 8px, #00000080 0px 3px 16px;
}
#monkey #toast .title {
  text-transform: uppercase;
  font-size: .725rem;
  font-weight: 700;
  line-height: 1.1667;
}
#monkey #toast .text {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.3333;
}
  `
  const el = elem('#monkey',
    elem('style', css),
    elem('#toast',
      title === undefined ? null : elem('.title', title),
      elem('.text', frag`${text.replaceAll(/(?<!')'(?!')([^']+)(?<!')'(?!')/g, '<code>$1</code>').replaceAll(`''`, `'`)}`),
    ),
  )
  body.append(el)
  el.animate([{ translate: '0 100%' }, { translate: '0 0' }], { duration: 150, iterations: 1 })
  setTimeout(() => el.animate([{ translate: '0 0' }, { translate: '0 100%' }], { duration: 150, iterations: 1 }), duration - 150)
  setTimeout(() => el.remove(), duration)

  el.onclick = e => {
    el.animate([{ translate: '0 0' }, { translate: '0 100%' }], { duration: 150, iterations: 1 })
    setTimeout(() => el.remove(), 150)
  }
}

/*=============== tagged-template.js ===============*/
function imp(strings, ...rest) {
  return String.raw(strings, ...rest)
    .replaceAll('!important', '')
    .replaceAll(';', ' !important;')
    //.replaceAll(' !unimportant !important;', ';')
    .replaceAll(/^\/\/.+\n/gm, '')
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

/*=============== extend-more.js ===============*/
extend(globalThis, {
  arr,
  obj,
  has,
  str,
  equals,
  range,
  frag,
  html,
  serialize,
  keys,
  list,
  call,
  char,
  desc,
  define,
  undefine,
  extend,
  assign,
  type,
  is,
  isnull,
  isundef,
  isstr,
  isnum,
  isbool,
  issym,
  isfn,
  isbigint,
  isobj,
  isarr,
  isiter,
  isprim,
  isgen,
  isctor,
  isnullobj,
  isstrobj,
  isnumobj,
  isboolobj,
  isdesc,
  isregex,
  istagged,
  arrof,
  $,
  $$,
  elem,
  $$style,
  $a,
  $$a,
  $aa,
  $$aa,
  openStore,
  events,
  loadPages,
  gallery,
  progress,
  stopExecute,
  font,
  isMobile,
  textnodes,
  toast,
  imp,
  raw,
  regex,
})
