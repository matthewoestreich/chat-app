/// <reference types="cypress" />

Cypress.Commands.add("createAccount", (name: string, email: string, password: string) => {
  cy.visit("/");
  cy.get(".btn").contains("Create Account").click();
  cy.get("#ca-un-input").type(name);
  cy.get("#ca-email-input").type(email, { force: true });
  cy.get("#ca-pw-input").type(password);
  cy.get("#create-btn").click();
  cy.get("#alert-message").should("contain", "Success! Account created successfully.");
});

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/");
  cy.get("#login-email-input").type(email);
  cy.get("#login-password-input").type(password);
  cy.get("#login-btn").click();
  cy.url().should("include", "/chat");
});

Cypress.Commands.add("logout", () => {
  cy.get('a[href="logout"]').click();
  cy.get("#logout-message").should("contain.text", "Success");
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
