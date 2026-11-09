/**
 * Interactive embeds run CMS-authored scripts. Without `allow-same-origin`
 * a srcdoc frame gets an opaque origin, so those scripts cannot touch the
 * logos.co DOM, cookies or storage. Links opened from the frame escape the
 * sandbox so external sites work normally in their new tab.
 */
export const INTERACTIVE_FRAME_SANDBOX =
  'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms'

export const FRAME_HEIGHT_MESSAGE = 'logos-media-frame-height'
export const FRAME_NAVIGATE_MESSAGE = 'logos-media-frame-navigate'
export const FRAME_SYNC_MESSAGE = 'logos-media-frame-sync'

/** Which storage APIs the site origin offers, as seen from logos.co itself. */
export interface HostStorage {
  cookies: boolean
  /** `navigator.cookieEnabled`, which can stay true while writes are blocked. */
  cookieEnabled: boolean
  localStorage: boolean
  sessionStorage: boolean
  indexedDB: boolean
  caches: boolean
  serviceWorker: boolean
}

/** What almost every browser allows. Used when nothing was measured. */
export const DEFAULT_HOST_STORAGE: Readonly<HostStorage> = Object.freeze({
  cookies: true,
  cookieEnabled: true,
  localStorage: true,
  sessionStorage: true,
  indexedDB: true,
  caches: true,
  serviceWorker: true,
})

const HOST_STORAGE_KEYS = Object.keys(DEFAULT_HOST_STORAGE) as Array<
  keyof HostStorage
>

const PROBE_KEY = '__logos_storage_probe'

/**
 * Runs on logos.co, in our own code, the same checks an article would run if
 * it still shared the site origin. Cleans up after itself.
 */
export function probeHostStorage(view: Window): HostStorage {
  const attempt = (test: () => boolean) => {
    try {
      return test()
    } catch {
      return false
    }
  }
  const webStorage = (name: 'localStorage' | 'sessionStorage') =>
    attempt(() => {
      const storage = view[name]
      storage.setItem(PROBE_KEY, '1')
      storage.removeItem(PROBE_KEY)
      return true
    })
  return {
    cookies: attempt(() => {
      const document = view.document
      document.cookie = `${PROBE_KEY}=1; path=/; SameSite=Lax`
      const stored = document.cookie.split('; ').includes(`${PROBE_KEY}=1`)
      document.cookie = `${PROBE_KEY}=; path=/; max-age=0; SameSite=Lax`
      return stored
    }),
    cookieEnabled: attempt(() => view.navigator.cookieEnabled === true),
    localStorage: webStorage('localStorage'),
    sessionStorage: webStorage('sessionStorage'),
    indexedDB: attempt(() => !!view.indexedDB),
    caches: attempt(() => !!view.caches),
    serviceWorker: attempt(() => !!view.navigator.serviceWorker),
  }
}

/** The iframe's content box, measured by the parent before the frame loads. */
export interface FrameSize {
  width: number
  height: number
}

export function measureFrame(iframe: HTMLIFrameElement): FrameSize {
  return { width: iframe.clientWidth, height: iframe.clientHeight }
}

/**
 * Chrome renders sandboxed frames in their own process, which may not know
 * its size yet while the article's first scripts run, so `innerWidth` and
 * `innerHeight` read 0. Until the real values arrive, they report the size
 * the parent measured, which is what a same-origin frame would report.
 */
function sizeSource(size: FrameSize | undefined): string {
  const width = Math.max(0, Math.round(Number(size?.width) || 0))
  const height = Math.max(0, Math.round(Number(size?.height) || 0))
  if (!width || !height) return ''
  return `(function(fallback){
['innerWidth','innerHeight'].forEach(function(name){var native=Object.getOwnPropertyDescriptor(window,name);if(!native||!native.get)return;try{Object.defineProperty(window,name,{configurable:true,enumerable:native.enumerable,get:function(){var value=native.get.call(window);return value>0?value:fallback[name];},set:native.set});}catch(error){}});
})(${JSON.stringify({ innerWidth: width, innerHeight: height })});
`
}

/** Arbitrary upper bound so a broken embed cannot stretch the page forever. */
const MAX_FRAME_HEIGHT = 100_000

