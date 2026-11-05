// Local QA only. Creates a temporary student, verifies both daily simulators,
// and removes exactly that fixture in finally. Never changes the server clock.
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const base = process.env.PIPRE_QA_BASE_URL ?? 'http://localhost:8081/api/v1/';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Only local QA is allowed');
const email = `daily-docker-${randomUUID()}@test.invalid`;
const password = randomUUID();
const checks = [];
let studentId, cookie;
function check(name, ok) { if (!ok) throw Error(name); checks.push(name); }
function sql(query) {
  return execFileSync('docker', ['exec', '-i', 'pipre-database', 'sh', '-c', 'exec psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -At'], { input: query, encoding: 'utf8' }).trim();
}
async function request(method, path, body, status = 200, authenticated = true) {
  const response = await fetch(new URL(path, base), { method, headers: { 'Content-Type': 'application/json', ...(authenticated && cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  if (response.status !== status) throw Error(`${method} ${path.split('?')[0]}: expected ${status}, got ${response.status}: ${(await response.text()).slice(0,180)}`);
  const raw = await response.text();
  let data; try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  return { data, headers: response.headers };
}
try {
  await request('GET', 'daily-challenges/today/set?studentId=not-authenticated', undefined, 401, false);
  checks.push('Unauthenticated daily access rejected');
  const created = await request('POST', 'users', { firstName: 'Daily', lastName: 'Docker QA', email, passwordHash: password, age: 18, grade: 'QA' }, 201, false);
  studentId = created.data;
  check('Temporary QA identity created', typeof studentId === 'string' && /^[a-f0-9-]{36}$/i.test(studentId));
  const login = await request('POST', 'auth/login', { email, password }, 200, false);
  cookie = login.headers.getSetCookie().map(c => c.split(';')[0]).find(c => c.startsWith('jwt='));
  check('QA login uses HttpOnly JWT cookie', cookie && login.data.user.idUser === studentId);
  const path = `daily-challenges/today/set?studentId=${studentId}`;
  const responses = await Promise.all(Array.from({ length: 8 }, () => request('GET', path)));
  const daily = responses[0].data;
  check('Exactly five persisted challenges', daily.challenges.length === 5);
  check('Both simulators represented', new Set(daily.challenges.map(c => c.game)).size === 2);
  check('Concurrent requests reuse the entire same set', responses.every(r => JSON.stringify(r.data) === JSON.stringify(daily)));
  check('Five unique daily IDs', new Set(daily.challenges.map(c => c.id)).size === 5);
  check('Daily starts pending at zero percent', daily.status === 'PENDING' && daily.completedCount === 0 && daily.progressPercent === 0 && !daily.completed);
  const future = daily.challenges[1];
  await request('POST', 'game-sessions', { studentId, clientSessionId: randomUUID(), game: future.game, levelTemplate: future.levelTemplate, dailyChallengeId: future.id }, 400);
  checks.push('Future exercise cannot be started before its predecessor');
  check('Server uses America/Lima', daily.timeZone === 'America/Lima' && new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }) === daily.date);
  check('PostgreSQL contains exactly five rows for fixture', sql(`SELECT count(*) FROM procedural_daily_challenges WHERE student_id='${studentId}';`) === '5');
  await request('GET', 'daily-challenges/today/set?studentId=another-student', undefined, 403);
  checks.push('Another student daily access rejected');
  const before = (await request('GET', `profile/${studentId}/game-progress`)).data;
  for (const c of daily.challenges) {
    check(`${c.game} slot ${c.slot}: snapshot matches provenance`, c.config.templateId === c.levelTemplate && c.config.level === c.levelNumber);
    check(`${c.game} slot ${c.slot}: no solution disclosed`, !('witness' in c) && !('solution' in c.config));
    const catalog = JSON.parse(await fs.readFile(new URL(`../backend/src/main/resources/catalog/${c.game}-v2.json`, import.meta.url), 'utf8'));
    const original = catalog.find(t => t.templateId === c.levelTemplate);
    const witness = JSON.parse(await fs.readFile(new URL(`../backend/src/main/resources/catalog/${c.game}-daily-witnesses.json`, import.meta.url), 'utf8')).find(w => w.templateId === c.levelTemplate);
    const dx = c.game === 'neonflow' ? c.config.emitter.position.x - original.emitter.position.x : c.config.constraints.find(t => t.orientation === 'column').line - original.constraints.find(t => t.orientation === 'column').line;
    const dy = c.game === 'neonflow' ? c.config.emitter.position.y - original.emitter.position.y : c.config.constraints.find(t => t.orientation === 'row').line - original.constraints.find(t => t.orientation === 'row').line;
    check(`${c.game} slot ${c.slot}: generated geometry differs from base`, dx >= 1 && dy >= 1);
    const body = { studentId, clientSessionId: randomUUID(), game: c.game, levelTemplate: c.levelTemplate, dailyChallengeId: c.id };
    const started = (await request('POST', 'game-sessions', body)).data;
    check(`${c.game} slot ${c.slot}: in-progress state persists`, (await request('GET', path)).data.challenges[c.slot - 1].status === 'IN_PROGRESS');
    check(`${c.game} slot ${c.slot}: start retry is idempotent`, JSON.stringify((await request('POST', 'game-sessions', body)).data) === JSON.stringify(started));
    if (witness.placements.length) { await request('POST', `game-sessions/${started.sessionId}/complete`, undefined, 400); checks.push(`${c.game} slot ${c.slot}: incomplete board rejected`); }
    let sequence = 0;
    for (const p of witness.placements) {
      const action = { sequence: ++sequence, type: 'PLACE', x: p.position.x + dx, y: p.position.y + dy, rotation: p.rotation ?? 0, ...(c.game === 'tetrilogic' ? { pieceId: p.id } : { component: p.type, ...(p.color ? { color: p.color } : {}) }) };
      const state = (await request('POST', `game-sessions/${started.sessionId}/actions`, action)).data;
      check(`${c.game} slot ${c.slot}: legal action ${sequence}`, state.revision === sequence && !state.state.lastActionRejected);
    }
    const win = (await request('POST', `game-sessions/${started.sessionId}/complete`)).data;
    check(`${c.game} slot ${c.slot}: server verified victory`, win.stars >= 1 && win.stars <= 3);
    check(`${c.game} slot ${c.slot}: completion retry is idempotent`, JSON.stringify((await request('POST', `game-sessions/${started.sessionId}/complete`)).data) === JSON.stringify(win));
    const summary = (await request('GET', path)).data;
    check(`Slot ${c.slot}: exact aggregate progress`, summary.completedCount === c.slot && summary.progressPercent === c.slot * 20 && summary.completed === (c.slot === 5));
    check(`Slot ${c.slot}: receipt credits daily only at five`, win.daily.completed === (c.slot === 5));
    check(`Slot ${c.slot}: streak date not credited early`, sql(`SELECT count(*) FROM daily_challenge_completions WHERE student_id='${studentId}';`) === (c.slot === 5 ? '1' : '0'));
    if (c.slot === 2) {
      await request('POST', 'auth/logout'); cookie = undefined;
      await request('GET', path, undefined, 401);
      const resumedLogin = await request('POST', 'auth/login', { email, password }, 200, false);
      cookie = resumedLogin.headers.getSetCookie().map(value => value.split(';')[0]).find(value => value.startsWith('jwt='));
      const resumed = (await request('GET', path)).data;
      check('Partial progress survives logout and new login', resumed.completedCount === 2 && resumed.progressPercent === 40 && !resumed.completed && resumed.challenges.every((value, i) => value.id === daily.challenges[i].id));
    }
    if (c.slot === 5) {
      const duplicates = await Promise.all(Array.from({ length: 4 }, () => request('POST', `game-sessions/${started.sessionId}/complete`)));
      check('Concurrent fifth completion returns the same receipt', duplicates.every(result => JSON.stringify(result.data) === JSON.stringify(win)));
    }
  }
  const refreshed = (await request('GET', path)).data;
  check('Reload preserves all five IDs and snapshots', daily.challenges.every((c, i) => c.id === refreshed.challenges[i].id && JSON.stringify(c.config) === JSON.stringify(refreshed.challenges[i].config)));
  check('All five completions and stars persisted', refreshed.challenges.every(c => c.completedAt && c.bestStars >= 1));
  check('Exactly one streak date after five victories', sql(`SELECT count(*) FROM daily_challenge_completions WHERE student_id='${studentId}';`) === '1');
  const after = (await request('GET', `profile/${studentId}/game-progress`)).data;
  check('Procedural victories do not award official progress', before.completedLevels === after.completedLevels && before.totalStars === after.totalStars);
  check('Database has V21 applied successfully', sql('SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1;') === '21');
} finally {
  // Match both generated identity and unique QA email; never use broad fixture cleanup.
  if (studentId && /^[a-f0-9-]{36}$/i.test(studentId)) {
    sql(`DELETE FROM users WHERE id_user='${studentId}' AND email='${email}';`);
    check('Only own temporary QA identity removed', sql(`SELECT count(*) FROM users WHERE id_user='${studentId}';`) === '0');
  }
  await fs.writeFile(new URL('../backend/target/daily-docker-http.json', import.meta.url), JSON.stringify({ base, checks, count: checks.length }, null, 2));
}
console.log(JSON.stringify({ checks: checks.length, result: 'passed', simulators: ['neonflow', 'tetrilogic'] }));
