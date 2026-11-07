import {apiFixtures,user,page} from "./ui-fixtures";
describe("Inicio — estados reales",()=>{
  beforeEach(()=>{apiFixtures();});
  it("presenta catálogo y diario como fuentes separadas",()=>{user();cy.visit("/");cy.contains("Mis cursos").should("be.visible");cy.contains("Reto diario").should("be.visible");cy.contains("Curso QA").should("be.visible");});
  it("distingue catálogo vacío de error",()=>{user();cy.intercept("GET","**/api/v1/courses*",page([]));cy.visit("/");cy.contains("Todavía no hay cursos disponibles").should("be.visible");cy.contains("No pudimos cargar los cursos").should("not.exist");});
  it("permite cerrar el selector de actividades con Escape",()=>{user();cy.visit("/");cy.contains("button","Curso QA").click();cy.get('[role="dialog"]').should("be.visible");cy.get("body").type("{esc}");cy.get('[role="dialog"]').should("not.exist");});
  it("redirige una sesión ausente al login",()=>{cy.clearCookies();cy.visit("/");cy.location("pathname").should("eq","/login");});
});
