/**
 * funnygame.com main JavaScript (stable rebuild)
 */

document.addEventListener('DOMContentLoaded', function() {
  initializeLanguageSelector();
  initializeMobileMenu();
  updateCurrentYear();
  fixImageDisplay();
  initSearchOverlay();
  initHeaderStats();
  fixFavoritesLinkLabels();
  initLoginStatusBanner();
  try { const lg = getCurrentLanguage(); if (lg && lg !== 'en') { loadTranslations(lg); } } catch(e){}
  window.addEventListener('focus', () => { try { initHeaderStats(true); } catch(e){} });
});

function setCookie(name, value, days) {
  let expires = '';
  if (days) { const date = new Date(); date.setTime(date.getTime() + (days * 86400000)); expires = '; expires=' + date.toUTCString(); }
  document.cookie = name + '=' + value + expires + '; path=/';
}
function getCookie(name) { const value = '; ' + document.cookie; const parts = value.split('; ' + name + '='); if (parts.length === 2) return parts.pop().split(';').shift(); return null; }

function flagDataUri(lang){
  const code=(lang||'en').toLowerCase();
  if (code==='zh-cn' || code==='cn') return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="15"><rect width="20" height="15" fill="#de2910"/><polygon points="3,2 4,5 1,3 5,3 2,5" fill="#ffde00"/></svg>');
  if (code==='es') return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="15"><rect width="20" height="15" fill="#aa151b"/><rect y="5" width="20" height="5" fill="#f1bf00"/></svg>');
  if (code==='fr') return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="15"><rect width="7" height="15" fill="#0055a4"/><rect x="7" width="6" height="15" fill="#fff"/><rect x="13" width="7" height="15" fill="#ef4135"/></svg>');
  return 'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="15"><rect width="20" height="15" fill="#00247d"/><rect x="0" y="6" width="20" height="3" fill="#fff"/><rect x="8.5" y="0" width="3" height="15" fill="#fff"/></svg>');
}

function initializeLanguageSelector() {
  const host = document.querySelector('.nav-right') || document.querySelector('.nav-container') || document.querySelector('.header .container');
  if (!host) return;
  let container = document.querySelector('.language-selector');
  const current = getCurrentLanguage();
  const buildMarkup = (lang) => `
    <div class="language-selector-btn" id="language-selector-btn">
      <img src="${flagDataUri(lang)}" alt="EN" width="20" height="15" />
      <span>${(lang === 'zh-CN' ? 'CN' : 'EN')}</span>
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" class="ml-1">
        <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="language-dropdown" id="language-dropdown"></div>`;
  if (!container) {
    container = document.createElement('div');
    container.className = 'language-selector';
    container.innerHTML = buildMarkup(current);
    if (host.classList && host.classList.contains('nav-right')) host.prepend(container); else host.appendChild(container);
  } else {
    container.innerHTML = buildMarkup(current);
  }
  const btn = document.getElementById('language-selector-btn');
  const dd = document.getElementById('language-dropdown');
  if (!btn || !dd) return;
  const options = [
    { code: 'en', label: 'English' },
    { code: 'zh-CN', label: '简体中文' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' }
  ];
  dd.innerHTML = options.map(o => `
    <div class="language-option" data-lang="${o.code}">
      <img src="${flagDataUri(o.code)}" alt="${o.label}" width="20" height="15" />
      <span>${o.label}</span>
    </div>`).join('');
  updateLanguageButton(current);
  btn.addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('active'); });
  document.addEventListener('click', () => dd.classList.remove('active'));
  dd.querySelectorAll('.language-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const lang = opt.getAttribute('data-lang');
      setCookie('lang', lang, 30); setCookie('language', lang, 30); localStorage.setItem('lang', lang);
      updateLanguageButton(lang);
      const url = new URL(window.location.href); url.searchParams.set('lang', lang); window.location.href = url.toString();
    });
  });
}

function getCurrentLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  const stored = localStorage.getItem('lang');
  const cookieLang = getCookie('lang') || getCookie('language');
  const lang = urlLang || stored || cookieLang || 'en';
  document.documentElement.lang = (lang === 'zh-CN' ? 'zh-CN' : 'en');
  return lang;
}
function updateLanguageButton(lang) {
  const btn = document.getElementById('language-selector-btn'); if (!btn) return;
  const flag = flagDataUri(lang);
  const code = (lang === 'zh-CN') ? 'CN' : lang.toUpperCase();
  const img = btn.querySelector('img'); const span = btn.querySelector('span');
  if (img) { img.src = flag; img.alt = code; img.setAttribute('width','20'); img.setAttribute('height','15'); img.style.display='inline-block'; img.style.visibility='visible'; img.style.opacity='1'; }
  if (span) span.textContent = code;
}

