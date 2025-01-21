import { spawn, ChildProcess, SpawnOptions } from "node:child_process";
import { PassThrough } from "node:stream";
import EventEmitter from "node:events";

export default class SpawnedProcess extends EventEmitter {
  private process: ChildProcess | null = null;

  // Expose readable streams for stdout and stderr that can be set up in advance
  public stdout: PassThrough = new PassThrough();
  public stdin: PassThrough = new PassThrough();
  public stderr: PassThrough = new PassThrough();
  public stdio: ChildProcess["stdio"] | null = null;

  pid?: number | undefined;

  constructor(
    private readonly command: string,
    private readonly args: string[] = [],
    private readonly options: SpawnOptions = {},
  ) {
    super();
  }

  on(event: "close" | "exit" | "error" | "spawn" | "message" | "disconnect", listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  start(): void {
    if (this.process) {
      return;
    }

    // Spawn the actual process
    this.process = spawn(this.command, this.args, this.options);

    this.pid = this.process.pid;

    // Pipe process stdout and stderr into the wrapper's exposed streams
    if (this.process.stdout) {
      this.process.stdout.pipe(this.stdout);
    }
    if (this.process.stderr) {
      this.process.stderr.pipe(this.stderr);
    }
    if (this.process.stdio) {
      this.stdio = this.process.stdio;
    }

    // Forward events from the child process to the wrapper
    this.process.on("close", (code, signal) => this.emit("close", code, signal));
    this.process.on("exit", (code, signal) => this.emit("exit", code, signal));
    this.process.on("error", (error) => this.emit("error", error));
    this.process.on("disconnect", () => this.emit("disconnect"));
    this.process.on("spawn", () => this.emit("spawn"));
  }

  kill(signal: NodeJS.Signals = "SIGTERM"): void {
    if (!this.process) {
      return;
    }
    this.process.kill(signal);
  }
}
