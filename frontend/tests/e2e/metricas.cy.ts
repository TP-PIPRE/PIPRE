describe("Métricas — Dashboard Docente", () => {
  beforeEach(() => {
    cy.setCookie("pipre_token", "fake-jwt");
    cy.setCookie("pipre_user", JSON.stringify({ id: "docente-1", name: "Docente", email: "docente@test.com", role: "docente" }));

    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [{ idCourse: "1", name: "Robótica Nivel 1" }],
    }).as("getCourses");
  });

  it("carga la página de dashboard docente", () => {
    cy.visit("/docente/dashboard");

    cy.contains("Retos Activos").should("be.visible");
    cy.contains("Estudiantes").should("be.visible");
  });

  it("carga la página de métricas", () => {
    cy.intercept("GET", "/api/v1/dropout-risk/*", {
      statusCode: 200,
      body: { risk_level: "low", performance: "good", motivation_level: "high" },
    }).as("getRisk");

    cy.intercept("GET", "/api/v1/help-requests/*", {
      statusCode: 200,
      body: { times_requested: 5, ai_interactions: 3 },
    }).as("getHelp");

    cy.visit("/docente/metricas");

    cy.contains("Métricas", { matchCase: false }).should("be.visible");
  });
});
