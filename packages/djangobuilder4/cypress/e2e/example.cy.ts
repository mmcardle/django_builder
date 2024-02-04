// https://docs.cypress.io/api/introduction/api.html

describe("Basic Render Test", () => {
  it("visits the app root url", () => {
    cy.visit("/");
    cy.contains("Login to Django Builder");
  });
});
