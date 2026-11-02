"""Real PostgreSQL migration/constraint checks in a disposable isolated database.

Never opens the application database. Historical fixtures are test data only.
Run after reviewing V18/V19 and before applying them to an existing installation.
"""
import json
from verify_tetrilogic_postgres import Verification, MIGRATIONS


class AchievementsVerification(Verification):
    def sql(self, database, text, expected_failure=False):
        return super().sql(database, text.replace('${telemetry_fk_validation}', 'NOT VALID'), expected_failure)


v = AchievementsVerification()


def apply(database, version, expected_failure=False):
    migration = next(MIGRATIONS.glob(f'V{version}__*.sql'))
    return v.sql(database, migration.read_text(encoding='utf-8'), expected_failure)


def historical_fixture(database):
    v.sql(database, """
      INSERT INTO users(id_user,first_name,last_name,email,password_hash)
      VALUES('qa-history-student','QA','History','qa-history@test.invalid','not-a-login');
      INSERT INTO groups(id_group,group_name) VALUES('qa-group-a','QA A'),('qa-group-b','QA B');
      INSERT INTO group_students(id_ranking,id_group,id_student,total_points,position,xp_total,level)
      VALUES('qa-rank-a','qa-group-a','qa-history-student',73,1,120,2),
            ('qa-rank-b','qa-group-b','qa-history-student',51,2,90,1);
      INSERT INTO player_achievements(id_player_achievement,id_student,id_achievement,unlocked_at)
      VALUES('qa-old-unlock','qa-history-student','ach-001','2025-04-01 12:30:00');
    """)


