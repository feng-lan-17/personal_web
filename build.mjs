import {mkdir,readFile,writeFile,cp,access,mkdtemp,rename,rm} from 'node:fs/promises';
import path from 'node:path';
const data=JSON.parse(await readFile('content/site.json','utf8'));
const errors=[];
for(const [label,items,key] of [['文章',data.writing,'slug'],['研究',data.research,'slug'],['收藏',data.collections.items,'id']]){
 const seen=new Set();
 for(const p of items){
  const id=p[key];if(typeof id!=='string'||!/^[a-z0-9-]+$/.test(id)||seen.has(id))errors.push(`${label}标识无效或重复：${id}`);seen.add(id);
  if(!p.title||!p.status)errors.push(`${label} ${id}: 缺少标题或状态`);
  if(p.status==='demo'&&!p.title)errors.push(`${label} ${id}: 演示条目缺少标题`);
  for(const field of ['cover','image','audio'])if(p[field]){
   if(!/^\/assets\/[\w./-]+$/.test(p[field])||p[field].includes('..'))errors.push(`${label} ${id}: ${field} 路径无效`);
   else try{await access(path.join('public',p[field].slice(1)))}catch{errors.push(`${label} ${id}: 找不到 ${p[field]}`)}
  }
 }
}
for(const p of data.writing){
 try{p.body=await readFile(`content/posts/${p.slug}.md`,'utf8')}
 catch(err){if(err.code!=='ENOENT'||!p.body)errors.push(`文章 ${p.slug}: 无法读取 Markdown，且没有内嵌正文`)}
 if(!p.category||!p.summary||!p.body?.trim())errors.push(`文章 ${p.slug}: 分类、摘要和正文不能为空`);
 for(const match of (p.body||'').matchAll(/!\[[^\]]*\]\((\/assets\/[^\s)]+)/g))try{const asset=match[1];if(asset.includes('..'))throw Error();await access(path.join('public',asset.slice(1)))}catch{errors.push(`文章 ${p.slug}: 图片不可用 ${match[1]}`)}
}
if(errors.length)throw Error('内容校验失败：\n'+errors.join('\n'));
const root=path.resolve('.'),target=path.join(root,'dist');
const stage=await mkdtemp(path.join(root,'.lmr-build-'));const previous=path.join(stage,'previous');const output=path.join(stage,'output');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let keepStage=false;
try{
 await cp('public',output,{recursive:true,filter:src=>!['MaShanZheng-Regular.ttf','hero-calligraphy.ttf'].includes(path.basename(src))});await writeFile(path.join(output,'data.json'),JSON.stringify(data));
 const template=await readFile(path.join(output,'index.html'),'utf8');
 for(const [group,items] of [['writing',data.writing],['research',data.research]])for(const item of items){
  const title=escape(item.title)+' · lmr',description=escape(item.summary||'');
  const html=template.replace(/<title>[^<]*<\/title>/,()=>'<title>'+title+'</title>').replace(/<meta name="description" content="[^"]*">/,()=>'<meta name="description" content="'+description+'">').replace(/<meta property="og:title" content="[^"]*">/,()=>'<meta property="og:title" content="'+title+'"><meta property="og:description" content="'+description+'">').replace('<main id="main" tabindex="-1"></main>',()=>'<main id="main" tabindex="-1"><h1>'+escape(item.title)+'</h1><p>'+description+'</p></main>');
  const dir=path.join(output,group,item.slug);await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'index.html'),html);
 }
 let hadPrevious=false;try{await rename(target,previous);hadPrevious=true}catch(err){if(err.code!=='ENOENT')throw err}
 try{await rename(output,target)}catch(err){if(hadPrevious){try{await rename(previous,target)}catch(restore){keepStage=true;throw Error('构建切换失败，旧输出保留在 '+previous+'；恢复失败：'+restore.message)}}throw err}
 if(hadPrevious)await rm(previous,{recursive:true,force:true});
 console.log('Built lmr: assets, content and routes ready.');
}finally{if(!keepStage)await rm(stage,{recursive:true,force:true})}
