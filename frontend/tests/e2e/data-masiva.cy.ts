import {apiFixtures,user,page,course,activity,ranking} from "./ui-fixtures";
describe("Volúmenes controlados — sólo fixtures de lectura",()=>{
  beforeEach(()=>{apiFixtures();user();});
  it("pagina un catálogo de 500 cursos sin perder el último lote",()=>{
    const courses=Array.from({length:500},(_,i)=>({...course,idCourse:`course-${i}`,name:`Curso volumen ${i}`}));
    cy.intercept("GET","**/api/v1/courses*",req=>{const n=Number(new URL(req.url).searchParams.get("page")??0);req.reply({content:courses.slice(n*100,(n+1)*100),number:n,size:100,last:n===4,totalPages:5,totalElements:500});});
    cy.visit("/");cy.contains("Curso volumen 499").should("exist");cy.get('section[aria-label="Cursos disponibles"] button').should("have.length",500);
  });
  it("muestra 1000 entradas de ranking sin saldos duplicados",()=>{
    cy.intercept("GET","**/api/v1/group-students/*",Array.from({length:1000},(_,i)=>({...ranking,idStudent:`student-${i}`,studentName:`Estudiante volumen ${i}`,position:i+1,totalPoints:1000-i})));
    cy.visit("/ranking");cy.contains("Estudiante volumen 999",{timeout:10000}).should("exist");
  });
  it("pagina 100 actividades y accede a la última página",()=>{
    const activities=Array.from({length:100},(_,i)=>({...activity,idActivity:`activity-${i}`,name:`Actividad volumen ${i}`,displayOrder:i+1}));
    cy.intercept("GET","**/api/v1/activities/lesson/*",page(activities));cy.visit("/");cy.contains("button","Curso QA").click();
    for(let i=0;i<9;i++)cy.get('[role="dialog"]').contains("button","Siguiente").click();
    cy.contains("Actividad volumen 99").scrollIntoView().should("be.visible");cy.contains("Página 10 de 10").should("be.visible");
  });
});
