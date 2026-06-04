describe("Data Masiva — Rendimiento con grandes volúmenes", () => {
  beforeEach(() => {
    cy.setCookie("pipre_token", "fake-jwt");
    cy.setCookie("pipre_user", JSON.stringify({ id: "user-massive", name: "Massive", email: "test@test.com", role: "docente" }));
  });

  it("renderiza +100 simulaciones sin crashear (página de retos)", () => {
    const massiveSimulations = Array.from({ length: 150 }, (_, i) => ({
      id_simulation: `S${i}`,
      result: JSON.stringify({
        type: "challenge",
        courseId: "1",
        title: `Reto Masivo ${i + 1}`,
        description: `Descripción del reto ${i + 1}`,
        order: i + 1,
        difficulty: i % 3 === 0 ? "EASY" : i % 3 === 1 ? "MEDIUM" : "HARD",
        points: (i + 1) * 10,
        deleted: false,
      }),
    }));

    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [{ idCourse: "1", name: "Curso Masivo", description: "Test", level: "BASIC" }],
    }).as("getCourses");

    cy.intercept("GET", "/api/v1/simulations/user/user-massive", {
      statusCode: 200,
      body: massiveSimulations,
    }).as("getMassiveSims");

    cy.visit("/docente/retos");
    cy.wait("@getCourses");

    // Click "Retos" button on the course card to trigger challenge loading
    cy.contains("button", "Retos").click();
    cy.wait("@getMassiveSims");

    // Just verify the page rendered without crash
    cy.contains("Reto Masivo 1").should("be.visible");
  });

  it("renderiza +1000 rankings sin crashear", () => {
    cy.setCookie("pipre_user", JSON.stringify({ id: "stu1", name: "Test", email: "test@test.com", role: "estudiante" }));

    const massiveRankings = Array.from({ length: 1000 }, (_, i) => ({
      idStudent: `STU${String(i + 1).padStart(4, "0")}`,
      totalPoints: Math.floor(Math.random() * 15000) + 500,
      position: i + 1,
    }));

    cy.intercept("GET", "/api/v1/group-students/group-1", {
      statusCode: 200,
      body: massiveRankings,
    }).as("getMassiveRanking");

    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [{ idCourse: "1", name: "Curso Test" }],
    }).as("getCourses");

    cy.visit("/ranking");
    cy.wait("@getMassiveRanking");
    cy.wait("@getCourses");

    cy.contains("Comunidad & Ranking").should("be.visible");
    cy.contains("1000 estudiantes").should("be.visible");
  });

  it("renderiza +500 retos en CursosPage sin crashear", () => {
    cy.setCookie("pipre_user", JSON.stringify({ id: "stu1", name: "Test", email: "test@test.com", role: "estudiante" }));

    const massiveChallenges = Array.from({ length: 500 }, (_, i) => ({
      id_simulation: `S${i}`,
      result: JSON.stringify({
        type: "challenge",
        courseId: "1",
        title: `Reto ${i + 1}`,
        order: i + 1,
        difficulty: "EASY",
        points: 10,
      }),
    }));

    cy.intercept("GET", "/api/v1/courses", {
      statusCode: 200,
      body: [{ idCourse: "1", name: "Curso con 500 Retos", description: "Test", level: "BASIC" }],
    }).as("getCourses");

    cy.intercept("GET", "/api/v1/simulations/user/*", {
      statusCode: 200,
      body: massiveChallenges,
    }).as("getMassiveChallenges");

    cy.visit("/cursos");
    cy.wait("@getCourses");

    cy.contains("Retos del Curso").click();
    cy.wait("@getMassiveChallenges");

    cy.contains("500 retos disponibles").should("be.visible");
    cy.contains("Reto 1").should("be.visible");
    cy.contains("Reto 500").should("be.visible");
  });
});
