describe("PMV1 — Página de Inicio", () => {
  beforeEach(() => {
    cy.setCookie("pipre_token", "fake-jwt");
    cy.setCookie("pipre_user", JSON.stringify({ id: "stu1", name: "Test", email: "test@test.com", role: "estudiante" }));
    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [
        { idCourse: "1", name: "Robótica Nivel 1", description: "Curso", level: "BASIC" },
      ],
    }).as("getCourses");
    cy.visit("/");
    cy.wait("@getCourses");
  });

  it("muestra demo retos y cursos cargados", () => {
    cy.contains("Introducción a la Robótica").should("be.visible");
    cy.contains("Navegación Autónoma").should("be.visible");
    cy.contains("Brazo Robótico v2").should("be.visible");
    cy.contains("Robótica Nivel 1").should("be.visible");
  });

  it("filtra por categoría Cursos", () => {
    cy.contains("button", "Cursos").click();
    cy.contains("Introducción a la Robótica").should("be.visible");
    cy.contains("Navegación Autónoma").should("not.exist");
    cy.contains("Robótica Nivel 1").should("be.visible");
  });

  it("filtra por categoría Simuladores", () => {
    cy.contains("button", "Simuladores").click();
    cy.contains("Introducción a la Robótica").should("not.exist");
    cy.contains("Navegación Autónoma").should("be.visible");
    cy.contains("Brazo Robótico v2").should("be.visible");
  });

  it("redirige al login cuando no hay sesión activa", () => {
    cy.clearCookie("pipre_token");
    cy.clearCookie("pipre_user");
    cy.visit("/cursos");
    cy.url().should("include", "/login");
    cy.contains("Acceso al Nodo").should("be.visible");
  });
});
