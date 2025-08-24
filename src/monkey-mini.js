const MONKEY_VERSION = 67

defineGlobalExtensions()
defineGlobalFunctions()
attachImageEventHandlers()

/*=============== internal.js ===============*/
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

/*=============== helpers.js ===============*/
function arr(target, fn) {
  const array = Array.from(target, fn)
  if (array.some(s => s instanceof Promise))
    return Array.fromAsync(target, fn)
  return array
}
function ent(target) {
  return keys(target).map(key => [key, target[key]])
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
function equal(a, b) {
  if (isprim(a) || isprim(b) || isfn(a) || isfn(b))
    return a === b

  //const abKeys = [...keys(a), ...keys(b)].unique()
  const abKeys = keys(a, b)
  for (const key of abKeys) {
    if (!equal(a[key], b[key]))
      return false
  }
  return true
}
function diff(a, b, target = {}) {
  if (isprim(a) || isprim(b) || isfn(a) || isfn(b)) {
    if (a === b)
      return undefined
    return assign(target, { a, b })
  }
  //const abKeys = unique([...keys(a), ...keys(b)])
  const abKeys = keys(a, b)
  for (const key of abKeys) {
    if (!equal(a[key], b[key])) {
      target[key] = {}
      target[key] = diff(a[key], b[key], target[key])
    }
  }
  return target
}
function frag(strings, ...rest) {
  const fragment = new DocumentFragment()

  if (istagged(strings, rest)) {
    fragment.innerHTML = String.raw(strings, ...rest)
  }
  else {
    for (const child of [strings, ...rest].filter(s => s)) {
      //if (isstr(child) && child.startsWith('\ue000') && child.endsWith('\ue000'))
      //  fragment.insertAdjacentHTML('beforeend', child.slice(1, -1))
      /*if (isstr(child) && child.html)
        fragment.insertAdjacentHTML('beforeend', child)
      else
        fragment.append(child)*/
      fragment.append(child)
    }
  }
  return fragment
}
function serialize(node) {
  return new XMLSerializer().serializeToString(node)
}
function keys(...args) {
  return unique(args.flatMap(s => isprim(s) ? [] : Reflect.ownKeys(s)))
}
function list(target) {
  const output = []
  //for (const key of keys(target)) {
  for (const key of (isprim(target) ? [] : Reflect.ownKeys(target))) {
    if (isobj(target[key]))
      output.push(assign({ key, name: key }, target[key]))
    else
      output.push({ key, name: key, value: target[key] })
  }
  return output
}
function getters(target) {
  return ent(Object.getOwnPropertyDescriptors(target))
    .map(([key, desc]) => ({ key, ...desc }))
    .filter(s => 'get' in s)
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
  if (defines === undefined)
    return target
  if (list(Object.getOwnPropertyDescriptors(defines)).every(s => isdesc(s.value)))
    return Object.defineProperties(target, defines)
  return Object.defineProperties(target, Object.getOwnPropertyDescriptors(defines))
}
function forceDefine(target, defines) {
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

/*=============== time.js ===============*/
function time() {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })
}
function passed(since) {
  function fmt(value, digits = 2) {
    return value.toString().padStart(digits, '0')
  }
  let diff = Date.now() - since
  let hh = (diff / 3600000 | 0)
  let mm = (diff / 60000   | 0) % 60
  let ss = (diff / 1000    | 0) % 60
  let ms = (diff / 1       | 0) % 1000
  return `${fmt(hh)}:${fmt(mm)}:${fmt(ss)},${fmt(ms, 3)}`
}

/*=============== type.js ===============*/
const Generator = function*(){}.constructor.prototype
const AsyncGenerator = async function*(){}.constructor.prototype
const AsyncFunction = async function(){}.constructor

function type(s) {
  if (s === null)
    return 'null'
  if (s === undefined)
    return 'undefined'
  if (isarr(s))
    return 'array'
  if (isiter(s))
    return 'iterator'
  if (isstr(s))
    return 'string'
  if (isnum(s))
    return 'number'
  if (isbool(s))
    return 'boolean'
  return typeof s
}
function is(s, t) {
  if (!isctor(t))
    return t(s)
  return s instanceof t
}
function whatis(s) {
  return call(Object.prototype.toString, s).slice(8, -1)
}

