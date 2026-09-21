/* Pure save validation and merging. Storage and SDK access belong to the caller. */
(function (root) {
  'use strict';
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const timestamp = value => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER ? Math.floor(value) : 0;
  const count = (value, fallback = 0) => Number.isSafeInteger(value) && value >= 0 ? value : fallback;
  const decor = value => value === 'flowers' ? 'flowers' : 'garland';
  const campaign = () => Array.isArray(root.BlockLevels) ? root.BlockLevels : [];
  const dailies = () => Array.isArray(root.BlockDailies) ? root.BlockDailies : [];

  function fresh() {
    return {
      version: 2, current: 1, completed: [], attempts: {}, sound: false,
      reducedMotion: false, language: 'auto', decor: ['garland', 'garland', 'garland'],
      decorUnlocked: [false, false, false], hints: {},
      daily: { attempts: {}, completed: [] }, updatedAt: 0, settingsAt: 0, currentAt: 0
    };
  }

  function completed(value, levels) {
    const ids = new Set(levels.map(level => level.id));
    return [...new Set((Array.isArray(value) ? value : []).filter(id => Number.isSafeInteger(id) && ids.has(id)))].sort((a, b) => a - b);
  }

  function unlocked(state) {
    const levels = campaign();
    const ids = new Set(levels.map(level => level.id));
    const done = new Set(completed(record(state) ? state.completed : [], levels));
    let id = 1;
    while (done.has(id) && ids.has(id + 1)) id++;
    return id;
  }

  function current(value, state) {
    const limit = unlocked(state);
    return Number.isSafeInteger(value) ? Math.max(1, Math.min(limit, value)) : limit;
  }

  function attempts(value, levels) {
    const result = {};
    if (!record(value)) return result;
    for (const level of levels) {
      if (!own(value, level.id)) continue;
      const previous = value[level.id];
      if (!record(previous)) continue;
      // Array#every in the engine intentionally handles normal JSON arrays;
      // also reject sparse arrays supplied directly to this public pure API.
      if (!Array.isArray(previous.rotations) || previous.rotations.length !== level.tiles.length || !Array.from(previous.rotations).every(Number.isInteger)) continue;
      const valid = root.BlockEngine.validateAttempt(level, previous);
      if (!valid) continue;
      valid.updatedAt = timestamp(previous.updatedAt);
      valid.foregroundMs = Number.isFinite(previous.foregroundMs) && previous.foregroundMs >= 0 && previous.foregroundMs <= Number.MAX_SAFE_INTEGER ? previous.foregroundMs : 0;
      // Preserve the optional counters from 0.2.0 without copying arbitrary data.
      if (own(previous, 'turns')) valid.turns = count(previous.turns, valid.moves);
      if (own(previous, 'undos')) valid.undos = count(previous.undos);
      if (own(previous, 'number')) valid.number = Math.max(1, count(previous.number, 1));
      if (own(previous, 'reported')) valid.reported = previous.reported === true;
      result[level.id] = valid;
    }
    return result;
  }

  function clean(raw) {
    const result = fresh();
    if (!record(raw) || (raw.version !== 1 && raw.version !== 2)) return result;
    const legacy = raw.version === 1;
    const levels = campaign();
    // A v1 save can only refer to the fifteen original layouts.
    const known = legacy ? levels.filter(level => level.id <= 15) : levels;
    result.completed = completed(raw.completed, known);
    result.attempts = attempts(raw.attempts, known);
    result.current = current(raw.current, result);
    result.sound = raw.sound === true;
    result.reducedMotion = raw.reducedMotion === true;
    result.language = ['auto', 'ru', 'en'].includes(raw.language) ? raw.language : 'auto';
    result.updatedAt = timestamp(raw.updatedAt);
    // v1 predates these clocks, but its saved choices must outrank untouched v2
    // defaults (zero) after export/import or the first cloud merge.
    result.settingsAt = Math.max(legacy ? 1 : 0, timestamp(raw.settingsAt));
    result.currentAt = Math.max(legacy ? 1 : 0, timestamp(raw.currentAt));
    const choices = !legacy && Array.isArray(raw.decor) ? raw.decor : [legacy ? raw.decor : null];
    result.decor = result.decor.map((_, i) => decor(choices[i]));
    const flags = !legacy && Array.isArray(raw.decorUnlocked) ? raw.decorUnlocked : [];
    const done = new Set(result.completed);
    result.decorUnlocked = result.decorUnlocked.map((_, district) => flags[district] === true || Array.from({ length: 20 }, (__, i) => district * 20 + i + 1).every(id => done.has(id)));
    if (legacy && Array.from({ length: 12 }, (_, i) => i + 1).every(id => done.has(id))) result.decorUnlocked[0] = true;
    if (!legacy) {
      const daily = record(raw.daily) ? raw.daily : {};
      result.daily.attempts = attempts(daily.attempts, dailies());
      result.daily.completed = completed(daily.completed, dailies());
    }
    for (const level of [...levels, ...dailies()]) {
      if (!legacy && record(raw.hints) && own(raw.hints, level.id) && raw.hints[level.id] === true) result.hints[level.id] = true;
      if (legacy && level.id <= 15 && record(raw.attempts) && own(raw.attempts, level.id) && record(raw.attempts[level.id]) && raw.attempts[level.id].hinted === true) result.hints[level.id] = true;
    }
    return result;
  }

  function mergeAttempts(local, remote) {
    const result = {};
    for (const id of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      const a = local[id], b = remote[id];
      result[id] = !a || (b && b.updatedAt > a.updatedAt) ? b : a;
    }
    return result;
  }

  function merge(local, remote) {
    const a = clean(local), b = clean(remote);
    const result = fresh();
    result.completed = [...new Set([...a.completed, ...b.completed])].sort((x, y) => x - y);
    result.attempts = mergeAttempts(a.attempts, b.attempts);
    result.hints = { ...a.hints, ...b.hints };
    result.decorUnlocked = a.decorUnlocked.map((flag, i) => flag || b.decorUnlocked[i]);
    result.daily.completed = [...new Set([...a.daily.completed, ...b.daily.completed])].sort((x, y) => x - y);
    result.daily.attempts = mergeAttempts(a.daily.attempts, b.daily.attempts);
    const settings = b.settingsAt > a.settingsAt ? b : a;
    result.sound = settings.sound;
    result.reducedMotion = settings.reducedMotion;
    result.language = settings.language;
    result.decor = [...settings.decor];
    result.settingsAt = settings.settingsAt;
    const selection = b.currentAt > a.currentAt ? b : a;
    result.current = current(selection.current, result);
    result.currentAt = selection.currentAt;
    result.updatedAt = Math.max(a.updatedAt, b.updatedAt);
    // Revalidate after union so completing a district across devices unlocks it.
    return clean(result);
  }

  function stampAttempt(attempt, now) {
    const previous = record(attempt) ? attempt : {};
    const result = { ...previous };
    if (Array.isArray(previous.rotations)) result.rotations = [...previous.rotations];
    if (Array.isArray(previous.history)) result.history = [...previous.history];
    const old = timestamp(previous.updatedAt);
    // Keep successive mutations ordered even within one millisecond or after a clock correction.
    result.updatedAt = Math.max(timestamp(now), Math.min(Number.MAX_SAFE_INTEGER, old + 1));
    return result;
  }

  root.BlockStore = Object.freeze({ fresh, clean, merge, unlocked, stampAttempt });
})(globalThis);
