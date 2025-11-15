// Lightweight client-side mirror fallback for game iframes
(function(){
  function onReady(fn){ if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', fn); } else { fn(); } }
  function normTitle(t){ try{ return String(t||'').toLowerCase().replace(/\((\d{4})\)/g,'').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); } catch(e){ return ''; } }
  function yearOf(t){ var m=String(t||'').match(/\((\d{4})\)/); return m?m[1]:null; }
  function buildCandidates(id, title, current){
    var list=[]; if(current) list.push(current);
    var host=''; try{ host = new URL(current).host; } catch(e){}
    var isDOS = /^msdos_/i.test(id) || /(doom|wolf|duke|lotus|oregon|stunts|simcity|pac|aladdin|dune|jazz|prehistorik|scorched|donkey|munchers)/i.test(id+" "+title);
    var slug = normTitle(title); var yr = yearOf(title); var alts=[slug]; if(yr) alts.push(slug+'-'+yr);
    // Retrogames (DOS)
    if(isDOS){ alts.forEach(function(s){ list.push('https://www.retrogames.cc/embed/pc-games/'+s+'.html'); }); }
    // Playclassic (DOS)
    if(isDOS){ alts.forEach(function(s){ list.push('https://playclassic.games/game/'+s+'/play/'); }); }
    // De-dupe while preserving order
    var seen=new Set(), out=[]; list.forEach(function(u){ if(u && !seen.has(u)){ seen.add(u); out.push(u); } });
    return out;
  }
  function tryMirrors(iframe, candidates, timeoutMs){
    var i=0; var to=null; var done=false;
    function next(){ if(done) return; if(i>=candidates.length){ return fail(); } var url=candidates[i++]; try { iframe.src=url; } catch(e) { return next(); }
      // consider loaded when iframe fires load within timeout
      var loaded=false; var onload=function(){ loaded=true; cleanup(); done=true; };
      iframe.addEventListener('load', onload, { once:true });
      to = setTimeout(function(){ if(loaded) return; iframe.removeEventListener('load', onload); next(); }, timeoutMs);
    }
    function cleanup(){ if(to) { clearTimeout(to); to=null; } }
    function fail(){ cleanup(); // show inline unavailable message, do not open source site
      var ov=document.getElementById('embed-fallback-overlay'); if(ov) return; ov=document.createElement('div');
      ov.id='embed-fallback-overlay';
      ov.style.cssText='margin-top:12px;padding:12px;border:1px solid var(--border-primary);background:var(--bg-medium);color:var(--text-secondary);border-radius:8px;';
      ov.innerHTML='<strong>Temporarily unavailable</strong><br/><span>We could not load mirrors for this game right now.</span>';
      var container = iframe.closest('.game-frame-container') || iframe.parentElement; if(container && container.parentElement){ container.parentElement.insertBefore(ov, container.nextSibling); }
    }
    next();
  }
  onReady(function(){ try{
    var frame = document.querySelector('iframe.game-frame'); if(!frame) return;
    var id = (document.querySelector('[data-game-id]')||{}).dataset ? document.querySelector('[data-game-id]').dataset.gameId : null;
    if(!id){ try{ id = window.location.pathname.split('/').pop().replace(/\.html$/,''); } catch(e){} }
    var titleEl = document.querySelector('h1.game-title'); var title = titleEl ? titleEl.textContent.trim() : '';
    var current = frame.getAttribute('src');
    var candidates = buildCandidates(id||'', title||'', current||'');
    // Try mirrors only if first attempt doesn't load in time
    var firstLoadFired=false; var timer=setTimeout(function(){ if(!firstLoadFired){ tryMirrors(frame, candidates, 7000); } }, 5000);
    frame.addEventListener('load', function(){ firstLoadFired=true; if(timer) { clearTimeout(timer); } }, { once:true });
  } catch(e){}
  });
})();