function initializeMobileMenu() { /* no-op */ }
function updateCurrentYear() { const el = document.getElementById('current-year'); if (el) el.textContent = new Date().getFullYear(); }
function fixImageDisplay() { document.querySelectorAll('img').forEach(img => { img.style.opacity='1'; img.style.visibility='visible'; }); }

function loadGames(containerId, category) {
  const container = document.getElementById(containerId);
  if (!container) return;
  fetch('/assets/data/games.json').then(r=>r.json()).then(data => {
    let list = [];
    const visible=(Array.isArray(data)?data:[]).filter(g=>!g.hidden); if (category === 'featured') list = visible.filter(g => g.isFeatured).slice(0,6);
    else if (category === 'new') list = visible.sort((a,b)=>new Date(b.addedDate)-new Date(a.addedDate)).slice(0,6);
    else if (category === 'popular') list = visible.sort((a,b)=> (b.playCount||0)-(a.playCount||0)).slice(0,6);
    else list = visible.filter(g => (g.categories||[]).includes(category)).slice(0,6);
    container.innerHTML = list.map(g => {
      const id = g.id; const t = g.title; const title = (typeof t==='object')?(t['en']||t['zh-CN']||Object.values(t)[0]):t;
      const local = `/assets/images/games/${id}.jpg`;
      const isPlaceholder = (g.thumbnail||'').toLowerCase().includes('game-placeholder');
      const thumb = (!g.thumbnail || isPlaceholder) ? local : g.thumbnail;
      return `
        <a class="game-card" href="/games/${id}.html">
          <img class="game-image" src="${thumb}" alt="${title}" onerror="this.onerror=null; this.src='${local}'; this.onerror=function(){ this.onerror=null; this.src='${local.replace('.jpg','.png')}'; this.onerror=function(){ this.onerror=null; this.src='${local.replace('.jpg','.svg')}'; this.onerror=function(){ this.src='/assets/images/game-placeholder.svg'; }; }; }">
          <div class="game-info"><div class="game-title">${title}</div></div>
        </a>`;
    }).join('');
  }).catch(()=>{ container.innerHTML = '<div class="error-message">Failed to load game data</div>'; });
}

function initSearchOverlay() {
  if (document.getElementById('search-overlay')) return;
  const overlay = document.createElement('div'); overlay.id='search-overlay'; overlay.className='search-overlay hidden';
  overlay.innerHTML = `
    <div class="search-overlay-backdrop"></div>
    <div class="search-overlay-panel">
      <div class="search-overlay-header">
        <input id="search-input" class="search-input" type="text" placeholder="Search games..." autocomplete="off" />
        <button id="search-close" class="search-close" aria-label="Close">×</button>
      </div>
      <div id="search-results" class="search-results"></div>
    </div>`;
  document.body.appendChild(overlay);
  const input = overlay.querySelector('#search-input');
  const closeBtn = overlay.querySelector('#search-close');
  const results = overlay.querySelector('#search-results');
  let gamesIndex=[]; let loaded=false;
  function ensureIndex(){ if (loaded) return Promise.resolve(gamesIndex); return fetch('/assets/data/games.json').then(r=>r.ok?r.json():[]).then(d=>{gamesIndex=Array.isArray(d)?d:[]; loaded=true; return gamesIndex;}).catch(()=>{gamesIndex=[];loaded=true;return gamesIndex;}); }
  function open(){ overlay.classList.remove('hidden'); document.body.classList.add('no-scroll'); ensureIndex().then(()=> input.focus()); }
  function close(){ overlay.classList.add('hidden'); document.body.classList.remove('no-scroll'); input.value=''; results.innerHTML=''; }
  document.querySelectorAll('a.nav-icon').forEach(a=>{ if (a.querySelector('svg.search-icon')) a.addEventListener('click',(e)=>{e.preventDefault(); open();}); });
  closeBtn.addEventListener('click', close); overlay.addEventListener('click', (e)=>{ if(e.target.classList.contains('search-overlay')||e.target.classList.contains('search-overlay-backdrop')) close(); });
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') close(); });
  function normalize(t){ return (t||'').toString().toLowerCase(); }
  function render(items){ if(!items.length){ results.innerHTML = '<div class="search-empty">No results</div>'; return; }
    results.innerHTML = items.filter(g=>!g.hidden).slice(0,20).map(g=>{ const id=g.id||''; const t=g.title; const title=(typeof t==='object')?(t['en']||t['zh-CN']||Object.values(t)[0]):(t||id); const local=`/assets/images/games/${id}.jpg`; const isPlaceholder=(g.thumbnail||'').toLowerCase().includes('game-placeholder'); const thumb=(!g.thumbnail||isPlaceholder)?local:g.thumbnail; return `
      <a class="search-item" href="/games/${id}.html"><img class="search-thumb" src="${thumb}" alt="${title}" onerror="this.onerror=null; this.src='${local}'; this.onerror=function(){ this.onerror=null; this.src='${local.replace('.jpg','.png')}'; this.onerror=function(){ this.onerror=null; this.src='${local.replace('.jpg','.svg')}'; this.onerror=function(){ this.src='/assets/images/game-placeholder.svg'; }; }; };"><span class="search-title">${title}</span></a>`; }).join(''); }
  let timer=null; input.addEventListener('input',()=>{ const q=normalize(input.value); clearTimeout(timer); timer=setTimeout(()=>{ if(!q){ results.innerHTML=''; return; } ensureIndex().then(list=>{ const matched=list.filter(g=>{ const id=normalize(g.id); const t=g.title; const title=(typeof t==='object')?normalize(t['en']||t['zh-CN']||Object.values(t)[0]):normalize(t); const cats=Array.isArray(g.categories)?normalize(g.categories.join(' ')):''; return id.includes(q)||title.includes(q)||cats.includes(q); }); render(matched); }); },120); });
}

