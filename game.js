(function () {
  'use strict';
  const E = BlockEngine, A = BlockArt, levels = BlockLevels;
  const BUILD = '0.2.0', MAIN_KEY = 'light-block:progress:v1', STUDY_KEY = 'light-block:study-progress:v1', LOG_KEY = 'light-block:study-log:v1';
  const $ = id => document.getElementById(id);
  let storageOK = true, logOK = true, audioContext, lastClock = performance.now(), checkpointActive = false;
  let returnNormalOnClose = false, waveTimer = 0, townTimer = 0;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lessMotion = () => state.reducedMotion || motionQuery.matches;
  const rotationsInFlight = new Map();
  const freshState = () => ({ version:1,current:1,completed:[],attempts:{},sound:false,decor:'garland',reducedMotion:false });
  function read(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch (_) { storageOK = false; return null; }
  }
  function cleanState(raw) {
    const result = freshState();
    if (!raw || raw.version !== 1) return result;
    result.completed = [...new Set((Array.isArray(raw.completed) ? raw.completed : []).filter(n => Number.isInteger(n) && n >= 1 && n <= levels.length))].sort((a,b)=>a-b);
    const unlocked = Math.min(levels.length, result.completed.reduce((n, id) => id === n ? n + 1 : n, 1));
    result.current = Number.isInteger(raw.current) && raw.current >= 1 && raw.current <= unlocked ? raw.current : unlocked;
    result.sound = raw.sound === true;
    result.reducedMotion = raw.reducedMotion === true;
    result.decor = raw.decor === 'flowers' ? 'flowers' : 'garland';
    for (const level of levels) {
      const valid = E.validateAttempt(level, raw.attempts && raw.attempts[level.id]);
      if (valid) {
        const previous = raw.attempts[level.id];
        valid.foregroundMs = Number.isFinite(previous.foregroundMs) && previous.foregroundMs >= 0 ? previous.foregroundMs : 0;
        valid.turns = Number.isSafeInteger(previous.turns) && previous.turns >= 0 ? previous.turns : valid.moves;
        valid.undos = Number.isSafeInteger(previous.undos) && previous.undos >= 0 ? previous.undos : 0;
        valid.number = Number.isSafeInteger(previous.number) && previous.number > 0 ? previous.number : 1;
        valid.reported = previous.reported === true;
        result.attempts[level.id] = valid;
      }
    }
    return result;
  }
  const normalState = cleanState(read(MAIN_KEY));
  let journal = read(LOG_KEY);
  if (!journal || journal.schemaVersion !== 1 || !Array.isArray(journal.events) || typeof journal.testRunId !== 'string') journal = null;
  if(journal){
    journal.foregroundMs=Number.isFinite(journal.foregroundMs)&&journal.foregroundMs>=0?journal.foregroundMs:0;
    journal.seq=Number.isSafeInteger(journal.seq)&&journal.seq>=0?journal.seq:journal.events.length;
    journal.dropped=Number.isSafeInteger(journal.dropped)&&journal.dropped>=0?journal.dropped:0;
    if(journal.events.length>2000){journal.dropped+=journal.events.length-2000;journal.events=journal.events.slice(-2000);}
    journal.checkpointChoice=['stop','continue'].includes(journal.checkpointChoice)?journal.checkpointChoice:null;
    journal.nextLevel=Number.isInteger(journal.nextLevel)&&journal.nextLevel>=1&&journal.nextLevel<=levels.length?journal.nextLevel:null;
  }
  let testing = !!journal && journal.running === true;
  let stateKey = testing ? STUDY_KEY : MAIN_KEY;
  let state = testing ? cleanState(read(STUDY_KEY)) : normalState;
  let level, attempt, network, viewingSolved = false;
  const sessionId = Math.random().toString(36).slice(2,10);
  function saveLog() {
    if (!journal) return;
    try { localStorage.setItem(LOG_KEY, JSON.stringify(journal)); logOK = true; }
    catch (_) { logOK = false; }
    if (!logOK && testing) {
      $('save-status').textContent='Дневник не сохраняется — скачайте его перед закрытием';
      $('save-status').classList.add('save-warning');
    }
  }
  function log(event, payload = {}) {
    if (!testing || !journal) return;
    const seq = ++journal.seq;
    journal.events.push({seq,sessionId,foregroundMs:Math.round(journal.foregroundMs),event,payload});
    if (journal.events.length > 2000) {
      journal.events.shift(); journal.dropped = (journal.dropped || 0) + 1;
    }
    saveLog();
  }
  function save() {
    try {
      localStorage.setItem(stateKey, JSON.stringify(state));
      storageOK = true;
    } catch (_) { storageOK = false; log('save_error', {reason:'storage_unavailable'}); }
    $('save-status').textContent = !storageOK ? 'Сохранение недоступно — не закрывайте вкладку' : testing && !logOK ? 'Дневник не сохраняется — скачайте его перед закрытием' : testing ? 'Тест: записи остаются на этом устройстве' : 'Прогресс сохраняется на этом устройстве';
    $('save-status').classList.toggle('save-warning', !storageOK || (testing && !logOK));
  }
  function newAttempt(lvl, number = 1) {
    return {...E.fresh(lvl),foregroundMs:0,turns:0,undos:0,number,reported:false};
  }
  function countMain() { return state.completed.filter(id => id <= 12).length; }
  function maxUnlocked() {
    let id = 1;
    while (state.completed.includes(id) && id < levels.length) id++;
    return id;
  }
  function tick() {
    const now = performance.now(), elapsed = now - lastClock;
    lastClock = now;
    if (document.hidden || $('modal').open || checkpointActive || !attempt || network.solved) return;
    attempt.foregroundMs += elapsed;
    if (testing) {
      journal.foregroundMs += elapsed;
    }
  }
  function beforeAction() {
    tick();
    if(checkpointActive)return false;
    if(testing && !journal.checkpointOffered && journal.foregroundMs >= 300000){checkpoint('five_minutes');return false;}
    return true;
  }
  function setLevel(id, reason = 'select') {
    if(!['load','test_start','return_normal'].includes(reason) && !beforeAction())return;
    if(reason!=='load' && testing && id>3 && !journal.checkpointChoice && [1,2,3].every(n=>state.completed.includes(n))){journal.nextLevel=id;checkpoint('three_levels');return;}
    if (!Number.isInteger(id) || id < 1 || id > maxUnlocked()) return;
    clearTimeout(waveTimer); clearTimeout(townTimer);
    rotationsInFlight.clear();
    $('board').classList.remove('power-wave');
    $('victory').style.setProperty('--win-delay','0ms');
    state.current = id;
    level = levels[id - 1];
    const existed = !!state.attempts[id];
    attempt = state.attempts[id] || (state.attempts[id] = newAttempt(level));
    network = E.inspect(level, attempt.rotations);
    viewingSolved = false;
    $('hint-text').hidden = true;
    $('level-number').textContent = id <= 12 ? `ИСТОРИЯ ${String(id).padStart(2,'0')} ИЗ 12` : `БОНУСНАЯ ИСТОРИЯ ${id - 12} ИЗ 3`;
    $('level-title').textContent = level.title;
    $('level-caption').textContent = level.caption;
    log(existed ? 'level_resume' : 'level_start', {level:id,attempt:attempt.number,reason});
    render(); save();
    maybeCheckpoint();
    if(reason!=='load'){
      const bounds=$('board').getBoundingClientRect();
      if(bounds.top<0 || bounds.bottom>innerHeight)document.querySelector('.puzzle-panel').scrollIntoView({block:'start',behavior:'instant'});
    }
  }
  function renderBoard(clicked = -1) {
    const focus = document.activeElement && document.activeElement.dataset.tile;
    $('board').style.setProperty('--size', level.size);
    $('board').dataset.level = String(level.id);
    $('board').dataset.solved = String(network.solved);
    const longest = Math.max(1, ...network.distance.flat().filter(Number.isFinite));
    $('board').innerHTML = level.tiles.map((tile,i) => {
      const moveable = !tile.fixed;
      const on = network.live[i].some(Boolean);
      const coordinate = `${String.fromCharCode(65 + i % level.size)}${Math.floor(i / level.size) + 1}`;
      const name = tile.kind === 'source' ? 'Источник энергии' : tile.kind === 'home' ? `Дом, ${on ? 'свет включён' : 'ждёт света'}` : tile.kind === 'garden' ? 'Сад' : `${tile.groups.length > 1 ? 'Две независимые дуги' : 'Провод'}, ${tile.fixed ? 'закреплён' : 'повернуть'}, ${on ? 'есть питание' : 'без питания'}`;
      const tag = moveable ? 'button' : 'div';
      const extra = moveable ? `data-tile="${i}" data-turns="${attempt.rotations[i]}" ${network.solved || checkpointActive ? 'disabled' : ''}` : 'role="img"';
      const guide = level.id === 1 && !network.solved && moveable && attempt.moves === 0;
      const delays = network.distance[i].map(d => Number.isFinite(d) ? Math.round(d / longest * 600) : 0);
      return `<${tag} class="tile ${tile.kind} ${tile.fixed ? 'fixed' : ''} ${guide ? 'suggested' : ''}" ${extra} aria-label="${coordinate}: ${name}">${A.tileArt(tile,network.groups[i],network.live[i],i,delays)}</${tag}>`;
    }).join('');
    const now = performance.now();
    for (const [index, spin] of rotationsInFlight) {
      const remaining = spin.until - now;
      const drawing = $('board').querySelector(`[data-tile="${index}"] .tile-drawing`);
      if (remaining <= 0 || !drawing || lessMotion()) { rotationsInFlight.delete(index); continue; }
      const from = spin.from * remaining / 150;
      drawing.animate([{transform:`rotate(${from}deg)`},{transform:'rotate(0deg)'}],{duration:remaining,easing:'linear'});
    }
    if (focus !== undefined && !network.solved) {
      const button = $('board').querySelector(`[data-tile="${focus}"]`);
      if (button) button.focus({preventScroll:true});
    }
    $('house-counter').innerHTML = A.icon('home') + `${network.powered.length} / ${network.homes.length}`;
    $('house-counter').classList.toggle('complete', network.solved);
    $('house-counter').setAttribute('aria-label',`Свет в ${network.powered.length} из ${network.homes.length} домов`);
    $('lesson').innerHTML = A.icon(network.solved ? 'check' : 'bolt') + `<span>${network.solved ? 'Все дома подключены. Хорошая работа.' : level.lesson}</span>`;
    $('moves').textContent = `${attempt.moves} ${attempt.moves % 10 === 1 && attempt.moves % 100 !== 11 ? 'поворот' : attempt.moves % 10 >= 2 && attempt.moves % 10 <= 4 && (attempt.moves % 100 < 12 || attempt.moves % 100 > 14) ? 'поворота' : 'поворотов'}`;
    $('undo').disabled = network.solved || checkpointActive || attempt.history.length === 0;
    $('hint').disabled = network.solved || checkpointActive;
    $('restart').disabled = checkpointActive;
  }
  function renderTown(highlight = 0) {
    const count = countMain();
    $('town').innerHTML = A.town(count,state.decor,lessMotion() ? 0 : highlight);
    $('progress-label').textContent = `${count} / 12`;
    $('progress-fill').style.width = `${count / 12 * 100}%`;
    const title = count === 0 ? 'Пока город дремлет' : count < 6 ? 'Свет возвращается' : count < 8 ? 'Пахнет свежим хлебом' : count < 12 ? 'Улица оживает' : 'Как хорошо дома';
    const caption = count === 0 ? 'За каждым тёмным окном кто-то ждёт немного света.' : count < 6 ? 'В окнах всё теплее. Ещё немного — и откроется пекарня.' : count < 8 ? 'Пекарня снова открыта. А в сквере ещё ждут своего фонаря.' : count < 12 ? 'Теперь здесь можно гулять допоздна. Осталось зажечь последние окна.' : 'Все окна светятся. Этот маленький вечер — ваша работа.';
    $('town-title').textContent = title; $('town-caption').textContent = caption;
    $('milestones').innerHTML = [[6,'Пекарня'],[8,'Сквер'],[12,'Весь квартал']].map(([n,text]) => `<span class="milestone ${count >= n ? 'done' : ''}">${text}</span>`).join('');
    $('decor').hidden = count < 12;
    $('decor').querySelectorAll('button').forEach(button => {
      button.classList.toggle('selected',button.dataset.decor === state.decor);
      button.setAttribute('aria-pressed', String(button.dataset.decor === state.decor));
    });
    const max = maxUnlocked();
    const selector = lvl => `<button class="level-choice ${state.completed.includes(lvl.id) ? 'passed' : ''} ${state.current === lvl.id ? 'current' : ''}" data-level="${lvl.id}" ${lvl.id > max ? 'disabled' : ''} ${state.current === lvl.id ? 'aria-current="step"' : ''} aria-label="${lvl.id}. ${lvl.title}${state.completed.includes(lvl.id) ? ', пройдено' : ''}">${String(lvl.id).padStart(2,'0')}</button>`;
    $('level-list').innerHTML = levels.slice(0,12).map(selector).join('');
    $('bonus-list').innerHTML = levels.slice(12).map(selector).join('');
    $('bonus-section').hidden = count < 12;
  }
  function renderWin() {
    $('victory').hidden = !network.solved || checkpointActive;
    $('lesson').hidden = network.solved || checkpointActive;
    $('puzzle-actions').hidden = network.solved || checkpointActive;
    $('study-checkpoint').hidden = !checkpointActive;
    if (!network.solved || checkpointActive) return;
    const final = level.id === 12, last = level.id === levels.length;
    const title = last ? 'До следующего вечера' : final ? 'Квартал зажжён!' : level.id === 6 ? 'Пекарня открыта!' : level.id === 8 ? 'Фонари зажглись!' : 'Вот и стало теплее';
    const text = last ? 'Все 15 задач решены. Свет остаётся с вами.' : final ? 'Выберите гирлянду или цветы для своего квартала.' : level.id === 6 ? 'В пекарне светло. Скоро будет готов свежий хлеб.' : level.id === 8 ? 'Фонарь осветил сквер. Теперь можно гулять допоздна.' : 'Ещё одно окно вашего квартала светится.';
    $('victory').innerHTML = `<div class="victory-copy"><div class="victory-heading"><h3>${title}</h3><button class="replay-button" data-action="replay" aria-label="Начать задачу заново" title="Начать задачу заново">${A.icon('reset')}</button></div><p>${text}</p></div><div class="victory-actions">${final?'<button class="tool-button" data-action="choose-decor">Украсить</button>':''}<button class="primary" id="next">${last ? 'Мой квартал' : final ? 'Бонусы' : 'Дальше'}${A.icon('arrow')}</button></div>`;
  }
  function render(clicked = -1) { renderBoard(clicked); renderTown(); renderWin(); }
  function playSound(win = false) {
    if (!state.sound || document.hidden) return;
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume().catch(() => {});
      (win ? [523.25,659.25,783.99] : [330 + network.powered.length * 55]).forEach((frequency,i) => {
        const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
        const t = audioContext.currentTime + i * .1;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(.055,t+.012); gain.gain.exponentialRampToValueAtTime(.001,t+.23);
        oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(t); oscillator.stop(t+.25);
      });
    } catch (_) { /* Audio is optional. */ }
  }
  function complete() {
    if (!network.solved) return false;
    const firstCompletion = !state.completed.includes(level.id);
    if (!state.completed.includes(level.id)) {
      state.completed.push(level.id); state.completed.sort((a,b)=>a-b);
      if ([6,8,12].includes(level.id)) log('district_unlock', {level:level.id});
    }
    if (!attempt.reported) {
      log('level_complete',{level:level.id,attempt:attempt.number,foregroundMs:Math.round(attempt.foregroundMs),turns:attempt.turns,undos:attempt.undos,hinted:attempt.hinted});
      attempt.reported = true;
    }
    return firstCompletion;
  }
  function maybeCheckpoint() {
    if (!testing || journal.checkpointChoice || checkpointActive) return;
    if (journal.checkpointOffered || [1,2,3].every(n => state.completed.includes(n))) checkpoint(journal.checkpointReason || 'three_levels');
  }
  function celebrate(firstCompletion) {
    $('victory').style.setProperty('--win-delay',lessMotion()?'0ms':'600ms');
    if (!lessMotion()) {
      $('board').classList.add('power-wave');
      clearTimeout(waveTimer); waveTimer = setTimeout(()=>{$('board').classList.remove('power-wave');$('victory').style.setProperty('--win-delay','0ms');},850);
    }
    if (firstCompletion && level.id <= 12) {
      renderTown(level.id);
      clearTimeout(townTimer); townTimer=setTimeout(()=>{$('town').querySelectorAll('.town-new').forEach(el=>el.classList.remove('town-new'));},1600);
    }
    maybeCheckpoint();
  }
  $('board').addEventListener('click', event => {
    const button = event.target.closest('[data-tile]');
    if (!button) return;
    if (network.solved || button.disabled) return;
    if(!beforeAction())return;
    if ($('modal').open) return;
    const i = Number(button.dataset.tile);
    if (!lessMotion()) {
      const now = performance.now(), previous = rotationsInFlight.get(i);
      const residual = previous ? previous.from * Math.max(0, previous.until-now)/150 : 0;
      rotationsInFlight.set(i,{from:residual-90,until:now+150});
    }
    if (!E.turn(level,attempt,i)) return;
    attempt.turns++; network = E.inspect(level,attempt.rotations); const firstCompletion=complete(); playSound(network.solved);
    render(i); save();
    if(network.solved)celebrate(firstCompletion);
  });
  $('board').addEventListener('keydown', event => {
    const step = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-level.size,ArrowDown:level.size}[event.key];
    if (!step || !event.target.dataset.tile) return;
    event.preventDefault();
    let i = Number(event.target.dataset.tile) + step;
    while (i >= 0 && i < level.tiles.length) {
      const button = $('board').querySelector(`[data-tile="${i}"]:not(:disabled)`);
      if (button) { button.focus(); break; }
      i += step;
    }
  });
  $('undo').addEventListener('click', () => {
    if(!beforeAction())return;
    if(network.solved)return;
    rotationsInFlight.clear();
    if (!E.undo(attempt)) return;
    attempt.undos++; network = E.inspect(level,attempt.rotations); viewingSolved = false;
    log('undo',{level:level.id,attempt:attempt.number});render();save();
  });
  function restart() {
    if(!beforeAction())return;
    log('level_restart',{level:level.id,attempt:attempt.number});
    clearTimeout(waveTimer);$('board').classList.remove('power-wave');rotationsInFlight.clear();
    attempt = newAttempt(level,attempt.number+1); state.attempts[level.id] = attempt;
    network = E.inspect(level,attempt.rotations);viewingSolved=false;$('hint-text').hidden=true;
    log('level_start',{level:level.id,attempt:attempt.number,reason:'restart'});render();save();
  }
  $('restart').addEventListener('click', () => {
    if (!attempt.moves) { restart(); return; }
    modal('<h2 class="modal-content-title">Начать эту задачу заново?</h2><p>Провода вернутся в исходное положение. Уже открытые истории и огоньки квартала сохранятся.</p><div class="modal-buttons"><button class="primary" data-action="restart-confirm">Начать заново</button><button class="tool-button" data-action="close">Продолжить решение</button></div>');
  });
  $('hint').addEventListener('click', () => {
    if(!beforeAction())return;
    if (!attempt.hinted) log('hint_used',{level:level.id,attempt:attempt.number});
    attempt.hinted=true;$('hint-text').textContent=level.hint;$('hint-text').hidden=!$('hint-text').hidden;save();
  });
  function proceed() {
    if (level.id === levels.length) { $('town').scrollIntoView({behavior:lessMotion()?'auto':'smooth',block:'center'}); return; }
    setLevel(level.id+1,'next');
  }
  $('victory').addEventListener('click', event => {
    if(event.target.closest('#next')) proceed();
  });
  for (const id of ['level-list','bonus-list']) $(id).addEventListener('click',event=>{const button=event.target.closest('[data-level]');if(button&&!button.disabled)setLevel(Number(button.dataset.level));});
  $('decor').addEventListener('click',event=>{const button=event.target.closest('[data-decor]');if(!button)return;state.decor=button.dataset.decor;log('decor_choice',{choice:state.decor});renderTown();save();});
  function renderSettings(){
    $('sound').innerHTML=A.icon(state.sound?'sound':'mute');$('sound').setAttribute('aria-label',state.sound?'Выключить звук':'Включить звук');$('sound').title=state.sound?'Выключить звук':'Включить звук';
    document.documentElement.classList.toggle('reduced-motion',state.reducedMotion);
    if(lessMotion()){
      clearTimeout(waveTimer);clearTimeout(townTimer);rotationsInFlight.clear();
      $('board').classList.remove('power-wave');$('victory').style.setProperty('--win-delay','0ms');
      $('town').querySelectorAll('.town-new').forEach(el=>el.classList.remove('town-new'));
      document.getAnimations().forEach(animation=>animation.cancel());
    }
  }
  motionQuery.addEventListener('change',renderSettings);
  $('sound').addEventListener('click',()=>{state.sound=!state.sound;renderSettings();if(state.sound)playSound();else if(audioContext)audioContext.suspend().catch(()=>{});save();});
  function modal(html, priority = false) {
    if(!priority && !beforeAction())return;
    $('modal-content').innerHTML=html;if(!$('modal').open)$('modal').showModal();
    if(audioContext)audioContext.suspend().catch(()=>{});
  }
  function returnNormal(){
    returnNormalOnClose=false;testing=false;checkpointActive=false;
    $('modal-close').hidden=false;stateKey=MAIN_KEY;state=cleanState(read(MAIN_KEY));
    setLevel(state.current,'return_normal');renderSettings();
  }
  function closeModal(){if($('modal').open)$('modal').close();if(returnNormalOnClose)returnNormal();lastClock=performance.now();}
  $('modal-close').addEventListener('click',closeModal);
  $('modal').addEventListener('close',()=>{if(returnNormalOnClose)returnNormal();lastClock=performance.now();});
  $('modal').addEventListener('cancel',event=>{if(checkpointActive)event.preventDefault();});
  $('help').addEventListener('click',()=>modal(`<h2 class="modal-content-title">Пара поворотов —<br>и станет светлее.</h2><p>Нажимайте на провода, чтобы повернуть их на 90°. Соедините станцию со всеми домами одновременно.</p><ul><li>Концы соседних проводов должны смотреть друг на друга.</li><li>Дом можно временно погасить и перестроить путь.</li><li>Провод с заклёпкой не вращается.</li><li>Две дуги в одной клетке проводят свет независимо.</li></ul><p>Отменяйте ходы, пробуйте снова, пользуйтесь подсказкой. Штрафов и таймера нет.</p><label><input id="reduce-motion" type="checkbox" ${state.reducedMotion?'checked':''}>Меньше анимации</label><p class="small">Прогресс хранится только в этом браузере. При очистке данных или смене устройства он не переносится.</p><button class="primary" data-action="close">Всё понятно</button>`));
  function toolsModal(){
    tick();
    const text=journal?`${journal.events.length} событий · ${Math.round(journal.foregroundMs/1000)} сек. при видимой игре${journal.dropped?' · журнал обрезан':''}${!logOK?' · запись в хранилище недоступна':''}`:'Запись наблюдений ещё не начата.';
    modal(`<h2 class="modal-content-title">Дневник теста</h2><p>Для наблюдения за новым игроком. Все записи остаются в этом браузере; отправки на сервер нет.</p><p class="test-status">${text}</p><p class="small">Новый тест начинает отдельное прохождение. Ваш обычный квартал сохраняется. Предыдущий дневник будет заменён — сначала скачайте его, если он нужен.</p><div class="modal-buttons"><button class="primary" data-action="new-test">Новый тест</button>${journal?'<button class="tool-button" data-action="export">Скачать JSON</button>':''}${testing?'<button class="tool-button" data-action="finish-test">Закончить тест</button>':''}</div>`);
  }
  $('test-tools').addEventListener('click',toolsModal);
  function startTest(){
    closeModal();checkpointActive=false;testing=true;stateKey=STUDY_KEY;
    journal={schemaVersion:1,buildId:BUILD,levelSetVersion:1,testRunId:Math.random().toString(36).slice(2,12),seq:0,foregroundMs:0,events:[],dropped:0,checkpointOffered:false,checkpointChoice:null,running:true,completed:false};
    state=freshState();log('session_start',{mode:'new_test',buildId:BUILD});setLevel(1,'test_start');renderSettings();log('game_ready');
  }
  function exportLog(){
    tick();saveLog();
    if(!journal)return;
    const data={...journal,truncated:journal.dropped>0,summary:journal.summary||{completedLevels:[...state.completed],currentLevel:state.current},note:'Время при видимой игре; без фона и открытых окон. Закрытие вкладки не доказывает отказ. Данные этого браузера, без облачной синхронизации.'};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`light-block-test-${journal.testRunId}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function checkpoint(reason){
    if(!testing||journal.checkpointChoice)return;
    checkpointActive=true;
    if($('modal').open)$('modal').close();
    if(!journal.checkpointOffered){journal.checkpointOffered=true;journal.checkpointReason=reason;log('checkpoint_shown',{reason});}
    $('study-checkpoint').innerHTML='<p>Спасибо за первые огоньки. Продолжим прогулку?</p><div class="checkpoint-actions"><button class="tool-button" data-action="checkpoint-stop">Закончить</button><button class="tool-button" data-action="checkpoint-continue">Продолжить</button></div>';
    renderBoard();renderWin();lastClock=performance.now();
  }
  function finishTest(){
    tick();
    checkpointActive=false;$('modal-close').hidden=false;
    log('test_finish',{level:level.id});journal.completed=true;journal.running=false;journal.summary={completedLevels:[...state.completed],currentLevel:state.current};saveLog();
    testing=false;
    returnNormalOnClose=true;
    modal('<h2 class="modal-content-title">Спасибо за прогулку.</h2><p>Что побуждало открыть следующую задачу? Где стало непонятно или скучно?</p><p class="small">Ответы обсудите с наблюдателем. Дневник можно скачать для разбора.</p><div class="modal-buttons"><button class="primary" data-action="export">Скачать дневник</button><button class="tool-button" data-action="return-normal">Мой квартал</button></div>');
  }
  $('modal-content').addEventListener('change',event=>{if(event.target.id==='reduce-motion'){state.reducedMotion=event.target.checked;renderSettings();save();}});
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-action]');if(!button)return;
    switch(button.dataset.action){
      case 'close':closeModal();break;
      case 'restart-confirm':closeModal();restart();break;
      case 'new-test':
        if(journal)modal('<h2 class="modal-content-title">Начать новый тест?</h2><p>Текущий дневник будет заменён. Скачайте его, если хотите сохранить запись.</p><div class="modal-buttons"><button class="tool-button" data-action="export">Скачать JSON</button><button class="primary" data-action="confirm-new-test">Начать новый</button><button class="tool-button" data-action="close">Отмена</button></div>');
        else startTest();break;
      case 'confirm-new-test':startTest();break;
      case 'export':exportLog();break;
      case 'finish-test':finishTest();break;
      case 'checkpoint-stop':journal.checkpointChoice='stop';log('checkpoint_choice',{choice:'stop'});finishTest();break;
      case 'checkpoint-continue':journal.checkpointChoice='continue';log('checkpoint_choice',{choice:'continue'});checkpointActive=false;closeModal();if(journal.nextLevel)setLevel(journal.nextLevel,'checkpoint');else if(network.solved)proceed();else render();break;
      case 'return-normal':closeModal();break;
      case 'replay':$('restart').click();break;
      case 'choose-decor':
        modal('<h2 class="modal-content-title">Ваш последний штрих</h2><p>Что добавим на вечернюю улицу?</p><div class="modal-buttons"><button class="tool-button" data-action="pick-garland">Гирлянду</button><button class="tool-button" data-action="pick-flowers">Цветы</button></div>');break;
      case 'pick-garland':case 'pick-flowers':state.decor=button.dataset.action==='pick-garland'?'garland':'flowers';log('decor_choice',{choice:state.decor});renderTown();save();closeModal();break;
    }
  });
  document.addEventListener('visibilitychange',()=>{
    // Visibility has already changed: settle the preceding visible interval before pausing.
    if(document.hidden&&!$('modal').open&&!checkpointActive&&attempt&&!network.solved){const elapsed=performance.now()-lastClock;attempt.foregroundMs+=elapsed;if(testing)journal.foregroundMs+=elapsed;}
    lastClock=performance.now();log('visibility_change',{hidden:document.hidden});save();saveLog();
    if(document.hidden&&audioContext)audioContext.suspend().catch(()=>{});
  });
  window.addEventListener('pagehide',()=>{tick();save();saveLog();});
  document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=A.icon(el.dataset.icon));
  document.documentElement.dataset.build=BUILD;
  log('session_start',{mode:'resume_test',buildId:BUILD});
  setLevel(state.current,'load');renderSettings();log('game_ready');
  maybeCheckpoint();
  setInterval(()=>{tick();if(testing&&!journal.checkpointOffered&&journal.foregroundMs>=300000)checkpoint('five_minutes');},1000);
  setInterval(()=>{save();if(testing)saveLog();},10000);
  if(new URLSearchParams(location.search).has('test')&&!testing)toolsModal();
})();
