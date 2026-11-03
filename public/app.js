import {mountReadingList} from '/reading-list.js';
import {mountMusic,prepareMusicView,offerResume} from '/music.js';
import {articleCard,researchRow,collectionCard,aboutView,detailView,tags} from '/content-views.js';
import {mountReadingTools,unmountReadingTools} from '/reading-tools.js';
import {initChrome,mountPageEffects,unmountPageEffects} from '/interactions.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const known=pathname=>pathname==='/'||['/about','/writing','/research','/collection'].includes(pathname)||/^\/(writing|research)\/[a-z0-9-]+$/.test(pathname);
const normalize=pathname=>decodeURI(pathname).replace(/\/$/,'')||'/';

let d=null;
let pageCleanup=()=>{};
let collectionTrigger;
let currentCollectionId;
let composing=false;
const dialog=$('#search-dialog');
const collectionDialog=$('#collection-dialog');
let previousFocus;

const head=(en,title,desc)=>`<div class="page-head"><span class="eyebrow">${en}</span><h1>${esc(title)}</h1><p>${esc(desc)}</p></div>`;
const empty=(title,body)=>`<div class="empty"><span class="empty-rule" aria-hidden="true"></span><h3>${esc(title)}</h3><p class="muted">${esc(body)}</p></div>`;
const section=(en,title,url,label,body)=>`<section class="section" data-section="${url.slice(1)}"><div class="section-head"><div><span class="eyebrow">${en}</span><h2>${title}</h2></div><a href="${url}">${label} ↗</a></div>${body}</section>`;

async function loadData(){
 let last;
 for(let i=0;i<3;i++){
  try{
   const res=await fetch('/data.json',{cache:'no-cache'});
   if(!res.ok)throw Error('无法读取站点内容（'+res.status+'）');
   return await res.json();
  }catch(err){last=err;await new Promise(r=>setTimeout(r,400*(i+1)))}
 }
 throw last;
}

function showLoadError(err){
 document.body.dataset.page='error';
 document.body.classList.remove('detail-page');
 $('#main').innerHTML=head('Temporarily unavailable','内容暂时无法载入','网络或构建结果还没准备好。可以重试，无需刷新整个页面。')+`<p class="muted">${esc(err?.message||'请稍后重试。')}</p><button type="button" class="pill" id="retry-data">重新载入</button>`;
 document.title='内容未载入 · lmr';
 $('#retry-data').onclick=()=>boot();
 $('#main').focus({preventScroll:true});
}

function rememberScroll(){
 try{history.replaceState({...(history.state||{}),scrollY:scrollY},'')}catch{}
}

function updateNav(path){
 $('nav').innerHTML=d.navigation.map(n=>`<a href="${esc(n.path)}" ${path===n.path||n.path!=='/'&&path.startsWith(n.path+'/')?'aria-current="page"':''}>${esc(n.label)}</a>`).join('');
}

function setCanonical(){ document.querySelector('link[rel=canonical]')?.remove(); }

function highlightCode(){
 document.querySelectorAll('pre code').forEach(code=>{
  if(code.dataset.colored)return;
  code.dataset.colored='1';
  code.innerHTML=code.textContent.split(/("(?:[^"\\]|\\.)*")/g).map((part,i)=>i%2?`<span class="syntax-string">${esc(part)}</span>`:esc(part)).join('');
 });
}

function updateReadingChrome(){
 const prose=$('.prose');
 const bar=$('#progress');
 if(!prose){if(bar)bar.style.width='0';return}
 const rect=prose.getBoundingClientRect();
 const length=Math.max(1,rect.height-innerHeight+160);
 bar.style.width=`${Math.max(0,Math.min(100,(140-rect.top)/length*100))}%`;
 const headings=[...prose.querySelectorAll('h2[id]')];
 let active=headings[0]?.id;
 for(const h of headings){if(h.getBoundingClientRect().top<=160)active=h.id}
 document.querySelectorAll('.toc-panel a').forEach(a=>{
  const on=a.hash==='#'+active;
  a.classList.toggle('toc-active',on);
  if(on)a.setAttribute('aria-current','location');
  else a.removeAttribute('aria-current');
 });
}

