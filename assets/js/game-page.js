(function(){
  function $(sel){ return document.querySelector(sel); }
  function readSlug(){ try { var m = (location.pathname||'').match(/\/games\/([^\/]+)\.html$/i); return m?m[1]:''; } catch(e){ return ''; } }
  function createCard(g){
    var id=g.id; var t=(typeof g.title==='object')?(g.title['en']||g.title['zh-CN']||Object.values(g.title)[0]||id):(g.title||id);
    var local='/assets/images/games/'+id+'.jpg';
    var th=(g.thumbnail||''); var isPh=th.toLowerCase().indexOf('game-placeholder')>=0; var thumb=(th && !isPh)?th:local;
    var a=document.createElement('a'); a.className='game-card'; a.href='/games/'+id+'.html';
    a.innerHTML='<img class="game-image" loading="lazy" src="'+thumb+'" alt="'+t+'" onerror="this.onerror=null; this.src=\''+local+'\'; this.onerror=function(){ this.onerror=null; this.src=\''+local.replace('.jpg','.png')+'\'; this.onerror=function(){ this.onerror=null; this.src=\''+local.replace('.jpg','.svg')+'\'; this.onerror=function(){ this.src=\'/assets/images/game-placeholder.svg\'; }; }; }">'+
                '<div class="game-info"><div class="game-title">'+t+'</div></div>';
    return a;
  }
  function renderRelated(current, list){
    try {
      var host=$('#related-games'); if(!host||!Array.isArray(list)) return;
      var cats=Array.isArray(current.categories)?current.categories:[];
      var pool=list.filter(function(g){ if(!g||!g.id||g.id===current.id) return false; if(g.hidden) return false; var gc=Array.isArray(g.categories)?g.categories:[]; return gc.some(function(c){return cats.indexOf(c)>=0;}); });
      if(pool.length<1) return;
      pool.sort(function(a,b){ return (b.playCount||0)-(a.playCount||0); });
      var top=pool.slice(0,8);
      host.innerHTML=''; top.forEach(function(g){ host.appendChild(createCard(g)); });
    } catch(e){}
  }
  function setMetaDescription(text){ try{ var m=document.querySelector('meta[name="description"]'); if(!m){ m=document.createElement('meta'); m.setAttribute('name','description'); document.head.appendChild(m);} m.setAttribute('content', text); }catch(e){} }
  function ensureInfo(current){ try{ var main=document.querySelector('main.container'); if(!main) return; if(document.querySelector('.game-description')) return; var section=document.createElement('section'); section.className='game-description'; section.style.margin='16px 0'; var p=document.createElement('p'); var desc=''; var t=current && current.description; if(t){ if(typeof t==='string') desc=t; else desc=t['en']||t['zh-CN']||Object.values(t)[0]||''; } if(!desc) desc='Play this free browser game online. No downloads. Enjoy!'; p.textContent=desc; section.appendChild(p); main.appendChild(section); setMetaDescription(p.textContent);}catch(e){} }
  function injectSchema(current){ try{ if(!current) return; if(document.querySelector('script[type="application/ld+json"][data-auto="videogame"]')) return; var url=location.origin+location.pathname; var img=(current.thumbnail||('/assets/images/games/'+current.id+'.jpg')); var obj={ '@context':'https://schema.org', '@type':'VideoGame', name:(typeof current.title==='object')?(current.title['en']||current.title['zh-CN']||Object.values(current.title)[0]||current.id):(current.title||current.id), url:url, image:img, applicationCategory:'Game', operatingSystem:'Browser' }; var s=document.createElement('script'); s.type='application/ld+json'; s.setAttribute('data-auto','videogame'); s.textContent=JSON.stringify(obj); document.head.appendChild(s);}catch(e){} }
  function run(){ var slug=readSlug(); if(!slug) return; fetch('/assets/data/games.json').then(function(r){return r.json();}).then(function(list){ if(!Array.isArray(list)) return; var cur=list.find(function(g){return g.id===slug;}); if(cur){ ensureInfo(cur); injectSchema(cur); renderRelated(cur, list); } }); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', run); } else { run(); }
})();
