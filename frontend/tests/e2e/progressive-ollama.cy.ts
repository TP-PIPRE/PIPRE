import type { ProgressiveHint } from "../../src/infrastructure/api/models/gameProgressModels";

const api = "http://127.0.0.1:18183/api/v1";
const boards = {
  "Neon Flow": { url: "/simulador/c001?activity=act-c001-v2-1", selector: ".neon-flow-stage" },
  TetriLogic: { url: "/simulador/c002?activity=act-c002-1", selector: ".tetri-free" },
};
const endpoint = `${api}/game-sessions/*/progressive-hints`;

function assertAdviceVisible(board: string, message: string) {
  cy.get(`${board} [role="status"] p`, { timeout: 15000 }).should(elements => {
    expect(Array.from(elements, element => element.textContent)).to.include(message);
  });
}

function assertCount(game: keyof typeof boards, count: number) {
  if (game === "TetriLogic") {
    cy.get("#tetri-hint-count", { timeout: 15000 }).should("have.text", `Pistas usadas: ${count}.`);
  } else {
    cy.contains("dt", /^Pistas$/, { timeout: 15000 }).siblings("dd").should("have.text", String(count));
  }
}

describe("Tutor progresivo con Ollama real", () => {
  before(function () {
    cy.task<boolean>("progressiveTutorEnabled", null, { log: false }).then(enabled => {
      if (!enabled) this.skip();
    });
  });

  (Object.keys(boards) as (keyof typeof boards)[]).forEach(game => {
    it(`${game} conserva los consejos fijos, entrega tres ayudas generadas y confirma la novena`, () => {
      const board = boards[game];
      const email = `e2e-ollama-${crypto.randomUUID()}@test.invalid`;
      const password = "Audit-browser-123";
      cy.intercept({ url: /https?:\/\//, middleware: true }, request => {
        if (!["127.0.0.1", "localhost"].includes(new URL(request.url).hostname)) {
          request.reply({ statusCode: 503, body: { message: "Integración externa fuera de esta prueba" } });
        }
      });
      cy.register({ firstName: "QA", lastName: "Ollama", email, password, age: 16, grade: "QA" });
      cy.contains("Tu cuenta está lista").should("be.visible");
      cy.login(email, password);
      cy.location("pathname").should("not.eq", "/login");
      cy.intercept("POST", endpoint).as("progressiveAdvice");
      cy.visit(board.url);
      assertCount(game, 0);
      if (game === "TetriLogic") {
        cy.get('button[aria-label="Seleccionar pieza I (i1)"]').click();
        cy.get('button[aria-label="Rotar pieza"]').click();
        cy.get('button[aria-label="Celda vacía, fila 1, columna 4"]').click();
        cy.get('button[aria-label="Pieza I, fila 1, columna 4"]').should("be.visible");
      } else {
        cy.contains("button", "Filtro green").click();
        cy.get('button[aria-label="Celda vacía, fila 1, columna 2"]').click();
        cy.contains("button", /^Comprobar$/).click();
        cy.contains("El haz aún no llega a todos los receptores").should("be.visible");
      }

      const fixedAdvice = new Set<string>();
      for (let ordinal = 1; ordinal <= 5; ordinal++) {
        cy.contains("button", /^Pista$/).should(button => expect(button).not.to.have.attr("aria-disabled", "true")).click();
        cy.wait<unknown, ProgressiveHint>("@progressiveAdvice").then(({ request, response }) => {
          expect(request.body).to.include({ ordinal, acceptPenalty: false });
          expect(response?.statusCode).to.eq(200);
          expect(response!.body).to.include({ ordinal, source: "STATIC" });
          const { message } = response!.body;
          expect(message.trim()).not.to.eq("");
          fixedAdvice.add(message);
          assertAdviceVisible(board.selector, message);
        });
        assertCount(game, ordinal);
        cy.contains("¿Solicitar otro consejo?").should("not.exist");
      }

      cy.reload();
      assertCount(game, 5);
      const restoredPiece = game === "TetriLogic" ? 'button[aria-label="Pieza I, fila 1, columna 4"]'
        : '[aria-label="Tablero Neon Flow"] [aria-label="Filtro green"]';
      cy.get(restoredPiece).should("be.visible");
      const deliveredAdvice = new Set<string>();
      const assertGeneratedAdvice = (ordinal: number, acceptPenalty: boolean) => {
        cy.wait<unknown, ProgressiveHint>("@progressiveAdvice", { requestTimeout: 15000, responseTimeout: 45000 }).then(({ request, response }) => {
          expect(request.body).to.include({ ordinal, acceptPenalty });
          expect(response?.statusCode).to.eq(200);
          expect(response!.body).to.include({ ordinal, source: "GENERATIVE" });
          const { message } = response!.body;
          expect(message.trim()).not.to.eq("");
          expect(fixedAdvice.size).to.eq(5);
          expect(fixedAdvice.has(message) || deliveredAdvice.has(message)).to.eq(false);
          deliveredAdvice.add(message);
          assertAdviceVisible(board.selector, message);
        });
        assertCount(game, ordinal);
      };

      for (let ordinal = 6; ordinal <= 8; ordinal++) {
        cy.contains("button", /^Pista$/).should(button => expect(button).not.to.have.attr("aria-disabled", "true")).click();
        assertGeneratedAdvice(ordinal, false);
        cy.contains("¿Solicitar otro consejo?").should("not.exist");
      }

      cy.contains("button", /^Pista$/).click();
      cy.get('[role="dialog"]').should("contain.text", "Has utilizado las 8 ayudas disponibles sin penalización");
      cy.contains("button", /^Cancelar$/).click();
      assertCount(game, 8);
      cy.get("@progressiveAdvice.all").should("have.length", 8);
      cy.contains("button", /^Pista$/).click();
      cy.contains("button", /^Recibir consejo$/).click();
      assertGeneratedAdvice(9, true);

      if (game === "TetriLogic") cy.get('a[aria-label="Volver a mis cursos"]').click();
      else cy.contains("a", "← Mis cursos").click();
      cy.location("pathname").should("eq", "/");
      cy.go("back");
      assertCount(game, 0);
      cy.get(restoredPiece).should("be.visible");
      cy.contains("button", /^Pista$/).click();
      cy.get('[role="dialog"]').should("contain.text", "Has utilizado las 8 ayudas disponibles sin penalización");
      cy.contains("button", /^Cancelar$/).click();
      assertCount(game, 0);
    });
  });
});