function buildPage(url){
 const path=normalize(url.pathname);
 if(path==='/')return{
  title:'个人数字展馆',
  html:`<section class="hero"><picture class="hero-image"><source media="(max-width:580px)" srcset="/assets/lmr/hero-nordic-mist.webp"><source media="(max-width:1200px)" srcset="/assets/lmr/hero-nordic-mist-1400.webp"><img src="/assets/lmr/hero-nordic-mist.webp" alt="薄雾与柔和夕光下的北方海湾、雪山与红色木屋；根据提供的参考图生成的无字风景" width="1672" height="940" fetchpriority="high"></picture><div class="hero-copy"><span class="eyebrow">lmr / A personal digital gallery</span><h1><span>保持好奇<span class="title-punctuation">，</span></span><span>持续探索<span class="title-punctuation">。</span></span></h1><div class="hero-introduction"><p>在技术、科学与生活的交汇处，</p><p>记录思考，分享知识，收藏热爱，</p><p>寻找更大的世界。</p></div><a class="pill" href="/about">走近 lmr <span aria-hidden="true">↗</span></a></div><span class="hero-note">A little curiosity<br>for a wider world.</span></section><div class="portals">${[['writing','文章','记录思考与成长'],['research','研究','探索尚未解答的问题'],['collection','收藏','留住值得回味的美好'],['about','关于','在这里，慢慢认识']].map(([p,t,s],i)=>`<a class="portal" href="/${p}"><small class="portal-number">0${i+1} / </small><strong>${t} ↗</strong><span>${s}</span></a>`).join('')}</div>${section('Selected writing','最近的文字','/writing','全部文章',`<div class="grid" style="--secondary-count:${Math.max(1,d.writing.slice(0,3).length-1)}">${d.writing.slice(0,3).map(articleCard).join('')}</div>`)}${section('Open questions','正在探索','/research','研究手记',`<div class="research-grid">${d.research.map(researchRow).join('')}</div>`)}${section('Personal collection','留住一些美好','/collection','走进收藏室',`<div class="collection-preview">${d.collections.items.slice(0,3).map(collectionCard).join('')}</div><p class="collection-disclaimer">音乐条目已加入真实音频，其余标注为演示的陈列待逐步替换。</p>`)}`
 };
 if(path==='/writing')return{title:'文章',html:head('Writing / Notes & thoughts','文章','记录思考，分享发现。让零散的灵感，在文字里慢慢成形。')+`<div class="filters" id="filters"></div><div class="list-status"><p class="meta" id="count" aria-live="polite"></p></div><div class="grid" id="results"></div>`};
 if(path==='/research')return{title:'研究',html:head('Research / Work in progress','研究与探索','从三维表达，到场景重建与交互。这里记录探索方向，实际过程与成果将随研究逐步补充。')+`<div class="research-grid research-index">${d.research.map(researchRow).join('')}</div><div class="research-note"><span class="eyebrow">Field notes</span><h2>从问题出发，向理解靠近。</h2><p class="muted">专题插图仅用于表达概念。这里将逐步记录方法、实验过程、失败案例与尚未解答的问题。</p></div>`};
 if(path==='/about')return{title:'关于',html:aboutView(d,head,empty)};
 if(path==='/collection')return{title:'收藏',html:head('Collection / A cabinet of curiosities','私人收藏室','为喜欢的事物留一个位置。不求丰盛，只愿每一件都值得再次相遇。')+'<div class="collection-intro-note"><span class="edition-marker">陈列样本 / 01</span><p>收录值得停留的声音与片段；标注「演示陈列」的条目仅用于展示版式。</p></div><div class="filters" id="filters"></div><div class="list-status"><p class="meta" id="count" aria-live="polite"></p></div><div id="results" class="grid"></div>'};
 if(path.startsWith('/writing/')||path.startsWith('/research/')){
  const writing=path.startsWith('/writing/');
  const items=writing?d.writing:d.research;
  const p=path.split('/').length===3?items.find(x=>x.slug===path.split('/')[2]):null;
  if(p)return{title:p.title,html:detailView(p,items,writing)};
 }
 return{title:'页面未找到',html:head('404 / Off the trail','走到了小径之外','这个页面还不存在，沿原路回去看看吧。')+'<a class="pill" href="/">返回首页 →</a>'};
}

