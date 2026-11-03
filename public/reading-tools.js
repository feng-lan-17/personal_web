// Preferences and bookmarks stay on this device; no account or tracking.
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};

let unbind=()=>{};

export function unmountReadingTools(){
 unbind();
 unbind=()=>{};
}

export function mountReadingTools(){
 unmountReadingTools();
 const prose=document.querySelector('.prose');
 const aside=document.querySelector('.reading aside');
 if(!prose||!aside)return;

 const tools=document.createElement('details');
 tools.className='reading-tools';
 tools.setAttribute('aria-label','阅读设置');
 tools.innerHTML='<summary>阅读设置</summary><span class="eyebrow">Make yourself comfortable</span><div class="type-controls" role="group" aria-label="正文字号"><button type="button" data-size="17" aria-label="标准字号">标准</button><button type="button" data-size="19" aria-label="较大字号">大字</button><button type="button" data-size="21" aria-label="最大字号">更大</button></div><button type="button" class="bookmark">记下当前位置</button><button type="button" class="resume" hidden>回到书签位置 ↗</button><p class="reading-hint" role="status">字号与书签仅保存在此浏览器。</p>';
 aside.append(tools);

 const toggle=aside.querySelector('.toc-toggle');
 const panel=aside.querySelector('.toc-panel');
 const mq=matchMedia('(max-width:900px)');
 function syncChrome(){
  const mobile=mq.matches;
  if(toggle){
   toggle.hidden=!mobile;
   if(!mobile){
    if(panel)panel.hidden=false;
    toggle.setAttribute('aria-expanded','true');
   }else if(toggle.getAttribute('aria-expanded')!=='true'){
    if(panel)panel.hidden=true;
   }
  }
  if(mobile)tools.open=false;
  else tools.open=true;
 }
 function onToggle(){
  const open=toggle.getAttribute('aria-expanded')!=='true';
  toggle.setAttribute('aria-expanded',String(open));
  if(panel)panel.hidden=!open;
 }
 toggle?.addEventListener('click',onToggle);
 mq.addEventListener('change',syncChrome);
 syncChrome();

 function size(value){
  const n=[17,19,21].includes(Number(value))?Number(value):17;
  prose.style.setProperty('--reader-size',n+'px');
  tools.querySelectorAll('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.size===n)));
 }
 size(read('lmr-reader-size',17));
 tools.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{size(b.dataset.size);write('lmr-reader-size',+b.dataset.size)});

 const key='lmr-reading:'+location.pathname;
 const paragraphs=[...prose.querySelectorAll('p,h2,pre,figure')];
 const resume=tools.querySelector('.resume');
 const hint=tools.querySelector('.reading-hint');
 let saved=read(key,null);
 function resolveBookmark(value){
  if(!value?.text)return null;
  const matches=paragraphs.filter(p=>p.textContent.trim()===value.text);
  return matches.length===1?matches[0]:null;
 }
 resume.hidden=!resolveBookmark(saved);
 if(saved&&!resolveBookmark(saved))hint.textContent='原书签无法可靠定位，请从头阅读并重新记录。';
 tools.querySelector('.bookmark').onclick=()=>{
  let index=paragraphs.findIndex(p=>p.getBoundingClientRect().bottom>100);
  if(index<0)index=paragraphs.length-1;
  saved={version:2,text:paragraphs[index]?.textContent.trim()||''};
  if(write(key,saved)){resume.hidden=false;hint.textContent='已记下位置，下次可从这里继续。'}
  else hint.textContent='浏览器未允许保存，可在本次阅读中使用。';
 };
 resume.onclick=()=>resolveBookmark(saved)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});

 const end=document.querySelector('.reading-end');
 if(end){
  const top=document.createElement('button');
  top.type='button';
  top.className='reading-top';
  top.textContent='回到文章开头 ↑';
  top.onclick=()=>document.querySelector('.detail-heading')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  end.append(top);
 }

 unbind=()=>{
  toggle?.removeEventListener('click',onToggle);
  mq.removeEventListener('change',syncChrome);
 };
}
