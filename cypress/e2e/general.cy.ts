/// <reference types="cypress" />

const BASE_URL = Cypress.config("baseUrl");

describe("Homepage", () => {
  it("should load the homepage", () => {
    // @ts-ignore
    cy.visit(BASE_URL);
    cy.title().should("eq", "RTChat | Welcome!");
  });
});

describe("Functionality", () => {
  const USER = generateAccountInfo();

  before(() => {
    cy.createAccount(USER.name, USER.email, USER.password);
  });

  beforeEach(() => {
    cy.login(USER.email, USER.password);
  });

  afterEach(() => {
    cy.logout();
  });

  it("should redirect an already logged in account", () => {
    cy.visit("/");
    cy.url().should("include", "/chat");
  });

  it("should list joinable rooms", () => {
    cy.get("#open-join-room-modal").click();
    cy.get("#join-room-modal-rooms-container").should("be.visible").children().should("have.length.greaterThan", 0);
    cy.get('#cancel-join-room-btn[data-cy="join-room-modal"]').should("be.visible").click();
  });

  it("should join the #general room", () => {
    cy.get("#open-join-room-modal").click();
    cy.get("#join-room-modal-rooms-container").should("be.visible").children().should("have.length.greaterThan", 0).get('li[name="#general"]').click();
    cy.get("#join-room-btn").click();
    cy.get("#join-room-alert-message").should("contain.text", "Successfully joined room!");
    cy.get('#cancel-join-room-btn[data-cy="join-room-modal"]').should("be.visible").click();
    cy.get("#rooms-container").children().first().contains("li > div.card > div.card-body > h5.card-title", "#general");
  });

  it("should enter the #general room", () => {
    cy.enterRoom("#general");
  });

  it("should send a message in the #general room", () => {
    const message = "Hello from Cypress!";
    cy.enterRoom("#general");
    cy.get("#chat-text-input").should("exist").type(message);
    cy.get("#send-chat-btn").should("not.be.disabled").click();
    cy.get("#chat-display").then(($chatDisplayEl) => {
      cy.wrap($chatDisplayEl).should("have.length.greaterThan", 0).last().children().last().should("contain.text", message);
    });
  });
});

/**
 *
 * MISC FUNCTIONS
 *
 */

function generateAccountInfo() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let randString = "";

  for (let i = 0; i < 5; i++) {
    randString += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return {
    name: randString,
    email: `${randString}@${randString}.com`,
    password: randString,
  };
}
