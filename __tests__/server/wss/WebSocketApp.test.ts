import WebSocketApp from "../../../server/wss/WebSocketApp";

describe("WebSocketApp Cache", () => {
  let app: WebSocketApp;

  beforeEach(() => {
    app = new WebSocketApp();
  });

  describe("addContainerToCache", () => {
    it("should add a new container to the cache if not already present", () => {
      const containerId = "room1";

      app.addContainerToCache(containerId);

      const room = app.getCachedContainer(containerId);
      expect(room).toBeDefined();
      expect(room?.size).toBe(0); // Ensure it's an empty container
    });

    it("should not add a container if it already exists", () => {
      const containerId = "room1";

      app.addContainerToCache(containerId);
      const initialSize = app.getCachedContainer(containerId)?.size;

      app.addContainerToCache(containerId); // Try adding again

      const newSize = app.getCachedContainer(containerId)?.size;
      expect(newSize).toBe(initialSize); // The size should remain unchanged
    });
  });

  describe("addItemToCache", () => {
    it("should add an item to an existing container", () => {
      const containerId = "room1";
      const itemId = "user1";

      app.addContainerToCache(containerId);
      app.addItemToCache(itemId, containerId);

      const room = app.getCachedContainer(containerId);
      expect(room).toBeDefined();
      expect(room?.size).toBe(1); // Ensure item was added
      expect(room?.has(itemId)).toBe(true); // Ensure item exists in the container
    });

    it("should do nothing if socket is not available", () => {
      const containerId = "room1";
      const itemId = "user1";

      app.socket = null; // Simulate no socket

      app.addItemToCache(itemId, containerId); // Attempt to add item

      const room = app.getCachedContainer(containerId);
      expect(room).toBeUndefined(); // No container should have been added
    });
  });

  describe("deleteCachedContainer", () => {
    it("should delete a container from the cache", () => {
      const containerId = "room1";

      app.addContainerToCache(containerId);
      app.deleteCachedContainer(containerId);

      const room = app.getCachedContainer(containerId);
      expect(room).toBeUndefined(); // Container should be removed
    });
  });

  describe("deleteCachedItem", () => {
    it("should delete an item from a container", () => {
      const containerId = "room1";
      const itemId = "user1";

      app.addContainerToCache(containerId);
      app.addItemToCache(itemId, containerId);
      app.deleteCachedItem(itemId, containerId);

      const room = app.getCachedContainer(containerId);
      expect(room?.has(itemId)).toBe(false); // Item should be removed
    });

    it("should not throw error if item does not exist", () => {
      const containerId = "room1";
      const itemId = "user1";

      app.addContainerToCache(containerId);
      app.deleteCachedItem(itemId, containerId); // Item doesn't exist

      const room = app.getCachedContainer(containerId);
      expect(room).toBeDefined();
      expect(room?.has(itemId)).toBe(false); // No error, and item is not there
    });
  });
});
