import {apiFixtures,user,page,course,activity} from "./ui-fixtures";
describe("Catálogo — contrato vigente",()=>{
  beforeEach(()=>{apiFixtures();user();});
  it("muestra únicamente los cursos oficiales de la API",()=>{
    cy.intercept("GET","**/api/v1/courses*",page([course,{...course,idCourse:"c002",name:"Segundo curso QA"},{...course,idCourse:"legacy",name:"Curso eliminado"}]));
    cy.visit("/");cy.contains("Curso QA").should("be.visible");cy.contains("Segundo curso QA").should("be.visible");cy.contains("Curso eliminado").should("not.exist");
  });
  it("presenta el error sin inventar un catálogo de sustitución",()=>{
    cy.intercept("GET","**/api/v1/courses*",{statusCode:503});cy.visit("/");
    cy.contains("No pudimos cargar los cursos").should("be.visible");cy.contains("button","Reintentar").should("be.enabled");cy.contains("Curso QA").should("not.exist");
  });
  it("resuelve curso, módulo, lección y actividad persistida",()=>{
    cy.visit("/");cy.contains("button","Curso QA").click();
    cy.get('[role="dialog"]').contains("Actividad QA").should("be.visible");cy.get('[role="dialog"]').contains("button","Iniciar").click();
    cy.location("pathname").should("eq","/simulador/c001");cy.location("search").should("contain","activity=a1");
  });
  it("muestra la vista previa de un nivel bloqueado sin iniciar una partida",()=>{
    cy.viewport(390,844);
    cy.intercept("GET","**/api/v1/activities/lesson/*",page([{...activity,levelTemplate:"neonflow-v2-2"}]));
    const template = "neonflow-v2-2";
    cy.readFile("src/shared/constants/neonFlowCatalog.json").then((catalog) => {
      cy.intercept("GET",`**/api/v1/neonflow/templates/${template}`, { templateId: template, version: 2, config: catalog[1] }).as("lockedBoard");
    });
    cy.intercept({ method: "GET", url: `**/api/v1/neonflow/templates/${template}`, times: 1 }, { statusCode: 503 }).as("failedBoard");
    cy.intercept("POST", "**/api/v1/game-sessions*").as("previewStart");
    cy.visit("/");cy.contains("button","Curso QA").click();
    cy.get('[role="dialog"]').within(()=>{
      cy.contains("p","Nivel 2").find("svg.lucide-lock-keyhole").should("be.visible");
      cy.contains("p","Bloqueado").should("be.visible")
        .closest(".border-dashed").should("have.css","border-style","dashed").and("have.css","opacity","1");
      cy.contains("button","Iniciar").should("not.exist");
      cy.contains("button","Vista previa").click();
    });
    cy.contains("h1","Nivel bloqueado").should("be.visible");
    cy.contains("h2","Actividad QA").should("be.visible");
    cy.get("option[value='a1']").should("not.be.disabled");
    cy.wait("@failedBoard");
    cy.contains("No pudimos cargar el tablero").should("be.visible");
    cy.contains("button",/^Reintentar$/).click();
    cy.wait("@lockedBoard");
    cy.get('[aria-label="Vista previa de Neon Flow"]').within(() => {
      cy.get('[aria-label="Tablero Neon Flow"]').should("be.visible");
      cy.contains("button", "Espejo 90°").should("be.disabled");
      cy.get('[draggable="true"]').should("not.exist");
    });
    cy.get("@previewStart.all").should("have.length",0);
  });
});
