describe("PMV1 — Componentes del Simulador", () => {
  beforeEach(() => {
    cy.setCookie("pipre_token", "fake-jwt");
    cy.setCookie("pipre_user", JSON.stringify({ id: "stu1", name: "Test", email: "test@test.com", role: "estudiante" }));
    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [{ idCourse: "1", name: "Robótica Básica", description: "Curso", level: "BASIC" }],
    }).as("getCourses");

    cy.intercept("GET", "/api/v1/simulations/user/*", {
      statusCode: 200,
      body: [{
        id_simulation: "S1",
        result: JSON.stringify({
          type: "challenge", courseId: "1", title: "Demo",
          missions: [{ id: "m1", title: "Misión 1", objective: "Avanza 3 pasos", maxBlocks: 5 }],
          environment: "battle", maxBlocks: 10,
        }),
      }],
    }).as("getSimulations");

    cy.visit("/simulador/1");
    cy.wait("@getSimulations");
  });

  it("carga el toolbox con bloques de movimiento", () => {
    cy.contains("AVANZAR(30)").should("be.visible");
    cy.contains("ROTAR(90)").should("be.visible");
  });

  it("carga el panel de hardware", () => {
    cy.contains("Puerto de Ensamblaje").should("be.visible");
    cy.contains("Orugas de Combate").should("be.visible");
  });

  it("carga el panel de misiones", () => {
    cy.contains("Panel de Misiones").should("be.visible");
  });

  it("carga el viewport 3D", () => {
    cy.get("canvas").should("exist");
  });

  it("permite interactuar con la consola", () => {
    cy.contains("Terminal de Datos").should("be.visible");
  });
});
