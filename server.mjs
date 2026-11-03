import './build.mjs';
import {createServer} from 'node:http';
import {stat,access} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.flac':'audio/flac','.mp3':'audio/mpeg','.ttf':'font/ttf','.woff2':'font/woff2'};
createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end()}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end()}
  if(!path.extname(file)){try{const candidate=path.join(file,'index.html');await access(candidate);file=candidate}catch{file=path.join(root,'index.html')}}
  const info=await stat(file);if(!info.isFile())throw Error('Not a file');
  const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes'};
  let start=0,end=info.size-1,status=200;
  if(req.headers.range){
   const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(!range||(!range[1]&&!range[2])){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end()}
   start=range[1]?Number(range[1]):Math.max(0,info.size-Number(range[2]));end=range[1]&&range[2]?Math.min(Number(range[2]),info.size-1):info.size-1;
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end()}
   status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
  }
  headers['Content-Length']=info.size?end-start+1:0;res.writeHead(status,headers);
  if(req.method==='HEAD'||!info.size)return res.end();
  const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch{if(!res.headersSent){res.writeHead(404);res.end('Not found')}else res.destroy()}
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('lmr → http://127.0.0.1:'+(process.env.PORT||4173)));
