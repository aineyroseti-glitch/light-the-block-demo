/* Pure circuit rules. No DOM, storage, network or platform dependencies. */
(function (root) {
  'use strict';
  const directions = [1, 2, 4, 8]; // N E S W
  const delta = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const rotate = (mask, turns = 1) => {
    turns = ((turns % 4) + 4) % 4;
    return ((mask << turns) | (mask >> (4 - turns))) & 15;
  };
  const groupsAt = (tile, turns) => tile.groups.map(mask => rotate(mask, turns));
  function inspect(level, rotations) {
    const groups = level.tiles.map((tile, i) => groupsAt(tile, rotations[i] || 0));
    const live = groups.map(list => list.map(() => false));
    const distance = groups.map(list => list.map(() => Infinity));
    const queue = [];
    level.tiles.forEach((tile, i) => {
      if (tile.kind === 'source') groups[i].forEach((_, g) => { live[i][g] = true; distance[i][g] = 0; queue.push([i, g]); });
    });
    for (let q = 0; q < queue.length; q++) {
      const [i, g] = queue[q];
      for (let d = 0; d < 4; d++) {
        if (!(groups[i][g] & directions[d])) continue;
        const row = Math.floor(i / level.size) + delta[d][0];
        const col = i % level.size + delta[d][1];
        if (row < 0 || col < 0 || row >= level.size || col >= level.size) continue;
        const j = row * level.size + col;
        groups[j].forEach((mask, h) => {
          if ((mask & directions[(d + 2) % 4]) && !live[j][h]) {
            live[j][h] = true;
            distance[j][h] = distance[i][g] + 1;
            queue.push([j, h]);
          }
        });
      }
    }
    const homes = level.tiles.map((tile, i) => tile.kind === 'home' ? i : -1).filter(i => i >= 0);
    const powered = homes.filter(i => live[i].some(Boolean));
    return { groups, live, distance, homes, powered, solved: homes.length > 0 && homes.length === powered.length };
  }
  function expand(points) {
    const result = [points[0]];
    for (let p = 1; p < points.length; p++) {
      let [r, c] = result[result.length - 1];
      const [nr, nc] = points[p];
      if (r !== nr && c !== nc) throw new Error('Route must be orthogonal');
      while (r !== nr || c !== nc) {
        r += Math.sign(nr - r); c += Math.sign(nc - c);
        result.push([r, c]);
      }
    }
    return result;
  }
  function build(spec) {
    const n = spec.size;
    const tiles = Array.from({ length: n * n }, () => ({ kind: 'garden', groups: [], fixed: true }));
    const index = ([r, c]) => {
      if (r < 0 || c < 0 || r >= n || c >= n) throw new Error('Route outside grid');
      return r * n + c;
    };
    const routes = spec.routes.map(expand);
    const source = index(routes[0][0]);
    const homes = new Set(routes.map(route => index(route[route.length - 1])));
    for (const route of routes) {
      for (let p = 0; p < route.length - 1; p++) {
        const a = index(route[p]), b = index(route[p + 1]);
        const dr = route[p + 1][0] - route[p][0], dc = route[p + 1][1] - route[p][1];
        const d = delta.findIndex(([r, c]) => dr === r && dc === c);
        tiles[a].groups[0] = (tiles[a].groups[0] || 0) | directions[d];
        tiles[b].groups[0] = (tiles[b].groups[0] || 0) | directions[(d + 2) % 4];
      }
    }
    const locked = new Set((spec.locked || []).map(index));
    tiles.forEach((tile, i) => {
      if (tile.groups.length) {
        tile.kind = i === source ? 'source' : homes.has(i) ? 'home' : 'wire';
        tile.fixed = tile.kind !== 'wire' || locked.has(i);
      }
    });
    for (const entry of spec.duals || []) {
      const tile = tiles[index(entry.at)];
      if (tile.kind !== 'wire') throw new Error('Dual must be a wire tile');
      tile.groups = entry.groups || [3, 12];
    }
    const initial = tiles.map(() => 0);
    for (const [r, c, turns] of spec.scramble || []) initial[index([r, c])] = turns;
    const level = { ...spec, tiles, initial, solution: tiles.map(() => 0), version: Number.isSafeInteger(spec.version) && spec.version > 0 ? spec.version : 1 };
    if (!inspect(level, level.solution).solved) throw new Error('Invalid reference solution: ' + spec.id);
    if (inspect(level, initial).solved) {
      const target = tiles.findIndex(tile => !tile.fixed);
      initial[target] = (initial[target] + 1) % 4;
      if (inspect(level, initial).solved) throw new Error('Already solved level: ' + spec.id);
    }
    return level;
  }
  function fresh(level) {
    return { version: level.version, rotations: [...level.initial], moves: 0, history: [], hinted: false };
  }
  function validateAttempt(level, value) {
    if (!value || value.version !== level.version || !Array.isArray(value.rotations) || value.rotations.length !== level.tiles.length) return null;
    if (!value.rotations.every((r, i) => Number.isInteger(r) && r >= 0 && r < 4 && (!level.tiles[i].fixed || r === 0))) return null;
    const history = Array.isArray(value.history) ? value.history.filter(i => Number.isInteger(i) && i >= 0 && i < level.tiles.length && !level.tiles[i].fixed).slice(-300) : [];
    return { version: level.version, rotations: [...value.rotations], moves: Number.isSafeInteger(value.moves) && value.moves >= 0 ? value.moves : 0, history, hinted: value.hinted === true };
  }
  function turn(level, attempt, i) {
    if (!level.tiles[i] || level.tiles[i].fixed || inspect(level, attempt.rotations).solved) return false;
    attempt.rotations[i] = (attempt.rotations[i] + 1) % 4;
    attempt.history.push(i);
    if (attempt.history.length > 300) attempt.history.shift();
    attempt.moves++;
    return true;
  }
  function undo(attempt) {
    const i = attempt.history.pop();
    if (i === undefined) return false;
    attempt.rotations[i] = (attempt.rotations[i] + 3) % 4;
    attempt.moves = Math.max(0, attempt.moves - 1);
    return true;
  }
  root.BlockEngine = Object.freeze({ rotate, groupsAt, inspect, build, fresh, validateAttempt, turn, undo });
})(globalThis);
