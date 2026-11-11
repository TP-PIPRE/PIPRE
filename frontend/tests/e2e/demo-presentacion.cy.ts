type DemoAccount = { email: string; firstName: string; lastName: string };
type DemoLearner = DemoAccount & { attempts: { complete: boolean }[] };
type DemoFixture = {
  classroom: { name: string };
  credentials: { password: string };
  administrator: DemoAccount;
  teacher: DemoAccount;
  students: DemoLearner[];
};

describe("Presentación con datos ficticios verificados", () => {
  let demo: DemoFixture;
  before(function () {
    cy.task<DemoFixture | null>("presentationFixture", null, { log: false }).then(fixture => {
      if (!fixture) this.skip();
      else demo = fixture;
    });
  });

  beforeEach(() => {
    cy.intercept({ url: /https?:\/\//, middleware: true }, request => {
      if (!['127.0.0.1', 'localhost'].includes(new URL(request.url).hostname)) request.reply({ statusCode: 503 });
    });
  });

  it("reconcilia la vista institucional, el aula docente y los perfiles de estudiantes", () => {
    const completed = (student: DemoLearner) => student.attempts.filter(attempt => attempt.complete).length;
    const total = demo.students.reduce((sum, student) => sum + completed(student), 0);
    const logout = () => {
      cy.get('[aria-label="Abrir menú de usuario"]').click();
      cy.contains('[role="menuitem"]', "Cerrar sesión").click();
      cy.location("pathname").should("eq", "/login");
    };
    const filter = (email: string) => {
      cy.login(email, demo.credentials.password);
      cy.location("pathname", { timeout: 15000 }).should("not.eq", "/login");
      cy.visit("/docente/metricas");
      cy.get('form[aria-label="Filtros de métricas"]', { timeout: 15000 }).contains("label", /^Aula/).find("select").select(demo.classroom.name);
      cy.contains("button", "Aplicar filtros").click();
      cy.contains("dt", "Estudiantes activos").siblings("dd").should("have.text", "12 / 12");
      cy.contains("dt", "Retos completados").siblings("dd").invoke("text").should("match", new RegExp(`^${total} / \\d+$`));
      cy.contains("th", demo.classroom.name).should("be.visible");
    };

    filter(demo.administrator.email);
    cy.contains("h2", "Distribución de estrellas").should("be.visible");
    cy.visit("/docente/administracion");
    cy.contains("option", demo.classroom.name).should("exist");
    logout();

    filter(demo.teacher.email);
    cy.contains("button", "Pensamiento lógico").click();
    for (const dimension of ["Análisis lógico", "Resolución de problemas", "Reconocimiento de patrones"]) {
      cy.contains("h2", dimension).closest("section").contains("dt", "Retos resueltos").siblings("dd")
        .invoke("text").should("match", /^[1-9]\d*\/\d+$/);
    }
    cy.contains("button", "Participación").click();
    cy.contains("dt", "Sesiones iniciadas").siblings("dd").should("have.text", String(demo.students.flatMap(student => student.attempts).length));
    cy.contains("summary", "Ver valores de la serie").click();
    cy.get('[aria-label="Participación en Neon Flow"] tbody tr').its("length").should("be.greaterThan", 1);
    cy.contains("button", "Uso del tutor").click();
    cy.contains("dt", "Consejos generados por IA").siblings("dd").invoke("text").should("match", /^[1-9]\d*$/);
    const first = demo.students[0];
    const firstName = `${first.firstName} ${first.lastName}`;
    cy.contains("button", /^Resumen$/).click();
    cy.get('form[aria-label="Filtros de métricas"]').contains("label", /^Estudiante/).find("select").select(firstName);
    cy.contains("button", "Aplicar filtros").click();
    cy.contains("h2", `Historial de ${firstName}`).closest("section").contains(`${completed(first)} resultados`).should("be.visible");
    cy.visit("/docente/estudiantes");
    cy.contains("button", demo.classroom.name).click();
    cy.contains(firstName).should("be.visible");
    cy.press("Escape");
    cy.get('[role="dialog"]').should("not.exist");

    for (const student of [demo.students[0], demo.students[demo.students.length - 1]]) {
      logout();
      cy.login(student.email, demo.credentials.password);
      cy.location("pathname", { timeout: 15000 }).should("not.eq", "/login");
      cy.visit("/perfil");
      cy.contains(`${completed(student)}/60`).should("exist");
    }
    cy.visit("/simulador/c001?activity=act-c001-3");
    cy.contains("h1", "Nivel bloqueado").should("be.visible");
  });
});