try:
    v.start()
    v.database('ach_fresh', through=19)
    v.equal('ach_fresh', 'SELECT count(*) FROM achievements WHERE active', 35, 'fresh: exactly 35 active achievements')
    v.equal('ach_fresh', 'SELECT count(*) FROM achievements WHERE NOT active', 10, 'fresh: 10 historical achievements retained inactive')
    expected_codes = ','.join(f'L{n:02}' for n in range(1, 36))
    v.equal('ach_fresh', "SELECT string_agg(code,',' ORDER BY code) FROM achievements WHERE active", expected_codes, 'active codes are exactly L01 through L35')
    v.equal('ach_fresh', "SELECT count(*) FROM achievements WHERE active AND (unlock_condition IS NULL OR unlock_condition='' OR icon IS NULL)", 0, 'active catalog has unlock conditions and icons')
    v.equal('ach_fresh', 'SELECT count(*) FROM player_achievements', 0, 'fresh migration does not fabricate unlocks')
    v.equal('ach_fresh', 'SELECT count(*) FROM game_level_progress', 0, 'fresh migration does not fabricate progress')
    v.equal('ach_fresh', 'SELECT count(*) FROM activities', 60, 'official playable catalog remains 60')

    v.database('ach_existing', through=17)
    historical_fixture('ach_existing')
    before_unlock = v.sql('ach_existing', "SELECT to_jsonb(p)::text FROM player_achievements p WHERE id_player_achievement='qa-old-unlock'")
    before_groups = v.sql('ach_existing', "SELECT jsonb_agg(to_jsonb(g) ORDER BY id_ranking)::text FROM group_students g")
    before_catalog = v.sql('ach_existing', "SELECT jsonb_agg(to_jsonb(a) ORDER BY id_achievement)::text FROM achievements a")
    apply('ach_existing', 18)
    apply('ach_existing', 19)
    v.equal('ach_existing', "SELECT (to_jsonb(p)-'unlocked_at_verified')::text FROM player_achievements p WHERE id_player_achievement='qa-old-unlock'", before_unlock, 'historical unlock identity and timestamp unchanged')
    v.equal('ach_existing', "SELECT jsonb_agg(to_jsonb(g) ORDER BY id_ranking)::text FROM group_students g", before_groups, 'group membership, ranking points and historical XP unchanged')
    v.equal('ach_existing', "SELECT jsonb_agg(to_jsonb(a)-ARRAY['active','unlock_condition'] ORDER BY id_achievement)::text FROM achievements a WHERE NOT active", before_catalog, 'original catalog content retained without new meaning')
    v.equal('ach_existing', "SELECT legacy_xp FROM gamification_accounts WHERE student_id='qa-history-student'", 120, 'multiple memberships preserve MAX historical XP rather than double-counting')
    v.equal('ach_existing', "SELECT earned_xp FROM gamification_accounts WHERE student_id='qa-history-student'", 0, 'migration grants no new XP')
    v.equal('ach_existing', 'SELECT count(*) FROM player_achievements p JOIN achievements a USING(id_achievement) WHERE a.active', 0, 'historical unlock does not count among the new 35')
    v.equal('ach_existing', "SELECT count(*) FROM player_achievements WHERE unlocked_at_verified IS NOT NULL", 0, 'no invented verified timestamp for legacy unlocks')
    v.equal('ach_existing', 'SELECT count(*) FROM game_level_progress', 0, 'historical scores are not backfilled as verified progress')

    v.sql('ach_existing', """
      INSERT INTO game_level_progress(student_id,game,level_number,best_stars,first_completed_at,last_completed_at)
      VALUES('qa-history-student','tetrilogic',1,2,'2026-11-02T12:00:00Z','2026-11-02T12:00:00Z');
    """)
    v.sql('ach_existing', "INSERT INTO game_level_progress SELECT * FROM game_level_progress", expected_failure=True)
    v.checks.append('database rejects duplicate progress for student/game/level')
    for column, invalid in [('level_number', '31'), ('best_stars', '4'), ('game', "'unrecognized'")]:
        v.sql('ach_existing', f'UPDATE game_level_progress SET {column}={invalid}', expected_failure=True)
        v.checks.append('database rejects invalid progress '+column)

    v.sql('ach_existing', """
      INSERT INTO game_sessions(session_id,client_session_id,student_id,active_student_id,game,level_number,level_template,started_at,status,state)
      VALUES('qa-session','qa-client','qa-history-student','qa-history-student','neonflow',1,'neonflow-v2-1','2026-11-02T12:00:00Z','ACTIVE','{}');
    """)
    v.sql('ach_existing', """
      INSERT INTO game_sessions(session_id,client_session_id,student_id,active_student_id,game,level_number,level_template,started_at,status,state)
      VALUES('qa-session-other','qa-client-other','qa-history-student','qa-history-student','tetrilogic',1,'tetrilogic-v2-1','2026-11-02T12:00:01Z','ACTIVE','{}');
    """, expected_failure=True)
    v.checks.append('database prevents two active sessions for one student')
    v.sql('ach_existing', """
      INSERT INTO daily_challenges(local_date,game,level_number,level_template)
      VALUES('2026-11-02','neonflow',1,'neonflow-v2-1');
      INSERT INTO daily_challenge_completions(student_id,local_date,session_id,completed_at)
      VALUES('qa-history-student','2026-11-02','qa-session','2026-11-02T12:01:00Z');
    """)
    v.sql('ach_existing', 'INSERT INTO daily_challenge_completions SELECT * FROM daily_challenge_completions', expected_failure=True)
    v.checks.append('one daily completion per student and local date')
    v.sql('ach_existing', "INSERT INTO player_achievements SELECT id_player_achievement||'-copy',id_student,id_achievement,unlocked_at,unlocked_at_verified FROM player_achievements", expected_failure=True)
    v.checks.append('database prevents repeated unlock of the same achievement')
    v.sql('ach_existing', "DELETE FROM users WHERE id_user='qa-history-student'")
    for table in ['game_sessions', 'game_level_progress', 'daily_challenge_completions', 'player_achievements', 'gamification_accounts']:
        v.equal('ach_existing', f'SELECT count(*) FROM {table}', 0, 'student deletion respects FK lifecycle: '+table)

    v.database('ach_collision', through=17)
    v.sql('ach_collision', "INSERT INTO achievements(id_achievement,code,name) VALUES('qa-custom-code','L01','Custom prior achievement')")
    apply('ach_collision', 18, expected_failure=True)
    v.equal('ach_collision', "SELECT count(*) FROM information_schema.columns WHERE table_name='achievements' AND column_name='active'", 0, 'conflicting stable code rolls back the whole migration')
    v.equal('ach_collision', "SELECT name FROM achievements WHERE id_achievement='qa-custom-code'", 'Custom prior achievement', 'collision never reinterprets a custom historical achievement')
    print(json.dumps({'passed': len(v.checks), 'checks': v.checks}, ensure_ascii=False, indent=2))
finally:
    v.close()
