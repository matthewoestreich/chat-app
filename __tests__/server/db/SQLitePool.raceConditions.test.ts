import SQLitePool from "../../../server/db/SQLitePool";
import fs from "fs";
import path from "path";
//import { log } from "console";

const TEST_DB_PATH = path.resolve(__dirname, "jestrace.db");

beforeAll(() => {
  // Ensure a clean test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

afterAll(() => {
  // Clean up test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

describe("SQLitePool Race Conditions", () => {
  let pool: SQLitePool;

  beforeEach(() => {
    pool = new SQLitePool(TEST_DB_PATH, 2); // A pool with a maximum of 2 connections.
  });

  afterEach(async () => {
    await pool.drain();
  });

  test("should handle concurrent connection requests and maintain consistency", async () => {
    const results: string[] = [];
    const tasks: Promise<void>[] = [];

    const simulateTask = async (taskId: number) => {
      const connection = await pool.getConnection();
      results.push(`Task ${taskId} got connection`);

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

      results.push(`Task ${taskId} releasing connection`);
      connection.release();
    };

    // Simulate high contention with multiple concurrent requests
    const numTasks = 100;
    for (let i = 0; i < numTasks; i++) {
      tasks.push(simulateTask(i));
    }

    await Promise.all(tasks);

    // Assert that all tasks eventually completed
    expect(results).toHaveLength(numTasks * 2); // Each task logs twice: acquiring and releasing
    expect(await pool.size).toBe(2); // The pool should still have 2 connections
    expect(await pool.pendingConnectionsSize).toBe(0); // No pending requests
  });

  test("should ensure pending requests are fulfilled in order", async () => {
    const taskOrder: number[] = [];
    const tasks: Promise<void>[] = [];

    const simulateTask = async (taskId: number) => {
      const connection = await pool.getConnection();
      taskOrder.push(taskId);

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

      connection.release();
    };

    // Fill the pool
    const conn1 = await pool.getConnection();
    const conn2 = await pool.getConnection();

    // Queue up additional requests
    for (let i = 0; i < 3; i++) {
      tasks.push(simulateTask(i));
    }

    expect(await pool.pendingConnectionsSize).toBe(3); // There should be 3 pending requests

    // Release the connections to allow pending tasks to proceed
    conn1.release();
    conn2.release();

    await Promise.all(tasks);

    // Assert that tasks were processed in the order they were requested
    expect(taskOrder).toEqual([0, 1, 2]);
    expect(await pool.size).toBe(2);
    expect(await pool.pendingConnectionsSize).toBe(0);
  });

  test("should handle high contention with long-running tasks", async () => {
    const results: string[] = [];
    const tasks: Promise<void>[] = [];

    const simulateTask = async (taskId: number) => {
      const connection = await pool.getConnection();
      results.push(`Task ${taskId} got connection`);

      // Simulate long-running work
      await new Promise((resolve) => setTimeout(resolve, 100));

      results.push(`Task ${taskId} releasing connection`);
      connection.release();
    };

    // Create more tasks than the pool size
    for (let i = 0; i < 10; i++) {
      tasks.push(simulateTask(i));
    }

    await Promise.all(tasks);

    // Assert that all tasks completed without exceeding the pool size
    expect(results.filter((r) => r.includes("got connection")).length).toBe(10);
    expect(await pool.size).toBe(2); // The pool should have 2 connections (max size)
    expect(await pool.pendingConnectionsSize).toBe(0); // No pending requests left
  });

  test("should recover from a failed connection", async () => {
    //const pool = new SQLitePool(":memory:", 2);
    const simulateTask = async (taskId: number) => {
      const connection = await pool.getConnection();
      if (taskId === 3) {
        // Simulate a failure for task 3
        await new Promise((resolve) => setTimeout(resolve, 10));
        await pool.drain(); // Simulate database shutdown
        return; // Task 3 exits without releasing the connection
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
      connection.release();
    };

    const tasks: Promise<void>[] = [];
    for (let i = 0; i < 100; i++) {
      tasks.push(simulateTask(i));
    }

    await Promise.allSettled(tasks);

    // After recovery, the pool should be able to recreate connections
    const conn = await pool.getConnection();
    expect(conn).toBeDefined();
    conn.release();

    const poolSize = await pool.size;
    const pendingRequestsSize = await pool.pendingConnectionsSize;
    expect(poolSize).toBe(1); // Should only have one active + idle connection.
    expect(pendingRequestsSize).toBe(0);
  });

  test("should handle rapid-fire acquires and releases", async () => {
    const acquireReleaseCycle = async (_taskId: number) => {
      for (let i = 0; i < 10; i++) {
        const connection = await pool.getConnection();
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10)); // Simulate very short work
        connection.release();
      }
    };

    const tasks: Promise<void>[] = [];

    // Simulate rapid-fire acquires/releases across multiple tasks
    for (let i = 0; i < 5; i++) {
      tasks.push(acquireReleaseCycle(i));
    }

    await Promise.all(tasks);

    // Assert that the pool state is consistent after high contention
    expect(await pool.size).toBe(2); // The pool should have 2 connections (max size)
    expect(await pool.pendingConnectionsSize).toBe(0); // No pending requests left
  });

  test("should reject pending connections during drain", async () => {
    const pool = new SQLitePool(":memory:", 2);
    await pool.getConnection();
    await pool.getConnection();

    const pendingTask = pool.getConnection(); // Create a pending request
    await pool.drain();

    await expect(pendingTask).rejects.toThrow("Pool drained");
  });
});
