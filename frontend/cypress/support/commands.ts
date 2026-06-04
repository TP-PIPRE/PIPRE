Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login");
  cy.get('[data-testid="login-email"]').type(email);
  cy.get('[data-testid="login-password"]').type(password);
  cy.get('[data-testid="login-submit"]').click();
});

Cypress.Commands.add("register", (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
  grade: string;
}) => {
  cy.visit("/login");
  cy.get('[data-testid="toggle-register"]').click();
  cy.get('[data-testid="register-firstName"]').type(data.firstName);
  cy.get('[data-testid="register-lastName"]').type(data.lastName);
  cy.get('[data-testid="register-email"]').type(data.email);
  cy.get('[data-testid="register-password"]').type(data.password);
  cy.get('[data-testid="register-age"]').type(String(data.age));
  cy.get('[data-testid="register-grade"]').type(data.grade);
  cy.get('[data-testid="register-submit"]').click();
});
