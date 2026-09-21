/* Yandex adapter. Local persistence belongs to the UI; save() queues cloud only.
 * onCloud receives lightBlockV2 (null when absent). Merge with LIVE state and call
 * save(merged) inside that listener. No cloud writes precede a successful delivery.
 * onPause(boolean), onStatus(cloudStatus) return unsubscribe functions.
 * All failures are codes, never SDK responses or player identifiers in logs.
 */
(function (global) {
  'use strict';
  const BASE_KEY = 'light-block:release:v2';
  const CLOUD_KEY = 'lightBlockV2';
  const REQUEST_TIMEOUT = 8000;
  const WRITE_INTERVAL = 5000;
  const MAX_BYTES = 200000; // Conservative limit below the documented 200 KB.
  const pauseListeners = new Set(), cloudListeners = new Set(), statusListeners = new Set();
  const pauseReasons = new Set(), ads = new Set();
  let storageSource = null, player = null, initPromise = null;
  let wantedGameplay = false, reportedGameplay = false, readyRequested = false, readySent = false;
  let accountFrozen = false, accountEpoch = 0, reloadRequested = false;
  let pending = null, writeTimer = null, writing = false, writeBlocked = false;
  let readPromise = null, cloudRead = false, cloudDelivered = false, cloudValue = null;
  let deliveryRunning = false, adSequence = 0;

  function listen(listeners, fn, current) {
    if (typeof fn !== 'function') return () => {};
    listeners.add(fn);
    if (arguments.length > 2) safely(fn, current);
    return () => listeners.delete(fn);
  }
  function safely(fn, value) { try { fn(value); } catch (_) { /* UI listener isolation. */ } }
  function status(value, error = '') {
    const changed = api.cloudStatus !== value || api.lastError !== error;
    api.cloudStatus = value;
    api.lastError = error;
    if (changed) statusListeners.forEach(fn => safely(fn, value));
  }
  function bounded(operation, code, delay = REQUEST_TIMEOUT) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(code)), delay);
      Promise.resolve().then(operation).then(
        value => { clearTimeout(timer); resolve(value); },
        () => { clearTimeout(timer); reject(new Error(code)); }
      );
    });
  }
  function language(value) { return /^ru(?:-|$)/i.test(String(value || '')) ? 'ru' : 'en'; }
  function browserLanguage() { return language(global.navigator?.language || 'ru'); }
  function storage() { return storageSource || global.localStorage; }
  // Keep the object stable, and let the UI handle unavailable browser storage.
  const storageWrapper = {
    getItem(key) { return storage().getItem(key); },
    setItem(key, value) { return storage().setItem(key, value); },
    removeItem(key) { return storage().removeItem(key); },
    key(index) { return storage().key(index); },
    get length() { return storage().length; }
  };
  function scopedKey(id) {
    // UTF-16 hex is injective, handles lone surrogates, and contains no delimiters.
    let encoded = '';
    for (let i = 0; i < id.length; i++) encoded += id.charCodeAt(i).toString(16).padStart(4, '0');
    return `${BASE_KEY}:yandex:${encoded}`;
  }
  function snapshot(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid-save');
    const text = JSON.stringify({ [CLOUD_KEY]: value });
    if (new TextEncoder().encode(text).length >= MAX_BYTES) throw new Error('save-too-large');
    const result = JSON.parse(text)[CLOUD_KEY];
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('invalid-save');
    return result;
  }
  function reportGameplay() {
    const effective = Boolean(wantedGameplay && api.active && !api.paused && !accountFrozen);
    if (effective === reportedGameplay || !api.sdk) return;
    try {
      const gameplay = api.sdk.features?.GameplayAPI;
      const method = effective ? gameplay?.start : gameplay?.stop;
      if (typeof method === 'function') method.call(gameplay);
      reportedGameplay = effective;
    } catch (_) { /* A metrics failure must not break playable local state. */ }
  }
  function pause(reason, value) {
    if (value) pauseReasons.add(reason); else pauseReasons.delete(reason);
    const changed = api.paused !== Boolean(pauseReasons.size);
    api.paused = Boolean(pauseReasons.size);
    reportGameplay();
    if (changed) pauseListeners.forEach(fn => safely(fn, api.paused));
  }
  function discardWrites() {
    clearTimeout(writeTimer);
    writeTimer = null;
    pending = null;
    cloudRead = false;
    cloudDelivered = false;
  }
  function freezeAccount() {
    if (accountFrozen) return;
    accountFrozen = true;
    accountEpoch++;
    discardWrites();
    pause('account', true);
    api.active = false;
    status('error', 'account-changing');
  }
  function reloadAccount() {
    freezeAccount();
    if (reloadRequested) return;
    reloadRequested = true;
    try { global.location.reload(); } catch (_) { status('error', 'reload-required'); }
  }
  function subscribeSDK(sdk) {
    if (typeof sdk.on !== 'function') return;
    sdk.on('game_api_pause', () => pause('sdk', true));
    sdk.on('game_api_resume', () => {
      // SDK also sends GameplayAPI.start() automatically. Reassert our effective
      // state, since another pause/menu may have appeared while it was hidden.
      reportedGameplay = null;
      pause('sdk', false);
    });
    sdk.on(sdk.EVENTS?.ACCOUNT_SELECTION_DIALOG_OPENED || 'ACCOUNT_SELECTION_DIALOG_OPENED', freezeAccount);
    sdk.on(sdk.EVENTS?.ACCOUNT_SELECTION_DIALOG_CLOSED || 'ACCOUNT_SELECTION_DIALOG_CLOSED', reloadAccount);
  }
  function loadSDK() {
    if (global.YaGames) return Promise.resolve(global.YaGames);
    return bounded(() => new Promise((resolve, reject) => {
      const script = global.document.createElement('script');
      script.src = '/sdk.js';
      script.async = true;
      script.onload = () => global.YaGames ? resolve(global.YaGames) : reject(new Error('sdk-load'));
      script.onerror = () => reject(new Error('sdk-load'));
      global.document.head.appendChild(script);
    }), 'sdk-load');
  }
  function setPlayer(value) {
    if (!value || typeof value.getUniqueID !== 'function') throw new Error('player-unavailable');
    const id = value.getUniqueID();
    if (typeof id !== 'string' || !id) throw new Error('player-unavailable');
    const key = scopedKey(id);
    if (player && api.saveKey !== key) { reloadAccount(); return false; }
    player = value;
    api.saveKey = key;
    return true;
  }
  function sendReady() {
    if (!readyRequested || readySent || !api.active) return;
    readySent = true;
    try { api.sdk.features?.LoadingAPI?.ready(); } catch (_) { status('error', 'ready-failed'); }
  }
  async function initialize() {
    api.language = browserLanguage();
    const platformBuild = global.document?.documentElement?.dataset?.platform === 'yandex';
    // An already injected SDK is supported for offline mocks. Standalone never loads it.
    if (!platformBuild && !global.YaGames) return api;
    api.saveKey = `${BASE_KEY}:yandex:unavailable`;
    status('pending');
    try {
      const yaGames = await loadSDK();
      const sdk = await bounded(() => yaGames.init(), 'sdk-init');
      if (!sdk || typeof sdk !== 'object') throw new Error('sdk-init');
      api.sdk = sdk;
      api.active = true;
      subscribeSDK(sdk);
      const sdkLanguage = sdk.environment?.i18n?.lang;
      api.language = sdkLanguage ? language(sdkLanguage) : browserLanguage();
      const epoch = accountEpoch;
      const results = await Promise.allSettled([
        bounded(() => typeof sdk.getStorage === 'function' ? sdk.getStorage() : null, 'storage-unavailable', 3000),
        bounded(() => sdk.getPlayer(), 'player-unavailable', 5000)
      ]);
      if (accountFrozen || epoch !== accountEpoch) return api;
      if (results[0].status === 'fulfilled' && results[0].value?.getItem && results[0].value?.setItem) {
        storageSource = results[0].value;
      }
      if (results[1].status === 'fulfilled') {
        setPlayer(results[1].value);
        // A task boundary lets `await init(); onCloud(...)` attach before delivery.
        setTimeout(() => { void readCloud(); }, 0);
      } else status('error', 'player-unavailable');
      sendReady();
      reportGameplay();
    } catch (_) {
      api.active = false;
      api.sdk = null;
      player = null;
      discardWrites();
      pause('sdk', false);
      status('error', 'sdk-unavailable');
    }
    return api;
  }
  async function deliverCloud() {
    if (!cloudRead || cloudDelivered || deliveryRunning || !cloudListeners.size || accountFrozen) return;
    deliveryRunning = true;
    const epoch = accountEpoch;
    try {
      // No stale pre-read snapshot may be uploaded if a consumer does not merge.
      pending = null;
      for (const fn of Array.from(cloudListeners)) await fn(cloudValue === null ? null : snapshot(cloudValue));
      if (accountFrozen || epoch !== accountEpoch) return;
      cloudDelivered = true;
      writeBlocked = false;
      status(pending ? 'pending' : 'synced');
      scheduleWrite();
    } catch (_) {
      if (epoch === accountEpoch) { pending = null; status('error', 'cloud-merge-failed'); }
    } finally { deliveryRunning = false; }
  }
  function readCloud() {
    if (!api.active || !player || accountFrozen) return Promise.resolve(false);
    if (readPromise) return readPromise;
    const epoch = accountEpoch, sourcePlayer = player;
    cloudRead = false;
    cloudDelivered = false;
    clearTimeout(writeTimer);
    writeTimer = null;
    status('pending');
    readPromise = (async () => {
      try {
        const data = await bounded(() => sourcePlayer.getData([CLOUD_KEY]), 'cloud-read-failed');
        if (epoch !== accountEpoch || accountFrozen) return false;
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid-cloud');
        cloudValue = data[CLOUD_KEY] == null ? null : snapshot(data[CLOUD_KEY]);
        cloudRead = true;
        await deliverCloud();
        return cloudDelivered;
      } catch (_) {
        if (epoch === accountEpoch) status('error', 'cloud-read-failed');
        return false;
      } finally { readPromise = null; }
    })();
    return readPromise;
  }
  function scheduleWrite() {
    if (!pending || !api.active || accountFrozen || !cloudRead || !cloudDelivered || writing || writeBlocked || writeTimer !== null) return;
    // Latest-only coalescing; at least five seconds between sequential requests.
    writeTimer = setTimeout(writeCloud, WRITE_INTERVAL);
  }
  function writeCloud() {
    writeTimer = null;
    if (!pending || !player || accountFrozen || !cloudRead || !cloudDelivered || writing || writeBlocked) return;
    const value = pending, sourcePlayer = player, epoch = accountEpoch;
    pending = null;
    writing = true;
    status('pending');
    const timeout = setTimeout(() => {
      if (epoch === accountEpoch) status('error', 'cloud-write-timeout');
      // Keep the single-flight lock: an uncancellable late write must not race a retry.
    }, REQUEST_TIMEOUT);
    Promise.resolve().then(() => {
      if (accountFrozen || epoch !== accountEpoch) return;
      return sourcePlayer.setData({ [CLOUD_KEY]: value }, true);
    }).then(() => {
      if (epoch !== accountEpoch || accountFrozen) return;
      status(pending ? 'pending' : 'synced');
    }, () => {
      if (epoch !== accountEpoch || accountFrozen) return;
      if (!pending) pending = value;
      writeBlocked = true;
      status('error', 'cloud-write-failed');
    }).finally(() => {
      clearTimeout(timeout);
      writing = false;
      if (epoch === accountEpoch) scheduleWrite();
    });
  }
  function showAd(kind) {
    const field = kind === 'rewarded' ? 'rewarded' : 'shown';
    const fail = error => Promise.resolve({ [field]: false, error });
    if (!api.active || accountFrozen) return fail('unavailable');
    if (ads.size) return fail('busy');
    const method = kind === 'rewarded' ? 'showRewardedVideo' : 'showFullscreenAdv';
    if (typeof api.sdk?.adv?.[method] !== 'function') return fail('unavailable');
    return new Promise(resolve => {
      const reason = `ad:${++adSequence}`;
      const record = { opened: false, rewarded: false, settled: false, closed: false };
      ads.add(record);
      pause(reason, true);
      function settle(error, wasShown) {
        if (record.settled) return;
        record.settled = true;
        const result = { [field]: kind === 'rewarded' ? record.rewarded : Boolean(record.opened || wasShown) };
        if (error) result.error = error;
        resolve(result);
      }
      function release() { ads.delete(record); pause(reason, false); }
      const watchdog = setTimeout(() => {
        if (record.opened || record.closed) return;
        settle('timeout', false);
        release();
      }, REQUEST_TIMEOUT);
      const callbacks = {
        onOpen() {
          if (record.closed) return;
          record.opened = true;
          clearTimeout(watchdog);
          // Late opening after pre-open timeout still pauses until an actual close.
          ads.add(record);
          pause(reason, true);
        },
        onRewarded() {
          if (kind !== 'rewarded' || record.closed || record.settled) return;
          record.rewarded = true;
          record.opened = true;
          clearTimeout(watchdog);
        },
        onClose(wasShown) {
          if (record.closed) return;
          record.closed = true;
          clearTimeout(watchdog);
          release();
          settle('', wasShown);
        },
        onError() {
          if (record.closed) return;
          record.closed = true;
          clearTimeout(watchdog);
          release();
          settle('ad-error', false);
        }
      };
      try { api.sdk.adv[method]({ callbacks }); } catch (_) { callbacks.onError(); }
    });
  }
  const api = global.BlockPlatform = {
    language: 'ru', storage: storageWrapper, saveKey: BASE_KEY,
    active: false, paused: false, cloudStatus: 'local', lastError: '', sdk: null,
    init() { if (!initPromise) initPromise = initialize(); return initPromise; },
    onPause(fn) { return listen(pauseListeners, fn, api.paused); },
    onStatus(fn) { return listen(statusListeners, fn, api.cloudStatus); },
    onCloud(fn) {
      const unsubscribe = listen(cloudListeners, fn);
      if (cloudRead && !cloudDelivered) setTimeout(() => { void deliverCloud(); }, 0);
      return unsubscribe;
    },
    save(state) {
      if (!api.active || accountFrozen) return false;
      try { pending = snapshot(state); } catch (_) { status('error', 'invalid-save'); return false; }
      if (!writeBlocked && api.cloudStatus !== 'error') status('pending');
      scheduleWrite();
      return true;
    },
    async retrySync() {
      if (!api.active || accountFrozen || writing) return false;
      if (!player) {
        const epoch = accountEpoch;
        try {
          const value = await bounded(() => api.sdk.getPlayer(), 'player-unavailable', 5000);
          if (accountFrozen || epoch !== accountEpoch || !setPlayer(value)) return false;
        } catch (_) { status('error', 'player-unavailable'); return false; }
      }
      return readCloud();
    },
    ready() { readyRequested = true; sendReady(); },
    gameplay(value) { wantedGameplay = Boolean(value); reportGameplay(); },
    fullscreen() { return showAd('fullscreen'); },
    rewarded() { return showAd('rewarded'); },
    serverNow() {
      try {
        const value = api.active && api.sdk?.serverTime?.();
        if (Number.isFinite(value) && value > 0) return value;
      } catch (_) { /* Offline fallback is deliberately not trusted server time. */ }
      return Date.now();
    }
  };
  global.document?.addEventListener?.('visibilitychange', () => pause('hidden', Boolean(global.document.hidden)));
  global.addEventListener?.('blur', () => pause('blur', true));
  global.addEventListener?.('focus', () => pause('blur', false));
  if (global.document?.hidden) pause('hidden', true);
})(window);