function initHeaderStats(forceRefresh){
  const host = document.querySelector('.nav-right') || document.querySelector('.nav-container') || document.querySelector('.header .container'); if(!host) return;
  let stats = document.getElementById('header-stats'); if(!stats){ stats=document.createElement('div'); stats.id='header-stats'; stats.className='header-stats'; stats.innerHTML=`
    <a href="/favorites.html" class="stat-item" id="stat-fav-link"><span class="stat-label">收藏</span><span class="badge" id="fav-count">0</span></a>
    <a href="#" class="stat-item" id="continue-link" style="display:none;"><span class="stat-label">继续玩</span><span class="stat-value" id="continue-title"></span></a>`; if(host.classList.contains('nav-right')) host.prepend(stats); else host.appendChild(stats); }
  // Ensure header labels match current language
  try {
    const favLabel = document.querySelector('#stat-fav-link .stat-label');
    if (favLabel) {
      const lang = (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : (document.documentElement.lang || 'en'));
      if (lang === 'zh-CN' || lang === 'cn') {
        favLabel.textContent = '我的收藏';
        favLabel.setAttribute('data-translate','nav_favorites');
      } else {
        favLabel.textContent = 'Favorites';
        favLabel.setAttribute('data-translate','nav_favorites');
      }
    }
    const contLabel = document.querySelector('#continue-link .stat-label');
    if (contLabel) {
      const lang = (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : (document.documentElement.lang || 'en'));
      if (lang === 'zh-CN' || lang === 'cn') {
        contLabel.textContent = '继续';
        contLabel.setAttribute('data-translate','continue_play');
      } else {
        contLabel.textContent = 'Continue';
        contLabel.setAttribute('data-translate','continue_play');
      }
    }
  } catch (e) {}
  let favs={}; try{favs=JSON.parse(localStorage.getItem('favorites')||'{}')}catch{}; const favEl=document.getElementById('fav-count'); if(favEl) favEl.textContent=String(Object.keys(favs).length);
  let history=[]; try{history=JSON.parse(localStorage.getItem('play_history')||'[]')}catch{}; const last=history.length?history[history.length-1]:null; const cont=document.getElementById('continue-link'); const title=document.getElementById('continue-title'); if(last&&last.game_id){ cont.href=`/games/${last.game_id}.html`; if(title) title.textContent=last.game_title||last.game_id; cont.style.display=''; } else if(cont){ cont.style.display='none'; }
}

function fixFavoritesLinkLabels(){
  try {
    const lang = (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : (document.documentElement.lang || 'en'));
    const links = document.querySelectorAll('a[href="/favorites.html"]');
    links.forEach(a => {
      a.setAttribute('data-translate','nav_favorites');
      if (lang === 'zh-CN' || lang === 'cn') {
        a.textContent = '我的收藏';
      } else {
        a.textContent = 'My Favorites';
      }
    });
  } catch(e) {}
}

