describe("PMV1 — Visualizar Cursos", () => {
  beforeEach(() => {
    cy.setCookie("pipre_token", "fake-jwt");
    cy.setCookie("pipre_user", JSON.stringify({ id: "stu1", name: "Test", email: "test@test.com", role: "estudiante" }));
  });

  it("carga y muestra cursos desde la API", () => {
    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [
        { idCourse: "1", name: "Robótica Nivel 1", description: "Curso básico", level: "BASIC" },
        { idCourse: "2", name: "Microcontroladores", description: "Curso intermedio", level: "INTERMEDIATE" },
        { idCourse: "3", name: "Diseño Mecánico", description: "Curso avanzado", level: "ADVANCED" },
      ],
    }).as("getCourses");

    cy.visit("/cursos");
    cy.wait("@getCourses");

    cy.contains("Robótica Nivel 1").should("be.visible");
    cy.contains("Microcontroladores").should("be.visible");
    cy.contains("Diseño Mecánico").should("be.visible");
  });

  it("usa fallback mock cuando la API falla", () => {
    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 500,
    }).as("getCoursesFail");

    cy.visit("/cursos");
    cy.wait("@getCoursesFail");

    cy.contains("Robótica Nivel 1: Fundamentos").should("be.visible");
    cy.contains("Programación de Microcontroladores").should("be.visible");
  });

  it("muestra retos de un curso al hacer clic", () => {
    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [{ idCourse: "1", name: "Robótica Básica", description: "Curso", level: "BASIC" }],
    }).as("getCourses");

    cy.intercept("GET", "/api/v1/simulations/user/*", {
      statusCode: 200,
      body: [
        { id_simulation: "S1", result: JSON.stringify({ type: "challenge", courseId: "1", title: "Reto 1", order: 1, difficulty: "EASY", points: 50 }) },
        { id_simulation: "S2", result: JSON.stringify({ type: "challenge", courseId: "1", title: "Reto 2", order: 2, difficulty: "MEDIUM", points: 100 }) },
      ],
    }).as("getSimulations");

    cy.visit("/cursos");
    cy.wait("@getCourses");

    cy.contains("Retos del Curso").click();
    cy.wait("@getSimulations");

    cy.contains("Reto 1").should("be.visible");
    cy.contains("Reto 2").should("be.visible");
    cy.contains("2 retos disponibles").should("be.visible");
  });
});
