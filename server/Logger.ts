type LogLevels = "info" | "warn" | "error";

interface LogOptions {
  level: LogLevels;
  message: string;
  from?: string;
  // eslint-disable-next-line
  data?: any;
}

interface LogTo {
  info: "log";
  warn: "warn";
  error: "error";
}

export default class Logger {
  public from: string | undefined;

  constructor(from?: string) {
    this.from = from;
  }

  public log(options: LogOptions): void {
    const logTo: LogTo = {
      info: "log",
      warn: "warn",
      error: "error",
    };

    const logToSelection = logTo[options.level];
    const from = options.from !== undefined ? options.from : this.from !== undefined ? this.from : null;
    const obj = { from, [options.level]: options.message };
    if (options.data) {
      obj.data = options.data;
    }
    return console[logToSelection](obj);
  }
}