function isnull(s) { return s === null }
function isundef(s) { return s === undefined }
function isarr(s, fn = s => true) { return Array.isArray(s) && s.every(fn) }
function isiter(s) { return typeof s == 'object' && Symbol.iterator in s }
function isgen(s) { return s instanceof Generator }
function isfn(s) { return typeof s == 'function' }
function isasynciter(s) { return typeof s == 'object' && Symbol.asyncIterator in s }
function isasyncgen(s) { return s instanceof AsyncGenerator }
function isasyncfn(s) { return s instanceof AsyncFunction }
function isobj(s) { return type(s) == 'object' }
function isstr(s) { return typeof s == 'string' || isstrobj(s) }
function isnum(s) { return typeof s == 'number' || isnumobj(s) }
function isbool(s) { return typeof s == 'boolean' || isboolobj(s) }
function issym(s) { return typeof s == 'symbol' }
function isbigint(s) { return typeof s == 'bigint' }
function isnullobj(s) { return s && typeof s == 'object' && !(s instanceof Object) }
function isstrobj(s) { return s && typeof s == 'object' && s instanceof String }
function isnumobj(s) { return s && typeof s == 'object' && s instanceof Number }
function isboolobj(s) { return s && typeof s == 'object' && s instanceof Boolean }
function isprim(s) { return !((s && typeof s == 'object') || typeof s == 'function') }
function isdesc(s) { return has(s, 'configurable', 'enumerable', 'writable', 'value') || has(s, 'configurable', 'enumerable', 'get', 'set') }
function isdescs(s) { return keys(s).every(key => isdesc(s[key])) }
function isnode(s) { return s instanceof Node }
function iselem(s) { return s instanceof Element }
function isregex(s) { return s instanceof RegExp }
function istagged(s, t) { return isarr(s, isstr) && isarr(t, isstr) && s.length == t.length + 1 }
function isctor(s) {
  if (!isfn(s))
    return false
  const protoDesc = Object.getOwnPropertyDescriptor(s, 'prototype')
  if (!protoDesc || protoDesc.writable || protoDesc.enumerable || protoDesc.configurable)
    return false
  const ctorDesc = Object.getOwnPropertyDescriptor(protoDesc.value, 'constructor')
  return ctorDesc && !ctorDesc.enumerable && ctorDesc.value === s
}

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
  const notMounted = args.flatMap(s => !s.isMounted ? s.leafnodes : [])
  call(fn, this, ...args)
  
  if (this.isMounted) {
    notMounted.forEach(s => {
      s.dispatch('mounted', { bubbles: true })
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
  for (const child of children.filter(s => s)) {
    /*if (isstr(child) && child.startsWith('\ue000') && child.endsWith('\ue000'))
      el.insertAdjacentHTML('beforeend', child.slice(1, -1))*/
    /*if (isstr(child) && child.html)
      el.insertAdjacentHTML('beforeend', child)
    else
      el.append(child)*/
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
function $n(sel, root) {
  return (root ?? document).nodes.find(s => s.matches(sel))
}
function $$n(sel, root) {
  return (root ?? document).nodes.filter(s => s.matches(sel))
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
function parentNodes(node) {
  const output = []
  while (node) {
    output.push(node)
    node = node.parentNode
  }
  return output
}
function sharedNode(...nodes) {
  let sharedPercentage = 1
  if (isnum(nodes.last)) {
    sharedPercentage = nodes.last
    nodes = nodes.slice(0, -1)
  }

  for (const parent of parentNodes(nodes[0])) {
    const count = nodes.count(s => parent.contains(s))
    if (count / nodes.length >= sharedPercentage)
      return parent
  }
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
function hideInactiveCursor(sel) {
  const elems = $$(sel)
  
  let timeoutId
  function onmousemove(e) {
    elems.forEach(el => el.style.setProperty('cursor', 'auto'))

    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => elems.forEach(el => el.style.setProperty('cursor', 'none')), 1000)
  }

  elems.forEach(s => s.addEventListener('mousemove', onmousemove))
}

/*=============== image.js ===============*/
function attachImageEventHandlers() {
  $$('img').forEach(img => {
    if (!img.hasEventListeners) {
      img.hasEventListeners = true

      img.addEventListener('load', e => {
        img.loaded = true
        img.errored = false
      })
      img.addEventListener('error', e => {
        img.loaded = true
        img.errored = true
      })
    }
  })
}

/*=============== events.js ===============*/
const eventElementPrototypes = [
  EventTarget.prototype,
  Node.prototype,
  Element.prototype,
  HTMLElement.prototype,
  Document.prototype,
  Window.prototype,
]
const eventNames = unique(eventElementPrototypes
  .flatMap(s => keys(s).filter(key => isstr(key) && key.startsWith('on'))))

for (const prototype of eventElementPrototypes)
  undefine(prototype, eventNames)

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
        const target = this
        events.push({
          type,
          handler,
          options: undefined,
          method: 'inline',
          unlisten() {
            target._removeEventListener(this.type, this.handler, this.options)
          },
        })
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
      if (isfn(type))
        return s.handler == type
      if (isobj(type))
        return equal(s.options, type)
      if (is(type, Element))
        return s.element == type
      return true
    })
}

/*=============== monkey.js ===============*/
function GM_fetch(url, opt = { responseType: 'document' }) {
  console.log(`[GM_fetch] Loading ${url}`)
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

/*=============== page.js ===============*/
async function loadPages(selTarget, selImages, selPagination, fnMove, fnUrl, fnNum, fnTarget, fnPageAdded, checkNewImages = false) {
  if (fnUrl === undefined || fnNum === undefined)
    urls = $$(selPagination).map(s => s.href).unique()
  else
    urls = range(fnNum()).map(s => s + 1).map(fnUrl).slice(1)

  const target = $(selTarget)
  const count = $$(selImages).length
  function isNewImage(el) {
    const existing = $$(selImages).map(s => s.dataset?.src ?? s.src)
    return !existing.includes(el.dataset?.src ?? el.src)
  }
  for (const url of urls) {
    const dom = await GM_fetch(url)
    let newImages = $$(selImages, dom)
      .filter(el => !checkNewImages || isNewImage(el))
      .map(el => fnMove ? fnMove(el) : el)
      .map(el => document.adoptNode(el))
    
    if (fnTarget)
      fnTarget().after(...newImages)
    else
      target.append(...newImages)

    fnPageAdded?.({
      addedCount: newImages.length,
      totalCount: $$(selImages).length,
    })
  }
  toast('Loading complete', `${urls.length} pages, ${count} => ${$$(selImages).length} images`)
}
function imagePage(sel, root) {
  return {
    get images() {
      return $$(sel, root)
    },
    get index() {
      if (this.isAbove(false))
        return 0
      if (this.isBelow(true))
        return this.total - 1
      return this.images.findIndex(s => s == this.current)
    },
    get total() {
      return this.images.length
    },
    get current() {
      return this.images.find(s => s.rect.y >= 0 && s.rect.y < 1)
    },
    get next() {
      return this.images.find(s => s.rect.y >= 1)
    },
    get prev() {
      return this.images.toReversed().find(s => s.rect.y < 0)
    },
    get shouldLatchDown() {
      return this.images[0].rect.y >= 0 && this.images[0].rect.y < innerHeight
    },
    get shouldLatchUp() {
      return this.images.last.rect.y <= 0 && this.images.last.rect.y > innerHeight
    },
    isAbove(downward) {
      if (!downward)
        return this.images[0].rect.y >= 0
      return this.images[0].rect.y >= innerHeight
    },
    isBelow(downward) {
      if (downward)
        return this.images.last.rect.y <= 0
      return this.images.last.rect.y <= -innerHeight
    },
    scrollWatcher(fn) {
      let prevState = this.current
      //return scr.addEventListener('scroll', e => {
      return document.addEventListener('scroll', e => {
        //console.log('scrollWatcher', e)
        const state = this.current
        if (state != prevState)
          fn({
            index: this.index,
            total: this.total,
          })

        prevState = state
      })
    },
  }
}
function gallery(sel, root, forceStopOtherHandlers = false) {
  //=============== MOBILE ONLY ===============
  if (isMobile()) {
    const images = $$(sel, root)
    images.forEach((el, i) => {
      el.onclick = e => {
        if (images[0].rect.y > 0)
          images[0].instantScroll()
        else if (e.y < innerHeight * .7)
          images[i-1]?.instantScroll()
        else
          images[i+1]?.instantScroll()
      }
    })
  }
  //=============== DESKTOP ONLY ===============
  else {
    const imageHandle = imagePage(sel, root)

    if (forceStopOtherHandlers)
      events('keydown').forEach(s => s.unlisten())

    const eventHandle = window.addEventListener('keydown', e => {
      if (e.key == 'ArrowLeft') {
        if (imageHandle.shouldLatchUp)  {
          body.style.setProperty('cursor', 'none')
          imageHandle.prev?.instantScroll()
        }
        else if (imageHandle.isAbove(false) || imageHandle.isBelow(false)) {
          animScroll(0, -innerHeight * .9, 250)
        }
        else {
          body.style.setProperty('cursor', 'none')
          imageHandle.prev?.instantScroll()
        }
      }
      else if (e.key == 'ArrowRight') {
        if (imageHandle.shouldLatchDown) {
          body.style.setProperty('cursor', 'none')
          imageHandle.next?.instantScroll()
        }
        else if (imageHandle.isAbove(true) || imageHandle.isBelow(true)) {
          animScroll(0, innerHeight * .9, 250)
        }
        else {
          body.style.setProperty('cursor', 'none')
          imageHandle.next?.instantScroll()
        }
      }
    }, { capture: true })

    body.addEventListener('mousemove', e => {
      body.style.setProperty('cursor', 'auto')
    })

    return {
      imageHandle,
      eventHandle,
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
/*function scripts() {
  return new Promise(resolve => {

    const codes = []
    const obs = new MutationObserver(muts => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.matches?.('script')) {
            codes.push(n.text)

            n.text = ''
            n.remove()
          }
        }
      }
    })
    obs.observe(document, { childList: true, subtree: true })

    onload = e => {
      obs.disconnect()
    }
  })
}/**/

/*=============== font.js ===============*/
// Common inputs:
//   'Noto Sans SC'
//   'Inter'
function font(name) {
  const css = `@import url('https://fonts.googleapis.com/css2?family=${name.replaceAll(' ', '+')}:wght@100..900&display=swap');
  body { font-family: "${name}", sans-serif; }
  `
  head.append(elem('style', css))
}
function isMobile() {
  return /\bAndroid\b|\biPhone\b|\biPad\b/.test(navigator.userAgent)
}

/*=============== node.js ===============*/

/*=============== debug.js ===============*/
async function scripts(root) {
  return await arr($$('script', root ?? document).map(async (s, i) => {
    const code = s.src == '' ? s.innerHTML : await GM_fetch(s.src, { responseType: 'text' })
    return {
      code,
      elem: s,
      index: i,
    }
  }))
}
async function analyze() {
  const sources = await scripts()
  const interest = sources.flatMap(s => {
    return s.code.matchLines(/\baddEventListener\(|\bonkeydown\b/g)
      .map(line => {
        return {
          line: line.text,
          lineNumber: s.code.nthLine(line.startIndex),
          code: s.code,
          elem: s.elem,
          index: s.index,
        }
      })
  })
  return interest
}
function logImportant(...args) {
  const style = `font-size: 1.5rem; font-weight: 700; color: #0c8346; background: #84dcc6;`
  console.log(`%c${args.map(s => s.toString()).join(' ')}`, style)
}

/*=============== ui.js ===============*/
function toast(title, text, duration) {
  if (text === undefined)
    [title, text] = [undefined, title]
  else if (isnum(text))
    [title, text, duration] = [undefined, title, text]
  if (duration === undefined)
    duration = 4000

  const css = `
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
  color: #e0e0e0;
  background: #10191c;
  border-radius: .5rem;
  border: 2px solid #1a2326;
  cursor: pointer;
  box-shadow: #00000060 0px 3px 8px, #00000080 0px 3px 16px;
}
#monkey #toast .title {
  font-family: "Segoe UI", sans-serif;
  font-size: .85rem;
  font-weight: 700;
  line-height: 1.1667;
  text-transform: uppercase;
}
#monkey #toast .text {
  font-family: "Segoe UI", sans-serif;
  font-size: 1.1rem;
  font-weight: 400;
  line-height: 1.3333;
}
  `
  const shadowContainer = elem('#shadow-container')
  body.append(shadowContainer)

  const shadow = shadowContainer.attachShadow({ mode: 'open' })
  const el = elem('#monkey',
    elem('style', css),
    elem('#toast',
      title === undefined ? null : elem('.title', title),
      elem('.text', frag`${text.replaceAll(/(?<!')'(?!')([^']+)(?<!')'(?!')/g, '<code>$1</code>').replaceAll(`''`, `'`)}`),
    ),
  )
  shadow.append(el)

  el.animate([{ translate: '0 100%' }, { translate: '0 0' }], { duration: 150, iterations: 1 })
  setTimeout(() => el.animate([{ translate: '0 0' }, { translate: '0 100%' }], { duration: 150, iterations: 1 }), duration - 150)
  setTimeout(() => shadowContainer.remove(), duration)

  el.onclick = e => {
    el.animate([{ translate: '0 0' }, { translate: '0 100%' }], { duration: 150, iterations: 1 })
    setTimeout(() => shadowContainer.remove(), 150)
  }
}

/*=============== style.js ===============*/
function hotkeys() {
  window.addEventListener('keydown', e => {
    //##################### Close tab #####################
    if (e.code == 'Numpad0') {
      window.close()
    }
    //############### Reload errored images ###############
    else if (e.code == 'Numpad1') {
      const images = $$('img')
      const errored = images.filter(img => img.isErrored || img.errored)

      errored.forEach(img => img.reload())

      toast('Reloading images', `Reloading ${errored.length}/${images.length} images`)
    }
    //################ Toggle monkey style ################
    else if (e.code == 'Numpad2') {
      const styleElem = $('style#monkey-style')
      if (styleElem.isMounted)
        styleElem.remove()
      else
        head.append(styleElem)
    }
    //################## Toast page info ##################
    else if (e.code == 'Numpad3') {
      const violations = styleViolations()
      if (violations.length > 0)
        console.log('violations', violations)

      const images = $$('img')
      const guess = guessGallery()
      console.log('guess', guess)

      toast('Page info', `${violations.length} violations\n${guess.length}/${images.length} guessed images`)
    }
  })
}
function style(css) {
  head.append(elem('style#monkey-style', css))
  hotkeys()
}
function guessGallery(attrDiffLimit = 40, sharedDiffLimit = 40) {
  // Guesses
  // - Close closest shared parent
  // - Closest shared parent similar distance away
  // - Attributes present (decoding, loading, alt)
  // - Attributes are the same name between all of them
  // - Reasonable size (or errored)
  // - Often seen selectors (.entry-content, article)
  const considering = $$('img[src], img[data-src]')

  let data = considering.map(el => {
    return {
      element: el,
      shortSide: el.naturalWidth < el.naturalHeight ? el.naturalWidth : el.naturalHeight,
    }
  })
  data = data.filter(item => item.shortSide == 0 || item.shortSide > 500)
  data = data.map(item => {
    return {
      ...item,
      attribs: arr(item.element.attributes).reduce((s, n) => assign(s, { [n.name]: n.value }), {}),
    }
  })
  data = data.map(item => {
    return {
      ...item,
      shareds: data.map(s => item.element.closestShared(s.element)),
      attrDiffs: data.map(s => diff(item.attribs, s.attribs)),
    }
  })
  data = data.map(item => {
    return {
      ...item,
      attrScores: item.attrDiffs.map(other =>
        (
          ent(item.attribs).flat().filter(s => !!s).length
            - 
          keys(other).map(key => other[key]).flatMap(s => [s.a, s.b]).filter(s => !!s).length
        )
      ),
      sharedScores: item.shareds.map(other => (other.stepsA - other.stepsB - Math.abs(other.stepsA - other.stepsB)))
    }
  })
  data = data.map(item => {
    return {
      ...item,
      totalAttrScore: item.attrScores.reduce((a, b) => a + b),
      totalSharedScore: item.sharedScores.reduce((a, b) => a + b),
    }
  })
  const avgAttrScore = data.avg(s => s.totalAttrScore)
  data = data.filter(item => Math.abs(item.totalAttrScore - avgAttrScore) < attrDiffLimit)
  const avgSharedScore = data.avg(s => s.totalSharedScore)
  data = data.filter(item => Math.abs(item.totalSharedScore - avgSharedScore) < sharedDiffLimit)

  return data
}
function styleViolations() {
  function violatingRules(s) {
    const output = []
    if (['fixed', 'sticky', 'absolute'].includes(s.position))
      output.push('position')
    if (!['none', '100%'].includes(s['max-width']))
      output.push('max-width')
    if (s.visibility != 'visible')
      output.push('visibility')
    if (s.opacity != '1')
      output.push('opacity')
    if (s.transform != 'none')
      output.push('transform')
    if (s.float != 'none')
      output.push('float')
    return output
  }
  return $$('*')
    .map(s => {
      const comp = s.compStyle
      return {
        element: s,
        bad: obj(violatingRules(comp).map(s => [s, comp[s]])),
      }
    })
    .filter(s => keys(s.bad).length > 0)
}

/*=============== tagged-template.js ===============*/
function imp(strings, ...args) {
  return String.raw(strings, ...args)
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
function html(strings, ...rest) {
  if (isstr(strings))
    return new DOMParser().parseFromString(strings, 'text/html')
  return frag`${String.raw(strings, ...rest)}`
  //return assign(String.raw(strings, ...rest), { html: true })
  //return `\ue000${String.raw(strings, ...rest)}\ue000`
  //return elem('div').set(el => el.outerHTML = String.raw(strings, ...rest))
}

/*=============== extend-more.js ===============*/
function defineGlobalExtensions(targetWindow) {
  targetWindow ??= window

  define(targetWindow.Symbol, {
    extensions: targetWindow.Symbol.extensions ?? Symbol('extensions'),
  })
  extend(targetWindow.console, {
    stored: [],
    store(...args) {
      this.stored.push(...args.map(s => isobj(s) ? structuredClone(s) : s))
    },
    log(...args) {
      this._log(...this.stored, ...args)
      this.stored = []
    },
  })
  extend(targetWindow.String.prototype, {
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
    prevIndex(re, start) {
      if (start === undefined)
        start = this.length
      if (isstr(re))
        re = regex('g')`${RegExp.escape(re)}`

      const array = arr(this.slice(0, start).matchAll(re))
      if (array.length == 0)
        return -1
      return array.last.index
    },
    nextIndex(re, start) {
      if (start === undefined)
        start = 0
      if (isstr(re))
        re = regex('g')`${RegExp.escape(re)}`
      
      const array = arr(this.slice(0, start).matchAll(re))
      if (array.length == 0)
        return -1
      return array[0].index
    },
    matchLines(re) {
      return arr(this.matchAll(re)).map(s => {
        const startIndex = this.prevIndex('\n', s.index + s[0].length) + 1
        const endIndex = this.nextIndex('\n', s.index)
        return {
          startIndex,
          endIndex,
          text: this.slice(startIndex, endIndex),
        }
      })
    },
    nthLine(index) {
      let line = 1
      for (let i = 0; i < index; i++) {
        if (this[i] == '\n')
          line++
      }
      return line
    },
  })
  extend(targetWindow.Array.prototype, {
    unique(fn) {
      return unique(this, fn)
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
    sum(fn = s => s) {
      return this.reduce((s, n) => s + fn(n), 0)
    },
    avg(fn = s => s) {
      return this.sum(fn) / this.length
    },
    minIndex(fn = s => s) {
      return this.reduce((s, n, i) => fn(this[s]) < fn(n) ? s : i, 0)
    },
    maxIndex(fn = s => s) {
      return this.reduce((s, n, i) => fn(this[s]) > fn(n) ? s : i, 0)
    },
    count(fn) {
      let count = 0
      for (let i = 0; i < this.length; i++) {
        if (fn(this[i], i, this))
          count++
      }
      return count
    },
    clear() {
      this.splice(0, this.length)
      return this
    },
    while(fn = s => s) {
      const output = []
      for (let i = 0; i < this.length; i++) {
        if (!fn(this[i], i, this))
          return output

        output.push(this[i])
      }
      return output
    },
    remove(items) {
      if (isfn(items)) {
        for (const item of this.filter(items))
          this.remove(item)
        return this
      }
      else if (isarr(items)) {
        for (const item of items)
          this.remove(item)
        return this
      }
      else {
        const index = this.indexOf(items)
        if (index != -1)
          this.splice(index, 1)
        return this
      }
    },
    get first() {
      return this[0]
    },
    set first(value) {
      this[0] = value
    },
    get last() {
      return this[this.length-1]
    },
    set last(value) {
      this[this.length-1] = value
    },
  })
  extend(targetWindow.Iterator.prototype, {
    filter(fn = s => s) {
      return this._filter(fn)
    },
  })
  extend(targetWindow.Window.prototype, {
    get doc() {
      return this.document
    },
    get scr() {
      return this.document.scrollingElement
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
    animScrolling: false,
    animScroll(x, y, duration) {
      if (!this.animScrolling) {
        const originX = document.scrollingElement.scrollLeft
        const originY = document.scrollingElement.scrollTop
        const targetX = document.scrollingElement.scrollLeft + x
        const targetY = document.scrollingElement.scrollTop + y
        const rightward = originX < targetX
        const downward = originY < targetY

        let startTime
        function step(currentTime) {
          startTime ??= currentTime
          this.animScrolling = true

          const elapsed = currentTime - startTime
          let currentX = originX + (targetX - originX) / duration * elapsed
          let currentY = originY + (targetY - originY) / duration * elapsed
          if ((rightward && currentX > targetX) || (!rightward && targetX > currentX))
            currentX = targetX
          if ((downward && currentY > targetY) || (!downward && targetY > currentY))
            currentY = targetY
          document.scrollingElement.scrollLeft = currentX
          document.scrollingElement.scrollTop = currentY

          if (currentX != targetX || currentY != targetY)
            requestAnimationFrame(step)
          else
            this.animScrolling = false
        }
        requestAnimationFrame(step)
      }
    },
  })
  extend(targetWindow.Document.prototype, {
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
  extend(targetWindow.Element.prototype, {
    get rect() {
      return this.getBoundingClientRect()
    },
    get compStyle() {
      if (this.computedStyleMap) {
        const comp = this.computedStyleMap()
        return obj(arr(comp).map(([k, v]) => [k, v[0].toString()]))
      }
      else {
        const comp = getComputedStyle(this)
        return obj(arr(comp).map(s => [s, comp[s]]))
      }
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
    instantScroll() {
      this.scrollIntoView({ behavior: 'instant', block: 'end' })
    },
    animScrolling: false,
    animScroll(x, y, duration) {
      if (!this.animScrolling) {
        const distanceX = x + this.rect.x
        const distanceY = y + this.rect.y
        const originX = document.scrollingElement.scrollLeft
        const originY = document.scrollingElement.scrollTop
        const targetX = document.scrollingElement.scrollLeft + distanceX
        const targetY = document.scrollingElement.scrollTop + distanceY
        const rightward = originX < targetX
        const downward = originY < targetY

        let startTime
        function step(currentTime) {
          startTime ??= currentTime
          this.animScrolling = true

          const elapsed = currentTime - startTime
          let currentX = originX + (targetX - originX) / duration * elapsed
          let currentY = originY + (targetY - originY) / duration * elapsed
          if ((rightward && currentX > targetX) || (!rightward && targetX > currentX))
            currentX = targetX
          if ((downward && currentY > targetY) || (!downward && targetY > currentY))
            currentY = targetY
          document.scrollingElement.scrollLeft = currentX
          document.scrollingElement.scrollTop = currentY

          if (currentX != targetX || currentY != targetY)
            requestAnimationFrame(step)
          else
            this.animScrolling = false
        }
        requestAnimationFrame(step)
      }
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
    get uniqueSelector() {
      function* generateSelectors(node) {
        const tag = node.localName
        yield tag
        
        if (node.id)
          yield `${tag}#${node.id}`

        yield* arr(node.classList)
          .map(s => `${tag}.${s}`)
          .sort((a, b) => $$(sel + a, node).length - $$(sel + b, node).length)
        
        yield* arr(node.attributes)
          .filter(s => s.name != 'class' && s.name != 'id')
          .map(s => `${tag}[${s.name}="${s.value}"]`)
        
        const deepChildren = node.nodes.filter(s => s.nodeType == Node.ELEMENT_NODE)
        yield* deepChildren
          .filter(s => s.id)
          .map(s => s.parent == node ? `${tag}:has(> #${s.id})` : `${tag}:has(#${s.id})`)
        
        yield* deepChildren
          .flatMap(el => arr(el.classList).map(s => ({ element: el, className: s })))
          .map(s => s.element.parent == node ? `${tag}:has(> .${s.className})` : `${tag}:has(.${s.className})`)
        
        yield* deepChildren
          .flatMap(el => arr(el.attributes).map(s => ({ element: el, selector: `[${s.name}="${s.value}"]` })))
          .map(s => s.element.parent == node ? `${tag}:has(> ${s.selector})` : `${tag}:has(${s.selector})`)

        if (!node.prev)
          yield `${tag}:first-child`
        if (!node.next)
          yield `${tag}:last-child`
        yield `${tag}:nth-child(${arr(node.parent.children).indexOf(node) + 1})`
      }
      for (const selector of generateSelectors(this)) {
        if ($$(selector).length == 1)
          return selector
      }
    },
  })
  extend(targetWindow.DocumentFragment.prototype, {
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
  extend(targetWindow.Node.prototype, {
    get text() {
      return this.textContent
    },
    set text(value) {
      this.textContent = value
    },
    get parent() {
      return this.parentElement
    },
    get children() {
      return arr(this.childNodes).filter(s => s.isElementNode)
    },
    get prev() {
      let node = this.previousSibling
      while (node && !node.isElementNode)
        node.previousSibling
      return node
    },
    get next() {
      let node = this.nextSibling
      while (node && !node.isElementNode)
        node.nextSibling
      return node
    },
    get isElementNode() {
      return this.nodeType == Node.ELEMENT_NODE
    },
    get isMounted() {
      let node = this
      while (node.parentNode)
        node = node.parentNode
      return node == document
    },
    get leafnodes() {
      return arr(document.createNodeIterator(this, NodeFilter.SHOW_ELEMENT))
        .filter(s => s.children.length == 0)
    },
    get textnodes() {
      return arr(document.createNodeIterator(this, NodeFilter.SHOW_TEXT))
        .filter(s => /\S/.test(s.text))
    },
    get nodes() {
      return arr(document.createNodeIterator(this, NodeFilter.SHOW_ALL))
    },
    closestShared(other) {
      if (this == other)
        return {
          element: this,
          stepsA: 0,
          stepsB: 0,
        }

      const a = this.parentIter().reverse()
      const b = other.parentIter().reverse()

      let i = 0
      while (a[i] && b[i] && a[i] == b[i])
        i++

      return {
        element: a[i - 1],
        stepsA: a.length - (i - 1),
        stepsB: b.length - (i - 1),
      }
    },
    prevIter() {
      const output = []
      let node = this.prev
      while (node) {
        output.push(node)
        node = node.prev
      }
      return output
    },
    nextIter() {
      const output = []
      let node = this.next
      while (node) {
        output.push(node)
        node = node.next
      }
      return output
    },
    parentIter() {
      const output = []
      let node = this.parent
      while (node) {
        output.push(node)
        node = node.parent
      }
      return output
    },
    matches(sel) {
      sel = sel.trim().replaceAll(/\s+/g, ' ').replaceAll(/\s+([+~>])\s+/g, '$1')

      if (this.isElementNode)
        return call(Element.prototype.matches, this, sel)

      if (this.nodeType == Node.TEXT_NODE && sel.endsWith('#text')) {
        const selOper = sel.replace(/#text$/, '').slice(-1)
        const selRest = sel.slice(0, -6)

        if (selOper == '>')
          return this.parent.matches(selRest)
        if (selOper == '+')
          return this.prev.matches(selRest)
        if (selOper == '~')
          return !!this.prevIter().find(s => s.matches(selRest))
        if (selOper == ' ')
          return !!this.parentIter().find(s => s.matches(selRest))
      }
      return false
    },
  })
  extend(targetWindow.NodeIterator.prototype, {
    *[Symbol.iterator]() {
      let n = this.nextNode()
      while (n) {
        yield n
        n = this.nextNode()
      }
    },
  })
  extend(targetWindow.Image.prototype, {
    reload() {
      if (this.isErrored) {
        return new Promise(resolve => {
          this.onload = e => resolve(this)
          this.src = `${this.src.replace(/\?.+$/, '')}?${Date.now()}`
        })
      }
    },
    get isErrored() {
      return this.complete && this.naturalWidth == 0 && this.naturalHeight == 0
    },
  })
  extend(targetWindow.EventTarget, {
    targets: new Map(),
  })
  extend(targetWindow.EventTarget.prototype, {
    addEventListener(type, handler, options) {
      const events = EventTarget.targets.get(this) ?? EventTarget.targets.set(this, []).get(this)
      const target = this
      const state = {
        type,
        handler,
        options,
        method: 'add',
        unlisten() {
          target._removeEventListener(this.type, this.handler, this.options)
        },
      }
      events.push(state)

      this._addEventListener(type, handler, options)
      return state
    },
    removeEventListener(type, handler, options) {
      const events = EventTarget.targets.get(this)
      if (events) {
        const params = events.filter(s => s.type == type && s.handler == handler && equal(s.options, options))
        events.remove(params)

        for (const param of params)
          this._removeEventListener(param.type, param.handler, param.options)
      }
    },
    dispatch(type, props) {
      props = assign({ bubbles: true }, props)

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
      const target = this
      const state = {
        type,
        handler: delegate,
        options,
        method: 'listen',
        unlisten() {
          target._removeEventListener(this.type, this.handler, this.options)
        },
      }
      events.push(state)

      this._addEventListener(type, delegate, options)
      return state
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
}
function defineGlobalFunctions(targetWindow) {
  targetWindow ??= window

  extend(targetWindow, {
    MONKEY_VERSION,

    //--------------- helpers.js ---------------
    arr,
    ent,
    obj,
    has,
    str,
    equal,
    diff,
    range,
    frag,
    serialize,
    keys,
    list,
    getters,
    call,
    char,
    desc,
    define,
    forceDefine,
    undefine,
    extend,
    assign,

    //--------------- time.js ---------------
    time,
    passed,

    //--------------- type.js ---------------
    type,
    is,
    whatis,
    isnull,
    isundef,
    isarr,
    isiter,
    isgen,
    isfn,
    isasynciter,
    isasyncgen,
    isasyncfn,
    isobj,
    isstr,
    isnum,
    isbool,
    issym,
    isbigint,
    isnullobj,
    isstrobj,
    isnumobj,
    isboolobj,
    isprim,
    isdesc,
    isdescs,
    isnode,
    iselem,
    isregex,
    istagged,
    isctor,

    //--------------- dom.js ---------------
    $,
    $$,
    elem,
    $$style,
    $n,
    $$n,
    $a,
    $$a,
    $aa,
    $$aa,
    parentNodes,
    sharedNode,

    //--------------- tools.js ---------------
    openStore,
    hideInactiveCursor,

    //--------------- image.js ---------------
    attachImageEventHandlers,

    //--------------- events.js ---------------
    events,

    //--------------- page.js ---------------
    loadPages,
    imagePage,
    gallery,
    progress,
    stopExecute,

    //--------------- font.js ---------------
    font,
    isMobile,

    //--------------- node.js ---------------
    
    //--------------- debug.js ---------------
    scripts,
    analyze,
    logImportant,

    //--------------- ui.js ---------------
    toast,

    //--------------- style.js ---------------
    hotkeys,
    style,
    styleViolations,

    //--------------- tagged-template.js ---------------
    imp,
    raw,
    regex,
    html,

    //--------------- extend-more.js ---------------
    defineGlobalExtensions,
    defineGlobalFunctions,
  })
}