function initLoginStatusBanner(){ try{ const host=document.querySelector('.nav-right')||document.querySelector('.nav-container'); if(!host) return; let pill=document.getElementById('login-status-pill'); if(!pill){ pill=document.createElement('a'); pill.id='login-status-pill'; pill.className='login-pill login-pill--info'; pill.href='/user'; pill.innerHTML='<span class="login-pill-text">Login to sync favorites</span>'; const stats=document.getElementById('header-stats'); if(stats&&stats.nextSibling) host.insertBefore(pill, stats.nextSibling); else host.prepend(pill); }
  if(window.AppAuth && typeof window.AppAuth.ensureClient==='function'){ window.AppAuth.ensureClient().then(async(c)=>{ if(!c) return; const {data:{user}} = await c.auth.getUser(); if(user){ pill.classList.remove('login-pill--info'); pill.classList.add('login-pill--success'); const name=user.email||(user.user_metadata&&user.user_metadata.user_name)||'Logged in'; pill.innerHTML=`<span class="login-pill-dot"></span><span class="login-pill-text">${name} · Favorites synced</span>`; } }).catch(()=>{}); } }catch(e){}
}

function loadTranslations(lang){ fetch(`/assets/js/translations/${lang}.json`).then(r=>r.ok?r.json():{}).then(tr=>applyTranslations(tr)).catch(()=>{}); }
function applyTranslations(tr){ if(!tr) return; document.querySelectorAll('[data-translate]').forEach(el=>{ const k=el.getAttribute('data-translate'); if(tr[k]) el.textContent=tr[k]; }); document.querySelectorAll('[data-translate-placeholder]').forEach(el=>{ const k=el.getAttribute('data-translate-placeholder'); if(tr[k]) el.setAttribute('placeholder', tr[k]); }); }




function loadAllCategoriesHome(){
  const mount = document.getElementById('home-categories-container');
  if(!mount) return;
  fetch('/assets/data/games.json').then(r=>r.json()).then(data=>{
    const visible = (Array.isArray(data)?data:[]).filter(g=>!g.hidden);
    const featured = visible.filter(g=>g.isFeatured);
    const PRESET = ['featured','action','puzzle','racing','rpg','shooting','platformer','strategy','casual'];
    const present = new Set();
    visible.forEach(g=>{ (g.categories||[]).forEach(c=>present.add(c)); });
    const extra = Array.from(present).filter(c=>!PRESET.includes(c)).sort();
    const order = [];
    if (featured.length) order.push('featured');
    PRESET.forEach(c=>{ if(c!=='featured' && present.has(c)) order.push(c); });
    extra.forEach(c=>order.push(c));
    const titleOf = (t)=>{ if(!t) return ''; if(typeof t==='string') return t; return t['en']||t['zh-CN']||Object.values(t)[0]||''; };
    const card = (g)=>{
      const id=g.id; const t=titleOf(g.title)||id; const local=`/assets/images/games/${id}.jpg`;
      const isPlaceholder = (g.thumbnail||'').toLowerCase().includes('game-placeholder');
      const thumb = (!g.thumbnail || isPlaceholder) ? local : g.thumbnail;
      return `<a class="game-card" href="/games/${id}.html"><img class="game-image" src="${thumb}" alt="${t}" onerror="this.onerror=null; this.src='${local}'; this.onerror=function(){ this.onerror=null; this.src='${local.replace('.jpg','.png')}'; this.onerror=function(){ this.onerror=null; this.src='${local.replace('.jpg','.svg')}'; this.onerror=function(){ this.src='/assets/images/game-placeholder.svg'; }; }; }"><div class="game-info"><div class="game-title">${t}</div></div></a>`;
    };
    const label = (c)=> c==='featured' ? 'Featured Games' : (c.charAt(0).toUpperCase()+c.slice(1)+' Games');
    let html = '';
    order.forEach(c=>{
      const list = (c==='featured') ? featured : visible.filter(g=> (g.categories||[]).includes(c));
      if(!list.length) return;
      html += `<section class="game-category"><h2 class="section-title">${label(c)}</h2><div class="games-grid">` + list.map(card).join('') + `</div></section>`;
    });
    mount.innerHTML = html;
  }).catch(()=>{});
}

document.addEventListener('DOMContentLoaded', function() {
