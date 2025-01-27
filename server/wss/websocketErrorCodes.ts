export interface WebSocketErrorCodeToReason {
  code: number;
  reason: string;
  definition: string;
}

// https://github.com/Luka967/websocket-close-codes?tab=readme-ov-file#websocket-close-codes
export default function errorCodeToReason(code: number): WebSocketErrorCodeToReason {
  for (const [reason, err] of Object.entries(WEBSOCKET_ERROR_CODE)) {
    if (err.code === code) {
      return { code: err.code, reason, definition: err.definition };
    }
  }
  return { code, reason: "", definition: "" };
}

export const WEBSOCKET_ERROR_CODE = {
  NormalClosure: {
    code: 1000,
    definition: "Successful operation, connection not required anymore",
  },
  GoingAway: {
    code: 1001,
    definition: "Browser tab closing, graceful server shutdown",
  },
  UnsupportedData: {
    code: 1003,
    definition: "Endpoint received unsupported frame (e.g. binary-only got text frame, ping/pong frames not handled properly",
  },
  NoStatusRcvd: {
    code: 1005,
    definition: "Got no close status but transport layer finished normally (e.g. TCP FIN but no previous CLOSE frame",
  },
  AbnormalClosure: {
    code: 1006,
    definition: "Transport layer broke (e.g. couldn't connect, TCP RST)",
  },
  InvalidFramePayloadData: {
    code: 1007,
    definition: "Data in endpoint's frame is not consistent (e.g. malformed UTF-8",
  },
  PolicyViolation: {
    code: 1008,
    definition: "Generic code not applicable to any other (e.g. isn't 1003 nor 1009",
  },
  MessageTooBig: {
    code: 1009,
    definition: "Endpoint won't process large message",
  },
  InternalError: {
    code: 1011,
    definition: "Unexpected server problem while operating",
  },
  ServiceRestart: {
    code: 1012,
    definition: "Server/service is restarting",
  },
  Unauthorized: {
    code: 3000,
    definition: "Endpoint must be authorized to perform application-based request. Equivalent to HTTP 401",
  },
  Forbidden: {
    code: 3003,
    definition: "Endpoint is authorized but has no permissions to perform application-based request. Equivalent to HTTP 403",
  },
};
