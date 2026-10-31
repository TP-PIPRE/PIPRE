"""Local HTTP/SQL integration QA. Creates and cleans only its uniquely identified fixtures."""
import concurrent.futures,copy,http.cookiejar,json,re,subprocess,urllib.error,urllib.request,uuid
from pathlib import Path
BASE='http://localhost:8081/api/v1/'
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(title,condition=True):
    assert condition,title
    checks.append(title)
class Client:
    def __init__(self): self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def request(self,method,path,data=None,status=200):
        request=urllib.request.Request(BASE+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={'Content-Type':'application/json'})
        try:
            with self.opener.open(request,timeout=20) as response: code,raw=response.status,response.read()
        except urllib.error.HTTPError as error: code,raw=error.code,error.read()
        assert code==status,f'{method} {path}: got {code}, expected {status}; {raw[:180]!r}'
        if not raw:return None
        try:return json.loads(raw)
        except json.JSONDecodeError:return raw.decode()
    def collection(self,path):
        value=self.request('GET',path+('?size=100' if '?' not in path else '&size=100'))
        return value if isinstance(value,list) else value['content']
def q(value):return "'"+str(value).replace("'","''")+"'"
def sql(query):return subprocess.check_output(['docker','exec','pipre-database','psql','-U','pipre_user','-d','pipre_database','-Atc',query],text=True,encoding='utf-8').strip()
anon,admin,student=Client(),Client(),Client()
admin.request('POST','auth/login',{'email':'admin@pipre.com','password':'123'})
marker='integration-'+uuid.uuid4().hex[:16]
email=marker+'@test.invalid';student_id=None;course_id=None
try:
    student_id=anon.request('POST','users',{'firstName':'Integration','lastName':marker,'email':email,'passwordHash':'Integration-123-test','age':18,'grade':'QA'},status=201)
    assert isinstance(student_id,str) and re.fullmatch(r'[A-Za-z0-9-]{1,36}',student_id)
    account=student.request('POST','auth/login',{'email':email,'password':'Integration-123-test'})
    check('owned student fixture authenticated',account['user']['idUser']==student_id)
    for game,file in [('neonflow','neonFlowCatalog.json'),('tetrilogic','tetrilogicCatalog.json')]:
        catalog=json.loads((ROOT/'frontend/src/shared/constants'/file).read_text(encoding='utf-8'))
        for config in catalog:
            response=student.request('GET',game+'/templates/'+config['templateId'])
            check(config['templateId']+' persisted contract',response=={'templateId':config['templateId'],'version':2,'config':config} and 'solution' not in response['config'])
        anon.request('GET',game+'/templates/'+catalog[0]['templateId'],status=401)
        student.request('GET',game+'/templates/'+game+'-v2-31',status=404)
        check(game+' authentication and unknown-template handling')
    neon=student.collection('activities/lesson/les-c001-l1')
    official={a['idActivity'] for a in neon if (a.get('levelTemplate') or '').startswith('neonflow-v2-') or (a.get('levelTemplate') or '') in {f'neonflow-{n}' for n in range(3,31)}}
    check('30 official Neon activities, legacy prototypes not counted',len(official)==30)
    admin.request('POST','courses',{'name':marker,'description':'Owned integration fixture','level':'LOW'},status=201)
    course=next(c for c in admin.collection('courses') if c['name']==marker);course_id=course['idCourse']
    admin.request('POST','modules',{'idCourse':course_id,'title':marker},status=201)
    module=next(m for m in admin.collection('modules/course/'+course_id) if m['title']==marker)
    admin.request('POST','lessons',{'idModule':module['idModule'],'title':marker},status=201)
    lesson=next(l for l in admin.collection('lessons/module/'+module['idModule']) if l['title']==marker)
    activities={}
    for game in ['neonflow','tetrilogic']:
        body={'idLesson':lesson['idLesson'],'name':marker+'-'+game,'logicLevel':1,'type':'robotics','environment':game,'levelTemplate':game+'-v2-1','description':'QA metadata','displayOrder':1,'difficulty':'EASY','complexity':'EASY','missions':[{'id':str(uuid.uuid4()),'title':'QA mission','objective':'QA contract','maxBlocks':0}]}
        admin.request('POST','activities',body,status=201)
        activity=next(a for a in admin.collection('activities/lesson/'+lesson['idLesson']) if a['name']==body['name']);activities[game]=activity
        admin.request('PUT','activities/'+activity['idActivity'],{'description':'Edited QA','displayOrder':3})
        reloaded=student.request('GET','activities/'+activity['idActivity'])
        check(game+' CRUD, metadata and missions preserved',reloaded['description']=='Edited QA' and reloaded['displayOrder']==3 and len(reloaded['missions'])==1 and reloaded['levelTemplate']==body['levelTemplate'])
        student.request('PUT','activities/'+activity['idActivity'],body,status=403)
        check(game+' student cannot change activity')
    for game in ['neonflow','tetrilogic']:
        payload={'studentId':student_id,'game':game,'result':'SUCCESS','tiempoResolucion':1,'movimientos':0,'reinicios':0,'pistasIa':0,'completedAt':'2026-10-30T15:00:01.000Z','trace':{'clientAttemptId':str(uuid.uuid4()),'activityId':activities[game]['idActivity'],'levelTemplate':game+'-v2-1','templateVersion':2,'ruleset':game+('-raycast-v1' if game=='neonflow' else '-counts-v1'),'startedAt':'2026-10-30T15:00:00.000Z','initialState':[],'finalState':[],'droppedEvents':0,'events':[{'sequence':1,'elapsedMs':1000,'type':'COMPLETE','data':{}}]}}
        student.request('POST','telemetry',payload,status=201);student.request('POST','telemetry',payload,status=201)
        clause=f"id_student={q(student_id)} AND trace_context->>'clientAttemptId'={q(payload['trace']['clientAttemptId'])}"
        check(game+' retry creates one observation',sql('SELECT count(*) FROM telemetry_attempts WHERE '+clause)=='1')
        check(game+' structured events and reception recoverable',sql('SELECT count(*) FROM telemetry_attempts WHERE '+clause+" AND received_at IS NOT NULL AND request_hash IS NOT NULL AND trace_context->'events'->0->>'type'='COMPLETE'")=='1')
        changed=copy.deepcopy(payload);changed['trace']['events'][0]['type']='ABANDON';student.request('POST','telemetry',changed,status=400)
        check(game+' conflicting reuse rejected')
        for title,mutate in [
            ('sequence gap',lambda p:p['trace']['events'][0].update(sequence=2)),
            ('negative event time',lambda p:p['trace']['events'][0].update(elapsedMs=-1)),
            ('personal event field',lambda p:p['trace']['events'][0].update(email='not-allowed@example.test')),
            ('wrong template',lambda p:p['trace'].update(levelTemplate=game+'-v2-30')),
        ]:
            bad=copy.deepcopy(payload);bad['trace']['clientAttemptId']=str(uuid.uuid4());mutate(bad);student.request('POST','telemetry',bad,status=400);check(game+' rejects '+title)
        admin.request('PUT','activities/'+activities[game]['idActivity'],{'levelTemplate':game+'-v2-30'})
        student.request('POST','telemetry',payload,status=201);check(game+' accepted retry remains idempotent after teacher edits')
        parallel_payload=copy.deepcopy(payload);parallel_payload['trace']['clientAttemptId']=str(uuid.uuid4());parallel_payload['trace']['levelTemplate']=game+'-v2-30'
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(lambda _:student.request('POST','telemetry',parallel_payload,status=201),range(8)))
        check(game+' concurrent retries create one observation',sql(f"SELECT count(*) FROM telemetry_attempts WHERE id_student={q(student_id)} AND trace_context->>'clientAttemptId'={q(parallel_payload['trace']['clientAttemptId'])}")=='1')
    legacy={k:v for k,v in payload.items() if k!='trace'};student.request('POST','telemetry',legacy,status=201)
    check('legacy client retained without invented context',sql(f"SELECT count(*) FROM telemetry_attempts WHERE id_student={q(student_id)} AND trace_context IS NULL")=='1')
    forbidden=copy.deepcopy(payload);forbidden['studentId']='another-student';student.request('POST','telemetry',forbidden,status=403);check('another student identity rejected')
    check('telemetry never grants grades',sql(f"SELECT count(*) FROM activity_results WHERE id_student={q(student_id)}")=='0')
finally:
    if course_id:
        current=next(c for c in admin.collection('courses') if c['idCourse']==course_id)
        assert current['name']==marker,'Course identity changed; cleanup refused'
        admin.request('DELETE','courses/'+course_id,status=204)
        check('owned course fixture cleaned')
    if student_id:
        assert sql(f"SELECT email FROM users WHERE id_user={q(student_id)}")==email,'Student identity changed; cleanup refused'
        sql(f"DELETE FROM users WHERE id_user={q(student_id)} AND email={q(email)}")
        check('owned student and observations cleaned',sql(f"SELECT count(*) FROM telemetry_attempts WHERE id_student={q(student_id)}")=='0')
print(json.dumps({'passed':len(checks),'checks':checks},ensure_ascii=False,indent=2))
