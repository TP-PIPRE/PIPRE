"""Read Maven's dependency:list output and query public OSV without suppressions."""
import argparse
import json
import re
import urllib.request
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--input',default='backend/target/full-audit-dependencies.txt')
parser.add_argument('--output',default='backend/target/full-audit-osv.json')
args=parser.parse_args()
coordinates={}
for line in Path(args.input).read_text(encoding='utf-8').splitlines():
    token=line.strip().split(' ')[0]
    parts=token.split(':')
    if len(parts) in (5,6) and parts[-1] in {'compile','runtime','test','provided','system'} and re.fullmatch(r'[\w.-]+',parts[0]):
        name=':'.join(parts[:2]);version=parts[-2]
        coordinates.setdefault((name,version),set()).add(parts[-1])
if not coordinates:
    raise SystemExit('No resolved coordinates found; refusing to report a clean audit.')
queries=[{'package':{'ecosystem':'Maven','name':name},'version':version} for name,version in coordinates]
request=urllib.request.Request('https://api.osv.dev/v1/querybatch',data=json.dumps({'queries':queries}).encode(),headers={'Content-Type':'application/json'})
with urllib.request.urlopen(request,timeout=60) as response:
    results=json.load(response)['results']
if len(results)!=len(queries):
    raise SystemExit('Incomplete OSV response.')
ids=sorted({v['id'] for result in results for v in result.get('vulns',[])})
details={}
for advisory in ids:
    with urllib.request.urlopen('https://api.osv.dev/v1/vulns/'+advisory,timeout=30) as response:
        details[advisory]=json.load(response)
report={'source':'https://api.osv.dev/v1/querybatch','packageCount':len(queries),'advisoryCount':len(ids),
        'packages':[dict(query,scopes=sorted(scopes),advisories=result.get('vulns',[])) for query,scopes,result in zip(queries,coordinates.values(),results)],'details':details}
Path(args.output).write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'packages':len(queries),'advisories':ids}))
