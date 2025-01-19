declare namespace Cypress {
  export interface Chainable {
    /**
     * Custom command to log in.
     * @example cy.login('user@example.com', 'password123')
     */
    login(email: string, password: string): Chainable<void>;

    logout(): Chainable<void>;

    /**
     * Custom command to regiser
     * @example cy.createAccount("m", "m@m.com", "pw")
     */
    createAccount(name: string, email: string, password: string): Chainable<void>;

    enterRoom(roomName: string): Chainable<void>;
  }
}
