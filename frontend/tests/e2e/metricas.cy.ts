import { apiFixtures, user } from "./ui-fixtures";
import type { MetricsReport } from "../../src/infrastructure/api/models/educationalMetricsModels";

const dimensions = ["Análisis lógico", "Resolución de problemas", "Reconocimiento de patrones"];
const report: MetricsReport = {
  from: "2026-11-01", to: "2026-11-11", bucket: "day",
  summary: { students: 1, active: 1, stars: 3, averageStars: 3, achievements: 1, averageAchievements: 1,
    initiated: 2, completed: 1, completionRate: 50, averageAttempts: 2, sessions: 3, successfulSessions: 1,
    averageSessionSeconds: 180, studentsWithProgress: 1, studentsCompletingInPeriod: 1, completedStudentRate: 100, averageActiveDays: 2 },
  courses: [{ game: "tetrilogic", name: "TetriLogic", sessions: 3, initiated: 2, completed: 1, students_with_progress: 1, active: 1, progress: 100 / 30 }],
  comparisons: [{ kind: "classroom", id: "g1", name: "Aula QA", students: 1, active: 1, stars: 3, average_stars: 3,
    achievements: 1, average_achievements: 1, completed: 1, initiated: 2, completion_rate: 50 }],
  students: [{ id: "qa-student", name: "Estudiante QA", grade: "3.°", days: 2, stars: 3, achievements: 1,
    sessions: 3, initiated: 2, completed: 1, advice: 2, completionRate: 50, averageAttempts: 2, averageSessionSeconds: 180,
    neonflowLevels: 0, tetrilogicLevels: 1 }],
  timeline: [{ day: "2026-11-11", game: "tetrilogic", sessions: 3, solved: 1, active: 1 }],
  dimensions: dimensions.map(dimension => ({ dimension, initiated: 0, solved: 0, completion_rate: null,
    average_attempts: null, average_stars: null, solved_per_student: null, average_seconds: null, timeline: [], comparisons: [] })),
  unclassifiedAttempts: 1,
  tutor: { total: 2, average: 2, fixed: 1, generated: 1, contextual: 0, unclassified: 0, extra: 0,
    studentsUsingAi: 1, aiStudentRate: 100, studentsOverFreeLimit: 0, victories: [] },
  starDistribution: [{ stars: 3, count: 1 }], achievementDistribution: [{ achievements: 1, count: 1 }],
};

function metricsFixtures(institution: boolean) {
  cy.intercept("GET", "**/api/v1/educational-metrics/options", {
    institution, groups: [{ id: "g1", name: "Aula QA" }],
    students: [{ id: "qa-student", name: "Estudiante QA", grade: "3.°", groups: ["g1"] }],
  });
  cy.intercept({ method: "GET", pathname: "/api/v1/educational-metrics" }, report).as("metrics");
}

describe("Métricas educativas", () => {
  beforeEach(() => apiFixtures());

  it("mantiene la gestión docente y retira el dashboard independiente de IA", () => {
    user("docente");
    cy.visit("/docente/dashboard");
    cy.contains("h1", "Panel docente").should("be.visible");
    cy.contains("a", "Ver métricas educativas").should("be.visible");
    cy.contains(/Dashboard de Resultados IA/i).should("not.exist");
  });

  it("aplica filtros juntos y mantiene la sección seleccionada", () => {
    user("docente"); metricsFixtures(false);
    cy.visit("/docente/metricas");
    cy.wait("@metrics");
    cy.contains("dt", "Tasa de finalización").siblings("dd").should("have.text", "50 %");
    for (const width of [320, 390, 768, 1440]) {
      cy.viewport(width, 900);
      cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth + 1));
    }
    cy.screenshot("metricas-educativas-1440", { capture: "viewport" });
    cy.contains("button", "Pensamiento lógico").click();
    cy.get('form[aria-label="Filtros de métricas"]').within(() => {
      cy.contains("label", /^Aula/).find("select").select("g1");
      cy.contains("label", /^Grado/).find("select").select("3.°");
      cy.contains("label", /^Curso/).find("select").select("tetrilogic");
      cy.contains("label", /^Estudiante/).find("select").select("qa-student");
      cy.contains("label", /^Desde/).find("input").clear().type("2026-11-01");
      cy.contains("label", /^Hasta/).find("input").clear().type("2026-11-11");
      cy.contains("button", "Aplicar filtros").click();
    });
    cy.wait("@metrics").then(({ request }) => expect(request.query).to.include({ group: "g1", grade: "3.°", game: "tetrilogic", student: "qa-student", from: "2026-11-01", to: "2026-11-11" }));
    cy.contains("h2", "Análisis lógico").should("be.visible");
  });

  it("muestra las cuatro secciones vigentes en la vista institucional", () => {
    user("admin"); metricsFixtures(true);
    cy.viewport(390, 844);
    cy.visit("/docente/metricas");
    cy.contains("h2", "Distribución de estrellas").should("be.visible");
    cy.get('nav[aria-label="Secciones de métricas"] button').should("have.length", 4);
    cy.contains("button", "Pretest y postest").should("not.exist");
    cy.contains("button", "Uso del tutor").click();
    cy.contains("dt", "Consejos generados por IA").siblings("dd").should("have.text", "1");
    cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth + 1));
    cy.screenshot("metricas-educativas-390", { capture: "fullPage" });
  });
});
