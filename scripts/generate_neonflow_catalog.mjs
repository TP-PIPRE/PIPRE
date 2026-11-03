// Node 24. Offline freeze/check only. Construction solutions never enter runtime JSON.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NEONFLOW_LEVELS } from './neonflow_layouts.ts';
const root = fileURLToPath(new URL('../', import.meta.url));
const q = value => "'" + String(value).replaceAll("'", "''") + "'";
const catalog = NEONFLOW_LEVELS.map(({ solution, ...level }) => ({ ...level, templateId: `neonflow-v2-${level.level}`, version: 2 }));
const witnesses = NEONFLOW_LEVELS.map(level => ({ templateId: `neonflow-v2-${level.level}`, placements: level.solution }));
let sql = `-- Additive, immutable Neon Flow v2 catalog. No synthetic grades or student data.
CREATE TABLE IF NOT EXISTS neonflow_templates (template_id VARCHAR(40) PRIMARY KEY, version INTEGER NOT NULL CHECK(version > 0), config JSONB NOT NULL);
INSERT INTO courses(id_course,name,description,level,created_at) VALUES ('c001','Neon Flow','Lógica proposicional y condiciones de color','MEDIUM',CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
INSERT INTO modules(id_module,id_course,title) SELECT 'mod-c001-l1','c001','Lógica Proposicional y Condicionales' FROM courses WHERE id_course='c001' ON CONFLICT DO NOTHING;
INSERT INTO lessons(id_lesson,id_module,title) SELECT 'les-c001-l1','mod-c001-l1','Introducción a Neon Flow' FROM modules WHERE id_module='mod-c001-l1' AND id_course='c001' ON CONFLICT DO NOTHING;
CREATE TEMPORARY TABLE neonflow_ownership_guard(ok INTEGER CHECK(ok=1));
INSERT INTO neonflow_ownership_guard SELECT CASE WHEN EXISTS(SELECT 1 FROM lessons l JOIN modules m USING(id_module) WHERE l.id_lesson='les-c001-l1' AND m.id_course='c001') THEN 1 ELSE 0 END;
DROP TABLE neonflow_ownership_guard;
CREATE TEMPORARY TABLE neonflow_new_activities(id_activity VARCHAR(36) PRIMARY KEY);
`;
for (const level of catalog) {
  const n=level.level, id=n<=2?`act-c001-v2-${n}`:`act-c001-${n}`;
  const difficulty=n<=10?'EASY':n<=20?'MEDIUM':'HARD', logic=n<=10?'LOW':n<=20?'MEDIUM':'HIGH';
  const objective=`Guía el haz ${level.emitter.color} hasta el receptor en el tablero ${level.width}×${level.height}, usando espejos y filtros del mismo color.`;
  sql+=`INSERT INTO neonflow_templates VALUES(${q(level.templateId)},2,JSON ${q(JSON.stringify(level))}) ON CONFLICT DO NOTHING;
INSERT INTO neonflow_new_activities SELECT ${q(id)} WHERE NOT EXISTS(SELECT 1 FROM activities WHERE id_activity=${q(id)});
INSERT INTO activities(id_activity,id_lesson,name,logic_level,complexity,difficulty,type,environment,description,level_template,display_order,start_x,start_z,target_x,target_z) VALUES(${q(id)},'les-c001-l1',${q(`Neon Flow - Nivel ${n}`)},${q(logic)},${q(difficulty)},${q(difficulty)},'robotics','neonflow',${q(objective)},${q(level.templateId)},${n},0,0,0,0) ON CONFLICT DO NOTHING;
INSERT INTO activity_missions(id_mission,id_activity,title,objective,max_blocks) SELECT ${q(`mis-c001-v2-${n}`)},${q(id)},${q(`Ruta óptica ${n}`)},${q(objective)},0 WHERE EXISTS(SELECT 1 FROM neonflow_new_activities WHERE id_activity=${q(id)}) ON CONFLICT DO NOTHING;
`;
}
sql+='DROP TABLE neonflow_new_activities;\n';
const files = {
  'frontend/src/shared/constants/neonFlowCatalog.json': JSON.stringify(catalog,null,2)+'\n',
  'backend/src/main/resources/catalog/neonflow-v2.json': JSON.stringify(catalog,null,2)+'\n',
  'frontend/tests/fixtures/neonFlowSolutions.json': JSON.stringify(witnesses,null,2)+'\n',
  'backend/src/main/resources/db/migration/V16__neonflow_official_catalog.sql': sql,
};
for (const [file, content] of Object.entries(files)) {
  if (process.argv.includes('--check')) { if(readFileSync(root+file,'utf8')!==content) throw new Error(`Frozen catalog mismatch: ${file}`); }
  else writeFileSync(root+file,content);
}
console.log('Neon Flow: 30 frozen configurations, separate witnesses and additive V16 OK');