function mountListFilters(writing){
 const params=new URLSearchParams(location.search);
 const categories=['全部',...(writing?new Set(d.writing.map(p=>p.category)):d.collections.categories)];
 let active=categories.includes(params.get('category'))?params.get('category'):'全部';
 let query=params.get('q')||'';
 $('#filters').innerHTML=categories.map(c=>`<button type="button" data-category="${esc(c)}" aria-pressed="${c===active}">${esc(c)}</button>`).join('')+`<input type="search" value="${esc(query)}" placeholder="${writing?'搜索文章或标签…':'搜索收藏、创作者或标签…'}" aria-label="${writing?'搜索文章或标签':'搜索收藏'}">`;
 const status=$('#count');
 const results=$('#results');

 function syncUrl(mode){
  const next=new URL(location.href);
  if(active==='全部')next.searchParams.delete('category');else next.searchParams.set('category',active);
  if(!query)next.searchParams.delete('q');else next.searchParams.set('q',query);
  const href=next.pathname+next.search+next.hash;
  const current=location.pathname+location.search+location.hash;
  if(href===current){setCanonical(next);return}
  if(mode==='input'){
   if(history.state?.filterEdit)history.replaceState({filterEdit:true,scrollY},'',href);
   else history.pushState({filterEdit:true,scrollY:0},'',href);
  }else if(mode==='push')history.pushState({scrollY:0},'',href);
  else history.replaceState({...(history.state||{}),scrollY},'',href);
  setCanonical(next);
 }

 function matchesQuery(p){
  const parts=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if(!parts.length)return true;
  const blob=`${p.title} ${p.summary||p.note||''} ${p.creator||''} ${(p.tags||[]).join(' ')}`.toLowerCase();
  return parts.every(part=>blob.includes(part));
 }

 function render(){
  const source=writing?d.writing:d.collections.items;
  const items=source.filter(p=>(active==='全部'||p.category===active)&&matchesQuery(p));
  const filtered=Boolean(query||active!=='全部');
  if(!items.length){
   results.innerHTML=filtered
    ?empty('没有找到符合条件的内容',writing?'当前关键词或分类没有匹配的文章。可以换一个词，或清除筛选。':'当前关键词或分类没有匹配的收藏。可以换一个词，或清除筛选。')
    :empty(writing?'暂时没有找到相关文字':'这一格，留给下一次心动',writing?'内容还在整理，请稍后再来看看。':'尚未添加'+(active==='全部'?'收藏':active)+'条目。');
  }else results.innerHTML=items.map((p,i)=>writing?articleCard(p,i):collectionCard(p,i)).join('');
  results.style.setProperty('--secondary-count',Math.max(1,items.length-1));
  results.classList.toggle('writing-results',writing);
  results.classList.toggle('collection-display',!writing);
  const label=writing?`${items.length} 篇文字`:`${items.length} 件收藏`;
  status.replaceChildren(document.createTextNode(label));
  if(filtered){
   status.append(document.createTextNode(' · '));
   const clear=document.createElement('button');
   clear.type='button';
   clear.className='clear-filters';
   clear.textContent='清除筛选';
   clear.onclick=()=>{
    active='全部';
    query='';
    $('#filters input').value='';
    document.querySelectorAll('[data-category]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.category==='全部'));
    syncUrl('push');
    render();
   };
   status.append(clear);
  }
  results.dispatchEvent(new Event('content-updated'));
 }

 $('#filters').addEventListener('click',e=>{
  const b=e.target.closest('[data-category]');
  if(!b)return;
  active=b.dataset.category;
  document.querySelectorAll('[data-category]').forEach(el=>el.setAttribute('aria-pressed',el===b));
  syncUrl('push');
  render();
 });
 const filterInput=$('#filters input');
 let filterComposing=false;
 filterInput.addEventListener('compositionstart',()=>{filterComposing=true});
 filterInput.addEventListener('compositionend',e=>{
  filterComposing=false;
  query=e.target.value;
  syncUrl('input');
  render();
 });
 filterInput.addEventListener('input',e=>{
  if(e.isComposing||filterComposing)return;
  query=e.target.value;
  syncUrl('input');
  render();
 });
 render();
}

function mountCollectionNavigation(p){
 const visible=[...document.querySelectorAll('[data-collection]')].map(b=>b.dataset.collection);
 const ids=visible.includes(p.id)?visible:d.collections.items.map(x=>x.id);
 const index=ids.indexOf(p.id);
 const bar=document.createElement('div');
 bar.className='collection-browse';
 bar.innerHTML='<button type="button" class="collection-prev" aria-label="上一件收藏">← 上一件</button><span>'+String(index+1).padStart(2,'0')+' / '+String(ids.length).padStart(2,'0')+'</span><button type="button" class="collection-next" aria-label="下一件收藏">下一件 →</button>';
 const previous=bar.querySelector('.collection-prev'),next=bar.querySelector('.collection-next');
 previous.disabled=index<=0;next.disabled=index>=ids.length-1;
 function turn(step){
  const original=collectionTrigger;
  showCollection(ids[index+step]);
  collectionTrigger=original;
  collectionDialog.scrollTop=0;
  $('#collection-close').focus();
 }
 previous.onclick=()=>turn(-1);
 next.onclick=()=>turn(1);
 $('#collection-detail .collection-detail-copy')?.append(bar);
}

function showCollection(id){
 currentCollectionId=id;
 const p=d.collections.items.find(item=>item.id===id);
 if(!p)return;
 prepareMusicView();
 collectionTrigger=document.activeElement;
 $('#collection-detail').innerHTML=`<div class="collection-detail-art">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.title)}">`:`<blockquote>${esc(p.quote||p.title)}</blockquote>`}</div><div class="collection-detail-copy"><span class="eyebrow">${esc(p.category)} / ${p.status==='demo'?'演示陈列':'私人收藏'}</span><h2 id="collection-detail-title">${esc(p.title)}</h2>${p.creator?`<p class="meta">${esc(p.creator)}</p>`:''}<p>${esc(p.note||p.reason||p.summary)}</p>${p.audio?'<div class="music-player"></div>':''}${tags(p.tags)}${p.date?`<p class="meta">记录于 ${esc(p.date)}</p>`:''}${/^https?:\/\//.test(p.sourceUrl||p.url||'')?`<a class="source-link" href="${esc(p.sourceUrl||p.url)}" target="_blank" rel="noopener noreferrer">查看来源 ↗</a>`:''}${p.status==='demo'?'<p class="demo-footnote">此条目仅用于陈列演示，不代表 lmr 的真实收藏与偏好。</p>':''}</div>`;
 collectionDialog.classList.toggle('music-dialog',Boolean(p.audio));
 if(!collectionDialog.open)collectionDialog.showModal();
 if(p.audio)mountMusic(p);
 mountCollectionNavigation(p);
 const detail=$('#collection-detail');
 if(detail&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  detail.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.22,.61,.36,1)'});
 }
}

