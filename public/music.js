const audio=document.createElement('audio');
audio.id='site-audio';
audio.preload='metadata';
audio.controls=true;
audio.setAttribute('aria-label','音乐播放器');

const parking=document.createElement('div');
parking.hidden=true;
parking.id='audio-parking';
document.body.append(parking);
parking.append(audio);

const dock=document.createElement('section');
dock.id='music-dock';
dock.hidden=true;
dock.setAttribute('aria-label','迷你音乐播放器');
dock.innerHTML='<button class="dock-album" aria-label="打开专辑"><img alt=""><span><strong></strong><small></small></span></button><button class="dock-toggle" aria-label="播放">▶</button><button class="dock-resume" hidden>恢复收听</button><button class="dock-stop" aria-label="停止播放并关闭播放器">×</button><div class="dock-progress" aria-hidden="true"><span></span></div>';
document.body.append(dock);

const RESUME_KEY='lmr-music-resume';
let track=null,started=false,player=null,pendingResume=null,saveTimer=0,catalog=[];

function moveAudio(target){
 if(audio.parentElement===target)return;
 const playing=!audio.paused;
 if(typeof target.moveBefore==='function'&&audio.isConnected&&target.isConnected)target.moveBefore(audio,null);
 else{
  target.append(audio);
  if(playing)audio.play().catch(()=>update());
 }
}

export function prepareMusicView(){
 moveAudio(parking);
 player=null;
}

function readResume(){
 try{return JSON.parse(sessionStorage.getItem(RESUME_KEY))}catch{return null}
}

function writeResume(){
 if(!track||!started||pendingResume)return;
 try{
  sessionStorage.setItem(RESUME_KEY,JSON.stringify({
   id:track.id,
   t:audio.currentTime||0,
   v:audio.volume,
   r:audio.playbackRate
  }));
 }catch{}
}

function clearResume(){
 pendingResume=null;
 try{sessionStorage.removeItem(RESUME_KEY)}catch{}
}

function fillDock(item){
 const img=dock.querySelector('img');
 img.src=item.image||'';
 img.alt=item.title+'配图';
 dock.querySelector('strong').textContent=item.title;
 dock.querySelector('small').textContent=item.creator||'';
}

function syncSession(){
 if(!('mediaSession' in navigator))return;
 if(!track){
  navigator.mediaSession.metadata=null;
  navigator.mediaSession.playbackState='none';
  return;
 }
 navigator.mediaSession.metadata=new MediaMetadata({
  title:track.title,
  artist:track.creator||'lmr 收藏',
  album:'私人收藏室',
  artwork:track.image?[{src:new URL(track.image,location.origin).href,sizes:'512x512'}]:[]
 });
 navigator.mediaSession.playbackState=audio.paused?'paused':'playing';
 try{
  if(audio.duration)navigator.mediaSession.setPositionState({duration:audio.duration,playbackRate:audio.playbackRate||1,position:Math.min(audio.currentTime,audio.duration)});
 }catch{}
}

function bindSession(){
 if(!('mediaSession' in navigator)||bindSession.done)return;
 bindSession.done=true;
 const seek=delta=>{if(Number.isFinite(audio.duration))audio.currentTime=Math.min(audio.duration,Math.max(0,audio.currentTime+delta))};
 try{
  navigator.mediaSession.setActionHandler('play',()=>toggle());
  navigator.mediaSession.setActionHandler('pause',()=>audio.pause());
  navigator.mediaSession.setActionHandler('stop',()=>stop());
  navigator.mediaSession.setActionHandler('seekbackward',e=>seek(-(e.seekOffset||10)));
  navigator.mediaSession.setActionHandler('seekforward',e=>seek(e.seekOffset||10));
  navigator.mediaSession.setActionHandler('seekto',e=>{if(e.seekTime!=null)audio.currentTime=e.seekTime});
 }catch{}
}

function update(){
 const open=document.querySelector('#collection-dialog')?.open;
 const waiting=Boolean(pendingResume);
 dock.hidden=(!started&&!waiting)||open;
 dock.classList.toggle('needs-resume',waiting);
 dock.querySelector('.dock-resume').hidden=!waiting;
 dock.querySelector('.dock-toggle').hidden=waiting;
 const playing=!audio.paused;
 dock.querySelector('.dock-toggle').textContent=playing?'Ⅱ':'▶';
 dock.querySelector('.dock-toggle').setAttribute('aria-label',playing?'暂停音乐':'继续播放');
 dock.querySelector('.dock-progress span').style.width=(audio.duration?audio.currentTime/audio.duration*100:0)+'%';
 document.body.classList.toggle('has-music-dock',!dock.hidden);
 if(player?.isConnected){
  const status=player.querySelector('.audio-status');
  const message=audio.error?'暂时无法播放，请重试。':audio.ended?'播放结束':playing?'正在播放 · 关闭专辑后可继续收听':started?'已暂停':'点击播放，让声音慢慢展开。';
  if(status&&status.textContent!==message)status.textContent=message;
 }
 syncSession();
}

