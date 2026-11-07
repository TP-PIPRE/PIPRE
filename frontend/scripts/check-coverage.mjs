import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const report=JSON.parse(readFileSync(resolve(root,'coverage/coverage-summary.json'),'utf8'));
const required=[
  'src/infrastructure/adapters/http/AuthAdapter.ts','src/infrastructure/api/axiosInstance.ts',
  'src/infrastructure/api/errors.ts','src/infrastructure/api/gameProgressService.ts',
  'src/infrastructure/store/authStore.ts','src/infrastructure/store/validatedGameSession.ts',
  'src/infrastructure/store/achievementStore.ts','src/ui/components/common/useDailySet.ts',
  'src/ui/components/common/useValidatedGameSession.ts','src/ui/components/common/DailyProgress.tsx',
  'src/ui/components/TetriLogic/useFreePieceInteraction.ts','src/ui/router/index.tsx',
  'src/ui/pages/LoginPage.tsx','src/ui/pages/RankingPage.tsx',
];
const files=Object.entries(report).filter(([name])=>name!=='total').map(([name,value])=>({
  file:'src/'+name.replaceAll('\\','/').split('/src/').at(-1),...value,
}));
for(const name of required)if(!files.some(file=>file.file===name))throw new Error(`Coverage is missing ${name}`);
const critical=files.filter(file=>file.file.startsWith('src/application/')||required.includes(file.file));
const totals={};
for(const metric of ['lines','branches','functions','statements']) {
  const covered=critical.reduce((sum,file)=>sum+file[metric].covered,0);
  const total=critical.reduce((sum,file)=>sum+file[metric].total,0);
  totals[metric]={covered,total,pct:total?Math.round(10000*covered/total)/100:100};
}
const summary={global:report.total,critical:totals,criticalFiles:critical.map(file=>({file:file.file,lines:file.lines,branches:file.branches}))};
writeFileSync(resolve(root,'coverage/critical-summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({globalLines:report.total.lines.pct,criticalLines:totals.lines.pct,criticalBranches:totals.branches.pct,criticalFiles:critical.length}));
if(totals.lines.pct<80||totals.branches.pct<80){console.error('Critical business logic line or branch coverage is below 80%.');process.exitCode=1;}
