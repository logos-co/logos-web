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

/** Properties whose getters throw in an opaque origin, by owning object. */
const OPAQUE_ORIGIN_STORAGE = {
  window: ['caches', 'indexedDB', 'localStorage', 'sessionStorage'],
  navigator: ['serviceWorker'],
}

/** Arbitrary upper bound so a broken embed cannot stretch the page forever. */
const MAX_FRAME_HEIGHT = 100_000

/**
 * Runs inside the frame. The parent can no longer reach the frame document,
 * so the frame styles itself, measures itself and asks the parent to follow
 * site links. It is injected before any authored markup, so a CSP declared by
 * the article applies only after this script has already run.
 *
 * Storage getters throw a SecurityError in an opaque origin. They become
 * undefined instead, so an article that feature-detects with `!!window.caches`
 * sees the API as missing rather than crashing.
 */
export const INTERACTIVE_FRAME_SOURCE = `(function(){
function hideBlocked(target,names){names.forEach(function(name){try{void target[name];}catch(error){try{Object.defineProperty(target,name,{value:undefined,configurable:true});}catch(ignored){}}});}
hideBlocked(window,${JSON.stringify(OPAQUE_ORIGIN_STORAGE.window)});hideBlocked(window.navigator,${JSON.stringify(OPAQUE_ORIGIN_STORAGE.navigator)});
var host=window.parent;if(host===window)return;
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

export const INTERACTIVE_FRAME_SCRIPT = `<script>${INTERACTIVE_FRAME_SOURCE}</script>`

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
