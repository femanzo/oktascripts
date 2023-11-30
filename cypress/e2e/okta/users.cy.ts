describe("template spec", () => {
  beforeEach(() => {});

  it("passes", () => {
    cy.visit("https://example.cypress.io");
  });

  it("create new transaction", () => {});
});

describe("Auth0", function () {
  beforeEach(function () {
    cy.loginToAuth0(
      Cypress.env("auth0_username"),
      Cypress.env("auth0_password")
    );
    cy.visit("https://app.eu.mightyid.com/home");
  });

  it("shows onboarding", function () {
    cy.contains("Get Started").should("be.visible");
  });
});
