type LogLevels = "info" | "warn" | "error";

export interface LogMetaData {
  // eslint-disable-next-line
  [K: string]: any;
}

interface LogOptions {
  level: LogLevels;
  message: string;
  from?: string;
  data?: LogMetaData;
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

    return console[logToSelection]({ from, [options.level]: options.message });
  }
}
