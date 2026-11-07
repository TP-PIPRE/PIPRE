import {apiFixtures,user} from "./ui-fixtures";
describe("Paneles docentes — sin métricas inventadas",()=>{
  beforeEach(()=>{apiFixtures();user("docente");});
  it("abre el dashboard y mantiene la gestión accesible",()=>{cy.visit("/docente/dashboard");cy.get("h1").should("be.visible");cy.contains("Estudiantes").should("exist");});
  it("muestra puntaje y XP separados de los niveles verificados",()=>{cy.visit("/docente/metricas");cy.contains("Puntajes y progreso verificados").should("be.visible");cy.contains("0/30").should("exist");});
  it("conserva los contratos históricos sin usarlos como puntaje del ranking",()=>{
    cy.intercept("GET","**/api/v1/activity-results/user/*",[{idResult:"r1",idActivity:"a1",score:999999}]).as("legacyGrades");
    cy.visit("/docente/metricas");cy.contains("Puntajes y progreso verificados").should("be.visible");cy.get("@legacyGrades.all").should("have.length",0);cy.contains("999999").should("not.exist");
  });
});
