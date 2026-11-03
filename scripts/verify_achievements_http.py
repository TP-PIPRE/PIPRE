"""End-to-end QA of the 35 achievements against local Spring/PostgreSQL.

Creates two uniquely identified test students and removes only those fixtures.
Never changes the server clock, historical unlocks, or production scoring data.
"""
import concurrent.futures
import copy
import http.cookiejar
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('PIPRE_QA_BASE_URL', 'http://localhost:8081/api/v1/').rstrip('/') + '/'
checks = []
fixtures = []


def check(title, condition):
    assert condition, title
    checks.append(title)


class Client:
    def __init__(self):
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def request(self, method, path, body=None, status=200):
        request = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None,
                                         method=method, headers={'Content-Type': 'application/json'})
        try:
            with self.opener.open(request, timeout=30) as response:
                code, raw = response.status, response.read()
        except urllib.error.HTTPError as error:
            code, raw = error.code, error.read()
        assert code == status, f'{method} {path}: expected {status}, got {code}: {raw[:180]!r}'
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return raw.decode()


def q(value):
    return "'" + value.replace("'", "''") + "'"


def sql(query):
    return subprocess.check_output(['docker', 'exec', 'pipre-database', 'psql', '-U', 'pipre_user', '-d', 'pipre_database', '-Atc', query], text=True, encoding='utf-8').strip()


def create_student():
    client, anonymous = Client(), Client()
    email = 'achievements-qa-' + uuid.uuid4().hex[:16] + '@test.invalid'
    password = 'Achievements-QA-2026'
    student_id = anonymous.request('POST', 'users', {'firstName': 'Achievements', 'lastName': 'QA', 'email': email,
            'passwordHash': password, 'age': 18, 'grade': 'QA'}, status=201)
    assert isinstance(student_id, str) and re.fullmatch(r'[A-Za-z0-9-]{1,36}', student_id)
    fixtures.append((student_id, email))
    login = client.request('POST', 'auth/login', {'email': email, 'password': password})
    check('QA student authenticated with its own identity', login['user']['idUser'] == student_id)
    return client, student_id, email, password


def start(client, student_id, game, number, **extra):
    body = {'studentId': student_id, 'clientSessionId': str(uuid.uuid4()), 'game': game,
            'levelTemplate': f'{game}-v2-{number}', **extra}
    result = client.request('POST', 'game-sessions', body)
    check(f'{game} {number}: server start identifies official level', result['game'] == game and result['levelNumber'] == number
          and result['status'] == 'ACTIVE' and result['startedAt'].endswith('Z') and result['revision'] == 0)
    return result, body


def action(client, session_id, sequence, **data):
    result = client.request('POST', f'game-sessions/{session_id}/actions', {'sequence': sequence, **data})
    assert result['revision'] == sequence and not result['state']['lastActionRejected'], 'A construction witness was rejected'
    return result


def solve(client, session, helps=0):
    game, number, session_id = session['game'], session['levelNumber'], session['sessionId']
    file = 'tetrilogicSolutions.json' if game == 'tetrilogic' else 'neonFlowSolutions.json'
    witness = next(w for w in json.loads((ROOT / 'frontend/tests/fixtures' / file).read_text(encoding='utf-8'))
                   if w['templateId'] == f'{game}-v2-{number}')
    sequence = session['revision']
    for _ in range(helps):
        sequence += 1
        action(client, session_id, sequence, type='HELP', source='STATIC')
    for placement in witness['placements']:
        sequence += 1
        if game == 'tetrilogic':
            action(client, session_id, sequence, type='PLACE', pieceId=placement['id'],
                   x=placement['position']['x'], y=placement['position']['y'], rotation=placement['rotation'])
        else:
            action(client, session_id, sequence, type='PLACE', component=placement['type'],
                   x=placement['position']['x'], y=placement['position']['y'],
                   **({'color': placement['color']} if 'color' in placement else {}))
            for rotation in range(90, placement.get('rotation', 0) + 1, 90):
                sequence += 1
                action(client, session_id, sequence, type='ROTATE', x=placement['position']['x'],
                       y=placement['position']['y'], rotation=rotation)
    result = client.request('POST', f'game-sessions/{session_id}/complete')
    check(f'{game} {number}: solution confirmed with server time and stars', result['sessionId'] == session_id
          and result['game'] == game and result['levelNumber'] == number and result['completedAt'].endswith('Z')
          and result['durationMs'] >= 0 and result['stars'] in [1, 2, 3])
    return result


def catalog(client, student_id):
    return client.request('GET', f'profile/{student_id}/achievements')


def unlocked(client, student_id):
    return {row['code'] for row in catalog(client, student_id) if row['unlocked']}


