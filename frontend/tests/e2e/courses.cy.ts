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
  it("marca el nivel bloqueado con un candado e impide abrirlo por enlace directo",()=>{
    cy.viewport(390,844);
    cy.intercept("GET","**/api/v1/activities/lesson/*",page([{...activity,levelTemplate:"neonflow-v2-2"}]));
    cy.intercept("GET","**/api/v1/neonflow/templates/neonflow-v2-2",{statusCode:503}).as("lockedBoard");
    cy.visit("/");cy.contains("button","Curso QA").click();
    cy.get('[role="dialog"]').within(()=>{
      cy.contains("p","Nivel 2").find("svg.lucide-lock-keyhole").should("be.visible");
      cy.contains("p","Bloqueado").should("be.visible")
        .closest(".border-dashed").should("have.css","border-style","dashed").and("have.css","opacity","1");
      cy.contains("button",/Iniciar|Vista previa/).should("not.exist");
    });
    cy.visit("/simulador/c001?activity=a1");
    cy.contains("h1","Nivel bloqueado").should("be.visible");
    cy.get("option[value='a1']").should("be.disabled");
    cy.get("@lockedBoard.all").should("have.length",0);
  });
});
