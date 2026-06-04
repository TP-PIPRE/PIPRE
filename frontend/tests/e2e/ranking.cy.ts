describe("PMV2 — Ranking", () => {
  beforeEach(() => {
    cy.setCookie("pipre_token", "fake-jwt");
    cy.setCookie("pipre_user", JSON.stringify({ id: "stu1", name: "Test", email: "test@test.com", role: "estudiante" }));
  });

  it("carga y muestra el ranking desde la API", () => {
    cy.intercept("GET", "/api/v1/group-students/group-1", {
      statusCode: 200,
      body: [
        { idStudent: "STU001", totalPoints: 12500, position: 1 },
        { idStudent: "STU002", totalPoints: 11800, position: 2 },
        { idStudent: "STU003", totalPoints: 11250, position: 3 },
        { idStudent: "STU004", totalPoints: 10900, position: 4 },
        { idStudent: "STU005", totalPoints: 10450, position: 5 },
      ],
    }).as("getRanking");

    cy.visit("/ranking");
    cy.wait("@getRanking");

    cy.contains("Comunidad & Ranking").should("be.visible");
    cy.contains("Global").should("be.visible");
    cy.contains("Por Curso").should("be.visible");
  });

  it("usa fallback mock cuando la API de ranking falla", () => {
    cy.intercept("GET", "/api/v1/group-students/group-1", {
      statusCode: 500,
    }).as("getRankingFail");

    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [{ idCourse: "1", name: "Robótica" }],
    }).as("getCourses");

    cy.visit("/ranking");
    cy.wait("@getRankingFail");
    cy.wait("@getCourses");

    // Should show mock data
    cy.contains("Ana Sofía Lopez").should("be.visible");
    cy.contains("Carlos Ruiz").should("be.visible");
  });

  it("alterna entre tabs Global y Por Curso", () => {
    cy.intercept("GET", "/api/v1/group-students/group-1", {
      statusCode: 200,
      body: [
        { idStudent: "STU001", totalPoints: 12500, position: 1 },
        { idStudent: "STU002", totalPoints: 11800, position: 2 },
      ],
    }).as("getRanking");

    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [{ idCourse: "1", name: "Robótica Básica" }],
    }).as("getCourses");

    cy.visit("/ranking");
    cy.wait("@getRanking");
    cy.wait("@getCourses");

    cy.contains("Global").should("have.class", "text-primary");
    cy.contains("Por Curso").click();
    cy.contains("Por Curso").should("have.class", "text-primary");

    cy.get("select").should("be.visible");
    cy.contains("Robótica Básica").should("exist");
  });
});