try:
    owner, student, email, password = create_student()
    stranger, other, _, _ = create_student()
    items = catalog(owner, student)
    check('active catalog is exactly L01-L35 and excludes historical codes', [a['code'] for a in items] == [f'L{n:02}' for n in range(1, 36)])
    check('new student has 35 locked achievements with explicit conditions', all(not a['unlocked'] and a['unlockCondition'] and a['icon'] for a in items))
    profile = owner.request('GET', f'profile/{student}')
    check('profile works before playing and without a group membership', profile['xpTotal'] == 0 and profile['totalStars'] == 0)
    check('no fabricated history for a new student', owner.request('GET', f'profile/{student}/history') == [])
    initial = owner.request('GET', f'profile/{student}/game-progress')
    check('all 60 level states are explicit and initially incomplete', len(initial['levels']) == 60 and initial['completedLevels'] == 0)
    Client().request('GET', f'profile/{student}/achievements', status=401)
    stranger.request('GET', f'profile/{student}/achievements', status=403)
    stranger.request('GET', f'profile/{student}/game-progress', status=403)
    stranger.request('GET', f'profile/{student}/achievements/export?from=2026-01-01&to=2026-12-31', status=403)
    stranger.request('GET', f'daily-challenges/today?studentId={student}', status=403)
    check('anonymous and foreign-student reads are rejected', True)

    # Legacy SUCCESS and score endpoints are not evidence for the new achievements.
    owner.request('POST', 'telemetry', {'studentId': student, 'game': 'tetrilogic', 'result': 'SUCCESS',
        'tiempoResolucion': 1, 'movimientos': 1, 'reinicios': 0, 'pistasIa': 0,
        'completedAt': '2026-11-02T12:00:00Z'}, status=201)
    owner.request('POST', 'activity-results', {'idStudent': student, 'idActivity': 'act-c002-30', 'attempts': 1, 'score': 999}, status=201)
    check('client-reported SUCCESS/score cannot unlock achievements or verified progress', not unlocked(owner, student)
          and owner.request('GET', f'profile/{student}/game-progress')['completedLevels'] == 0)

    tetri, request = start(owner, student, 'tetrilogic', 1, activityId='act-c002-1')
    check('retrying start returns the same session', owner.request('POST', 'game-sessions', request)['sessionId'] == tetri['sessionId'])
    changed = {**request, 'levelTemplate': 'tetrilogic-v2-2'}
    owner.request('POST', 'game-sessions', changed, status=400)
    stranger.request('POST', 'game-sessions', {**request, 'clientSessionId': str(uuid.uuid4())}, status=403)
    stranger.request('POST', f"game-sessions/{tetri['sessionId']}/complete", status=403)
    stranger.request('POST', f"game-sessions/{tetri['sessionId']}/actions", {'sequence': 1, 'type': 'HELP'}, status=403)
    check('cannot create or mutate sessions belonging to another student', True)
    owner.request('POST', f"game-sessions/{tetri['sessionId']}/complete", {'result': 'SUCCESS', 'stars': 3,
        'completedAt': '1900-01-01T00:00:00Z', 'durationMs': 0}, status=400)
    check('forged client victory cannot complete an unsolved board', not unlocked(owner, student))
    tetri_result = solve(owner, tetri)
    check('invalid completion probing is recorded and prevents three stars in that attempt', tetri_result['stars'] == 2)
    check('TetriLogic alone does not unlock L01', 'L01' not in unlocked(owner, student))

    neon, _ = start(owner, student, 'neonflow', 1)
    first_help = {'sequence': 1, 'type': 'HELP', 'source': 'STATIC'}
    first_response = owner.request('POST', f"game-sessions/{neon['sessionId']}/actions", first_help)
    check('action retries are exact and idempotent', owner.request('POST', f"game-sessions/{neon['sessionId']}/actions", first_help) == first_response)
    owner.request('POST', f"game-sessions/{neon['sessionId']}/actions", {**first_help, 'type': 'RESET'}, status=400)
    action(owner, neon['sessionId'], 2, type='HELP', source='STATIC')
    action(owner, neon['sessionId'], 3, type='HELP', source='STATIC')
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        responses = list(pool.map(lambda _: owner.request('POST', f"game-sessions/{neon['sessionId']}/complete", {'stars': 3}), range(8)))
    check('concurrent completion retries share the exact confirmed response', all(row == responses[0] for row in responses))
    check('server stars override a forged three-star request', responses[0]['stars'] == 1)
    check('both game victories unlock L01 once', unlocked(owner, student) == {'L01'})
    check('only one unlock and XP ledger row exist', sql(f"SELECT count(*) FROM player_achievements WHERE id_student={q(student)}") == '1'
          and sql(f"SELECT count(*) FROM achievement_xp_ledger WHERE student_id={q(student)}") == '1'
          and owner.request('GET', f'profile/{student}')['xpTotal'] == 100)

    owner.request('POST', 'auth/logout')
    owner.request('POST', 'auth/login', {'email': email, 'password': password})
    check('achievements survive logout and login', unlocked(owner, student) == {'L01'})
    old_period = owner.request('GET', f'profile/{student}/achievements/export?from=1900-01-01&to=1900-01-16')
    check('period export keeps current binary state without counting an earlier/later unlock as new', old_period['unlockedTotal'] == 1
          and old_period['newInPeriod'] == 0 and next(a for a in old_period['achievements'] if a['code'] == 'L01')['binary'] == 1
          and all(a['periodBinary'] == 0 for a in old_period['achievements']))
    owner.request('GET', f'profile/{student}/achievements/export?from=2026-11-02&to=2026-11-01', status=400)

    improved, _ = start(owner, student, 'neonflow', 1)
    check('a cleaner repeat improves best stars', solve(owner, improved)['bestStars'] == 3)
    lower, _ = start(owner, student, 'neonflow', 1)
    lower_result = solve(owner, lower, helps=3)
    check('a lower later grade does not replace best stars or repeat XP', lower_result['stars'] == 1 and lower_result['bestStars'] == 3
          and owner.request('GET', f'profile/{student}')['xpTotal'] == 100)
    improved_tetri, _ = start(owner, student, 'tetrilogic', 1)
    check('TetriLogic grade can also improve to three stars', solve(owner, improved_tetri)['bestStars'] == 3)

    for game in ['neonflow', 'tetrilogic']:
        for number in range(2, 31):
            session, _ = start(owner, student, game, number)
            result = solve(owner, session)
            check(f'{game} {number}: clean solution earns best three stars', result['stars'] == result['bestStars'] == 3)
            if number == 29:
                check(game + ': 29 three-star levels do not grant mastery', ('L35' if game == 'neonflow' else 'L32') not in unlocked(owner, student))
        check(game + ': all 30 three-star levels grant mastery', ('L35' if game == 'neonflow' else 'L32') in unlocked(owner, student))

    progress = owner.request('GET', f'profile/{student}/game-progress')
    check('both official catalogs persist all 60 completions and 180 best stars', progress['completedLevels'] == 60
          and progress['totalStars'] == 180 and all(level['bestStars'] == 3 for level in progress['levels']))
    expected = {f'L{n:02}' for n in range(1, 31)} | {'L32', 'L33', 'L35'}
    check('L01-L30 correspond exactly to paired levels; speed and both masteries unlock', unlocked(owner, student) == expected)
    check('XP is awarded once per achievement, never per repeated victory', owner.request('GET', f'profile/{student}')['xpTotal'] == 3750)

    daily = owner.request('GET', f'daily-challenges/today?studentId={student}')
    today = sql("SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Lima')::date")
    check('daily calendar is controlled by server in America/Lima', daily['date'] == daily['id'] == today and daily['timeZone'] == 'America/Lima')
    for _ in range(2):
        daily_session, _ = start(owner, student, daily['game'], daily['levelNumber'], dailyChallengeId=daily['id'])
        daily_result = solve(owner, daily_session)
        check('daily completion is confirmed with a one-day streak', daily_result['daily']['completed'] and daily_result['daily']['currentStreak'] == 1)
    check('repeating the daily challenge counts only once', sql(f"SELECT count(*) FROM daily_challenge_completions WHERE student_id={q(student)}") == '1')
    owner.request('POST', 'game-sessions', {'studentId': student, 'clientSessionId': str(uuid.uuid4()),
        'game': daily['game'], 'levelTemplate': daily['levelTemplate'], 'dailyChallengeId': '1900-01-01'}, status=400)
    check('arbitrary client dates cannot fabricate a daily streak', not ({'L31', 'L34'} & unlocked(owner, student)))
    history = owner.request('GET', f'profile/{student}/history')
    check('verified history has persisted stars/XP and explicit server instants', any(row['score'] is None and row['stars'] == 3 and row['dateAttempted'].endswith('Z') for row in history))
    check('other student progress remains untouched', stranger.request('GET', f'profile/{other}/game-progress')['completedLevels'] == 0
          and not unlocked(stranger, other))
finally:
    cleanup_errors = []
    for student_id, email in fixtures:
        try:
            assert sql(f'SELECT email FROM users WHERE id_user={q(student_id)}') == email, 'Fixture identity changed; cleanup refused'
            sql(f'DELETE FROM users WHERE id_user={q(student_id)} AND email={q(email)}')
            for table, column in [('game_sessions', 'student_id'), ('verified_game_victories', 'student_id'),
                    ('game_level_progress', 'student_id'), ('daily_challenge_completions', 'student_id'),
                    ('player_achievements', 'id_student'), ('achievement_xp_ledger', 'student_id')]:
                assert sql(f'SELECT count(*) FROM {table} WHERE {column}={q(student_id)}') == '0', 'QA residue in ' + table
            checks.append('only owned QA student and its dependent observations cleaned')
        except Exception as error:
            cleanup_errors.append(str(error))
    assert not cleanup_errors, '; '.join(cleanup_errors)

print(json.dumps({'passed': len(checks), 'checks': checks}, ensure_ascii=False, indent=2))
