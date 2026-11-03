"""Read-only snapshots: compare hashes of existing rows, without exporting personal columns."""
import json,subprocess,sys
from pathlib import Path
TABLES={'users':'id_user','courses':'id_course','modules':'id_module','lessons':'id_lesson','activities':'id_activity','activity_missions':'id_mission','simulations':'id_simulation','activity_results':'id_result','module_progress':'id_progress','help_requests':'id_help_request','dropout_risks':'id_risk','telemetry_attempts':'id_attempt'}
def snapshot():
    result={}
    for table,key in TABLES.items():
        source=table if table!='telemetry_attempts' else '(SELECT id_attempt,id_student,game,result,tiempo_resolucion,movimientos,reinicios,pistas_ia,completed_at FROM telemetry_attempts)'
        sql=f"SELECT coalesce(json_object_agg({key},md5(row_to_json(t)::text)),'{{}}'::json) FROM {source} t"
        raw=subprocess.check_output(['docker','exec','pipre-database','psql','-U','pipre_user','-d','pipre_database','-Atc',sql],text=True,encoding='utf-8')
        result[table]=json.loads(raw)
    return result
if __name__=='__main__':
    path=Path(sys.argv[2]);current=snapshot()
    if sys.argv[1]=='capture':
        path.write_text(json.dumps(current,indent=2),encoding='utf-8');print('Captured hashes for',sum(map(len,current.values())),'existing rows')
    else:
        before=json.loads(path.read_text(encoding='utf-8'))
        for table,rows in before.items():
            assert all(current[table].get(key)==value for key,value in rows.items()),f'Historical row changed/deleted: {table}'
        print(json.dumps({'tables_checked':len(before),'historical_rows_preserved':sum(map(len,before.values())),'added_rows':{table:len(rows)-len(before[table]) for table,rows in current.items()}},indent=2))
