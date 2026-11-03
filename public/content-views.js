export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const linkOK=url=>/^https?:\/\//.test(url||'')||/^\/(?!\/)/.test(url||'');
const inline=s=>esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
export const statusLabel=s=>({idea:'构想阶段',exploring:'探索中',documenting:'学习记录',completed:'已完成'})[s]||'探索方向';
export const tags=items=>`<div class="tags">${(items||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`;
export function articleCard(p,i){return `<a class="card" href="/writing/${esc(p.slug)}"><div class="cover"><img src="${esc(p.cover||'/assets/lmr/writing-open-book.svg')}" alt="${esc(p.title)}的概念封面" width="800" height="500" loading="lazy"></div><div class="card-copy"><span class="meta">${esc(p.category)}<span class="meta-dot">·</span>${p.status==='demo'?'演示内容':esc(p.publishedAt||'未注明日期')}</span><h3>${esc(p.title)} <span class="arrow" aria-hidden="true">↗</span></h3><p>${esc(p.summary)}</p>${tags(p.tags)}<span class="read-link">阅读这篇文字 <span aria-hidden="true">↗</span></span></div></a>`}
export function researchRow(r,i){return `<a class="research-card" href="/research/${esc(r.slug)}"><div class="research-art"><img src="${esc(r.cover)}" alt="${esc(r.title)}概念示意，非实验截图" width="800" height="500" loading="lazy"></div><div class="research-copy"><div class="research-meta"><span class="eyebrow">0${i+1} / ${esc(r.field||r.area)}</span><span class="status">${statusLabel(r.status)}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.question||r.summary)}</p>${tags(r.methods)}</div></a>`}
export function collectionCard(p,i=0){return `<button class="collection-card" type="button" data-collection="${esc(p.id)}" aria-label="查看${esc(p.title)}${p.status==='demo'?'（演示陈列）':''}"><span class="collection-art ${esc(p.display||'')}">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.title)}${p.status==='demo'?'概念图':''}" loading="lazy" width="600" height="600">`:`<span class="quote-object">${esc(p.quote||p.title)}</span>`}</span><span class="collection-caption"><span class="meta">${String(i+1).padStart(2,'0')} / ${esc(p.category)}${p.status==='demo'?' · 演示陈列':''}</span><strong>${esc(p.title)}</strong><span class="collection-note">${esc(p.note||p.reason||p.summary)}</span><span class="read-link">${p.audio?'播放音乐':'展开私人备注'} ↗</span></span></button>`}
export function aboutView(d,head,empty){return head('About / An open notebook','关于这里',d.about.intro)+`<div class="about-story"><section class="about-narrative"><span class="eyebrow">A place to keep looking</span><h2>把好奇留下，<br>让思考有迹可循。</h2>${(d.about.paragraphs||[d.brand.intro]).map(p=>`<p>${esc(p)}</p>`).join('')}<h3 class="small-title">关注的领域</h3>${tags(d.about.interests)}<figure class="about-image"><img src="/assets/lmr/hero-nordic-mist.webp" alt="雪山与北方海湾的意境图" width="1672" height="940" loading="lazy"><figcaption>视觉札记 / 北方海岸 · AI 意境素材，非个人实拍</figcaption></figure></section><div class="about-aside"><section class="current-tracks"><span class="eyebrow">Currently exploring</span><h2>把问题，慢慢展开</h2>${d.research.map((r,i)=>`<a href="/research/${esc(r.slug)}"><span class="track-number">0${i+1}</span><div><h3>${esc(r.shortTitle||r.title)}</h3><p>${statusLabel(r.status)} · ${esc(r.area)}</p></div><span aria-hidden="true">↗</span></a>`).join('')}</section><section class="timeline"><span class="eyebrow">Along the way</span><h2>一路走来</h2>${d.about.timeline.length?d.about.timeline.map(t=>`<div class="timeline-item"><span class="meta">${esc(t.date)}</span><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p></div>`).join(''):empty('经历，等待真实的时间落笔','学习、生活与重要节点，留待本人补充。')}</section></div></div>`}

export function markdown(text,prefix='section'){
 let html='',toc='',code=false,paragraph=[],n=0,list=false;
 const flush=()=>{if(paragraph.length){html+=`<p>${paragraph.map(inline).join('<br>')}</p>`;paragraph=[]}if(list){html+='</ul>';list=false}};
 for(const line of String(text||'').replace(/\r\n?/g,'\n').split('\n')){
  if(line.startsWith('```')){flush();html+=code?'</code></pre>':`<pre data-language="${esc(line.slice(3).trim()||'code')}"><code>`;code=!code;continue}
  if(code){html+=esc(line)+'\n';continue}
  const h=line.match(/^(#{1,3}) (.+)/),img=line.match(/^!\[(.*?)\]\((\/assets\/[a-zA-Z0-9/_.-]+)(?: "(.*?)")?\)$/),bullet=line.match(/^[-*] (.+)/);
  if(h){flush();const id=prefix+'-'+n++;html+=`<h2 id="${id}">${inline(h[2])}</h2>`;toc+=`<a href="#${id}">${esc(h[2])}</a>`}
  else if(img){flush();html+=`<figure><img src="${img[2]}" alt="${esc(img[1])}" loading="lazy"><figcaption>${esc(img[3]||img[1])}</figcaption></figure>`}
  else if(line.startsWith('> ')){flush();html+=`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`}
  else if(bullet){if(paragraph.length)flush();if(!list){html+='<ul>';list=true}html+=`<li>${inline(bullet[1])}</li>`}
  else if(!line.trim())flush();else{if(list)flush();paragraph.push(line)}
 }
 flush();if(code)html+='</code></pre>';return{html,toc};
}
function relatedNotes(p,items,writing){
 const group=writing?'writing':'research';
 const tags=new Set([...(p.tags||[]),...(p.methods||[])]);
 const scored=items.filter(x=>x.slug!==p.slug).map(x=>{
  let score=0;
  if(writing&&x.category&&x.category===p.category)score+=3;
  if(!writing&&x.area&&x.area===p.area)score+=3;
  for(const t of [...(x.tags||[]),...(x.methods||[])])if(tags.has(t))score+=2;
  return {x,score};
 }).filter(row=>row.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
 if(!scored.length)return '';
 return `<section class="related-notes"><span class="eyebrow">Continue nearby</span><h2>相关内容</h2><ul>${scored.map(({x})=>`<li><a href="/${group}/${esc(x.slug)}"><small>${esc(writing?x.category:x.area)}</small><span>${esc(x.title)}</span></a></li>`).join('')}</ul></section>`;
}

export function detailView(p,items,writing){
 const group=writing?'writing':'research',idx=items.indexOf(p);
 let body=p.body||'';
 if(!writing){body=`## 探索背景\n\n${p.summary}\n\n## 关注的问题\n\n${p.questions||'具体问题将随学习与实践继续补充。'}\n\n## 方法与过程\n\n${p.process||'尚未添加实验记录。后续记录数据来源、工具版本、方法选择与观察。'}\n\n## 产出与后续\n\n${p.outcome||'暂无已确认的成果。当前条目用于组织探索方向。'}`;for(const s of p.sections||[])body+=`\n\n## ${s.title}\n\n${s.body||''}`;}
 const rendered=markdown(body),mins=Math.max(1,Math.ceil(body.replace(/\s/g,'').length/450));
 const toc=rendered.toc||'<p class="continuous-note">这篇随笔以连续段落展开，适合从头慢慢读。</p><a href="#essay-start">从开头阅读</a>';
 const refs=!writing?(p.links||[]).filter(l=>linkOK(l.url)):[];
 return `<div class="detail-toolbar"><a href="/${group}">← 返回${writing?'文章':'研究'}</a><button type="button" id="share">复制链接 <span aria-hidden="true">↗</span></button></div><header class="detail-heading"><span class="eyebrow">${writing?'Writing / '+esc(p.category):'Research / '+esc(p.field||p.area)}</span><h1>${esc(p.title)}</h1><p class="detail-deck">${esc(p.summary)}</p><div class="detail-byline"><span>lmr</span><span>${writing?(p.status==='demo'?'演示内容 · 非已发表作品':esc(p.publishedAt||'未注明日期')):statusLabel(p.status)+' · 非成果陈列'}</span><span>约 ${mins} 分钟阅读</span></div></header><div class="reading"><aside aria-label="文章目录"><button type="button" class="toc-toggle" aria-expanded="false" aria-controls="toc-panel">本文目录</button><div class="toc-panel" id="toc-panel"><span class="eyebrow">On this page</span><strong>${rendered.toc?'本页目录':'连续阅读'}</strong>${toc}${refs.length?'<a href="#references">参考资料</a>':''}<span class="toc-note">${writing?'lmr · 文字归档':'lmr · 研究档案'}</span></div></aside><article class="prose" id="essay-start">${writing?'':`<figure class="research-figure"><img src="${esc(p.cover)}" alt="${esc(p.title)}概念示意" width="800" height="500"><figcaption>概念示意 / 非实际实验结果</figcaption></figure>`}${rendered.html}${refs.length?`<section><h2 id="references">参考资料</h2>${refs.map(l=>`<p><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a></p>`).join('')}</section>`:''}${relatedNotes(p,items,writing)}<div class="reading-end"><span class="eyebrow">End of this note</span><p>${writing?'文字暂告一段落，思考仍在继续。':'保持问题开放，等待下一次探索。'}</p></div></article></div><nav class="adjacent-notes" aria-label="相邻内容">${idx>0?`<a href="/${group}/${esc(items[idx-1].slug)}"><small>上一篇</small><span>← ${esc(items[idx-1].title)}</span></a>`:'<span></span>'}${items[idx+1]?`<a href="/${group}/${esc(items[idx+1].slug)}"><small>下一篇</small><span>${esc(items[idx+1].title)} →</span></a>`:''}</nav>`;
}

