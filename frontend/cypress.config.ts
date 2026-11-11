import { defineConfig } from "cypress";
import { readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const manifestPath = resolve("node_modules/.cache/pipre-audit/environment.json");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, "")) : null;
const reportDirectory=resolve(`test-results/e2e/${manifest?.runId??"unstarted"}/${Date.now()}`);
const tutorFixtures = {
  neonflow: { group: "00000000-0000-4000-8000-000000000029", course: "c001", activity: "act-c001-v2-1" },
  tetrilogic: { group: "00000000-0000-4000-8000-000000000030", course: "c002", activity: "act-c002-1" },
};

function auditSql(sql:string) {
  if (!manifest || !/^[a-f0-9]{32}$/.test(manifest.runId)) throw new Error("Only isolated audit fixtures may be inspected.");
   const labels = JSON.parse(execFileSync("docker", ["inspect", "--format", "{{json .Config.Labels}}", manifest.dbContainer], { encoding: "utf8", windowsHide: true }).trim());
   const label = labels["pipre.audit.run"];
  if (label !== manifest.runId) throw new Error("Database is not this audit's disposable container.");
  return execFileSync("docker", ["exec", manifest.dbContainer, "psql", "-U", "audit", "-d", "pipre_audit", "-v", "ON_ERROR_STOP=1", "-tAc", sql], { encoding: "utf8", windowsHide: true });
}
function databaseSnapshot(studentId: string) {
  if(!/^[A-Za-z0-9-]{1,36}$/.test(studentId))throw new Error("Invalid fixture identifier");
  const sql = `SELECT json_build_object(
    'dailyExercises',(SELECT count(*) FROM procedural_daily_challenges WHERE student_id='${studentId}'),
    'completedDailyExercises',(SELECT count(*) FROM procedural_daily_challenges WHERE student_id='${studentId}' AND completed_at IS NOT NULL),
    'completedDates',(SELECT count(*) FROM daily_challenge_completions WHERE student_id='${studentId}'),
    'levels',(SELECT count(*) FROM game_level_progress WHERE student_id='${studentId}'),
    'victories',(SELECT count(*) FROM verified_game_victories WHERE student_id='${studentId}'),
    'xpEntries',(SELECT count(*) FROM achievement_xp_ledger WHERE student_id='${studentId}'),
    'dailyXpEntries',(SELECT count(*) FROM daily_xp_ledger WHERE student_id='${studentId}'),
    'points',(SELECT coalesce(sum(best_points),0) FROM game_best_scores WHERE student_id='${studentId}'),
    'xp',(SELECT coalesce(sum(amount),0) FROM achievement_xp_ledger WHERE student_id='${studentId}')+(SELECT coalesce(sum(amount),0) FROM daily_xp_ledger WHERE student_id='${studentId}'))`;
  return JSON.parse(auditSql(sql));
}

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 800,
  video: false,
  allowCypressEnv: false,
  screenshotsFolder: "test-results/e2e/screenshots",
  reporter: "junit",
  reporterOptions: { mochaFile: `${reportDirectory}/results-[hash].xml`, toConsole: true },
  e2e: {
    baseUrl: manifest?.baseUrl ?? "http://127.0.0.1:15183",
    specPattern: "tests/e2e/**/*.cy.{ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents(on) {
      if (!manifest || manifest.apiUrl !== "http://127.0.0.1:18183/api/v1") throw new Error("Start scripts/audit-environment.ps1 first; E2E must never target a real database.");
      mkdirSync(reportDirectory,{recursive:true});
      on("after:run",results=>writeFileSync(resolve("test-results/e2e/latest-run.json"),JSON.stringify({reportDirectory,...results},null,2)));
      on("task", {
        progressiveTutorEnabled: () => process.env.PIPRE_AUDIT_PROGRESSIVE_ENABLED === "true",
        browserDiagnostics(data) {appendFileSync(`${reportDirectory}/browser-console.jsonl`,JSON.stringify(data)+"\n");return null;},
        browserCheckpoint(data) {appendFileSync(`${reportDirectory}/browser-checkpoints.jsonl`,JSON.stringify({at:new Date().toISOString(),...data})+"\n");return null;},
        databaseSnapshot,
        createAuditGroup() {
          const idGroup=randomUUID(),groupName=`QA group ${idGroup.slice(0,8)}`;
          auditSql(`INSERT INTO groups(id_group,group_name) VALUES ('${idGroup}','${groupName}')`);
          return {idGroup,groupName};
        },
        configureTutorPilot({ studentId, game }: { studentId: string; game: keyof typeof tutorFixtures }) {
          if(!/^[A-Za-z0-9-]{1,36}$/.test(studentId) || !Object.hasOwn(tutorFixtures, game))throw new Error("Invalid tutor fixture");
          const { group, course, activity } = tutorFixtures[game];
          auditSql(`INSERT INTO groups(id_group,group_name) VALUES ('${group}','Tutor audit ${game}') ON CONFLICT DO NOTHING;
            INSERT INTO group_courses(id_group,id_course) VALUES ('${group}','${course}') ON CONFLICT DO NOTHING;
            INSERT INTO group_activities(id_group,id_activity) VALUES ('${group}','${activity}') ON CONFLICT DO NOTHING;
            INSERT INTO group_students(id_ranking,id_group,id_student,total_points,position) VALUES ('${randomUUID()}','${group}','${studentId}',0,1) ON CONFLICT DO NOTHING;`);
          return group;
        },
        tutorSnapshot({ studentId, game }: { studentId: string; game: keyof typeof tutorFixtures }) {
          if(!/^[A-Za-z0-9-]{1,36}$/.test(studentId) || !Object.hasOwn(tutorFixtures, game))throw new Error("Invalid tutor fixture");
          return JSON.parse(auditSql(`SELECT json_build_object(
            'receipts', count(*), 'consumed', count(h.consumed_at),
            'ruleBased', count(h.consumed_at) FILTER (WHERE h.source='RULE_BASED'),
            'lineHints', count(h.consumed_at) FILTER (WHERE h.target_axis IS NOT NULL AND h.target_line IS NOT NULL))
            FROM game_session_hints h JOIN game_sessions s ON s.session_id=h.session_id
            WHERE s.student_id='${studentId}' AND s.game='${game}'`));
        },
        membershipCount({studentId,groupId}) {
          if(![studentId,groupId].every(id=>typeof id==='string'&&/^[A-Za-z0-9-]{1,36}$/.test(id)))throw new Error("Invalid fixture identifiers");
          return Number(auditSql(`SELECT count(*) FROM group_students WHERE id_group='${groupId}' AND id_student='${studentId}'`));
        },
        dailyWitness(challenge) {
          const game = challenge.game;
          if (!["tetrilogic", "neonflow"].includes(game)) throw new Error("Unknown game");
          const catalog = JSON.parse(readFileSync(resolve(`../backend/src/main/resources/catalog/${game}-v2.json`), "utf8"));
          const witnesses = JSON.parse(readFileSync(resolve(`../backend/src/main/resources/catalog/${game}-daily-witnesses.json`), "utf8"));
          const source = catalog[challenge.levelNumber - 1];
          const dx = game === "neonflow" ? challenge.config.emitter.position.x - source.emitter.position.x : challenge.config.constraints.find((c: {orientation:string}) => c.orientation === "column").line;
          const dy = game === "neonflow" ? challenge.config.emitter.position.y - source.emitter.position.y : challenge.config.constraints.find((c: {orientation:string}) => c.orientation === "row").line;
          const witness = witnesses[challenge.levelNumber - 1];
          return witness.placements.map((p: {position:{x:number;y:number}}) => ({...p,position:{x:p.position.x+dx,y:p.position.y+dy}}));
        },
        officialWitness(input: string | {game:string;levelNumber:number}) {
          const game=typeof input==="string"?input:input.game;
          const level=typeof input==="string"?1:input.levelNumber;
          if (!["tetrilogic", "neonflow"].includes(game)) throw new Error("Unknown game");
          if(!Number.isInteger(level)||level<1||level>30)throw new Error("Unknown official level");
          const file = game === "neonflow" ? "neonflow-v3-witnesses" : "tetrilogic-daily-witnesses";
          return JSON.parse(readFileSync(resolve(`../backend/src/main/resources/catalog/${file}.json`), "utf8"))[level-1].placements;
        },
      });
    },
  },
});
