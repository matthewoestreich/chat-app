/// <reference types="cypress" />

const BASE_URL = Cypress.config("baseUrl");

describe("Homepage", () => {
  it("should load the homepage", () => {
    // @ts-ignore
    cy.visit(BASE_URL);
    cy.title().should("eq", "RTChat | Welcome!");
  });
});

/**
 * THERE IS NO NEED TO CALL cy.visit("/chat")` AT THE START OF A TEST
 * WITHIN THIS "describe" BLOCK. THIS IS BC WE LOGIN `beforeEach(..)`
 * WHICH REDIRECTS US TO `/chat` AUTOMATICALLY!!!
 */
describe("Functionality", () => {
  const USER = generateAccountInfo();
  const NEW_ROOM_NAME = getRandomString(7);

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

  it("should toggle theme", () => {
    cy.get("#toggle-theme").should("exist").children().first().should("exist").click();
    cy.get("[data-bs-theme]").should("have.attr", "data-bs-theme", "dark");
    cy.localStorageItemEquals("theme", "dark");
    cy.get("#toggle-theme").should("exist").children().first().should("exist").click();
    cy.get("[data-bs-theme]").should("have.attr", "data-bs-theme", "light");
    cy.localStorageItemEquals("theme", "light");
    cy.get("#toggle-theme").should("exist").children().first().should("exist").click();
    cy.get("[data-bs-theme]").should("have.attr", "data-bs-theme", "dark");
    cy.localStorageItemEquals("theme", "dark");
    cy.get("#toggle-theme").should("exist").children().first().should("exist").click();
    cy.get("[data-bs-theme]").should("have.attr", "data-bs-theme", "light");
    cy.localStorageItemEquals("theme", "light");
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
    cy.isRoomMember("#general");
  });

  it("should enter the #general room", () => {
    cy.enterRoom("#general");
  });

  it("should send a message in the #general room", () => {
    const message = "Hello from Cypress!";
    cy.roomHasMembers("#general");
    cy.get("#chat-text-input").should("exist").type(message);
    cy.get("#send-chat-btn").should("not.be.disabled").click();
    cy.get("#chat-display").then(($chatDisplayEl) => {
      cy.wrap($chatDisplayEl).should("have.length.greaterThan", 0).last().children().last().should("contain.text", message);
    });
  });

  it("should create a new room", () => {
    cy.get("#open-create-room-modal-btn").should("be.visible").click();
    cy.get("#create-room-name-input").should("be.visible").type(NEW_ROOM_NAME);
    cy.get("#create-room-btn").should("be.visible").click();
    cy.get("#create-room-alert-message").should("be.visible").should("include.text", "Success");
    cy.get("#cancel-create-room-btn").should("be.visible").click();
    cy.isRoomMember(NEW_ROOM_NAME).should("exist");
  });

  it("should leave a room", () => {
    cy.get("#open-leave-room-modal").should("be.visible").should("be.disabled");
    cy.enterRoom(NEW_ROOM_NAME);
    cy.get("#open-leave-room-modal").should("be.enabled").click();
    cy.get("#leave-room-confirmation-modal-confirmed-leave-btn[data-cy='unjoin']").should("be.visible").click();
    cy.get("#leave-room-confirmation-modal").should("not.be.visible");
    cy.isRoomMember(NEW_ROOM_NAME).should("not.exist");
  });

  it("should open direct conversations", () => {
    cy.get("#open-direct-messages").should("be.visible").click();
    cy.get("#direct-messages-drawer").should("exist").should("be.visible");
  });
});

/**
 *
 * MISC FUNCTIONS
 *
 */

function getRandomString(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let randString = "";
  for (let i = 0; i < length; i++) {
    randString += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return randString;
}

function generateAccountInfo() {
  const randString = getRandomString(5);
  return {
    name: randString,
    email: `${randString}@${randString}.com`,
    password: randString,
  };
}
