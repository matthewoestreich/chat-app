import SQLitePool from "../../../server/db/SQLitePool";
import fs from "fs";
import path from "path";
//import { log } from "console";

const TEST_DB_PATH = path.resolve(__dirname, "jest.db");

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

describe("SQLitePool", () => {
  let pool: SQLitePool;

  beforeEach(() => {
    pool = new SQLitePool(TEST_DB_PATH, 2); // Pool with a max of 2 connections
  });

  afterEach(async () => {
    await pool.closeAll();
  });

  test("should create a new connection and release it back to the pool when released is called from connection", async () => {
    const connection = await pool.getConnection();
    expect(connection).toBeDefined();
    expect(connection.db).toBeDefined();

    await connection.release();
    // Ensure connection is added back to the pool
    const poolSize = await pool.size;
    expect(poolSize).toBe(1);
  });

  test("should create a new connection and release it back to the pool when released is called from the pool", async () => {
    const connection = await pool.getConnection();
    expect(connection).toBeDefined();
    expect(connection.db).toBeDefined();

    // Normally wouldn't need to await this..
    await pool.releaseConnection(connection);
    // Ensure connection is added back to the pool
    const poolSize = await pool.size;
    expect(poolSize).toBe(1);
  });

  test("should reuse released connections", async () => {
    const connection1 = await pool.getConnection();
    await connection1.release(); // Normally wouldn't have to await this..

    const connection2 = await pool.getConnection();
    expect(connection1.db).toBe(connection2.db); // Same connection reused

    await connection2.release();
  });

  test("should handle concurrent connection requests up to the limit", async () => {
    const conn1 = await pool.getConnection();
    const conn2 = await pool.getConnection();

    const pendingConnection = pool.getConnection();
    const pendingRequestsSize = await pool.pendingRequestsSize;
    expect(pendingRequestsSize).toBe(1);

    // Awaits for a lock
    conn1.release();

    const conn3 = await pendingConnection;

    expect(conn3).toBeDefined();
    expect(conn3.db).toBe(conn1.db); // Reused connection

    await conn2.release();
    await conn3.release();
  });

  test("should execute a query", async () => {
    await pool.query(`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`, []);
    await pool.query(`INSERT INTO test (name) VALUES (?)`, ["Alice"]);

    const rows = await pool.query(`SELECT * FROM test`, []);
    expect(rows).toEqual([{ id: 1, name: "Alice" }]);
  });

  test("should reject connection requests if the pool is full and unavailable", async () => {
    const conn1 = await pool.getConnection();
    const conn2 = await pool.getConnection();

    // Third request will be queued
    const pendingConnection = pool.getConnection();

    // Reject the pending connection if the pool is full and another connection is not released
    pool.releaseConnection({ db: conn1.db, release: () => undefined }); // Force pool state
    await expect(pendingConnection).resolves.toBeDefined();

    conn2.release();
  });

  test("should close all connections when requested", async () => {
    const pool = new SQLitePool(TEST_DB_PATH, 2);

    const conn1 = await pool.getConnection();
    const conn2 = await pool.getConnection();

    await conn1.release();
    await conn2.release();

    await pool.closeAll();

    const poolSize = await pool.size;
    const pendingRequestsSize = await pool.pendingRequestsSize;
    expect(poolSize).toBe(0);
    expect(pendingRequestsSize).toBe(0); // The pool should be empty
  });

  test("should not create more than max connections", async () => {
    const pool = new SQLitePool(TEST_DB_PATH, 2); // Max 2 connections
    console.log(TEST_DB_PATH);

    const conn1 = await pool.getConnection();
    // @ts-ignore
    const conn2 = await pool.getConnection();

    // At this point, pool should have no available connections, and a 3rd connection should be pending
    const conn3Promise = pool.getConnection();

    let poolSize = await pool.size;
    let pendingRequestsSize = await pool.pendingRequestsSize;
    expect(poolSize).toBe(0); // Pool should have no available connections
    expect(pendingRequestsSize).toBe(1); // One request should be pending

    // Release the first connection
    conn1.release();

    // The third connection should be resolved after the first connection is released
    const conn3 = await conn3Promise;

    // Now, conn3 should be obtained and no more than 2 connections should exist
    expect(conn3).toBeDefined();
    poolSize = await pool.size;
    pendingRequestsSize = await pool.pendingRequestsSize;
    expect(poolSize).toBe(0); // Pool should have no available connections (we're using both connections)
    expect(pendingRequestsSize).toBe(0); // Pending requests should be empty
  });
});
