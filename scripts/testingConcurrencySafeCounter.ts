// @ts-nocheck
import { AsyncLocalStorage } from "async_hooks";

class AsyncLock {
  constructor() {
    this._queue = [];
    this._locked = false;
  }

  async acquire() {
    return new Promise((resolve) => {
      if (!this._locked) {
        this._locked = true;
        return resolve();
      }
      console.log("locked, adding to queue");
      this._queue.push(resolve);
    });
  }

  release() {
    if (this._queue.length > 0) {
      const next = this._queue.shift();
      next();
    } else {
      this._locked = false;
    }
  }
}

// Shared counter and lock
let counter = 0;
const lock = new AsyncLock();

// Function to safely increment the counter
async function incrementCounter(by) {
  await lock.acquire();
  try {
    counter += by;
    lock.release();
  } catch (e) {
    lock.release();
  }
}

// Main function to simulate concurrent access
async function main() {
  console.log("Initializing counter to 0");
  counter = 0; // Initialize counter

  // Simulate concurrent tasks
  const tasks = [incrementCounter(100), incrementCounter(200), incrementCounter(-200), incrementCounter(300), incrementCounter(100), incrementCounter(200), incrementCounter(-200), incrementCounter(300), incrementCounter(100), incrementCounter(200), incrementCounter(-200), incrementCounter(300), incrementCounter(100), incrementCounter(200), incrementCounter(-200), incrementCounter(300)];

  await Promise.all(tasks); // Wait for all tasks to complete

  console.log("Final counter value:", counter); // Log the final counter value
}

main().catch(console.error);
