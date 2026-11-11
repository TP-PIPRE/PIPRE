/// <reference types="cypress" />
import type { DailySetDTO } from "../../src/infrastructure/api/models/gameProgressModels";

const api = "http://127.0.0.1:18183/api/v1";
const learnerEmail=`e2e-${Date.now()}@test.invalid`;
const learnerPassword="Audit-browser-123";
type Placement = {id?:string;type:string;color?:string;rotation?:number;position:{x:number;y:number}};
type Snapshot = {dailyExercises:number;completedDailyExercises:number;completedDates:number;levels:number;victories:number;xpEntries:number;xp:number;dailyXpEntries:number;points:number};

function login(email=learnerEmail) {
  cy.session(email,()=>{
    if(email===learnerEmail) {
      cy.request({method:"POST",url:`${api}/users`,failOnStatusCode:false,body:{firstName:"QA",lastName:"Browser",email,passwordHash:learnerPassword,age:16,grade:"QA",roleIdList:[]}}).then(response=>{
        expect([201,400]).to.include(response.status);
        if(response.status===400)expect(response.body.message).to.match(/registrad|existe/i);
      });
    }
    cy.login(email,email===learnerEmail?learnerPassword:"123");
    cy.location("pathname").should("not.eq","/login");
    cy.getCookie("jwt").should("have.property","httpOnly",true);
  }, {validate(){cy.request(`${api}/courses`).its("status").should("eq",200);}});
}
function studentId() {
  return cy.getCookie("pipre_user").then(cookie=>JSON.parse(decodeURIComponent(cookie!.value)).id as string);
}
function completeBoard(game:string,placements:Placement[],daily=false) {
  for(const p of placements) {
    const row=p.position.y+1,col=p.position.x+1;
    if(game==="tetrilogic") {
      cy.get(`button[aria-label$="(${p.id})"]`).click();
      for(let angle=0;angle<(p.rotation??0);angle+=90)cy.get('button[aria-label="Rotar pieza"]').click();
      cy.get(`button[data-cell-x="${p.position.x}"][data-cell-y="${p.position.y}"]`).click();
    } else {
      cy.contains("button",p.type==="MIRROR_90"?"Espejo 90°":`Filtro ${p.color}`).click();
      cy.get(`button[aria-label="Celda vacía, fila ${row}, columna ${col}"]`).click();
      for(let angle=0;angle<(p.rotation??0);angle+=90)cy.get(`button[aria-label^="Rotar espejo, fila ${row}, columna ${col}"]`).click();
    }
  }
  if(game==="neonflow")cy.contains("button",/^Comprobar$/).click();
  if(!daily)cy.contains("Resultado guardado",{timeout:15000}).should("be.visible");
}
function logout() {
  cy.get('[aria-label="Abrir menú de usuario"]').click();
  cy.contains('[role="menuitem"]',"Cerrar sesión").click();
  cy.location("pathname").should("eq","/login");
  cy.getCookie("jwt").should("be.null");
}

