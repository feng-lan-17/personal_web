const key='lmr-reading-list-v1';
function load(){try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v.filter(x=>typeof x==='string'&&/^[a-z0-9-]+$/.test(x)):[]}catch{return []}}
function save(v){try{localStorage.setItem(key,JSON.stringify(v));return true}catch{return false}}
export function mountReadingList(items,path){
 const article=path.startsWith('/writing/')?items.find(p=>path==='/writing/'+p.slug):null;
 if(article){
  const button=document.createElement('button');button.type='button';button.className='save-reading';
  function update(){const saved=load().includes(article.slug);button.textContent=saved?'✓ 已加入稍后阅读':'＋ 稍后阅读';button.setAttribute('aria-pressed',String(saved))}
  button.onclick=()=>{const list=load(),next=list.includes(article.slug)?list.filter(x=>x!==article.slug):[...list,article.slug];if(save(next))update();else document.querySelector('#toast').textContent='浏览器未允许保存阅读清单。'};
  document.querySelector('.detail-toolbar')?.append(button);update();
 }
 if(path!=='/writing')return;
 const panel=document.createElement('details');panel.className='reading-list';panel.innerHTML='<summary>我的稍后阅读 <span></span></summary><div class="reading-list-content"></div><div class="reading-list-actions"><button type="button" data-export>导出清单</button><button type="button" data-import>导入清单</button><input type="file" accept="application/json,.json" hidden></div><p class="meta" role="status">仅保存在当前浏览器</p>';
 document.querySelector('#filters')?.before(panel);
 function render(){const list=load(),content=panel.querySelector('.reading-list-content');panel.querySelector('summary span').textContent=list.length+' 篇';content.replaceChildren();
  if(!list.length){const p=document.createElement('p');p.textContent='还没有保存的文章，可以在文章详情中加入。';content.append(p);return}
  for(const slug of list){const item=items.find(p=>p.slug===slug),row=document.createElement('div');row.className='reading-list-row';
   if(item){const a=document.createElement('a');a.href='/writing/'+slug;a.textContent=item.title;row.append(a)}else{const label=document.createElement('span');label.textContent='文章已不存在';row.append(label)}
   const remove=document.createElement('button');remove.type='button';remove.textContent='移除';remove.setAttribute('aria-label','移除'+(item?.title||'失效文章'));remove.onclick=()=>{if(save(load().filter(x=>x!==slug)))render()};row.append(remove);content.append(row);
  }
 }
 const status=panel.querySelector('[role=status]'),file=panel.querySelector('input[type=file]');
 panel.querySelector('[data-export]').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,articles:load()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lmr-reading-list.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 panel.querySelector('[data-import]').onclick=()=>file.click();
 file.onchange=async()=>{try{const f=file.files[0];if(!f)return;if(f.size>100000)throw Error('文件过大');const data=JSON.parse(await f.text());if(data.version!==1||!Array.isArray(data.articles)||data.articles.length>1000||data.articles.some(x=>typeof x!=='string'||!items.some(p=>p.slug===x)))throw Error('文件格式有误或包含不存在的文章');if(!save([...new Set([...load(),...data.articles])]))throw Error('浏览器未允许保存');render();status.textContent='导入成功，已合并到本机清单。'}catch(e){status.textContent='导入失败：'+(e.message||'文件格式有误')}finally{file.value=''}};
 render();
}
