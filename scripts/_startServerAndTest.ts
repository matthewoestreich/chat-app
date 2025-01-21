/**
 *
 * Expects three 'switches' (in any order):
 *  --startServer
 *  --url
 *  --startTest
 *
 * The value for these switches are commands to run.
 *
 * We wait for the URL to be live before running the '--startTest' command.
 *
 * node thisScript.ts --startServer npm run start:server --url http://localhost:3000 --startTest npm run start:test
 *
 */
import SpawnedProcess from "./SpawnedProcess";

const EXPECTED_SWITCHES: Array<keyof Options> = ["startServer", "url", "startTest"];
const URL_ALIVE_CHECK_INTERVAL = 500; // in ms
const URL_MAX_ALIVE_CHECKS = 20;

const args = process.argv.slice(2);
const options = processArgs(args);
if (!validateArgs(options, EXPECTED_SWITCHES)) {
  process.exit(1);
}

const serverProcess = new SpawnedProcess(options.startServer.command, options.startServer.args, { stdio: "inherit" });
const testProcess = new SpawnedProcess(options.startTest.command, options.startTest.args, { stdio: "inherit" });

serverProcess.stdout?.on("data", (data) => {
  console.log(data.toString());
});
serverProcess.stderr?.on("data", (data) => {
  console.error(data.toString());
});

testProcess.stdout?.on("data", (data) => {
  console.log(data.toString());
});
testProcess.stderr?.on("data", (data) => {
  console.error(data.toString());
});
testProcess.on("close", (_code) => {
  serverProcess.kill();
});

serverProcess.start();

waitForServer(options.url.command, URL_ALIVE_CHECK_INTERVAL, URL_MAX_ALIVE_CHECKS)
  .then((_res) => {
    testProcess.start();
  })
  .catch((e) => {
    console.error(e);
    serverProcess.kill();
    testProcess.kill();
  });

/**
 *
 * TYPES
 *
 */

interface Command {
  command: string;
  args: string[];
}

interface Options {
  startServer: Command;
  url: Command;
  startTest: Command;
}

/**
 *
 * FUNCTIONS
 *
 */

async function isUrlAlive(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (e) {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url: string, checkIntervalMs: number, maxChecks: number): Promise<boolean> {
  let aliveChecks = 0;
  let isAlive = await isUrlAlive(url);

  while (!isAlive && aliveChecks <= maxChecks) {
    await sleep(checkIntervalMs);
    isAlive = await isUrlAlive(url);
    aliveChecks++;
  }

  if (aliveChecks > maxChecks) {
    return Promise.reject(new Error(`maxChecks reached`));
  }
  return Promise.resolve(true);
}

function validateArgs<K extends keyof Options>(options: Options, expectedSwitches: K[]): boolean {
  const keys = Object.keys(options);
  if (keys.length !== expectedSwitches.length) {
    console.error(`Expected ${expectedSwitches.length} arguments, got ${keys.length} | ${keys}`);
    return false;
  }
  for (let i = 0; i < expectedSwitches.length; i++) {
    const key = expectedSwitches[i];
    if (!options[key]) {
      console.error(`Expected switch '${expectedSwitches[i]}' but it was not found!`);
      return false;
    }
  }
  return true;
}

function processArgs(args: string[]): Options {
  const options: Partial<Options> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2) as keyof Options; // remove "--" from switch
      let cmd: Command = {
        command: "",
        args: [],
      };

      // Get actual command
      // eg; npm
      if (args[i + 1] && !args[i + 1].startsWith("--")) {
        cmd.command = args[i + 1];
        i++;
      }

      // Get switches for that command
      // eg; run start:server
      // Which makes the entire command: npm run start:server
      while (args[i + 1] && !args[i + 1].startsWith("--")) {
        cmd.args.push(args[i + 1]);
        i++;
      }

      options[key] = cmd;
    }
  }

  return options as Options;
}
