import {apiFixtures,user,activity} from "./ui-fixtures";
function field(label:string){return cy.contains("label",new RegExp(`^${label}$`)).invoke("attr","for").then(id=>cy.get(`#${id}`));}
describe("Editor de retos — payload y compatibilidad",()=>{
  beforeEach(()=>{apiFixtures();user("docente");cy.visit("/docente/retos");cy.contains("button",/^Retos$/).click();cy.contains("Actividad QA").should("exist");});
  it("edita un reto mediante PUT preservando lección y tablero",()=>{
    cy.intercept("PUT","**/api/v1/activities/a1",{statusCode:200,body:""}).as("save");cy.contains("button",/^Editar$/).click();
    field("Título").clear().type("Actividad editada");cy.contains("button",/^Guardar Cambios$/i).click();
    cy.wait("@save").its("request.body").should("include",{name:"Actividad editada",idLesson:"l1",levelTemplate:activity.levelTemplate});
  });
  it("crea un reto admitiendo respuesta 201 sin DTO",()=>{
    cy.intercept("POST","**/api/v1/activities",{statusCode:201,body:""}).as("create");cy.contains("button","Nuevo Reto").click();
    field("Título").type("Actividad nueva");field("Lección").should("have.value","l1");cy.contains("button",/^Crear Reto$/i).click();
    cy.wait("@create").its("request.body").should("include",{name:"Actividad nueva",idLesson:"l1"});cy.contains("Retos Existentes").should("be.visible");
  });
});
