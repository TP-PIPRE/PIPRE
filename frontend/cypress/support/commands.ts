Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login");
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password, { log: false });
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add("csrfRequest", (options:Partial<Cypress.RequestOptions>) => {
  const target=new URL(String(options.url));
  return cy.request<{token:string;headerName:string}>(`${target.origin}/api/v1/auth/csrf`).then(response=>
    cy.request({...options,headers:{...options.headers,[response.body.headerName]:response.body.token}}));
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
  cy.contains('button', 'Regístrate aquí').click();
  cy.get('input[name="firstName"]').type(data.firstName);
  cy.get('input[name="lastName"]').type(data.lastName);
  cy.get('input[name="email"]').type(data.email);
  cy.get('input[name="password"]').type(data.password, { log: false });
  cy.get('input[name="age"]').type(String(data.age));
  cy.get('input[name="grade"]').type(data.grade);
  cy.get('button[type="submit"]').click();
});