/**
 * Mirrors the site's storage support inside the opaque frame, so an article
 * that checks for storage gets the answer it would get on logos.co while
 * nothing it writes ever reaches logos.co.
 *
 * Cookies, localStorage and sessionStorage work in memory for the life of the
 * frame when the site allows them, and behave as blocked when it does not.
 * IndexedDB, the Cache API and service workers are present or absent as on the
 * site. Where the sandbox hides them, a stand-in whose calls fail with a
 * SecurityError takes their place, which is how a sandboxed IndexedDB already
 * behaves natively. Nothing here throws on plain property access.
 */
function storageSource(storage: HostStorage): string {
  return `(function(allowed){
function denied(){return new DOMException('The operation is insecure.','SecurityError');}
function define(target,name,get){try{Object.defineProperty(target,name,{get:get,configurable:true});}catch(error){}}
function memoryStorage(){var data=new Map();var api={key:function(index){var keys=Array.from(data.keys());return index>=0&&index<keys.length?keys[index]:null;},getItem:function(key){key=String(key);return data.has(key)?data.get(key):null;},setItem:function(key,value){data.set(String(key),String(value));},removeItem:function(key){data.delete(String(key));},clear:function(){data.clear();}};
return new Proxy(api,{get:function(target,name){if(name==='length')return data.size;if(typeof name!=='string'||name in target)return target[name];return data.has(name)?data.get(name):undefined;},set:function(target,name,value){if(typeof name==='string'&&!(name in target)&&name!=='length')data.set(name,String(value));return true;},has:function(target,name){return name in target||data.has(name);},deleteProperty:function(target,name){data.delete(String(name));return true;},ownKeys:function(){return Array.from(data.keys());},getOwnPropertyDescriptor:function(target,name){if(data.has(name))return{value:data.get(name),writable:true,enumerable:true,configurable:true};}});}
['localStorage','sessionStorage'].forEach(function(name){var store=allowed[name]?memoryStorage():null;define(window,name,function(){if(!store)throw denied();return store;});});
var jar=new Map();
try{Object.defineProperty(document,'cookie',{configurable:true,get:function(){return Array.from(jar,function(entry){return entry[0]?entry[0]+'='+entry[1]:entry[1];}).join('; ');},set:function(raw){if(!allowed.cookies)return;var parts=String(raw).split(';');var pair=parts[0];var split=pair.indexOf('=');var name=split<0?'':pair.slice(0,split).trim();var value=(split<0?pair:pair.slice(split+1)).trim();var expired=parts.slice(1).some(function(part){var at=part.indexOf('=');var key=(at<0?part:part.slice(0,at)).trim().toLowerCase();var attr=at<0?'':part.slice(at+1).trim();return(key==='max-age'&&Number(attr)<=0)||(key==='expires'&&Date.parse(attr)<Date.now());});if(expired)jar.delete(name);else jar.set(name,value);}});}catch(error){}
define(window.navigator,'cookieEnabled',function(){return allowed.cookieEnabled;});
function failing(target,methods){methods.forEach(function(method){target[method]=function(){return Promise.reject(denied());};});return target;}
function mirror(target,name,present,standIn){var value;var readable=true;try{value=target[name];}catch(error){readable=false;}if(!present){define(target,name,function(){});return;}if(readable&&value)return;var made=null;define(target,name,function(){if(!made)made=standIn();return made;});}
mirror(window,'indexedDB',allowed.indexedDB,function(){return{open:function(){throw denied();},deleteDatabase:function(){throw denied();},cmp:function(){throw denied();},databases:function(){return Promise.reject(denied());}};});
mirror(window,'caches',allowed.caches,function(){return failing({},['open','has','delete','keys','match']);});
mirror(window.navigator,'serviceWorker',allowed.serviceWorker,function(){var container=failing(new EventTarget(),['register','getRegistration','getRegistrations']);container.controller=null;container.ready=new Promise(function(){});container.startMessages=function(){};return container;});
})(${JSON.stringify(pickHostStorage(storage))});`
}

function pickHostStorage(storage: HostStorage): HostStorage {
  return Object.fromEntries(
    HOST_STORAGE_KEYS.map((key) => [key, storage[key] === true])
  ) as unknown as HostStorage
}

/**
 * Runs inside the frame. The parent can no longer reach the frame document,
 * so the frame styles itself, measures itself and asks the parent to follow
 * site links. It is injected before any authored markup, so a CSP declared by
 * the article applies only after this script has already run.
 *
 * The frame never scrolls sideways. Content wider than the article column
 * would otherwise give the frame a horizontal scrollbar, and with classic
 * scrollbars that bar takes height from the frame, so the article overflows
 * vertically too and the frame traps the mouse wheel.
 */
