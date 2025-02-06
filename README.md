<div align="center">
  <h1>RTChat</h1>
  <heading>A full-stack real-time chat app with support for multiple rooms, direct messaging, and dark mode</heading>
</div>
<div align="center">
    <h4><a href="https://rtchat-a7ul.onrender.com">Start Chatting Now!</a></h4>
</div>
<br />
<div align="center" style="text-decoration: none;">
	    <a href="https://www.typescriptlang.org/" style="text-decoration: none;">
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/typescript.png" alt="TypeScript" title="TypeScript"/>
  </a>
  <a href="https://expressjs.com/" style="text-decoration: none;">
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/express.png" alt="Express" title="Express">
  </a>
  <a href="https://github.com/websockets/ws" style="text-decoration: none;">
	  <img width="50" src="./.github/icons/websockets-icon.svg" alt="websocket" title="websocket"/>
	</a>
  <a href="https://www.sqlite.org/" style="text-decoration: none;">
  <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/sqlite.png" alt="SQLite" title="SQLite"/>
  </a>
  <a href="http://react.dev/" style="text-decoration: none;">
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/react.png" alt="React" title="React"/>
  </a>
  <a href="https://getbootstrap.com/" style="text-decoration: none;">
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/bootstrap.png" alt="Bootstrap" title="Bootstrap"/>
  </a>
  <a href="https://vite.dev/" style="text-decoration: none;">
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/vite.png" alt="Vite" title="Vite"/>
  </a>
   <a href="https://jestjs.io/" style="text-decoration: none;">
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/jest.png" alt="Jest" title="Jest"/>
  </a>
  <a href="https://www.cypress.io/" style="text-decoration: none;">
    <img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/cypress.png" alt="Cypress" title="Cypress"/>
  </a>
</div>

<hr />
<br />

# Features:

- Session Based Authentication & Authorization [\*](#user-content-jwt)
- WebSocket Authentication
- Dark Mode
- Responsive
- Abstract database access level
  - This means we can use nearly any medium for storage, even an API!
- We have custom wrappers around WebSockets!
  - [WebSocketeer](client/src/ws/WebSocketeer.ts) for client side
  - [WebSocketApp](server/wss/WebSocketApp.ts) for server side
  - Makes writing WebSocket code feel like you're writing Express routes
  - Each "route" is a message type, which makes sending and/or parsing messages a breeze!

# Look & Feel

\***_Subject to change, may look different now_**

## Default Look

![General Display](.github/screenshots/1_general.png "General")

## Dark mode!

![Dark Mode General Display](.github/screenshots/2_dark_mode.png "Dark Mode!")

## Live Member Status

See whos online _right now_

![Live Status Updates](.github/screenshots/3_live_status.png "Live Member Status Updates")

## Responsive

Optimized for all devices!

![Responsive General](.github/screenshots/4_responsive_main.png "Responsive")

---

![Responsive Rooms](.github/screenshots/5_responsive_rooms.png "Responsive Members")

---

![Responsive Members](.github/screenshots/6_responsive_members.png "Responsive Rooms")

---

<sub><a name="jwt">\*</a>Pseudo-sessions via JWT. I was testing various auth strategies, got sick of testing different strats, and settled with using a JWT as a session-like token. I plan on migrating to full on sessions soon.</sub>

---

##### Older Versions

[Version 1](https://chat-app-ghpq.onrender.com)
