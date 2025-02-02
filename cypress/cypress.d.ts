declare namespace Cypress {
  export interface Chainable {
    getLoginInputEmail(): Chainable<void>;
    getLoginInputPassword(): Chainable<void>;
    getLoginButton(): Chainable<void>;
    getLogoutButton(): Chainable<void>;
    getToggleThemeButton(): Chainable<void>;
    getCurrentTheme(): Chainable<void>;
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

    isRoomMember(roomName: string): Chainable<void>;

    /**
     * Calls `cy.enterRoom(roomName)` first
     * @param roomName name of room to verify at least 1 member exists
     */
    roomHasMembers(roomName: string): Chainable<void>;

    getLocalStorageItem(key: string): Chainable<void>;

    localStorageItemEquals(key: string, expectedValue: string): Chainable<void>;
  }
}
