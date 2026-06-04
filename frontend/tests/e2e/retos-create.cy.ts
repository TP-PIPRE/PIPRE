describe("PMV2 — Sistema de Retos CRUD", () => {
  beforeEach(() => {
    cy.setCookie("pipre_token", "fake-jwt");
    cy.setCookie("pipre_user", JSON.stringify({ id: "doc1", name: "Docente", email: "doc@test.com", role: "docente" }));
    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [{ idCourse: "1", name: "Robótica Básica", description: "Curso", level: "BASIC" }],
    }).as("getCourses");
    cy.visit("/cursos");
    cy.wait("@getCourses");
  });

  it("expande retos de un curso desde la página de cursos", () => {
    cy.intercept("GET", "/api/v1/simulations/user/*", {
      statusCode: 200,
      body: [
        { id_simulation: "S1", result: JSON.stringify({ type: "challenge", courseId: "1", title: "Reto 1", order: 1, difficulty: "EASY", points: 50 }) },
      ],
    }).as("getSims");

    cy.contains("Retos del Curso").click();
    cy.wait("@getSims");
    cy.contains("Reto 1").should("be.visible");
  });

  it("navega a la gestión de retos desde la página de cursos", () => {
    cy.visit("/docente/retos");
    cy.url().should("include", "/docente/retos");
    cy.contains("Gestión de").should("be.visible");
  });
});
