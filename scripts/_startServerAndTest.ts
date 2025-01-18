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
import { ChildProcess, spawn } from "node:child_process";

const EXPECTED_SWITCHES = ["startServer", "url", "startTest"];
const URL_ALIVE_CHECK_INTERVAL = 500; // in ms
const URL_MAX_ALIVE_CHECKS = 20;

const args = process.argv.slice(2);
const options = processArgs(args);
if (!validateArgs(options, EXPECTED_SWITCHES)) {
  process.exit(1);
}

// "Main"
(async () => {
  const server = spawn(options.startServer.command, options.startServer.switches, { stdio: "inherit" });

  server.stdout?.on("data", (data) => {
    console.log(data.toString());
  });

  server.stderr?.on("data", (data) => {
    console.error(data);
  });

  server.on("close", (code) => {
    console.log(`startServer closed with code ${code}`);
    process.exit(code);
  });

  server.on("error", (err) => {
    console.error(`startServer encountered an error`, err);
    process.exit(1);
  });

  try {
    await waitForServer(options.url.command, server, URL_ALIVE_CHECK_INTERVAL, URL_MAX_ALIVE_CHECKS);
  } catch (e) {
    console.error(e);
    server.kill("SIGTERM");
    process.exit(1);
  }

  const test = spawn(options.startTest.command, options.startTest.switches, { stdio: "inherit" });

  test.stdout?.on("data", (data) => {
    console.log(data.toString());
  });

  test.stderr?.on("data", (data) => {
    console.error(data);
  });

  test.on("close", (code) => {
    console.log(`startTest closed with code ${code}`);
    server.kill("SIGTERM");
    process.exit(code);
  });

  test.on("error", (err) => {
    console.error(`startTest encountered an error`, err);
    server.kill("SIGTERM");
    test.kill("SIGTERM");
    process.exit(1);
  });
})();

/**
 *
 * TYPES
 *
 */

interface Command {
  command: string;
  switches: string[];
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

async function waitForServer(url: string, serverProcess: ChildProcess, checkIntervalMs: number, maxChecks: number): Promise<boolean> {
  let aliveChecks = 0;
  let isAlive = await isUrlAlive(url);

  while (!isAlive && aliveChecks <= maxChecks && serverProcess.connected) {
    await sleep(checkIntervalMs);
    isAlive = await isUrlAlive(url);
    aliveChecks++;
  }

  if (aliveChecks > maxChecks) {
    return Promise.reject(new Error(`maxChecks reached`));
  }
  return Promise.resolve(true);
}

function validateArgs(options: Options, expectedSwitches: string[]): boolean {
  const keys = Object.keys(options);
  if (keys.length !== expectedSwitches.length) {
    console.error(`Expected ${expectedSwitches.length} arguments, got ${keys.length} | ${keys}`);
    return false;
  }
  for (let i = 0; i < expectedSwitches.length; i++) {
    if (!options[expectedSwitches[i]]) {
      console.error(`Expected switch '${expectedSwitches[i]}' but it was not found!`);
      return false;
    }
  }
  return true;
}

function processArgs(args: string[]): Options {
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2); // remove "--" from switch
      let cmd: Command = {
        command: "",
        switches: [],
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
        cmd.switches.push(args[i + 1]);
        i++;
      }

      options[key] = cmd;
    }
  }

  return options as Options;
}
