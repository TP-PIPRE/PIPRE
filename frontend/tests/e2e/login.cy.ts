import {apiFixtures} from "./ui-fixtures";
describe("Acceso — DTO y formularios vigentes",()=>{
  beforeEach(()=>{apiFixtures();cy.visit("/login");});
  it("muestra campos accesibles y validación HTML",()=>{
    cy.contains("Bienvenido de nuevo").should("be.visible");cy.get('input[name="email"]').should("have.attr","type","email");
    cy.get('input[name="password"]').should("have.attr","autocomplete","current-password");
    cy.get('button[type="submit"]').click();cy.get('input[name="email"]').then($field=>expect(($field[0] as HTMLInputElement).validity.valueMissing).to.eq(true));
  });
  it("alterna registro y acceso sin exigir campos ajenos al DTO",()=>{
    cy.contains("button","Regístrate aquí").click();cy.contains("Crea tu cuenta").should("be.visible");
    for(const name of ["firstName","lastName","age","grade"])cy.get(`input[name="${name}"]`).should("be.visible");
    cy.contains("button","¿Ya tienes cuenta?").click();cy.contains("Bienvenido de nuevo").should("be.visible");
  });
  it("registra con respuesta 201 vacía y mantiene el acceso disponible",()=>{
    cy.intercept("POST","**/api/v1/users",{statusCode:201,body:""}).as("createUser");
    cy.register({firstName:"QA",lastName:"Student",email:"qa@test.invalid",password:"Test-only-123",age:16,grade:"QA"});
    cy.wait("@createUser").its("request.body").should("include",{firstName:"QA",email:"qa@test.invalid"});cy.contains("Tu cuenta está lista").should("be.visible");
  });
  it("consume el objeto user del servidor sin decodificar un JWT cliente",()=>{
    cy.intercept("POST","**/api/v1/auth/login",{statusCode:200,body:{message:"OK",user:{idUser:"qa-student",email:"qa@test.invalid",firstName:"QA",role:"STUDENT"}}});
    cy.get('input[name="email"]').type("qa@test.invalid");cy.get('input[name="password"]').type("Test-only-123",{log:false});cy.get('button[type="submit"]').click();
    cy.location("pathname").should("eq","/");cy.getCookie("pipre_token").should("be.null");
  });
  it("anuncia credenciales inválidas y permite corregirlas",()=>{
    cy.intercept("POST","**/api/v1/auth/login",{statusCode:401,body:{message:"Credenciales inválidas"}});
    cy.get('input[name="email"]').type("qa@test.invalid");cy.get('input[name="password"]').type("wrong",{log:false});cy.get('button[type="submit"]').click();
    cy.get('[role="alert"]').should("contain","Credenciales inválidas");cy.get('button[type="submit"]').should("be.enabled");
  });
});