function searchEntries(){
 return [
  ...d.navigation.map(n=>({title:n.label,url:n.path,type:'页面',group:'页面',text:''})),
  ...d.writing.map(p=>({title:p.title,url:'/writing/'+p.slug,type:p.status==='demo'?'文章 · 演示内容':'文章',group:'文章',text:(p.summary||'')+' '+(p.tags||[]).join(' '),tags:(p.tags||[]).join(' ')})),
  ...d.research.map(p=>({title:p.title,url:'/research/'+p.slug,type:'研究方向',group:'研究',text:p.summary||'',tags:(p.methods||[]).join(' ')})),
  ...d.collections.items.map(p=>({title:p.title,url:'/collection?item='+encodeURIComponent(p.id),type:p.status==='demo'?'收藏 · 演示陈列':'收藏',group:'收藏',text:p.note||'',tags:(p.tags||[]).join(' ')}))
 ];
}

function queryParts(query){
 return String(query||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function scoreEntry(entry,query){
 const parts=queryParts(query);
 if(!parts.length)return 1;
 const title=entry.title.toLowerCase();
 const tags=(entry.tags||'').toLowerCase();
 const text=(entry.text||'').toLowerCase();
 const blob=`${title} ${tags} ${text}`;
 if(!parts.every(part=>blob.includes(part)))return 0;
 if(parts.length===1&&title===parts[0])return 100;
 if(parts.every(part=>title.includes(part)))return 80;
 if(parts.every(part=>`${title} ${tags}`.includes(part)))return 50;
 return 20;
}

function highlightText(text,query){
 const frag=document.createDocumentFragment();
 const parts=queryParts(query);
 if(!parts.length){frag.append(document.createTextNode(text));return frag}
 const lower=text.toLowerCase();
 const spans=[];
 for(const part of parts){
  let i=0;
  while(i<lower.length){
   const found=lower.indexOf(part,i);
   if(found<0)break;
   spans.push([found,found+part.length]);
   i=found+Math.max(part.length,1);
  }
 }
 spans.sort((a,b)=>a[0]-b[0]||b[1]-a[1]);
 const merged=[];
 for(const span of spans){
  const last=merged.at(-1);
  if(!last||span[0]>last[1])merged.push([span[0],span[1]]);
  else last[1]=Math.max(last[1],span[1]);
 }
 let i=0;
 for(const [start,end] of merged){
  if(start>i)frag.append(document.createTextNode(text.slice(i,start)));
  const mark=document.createElement('mark');
  mark.textContent=text.slice(start,end);
  frag.append(mark);
  i=end;
 }
 if(i<text.length)frag.append(document.createTextNode(text.slice(i)));
 return frag;
}

function search(){
 const query=$('#global-query').value.trim();
 const ranked=searchEntries().map(p=>({p,score:scoreEntry(p,query)})).filter(row=>row.score>0).sort((a,b)=>b.score-a.score||a.p.title.localeCompare(b.p.title,'zh'));
 const box=$('#global-results');
 box.replaceChildren();
 if(!ranked.length){
  const note=document.createElement('p');
  note.className='muted';
  note.textContent='没有找到相关内容，试试其他关键词。';
  box.append(note);
  return;
 }
 const order=['文章','研究','收藏','页面'];
 for(const group of order){
  const items=ranked.filter(row=>row.p.group===group).map(row=>row.p);
  if(!items.length)continue;
  const heading=document.createElement('p');
  heading.className='search-group';
  heading.textContent=`${group} · ${items.length}`;
  box.append(heading);
  for(const p of items){
   const a=document.createElement('a');
   a.href=p.url;
   const small=document.createElement('small');
   small.textContent=p.type;
   a.append(small);
   a.append(highlightText(p.title,query));
   a.append(document.createTextNode(' ↗'));
   box.append(a);
  }
 }
}

function openSearch(){
 if(!d)return;
 previousFocus=document.activeElement;
 dialog.showModal();
 search();
 $('#global-query').focus();
}

function shouldCapture(a,e){
 if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return false;
 if(a.hasAttribute('download'))return false;
 if(a.target&&a.target!=='_self')return false;
 let url;
 try{url=new URL(a.getAttribute('href'),location.origin)}catch{return false}
 if(url.origin!==location.origin)return false;
 if(!known(normalize(url.pathname)))return false;
 if(normalize(url.pathname)===normalize(location.pathname)&&url.search===location.search)return false;
 return true;
}

function unmountPage(){
 pageCleanup();
 pageCleanup=()=>{};
 unmountReadingTools();
 unmountPageEffects();
}

function mountPage(url){
 const path=normalize(url.pathname);
 if(path==='/writing'||path==='/collection')mountListFilters(path==='/writing');
 if($('#share'))$('#share').onclick=async()=>{
  try{await navigator.clipboard.writeText(location.href);$('#toast').textContent='链接已复制'}
  catch{$('#toast').textContent='无法复制，请从地址栏复制链接'}
  setTimeout(()=>{$('#toast').textContent=''},3000);
 };
 highlightCode();
 mountReadingTools();
 mountReadingList(d.writing,path);
 mountPageEffects();
 if(path==='/collection'){
  const id=url.searchParams.get('item');
  if(id)showCollection(id);
 }
 updateReadingChrome();
}

let shellReady=false;

export function renderPage(href,{mode='push',scroll='top'}={}){
 if(!d)return;
 unmountPage();
 if(dialog.open)dialog.close();
 if(collectionDialog.open)collectionDialog.close();
 $('nav').classList.remove('open');
 $('#menu').setAttribute('aria-expanded','false');
 $('#menu').setAttribute('aria-label','展开导航');

 const url=href instanceof URL?href:new URL(href,location.origin);
 const path=normalize(url.pathname);
 if(mode==='push'){
  rememberScroll();
  history.pushState({scrollY:0},'',url.pathname+url.search+url.hash);
 }else if(mode==='replace'){
  history.replaceState({scrollY:history.state?.scrollY||0},'',url.pathname+url.search+url.hash);
 }

 const page=buildPage(url);
 document.body.dataset.page=path==='/'?'home':path.split('/')[1];
 document.body.classList.toggle('detail-page',path.split('/').length>2);
 $('#main').innerHTML=page.html;
 updateNav(path);
 document.title=`${page.title} · ${d.siteMetadata.name}`;
 const description=document.querySelector('.detail-deck,.page-head p')?.textContent||d.siteMetadata.description;
 document.querySelector('meta[name=description]').content=description;
 document.querySelector('meta[property="og:title"]').content=document.title;
 setCanonical(url);
 mountPage(url);

 if(url.hash){
  const target=document.getElementById(decodeURIComponent(url.hash.slice(1)));
  target?.scrollIntoView();
 }else if(scroll==='top')scrollTo(0,0);
 else if(typeof scroll==='number')scrollTo(0,scroll);

 $('#main').focus({preventScroll:true});
}

function initShell(){
 if(shellReady)return;
 shellReady=true;
 initChrome();
 $('#menu').onclick=()=>{
  const open=$('nav').classList.toggle('open');
  $('#menu').setAttribute('aria-expanded',open);
  $('#menu').setAttribute('aria-label',open?'收起导航':'展开导航');
 };
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   $('nav').classList.remove('open');
   $('#menu').setAttribute('aria-expanded','false');
  }
 });
 $('#theme').onclick=()=>{
  const v=document.documentElement.dataset.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=v;
  try{localStorage.theme=v}catch{}
 };
 matchMedia('(prefers-color-scheme: dark)').addEventListener('change',e=>{
  try{if(!localStorage.theme)document.documentElement.dataset.theme=e.matches?'dark':'light'}catch{}
 });

 $('#search-open').onclick=openSearch;
 $('#search-close').onclick=()=>dialog.close();
 let compositionSettled=true;
 $('#global-query').oninput=e=>{if(e.isComposing||composing)return;search()};
 $('#global-query').addEventListener('compositionstart',()=>{composing=true;compositionSettled=false});
 $('#global-query').addEventListener('compositionend',()=>{
  composing=false;
  compositionSettled=false;
  search();
  setTimeout(()=>{compositionSettled=true},0);
 });
 dialog.addEventListener('close',()=>previousFocus?.focus());
 dialog.addEventListener('click',e=>{
  if(e.target===dialog){
   const r=dialog.getBoundingClientRect();
   if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  }
 });
 dialog.addEventListener('keydown',e=>{
  if(e.isComposing||e.key==='Process'||e.keyCode===229||composing||!compositionSettled)return;
  const links=[...dialog.querySelectorAll('#global-results a')];
  if(!links.length)return;
  const index=links.indexOf(document.activeElement);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
   e.preventDefault();
   const next=e.key==='ArrowDown'?(index+1)%links.length:(index<=0?links.length-1:index-1);
   links.forEach((link,i)=>i===next?link.setAttribute('aria-selected','true'):link.removeAttribute('aria-selected'));
   links[next].focus();
  }else if(e.key==='Enter'&&document.activeElement.id==='global-query'){
   e.preventDefault();
   links[0].click();
  }
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&dialog.open){e.preventDefault();dialog.close();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();dialog.open?dialog.close():openSearch()}
 });

 document.addEventListener('error',e=>{
  if(e.target instanceof HTMLImageElement){
   const img=e.target;
   img.replaceWith(Object.assign(document.createElement('span'),{className:'image-fallback',textContent:img.alt||'图像暂不可用'}));
  }
 },true);

 document.addEventListener('click',e=>{
  const trigger=e.target.closest('[data-collection]');
  if(trigger){e.preventDefault();showCollection(trigger.dataset.collection);return}
  const a=e.target.closest('a[href]');
  if(!a||!shouldCapture(a,e))return;
  e.preventDefault();
  renderPage(new URL(a.getAttribute('href'),location.origin),{mode:'push',scroll:'top'});
 });
 $('#collection-close').onclick=()=>collectionDialog.close();
 collectionDialog.addEventListener('close',()=>collectionTrigger?.focus());
 collectionDialog.addEventListener('click',e=>{
  if(e.target===collectionDialog){
   const r=collectionDialog.getBoundingClientRect();
   if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)collectionDialog.close();
  }
 });
 document.addEventListener('open-music-album',e=>showCollection(e.detail));
 addEventListener('scroll',updateReadingChrome,{passive:true});
 addEventListener('resize',updateReadingChrome);
 addEventListener('popstate',()=>renderPage(location.href,{mode:'none',scroll:history.state?.scrollY??0}));
}

async function boot(){
 initShell();
 try{
  d=await loadData();
 }catch(err){
  showLoadError(err);
  return;
 }
 offerResume(d.collections.items);
 const restore=history.state?.scrollY;
 renderPage(location.href,{mode:'replace',scroll:typeof restore==='number'?restore:'top'});
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.body.classList.add('page-ready');
}

boot();
