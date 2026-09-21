/* Campaign UI. Pure rules, content, saves and platform services are separate modules. */
(async function () {
  'use strict';
  const E=BlockEngine,A=BlockArt,S=BlockStore,P=BlockPlatform,I=BlockI18n;
  const BUILD='1.0.0', $=id=>document.getElementById(id);
  const t=(key,data)=>I.t(key,data), esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state,level,attempt,network,mode='campaign',storageOK=true,audio,modalKind='',busy=false;
  let lastClock=performance.now(),activeMs=0,lastAdMs=0,winsSinceAd=0,waveTimer,toastTimer,cloudWaiting,loadedSaveKey,cloudSelection=false;
  const spins=new Map(),motion=matchMedia('(prefers-reduced-motion: reduce)');
  const reduced=()=>state?.reducedMotion||motion.matches;
  const stamp=()=>{attempt=S.stampAttempt(attempt,Date.now());(mode==='daily'?state.daily.attempts:state.attempts)[level.id]=attempt;};
  const district=()=>mode==='campaign'?Math.floor((level.id-1)/20):Math.floor((state.current-1)/20);
  const count=d=>state.completed.filter(id=>Math.floor((id-1)/20)===d).length;
  const interactive=()=>!!network&&!network.solved&&!document.hidden&&!$('modal').open&&!P.paused&&!busy;
  function tick(){const now=performance.now(),delta=Math.max(0,Math.min(1000,now-lastClock));lastClock=now;if(interactive()){activeMs+=delta;attempt.foregroundMs=(attempt.foregroundMs||0)+delta;}}
  function syncPlay(){tick();P.gameplay(interactive());if((document.hidden||P.paused||busy||$('modal').open)&&audio)audio.suspend().catch(()=>{});$('pause-cover').hidden=!P.paused;$('pause-cover').textContent=t('paused');}
  function status(){const key=!storageOK?'saveError':P.cloudStatus==='synced'?'cloudSaved':P.cloudStatus==='pending'?'cloudPending':P.cloudStatus==='error'?'cloudError':'saved';$('save-status').textContent=t(key);$('save-status').classList.toggle('save-warning',!storageOK);}
  function save(){state.updatedAt=Math.max(Date.now(),state.updatedAt+1);try{P.storage.setItem(loadedSaveKey,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}P.save(state);status();}
  function read(key){try{const value=P.storage.getItem(key);return value?JSON.parse(value):null;}catch{storageOK=false;return null;}}
  function event(name,data={}){const counter=globalThis.BlockRelease?.metricaCounter;if(counter&&typeof globalThis.ym==='function'){try{globalThis.ym(counter,'reachGoal',name,{build:BUILD,language:I.language,...data});}catch{}}}
  function resize(){const area=document.querySelector('.board-area');if(!area)return;const edge=Math.floor(Math.max(100,Math.min(area.clientWidth-14,area.clientHeight-14,490)));document.querySelector('.board-frame').style.setProperty('--edge',edge+'px');}
  function settingsText(){
    I.set(state.language==='auto'?P.language:state.language);document.documentElement.lang=I.language;document.title=t('brand');
    document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
    document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=A.icon(el.dataset.icon));
    $('sound').innerHTML=A.icon(state.sound?'sound':'mute');$('sound').setAttribute('aria-label',t(state.sound?'soundOn':'soundOff'));
    $('settings').setAttribute('aria-label',t('settings'));$('modal-close').setAttribute('aria-label',t('close'));
    $('undo').innerHTML=A.icon('undo')+esc(t('undo'));$('restart').innerHTML=A.icon('reset')+esc(t('restart'));$('hint').innerHTML=A.icon('bolt')+esc(t('hint'));
    document.documentElement.classList.toggle('reduced-motion',!!reduced());$('board').setAttribute('aria-label',t('board'));
    if(reduced()){spins.clear();$('board').getAnimations({subtree:true}).forEach(a=>a.cancel());$('board').classList.remove('power-wave');clearTimeout(waveTimer);$('victory').style.setProperty('--win-delay','0ms');}
    status();
  }
  function board(){
    const focus=document.activeElement?.dataset.tile,longest=Math.max(1,...network.distance.flat().filter(Number.isFinite));
    const el=$('board');el.style.setProperty('--size',level.size);el.parentElement.style.setProperty('--size',level.size);el.dataset.level=String(level.id);el.dataset.solved=String(network.solved);el.dataset.mode=mode;
    $('col-labels').innerHTML=Array.from({length:level.size},(_,i)=>'<span>'+String.fromCharCode(65+i)+'</span>').join('');
    $('row-labels').innerHTML=Array.from({length:level.size},(_,i)=>'<span>'+(i+1)+'</span>').join('');
    el.innerHTML=level.tiles.map((tile,i)=>{
      const on=network.live[i].some(Boolean),coordinate=String.fromCharCode(65+i%level.size)+(Math.floor(i/level.size)+1);
      const name=t(tile.kind==='wire'&&tile.groups.length>1?'dual':tile.kind)+(tile.kind==='garden'?'':', '+t(tile.fixed?'fixed':'rotate')+', '+t(on?'powered':'dark'));
      const tag=tile.fixed?'div':'button',attr=tile.fixed?' role="img"':' data-tile="'+i+'" data-turns="'+attempt.rotations[i]+'"'+(network.solved||busy||P.paused?' disabled':'');
      return '<'+tag+' class="tile '+tile.kind+(tile.fixed?' fixed':'')+(level.id===1&&!attempt.moves&&!tile.fixed?' suggested':'')+'"'+attr+' aria-label="'+esc(coordinate+': '+name)+'">'+A.tileArt(tile,network.groups[i],network.live[i],i,network.distance[i].map(d=>Number.isFinite(d)?Math.round(d/longest*600):0))+'</'+tag+'>';
    }).join('');
    const now=performance.now();for(const [index,spin]of spins){const remaining=spin.until-now,drawing=el.querySelector('[data-tile="'+index+'"] .tile-drawing');if(remaining<=0||!drawing||reduced()){spins.delete(index);continue;}drawing.animate([{transform:'rotate('+(spin.from*remaining/150)+'deg)'},{transform:'rotate(0deg)'}],{duration:remaining,easing:'linear'});}
    if(focus!==undefined&&!network.solved)el.querySelector('[data-tile="'+focus+'"]')?.focus({preventScroll:true});
    $('house-counter').innerHTML=A.icon('home')+network.powered.length+' / '+network.homes.length;
    $('house-counter').classList.toggle('complete',network.solved);$('house-counter').setAttribute('aria-label',t('homes',{n:network.powered.length,total:network.homes.length}));
    $('moves').textContent=t('moves',{n:attempt.moves});$('undo').disabled=network.solved||!attempt.history.length||busy;$('hint').disabled=network.solved||busy;$('restart').disabled=busy;
  }
  function townArt(d,token){return globalThis.BlockDistrictArt?BlockDistrictArt.town(count(d),state.decor[d],d,I.language,state.decorUnlocked[d],token):A.town(Math.round(count(d)/20*12),state.decor[d]);}
  function town(){const d=district(),n=count(d);$('district-name').textContent=t('district'+d);$('town').innerHTML=townArt(d,'aside');$('town-title').textContent=t(n===20?'townFinished':'townGrowing');$('town-caption').textContent=t('townText');$('district-progress').textContent=n+' / 20';$('progress-fill').style.width=n/20*100+'%';$('milestones').innerHTML=[6,13,20].map((n,i)=>'<span class="milestone '+(count(d)>=n?'done':'')+'">'+esc(t('milestone'+i))+'</span>').join('');}
  function render(){
    settingsText();$('level-number').textContent=mode==='daily'?t('dailyNumber',{n:level.id-1000}):t('level',{n:level.id});
    $('level-title').textContent=I.level(level,'title');$('level-caption').textContent=I.level(level,'caption');$('lesson').textContent=I.level(level,'lesson');
    board();town();$('lesson').hidden=network.solved;$('puzzle-actions').hidden=network.solved;$('victory').hidden=!network.solved;
    if(network.solved){const final=mode==='campaign'&&level.id%20===0,last=mode==='campaign'&&level.id===60;const title=mode==='daily'?'dailyDone':last?'allWon':final?'districtWon':'won';$('victory').innerHTML='<div><h2>'+esc(t(title))+'</h2><p>'+esc(t(last?'allText':'completeText'))+'</p></div><div class="victory-actions"><button class="icon-button" data-action="restart" aria-label="'+esc(t('restart'))+'">'+A.icon('reset')+'</button><button class="primary" id="next" data-action="next">'+esc(t(mode==='daily'?'back':last?'town':'next'))+' '+A.icon('arrow')+'</button></div>';}
    $('campaign-nav').classList.toggle('active',mode==='campaign');$('daily-nav').classList.toggle('active',mode==='daily');$('daily-nav').disabled=![1,2,3].every(n=>state.completed.includes(n));resize();syncPlay();
  }
  function select(id,which='campaign',reason='select'){
    tick();const list=which==='daily'?BlockDailies:BlockLevels,lvl=list.find(l=>l.id===id);if(!lvl||which==='campaign'&&id>S.unlocked(state))return;
    clearTimeout(waveTimer);spins.clear();$('board').classList.remove('power-wave');$('victory').style.setProperty('--win-delay','0ms');
    cloudSelection=false;mode=which;level=lvl;if(mode==='campaign'){state.current=id;if(!['load','cloud'].includes(reason))state.currentAt=Math.max(Date.now(),state.currentAt+1);}
    const bank=mode==='daily'?state.daily.attempts:state.attempts;attempt=bank[id]||(bank[id]={...E.fresh(level),foregroundMs:0,updatedAt:0,reported:false});
    network=E.inspect(level,attempt.rotations);close();render();save();event('level_start',{level:id,mode,reason});
  }
  function sound(win=false){if(!state.sound||document.hidden||P.paused||busy)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});(win?[523,659,784]:[330+network.powered.length*55]).forEach((frequency,i)=>{const o=audio.createOscillator(),g=audio.createGain(),at=audio.currentTime+i*.1;o.frequency.value=frequency;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.045,at+.012);g.gain.exponentialRampToValueAtTime(.001,at+.22);o.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+.24);});}catch{}}
  function won(){const done=mode==='daily'?state.daily.completed:state.completed,first=!done.includes(level.id);if(first){done.push(level.id);done.sort((a,b)=>a-b);if(mode==='campaign'){winsSinceAd++;const d=district();if(count(d)===20)state.decorUnlocked[d]=true;}}attempt.reported=true;event(mode==='daily'?'daily_complete':'level_complete',{level:level.id,moves:attempt.moves,activeMs:Math.round(attempt.foregroundMs),hinted:!!attempt.hinted});return first;}
  function turn(index){if(!interactive())return;tick();if(mode==='campaign')state.currentAt=Math.max(Date.now(),state.currentAt+1);const now=performance.now(),previous=spins.get(index);if(!E.turn(level,attempt,index))return;if(!reduced())spins.set(index,{from:(previous?previous.from*Math.max(0,previous.until-now)/150:0)-90,until:now+150});network=E.inspect(level,attempt.rotations);const victory=network.solved;if(victory)won();stamp();render();save();sound(victory);if(victory&&!reduced()){$('board').classList.add('power-wave');$('victory').style.setProperty('--win-delay','600ms');waveTimer=setTimeout(()=>{$('board').classList.remove('power-wave');$('victory').style.setProperty('--win-delay','0ms');},850);}}
  function open(kind,html){tick();modalKind=kind;$('modal-content').innerHTML=html;if(!$('modal').open)$('modal').showModal();syncPlay();}
  function close(){if($('modal').open)$('modal').close();modalKind='';syncPlay();}
  function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
  function levelsMenu(){const max=S.unlocked(state);open('levels','<h2>'+esc(t('levels'))+'</h2>'+[0,1,2].map(d=>'<h3>'+esc(t('district'+d))+' · '+count(d)+'/20</h3><div class="levels-grid">'+BlockLevels.slice(d*20,d*20+20).map(l=>'<button class="level-choice '+(state.completed.includes(l.id)?'passed ':'')+(mode==='campaign'&&level.id===l.id?'current':'')+'" data-level="'+l.id+'" '+(l.id>max?'disabled':'')+' title="'+esc(I.level(l,'title'))+'" aria-label="'+esc(l.id+'. '+I.level(l,'title')+(state.completed.includes(l.id)?', '+t('finished'):''))+'">'+l.id+(state.completed.includes(l.id)?' ✓':'')+'</button>').join('')+'</div>').join(''));}
  function districtsMenu(){open('districts','<h2>'+esc(t('map'))+'</h2>'+[0,1,2].map(d=>'<section class="district-card"><h3>'+esc(t('district'+d))+'</h3><p>'+esc(t('districtProgress',{n:count(d)}))+'</p>'+townArt(d,'modal-'+d)+(state.decorUnlocked[d]?'<div class="decor-actions">'+['garland','flowers'].map(v=>'<button data-decor="'+v+'" data-district="'+d+'" class="'+(state.decor[d]===v?'selected':'')+'" aria-pressed="'+(state.decor[d]===v)+'">'+esc(t(v))+'</button>').join('')+'</div>':'')+'</section>').join(''));}
  function availableDaily(){const epoch=Date.parse((globalThis.BlockRelease?.dailyEpoch||'2026-09-21')+'T00:00:00Z');return Math.max(0,Math.min(BlockDailies.length,Math.floor((P.serverNow()-epoch)/86400000)+1));}
  function dailyMenu(){if(![1,2,3].every(n=>state.completed.includes(n))){toast(t('dailyLocked'));return;}const n=availableDaily();open('daily','<h2>'+esc(t(n>=14?'archive':'daily'))+'</h2><p>'+esc(t(n>=14?'dailyEnd':'dailyIntro'))+'</p><div class="levels-grid">'+BlockDailies.map((l,i)=>'<button data-daily="'+l.id+'" class="level-choice '+(state.daily.completed.includes(l.id)?'passed':'')+'" '+(i>=n?'disabled':'')+' aria-label="'+esc(I.level(l,'title'))+'">'+(i+1)+(state.daily.completed.includes(l.id)?' ✓':'')+'</button>').join('')+'</div>');}
  function hintMenu(){if(mode==='campaign')state.currentAt=Math.max(Date.now(),state.currentAt+1);const openHint=level.id<=15||state.hints[level.id],free=!Object.keys(state.hints).some(id=>Number(id)>15)||!P.active;event('hint_request',{level:level.id});if(openHint){attempt.hinted=true;stamp();save();open('hint','<h2>'+esc(t('firstHint'))+'</h2><p class="hint-copy">'+esc(I.level(level,'hint'))+'</p><p>'+esc(I.level(level,'lesson'))+'</p>');return;}open('hint','<h2>'+esc(t('firstHint'))+'</h2><p>'+esc(I.level(level,'lesson'))+'</p><p>'+esc(t(free?'firstHintGift':'adHintText'))+'</p><div class="modal-actions"><button data-action="grant-hint" class="primary">'+esc(t(free?'freeHint':'adHint'))+'</button><button data-action="close">'+esc(t('continue'))+'</button></div>');}
  async function grantHint(){if(busy||modalKind!=='hint')return;const targetId=level.id;const free=targetId<=15||state.hints[targetId]||!Object.keys(state.hints).some(id=>Number(id)>15)||!P.active;busy=true;syncPlay();try{const result=free?{rewarded:true}:await P.rewarded();if(result.rewarded){state.hints[targetId]=true;attempt.hinted=true;stamp();save();event('hint_granted',{level:targetId,rewarded:!free});}else toast(t('noAd'));}catch{toast(t('noAd'));}finally{busy=false;render();if(state.hints[targetId])hintMenu();else close();}}
  function settingsMenu(){open('settings','<h2>'+esc(t('settings'))+'</h2><div class="setting-row"><span>'+esc(t('language'))+'</span><select id="language-select" aria-label="'+esc(t('language'))+'">'+[['auto',t('automatic')],['ru','Русский'],['en','English']].map(([v,label])=>'<option value="'+v+'" '+(state.language===v?'selected':'')+'>'+esc(label)+'</option>').join('')+'</select></div><div class="setting-row"><label><input type="checkbox" id="motion-input" '+(state.reducedMotion?'checked':'')+'>'+esc(t('motion'))+'</label></div><h3>'+esc(t('rulesTitle'))+'</h3><p>'+esc(t('rules'))+'</p><p class="small">'+esc(t('keys'))+'</p><h3>'+esc(t('import'))+'</h3><p class="small">'+esc(t('transfer'))+'</p><div class="modal-actions"><button data-action="export">'+esc(t('export'))+'</button><button data-action="import">'+esc(t('import'))+'</button></div><input type="file" id="import-file" accept=".json,application/json" hidden>'+(P.active?'<div class="modal-actions"><button data-action="sync">'+esc(t('retry'))+'</button></div>':'')+'<p class="small">'+esc(t('version'))+' '+BUILD+'</p>');}
  function download(){tick();save();const blob=new Blob([JSON.stringify({game:'light-the-block',build:BUILD,save:state})],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='light-the-block-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  async function importFile(file){if(!file||busy)return;busy=true;syncPlay();try{if(file.size>1000000)throw Error('Too large');const raw=JSON.parse(await file.text()),value=raw.game==='light-the-block'?raw.save:raw;if(!value||![1,2].includes(value.version)||!Array.isArray(value.completed))throw Error('Wrong save');state=S.merge(state,S.clean(value));select(state.current,'campaign','import');toast(t('importOK'));}catch{toast(t('importError'));}finally{busy=false;render();}}
  async function next(){if(busy||!network.solved)return;if(mode==='daily'){select(state.current);return;}if(level.id===60){districtsMenu();return;}const id=level.id+1;busy=true;syncPlay();try{if(P.active&&state.completed.length>=5&&activeMs>=180000&&winsSinceAd>=3&&activeMs-lastAdMs>=180000){lastAdMs=activeMs;winsSinceAd=0;event('ad_request',{kind:'fullscreen'});await P.fullscreen();}}catch{}finally{busy=false;select(id);}}
  async function action(name){
    if(busy&&name!=='close')return;
    if(name==='close'){if(!busy)close();return;}
    if(P.paused)return;
    if(name==='levels')levelsMenu();else if(name==='districts')districtsMenu();else if(name==='daily')dailyMenu();else if(name==='settings')settingsMenu();
    else if(name==='sound'){state.sound=!state.sound;state.settingsAt=Math.max(Date.now(),state.settingsAt+1);save();render();sound();}
    else if(name==='hint')hintMenu();else if(name==='grant-hint')await grantHint();else if(name==='next')await next();
    else if(name==='undo'){if(!network.solved&&E.undo(attempt)){tick();spins.clear();network=E.inspect(level,attempt.rotations);stamp();render();save();}}
    else if(name==='restart')open('restart','<h2>'+esc(t('confirmRestart'))+'</h2><p>'+esc(t('restartText'))+'</p><div class="modal-actions"><button class="primary" data-action="confirm-restart">'+esc(t('restart'))+'</button><button data-action="close">'+esc(t('cancel'))+'</button></div>');
    else if(name==='confirm-restart'){attempt={...E.fresh(level),foregroundMs:0,updatedAt:Math.max(Date.now(),attempt.updatedAt+1),reported:false};(mode==='daily'?state.daily.attempts:state.attempts)[level.id]=attempt;select(level.id,mode,'restart');}
    else if(name==='export')download();else if(name==='import')$('import-file').click();else if(name==='sync'){P.retrySync();toast(t('cloudPending'));}
  }
  document.addEventListener('click',e=>{if(!state)return;if((busy||P.paused)&&!e.target.closest('[data-action="close"]'))return;const tile=e.target.closest('[data-tile]');if(tile){turn(Number(tile.dataset.tile));return;}const chosen=e.target.closest('button[data-level]');if(chosen&&!chosen.disabled&&!busy){select(Number(chosen.dataset.level));return;}const daily=e.target.closest('[data-daily]');if(daily&&!daily.disabled&&!busy){select(Number(daily.dataset.daily),'daily');return;}const decor=e.target.closest('[data-decor]');if(decor&&!busy){const d=Number(decor.dataset.district);if(state.decorUnlocked[d]){state.decor[d]=decor.dataset.decor;state.settingsAt=Math.max(Date.now(),state.settingsAt+1);save();town();districtsMenu();}return;}const button=e.target.closest('[data-action]');if(button&&!button.disabled)action(button.dataset.action);});
  document.addEventListener('change',e=>{if(!state||busy||P.paused)return;if(e.target.id==='language-select'){state.language=e.target.value;state.settingsAt=Math.max(Date.now(),state.settingsAt+1);save();render();settingsMenu();}else if(e.target.id==='motion-input'){state.reducedMotion=e.target.checked;state.settingsAt=Math.max(Date.now(),state.settingsAt+1);save();render();}else if(e.target.id==='import-file')importFile(e.target.files[0]);});
  $('board').addEventListener('keydown',e=>{const current=e.target.closest('[data-tile]');if(!current||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-level.size,ArrowDown:level.size}[e.key];let i=Number(current.dataset.tile)+step;while(i>=0&&i<level.tiles.length){const b=$('board').querySelector('[data-tile="'+i+'"]');if(b&&!b.disabled){b.focus();break;}i+=step;}});
  document.addEventListener('contextmenu',e=>e.preventDefault());$('board').addEventListener('dragstart',e=>e.preventDefault());
  $('modal').addEventListener('cancel',e=>{if(busy){e.preventDefault();return;}modalKind='';});$('modal').addEventListener('close',()=>{if($('modal').open)return;modalKind='';if(cloudSelection&&!busy){cloudSelection=false;select(state.current,'campaign','cloud');}else syncPlay();});
  document.addEventListener('visibilitychange',()=>{tick();if(state&&attempt){save();}syncPlay();});addEventListener('pagehide',()=>{if(state&&attempt){save();}});
  motion.addEventListener('change',()=>{if(state)render();});new ResizeObserver(resize).observe(document.querySelector('.board-area'));
  P.onPause(()=>{if(state){syncPlay();board();}});P.onStatus(()=>{if(state)status();});
  P.onCloud(raw=>{if(!state){cloudWaiting=raw;return;}if(raw||P.saveKey!==loadedSaveKey){tick();if(P.saveKey!==loadedSaveKey){state=S.merge(state,read(P.saveKey));loadedSaveKey=P.saveKey;}state=S.merge(state,raw);if(mode==='campaign'){if($('modal').open||busy)cloudSelection=state.current!==level.id;else level=BlockLevels[state.current-1];}const bank=mode==='daily'?state.daily.attempts:state.attempts;attempt=bank[level.id]||(bank[level.id]={...E.fresh(level),foregroundMs:0,updatedAt:0,reported:false});network=E.inspect(level,attempt.rotations);render();}save();});
  try{
    await P.init();loadedSaveKey=P.saveKey;state=S.clean(read(P.saveKey)||(!P.active?read('light-block:progress:v1'):null));
    if(cloudWaiting)state=S.merge(state,cloudWaiting);
    $('boot').hidden=true;$('app').hidden=false;document.documentElement.dataset.build=BUILD;
    select(state.current,'campaign','load');P.ready();event('game_ready');setInterval(tick,500);setInterval(()=>{if(state&&attempt&&interactive()){save();}},10000);
    globalThis.BlockGame={getState:()=>structuredClone(state),getLevel:()=>level.id,getMode:()=>mode};
  }catch(error){$('boot').hidden=false;$('app').hidden=true;$('boot').textContent=t('errorBoot');console.error(error);}
})();
