import {apiFixtures,user} from "./ui-fixtures";
describe("Ranking — datos y errores",()=>{
  beforeEach(()=>{apiFixtures();user("docente");});
  it("muestra los estudiantes y saldos recibidos",()=>{cy.visit("/ranking");cy.contains("Estudiante QA").should("be.visible");cy.contains("10").should("exist");});
  it("anuncia una API fallida sin inventar puestos o estudiantes",()=>{cy.intercept("GET","**/api/v1/group-students/*",{statusCode:503});cy.visit("/ranking");cy.get('[role="alert"]').should("contain","No pudimos cargar el ranking");cy.contains("Estudiante QA").should("not.exist");});
  it("alterna consultas global, curso y grupo",()=>{cy.visit("/ranking");cy.contains("button","Por Curso").click();cy.get('[aria-label="Filtrar por curso"]').should("have.value","c1");cy.contains("button","Por Grupos").click();cy.get('[aria-label="Filtrar por grupo"]').should("have.value","g1");cy.contains("Estudiante QA").should("be.visible");});
});
