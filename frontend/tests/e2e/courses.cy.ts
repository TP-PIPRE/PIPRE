import {apiFixtures,user,page,course} from "./ui-fixtures";
describe("Catálogo — contrato vigente",()=>{
  beforeEach(()=>{apiFixtures();user();});
  it("muestra cursos paginados desde la API",()=>{
    cy.intercept("GET","**/api/v1/courses*",page([course,{...course,idCourse:"c2",name:"Segundo curso QA"}]));
    cy.visit("/");cy.contains("Curso QA").should("be.visible");cy.contains("Segundo curso QA").should("be.visible");
  });
  it("presenta el error sin inventar un catálogo de sustitución",()=>{
    cy.intercept("GET","**/api/v1/courses*",{statusCode:503});cy.visit("/");
    cy.contains("No pudimos cargar los cursos").should("be.visible");cy.contains("button","Reintentar").should("be.enabled");cy.contains("Curso QA").should("not.exist");
  });
  it("resuelve curso, módulo, lección y actividad persistida",()=>{
    cy.visit("/");cy.contains("button","Curso QA").click();
    cy.get('[role="dialog"]').contains("Actividad QA").should("be.visible");cy.get('[role="dialog"]').contains("button","Iniciar").click();
    cy.location("pathname").should("eq","/simulador/c1");cy.location("search").should("contain","activity=a1");
  });
});