describe("Aplicación real con PostgreSQL desechable",()=>{
  beforeEach(()=>{
    cy.viewport(1440,1000);
    // Existing ML UI may report an unavailable integration; never call remote services.
    cy.intercept({url:/https?:\/\//,middleware:true},req=>{
      if(!["127.0.0.1","localhost"].includes(new URL(req.url).hostname))req.reply({statusCode:503,body:{message:"Integración externa fuera de esta prueba"}});
    });
  });

  it("valida registro, acceso por formulario, cookie HttpOnly y salida",()=>{
    const email=learnerEmail;
    cy.register({firstName:"QA",lastName:"Browser",email,password:"Audit-browser-123",age:16,grade:"QA"});
    cy.contains("Tu cuenta está lista").should("be.visible");
    login();cy.visit("/");
    cy.location("pathname").should("eq","/");
    cy.getCookie("jwt").should("have.property","httpOnly",true);
    cy.contains("0/5 ejercicios completados").should("be.visible");
    logout();
    cy.visit("/perfil");cy.location("pathname").should("eq","/login");
  });

  it("rechaza credenciales incorrectas sin perder el formulario",()=>{
    cy.visit("/login");cy.get('input[name="email"]').type("absent@test.invalid");
    cy.get('input[name="password"]').type("wrong",{log:false});cy.get('button[type="submit"]').click();
    cy.get('[role="alert"]').should("be.visible").and("contain","contraseña");
    cy.get('button[type="submit"]').should("be.enabled");
  });

  it("recorre rutas estudiantiles y el menú móvil sin desbordamiento",()=>{
    login();
    for(const route of ["/","/perfil","/resultados","/ranking","/simulador"]) {
      cy.visit(route);cy.get("main h1",{timeout:15000}).should("be.visible");
      cy.document().then(doc=>expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth+1));
    }
    cy.go("back");cy.location("pathname").should("eq","/ranking");
    cy.go("forward");cy.location("pathname").should("eq","/simulador");
    for(const width of [320,390,768,1440]) {
      cy.viewport(width,900);cy.visit("/");cy.contains("Reto diario").should("be.visible");
      cy.document().then(doc=>expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth+1));
      if(width<1280) {
        cy.get('[aria-label="Abrir menú de navegación"]').click();
        cy.get('nav[aria-label="Navegación móvil"]').contains("Mi Perfil").click();
        cy.location("pathname").should("eq","/perfil");
      }
      cy.screenshot(`student-${width}`,{capture:"fullPage"});
    }
  });

  it("mantiene permisos servidor al manipular metadatos y gestiona sesión expirada",()=>{
    login();cy.visit("/");
    cy.visit("/docente/retos");cy.location("pathname").should("eq","/");
    studentId().then(id=>{
      cy.setCookie("pipre_user",encodeURIComponent(JSON.stringify({id,email:"alumno@pipre.com",name:"QA",role:"admin"})));
      cy.request({url:`${api}/users`,failOnStatusCode:false}).its("status").should("eq",403);
    });
    cy.clearCookie("jwt");cy.visit("/perfil");cy.location("pathname",{timeout:15000}).should("eq","/login");
    cy.getCookie("pipre_user").should("be.null");
  });

  it("abre las cuatro pantallas de gestión con docente y administrador",()=>{
    for(const email of ["docente@pipre.com","admin@pipre.com"]) {
      login(email);
      for(const route of ["dashboard","estudiantes","retos","metricas"]) {
        cy.visit(`/docente/${route}`);cy.get("main h1",{timeout:15000}).should("be.visible");
        cy.location("pathname").should("eq",`/docente/${route}`);
        for(const width of [390,768,1440]) {
          cy.viewport(width,1000);
          cy.document().then(doc=>expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth+1));
        }
      }
    }
  });

  it("crea, edita, recarga y elimina su actividad desde la interfaz docente",()=>{
    const openCourse=()=>cy.contains("h3","Neon Flow").parent().contains("button",/^Retos$/).click();
    login("admin@pipre.com");
    cy.request(`${api}/administration`).then(response=>{
      const teacher=response.body.users.find((row:{email:string})=>row.email==="docente@pipre.com");
      cy.visit("/docente/administracion");
      cy.contains("label","Docente").find("select").select(teacher.idUser);
      cy.contains("label","Curso del docente").find("select").select("c001");
      cy.contains("button","Asignar curso al docente").click();cy.contains("Docente asignado al curso.").should("be.visible");
    });
    login("docente@pipre.com");cy.visit("/docente/retos");openCourse();
    cy.contains("button","Nuevo Reto").click();
    const field=(label:string)=>cy.contains("label",new RegExp(`^${label}$`)).invoke("attr","for").then(id=>cy.get(`#${id}`));
    const name=`QA browser ${Date.now()}`;
    field("Título").type(name);field("Orden").type("{selectall}1").should("have.value","1");
    cy.get('select:has(option[value="neonflow"])').select("neonflow");
    field("Tablero del reto").select("neonflow-v3-2");
    field("Lección").should("not.have.value","").invoke("val").then(lesson=>{
      cy.intercept("POST",`${api}/activities`).as("createActivity");cy.contains("button",/^Crear Reto$/i).click();
      cy.wait("@createActivity").its("response.statusCode").should("eq",201);
      cy.request(`${api}/activities/lesson/${lesson}?page=0&size=100`).then(response=>{
        const saved=response.body.content.find((row:{name:string})=>row.name===name);expect(saved).to.be.an("object");expect(saved.levelTemplate).to.eq("neonflow-v3-2");
        cy.reload();openCourse();
        cy.contains("p",name).parent().parent().contains("button",/^Editar$/).click();field("Título").clear().type(name+" edited");
        cy.intercept("PUT",`${api}/activities/${saved.idActivity}`).as("updateActivity");cy.contains("button",/^Guardar Cambios$/i).click();cy.wait("@updateActivity").its("response.statusCode").should("eq",200);
        cy.request(`${api}/activities/${saved.idActivity}`).its("body").should("include",{name:name+" edited",idLesson:lesson,levelTemplate:"neonflow-v3-2"});
        cy.intercept("DELETE",`${api}/activities/${saved.idActivity}`).as("deleteActivity");cy.contains("p",name+" edited").parent().parent().contains("button",/^Eliminar$/).click();cy.wait("@deleteActivity").its("response.statusCode").should("eq",204);
        cy.request({url:`${api}/activities/${saved.idActivity}`,failOnStatusCode:false}).its("status").should("eq",403);
        login("admin@pipre.com");cy.request({url:`${api}/activities/${saved.idActivity}`,failOnStatusCode:false}).its("status").should("eq",404);
      });
    });
  });

  it("resuelve ambos simuladores y conserva progreso/XP al recargar",()=>{
    login();cy.visit("/");
    studentId().then(id=>{
      cy.task<Snapshot>("databaseSnapshot",id).then(before=>{
        for(const game of ["neonflow","tetrilogic"]) {
          const course=game==="neonflow"?"c001":"c002",activity=game==="neonflow"?"act-c001-v2-1":"act-c002-1";
          const lockedActivity = game === "neonflow" ? "act-c001-v2-2" : "act-c002-2";
          const label = game === "neonflow" ? "Neon Flow" : "TetriLogic";
          cy.intercept("POST",`${api}/game-sessions`).as(`previewStart-${game}`);
          cy.viewport(390,844);
          cy.visit(`/simulador/${course}?activity=${lockedActivity}`);
          cy.contains("h1","Nivel bloqueado").should("be.visible");
          cy.get(`[aria-label="Vista previa de ${label}"]`,{timeout:15000}).within(() => {
            cy.get(`[aria-label="Tablero ${label}"]`).should("be.visible");
            cy.get("button:not(:disabled), [draggable='true']").should("not.exist");
          });
          cy.get(`@previewStart-${game}.all`).should("have.length",0);
          cy.document().then(doc=>expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth+1));
          cy.screenshot(`locked-preview-${game}-390`);
          cy.csrfRequest({method:"POST",url:`${api}/game-sessions`,failOnStatusCode:false,body:{
            studentId:id,clientSessionId:crypto.randomUUID(),game,levelTemplate:`${game}-${game === "neonflow" ? "v3" : "v2"}-2`,activityId:lockedActivity,
          }}).its("status").should("eq",400);
          cy.viewport(1440,1000);
          cy.visit(`/simulador/${course}?activity=${activity}`);
          cy.task<Placement[]>("officialWitness",game).then(placements=>completeBoard(game,placements));
          if (game === "neonflow") {
            cy.contains("button","Espejo 90°").click();
            cy.get('button[aria-label="Celda vacía, fila 1, columna 2"]').click();
            cy.get('button[aria-label^="Rotar espejo, fila 1, columna 2"]').should("be.visible");
          }
          cy.contains("button","Siguiente reto").click();
          cy.location("search").should("eq",`?activity=${lockedActivity}`);
          cy.get(`[aria-label="Tablero ${label}"] button:not(:disabled)`,{timeout:15000}).should("exist");
        }
        cy.task<Snapshot>("databaseSnapshot",id).then(after=>{
          expect(after.levels).to.eq(before.levels+2);expect(after.xp).to.eq(before.xp+100);expect(after.xpEntries).to.eq(before.xpEntries+1);
          cy.reload();cy.visit("/perfil");cy.contains("2/60").should("exist");
          cy.task<Snapshot>("databaseSnapshot",id).then(reloaded=>{expect(reloaded.xp).to.eq(after.xp);expect(reloaded.levels).to.eq(after.levels);});
        });
      });
    });
  });

  it("muestra consejos de Neon Flow y conserva el orden al recargar",()=>{
    login();
    studentId().then(id=>{
      cy.task("configureTutorPilot",{studentId:id,game:"neonflow"});
      cy.intercept("POST",`${api}/game-sessions/*/hints`).as("contextualHint");
      cy.viewport(390,844);
      cy.visit("/");
      cy.contains("button","Neon Flow").click();
      cy.get('[role="dialog"]').contains("button","Iniciar").first().click();
      cy.location("search").should("eq","?activity=act-c001-v2-1");
      cy.get('button[aria-label="Celda vacía, fila 1, columna 2"]',{timeout:15000}).should("be.visible");
      cy.contains("button","Filtro green").click();
      cy.get('button[aria-label="Celda vacía, fila 1, columna 2"]').click();
      cy.contains("button","Pista").click();
      const firstTip = "Sigue la dirección del haz desde el emisor y comprueba hacia dónde lo desvía cada espejo.";
      cy.contains("p", firstTip,{timeout:15000}).should("have.text", firstTip);
      cy.focused().should("contain.text", "Pista");
      for (const width of [320,390,768,1440]) {
        cy.viewport(width,900);
        cy.contains(firstTip).should("be.visible");
        cy.document().then(doc=>expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth+1));
        if (width === 390 || width === 1440) cy.screenshot(`consejo-neonflow-${width}`);
      }
      cy.contains(firstTip).parent().find('button[aria-label="Cerrar"]').click();
      cy.focused().should("contain.text", "Pista");
      cy.reload();
      cy.contains("button","Pista").click();
      cy.contains("Un filtro solo deja pasar un haz de su mismo color.").should("be.visible");
      cy.get("@contextualHint.all").should("have.length",0);
      cy.task("tutorSnapshot",{studentId:id,game:"neonflow"}).should("deep.equal",{receipts:0,consumed:0,ruleBased:0,lineHints:0});
      cy.contains("button","Reiniciar").click();
      cy.task<Placement[]>("officialWitness","neonflow").then(placements=>completeBoard("neonflow",placements));
    });
  });

  it("muestra consejos de TetriLogic y permite girar y completar el tablero",()=>{
    login();
    studentId().then(id=>{
      const tutor = { studentId:id, game:"tetrilogic" };
      cy.task("configureTutorPilot",tutor);
      cy.intercept("POST",`${api}/game-sessions/*/hints`).as("tetriHint");
      cy.intercept("POST",`${api}/game-sessions/*/actions`, request => {
        if (request.body.type === "ROTATE" && request.body.pieceId === "i1") request.alias = "rotateAfterHint";
      });
      cy.visit("/simulador/c002?activity=act-c002-1");
      cy.viewport(390,844);
      cy.get('button[aria-label="Seleccionar pieza I (i1)"]',{timeout:15000}).click();
      cy.contains("button",/^Pista$/,{timeout:15000}).click();
      const firstTip = "Compara las casillas ocupadas con el objetivo de cada fila y columna.";
      cy.contains("p", firstTip).should("have.text", firstTip);
      cy.contains("Pistas usadas: 1").should("be.visible");
      cy.focused().should("contain.text", "Pista");
      cy.press("r");
      cy.wait("@rotateAfterHint", { requestTimeout: 3000 }).then(({ request, response }) => {
        expect(request.body.rotation).to.eq(90);
        expect(response?.statusCode).to.eq(200);
      });
      cy.get('button[aria-label="Seleccionar pieza I (i1)"]').find('[data-piece-y="3"]').should("exist");
      cy.contains(firstTip).parent().find('button[aria-label="Cerrar"]').click();
      cy.focused().should("contain.text", "Pista");
      cy.press("r");
      cy.wait("@rotateAfterHint", { requestTimeout: 3000 }).its("request.body.rotation").should("eq", 180);
      cy.document().then(doc=>expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth+1));
      cy.contains("button",/^Pista$/).click();
      cy.contains("Si una fila o columna tiene objetivo cero, déjala vacía.").should("be.visible");
      cy.contains("button",/^Pista$/).click();
      cy.contains("Antes de colocar una pieza, fíjate en cuántas casillas añadirá").should("be.visible");
      cy.contains("Pistas usadas: 3").should("be.visible");
      cy.get("@tetriHint.all").should("have.length",0);
      cy.task("tutorSnapshot",tutor).should("deep.equal",{receipts:0,consumed:0,ruleBased:0,lineHints:0});
      cy.viewport(1440,900);
      cy.contains("button",/^Restablecer$/).click();
      cy.get('[role="dialog"]').should("be.visible");
      cy.press("Escape");
      cy.get('[role="dialog"]').should("not.exist");
      cy.focused().should("contain.text", "Restablecer");
      cy.contains("button",/^Restablecer$/).click();
      cy.contains("button",/^Restablecer tablero$/).click();
      cy.task<Placement[]>("officialWitness","tetrilogic").then(placements=>completeBoard("tetrilogic",placements));
      cy.contains("button",/^Pista$/).should("be.disabled");
      cy.contains("button","Siguiente reto").click();
      cy.location("search").should("eq","?activity=act-c002-2");
    });
  });

  it("completa cinco diarios, conserva 2/5 tras salir y acredita sólo el quinto",()=>{
    login();cy.visit("/");
    studentId().then(id=>{
      cy.request<DailySetDTO>(`${api}/daily-challenges/today/set?studentId=${id}`).then(response=>{
        const daily=response.body;expect(daily.challenges).to.have.length(5);expect(new Set(daily.challenges.map(c=>JSON.stringify(c.config))).size).to.eq(5);
        cy.task<Snapshot>("databaseSnapshot",id).then(before=>{
          cy.contains("a","Iniciar reto diario").click();
          daily.challenges.forEach((challenge,index)=>{
            cy.task("browserCheckpoint",{step:"daily-start",exercise:index+1,game:challenge.game,level:challenge.levelNumber});
            cy.task<Placement[]>("dailyWitness",challenge).then(placements=>completeBoard(challenge.game,placements,true));
            cy.task("browserCheckpoint",{step:"daily-actions-sent",exercise:index+1});
            cy.contains(`${index+1}/5 ejercicios completados`,{timeout:15000}).should("be.visible");
            cy.task<Snapshot>("databaseSnapshot",id).then(saved=>{
              expect(saved.completedDailyExercises).to.eq(index+1);expect(saved.completedDates).to.eq(index===4?1:0);expect(saved.levels).to.eq(before.levels);
              expect(saved.dailyXpEntries).to.eq(index===4?1:0);expect(saved.xp).to.eq(before.xp+(index===4?50:0));
            });
            if(index===1) {
              cy.task("browserCheckpoint",{step:"daily-leave"});
              cy.visit("/");cy.contains("2/5 ejercicios completados").should("be.visible");
              logout();cy.login(learnerEmail,learnerPassword);cy.location("pathname").should("eq","/");cy.contains("2/5 ejercicios completados").should("be.visible");cy.contains("a","Continuar reto diario").click();
              cy.task("browserCheckpoint",{step:"daily-resume"});
            } else if(index<4) {
              cy.contains("button","Continuar con el siguiente ejercicio").click();
            }
          });
          cy.contains("5/5 ejercicios completados").should("be.visible");cy.reload();cy.contains("5/5 ejercicios completados").should("be.visible");
          cy.request<DailySetDTO>(`${api}/daily-challenges/today/set?studentId=${id}`).then(reloaded=>expect(reloaded.body.challenges.map(c=>c.id)).to.deep.eq(daily.challenges.map(c=>c.id)));
        });
      });
    });
  });
  it("asigna y retira estudiantes en un grupo existente sin duplicar progreso",()=>{
    login();cy.visit("/");studentId().then(id=>{
      cy.task<Snapshot>("databaseSnapshot",id).then(before=>{
        cy.task<{idGroup:string;groupName:string}>("createAuditGroup").then(group=>{
          login("admin@pipre.com");cy.visit("/docente/estudiantes");cy.contains("button",group.groupName).click();
          cy.get("#student-search").type(learnerEmail);cy.get('[role="dialog"]').contains("button",learnerEmail).click();
          cy.intercept("POST",`${api}/group-students`).as("assignStudent");cy.contains("button",/^AGREGAR$/).click();cy.wait("@assignStudent").its("response.statusCode").should("eq",201);
          cy.task("membershipCount",{studentId:id,groupId:group.idGroup}).should("eq",1);
          cy.csrfRequest({method:"POST",url:`${api}/group-students`,body:{idGroup:group.idGroup,idStudent:id}}).its("status").should("eq",201);
          cy.task("membershipCount",{studentId:id,groupId:group.idGroup}).should("eq",1);
          cy.get('[role="dialog"]').contains("button",/Remover|Retirar|Quitar/i).click();
          cy.intercept("DELETE",`${api}/group-students/${group.idGroup}/${id}`).as("removeStudent");
          cy.get('[role="dialog"]').last().contains("button",/REMOVER|CONFIRMAR/i).click();
          cy.wait("@removeStudent").its("response.statusCode").should("eq",204);
          cy.task("membershipCount",{studentId:id,groupId:group.idGroup}).should("eq",0);
          cy.task<Snapshot>("databaseSnapshot",id).then(after=>{expect(after.levels).to.eq(before.levels);expect(after.xp).to.eq(before.xp);expect(after.xpEntries).to.eq(before.xpEntries);});
        });
      });
    });
  });

  it("resuelve TetriLogic 7 con puntero real cuando J comparte el origen de otra pieza",()=>{
    login();cy.visit("/");studentId().then(id=>{
      cy.task<Snapshot>("databaseSnapshot",id).then(before=>{
        let completions=0;
        cy.intercept("POST","**/api/v1/game-sessions/*/complete",request=>{
          if(++completions===1)request.headers["x-xsrf-token"]="stale-audit-token";
        }).as("completeTetri");
        cy.visit("/simulador?level=7");
        cy.task<Placement[]>("officialWitness",{game:"tetrilogic",levelNumber:7}).then(placements=>completeBoard("tetrilogic",placements));
        cy.wait("@completeTetri").its("response.body.code").should("eq","CSRF_INVALID");
        cy.wait("@completeTetri").its("response.statusCode").should("eq",200);
        cy.task<Snapshot>("databaseSnapshot",id).then(after=>{
          expect(after.levels).to.eq(before.levels+1);expect(after.victories).to.eq(before.victories+1);
        });
      });
    });
  });

  it("recupera ambos tableros después de recargar y guarda cada victoria una sola vez",()=>{
    login();cy.visit("/");
    studentId().then(id=>cy.task<Snapshot>("databaseSnapshot",id).then(before=>{
    for(const game of ["tetrilogic","neonflow"]) {
      const recovery=`recover-${game}`,move=`move-${game}`;
      cy.intercept({method:"GET",pathname:"/api/v1/game-sessions/active",query:{game,levelTemplate:`${game}-${game === "neonflow" ? "v3" : "v2"}-2`}}).as(recovery);
      cy.intercept("POST","**/api/v1/game-sessions/*/actions").as(move);
      if(game==="tetrilogic") {
        cy.visit("/simulador");
        cy.get('select[aria-label="Seleccionar tablero"]').select("1");
        cy.location("search").should("eq","?level=2");
      } else cy.visit("/simulador/neonflow?level=2");
      cy.wait(`@${recovery}`);
      cy.task<Placement[]>("officialWitness",{game,levelNumber:2}).then(placements=>{
        const first=placements[0];
        if(game==="tetrilogic") {
          cy.get(`button[aria-label$="(${first.id})"]`).click();
          for(let angle=0;angle<(first.rotation??0);angle+=90)cy.get('button[aria-label="Rotar pieza"]').click();
          cy.get(`button[data-cell-x="${first.position.x}"][data-cell-y="${first.position.y}"]`).click();
        } else {
          cy.contains("button","Espejo 90°").click();cy.get(`button[aria-label="Celda vacía, fila ${first.position.y+1}, columna ${first.position.x+1}"]`).click();
          for(let angle=0;angle<(first.rotation??0);angle+=90)cy.get(`button[aria-label^="Rotar espejo, fila ${first.position.y+1}, columna ${first.position.x+1}"]`).click();
        }
        // Wait for the final PLACE acknowledgement; draft rotations may produce earlier requests.
        const committed = game === "neonflow" && first.rotation ? "ROTATE" : "PLACE";
        const waitPlaced=():void=>{cy.wait(`@${move}`).then(({request})=>{if(request.body.type!==committed)waitPlaced();});};waitPlaced();
        cy.reload();cy.wait(`@${recovery}`).then(({response})=>{expect(response?.statusCode).to.eq(200);expect(response?.body.state.pieces).to.have.length(1);});
        if(game==="tetrilogic")cy.get(`aside[aria-label="Bandeja de piezas"] button[aria-label$="(${first.id})"]`).should("not.exist");
        else cy.get(`button[aria-label^="Rotar espejo, fila ${first.position.y+1}, columna ${first.position.x+1}"]`).should("exist");
        completeBoard(game,placements.slice(1));
      });
    }
    cy.task<Snapshot>("databaseSnapshot",id).then(after=>{
      expect(after.victories).to.eq(before.victories+2);expect(after.levels).to.eq(before.levels+2);
      cy.reload();cy.get("main h1").should("be.visible");
      cy.task<Snapshot>("databaseSnapshot",id).then(reloaded=>{expect(reloaded.victories).to.eq(after.victories);expect(reloaded.points).to.eq(after.points);expect(reloaded.xp).to.eq(after.xp);});
    });
    }));
  });


});
