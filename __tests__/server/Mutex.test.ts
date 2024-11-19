import Mutex from "../../server/Mutex";

describe("Mutex General", () => {
  test("ensures mutual exclusion", async () => {
    const mutex = new Mutex();
    let sharedResource = 0;

    const task = async (_id: number) => {
      await mutex.lock();
      const current = sharedResource;
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate work
      sharedResource = current + 1;
      mutex.unlock();
    };

    const tasks = [task(1), task(2), task(3)];
    await Promise.all(tasks);

    expect(sharedResource).toBe(3); // Ensure no race conditions occurred
  });

  test("tasks wait for lock to be released", async () => {
    const mutex = new Mutex();
    let executionOrder: number[] = [];

    const task = async (id: number) => {
      await mutex.lock();
      executionOrder.push(id);
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate work
      mutex.unlock();
    };

    const tasks = [task(1), task(2), task(3)];
    await Promise.all(tasks);

    expect(executionOrder).toEqual([1, 2, 3]); // Tasks executed in order
  });
});
