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
describe("Global", () => {
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
    cy.getToggleThemeButton().should("exist").children().first().should("exist").click();
    cy.getCurrentTheme().should("have.attr", "data-bs-theme", "dark");
    cy.localStorageItemEquals("theme", "dark");
    cy.getToggleThemeButton().should("exist").children().first().should("exist").click();
    cy.getCurrentTheme().should("have.attr", "data-bs-theme", "light");
    cy.localStorageItemEquals("theme", "light");
    cy.getToggleThemeButton().should("exist").children().first().should("exist").click();
    cy.getCurrentTheme().should("have.attr", "data-bs-theme", "dark");
    cy.localStorageItemEquals("theme", "dark");
    cy.getToggleThemeButton().should("exist").children().first().should("exist").click();
    cy.getCurrentTheme().should("have.attr", "data-bs-theme", "light");
    cy.localStorageItemEquals("theme", "light");
  });

  it("should list joinable rooms", () => {
    cy.getOpenJoinRoomModalButton().click();
    // Get join room modal <ul> element
    cy.get(".modal.show .list-group").should("be.visible").children().should("have.length.greaterThan", 0);
    // Find close button
    cy.get(".modal.show .modal-footer button").should("be.visible").contains("button", "Close").should("exist").should("be.visible").wait(500).click();
  });

  it("should join the #general room", () => {
    cy.getOpenJoinRoomModalButton().click();
    // Get join room modal <ul> element
    cy.get(".modal.show .list-group").should("be.visible").children().should("have.length.greaterThan", 0);
    // Find #general room and click it
    cy.get(".modal.show .list-group").should("be.visible").children().should("have.length.greaterThan", 0).get("li").contains("#general").click();
    // Find join room button and click it
    cy.get(".modal.show .modal-footer button").contains("Join").should("exist").should("be.visible").click();
    // Find alert message, verify it contiains success
    cy.get(".modal-body").get("div").contains("Success").should("contain.text", "Success");
    // Find close button
    cy.get(".modal.show .modal-footer button").contains("Close").should("exist").should("be.visible").click();
    cy.isRoomMember("#general");
  });

  it("should enter the #general room", () => {
    cy.enterRoom("#general");
  });

  it("should send a message in the #general room", () => {
    const message = "Hello from Cypress!";
    cy.roomHasMembers("#general");
    cy.getChatInput().type(message);
    cy.getSendChatMessageButton().click();
    cy.getChatDisplay().children().should("have.length.greaterThan", 0).last().children().last().should("contain.text", message);
  });

  it("should create a new room", () => {
    cy.getOpenCreateRoomModalButton().click();
    // Get create new room text input
    cy.get(".modal.show input[placeholder='Room Name']").should("be.visible").type(NEW_ROOM_NAME);
    // Click join room button
    cy.get(".modal.show .modal-footer button").contains("Create").should("be.visible").click();
    // Verify alert contains success
    cy.get(".modal.show .modal-body").get("div").contains("Success").should("contain.text", "Success");
    // Close modal
    cy.get(".modal.show .modal-footer button").contains("Close").should("be.visible").click();
    cy.isRoomMember(NEW_ROOM_NAME).should("exist");
  });

  it("should leave a room", () => {
    cy.getOpenLeaveRoomModalButton().should("be.disabled");
    cy.enterRoom(NEW_ROOM_NAME);
    cy.getOpenLeaveRoomModalButton().should("be.enabled").click();
    // Click leave room
    cy.get(".modal.show .modal-footer button").contains("Leave").should("be.visible").wait(500).click();
    cy.get(".modal.show").should("not.exist");
    cy.isRoomMember(NEW_ROOM_NAME).should("not.exist");
  });

  it("should open direct conversations", () => {
    cy.getOpenDirectConversationsDrawerButton().click();
    cy.get(".card-header div").contains("Direct Messages").should("exist").should("be.visible");
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