async function toggle(){
 try{
  if(pendingResume)return restorePlayback();
  if(audio.paused){
   if(!audio.getAttribute('src')&&track){audio.src=track.audio;audio.load()}
   await audio.play();
  }else audio.pause();
 }catch{
  if(player?.isConnected)player.querySelector('.audio-status').textContent='暂时无法播放，请重试。';
 }
}

async function restorePlayback(){
 const saved=pendingResume||readResume();
 if(!saved||!track)return;
 pendingResume=null;
 dock.classList.remove('needs-resume');
 try{
  if(audio.getAttribute('src')!==track.audio){audio.src=track.audio;audio.load()}
  if(Number.isFinite(saved.v))audio.volume=saved.v;
  if(Number.isFinite(saved.r)&&saved.r>0)audio.playbackRate=saved.r;
  const seek=()=>{if(Number.isFinite(saved.t))audio.currentTime=saved.t};
  if(audio.readyState>=1)seek();
  else audio.addEventListener('loadedmetadata',seek,{once:true});
  started=true;
  await audio.play();
  writeResume();
  update();
 }catch{
  pendingResume=saved;
  update();
 }
}

function stop(){
 audio.pause();
 started=false;
 pendingResume=null;
 audio.removeAttribute('src');
 audio.load();
 clearResume();
 syncSession();
 update();
}

dock.querySelector('.dock-toggle').onclick=toggle;
dock.querySelector('.dock-resume').onclick=restorePlayback;
dock.querySelector('.dock-stop').onclick=stop;
dock.querySelector('.dock-album').onclick=()=>{if(track)document.dispatchEvent(new CustomEvent('open-music-album',{detail:track.id}))};
audio.addEventListener('play',()=>{started=true;pendingResume=null;writeResume();update()});
for(const event of ['pause','loadedmetadata','ended','error','emptied'])audio.addEventListener(event,update);
audio.addEventListener('timeupdate',()=>{
 update();
 if(saveTimer)return;
 saveTimer=setTimeout(()=>{saveTimer=0;writeResume()},1000);
});
document.querySelector('#collection-dialog').addEventListener('close',()=>{prepareMusicView();update()});
document.addEventListener('visibilitychange',()=>dock.classList.toggle('page-hidden',document.hidden));
bindSession();

export function offerResume(items){
 catalog=items||catalog;
 const saved=readResume();
 if(!saved?.id)return;
 const item=catalog.find(p=>p.id===saved.id&&p.audio);
 if(!item){clearResume();return}
 track=item;
 pendingResume=saved;
 fillDock(item);
 update();
}

export function mountMusic(p){
 player=document.querySelector('#collection-detail .music-player');
 if(!player)return;
 if(track?.id!==p.id){
  audio.pause();
  started=false;
  pendingResume=null;
  track=p;
  audio.src=p.audio;
  audio.load();
  fillDock(p);
 }else if(!audio.getAttribute('src')){
  audio.src=p.audio;
  audio.load();
 }
 player.innerHTML='<span class="eyebrow">LISTEN / 听一首歌</span><div class="native-audio-slot"></div><p class="audio-status" role="status"></p>';
 audio.setAttribute('aria-label','播放'+p.title);
 audio.controls=false;
 moveAudio(player.querySelector('.native-audio-slot'));
 audio.getBoundingClientRect();
 requestAnimationFrame(()=>{
  if(player?.isConnected&&document.querySelector('#collection-dialog').open){
   audio.controls=true;
   audio.getBoundingClientRect();
  }
 });
 if(pendingResume?.id===p.id){
  const saved=pendingResume;
  const seek=()=>{if(Number.isFinite(saved.t))audio.currentTime=saved.t};
  if(audio.readyState>=1)seek();
  else audio.addEventListener('loadedmetadata',seek,{once:true});
 }
 document.querySelectorAll('audio').forEach(node=>{if(node!==audio)node.remove()});
 update();
}
