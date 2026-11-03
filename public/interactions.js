const motion=matchMedia('(prefers-reduced-motion: reduce)');
const ease='cubic-bezier(.22,.61,.36,1)';
let observer=null;
let heroSeen=false;
let chromeReady=false;

export function unmountPageEffects(){
 observer?.disconnect();
 observer=null;
}

export function initChrome(){
 if(chromeReady)return;
 chromeReady=true;
 const themeButton=document.querySelector('#theme');
 function themeLabel(){
  const dark=document.documentElement.dataset.theme==='dark';
  themeButton.setAttribute('aria-label',dark?'切换至浅色模式':'切换至深色模式');
  themeButton.setAttribute('aria-pressed',String(dark));
  themeButton.title=dark?'浅色模式':'深色模式';
 }
 new MutationObserver(themeLabel).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 themeLabel();
 motion.addEventListener('change',e=>{if(e.matches)document.getAnimations().forEach(a=>a.finish())});
 const siteAudio=document.querySelector('#site-audio');
 function musicState(){document.querySelector('#music-dock')?.classList.toggle('is-playing',!siteAudio.paused&&!siteAudio.ended)}
 for(const event of ['play','pause','ended'])siteAudio?.addEventListener(event,musicState);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)document.getAnimations().forEach(a=>a.pause());else document.getAnimations().forEach(a=>a.play())});
}

export function mountPageEffects(){
 unmountPageEffects();
 observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   observer.unobserve(entry.target);
   if(!motion.matches)entry.target.animate(
    [{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],
    {duration:280,delay:Number(entry.target.dataset.revealDelay||0),easing:ease,fill:'backwards'}
   );
  }
 },{threshold:.06,rootMargin:'0px 0px -24px 0px'}):null;

 document.querySelectorAll('.page-head,.detail-heading,main>.section>.section-head,.about-story,.research-note').forEach(el=>observer?.observe(el));
 for(const group of document.querySelectorAll('.portals,main>.section>.grid,.research-grid,.collection-preview,.collection-display,.writing-results')){
  [...group.children].forEach((el,index)=>{
   el.dataset.revealDelay=String(Math.min(index*50,150));
   observer?.observe(el);
  });
 }

 if(!heroSeen&&!motion.matches){
  const img=document.querySelector('.hero-image img');
  if(img){
   heroSeen=true;
   img.animate([{opacity:.78,transform:'scale(1.018)'},{opacity:1,transform:'scale(1)'}],{duration:400,easing:ease});
  }
 }

 for(const pre of document.querySelectorAll('.prose pre')){
  if(pre.querySelector('.code-copy'))continue;
  const button=document.createElement('button');
  button.type='button';
  button.className='code-copy';
  button.textContent='复制代码';
  button.setAttribute('aria-label','复制这段代码');
  button.onclick=async()=>{
   try{
    await navigator.clipboard.writeText(pre.querySelector('code').textContent);
    button.textContent='已复制';
    document.querySelector('#toast').textContent='代码已复制';
   }catch{document.querySelector('#toast').textContent='请选中代码后复制'}
   setTimeout(()=>{button.textContent='复制代码';document.querySelector('#toast').textContent=''},2400);
  };
  pre.append(button);
 }

 const results=document.querySelector('#results');
 results?.addEventListener('content-updated',()=>{
  if(!motion.matches)results.animate([{opacity:.55,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});
 });
}
