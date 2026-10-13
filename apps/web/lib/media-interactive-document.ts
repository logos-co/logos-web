import { prepareCmsLinks } from './html-links'

const EMBED_CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https:; media-src https:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com; connect-src https:; frame-src https:;">`

export function injectEmbedCsp(html: string): string {
  if (/<meta[^>]+http-equiv=["']Content-Security-Policy["']/i.test(html)) {
    return html
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${EMBED_CSP}`)
  }
  return `<!doctype html><html><head><meta charset="utf-8" />${EMBED_CSP}</head><body>${html}</body></html>`
}

export function buildInteractiveDocument(
  fullHtml: string,
  frameId: string
): string {
  const linkScript = `<script>(function(){
    document.querySelectorAll('a[href]').forEach(function(link){
      if(link.getAttribute('href').charAt(0)==='#')return;
      if(!link.target)link.target='_blank';
      link.rel='noopener noreferrer';
    });
  })();</script>`
  const heightScript = `<script>(function(){
    var frameId=${JSON.stringify(frameId).replace(/</g, '\\u003c')};
    var last=-1;
    function post(force){
      var body=document.body;
      if(!body)return;
      var rect=body.getBoundingClientRect();
      var marginBottom=parseFloat(getComputedStyle(body).marginBottom)||0;
      // The root scrollHeight includes the iframe viewport and cannot shrink.
      var height=Math.ceil(rect.top+window.scrollY+Math.max(rect.height,body.scrollHeight)+marginBottom);
      if((height===last&&force!==true)||height<=0)return;
      last=height;
      parent.postMessage({type:'logos-media-embed-height',frameId:frameId,height:height},'*');
    }
    new MutationObserver(post).observe(document.body,{childList:true,subtree:true,attributes:true,characterData:true});
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(post).observe(document.body);
    window.addEventListener('message',function(event){
      var data=event.data;
      if(event.source===parent&&data&&data.type==='logos-media-embed-request-height'&&data.frameId===frameId)post(true);
    });
    window.addEventListener('load',post);
    window.addEventListener('resize',post);
    document.addEventListener('load',post,true);
    if(document.fonts)document.fonts.ready.then(post);
    post();
  })();</script>`
  const withCsp = injectEmbedCsp(prepareCmsLinks(fullHtml))

  return /<[/]body>/i.test(withCsp)
    ? withCsp.replace(/<[/]body>/i, () => `${linkScript}${heightScript}</body>`)
    : `${withCsp}${linkScript}${heightScript}`
}
