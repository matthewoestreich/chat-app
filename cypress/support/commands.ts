/// <reference types="cypress" />

Cypress.Commands.add("getLoginInputEmail", () => {
  cy.get("input[placeholder='Email Address']");
});

Cypress.Commands.add("getLoginInputPassword", () => {
  cy.get("input[placeholder='Password']").filter(":visible");
});

Cypress.Commands.add("getLoginButton", () => {
  cy.get("button[type='submit']");
});

Cypress.Commands.add("getLogoutButton", () => {
  cy.get("button[title='Logout']");
});

Cypress.Commands.add("getToggleThemeButton", () => {
  cy.get("a[title='Toggle theme']");
});

Cypress.Commands.add("getCurrentTheme", () => {
  cy.get("[data-bs-theme]");
});

Cypress.Commands.add("createAccount", (name: string, email: string, password: string) => {
  cy.visit("/");
  cy.get(".btn-outline-secondary").contains("Create Account").should("exist").should("be.visible").click();
  cy.get("input[placeholder='Username']").type(name);
  cy.get("input[placeholder='Email']").type(email, { force: true });
  cy.get(".modal-body input[placeholder='Password']").type(password);
  cy.get(".modal-footer").find("button").contains("Create Account").click();
  cy.get("div[role='alert']").should("contain.text", "Success");
});

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/");
  cy.getLoginInputEmail().type(email);
  cy.getLoginInputPassword().type(password);
  cy.getLoginButton().click();
  cy.url().should("include", "/chat");
});

Cypress.Commands.add("logout", () => {
  cy.getLogoutButton().should("be.visible").click();
});

Cypress.Commands.add("enterRoom", (roomName: string) => {
  cy.url().then(($url) => {
    if (!$url.includes("/chat")) {
      cy.visit("/chat");
    }
    cy.get("#rooms-container").children().first().contains("li > div.card > div.card-body > h5.card-title", roomName).should("exist").click();
  });
});

/**
 * calls `cy.enterRoom(roomName)` before verifying members.
 */
Cypress.Commands.add("roomHasMembers", (roomName: string) => {
  cy.enterRoom(roomName);
  cy.get("#members-list").should("be.visible").children().should("have.length.greaterThan", 0);
});

Cypress.Commands.add("isRoomMember", (roomName: string) => {
  cy.get("#rooms-container").should("be.visible").children().first().contains("li > div.card > div.card-body > h5.card-title", roomName);
});

Cypress.Commands.add("getLocalStorageItem", (key: string) => {
  cy.window().then((window) => window.localStorage.getItem(key));
});

Cypress.Commands.add("localStorageItemEquals", (key: string, expectedValue: string) => {
  cy.getLocalStorageItem(key).then(($value) => {
    cy.wrap($value).should("eq", expectedValue);
  });
});

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
