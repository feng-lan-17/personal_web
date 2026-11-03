import {readFile,writeFile} from 'node:fs/promises';
let app=await readFile('public/app.js','utf8');
app="import {articleCard,researchRow,collectionCard,aboutView,detailView,tags} from '/content-views.js';\n"+app;
app=app.split('\n').filter(l=>!l.startsWith('const articleCard=')&&!l.startsWith('const researchRow=')&&!l.startsWith('function markdown(')).map(l=>{
 if(l.startsWith("else if(path==='/about')"))return "else if(path==='/about'){title='关于';html=aboutView(d,head,empty)}";
 if(l.startsWith("else if(path.startsWith('/writing/')"))return "else if(path.startsWith('/writing/')||path.startsWith('/research/')){const writing=path.startsWith('/writing/'),items=writing?d.writing:d.research,p=path.split('/').length===3?items.find(x=>x.slug===path.split('/')[2]):null;if(p){title=p.title;html=detailView(p,items,writing)}}";
 return l;
}).join('\n');
app=app.replace("empty('收藏夹正在慢慢生长','书、影像、旋律，以及某个值得记住的瞬间。')","`<div class=\"collection-preview\">${d.collections.items.slice(0,3).map(collectionCard).join('')}</div><p class=\"collection-disclaimer\">陈列为演示内容，等待真实收藏逐一入席。</p>`");
const start=app.indexOf('items.map((p,i)=>writing?articleCard(p,i):`<article');const end=app.indexOf(".join(''):empty(",start);
if(start<0||end<0)throw Error('Collection replacement not found');
app=app.slice(0,start)+"items.map((p,i)=>writing?articleCard(p,i):collectionCard(p,i))"+app.slice(end);
app=app.replace("$('#results').classList.toggle('writing-results',writing);","$('#results').classList.toggle('writing-results',writing);$('#results').classList.toggle('collection-display',!writing);");
app=app.replace("+'<div class=\"filters\" id=\"filters\"></div><div id=\"results\" class=\"grid\"></div>'", "+'<div class=\"collection-intro-note\"><span class=\"edition-marker\">陈列样本 / 01</span><p>以下均为演示条目，用于呈现未来的私人收藏。作品、作者与个人偏好将在真实内容加入后更新。</p></div><div class=\"filters\" id=\"filters\"></div><div id=\"results\" class=\"grid\"></div>'");
app=app.replace('...d.research.map(p=>({title:p.title', '...d.collections.items.map(p=>({title:p.title,url:\'/collection?item=\'+encodeURIComponent(p.id),type:p.status===\'demo\'?\'收藏 · 演示陈列\':\'收藏\',text:p.note})),...d.research.map(p=>({title:p.title');
await writeFile('public/app.js',app);
let html=await readFile('public/index.html','utf8');html=html.replace('<script type="module" src="/app.js">','<dialog id="collection-dialog" aria-labelledby="collection-detail-title"><button id="collection-close" class="dialog-close" aria-label="关闭收藏详情">×</button><div id="collection-detail"></div></dialog><script type="module" src="/app.js">');html=html.replace('<link rel="stylesheet" href="/hero-coast.css">','<link rel="stylesheet" href="/hero-coast.css"><link rel="stylesheet" href="/gallery.css">');await writeFile('public/index.html',html);
