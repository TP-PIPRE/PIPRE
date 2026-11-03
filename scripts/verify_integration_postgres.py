"""Real PostgreSQL checks in a disposable isolated container. Never opens the application DB."""
import json
from pathlib import Path
from verify_tetrilogic_postgres import Verification, MIGRATIONS

class IntegrationVerification(Verification):
    def sql(self,database,text,expected_failure=False):
        return super().sql(database,text.replace('${telemetry_fk_validation}','NOT VALID'),expected_failure)

v=IntegrationVerification()
def apply(db,version):
    file=next(MIGRATIONS.glob(f'V{version}__*.sql'))
    v.sql(db,file.read_text(encoding='utf-8'))

try:
    v.start()
    v.database('fresh',through=17)
    for table in ['neonflow_templates','tetrilogic_templates']:
        v.equal('fresh',f'SELECT count(*) FROM {table}',30,f'fresh {table}: 30')
    v.equal('fresh','SELECT count(*) FROM activities',60,'fresh: 60 official activities, no duplicate prototypes')
    v.equal('fresh','SELECT count(*) FROM activity_missions',60,'fresh: 60 missions')
    v.equal('fresh','SELECT count(*) FROM activity_results',0,'fresh: no fabricated grades')
    v.equal('fresh','SELECT count(*) FROM simulations',0,'fresh: no fabricated simulations')
    apply('fresh',16)
    v.equal('fresh','SELECT count(*) FROM activities',60,'V16 repeat is idempotent')
    v.database('existing',through=15)
    v.sql('existing',"""
      INSERT INTO courses(id_course,name) VALUES('c001','Edited Neon course');
      INSERT INTO modules(id_module,id_course,title) VALUES('mod-c001-l1','c001','Original module');
      INSERT INTO lessons(id_lesson,id_module,title) VALUES('les-c001-l1','mod-c001-l1','Original lesson');
      INSERT INTO users(id_user,first_name,last_name,email,password_hash) VALUES('test-student','Test','Student','integration@test.invalid','not-a-login');
      INSERT INTO activities(id_activity,id_lesson,name,environment,level_template,description,display_order) VALUES
        ('act-c001-1','les-c001-l1','Teacher edited title','neonflow','neonflow-1','Custom teacher instructions',77),
        ('act-c001-2','les-c001-l1','Previous level 2','neonflow','neonflow-2',NULL,2),
        ('act-c001-3','les-c001-l1','Source branch custom edit','neonflow','neonflow-3','Source instructions',3);
      INSERT INTO activity_missions(id_mission,id_activity,title,objective,max_blocks) VALUES('teacher-mission','act-c001-1','Teacher mission','Keep intact',5);
      INSERT INTO simulations(id_simulation,id_student,id_activity,result) VALUES('historical-sim','test-student','act-c001-1','SUCCESS');
      INSERT INTO activity_results(id_result,id_student,id_activity,score) VALUES('historical-result','test-student','act-c001-1',73);
      INSERT INTO telemetry_attempts(id_attempt,id_student,game,result) VALUES('historical-orphan','missing-legacy-user','neonflow','SUCCESS');
    """)
    before=v.sql('existing',"SELECT row_to_json(a)::text FROM activities a WHERE id_activity='act-c001-1'")
    apply('existing',16);apply('existing',17)
    v.equal('existing',"SELECT row_to_json(a)::text FROM activities a WHERE id_activity='act-c001-1'",before,'teacher metadata preserved byte-for-byte')
    v.equal('existing',"SELECT level_template FROM activities WHERE id_activity='act-c001-3'",'neonflow-3','source branch alias and custom edits preserved')
    v.equal('existing',"SELECT objective FROM activity_missions WHERE id_mission='teacher-mission'",'Keep intact','teacher mission preserved')
    v.equal('existing',"SELECT score::int FROM activity_results WHERE id_result='historical-result'",73,'historical score preserved')
    v.equal('existing',"SELECT count(*) FROM simulations WHERE id_simulation='historical-sim'",1,'historical simulation preserved')
    v.equal('existing',"SELECT count(*) FROM telemetry_attempts WHERE id_attempt='historical-orphan' AND trace_context IS NULL",1,'legacy orphan preserved without invented context')
    v.equal('existing',"SELECT count(*) FROM activities WHERE environment='neonflow'",32,'existing: 30 catalog activities plus two preserved prototypes')
    v.sql('existing',"INSERT INTO telemetry_attempts(id_attempt,id_student,game,result) VALUES('invalid-new-user','missing-legacy-user','neonflow','SUCCESS')",expected_failure=True)
    v.checks.append('new orphan student rejected by FK despite preserved legacy rows')
    v.sql('existing',"INSERT INTO telemetry_attempts(id_attempt,id_student,id_activity,game,result,trace_context) VALUES('new-trace','test-student','act-c001-v2-1','neonflow','ABANDONED','{\"activityId\":\"act-c001-v2-1\",\"events\":[{\"sequence\":1,\"type\":\"PLACE\"}]}'::jsonb)")
    v.equal('existing',"SELECT trace_context->'events'->0->>'type' FROM telemetry_attempts WHERE id_attempt='new-trace'",'PLACE','JSONB event sequence recovered')
    v.sql('existing',"DELETE FROM activities WHERE id_activity='act-c001-v2-1'")
    v.equal('existing',"SELECT count(*) FROM telemetry_attempts WHERE id_attempt='new-trace' AND id_activity IS NULL AND trace_context->>'activityId'='act-c001-v2-1'",1,'activity deletion retains observation and original identity snapshot')
    v.sql('existing',"DELETE FROM users WHERE id_user='test-student'")
    v.equal('existing',"SELECT count(*) FROM telemetry_attempts WHERE id_attempt='new-trace'",0,'student deletion follows existing cascade/privacy behavior')
    v.database('collision',through=15)
    v.sql('collision',"INSERT INTO courses(id_course,name) VALUES('other','Other');INSERT INTO modules(id_module,id_course,title) VALUES('mod-c001-l1','other','Conflict');INSERT INTO lessons(id_lesson,id_module,title) VALUES('les-c001-l1','mod-c001-l1','Conflict')")
    migration=next(MIGRATIONS.glob('V16__*.sql')).read_text(encoding='utf-8')
    v.sql('collision',migration,expected_failure=True)
    v.equal('collision',"SELECT count(*) FROM courses WHERE id_course='c001'",0,'ownership conflict rolls back complete migration')
    v.equal('collision',"SELECT count(*) FROM activities WHERE environment='neonflow'",0,'ownership conflict never assigns another course lesson')
    print(json.dumps({'passed':len(v.checks),'checks':v.checks},ensure_ascii=False,indent=2))
finally:
    v.close()