export function interactiveFrameSource(
  storage: HostStorage = DEFAULT_HOST_STORAGE,
  size?: FrameSize
): string {
  return `${sizeSource(size)}${storageSource(storage)}
(function(){
var host=window.parent;if(host===window)return;
document.documentElement.style.setProperty('overflow-x','hidden','important');
var last=-1;
function measure(){var body=document.body;if(!body)return;var rect=body.getBoundingClientRect();var marginBottom=parseFloat(getComputedStyle(body).marginBottom)||0;var height=Math.ceil(rect.top+window.scrollY+Math.max(rect.height,body.scrollHeight)+marginBottom);if(height<=0||height===last)return;last=height;host.postMessage({type:${JSON.stringify(FRAME_HEIGHT_MESSAGE)},height:height},'*');}
function navigate(event){if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;var link=event.target&&event.target.closest?event.target.closest('a[href]'):null;if(!link||link.hasAttribute('download'))return;var href=link.getAttribute('href');if(!/^\\/(?![\\/\\\\])/.test(href)||(link.target&&link.target.toLowerCase()!=='_self'))return;event.preventDefault();host.postMessage({type:${JSON.stringify(FRAME_NAVIGATE_MESSAGE)},href:href},'*');}
function connect(){var roots=[document.documentElement,document.body];for(var i=0;i<roots.length;i++){if(roots[i])roots[i].style.setProperty('background','transparent','important');}var links=document.querySelectorAll('a[href]');for(var j=0;j<links.length;j++){if(links[j].target.toLowerCase()==='_blank')links[j].relList.add('noopener','noreferrer');}if(document.body){new MutationObserver(measure).observe(document.body,{childList:true,subtree:true,attributes:true,characterData:true});if(typeof ResizeObserver!=='undefined')new ResizeObserver(measure).observe(document.body);}measure();}
document.addEventListener('click',navigate);
document.addEventListener('load',measure,true);
window.addEventListener('load',measure);
window.addEventListener('resize',measure);
window.addEventListener('message',function(event){if(event.source===host&&event.data&&event.data.type===${JSON.stringify(FRAME_SYNC_MESSAGE)}){last=-1;measure();}});
if(document.fonts)document.fonts.ready.then(measure);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect);else connect();
})();`
}

export function interactiveFrameScript(
  storage: HostStorage = DEFAULT_HOST_STORAGE,
  size?: FrameSize
): string {
  return `<script>${interactiveFrameSource(storage, size)}</script>`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** A same-origin path, or null for anything that would leave the site. */
function sitePath(href: unknown, base: Location): string | null {
  if (typeof href !== 'string' || !/^\/(?![/\\])/.test(href)) return null
  let url: URL
  try {
    url = new URL(href, base.href)
  } catch {
    return null
  }
  if (url.origin !== base.origin) return null
  return `${url.pathname}${url.search}${url.hash}`
}

/**
 * Listens to the script injected by INTERACTIVE_FRAME_SCRIPT. Messages are
 * accepted only from this iframe's window, and navigation only to site paths.
 */
export function observeInteractiveFrame(
  iframe: HTMLIFrameElement,
  onHeight?: (height: number) => void
): () => void {
  const host = iframe.ownerDocument.defaultView
  if (!host) return () => {}

  function handleMessage(event: MessageEvent) {
    if (event.source !== iframe.contentWindow || !isRecord(event.data)) return
    const { type, height, href } = event.data

    if (type === FRAME_HEIGHT_MESSAGE) {
      if (!onHeight || typeof height !== 'number' || !Number.isFinite(height))
        return
      onHeight(Math.max(1, Math.min(Math.ceil(height), MAX_FRAME_HEIGHT)))
      return
    }
    if (type === FRAME_NAVIGATE_MESSAGE) {
      const path = sitePath(href, host!.location)
      if (path) host!.location.assign(path)
    }
  }

  // The frame may report before hydration attaches this listener.
  function sync() {
    iframe.contentWindow?.postMessage({ type: FRAME_SYNC_MESSAGE }, '*')
  }

  host.addEventListener('message', handleMessage)
  iframe.addEventListener('load', sync)
  sync()
  return () => {
    host.removeEventListener('message', handleMessage)
    iframe.removeEventListener('load', sync)
  }
}
