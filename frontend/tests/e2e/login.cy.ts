describe("PMV1 — Gestión de Usuarios", () => {
  const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ";

  beforeEach(() => {
    cy.visit("/login");
  });

  it("muestra el formulario de login por defecto", () => {
    cy.contains("Acceso al Nodo").should("be.visible");
    cy.get('input[name="email"]').should("be.visible");
    cy.get('input[name="password"]').should("be.visible");
    cy.contains("IDENTIFICARSE").should("be.visible");
    cy.contains("¿No tienes cuenta? Regístrate aquí").should("be.visible");
  });

  it("alterna entre login y registro", () => {
    cy.contains("¿No tienes cuenta? Regístrate aquí").click();
    cy.contains("Registro de Estudiante").should("be.visible");
    cy.get('input[name="firstName"]').should("be.visible");
    cy.get('input[name="lastName"]').should("be.visible");
    cy.get('input[name="age"]').should("be.visible");
    cy.get('input[name="grade"]').should("be.visible");
    cy.get('input[name="institution"]').should("be.visible");
    cy.get('input[name="zone"]').should("be.visible");
    cy.contains("REGISTRARSE").should("be.visible");

    cy.contains("¿Ya tienes cuenta? Inicia sesión").click();
    cy.contains("Acceso al Nodo").should("be.visible");
  });

  it("registra un usuario y muestra mensaje de éxito", () => {
    cy.intercept("POST", "/api/v1/users", {
      statusCode: 201,
      body: UUID,
    }).as("registerUser");

    cy.contains("¿No tienes cuenta? Regístrate aquí").click();

    cy.get('input[name="firstName"]').type("Juan");
    cy.get('input[name="lastName"]').type("Pérez");
    cy.get('input[name="age"]').type("15");
    cy.get('input[name="grade"]').type("9°");
    cy.get('input[name="institution"]').type("Instituto Técnico");
    cy.get('input[name="zone"]').type("Zona Norte");
    cy.get('input[name="email"]').type("juan@test.com");
    cy.get('input[name="password"]').type("password123");

    cy.contains("REGISTRARSE").click();
    cy.wait("@registerUser");

    cy.contains("Nodo de usuario creado").should("be.visible");
    cy.contains("Acceso al Nodo").should("be.visible");
  });

  it("inicia sesión exitosamente", () => {
    cy.intercept("POST", "/api/v1/auth/login", {
      statusCode: 200,
      body: JWT,
    }).as("loginUser");

    cy.get('input[name="email"]').type("juan@test.com");
    cy.get('input[name="password"]').type("password123");
    cy.contains("IDENTIFICARSE").click();

    cy.wait("@loginUser");
    cy.url().should("not.include", "/login");
  });

  it("muestra error con credenciales inválidas", () => {
    cy.intercept("POST", "/api/v1/auth/login", {
      statusCode: 401,
      body: { message: "Credenciales inválidas" },
    }).as("loginFail");

    cy.get('input[name="email"]').type("invalido@test.com");
    cy.get('input[name="password"]').type("wrong");
    cy.contains("IDENTIFICARSE").click();

    cy.wait("@loginFail");
    cy.contains("Credenciales inválidas").should("be.visible");
  });
});
